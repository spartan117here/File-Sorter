import React from 'react';
import { Folder, Zap, ChevronDown, RefreshCw, CheckCircle, Sparkles, Undo, AlertCircle } from 'lucide-react';

export default function FolderSelector({
  theme,
  selectedFolder,
  handleFolderChange,
  showDirDropdown,
  setShowDirDropdown,
  directories,
  setSelectedFolder,
  appState,
  setAppState,
  isDragging,
  handleDragOver,
  handleDragEnter,
  handleDragLeave,
  handleDrop,
  dropError,
  setDropError,
  handleReScan,
  handleScan,
  handleSort,
  handleUndo,
  smartMode,
  setSmartMode,
  realFiles,
  scanningIndex,
  scanningFileName,
  handleBrowse
}) {
  return (
    <div className={`p-8 rounded-[2.5rem] shadow-xl border transition-all duration-300 relative overflow-hidden flex flex-col ${
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
            <div className={`absolute left-1 top-1 bg-white/90 w-5 h-5 rounded-full transition-transform duration-300 shadow-md ${smartMode ? 'translate-x-7' : 'translate-x-0'}`}></div>
          </button>
        </div>
      </div>

      {dropError && (
        <div className={`mb-4 p-4 rounded-2xl border flex items-center gap-3 animate-in slide-in-from-top duration-350 relative z-10 ${
          theme === 'dark' ? 'bg-red-500/10 border-red-500/20 text-red-300' : 'bg-red-50 border-red-200 text-red-800 font-bold'
        }`}>
          <AlertCircle size={18} className="shrink-0" />
          <span className="text-sm">{dropError}</span>
          <button 
            onClick={() => setDropError(null)} 
            className={`ml-auto font-black text-xs hover:opacity-75 ${theme === 'dark' ? 'text-red-400' : 'text-red-650'}`}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Visible Drag & Drop Zone Box */}
      <div
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`mb-6 p-6 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 relative group overflow-hidden ${
          isDragging
            ? (theme === 'dark' 
                ? 'border-indigo-400 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                : 'border-indigo-655 bg-indigo-50 shadow-[0_0_15px_rgba(99,102,241,0.15)]')
            : (theme === 'dark'
                ? 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20'
                : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400')
        }`}
      >
        <Folder 
          size={36} 
          className={`transition-all duration-355 ${
            isDragging 
              ? 'animate-bounce text-indigo-400 scale-110' 
              : (theme === 'dark' ? 'text-gray-400 group-hover:text-indigo-400 group-hover:scale-105' : 'text-slate-500 group-hover:text-indigo-650 group-hover:scale-105')
          }`} 
        />
        <span className={`text-[14px] font-black mt-3 transition-colors ${
          isDragging 
            ? (theme === 'dark' ? 'text-indigo-200' : 'text-indigo-850') 
            : (theme === 'dark' ? 'text-gray-300' : 'text-slate-800')
        }`}>
          {isDragging ? "Release to Select Folder" : "Drag & Drop Folder Here"}
        </span>
        {!isDragging && (
          <div className="flex items-center gap-2 mt-3 relative z-10">
            <span className={`text-[11px] font-black uppercase tracking-wider ${theme === 'dark' ? 'text-gray-500' : 'text-slate-500'}`}>or</span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleBrowse();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${
                theme === 'dark' 
                  ? 'bg-white/10 hover:bg-white/20 text-white border-white/5 shadow-md hover:scale-[1.03] active:scale-100' 
                  : 'bg-white hover:bg-slate-50 text-indigo-750 border-slate-300 shadow-sm hover:scale-[1.03] active:scale-100'
              }`}
            >
              Browse Folder
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-3 mb-6 relative z-10 items-start" onMouseLeave={() => setShowDirDropdown(false)}>
        {/* Left Side: Input + Dropdown container */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex w-full">
            <input type="text" value={selectedFolder} onChange={handleFolderChange} className={`flex-1 backdrop-blur-md border rounded-l-2xl px-5 py-4 transition-all shadow-inner font-mono text-[13.5px] font-black focus:outline-none min-w-0 ${theme === 'dark' ? 'bg-black/40 border-white/10 text-gray-300 focus:border-indigo-500 border-r-black/10' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500 shadow-slate-200 border-r-slate-200'}`} />
            <button 
              onClick={() => setShowDirDropdown(!showDirDropdown)}
              className={`px-4 shrink-0 rounded-r-2xl border border-l-0 transition-all duration-200 flex items-center justify-center shadow-inner ${theme === 'dark' ? 'bg-black/60 hover:bg-black/80 border-white/10 text-gray-400 hover:text-indigo-400' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-655 hover:text-indigo-655'}`}
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
                      <Folder size={16} className={dir.disabled ? '' : (theme === 'dark' ? 'text-indigo-400' : 'text-indigo-650')} /> <span>{dir.name}</span>
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
        <button onClick={handleReScan} className={`shrink-0 px-6 py-4 rounded-2xl font-black transition-all duration-200 shadow-md flex items-center gap-2 border hover:scale-[1.02] hover:-translate-y-0.5 active:translate-y-0 active:scale-100 ${theme === 'dark' ? 'bg-white/10 hover:bg-white/20 text-white border-white/5 hover:shadow-lg' : 'bg-white hover:bg-slate-50 text-slate-955 border-slate-350 shadow-slate-200 hover:shadow-lg'}`}>
          <RefreshCw size={20} className={appState === 'scanning' ? 'animate-spin' : ''} /> <span className="hidden sm:inline">Re-Scan</span>
        </button>
      </div>

      {appState === 'scanning' && (
        <div className={`mb-4 p-5 rounded-2xl border transition-all duration-300 animate-in slide-in-from-top-3 relative z-10 ${
          theme === 'dark' ? 'bg-black/30 border-white/5 text-gray-300' : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          <div className="flex justify-between items-center mb-2 text-xs font-black uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <RefreshCw size={12} className="animate-spin text-indigo-400" /> Indexing Files
            </span>
            <span className={theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}>
              {realFiles.length > 0 ? Math.round((scanningIndex / realFiles.length) * 100) : 0}%
            </span>
          </div>
          {/* Progress Track */}
          <div className={`w-full h-2 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'}`}>
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-150 ease-out shadow-[0_0_8px_rgba(99,102,241,0.5)]" 
              style={{ width: `${realFiles.length > 0 ? (scanningIndex / realFiles.length) * 100 : 0}%` }}
            ></div>
          </div>
          {scanningFileName && (
            <p className="mt-2.5 text-[11px] font-mono font-medium truncate opacity-60">
              [{scanningIndex} / {realFiles.length}] {scanningFileName}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-4 relative z-10">
        {/* Hidden buttons for ref linking from useEffects */}
        <button id="hidden-scan-trigger" className="hidden" onClick={handleScan}></button>
        <button id="hidden-sort-trigger" className="hidden" onClick={handleSort}></button>

        <button onClick={handleScan} disabled={appState !== 'idle'} className={`relative w-full py-4 rounded-2xl font-extrabold text-lg flex items-center justify-center gap-3 transition-all duration-300 overflow-hidden group hover:scale-[1.01] hover:-translate-y-0.5 active:translate-y-0 shadow-md hover:shadow-xl hover:shadow-indigo-500/10 active:shadow-md ${appState === 'idle' ? 'text-white cursor-pointer' : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5 shadow-inner'}`}>
          {appState === 'idle' && <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-600 group-hover:from-indigo-500 group-hover:to-blue-500 transition-all shadow-xl shadow-indigo-500/20"></div>}
          <span className="relative z-10 flex items-center gap-2">
            {appState === 'scanning' ? <><RefreshCw size={22} className="animate-spin text-indigo-400" /> Scanning...</> : <><CheckCircle size={22} /> Step 1: Scan Directory</>}
          </span>
        </button>
        
        {smartMode ? (
          <button disabled={true} className={`relative w-full py-4 rounded-2xl font-extrabold text-lg flex items-center justify-center gap-3 transition-all duration-300 overflow-hidden group border shadow-inner ${theme === 'dark' ? 'bg-white/5 border-white/5 text-indigo-400' : 'bg-slate-100 border-slate-305 text-indigo-650'}`}>
            <span className="relative z-10 flex items-center gap-2">
              {appState === 'sorting' ? <><RefreshCw size={22} className="animate-spin" /> Smart Mode: Organizing...</> : <><Sparkles size={22} /> Smart Mode Active</>}
            </span>
          </button>
        ) : (
          <button onClick={handleSort} disabled={appState !== 'scanned'} className={`relative w-full py-4 rounded-2xl font-extrabold text-lg flex items-center justify-center gap-3 transition-all duration-300 overflow-hidden group hover:scale-[1.01] hover:-translate-y-0.5 active:translate-y-0 shadow-md hover:shadow-xl hover:shadow-emerald-500/10 active:shadow-md ${appState === 'sorting' ? 'bg-emerald-900/30 text-emerald-400 cursor-not-allowed border border-emerald-500/20 shadow-inner' : appState === 'scanned' ? 'text-white cursor-pointer' : 'bg-white/5 text-gray-600 border border-white/5 cursor-not-allowed shadow-inner'}`}>
            {appState === 'scanned' && <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 group-hover:from-emerald-500 group-hover:to-teal-500 transition-all shadow-xl shadow-emerald-500/20"></div>}
            <span className="relative z-10 flex items-center gap-2">
              {appState === 'sorting' ? <><RefreshCw size={22} className="animate-spin" /> Sorting...</> : <><Zap size={22} /> Step 2: Sort Files Now</>}
            </span>
          </button>
        )}
        {appState === 'sorted' && (
          <button onClick={handleUndo} className="relative w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all duration-300 overflow-hidden group text-white mt-1 hover:scale-[1.01] hover:-translate-y-0.5 active:translate-y-0 shadow-md hover:shadow-xl hover:shadow-yellow-500/10 active:shadow-md">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 to-orange-650 group-hover:from-yellow-500 group-hover:to-orange-500 transition-all shadow-xl shadow-yellow-500/20"></div>
            <span className="relative z-10 flex items-center gap-2"><Undo size={22} /> Undo Last Sort</span>
          </button>
        )}
      </div>
    </div>
  );
}
