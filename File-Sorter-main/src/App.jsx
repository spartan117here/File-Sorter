import React, { useState, useEffect } from 'react';
import { Folder, Play, FileText, Image as ImageIcon, Video, Archive, CheckCircle, AlertCircle, Settings, Search, RefreshCw, Undo } from 'lucide-react';

export default function App() {
  const [logs, setLogs] = useState([]);
  const [appState, setAppState] = useState('idle');
  const [selectedFolder, setSelectedFolder] = useState('Loading...');
  const [stats, setStats] = useState({ images: 0, docs: 0, media: 0, archives: 0, code: 0, installers: 0 });
  const [realFiles, setRealFiles] = useState([]);

  // --- AUTO-DETECT DIRECTORY ON APP LOAD ---
  useEffect(() => {
    const initializePath = async () => {
      const savedPath = localStorage.getItem('userTargetFolder');
      if (savedPath) {
        setSelectedFolder(savedPath);
      } else {
        const defaultDesktop = await window.electronAPI.getDefaultPath();
        setSelectedFolder(defaultDesktop);
      }
    };
    initializePath();
  }, []);

  // --- SAVE CUSTOM DIRECTORY ---
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

  // --- NEW UNDO FUNCTION PROPERLY PLACED ---
  const handleUndo = async () => {
    if (appState !== 'sorted') return;
    
    addLog('System', '⏪ Attempting to revert last sort...');
    
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

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6 font-sans selection:bg-blue-500 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <header className="flex items-center justify-between mb-8 bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700">
          <div className="flex items-center gap-4">
            <div className="bg-blue-500 p-3 rounded-xl shadow-lg">
              <Folder size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">File Sorter</h1>
              <p className="text-gray-400 text-sm mt-1">Automated Desktop Organization</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-1 lg:col-span-2 space-y-6">
            <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700">
              <h2 className="text-lg font-semibold text-white mb-4">Target Directory</h2>
              
              <div className="flex gap-3 mb-6">
                <input 
                  type="text" 
                  value={selectedFolder}
                  onChange={handleFolderChange}
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-gray-300 focus:outline-none focus:border-blue-500"
                />
                <button 
                  onClick={handleReScan}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-sm flex items-center gap-2"
                >
                  <RefreshCw size={20} /> Re-Scan
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <button 
                  onClick={handleScan}
                  disabled={appState !== 'idle'}
                  className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
                    appState === 'idle' ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg' : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                  }`}
                >
                  {appState === 'scanning' ? 'Scanning Directory...' : 'Step 1: Scan Directory'}
                </button>

                <button 
                  onClick={handleSort}
                  disabled={appState !== 'scanned'}
                  className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
                    appState === 'sorting' ? 'bg-green-600/50 text-green-200 cursor-not-allowed' : appState === 'scanned' ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg' : 'bg-gray-900 text-gray-600 border border-gray-700 cursor-not-allowed'
                  }`}
                >
                  {appState === 'sorting' ? 'Sorting in progress...' : appState === 'sorted' ? 'Files Sorted Successfully' : 'Step 2: Sort Files Now'}
                </button>

                {/* --- NEW REVERT BUTTON --- */}
                {appState === 'sorted' && (
                  <button 
                    onClick={handleUndo}
                    className="w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all bg-yellow-600 hover:bg-yellow-500 text-white shadow-lg mt-2"
                  >
                    <Undo size={24} /> Undo
                  </button>
                )}
              </div>
            </div>

            <div className="bg-gray-950 p-6 rounded-2xl shadow-inner border border-gray-800 h-[320px] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-gray-400 uppercase">Activity Log</h2>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 font-mono text-sm">
                {logs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-600">Ready to scan.</div>
                ) : (
                  logs.map(log => (
                    <div key={log.id} className="flex gap-3">
                      <span className="text-gray-600 shrink-0">[{log.time}]</span>
                      <span className={log.type === 'System' ? 'text-blue-300' : 'text-gray-300'}>{log.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="col-span-1 space-y-6">
            <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700">
              <h2 className="text-lg font-semibold text-white mb-6">Session Stats</h2>
              <div className="space-y-4">
                <div className="flex justify-between text-pink-400"><span>Images</span> <span className="font-bold">{stats.images}</span></div>
                <div className="flex justify-between text-blue-400"><span>Documents</span> <span className="font-bold">{stats.docs}</span></div>
                <div className="flex justify-between text-purple-400"><span>Media</span> <span className="font-bold">{stats.media}</span></div>
                <div className="flex justify-between text-yellow-400"><span>Archives</span> <span className="font-bold">{stats.archives}</span></div>
                <div className="flex justify-between text-green-400"><span>Code</span> <span className="font-bold">{stats.code}</span></div>
                <div className="flex justify-between text-orange-400"><span>Installers</span> <span className="font-bold">{stats.installers}</span></div>
              </div>
              <div className="mt-8 pt-6 border-t border-gray-700">
                <p className="text-sm text-gray-400">Total Found</p>
                <p className="text-3xl font-bold text-white mt-1">{realFiles.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}