"use client"
import React from 'react'
import { motion } from 'framer-motion'

interface Tab {
  key: string
  label: string
  count?: number
}

interface FilterTabsProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (key: string) => void
}

export default function FilterTabs({ tabs, activeTab, onTabChange }: FilterTabsProps) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`relative px-3.5 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer whitespace-nowrap ${
              isActive
                ? 'text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 bg-gray-50'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeFilterTab"
                className="absolute inset-0 bg-slate-800 rounded-lg"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {tab.label}
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
