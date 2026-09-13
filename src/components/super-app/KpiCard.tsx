"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KpiCardProps {
  icon: React.ReactNode
  label: string
  value: number
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
  trendLabel?: string
  accentColor?: string // tailwind bg class e.g. 'bg-emerald-50'
  accentText?: string  // tailwind text class e.g. 'text-emerald-700'
  accentBorder?: string
  delay?: number
}

export default function KpiCard({
  icon,
  label,
  value,
  subtitle,
  trend = 'neutral',
  trendLabel,
  accentColor = 'bg-blue-50',
  accentText = 'text-blue-700',
  accentBorder = 'border-blue-100',
  delay = 0,
}: KpiCardProps) {
  const trendIcon = trend === 'up' 
    ? <TrendingUp size={12} /> 
    : trend === 'down' 
      ? <TrendingDown size={12} /> 
      : <Minus size={12} />
  
  const trendColor = trend === 'up' 
    ? 'text-emerald-600 bg-emerald-50' 
    : trend === 'down' 
      ? 'text-red-500 bg-red-50' 
      : 'text-slate-400 bg-slate-50'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.1 }}
      className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden group"
    >
      {/* Shimmer accent on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none translate-x-[-200%] group-hover:translate-x-[200%]" style={{ transition: 'transform 0.7s ease-in-out, opacity 0.3s' }} />
      
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 flex-1 min-w-0">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block truncate">
            {label}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
              {value.toLocaleString('id-ID')}
            </span>
            {subtitle && (
              <span className="text-xs font-semibold text-gray-400 truncate">{subtitle}</span>
            )}
          </div>
          {trendLabel && (
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${trendColor}`}>
              {trendIcon}
              <span>{trendLabel}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${accentColor} ${accentText} ${accentBorder} border flex-shrink-0`}>
          {icon}
        </div>
      </div>
    </motion.div>
  )
}
