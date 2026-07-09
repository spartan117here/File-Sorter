import React from 'react';

export default function ActivityLog({ theme, logs }) {
  return (
    <div className={`p-8 rounded-[2.5rem] shadow-xl min-h-[280px] flex flex-col flex-1 relative overflow-hidden transition-all duration-300 ${theme === 'dark' ? 'bg-white/5 border border-white/5 backdrop-blur-lg' : 'bg-white border border-slate-300 border-l-[8px] border-l-purple-600 shadow-slate-300/40'}`}>
      <div className="mb-5 relative z-10 flex flex-col gap-3 text-left">
        <h2 className={`text-xs font-black tracking-widest uppercase flex items-center gap-2 transition-colors duration-300 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-800'}`}>
          <span className={`w-2 h-2 rounded-full animate-pulse ${theme === 'dark' ? 'bg-indigo-500' : 'bg-indigo-800'}`}></span> Activity Log
        </h2>
      </div>
      <div 
        className="flex-1 overflow-y-auto space-y-4 tracking-wide text-[14.5px] font-semibold relative z-10 pr-2 custom-scrollbar text-left pb-4"
        style={{ fontFamily: "'Cascadia Code', 'JetBrains Mono', 'Fira Code', Consolas, Menlo, monospace" }}
      >
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-start justify-start p-4 font-mono text-[13px] opacity-40">
            <div className="flex items-center gap-2">
              <span className="text-indigo-500 font-black">&gt;</span>
              <span>Sortify engine initialized. Awaiting folder scan...</span>
              <span className="w-1.5 h-3 bg-indigo-500 animate-pulse inline-block ml-0.5"></span>
            </div>
          </div>
        ) : (
          logs.map(log => (
            <div key={log.id} className="flex gap-3 items-start animate-in slide-in-from-left-2 duration-300">
              <span className={`${theme === 'dark' ? 'text-indigo-400/60' : 'text-indigo-900/80'} shrink-0 select-none text-[13.5px] tracking-tight font-bold mt-[1px]`}>[{log.time}]</span>
              <span className={`leading-snug ${log.type === 'System' ? (theme === 'dark' ? 'text-blue-300' : 'text-blue-900 font-bold') : log.type === 'Success' ? (theme === 'dark' ? 'text-emerald-400' : 'text-emerald-800 font-bold') : log.type === 'Error' ? (theme === 'dark' ? 'text-red-400' : 'text-red-800 font-bold') : (theme === 'dark' ? 'text-gray-300' : 'text-slate-900 font-bold')}`}>{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
