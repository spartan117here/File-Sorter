import React from 'react';
import { PieChart as PieChartIcon, CheckCircle, ChevronDown } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export default function AnalyticsDashboard({
  theme,
  appState,
  displayTotalFiles,
  displayTotalSize,
  displayLargest,
  totalSize,
  chartData,
  statsArray,
  realFiles,
  expandedCats,
  setExpandedCats,
  hoveredStat,
  setHoveredStat,
  renderActiveShape,
  setTooltipPos,
  formatSize
}) {
  return (
    <div 
      className={`p-8 rounded-[2.5rem] shadow-xl min-h-[600px] h-full flex-1 flex flex-col group relative overflow-hidden transition-all duration-300 ${theme === 'dark' ? 'bg-white/5 border border-white/5 backdrop-blur-lg' : 'bg-white border border-slate-300 border-l-[8px] border-l-indigo-600 shadow-slate-300/40'}`}
      onMouseMove={(e) => { 
        if (hoveredStat) { 
          const rect = e.currentTarget.getBoundingClientRect(); 
          setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top }); 
        } 
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 opacity-30"></div>
      <div className="relative z-10 mb-8 border-b transition-colors duration-300 pb-6" style={{ borderColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#e2e8f0' }}>
        <h2 className={`text-2xl font-black flex items-center gap-3 tracking-tight transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-slate-905'}`}>
          <PieChartIcon size={28} className={theme === 'dark' ? 'text-indigo-400 drop-shadow-[0_0_10px_rgba(129,140,248,0.6)]' : 'text-indigo-600'} /> Analytics Dashboard
        </h2>
        <p className={`text-xs mt-2 font-black uppercase tracking-[0.2em] transition-colors duration-300 ${theme === 'dark' ? 'text-gray-500' : 'text-slate-600'}`}>Storage Analysis & Distribution</p>
      </div>

      {/* TOP SUMMARY CARDS */}
      <div className="grid grid-cols-3 gap-3 mb-10 relative z-10">
        {[ { label: 'Files', val: displayTotalFiles }, { label: 'Storage', val: formatSize(displayTotalSize) }, { label: 'Largest', val: displayLargest.name, small: true } ].map((card, i) => (
          <div key={i} className={`p-4 rounded-2xl border flex flex-col gap-1 transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-55 border-slate-305 shadow-sm'}`}>
            <span className={`text-[11px] font-black uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-slate-800'}`}>{card.label}</span>
            <span className={`${card.small ? 'text-base' : 'text-2xl'} font-black truncate ${theme === 'dark' ? 'text-white' : 'text-slate-950'} ${card.label === 'Largest' ? (theme === 'dark' ? 'text-indigo-400' : 'text-indigo-805') : ''}`}>{card.val}</span>
          </div>
        ))}
      </div>

      {/* MAIN CHART AREA */}
      <div className="flex-1 flex flex-col relative z-10">
        <div className="flex items-center justify-center relative h-[25vh] min-h-[280px] max-h-[340px] w-full my-2">
          {appState === 'sorted' ? (
            <div className="flex flex-col items-center gap-5 text-center py-10 opacity-100 animate-in zoom-in-95 duration-500">
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 rounded-full animate-ping opacity-25 scale-150 duration-1000 bg-emerald-500"></div>
                <div className={`p-6 rounded-full shadow-xl relative z-10 transition-all ${
                  theme === 'dark' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-emerald-50 border border-emerald-200 text-emerald-600 shadow-md'
                } animate-[bounce_0.6s_cubic-bezier(0.175,0.885,0.32,1.275)_forwards]`}>
                  <CheckCircle size={64} strokeWidth={2.5} />
                </div>
              </div>
              <div className="space-y-1">
                <span className={`block text-lg font-black tracking-wide ${theme === 'dark' ? 'text-emerald-100' : 'text-slate-905'}`}>Organization Complete</span>
                <span className={`block text-xs font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>All loose files have been organized into folders</span>
              </div>
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
                  onMouseEnter={(_, index) => setHoveredStat(statsArray.find(s => s.name === chartData[index].name))}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#color-${entry.name.toLowerCase()})`} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className={`flex flex-col items-center justify-center border border-dashed rounded-3xl p-8 text-center my-6 flex-1 transition-colors duration-300 ${
              theme === 'dark' ? 'border-white/5 bg-white/[0.01]' : 'border-slate-350 bg-slate-50'
            }`}>
              <div className="relative mb-5 flex items-center justify-center">
                <div className="absolute inset-0 animate-pulse bg-indigo-500/10 rounded-full blur-2xl w-20 h-20"></div>
                <div className={`p-4 rounded-2xl relative z-10 ${
                  theme === 'dark' ? 'bg-[#181825] text-gray-500' : 'bg-white text-slate-400 shadow-sm border border-slate-200'
                }`}>
                  <PieChartIcon size={44} strokeWidth={1.5} className="animate-pulse-slow" />
                </div>
              </div>
              <h3 className={`text-[15px] font-black tracking-wide mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-slate-800'}`}>No Data Scanned</h3>
              <p className={`text-xs max-w-[200px] leading-relaxed font-bold ${theme === 'dark' ? 'text-gray-500' : 'text-slate-555'}`}>
                Choose a directory and scan to view file storage analysis.
              </p>
            </div>
          )}

          {appState !== 'sorted' && totalSize > 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center mt-2">
              <span className={`text-[11px] font-black tracking-[0.4em] uppercase mb-1 ${theme === 'dark' ? 'text-indigo-400/80' : 'text-indigo-900/80'}`}>Total</span>
              <span className={`text-5xl font-black tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-slate-955'}`}>{formatSize(totalSize).split(' ')[0]}</span>
              <span className={`text-base font-black tracking-widest uppercase ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-805'}`}>{formatSize(totalSize).split(' ')[1]}</span>
            </div>
          )}
        </div>

        {appState !== 'sorted' && (
          <div className="mt-8 space-y-2 overflow-y-auto flex-1 min-h-[180px] pr-2 custom-scrollbar text-left pb-4">
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
                        <span className={`text-sm font-black uppercase tracking-wide transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-955'}`}>{stat.name}</span>
                      </div>
                      <div className={`text-[13.5px] font-black w-[70px] text-right ${theme === 'dark' ? 'text-gray-400' : 'text-slate-950'}`}>{stat.value} files</div>
                      <div className={`text-[14px] tracking-tight font-mono font-black w-[80px] text-right ${theme === 'dark' ? 'text-gray-300' : 'text-slate-950'}`}>{formatSize(stat.size)}</div>
                      <div className={`w-[45px] text-right text-[13px] font-black ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-700'}`}>{percentage.toFixed(0)}%</div>
                      <div className={`transition-transform duration-300 flex items-center justify-center ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
                        <ChevronDown size={16} strokeWidth={3} className={theme === 'dark' ? 'text-gray-500 group-hover/item:text-gray-300' : 'text-slate-800 group-hover/item:text-slate-955'} />
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
                          <div 
                            key={idx} 
                            className={`text-[14px] font-medium tracking-wide flex items-center gap-3 px-[12px] py-[8px] rounded-[6px] cursor-pointer transition-all duration-200 animate-in fade-in slide-in-from-bottom-1 ${
                              theme === 'dark' ? 'text-[#e5e7eb] hover:bg-white/10' : 'text-slate-800 hover:bg-slate-300/50'
                            }`}
                            style={{ animationDelay: `${idx * 40}ms`, animationFillMode: 'both' }}
                          >
                            <IconComp size={14} style={{ color: stat.color }} className="opacity-90 flex-shrink-0" />
                            <span className="truncate">{f.name}</span>
                          </div>
                        );
                      })}
                      {remaining > 0 && (
                        <div className={`text-[12px] font-bold tracking-widest uppercase mt-[4px] ml-[38px] ${theme === 'dark' ? 'text-gray-500' : 'text-slate-550'}`}>
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
  );
}
