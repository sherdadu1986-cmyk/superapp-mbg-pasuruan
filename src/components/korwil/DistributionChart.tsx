"use client"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { Loader2 } from 'lucide-react'

interface DistributionChartProps {
  data: any[]
  loading: boolean
  isDarkMode?: boolean
}

export default function DistributionChart({ data, loading, isDarkMode = true }: DistributionChartProps) {
  if (loading) {
    return (
      <div className="h-[300px] flex flex-col items-center justify-center space-y-3">
        <Loader2 size={32} className="text-blue-500 animate-spin" />
        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest animate-pulse">Sinkronisasi Data...</p>
      </div>
    )
  }

  const axisColor = isDarkMode ? '#64748b' : '#94a3b8'
  const gridColor = isDarkMode ? '#1e293b' : '#f1f5f9'
  const tooltipBg = isDarkMode ? '#1C2541' : '#ffffff'
  const tooltipBorder = isDarkMode ? '#334155' : '#e2e8f0'
  const targetStroke = isDarkMode ? '#334155' : '#cbd5e1'

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
          <defs>
            <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
          <XAxis 
            dataKey="tgl" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 9, fontWeight: 700, fill: axisColor }} 
            dy={10} 
          />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: axisColor }} />
          <Tooltip
            contentStyle={{ backgroundColor: tooltipBg, borderRadius: '12px', border: `1px solid ${tooltipBorder}`, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '10px' }}
            labelStyle={{ fontWeight: 900, fontSize: '10px', marginBottom: '4px', color: isDarkMode ? '#F1F5F9' : '#1e293b' }}
            itemStyle={{ fontSize: '10px', padding: '0', color: isDarkMode ? '#94A3B8' : '#64748b' }}
          />
          <Area type="monotone" dataKey="target" stroke={targetStroke} strokeWidth={1} fill="transparent" strokeDasharray="5 5" />
          <Area type="monotone" dataKey="realisasi" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorReal)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
