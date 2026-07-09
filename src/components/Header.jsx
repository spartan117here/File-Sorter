import React from 'react';
import { Folder, Sparkles, Sun, Moon } from 'lucide-react';

export default function Header({ theme, setTheme }) {
  return (
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
  );
}
