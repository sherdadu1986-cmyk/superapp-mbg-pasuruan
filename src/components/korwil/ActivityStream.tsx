"use client"
import { Activity, ArrowRight } from 'lucide-react'

interface ActivityItem {
  id: string
  text: string
  time: string
  type: 'success' | 'warning' | 'info'
}

interface ActivityStreamProps {
  activities: ActivityItem[]
  onViewAll?: () => void
}

export default function ActivityStream({ activities, onViewAll }: ActivityStreamProps) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-5">
        <div className="space-y-0.5">
          <h3 className="text-sm font-black text-slate-900 tracking-tight italic">AKTIVITAS TERKINI</h3>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Real-time Activity Stream</p>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 bg-rose-50 rounded-lg animate-pulse">
          <div className="w-1 h-1 bg-rose-500 rounded-full" />
          <span className="text-[7px] font-black text-rose-600 uppercase">Live</span>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto max-h-[250px] pr-2 scrollbar-hide">
        {activities.map((act, i) => (
          <div 
            key={act.id} 
            className="flex gap-3 group animate-in fade-in slide-in-from-right-4 duration-500" 
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${
              act.type === 'success' ? 'bg-emerald-500' : 
              act.type === 'warning' ? 'bg-rose-500' : 
              'bg-blue-500 shadow-lg shadow-blue-500/20'
            }`} />
            <div className="space-y-1">
              <p 
                className="text-[10px] text-slate-600 leading-relaxed font-medium"
                dangerouslySetInnerHTML={{ __html: act.text.replace(/\*\*(.*?)\*\*/g, '<b class="text-slate-900">$1</b>') }}
              />
              <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">{act.time}</p>
            </div>
          </div>
        ))}
        {activities.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-30">
            <Activity size={24} className="mb-2" />
            <p className="text-[10px] font-bold uppercase tracking-widest">Belum ada aktivitas</p>
          </div>
        )}
      </div>

      {onViewAll && (
        <button 
          onClick={onViewAll}
          className="mt-5 w-full py-2 bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
        >
          Lihat Monitoring <ArrowRight size={10} />
        </button>
      )}
    </div>
  )
}
