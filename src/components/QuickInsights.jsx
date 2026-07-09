import React from 'react';
import { Folder, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

export default function QuickInsights({
  theme,
  insights,
  insightsLoading,
  selectedFolder
}) {
  return (
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
  );
}
