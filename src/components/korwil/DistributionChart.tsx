"use client"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { Loader2 } from 'lucide-react'

interface DistributionChartProps {
  data: any[]
  loading: boolean
}

export default function DistributionChart({ data, loading }: DistributionChartProps) {
  if (loading) {
    return (
      <div className="h-[300px] flex flex-col items-center justify-center space-y-3">
        <Loader2 size={32} className="text-indigo-500 animate-spin" />
        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest animate-pulse">Memuat Grafik...</p>
      </div>
    )
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
          <defs>
            <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F8FAFC" />
          <XAxis 
            dataKey="tgl" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 9, fontWeight: 700, fill: '#CBD5E1' }} 
            dy={10} 
          />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#CBD5E1' }} />
          <Tooltip
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '10px' }}
            labelStyle={{ fontWeight: 900, fontSize: '10px', marginBottom: '4px', color: '#1E293B' }}
            itemStyle={{ fontSize: '10px', padding: '0' }}
          />
          <Area type="monotone" dataKey="target" stroke="#E2E8F0" strokeWidth={1} fill="transparent" />
          <Area type="monotone" dataKey="realisasi" stroke="#4F46E5" strokeWidth={2} fillOpacity={1} fill="url(#colorReal)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
