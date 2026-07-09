import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Folder, RefreshCw, Sparkles, AlertCircle, CheckCircle, Zap, Image, FileText, Film, Archive, Terminal, Package } from 'lucide-react';
import { Sector } from 'recharts';

import Header from './components/Header';
import FolderSelector from './components/FolderSelector';
import QuickInsights from './components/QuickInsights';
import ActivityLog from './components/ActivityLog';
import AnalyticsDashboard from './components/AnalyticsDashboard';

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
  const [isDragging, setIsDragging] = useState(false);
  const [dropError, setDropError] = useState(null);
  const [scanningIndex, setScanningIndex] = useState(0);
  const [scanningFileName, setScanningFileName] = useState('');

  // Clear dropError after 4s timeout
  useEffect(() => {
    if (dropError) {
      const timer = setTimeout(() => setDropError(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [dropError]);

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

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDropError(null);

    if (!window.electronAPI) {
      setDropError("Folder path access is only available in the Electron desktop application.");
      return;
    }

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const droppedPath = window.electronAPI.getPathForFile 
      ? window.electronAPI.getPathForFile(file) 
      : file.path;

    if (!droppedPath) {
      setDropError("Folder path access is only available in the Electron desktop application.");
      return;
    }

    if (window.electronAPI.validateDirectory) {
      const res = await window.electronAPI.validateDirectory(droppedPath);
      if (res.success) {
        setSelectedFolder(droppedPath);
        localStorage.setItem('userTargetFolder', droppedPath);
        if (appState !== 'idle') setAppState('idle');
        addLog('System', `Target folder set via drop: "${droppedPath}"`);
      } else {
        setDropError("Dropped item is not a folder.");
        addLog('Error', `Invalid drop: "${droppedPath}" is not a directory.`);
      }
    }
  }, [appState]);

  const handleBrowse = useCallback(async () => {
    if (window.electronAPI && window.electronAPI.selectDirectory) {
      const res = await window.electronAPI.selectDirectory();
      if (res.success && res.filePaths.length > 0) {
        const selectedPath = res.filePaths[0];
        setSelectedFolder(selectedPath);
        localStorage.setItem('userTargetFolder', selectedPath);
        if (appState !== 'idle') setAppState('idle');
        addLog('System', `Target folder set via browse: "${selectedPath}"`);
      }
    } else {
      setDropError("Folder selection is only available in the Electron desktop application.");
    }
  }, [appState]);

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
    setScanningIndex(0);
    setScanningFileName('');
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
    setScanningIndex(0);
    setScanningFileName('');

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
      let processedCount = 0;

      for (const file of response.files) {
        currentStats[file.type] += 1;
        currentStats[`${file.type}Size`] += file.size || 0;
        processedCount++;
        
        batchCount++;
        if (batchCount >= BATCH_SIZE) {
          setStats({ ...currentStats });
          setScanningIndex(processedCount);
          setScanningFileName(file.name);
          addLog('Info', `Scanning... processed ${currentStats.images + currentStats.docs + currentStats.media + currentStats.archives + currentStats.code + currentStats.installers} files.`);
          batchCount = 0;
          await sleep(10); // Yield to main thread
        }
      }

      // Final update
      setStats({ ...currentStats });
      setScanningIndex(processedCount);
      setScanningFileName('');
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

      <div className="w-full max-w-[1800px] relative z-10 px-6 md:px-8 py-8 flex flex-col flex-1">
        <Header theme={theme} setTheme={setTheme} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1">
          <div className="col-span-1 lg:col-span-7 xl:col-span-8 space-y-6 flex flex-col">
            <FolderSelector
              theme={theme}
              selectedFolder={selectedFolder}
              handleFolderChange={handleFolderChange}
              showDirDropdown={showDirDropdown}
              setShowDirDropdown={setShowDirDropdown}
              directories={directories}
              setSelectedFolder={setSelectedFolder}
              appState={appState}
              setAppState={setAppState}
              isDragging={isDragging}
              handleDragOver={handleDragOver}
              handleDragEnter={handleDragEnter}
              handleDragLeave={handleDragLeave}
              handleDrop={handleDrop}
              dropError={dropError}
              setDropError={setDropError}
              handleReScan={handleReScan}
              handleScan={handleScan}
              handleSort={handleSort}
              handleUndo={handleUndo}
              smartMode={smartMode}
              setSmartMode={setSmartMode}
              realFiles={realFiles}
              scanningIndex={scanningIndex}
              scanningFileName={scanningFileName}
              handleBrowse={handleBrowse}
            />

            <QuickInsights
              theme={theme}
              insights={insights}
              insightsLoading={insightsLoading}
              selectedFolder={selectedFolder}
            />

            <ActivityLog theme={theme} logs={logs} />
          </div>

          <div className="col-span-1 lg:col-span-5 xl:col-span-4 flex flex-col">
            <AnalyticsDashboard
              theme={theme}
              appState={appState}
              displayTotalFiles={displayTotalFiles}
              displayTotalSize={displayTotalSize}
              displayLargest={displayLargest}
              totalSize={totalSize}
              chartData={chartData}
              statsArray={statsArray}
              realFiles={realFiles}
              expandedCats={expandedCats}
              setExpandedCats={setExpandedCats}
              hoveredStat={hoveredStat}
              setHoveredStat={setHoveredStat}
              renderActiveShape={renderActiveShape}
              setTooltipPos={setTooltipPos}
              formatSize={formatSize}
            />
          </div>
        </div>
      </div>
    </div>
  );
}