import React, { useState, useEffect } from 'react';
import { Folder, RefreshCw, Undo, Sparkles, AlertCircle, CheckCircle, Zap } from 'lucide-react';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [logs, setLogs] = useState([]);
  const [appState, setAppState] = useState('idle');
  const [selectedFolder, setSelectedFolder] = useState('Loading...');
  const [stats, setStats] = useState({ images: 0, docs: 0, media: 0, archives: 0, code: 0, installers: 0 });
  const [realFiles, setRealFiles] = useState([]);

  // --- SPLASH SCREEN LOGIC ---
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  // --- AUTO-DETECT DIRECTORY ON APP LOAD ---
  useEffect(() => {
    const initializePath = async () => {
      const savedPath = localStorage.getItem('userTargetFolder');
      if (savedPath) {
        setSelectedFolder(savedPath);
      } else {
        // Fallback safely for local dev if window.electronAPI is missing visually
        const defaultDesktop = window.electronAPI 
          ? await window.electronAPI.getDefaultPath() 
          : 'C:\\Users\\Default\\Desktop';
        setSelectedFolder(defaultDesktop);
      }
    };
    initializePath();
  }, []);

  // --- HANDLERS ---
  const handleFolderChange = (e) => {
    const newPath = e.target.value;
    setSelectedFolder(newPath);
    localStorage.setItem('userTargetFolder', newPath);
  };

  const handleReScan = () => {
    setAppState('idle');
    setLogs([]);
    setStats({ images: 0, docs: 0, media: 0, archives: 0, code: 0, installers: 0 });
    setRealFiles([]);
    addLog('System', 'App reset. Ready for a new scan.');
  };

  const handleScan = async () => {
    if (appState !== 'idle') return;
    setAppState('scanning');
    setLogs([]);
    setStats({ images: 0, docs: 0, media: 0, archives: 0, code: 0, installers: 0 });

    addLog('System', `Starting file scan in ${selectedFolder}...`);
    
    if (!window.electronAPI) {
      addLog('System', 'Warning: Running outside of Electron environment. Simulation only.');
      await sleep(1000);
      setAppState('scanned');
      return;
    }

    const response = await window.electronAPI.scanDirectory(selectedFolder);

    if (response.success) {
      setRealFiles(response.files);
      let currentStats = { images: 0, docs: 0, media: 0, archives: 0, code: 0, installers: 0 };

      for (const file of response.files) {
        await sleep(50); 
        currentStats[file.type] += 1;
        setStats({ ...currentStats });
        addLog('Info', `Found: ${file.name}`);
      }

      addLog('Success', `Scan complete! Found ${response.files.length} files ready to be sorted.`);
      setAppState('scanned');
    } else {
      addLog('System', `Error: ${response.error}`);
      setAppState('idle');
    }
  };

  const handleSort = async () => {
    if (appState !== 'scanned') return;
    setAppState('sorting');

    addLog('System', 'Beginning sorting process...');

    if (!window.electronAPI) {
      await sleep(1500);
      setAppState('sorted');
      return;
    }

    const response = await window.electronAPI.sortDirectory(selectedFolder, realFiles);

    if (response.success) {
      for (const file of realFiles) {
        await sleep(50); 
        let targetFolder;
        if (file.type === 'images') targetFolder = 'Images';
        else if (file.type === 'docs') targetFolder = 'Documents';
        else if (file.type === 'media') targetFolder = 'Media';
        else if (file.type === 'code') targetFolder = 'Code';
        else if (file.type === 'installers') targetFolder = 'Installers';
        else targetFolder = 'Archives'; 
        
        addLog('Success', `Moved ${file.name} ➔ ${targetFolder}/`);
      }
      addLog('System', 'Sorting complete! Directory is clean.');
      setAppState('sorted');
    } else {
      addLog('System', `Error: ${response.error}`);
    }
  };

  const handleUndo = async () => {
    if (appState !== 'sorted') return;
    
    addLog('System', '⏪ Attempting to revert last sort...');
    
    if (!window.electronAPI) {
      await sleep(1000);
      setAppState('scanned');
      return;
    }

    const response = await window.electronAPI.undoSort();
    
    if (response.success) {
      addLog('Success', `Reverted ${response.count} files back to the main directory!`);
      setAppState('scanned'); 
    } else {
      addLog('System', `Error: ${response.error}`);
    }
  };

  const addLog = (type, message) => {
    setLogs(prev => [...prev, { id: Date.now() + Math.random(), type, message, time: new Date().toLocaleTimeString() }]);
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));


  // --- SPLASH SCREEN UI ---
  if (showSplash) {
    return (
      <div className="min-h-screen bg-[#07070a] flex flex-col items-center justify-center relative overflow-hidden text-white font-sans selection:bg-indigo-500/30">
        {/* Ambient Blur Bubbles */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        <div className="z-10 flex flex-col items-center animate-in fade-in zoom-in duration-1000">
          <div className="relative mb-8 group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-[2rem] blur-md opacity-70 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
            <div className="relative bg-[#0d0d15] rounded-[2rem] p-6 ring-1 ring-white/10 shadow-2xl flex items-center justify-center">
              <Folder size={64} strokeWidth={1.5} className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
              <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/5 rounded-[2rem]"></div>
            </div>
          </div>
          
          <h1 className="text-5xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 drop-shadow-sm tracking-tight mb-4 text-center">
            File Sorter
          </h1>
          <p className="text-gray-400 text-lg font-medium tracking-wide flex items-center gap-2">
            Automate your desktop chaos <Sparkles size={18} className="text-yellow-400/80 animate-pulse" />
          </p>
          
          <div className="mt-14 flex gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)] animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)] animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.8)] animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN APP UI ENHANCED ---
  return (
    <div className="min-h-screen bg-[#0a0a0f] relative text-gray-100 p-6 font-sans selection:bg-indigo-500/30 flex flex-col items-center overflow-x-hidden">
      {/* Dynamic Background Effects */}
      <div className="absolute top-0 right-0 w-[50vw] h-[50vh] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[50vw] h-[50vh] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="w-full max-w-4xl relative z-10">
        
        {/* HEADER */}
        <header className="flex items-center justify-between mb-8 bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] shadow-2xl border border-white/10 relative overflow-hidden group hover:border-white/20 transition-all duration-500">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="flex items-center gap-5 relative z-10">
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-50"></div>
              <div className="relative bg-gradient-to-br from-indigo-500 to-purple-600 p-3.5 rounded-2xl shadow-xl ring-1 ring-white/20">
                <Folder size={32} strokeWidth={2} className="text-white relative z-10 drop-shadow-md" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight">File Sorter</h1>
              <p className="text-indigo-300/80 text-sm mt-1 font-medium flex items-center gap-1.5">
                Automated Desktop Organization <Sparkles size={14} className="text-indigo-400" />
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT/CENTER PANELS */}
          <div className="col-span-1 lg:col-span-2 space-y-6 flex flex-col">
            
            {/* TARGET DIRECTORY CARD */}
            <div className="bg-white/5 backdrop-blur-lg p-7 rounded-[2rem] shadow-xl border border-white/5 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <h2 className="text-lg font-bold text-gray-200 mb-4 flex items-center gap-2">
                <Folder size={20} className="text-indigo-400" /> Target Directory
              </h2>
              
              <div className="flex gap-3 mb-6 relative z-10">
                <input 
                  type="text" 
                  value={selectedFolder}
                  onChange={handleFolderChange}
                  className="flex-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-4 text-gray-300 placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner font-mono text-sm"
                />
                <button 
                  onClick={handleReScan}
                  className="bg-white/10 hover:bg-white/20 text-white px-6 py-4 rounded-2xl font-medium transition-all shadow-md flex items-center gap-2 border border-white/5 hover:border-white/20"
                >
                  <RefreshCw size={20} className={appState === 'scanning' ? 'animate-spin text-indigo-400' : 'text-indigo-400'} /> 
                  <span className="hidden sm:inline">Re-Scan</span>
                </button>
              </div>

              <div className="flex flex-col gap-4 relative z-10 cursor-pointer">
                {/* 1. SCAN BUTTON */}
                <button 
                  onClick={handleScan}
                  disabled={appState !== 'idle'}
                  className={`relative w-full py-4 rounded-2xl font-extrabold text-lg flex items-center justify-center gap-3 transition-all duration-300 overflow-hidden group ${
                    appState === 'idle' 
                    ? 'text-white' 
                    : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5 shadow-inner'
                  }`}
                >
                  {appState === 'idle' && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-600 group-hover:from-indigo-500 group-hover:to-blue-500 transition-all shadow-xl shadow-indigo-500/20"></div>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl origin-bottom group-hover:scale-150 transition-transform duration-700"></div>
                    </>
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {appState === 'scanning' ? (
                      <><RefreshCw size={22} className="animate-spin text-indigo-400" /> Scanning Directory...</>
                    ) : (
                      <><CheckCircle size={22} className={appState === 'idle' ? 'text-blue-200' : 'text-gray-600'} /> Step 1: Scan Directory</>
                    )}
                  </span>
                </button>

                {/* 2. SORT BUTTON */}
                <button 
                  onClick={handleSort}
                  disabled={appState !== 'scanned'}
                  className={`relative w-full py-4 rounded-2xl font-extrabold text-lg flex items-center justify-center gap-3 transition-all duration-300 overflow-hidden group ${
                    appState === 'sorting' 
                      ? 'bg-emerald-900/30 text-emerald-400 cursor-not-allowed border border-emerald-500/20 shadow-inner' 
                      : appState === 'scanned' 
                      ? 'text-white' 
                      : 'bg-white/5 text-gray-600 border border-white/5 cursor-not-allowed shadow-inner'
                  }`}
                >
                  {appState === 'scanned' && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 group-hover:from-emerald-500 group-hover:to-teal-500 transition-all shadow-xl shadow-emerald-500/20"></div>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl origin-bottom group-hover:scale-150 transition-transform duration-700"></div>
                    </>
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {appState === 'sorting' ? (
                      <><RefreshCw size={22} className="animate-spin" /> Sorting in progress...</>
                    ) : appState === 'sorted' ? (
                      <><CheckCircle size={22} className="text-emerald-500" /> Files Sorted Successfully</>
                    ) : (
                      <><Zap size={22} className={appState === 'scanned' ? 'text-teal-200' : 'text-gray-600'} /> Step 2: Sort Files Now</>
                    )}
                  </span>
                </button>

                {/* 3. REVERT BUTTON */}
                {appState === 'sorted' && (
                  <button 
                    onClick={handleUndo}
                    className="relative w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 overflow-hidden group text-white mt-1"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 to-orange-600 group-hover:from-yellow-500 group-hover:to-orange-500 transition-all shadow-xl shadow-yellow-500/20"></div>
                    <span className="relative z-10 flex items-center gap-2">
                      <Undo size={22} /> Undo Last Sort
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* ACTIVITY LOG CARD */}
            <div className="bg-[#0b0b12]/80 backdrop-blur-xl p-7 rounded-[2rem] shadow-inner border border-white/5 h-[340px] flex flex-col flex-1 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500/0 via-indigo-500/50 to-indigo-500/0"></div>
              
              <div className="flex items-center justify-between mb-5 relative z-10">
                <h2 className="text-xs font-black tracking-widest text-indigo-400 uppercase flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span> Activity Log
                </h2>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 font-mono text-[13px] relative z-10 pr-2 custom-scrollbar">
                {logs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-600 italic">No activity yet. Scan a directory to begin.</div>
                ) : (
                  logs.map(log => (
                    <div key={log.id} className="flex gap-3 items-start animate-in slide-in-from-left-2 duration-300">
                      <span className="text-indigo-400/60 shrink-0 select-none">[{log.time}]</span>
                      <span className={
                        log.type === 'System' ? 'text-blue-300 font-medium' : 
                        log.type === 'Success' ? 'text-emerald-400 font-medium' :
                        log.type === 'Error' ? 'text-red-400 font-medium' :
                        'text-gray-300'
                      }>{log.message}</span>
                    </div>
                  ))
                )}
              </div>
              
              <style dangerouslySetInnerHTML={{__html: `
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.2); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(99,102,241,0.4); }
              `}} />
            </div>
          </div>

          {/* RIGHT PANEL - STATS */}
          <div className="col-span-1 space-y-6">
            <div className="bg-white/5 backdrop-blur-lg p-7 rounded-[2rem] shadow-xl border border-white/5 relative overflow-hidden group h-full flex flex-col">
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <h2 className="text-lg font-bold text-gray-200 mb-6 flex items-center gap-2 relative z-10">
                <AlertCircle size={20} className="text-purple-400" /> Session Stats
              </h2>
              
              <div className="space-y-5 relative z-10 flex-1">
                <div className="flex items-center justify-between group/stat">
                  <span className="text-pink-400/80 font-medium flex items-center gap-2 group-hover/stat:text-pink-400 transition-colors"><div className="w-1.5 h-1.5 rounded-full bg-pink-500"></div> Images</span> 
                  <span className="font-bold text-gray-200 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 group-hover/stat:border-pink-500/30 transition-colors">{stats.images}</span>
                </div>
                <div className="flex items-center justify-between group/stat">
                  <span className="text-blue-400/80 font-medium flex items-center gap-2 group-hover/stat:text-blue-400 transition-colors"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Documents</span> 
                  <span className="font-bold text-gray-200 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 group-hover/stat:border-blue-500/30 transition-colors">{stats.docs}</span>
                </div>
                <div className="flex items-center justify-between group/stat">
                  <span className="text-purple-400/80 font-medium flex items-center gap-2 group-hover/stat:text-purple-400 transition-colors"><div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div> Media</span> 
                  <span className="font-bold text-gray-200 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 group-hover/stat:border-purple-500/30 transition-colors">{stats.media}</span>
                </div>
                <div className="flex items-center justify-between group/stat">
                  <span className="text-yellow-400/80 font-medium flex items-center gap-2 group-hover/stat:text-yellow-400 transition-colors"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div> Archives</span> 
                  <span className="font-bold text-gray-200 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 group-hover/stat:border-yellow-500/30 transition-colors">{stats.archives}</span>
                </div>
                <div className="flex items-center justify-between group/stat">
                  <span className="text-emerald-400/80 font-medium flex items-center gap-2 group-hover/stat:text-emerald-400 transition-colors"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Code</span> 
                  <span className="font-bold text-gray-200 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 group-hover/stat:border-emerald-500/30 transition-colors">{stats.code}</span>
                </div>
                <div className="flex items-center justify-between group/stat">
                  <span className="text-orange-400/80 font-medium flex items-center gap-2 group-hover/stat:text-orange-400 transition-colors"><div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div> Installers</span> 
                  <span className="font-bold text-gray-200 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 group-hover/stat:border-orange-500/30 transition-colors">{stats.installers}</span>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-white/10 relative z-10 flex items-end justify-between">
                <p className="text-sm font-semibold text-gray-500 tracking-wider">TOTAL FOUND</p>
                <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-500 drop-shadow-sm">
                  {realFiles.length}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}