"use client"
import { useEffect, useRef } from 'react'
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
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [activities])

  return (
    <div className="bg-white dark:bg-[#1C2541]/80 backdrop-blur-md rounded-2xl p-5 border border-slate-200 dark:border-blue-500/30 shadow-sm dark:shadow-[0_0_20px_rgba(59,130,246,0.15)] flex flex-col h-full transition-all duration-500">
      <div className="flex items-center justify-between mb-5">
        <div className="space-y-0.5">
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight italic">LIVE ACTIVITY STREAM</h3>
          <p className="text-[9px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest">Pusat Komando Real-time</p>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 bg-rose-500/10 rounded-lg animate-pulse border border-rose-500/20">
          <div className="w-1 h-1 bg-rose-500 rounded-full" />
          <span className="text-[7px] font-black text-rose-600 dark:text-rose-400 uppercase">Live</span>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto max-h-[320px] pr-2 scrollbar-hide"
      >
        {activities.map((act, i) => (
          <div 
            key={act.id} 
            className="flex gap-3 group animate-in fade-in slide-in-from-right-4 duration-500" 
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className={`mt-1.5 w-1 h-4 rounded-full shrink-0 ${
              act.type === 'success' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 
              act.type === 'warning' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 
              'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]'
            }`} />
            <div className="space-y-1">
              <p 
                className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium"
                dangerouslySetInnerHTML={{ __html: act.text.replace(/\*\*(.*?)\*\*/g, '<b class="text-slate-900 dark:text-slate-100">$1</b>') }}
              />
              <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{act.time}</p>
            </div>
          </div>
        ))}
        {activities.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-20">
            <Activity size={24} className="mb-2 text-slate-400 dark:text-slate-500" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Belum ada aktivitas</p>
          </div>
        )}
      </div>

      {onViewAll && (
        <button 
          onClick={onViewAll}
          className="mt-5 w-full py-2 bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-600/20 text-slate-500 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 relative z-10 border border-slate-200 dark:border-slate-700 hover:border-blue-500/50"
        >
          Lihat Monitoring <ArrowRight size={10} />
        </button>
      )}
    </div>
  )
}
