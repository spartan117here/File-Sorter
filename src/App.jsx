import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Folder, RefreshCw, Undo, Sparkles, AlertCircle, CheckCircle, Zap, PieChart as PieChartIcon, Sun, Moon, Info, ChevronDown, Image, FileText, Film, Archive, Terminal, Package } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';

const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius * 1.02}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: 'brightness(1.06)', transition: 'all 0.2s ease-in-out', outline: 'none' }}
      />
    </g>
  );
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [logs, setLogs] = useState([]);
  const [appState, setAppState] = useState('idle');
  const [selectedFolder, setSelectedFolder] = useState('Loading...');
  const [stats, setStats] = useState({ 
    images: 0, docs: 0, media: 0, archives: 0, code: 0, installers: 0,
    imagesSize: 0, docsSize: 0, mediaSize: 0, archivesSize: 0, codeSize: 0, installersSize: 0
  });
  const [realFiles, setRealFiles] = useState([]);
  const [hoveredStat, setHoveredStat] = useState(null);
  const [expandedCats, setExpandedCats] = useState({});
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [smartMode, setSmartMode] = useState(localStorage.getItem('smartMode') === 'true');
  const [directories, setDirectories] = useState([]);
  const [showDirDropdown, setShowDirDropdown] = useState(false);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('smartMode', smartMode);
  }, [smartMode]);

  // --- SPLASH SCREEN LOGIC ---
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  // --- AUTO-DETECT DIRECTORY ON APP LOAD ---
  useEffect(() => {
    const initializePath = async () => {
      const savedPath = localStorage.getItem('userTargetFolder');
      if (savedPath) {
        setSelectedFolder(savedPath);
      } else {
        const defaultDesktop = window.electronAPI 
          ? await window.electronAPI.getDefaultPath() 
          : 'C:\\Users\\Default\\Desktop';
        setSelectedFolder(defaultDesktop);
      }

      if (window.electronAPI && window.electronAPI.getDirectories) {
        const dirs = await window.electronAPI.getDirectories();
        setDirectories(dirs);
      }
    };
    initializePath();
  }, []);

  // --- HANDLERS ---
  const handleFolderChange = (e) => {
    const newPath = e.target.value;
    setSelectedFolder(newPath);
    localStorage.setItem('userTargetFolder', newPath);
    if (appState !== 'idle') setAppState('idle');
  };

  // --- SMART MODE AUTO-SCANNER ---
  useEffect(() => {
    if (smartMode && selectedFolder !== 'Loading...' && appState === 'idle') {
      const timer = setTimeout(() => {
        // Automatically scan directory if Smart Mode is ON and path changes
        document.getElementById('hidden-scan-trigger')?.click();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [selectedFolder, smartMode, appState]);

  // --- QUICK INSIGHTS (BACKGROUND SCAN) ---
  const [insights, setInsights] = useState([]);
  const [insightsLoading, setInsightsLoading] = useState(false);

  useEffect(() => {
    const fetchInsights = async () => {
      if (selectedFolder === 'Loading...' || !window.electronAPI || appState === 'scanning' || appState === 'sorting') return;
      setInsightsLoading(true);
      try {
        const res = await window.electronAPI.scanDirectory(selectedFolder);
        if (res.success && res.files) {
          const files = res.files;
          let newInsights = [];
          const folderName = selectedFolder.split(/[\\/]/).pop() || 'Desktop';

          const largeFiles = files.filter(f => f.size > 100 * 1024 * 1024);
          if (largeFiles.length > 0) {
            newInsights.push({ id: 'large', icon: <AlertCircle size={14} />, text: largeFiles.length === 1 ? `Large file detected (>100MB)` : `${largeFiles.length} large files >100MB detected` });
          }

          if (files.length > 5) {
            newInsights.push({ id: 'clutter', icon: <Folder size={14} />, text: `${folderName} is cluttered (${files.length} files)` });
          }

          const imagesCat = files.filter(f => f.type === 'images');
          if (imagesCat.length > 0) {
            newInsights.push({ id: 'images', icon: <Image size={14} />, text: imagesCat.length === 1 ? `1 image file is on ${folderName} (consider organizing)` : `${imagesCat.length} images are scattered` });
          }

          const docsCat = files.filter(f => f.type === 'docs');
          if (docsCat.length > 0) {
            newInsights.push({ id: 'docs', icon: <FileText size={14} />, text: docsCat.length === 1 ? `1 document found outside folders` : `${docsCat.length} documents are unorganized` });
          }

          const mediaCat = files.filter(f => f.type === 'media');
          if (mediaCat.length > 0) {
            newInsights.push({ id: 'media', icon: <Film size={14} />, text: mediaCat.length === 1 ? `1 media file is unorganized` : `${mediaCat.length} media files are scattered` });
          }

          if (newInsights.length === 0 && files.length > 0) {
            newInsights.push({ id: 'loose', icon: <Folder size={14} />, text: `${files.length} loose file${files.length > 1 ? 's' : ''} found` });
          }

          setInsights(newInsights.slice(0, 3));
        }
      } catch (err) {
        console.error(err);
      }
      setInsightsLoading(false);
    };
    
    const timer = setTimeout(fetchInsights, 500); 
    return () => clearTimeout(timer);
  }, [selectedFolder, appState]);

  const handleReScan = () => {
    setAppState('idle');
    setLogs([]);
    setStats({ 
      images: 0, docs: 0, media: 0, archives: 0, code: 0, installers: 0,
      imagesSize: 0, docsSize: 0, mediaSize: 0, archivesSize: 0, codeSize: 0, installersSize: 0
    });
    setRealFiles([]);
    addLog('System', 'App reset. Ready for a new scan.');
  };

  const handleScan = async () => {
    if (appState !== 'idle') return;
    setAppState('scanning');
    setLogs([]);
    setStats({ 
      images: 0, docs: 0, media: 0, archives: 0, code: 0, installers: 0,
      imagesSize: 0, docsSize: 0, mediaSize: 0, archivesSize: 0, codeSize: 0, installersSize: 0
    });

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
      let currentStats = { 
        images: 0, docs: 0, media: 0, archives: 0, code: 0, installers: 0,
        imagesSize: 0, docsSize: 0, mediaSize: 0, archivesSize: 0, codeSize: 0, installersSize: 0
      };
      
      // Batch updates every 50 files or 500ms to prevent UI freezing
      const BATCH_SIZE = 50;
      let batchCount = 0;

      for (const file of response.files) {
        currentStats[file.type] += 1;
        currentStats[`${file.type}Size`] += file.size || 0;
        
        batchCount++;
        if (batchCount >= BATCH_SIZE) {
          setStats({ ...currentStats });
          addLog('Info', `Scanning... processed ${currentStats.images + currentStats.docs + currentStats.media + currentStats.archives + currentStats.code + currentStats.installers} files.`);
          batchCount = 0;
          await sleep(10); // Yield to main thread
        }
      }

      // Final update
      setStats({ ...currentStats });
      addLog('Success', `Scan complete! Found ${response.files.length} files ready to be sorted.`);
      setAppState('scanned');
    } else {
      addLog('System', `Error: ${response.error}`);
      setAppState('idle');
    }
  };

  // --- SMART MODE LISTENER ---
  useEffect(() => {
    if (appState === 'scanned' && smartMode) {
      const timer = setTimeout(() => {
        document.getElementById('hidden-sort-trigger')?.click();
      }, 600);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState, smartMode]);

  const handleSort = async () => {
    if (appState !== 'scanned' || appState === 'sorting') return;
    setAppState('sorting');
    
    if (smartMode) {
      addLog('System', 'Smart Mode: Organizing files...');
    } else {
      addLog('System', 'Beginning sorting process...');
    }

    if (!window.electronAPI) { await sleep(1000); setAppState('sorted'); return; }
    const response = await window.electronAPI.sortDirectory(selectedFolder, realFiles);
    
    if (response.success) {
      if (smartMode) {
        addLog('Success', `Smart Mode: Completed. Organized ${realFiles.length} files.`);
      } else {
        addLog('Success', `Sorted ${realFiles.length} files in ${response.duration || '?'}ms!`);
      }
      setAppState('sorted');
    } else {
      addLog('System', `Error: ${response.error}`);
      setAppState('scanned');
    }
  };

  const handleUndo = async () => {
    if (appState !== 'sorted') return;
    addLog('System', '⏪ Attempting to revert last sort...');
    if (!window.electronAPI) { await sleep(1000); setAppState('scanned'); return; }
    const response = await window.electronAPI.undoSort();
    if (response.success) {
      addLog('Success', `Reverted ${response.count} files back to the main directory!`);
      setAppState('scanned'); 
    } else {
      addLog('System', `Error: ${response.error}`);
    }
  };

  const addLog = (type, message) => {
    setLogs(prev => [
      { id: Date.now() + Math.random(), type, message, time: new Date().toLocaleTimeString() },
      ...prev.slice(0, 99) // Keep only the last 100 logs
    ]);
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // --- DERIVED STATS FOR ANALYTICS ---
  const totalFiles = realFiles.length;
  const totalSize = Object.keys(stats)
    .filter(key => key.endsWith('Size'))
    .reduce((acc, key) => acc + stats[key], 0);

  const statsArray = useMemo(() => [
    { name: 'Images', typeKey: 'images', icon: Image, value: stats.images, size: stats.imagesSize, color: theme === 'dark' ? '#ec4899' : '#f472b6', gradId: 'grad-images' },
    { name: 'Documents', typeKey: 'docs', icon: FileText, value: stats.docs, size: stats.docsSize, color: theme === 'dark' ? '#3b82f6' : '#60a5fa', gradId: 'grad-docs' },
    { name: 'Media', typeKey: 'media', icon: Film, value: stats.media, size: stats.mediaSize, color: theme === 'dark' ? '#a855f7' : '#c084fc', gradId: 'grad-media' },
    { name: 'Archives', typeKey: 'archives', icon: Archive, value: stats.archives, size: stats.archivesSize, color: theme === 'dark' ? '#eab308' : '#fbbf24', gradId: 'grad-archives' },
    { name: 'Code', typeKey: 'code', icon: Terminal, value: stats.code, size: stats.codeSize, color: theme === 'dark' ? '#10b981' : '#34d399', gradId: 'grad-code' },
    { name: 'Installers', typeKey: 'installers', icon: Package, value: stats.installers, size: stats.installersSize, color: theme === 'dark' ? '#f97316' : '#fb923c', gradId: 'grad-installers' },
  ], [stats, theme]);

  const activeStats = useMemo(() => statsArray.filter(s => s.size > 0), [statsArray]);
  
  const statsWithPercentage = useMemo(() => activeStats.map(s => ({
    ...s,
    percentage: totalSize > 0 ? (s.size / totalSize) * 100 : 0
  })), [activeStats, totalSize]);

  const chartData = useMemo(() => statsWithPercentage.map(s => ({
    name: s.name,
    value: s.size,
    count: s.value,
    color: s.color,
    percentage: s.percentage
  })), [statsWithPercentage]);

  const largestCategory = useMemo(() => activeStats.length > 0 
    ? activeStats.reduce((prev, curr) => (prev.size > curr.size) ? prev : curr)
    : { name: 'None', size: 0, color: '#6366f1' }, [activeStats]);

  // --- SPLASH SCREEN UI ---
  const displayTotalFiles = appState === 'sorted' ? 0 : totalFiles;
  const displayTotalSize = appState === 'sorted' ? 0 : totalSize;
  const displayLargest = appState === 'sorted' ? { name: 'None', size: 0, color: '#6366f1' } : largestCategory;

  if (showSplash) {
    return (
      <div className="min-h-screen bg-[#030305] flex flex-col items-center justify-center relative overflow-hidden font-sans text-white">
        <style>{`
          .svg-path-anim { stroke-dasharray: 2000; stroke-dashoffset: 2000; animation: drawPath 2.5s cubic-bezier(0.8,0,0.2,1) forwards; }
        `}</style>
        
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[800px] h-[800px] bg-indigo-900/20 rounded-full blur-[150px] animate-pulse"></div>
          <div className="absolute w-[600px] h-[600px] bg-pink-900/10 rounded-full blur-[100px]" style={{ animation: 'explodeLight 3s ease-out forwards' }}></div>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center">
          <div className="relative w-48 h-48 mb-12 transform hover:scale-105 transition-transform duration-500" style={{ transformStyle: 'preserve-3d' }}>
            <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible" style={{ animation: 'glowPulse 2s infinite' }}>
              <defs>
                <linearGradient id="neonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="50%" stopColor="#c084fc" />
                  <stop offset="100%" stopColor="#f472b6" />
                </linearGradient>
                <filter id="hyperGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <g fill="none" stroke="url(#neonGrad)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" filter="url(#hyperGlow)">
                {/* 3D Wireframe construct drawing */}
                <path className="svg-path-anim" d="M100 20 L180 60 L180 140 L100 180 L20 140 L20 60 Z" />
                <path className="svg-path-anim" style={{ animationDelay: '0.4s' }} d="M100 100 L180 60 M100 100 L100 180 M100 100 L20 60" />
                <path className="svg-path-anim" style={{ animationDelay: '0.8s' }} d="M100 40 L150 65 L100 90 L50 65 Z" />
                <circle cx="100" cy="100" r="8" fill="#fff" opacity="0.9" className="animate-ping" style={{ animationDuration: '2.5s', animationDelay: '1.2s' }} />
              </g>
            </svg>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/90 animate-bounce" style={{ animationDelay: '2s' }}>
              <Sparkles size={28} />
            </div>
          </div>
          <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 tracking-tighter drop-shadow-[0_0_20px_rgba(192,132,252,0.5)] animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-500 fill-mode-both">
            SORTIFY
          </h1>
          <div className="mt-8 flex items-center gap-2 opacity-0 animate-[fade-in_1s_ease-out_1.5s_forwards]">
            <span className="w-16 h-1 bg-gradient-to-r from-transparent to-indigo-500 rounded-full"></span>
            <span className="text-indigo-300 font-mono text-sm tracking-[0.4em] font-bold mx-2 uppercase animate-pulse">Initializing</span>
            <span className="w-16 h-1 bg-gradient-to-l from-transparent to-pink-500 rounded-full"></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen relative font-sans transition-all duration-300 selection:bg-indigo-500/30 flex flex-col items-center overflow-x-hidden ${
      theme === 'dark' ? 'bg-[#0a0a0f] text-gray-100' : 'bg-[#f1f5f9] text-slate-900'
    }`}>
      <div className={`absolute top-0 right-0 w-[50vw] h-[50vh] rounded-full blur-[150px] pointer-events-none transition-opacity duration-500 ${
        theme === 'dark' ? 'bg-indigo-600/10 opacity-100' : 'bg-indigo-400/5 opacity-30'
      }`}></div>
      <div className={`absolute bottom-0 left-0 w-[50vw] h-[50vh] rounded-full blur-[150px] pointer-events-none transition-opacity duration-500 ${
        theme === 'dark' ? 'bg-purple-600/10 opacity-100' : 'bg-purple-400/5 opacity-30'
      }`}></div>

      <div className="w-full max-w-4xl relative z-10 px-6 py-8">
        
        {/* HEADER */}
        <header className={`flex items-center justify-between mb-8 backdrop-blur-xl p-6 rounded-[2.5rem] border transition-all duration-300 relative overflow-hidden ${
          theme === 'dark' ? 'bg-white/5 border-white/10 shadow-2xl' : 'bg-white border-slate-300 shadow-xl shadow-slate-300/40'
        }`}>
          <div className="flex items-center gap-5 relative z-10">
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-50"></div>
              <div className="relative bg-gradient-to-br from-indigo-500 to-purple-600 p-3.5 rounded-2xl shadow-xl ring-1 ring-white/20">
                <Folder size={32} strokeWidth={2.5} className="text-white relative z-10 drop-shadow-md" />
              </div>
            </div>
            <div>
              <h1 className={`text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r transition-all duration-300 ${
                theme === 'dark' ? 'from-white to-gray-400' : 'from-slate-900 to-slate-700'
              }`}>Sortify</h1>
              <p className={`text-sm mt-1 font-black flex items-center gap-1.5 transition-colors duration-300 ${
                theme === 'dark' ? 'text-indigo-300/80' : 'text-slate-700'
              }`}>Automated Desktop Organization <Sparkles size={14} className={theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'} /></p>
            </div>
          </div>

          <button 
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            className={`relative z-10 p-3 rounded-full border transition-all duration-200 hover:scale-[1.05] active:scale-95 flex items-center justify-center group ${
              theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10 text-yellow-400' : 'bg-white border-slate-300 hover:bg-slate-100 text-indigo-700 shadow-md'
            }`}
          >
            {theme === 'dark' ? <Sun size={20} strokeWidth={3} /> : <Moon size={20} strokeWidth={3} />}
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-1 lg:col-span-2 space-y-6 flex flex-col">
            
            {/* TARGET DIRECTORY CARD */}
            <div className={`p-8 rounded-[2.5rem] shadow-xl border transition-all duration-300 group relative overflow-hidden flex flex-col ${
              theme === 'dark' ? 'bg-white/5 border-white/5 backdrop-blur-lg' : 'bg-white border-slate-300 border-l-[8px] border-l-indigo-600 shadow-slate-300/40'
            }`}>
              <div className="mb-6 flex justify-between items-start relative z-10">
                <h2 className={`text-xl font-black flex items-center gap-3 transition-colors duration-300 ${theme === 'dark' ? 'text-gray-200' : 'text-slate-900'}`}>
                  <Folder size={22} className={theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'} /> Target Directory
                </h2>
                <div className="flex items-center gap-4">
                  <span className={`text-[15px] font-black tracking-wider uppercase flex items-center gap-2 transition-all duration-300 ${smartMode ? (theme === 'dark' ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]' : 'text-amber-600 drop-shadow-sm') : (theme === 'dark' ? 'text-gray-500' : 'text-slate-500')}`}>
                    <Zap size={18} className={smartMode ? "fill-current animate-pulse" : ""} /> SMART MODE
                  </span>
                  <button 
                    onClick={() => setSmartMode(!smartMode)}
                    className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none shadow-inner flex-shrink-0 ${smartMode ? (theme === 'dark' ? 'bg-gradient-to-r from-yellow-500 to-amber-600' : 'bg-gradient-to-r from-amber-500 to-orange-600') : (theme === 'dark' ? 'bg-white/10' : 'bg-slate-300')}`}
                  >
                    <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform duration-300 shadow-md ${smartMode ? 'translate-x-7' : 'translate-x-0'}`}></div>
                  </button>
                </div>
              </div>
              <div className="flex gap-3 mb-6 relative z-10 items-start" onMouseLeave={() => setShowDirDropdown(false)}>
                {/* Left Side: Input + Dropdown container */}
                <div className="flex-1 flex flex-col min-w-0">
                  <div className="flex w-full">
                    <input type="text" value={selectedFolder} onChange={handleFolderChange} className={`flex-1 backdrop-blur-md border rounded-l-2xl px-5 py-4 transition-all shadow-inner font-mono text-[13.5px] font-black focus:outline-none min-w-0 ${theme === 'dark' ? 'bg-black/40 border-white/10 text-gray-300 focus:border-indigo-500 border-r-black/10' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500 shadow-slate-200 border-r-slate-200'}`} />
                    <button 
                      onClick={() => setShowDirDropdown(!showDirDropdown)}
                      className={`px-4 shrink-0 rounded-r-2xl border border-l-0 transition-all duration-200 flex items-center justify-center shadow-inner ${theme === 'dark' ? 'bg-black/60 hover:bg-black/80 border-white/10 text-gray-400 hover:text-indigo-400' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-600 hover:text-indigo-600'}`}
                    >
                      <ChevronDown size={18} strokeWidth={3} className={`transition-transform duration-300 ${showDirDropdown ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  
                  {/* Inline Dropdown mapped to input's width */}
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out w-full origin-top ${showDirDropdown ? 'opacity-100 max-h-[350px] mt-2' : 'opacity-0 max-h-0 mt-0 pointer-events-none'}`}>
                    <div className={`w-full rounded-[12px] border p-[10px] shadow-lg ${theme === 'dark' ? 'bg-[#181825] border-white/5 shadow-black/40' : 'bg-white border-slate-200 shadow-slate-300/40'}`}>
                      <div className={`px-2 py-1 text-[10px] font-black tracking-widest uppercase mb-1 flex items-center ${theme === 'dark' ? 'text-gray-500' : 'text-slate-500'}`}>Select Location</div>
                      {directories.length > 0 ? (
                        <div className="flex flex-col gap-1 w-full">
                          {directories.map((dir, i) => (
                            <button
                              key={i}
                              disabled={dir.disabled}
                              onClick={() => {
                                if (!dir.disabled) {
                                  setSelectedFolder(dir.path);
                                  localStorage.setItem('userTargetFolder', dir.path);
                                  if (appState !== 'idle') setAppState('idle');
                                  setShowDirDropdown(false);
                                }
                              }}
                              className={`w-full text-left p-[10px] text-[13px] font-bold tracking-wide flex items-center rounded-xl gap-3 transition-colors duration-200 ${dir.disabled ? (theme === 'dark' ? 'opacity-30 cursor-not-allowed text-gray-500' : 'opacity-40 cursor-not-allowed text-slate-400') : (theme === 'dark' ? 'hover:bg-white/10 text-gray-200 hover:text-white' : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900')}`}
                            >
                              <Folder size={16} className={dir.disabled ? '' : (theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600')} /> <span>{dir.name}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className={`p-[10px] text-[13px] font-bold text-center ${theme === 'dark' ? 'text-gray-500' : 'text-slate-500'}`}>
                          No backend links found
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side: Re-Scan Button */}
                <button onClick={handleReScan} className={`shrink-0 px-6 py-4 rounded-2xl font-black transition-all duration-200 shadow-md flex items-center gap-2 border ${theme === 'dark' ? 'bg-white/10 hover:bg-white/20 text-white border-white/5' : 'bg-white hover:bg-slate-50 text-slate-950 border-slate-300 shadow-slate-200'}`}>
                  <RefreshCw size={20} className={appState === 'scanning' ? 'animate-spin' : ''} /> <span className="hidden sm:inline">Re-Scan</span>
                </button>
              </div>
              <div className="flex flex-col gap-4 relative z-10">
                {/* Hidden buttons for ref linking from useEffects */}
                <button id="hidden-scan-trigger" className="hidden" onClick={handleScan}></button>
                <button id="hidden-sort-trigger" className="hidden" onClick={handleSort}></button>

                <button onClick={handleScan} disabled={appState !== 'idle'} className={`relative w-full py-4 rounded-2xl font-extrabold text-lg flex items-center justify-center gap-3 transition-all duration-300 overflow-hidden group ${appState === 'idle' ? 'text-white' : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5 shadow-inner'}`}>
                  {appState === 'idle' && <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-600 group-hover:from-indigo-500 group-hover:to-blue-500 transition-all shadow-xl shadow-indigo-500/20"></div>}
                  <span className="relative z-10 flex items-center gap-2">
                    {appState === 'scanning' ? <><RefreshCw size={22} className="animate-spin text-indigo-400" /> Scanning...</> : <><CheckCircle size={22} /> Step 1: Scan Directory</>}
                  </span>
                </button>
                
                {smartMode ? (
                  <button disabled={true} className={`relative w-full py-4 rounded-2xl font-extrabold text-lg flex items-center justify-center gap-3 transition-all duration-300 overflow-hidden group border shadow-inner ${theme === 'dark' ? 'bg-white/5 border-white/5 text-indigo-400' : 'bg-slate-100 border-slate-300 text-indigo-600'}`}>
                    <span className="relative z-10 flex items-center gap-2">
                      {appState === 'sorting' ? <><RefreshCw size={22} className="animate-spin" /> Smart Mode: Organizing...</> : <><Sparkles size={22} /> Smart Mode Active</>}
                    </span>
                  </button>
                ) : (
                  <button onClick={handleSort} disabled={appState !== 'scanned'} className={`relative w-full py-4 rounded-2xl font-extrabold text-lg flex items-center justify-center gap-3 transition-all duration-300 overflow-hidden group ${appState === 'sorting' ? 'bg-emerald-900/30 text-emerald-400 cursor-not-allowed border border-emerald-500/20 shadow-inner' : appState === 'scanned' ? 'text-white' : 'bg-white/5 text-gray-600 border border-white/5 cursor-not-allowed shadow-inner'}`}>
                    {appState === 'scanned' && <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 group-hover:from-emerald-500 group-hover:to-teal-500 transition-all shadow-xl shadow-emerald-500/20"></div>}
                    <span className="relative z-10 flex items-center gap-2">
                      {appState === 'sorting' ? <><RefreshCw size={22} className="animate-spin" /> Sorting...</> : <><Zap size={22} /> Step 2: Sort Files Now</>}
                    </span>
                  </button>
                )}
                {appState === 'sorted' && (
                  <button onClick={handleUndo} className="relative w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all duration-300 overflow-hidden group text-white mt-1">
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 to-orange-600 group-hover:from-yellow-500 group-hover:to-orange-500 transition-all shadow-xl shadow-yellow-500/20"></div>
                    <span className="relative z-10 flex items-center gap-2"><Undo size={22} /> Undo Last Sort</span>
                  </button>
                )}
              </div>
            </div>

            {/* QUICK INSIGHTS */}
            <div className={`p-6 rounded-[2.5rem] shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col ${theme === 'dark' ? 'bg-white/5 border border-white/5 backdrop-blur-lg' : 'bg-white border border-slate-300 border-l-[8px] border-l-amber-500 shadow-slate-300/40'}`}>
              <h2 className={`text-lg font-black flex items-center gap-2 tracking-tight transition-colors duration-300 mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Quick Insights <span className={`text-xl ${theme === 'dark' ? 'opacity-80' : ''}`}>⚡</span>
              </h2>

              <div className="relative z-10 flex flex-col gap-2">
                {insightsLoading ? (
                  <div className={`text-[13px] font-bold italic opacity-60 flex items-center gap-2 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>
                    <RefreshCw size={14} className="animate-spin" /> Analyzing folder...
                  </div>
                ) : insights.length === 0 ? (
                  <div className={`text-[13.5px] font-medium px-4 py-3 rounded-xl border flex items-center gap-3 transition-colors duration-300 ${theme === 'dark' ? 'bg-white/[0.03] border-white/[0.02] text-gray-300' : 'bg-slate-100/50 border-slate-200 text-slate-700'}`}>
                    <CheckCircle size={15} className={theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'} /> Your {selectedFolder.split(/[\\/]/).pop() || 'Desktop'} looks organized
                  </div>
                ) : (
                  insights.map((insight, i) => (
                    <div key={insight.id} className={`text-[13.5px] tracking-wide flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 animate-in fade-in zoom-in-95 cursor-default ${theme === 'dark' ? 'font-medium bg-white/[0.03] hover:bg-white/[0.06] text-gray-300' : 'font-bold bg-slate-100/80 border border-slate-300 hover:bg-slate-200 text-slate-900 shadow-sm'}`} style={{ animationDelay: `${i * 100}ms` }}>
                      <div className={`flex-shrink-0 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-800'}`}>{insight.icon}</div>
                      <span>{insight.text}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ACTIVITY LOG CARD */}
            <div className={`p-8 rounded-[2.5rem] shadow-xl h-[340px] flex flex-col flex-1 relative overflow-hidden transition-all duration-300 ${theme === 'dark' ? 'bg-white/5 border border-white/5 backdrop-blur-lg' : 'bg-white border border-slate-300 border-l-[8px] border-l-purple-600 shadow-slate-300/40'}`}>
              <div className="mb-5 relative z-10 flex flex-col gap-3 text-left">
                <h2 className={`text-xs font-black tracking-widest uppercase flex items-center gap-2 transition-colors duration-300 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-800'}`}>
                  <span className={`w-2 h-2 rounded-full animate-pulse ${theme === 'dark' ? 'bg-indigo-500' : 'bg-indigo-800'}`}></span> Activity Log
                </h2>
              </div>
              <div 
                className="flex-1 overflow-y-auto space-y-4 tracking-wide text-[14.5px] font-semibold relative z-10 pr-2 custom-scrollbar text-left pb-4"
                style={{ fontFamily: "'Cascadia Code', 'JetBrains Mono', 'Fira Code', Consolas, Menlo, monospace" }}
              >
                {logs.length === 0 ? <div className={`h-full flex items-center justify-center italic ${theme === 'dark' ? 'text-gray-600' : 'text-slate-600'}`}>No activity yet. Scan a directory to begin.</div> : logs.map(log => (
                  <div key={log.id} className="flex gap-3 items-start animate-in slide-in-from-left-2 duration-300">
                    <span className={`${theme === 'dark' ? 'text-indigo-400/60' : 'text-indigo-900/80'} shrink-0 select-none text-[13.5px] tracking-tight font-bold mt-[1px]`}>[{log.time}]</span>
                    <span className={`leading-snug ${log.type === 'System' ? (theme === 'dark' ? 'text-blue-300' : 'text-blue-900 font-bold') : log.type === 'Success' ? (theme === 'dark' ? 'text-emerald-400' : 'text-emerald-800 font-bold') : log.type === 'Error' ? (theme === 'dark' ? 'text-red-400' : 'text-red-800 font-bold') : (theme === 'dark' ? 'text-gray-300' : 'text-slate-900 font-bold')}`}>{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="col-span-1 space-y-6 flex flex-col">
            {/* UNIFIED ANALYTICS DASHBOARD */}
            <div 
              className={`p-8 rounded-[2.5rem] shadow-xl min-h-[700px] flex-1 flex flex-col group relative overflow-hidden transition-all duration-300 ${theme === 'dark' ? 'bg-white/5 border border-white/5 backdrop-blur-lg' : 'bg-white border border-slate-300 border-l-[8px] border-l-indigo-600 shadow-slate-300/40'}`}
              onMouseMove={(e) => { 
                if (hoveredStat) { 
                  const rect = e.currentTarget.getBoundingClientRect(); 
                  setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top }); 
                } 
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 opacity-30"></div>
              <div className="relative z-10 mb-8 border-b transition-colors duration-300 pb-6" style={{ borderColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#e2e8f0' }}>
                <h2 className={`text-2xl font-black flex items-center gap-3 tracking-tight transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  <PieChartIcon size={28} className={theme === 'dark' ? 'text-indigo-400 drop-shadow-[0_0_10px_rgba(129,140,248,0.6)]' : 'text-indigo-600'} /> Analytics Dashboard
                </h2>
                <p className={`text-xs mt-2 font-black uppercase tracking-[0.2em] transition-colors duration-300 ${theme === 'dark' ? 'text-gray-500' : 'text-slate-600'}`}>Storage Analysis & Distribution</p>
              </div>

              {/* TOP SUMMARY CARDS */}
              <div className="grid grid-cols-3 gap-3 mb-10 relative z-10">
                {[ { label: 'Files', val: displayTotalFiles }, { label: 'Storage', val: formatSize(displayTotalSize) }, { label: 'Largest', val: displayLargest.name, small: true } ].map((card, i) => (
                  <div key={i} className={`p-4 rounded-2xl border flex flex-col gap-1 transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-300 shadow-sm'}`}>
                    <span className={`text-[11px] font-black uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-slate-800'}`}>{card.label}</span>
                    <span className={`${card.small ? 'text-base' : 'text-2xl'} font-black truncate ${theme === 'dark' ? 'text-white' : 'text-slate-950'} ${card.label === 'Largest' ? (theme === 'dark' ? 'text-indigo-400' : 'text-indigo-800') : ''}`}>{card.val}</span>
                  </div>
                ))}
              </div>

              {/* MAIN CHART AREA */}
              <div className="flex-1 flex flex-col relative z-10">
                <div className="flex items-center justify-center relative h-[290px] w-full my-2">
                  {appState === 'sorted' ? (
                    <div className="flex flex-col items-center gap-4 text-center py-10 opacity-90 animate-in zoom-in duration-500">
                      <div className={`p-5 rounded-full shadow-inner ${theme === 'dark' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                        <CheckCircle size={56} className="animate-pulse" />
                      </div>
                      <span className={`text-[15px] font-black tracking-wide ${theme === 'dark' ? 'text-emerald-50' : 'text-slate-800'}`}>All files have been successfully organized ✅</span>
                    </div>
                  ) : totalSize > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart onMouseLeave={() => setHoveredStat(null)}>
                        <defs>
                          {statsArray.map((s, i) => (
                            <linearGradient key={i} id={`color-${s.name.toLowerCase()}`} x1="0" y1="0" x2="1" y2="1">
                              <stop offset="5%" stopColor={s.color} stopOpacity={1}/>
                              <stop offset="95%" stopColor={s.color} stopOpacity={0.7}/>
                            </linearGradient>
                          ))}
                        </defs>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={100}
                          outerRadius={135}
                          paddingAngle={1}
                          cornerRadius={0}
                          dataKey="value"
                          stroke="none"
                          animationBegin={0}
                          animationDuration={1500}
                          activeIndex={hoveredStat ? chartData.findIndex(d => d.name === hoveredStat.name) : -1}
                          activeShape={renderActiveShape}
                          onMouseEnter={(_, index) => setHoveredStat(statsWithPercentage[index])}
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={`url(#color-${entry.name.toLowerCase()})`} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center gap-4 text-center py-10 opacity-60">
                      <div className="relative">
                        <PieChartIcon size={64} className={theme === 'dark' ? "text-gray-500" : "text-slate-800"} strokeWidth={1.5} />
                        <div className="absolute inset-0 animate-pulse bg-indigo-500/10 rounded-full blur-xl"></div>
                      </div>
                      <span className={`font-black tracking-[0.3em] text-[10px] uppercase ${theme === 'dark' ? "text-gray-500" : "text-slate-800"}`}>Awaiting Data</span>
                    </div>
                  )}

                  {appState !== 'sorted' && totalSize > 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center mt-2">
                      <span className={`text-[11px] font-black tracking-[0.4em] uppercase mb-1 ${theme === 'dark' ? 'text-indigo-400/80' : 'text-indigo-900/80'}`}>Total</span>
                      <span className={`text-5xl font-black tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>{formatSize(totalSize).split(' ')[0]}</span>
                      <span className={`text-base font-black tracking-widest uppercase ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-800'}`}>{formatSize(totalSize).split(' ')[1]}</span>
                    </div>
                  )}
                </div>

                {appState !== 'sorted' && (
                  <div className="mt-8 space-y-2 overflow-y-auto max-h-[290px] pr-2 custom-scrollbar text-left pb-4">
                    {statsArray.filter(s => s.value > 0 || s.size > 0).map((stat, i) => {
                      const percentage = totalSize > 0 ? (stat.size / totalSize) * 100 : 0;
                    const isExpanded = !!expandedCats[stat.name];
                    const catFiles = isExpanded ? realFiles.filter(f => f.type === stat.typeKey) : [];
                    const displayFiles = catFiles.slice(0, 4);
                    const remaining = catFiles.length - displayFiles.length;

                    return (
                      <div key={i} className="flex flex-col mb-1 relative">
                        <div 
                          onClick={() => setExpandedCats(prev => ({ ...prev, [stat.name]: !prev[stat.name] }))}
                          onMouseEnter={() => setHoveredStat(stat)} 
                          onMouseLeave={() => setHoveredStat(null)} 
                          className={`flex items-center justify-between p-3 rounded-xl transition-all duration-200 ease-in-out cursor-pointer group/item ${hoveredStat?.name === stat.name ? (theme === 'dark' ? 'bg-[#2a2a3e] scale-[1.01]' : 'bg-slate-300 scale-[1.01]') : (theme === 'dark' ? 'bg-[#181825]' : 'bg-slate-200')}`}
                        >
                          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 w-full">
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: stat.color }}></div>
                              <span className={`text-sm font-black uppercase tracking-wide transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>{stat.name}</span>
                            </div>
                            <div className={`text-[13.5px] font-black w-[70px] text-right ${theme === 'dark' ? 'text-gray-400' : 'text-slate-950'}`}>{stat.value} files</div>
                            <div className={`text-[14px] tracking-tight font-mono font-black w-[80px] text-right ${theme === 'dark' ? 'text-gray-300' : 'text-slate-950'}`}>{formatSize(stat.size)}</div>
                            <div className={`w-[45px] text-right text-[13px] font-black ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-700'}`}>{percentage.toFixed(0)}%</div>
                            <div className={`transition-transform duration-300 flex items-center justify-center ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
                              <ChevronDown size={16} strokeWidth={3} className={theme === 'dark' ? 'text-gray-500 group-hover/item:text-gray-300' : 'text-slate-800 group-hover/item:text-slate-950'} />
                            </div>
                          </div>
                        </div>
                        
                        {/* Expandable content */}
                        <div className={`overflow-hidden transition-all duration-200 ease-in-out ${isExpanded ? 'max-h-[300px] opacity-100 mt-2 mb-2' : 'max-h-0 opacity-0 mt-0 mb-0'}`}>
                          <div className="relative pl-[18px] pr-2 py-[10px] ml-4 flex flex-col gap-[6px]">
                            {/* Accent Line */}
                            <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-[4px]" style={{ backgroundColor: stat.color }}></div>
                            
                            {displayFiles.map((f, idx) => {
                              const IconComp = stat.icon;
                              return (
                                <div key={idx} className={`text-[14px] font-medium tracking-wide flex items-center gap-3 px-[12px] py-[8px] rounded-[6px] cursor-pointer transition-colors duration-200 ${theme === 'dark' ? 'text-[#e5e7eb] hover:bg-white/10' : 'text-slate-800 hover:bg-slate-300/50'}`}>
                                  <IconComp size={14} style={{ color: stat.color }} className="opacity-90 flex-shrink-0" />
                                  <span className="truncate">{f.name}</span>
                                </div>
                              );
                            })}
                            {remaining > 0 && (
                              <div className={`text-[12px] font-bold tracking-widest uppercase mt-[4px] ml-[38px] ${theme === 'dark' ? 'text-gray-500' : 'text-slate-500'}`}>
                                + {remaining} more...
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}