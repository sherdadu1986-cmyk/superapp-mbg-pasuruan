"use client"
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutGrid, 
  MapPin, 
  BookOpen, 
  Users, 
  UtensilsCrossed, 
  Camera 
} from 'lucide-react'

export interface SidebarProps {
  className?: string
  onItemClick?: () => void
}

export function Sidebar({ className = '', onItemClick }: SidebarProps) {
  const pathname = usePathname()

  const menuSections = [
    {
      title: 'MENU',
      items: [
        { 
          name: 'Beranda', 
          icon: <LayoutGrid size={18} />, 
          path: '/',
          active: pathname === '/'
        }
      ]
    },
    {
      title: 'REFERENSI',
      items: [
        { 
          name: 'Profil SPPG', 
          icon: <MapPin size={18} />, 
          path: '/sppg',
          active: pathname === '/sppg'
        },
        { 
          name: 'Kelompok Penerima Manfaat', 
          icon: <BookOpen size={18} className="text-emerald-600" />, 
          path: '/kelompok-penerima-manfaat',
          active: pathname === '/kelompok-penerima-manfaat'
        },
        { 
          name: 'Data Relawan SPPG', 
          icon: <Users size={18} className="text-blue-600" />, 
          path: '/data-relawan-sppg',
          active: pathname === '/data-relawan-sppg'
        }
      ]
    },
    {
      title: 'OPERASIONAL',
      items: [
        {
          name: 'Kelola Menu Harian',
          icon: <UtensilsCrossed size={18} className="text-amber-600" />,
          path: '/kelola-menu-harian',
          active: pathname === '/kelola-menu-harian' || pathname === '/kelola-menu'
        },
        {
          name: 'Dokumentasi Timemark',
          icon: <Camera size={18} className="text-purple-600" />,
          path: '/foto-timemark',
          active: pathname === '/foto-timemark'
        }
      ]
    }
  ]

  return (
    <aside className={`flex flex-col h-full bg-white/40 backdrop-blur-2xl border-r border-white/50 text-slate-700 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] ${className}`}>
      {/* Brand Header */}
      <div className="p-3.5 border-b border-white/50 flex items-center gap-2.5">
        <img
          src="/logo-bgn.png"
          alt="BGN"
          className="h-9 w-9 object-contain shrink-0"
          onError={(e) => { e.currentTarget.src = '/favicon.ico' }}
        />
        <div className="flex flex-col">
          <span className="font-bold text-sm leading-tight text-slate-800">
            BGN
          </span>
          <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap">
            Manajemen Penerima Manfaat
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
        {menuSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1.5">
            <div className="px-3 pb-1 pt-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                {section.title}
              </span>
            </div>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = item.active || (item.path === '/' ? pathname === '/' : pathname.startsWith(item.path))
                return (
                  <Link
                    key={item.name}
                    href={item.path}
                    onClick={onItemClick}
                    className={`group relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                      isActive 
                        ? 'bg-white/95 shadow-xs text-blue-600 font-bold border border-white/90 backdrop-blur-md' 
                        : 'text-slate-700 hover:bg-white/60 hover:text-blue-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`shrink-0 transition-transform duration-200 ${isActive ? 'text-blue-600 scale-110' : 'text-slate-500 group-hover:text-blue-600 group-hover:scale-105'}`}>
                        {item.icon}
                      </span>
                      <span className="truncate">{item.name}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}

export default Sidebar
