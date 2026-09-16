"use client"
import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutGrid, 
  MapPin, 
  BookOpen, 
  Users, 
  ClipboardCheck, 
  FileText, 
  User, 
  Menu, 
  X,
  ChevronDown,
  UtensilsCrossed,
  Tv
} from 'lucide-react'
import KioskModeDisplay from '@/components/KioskModeDisplay'

interface SubMenuItem {
  name: string;
  path: string;
}

interface MenuItem {
  name: string;
  icon: React.ReactNode;
  path?: string;
  submenus?: SubMenuItem[];
  active?: boolean;
  disabled?: boolean;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

function BgnLogo() {
  return (
    <div className="flex items-center gap-2">
      <img
        src="/logo-bgn.png"
        alt="Badan Gizi Nasional"
        className="h-9 w-9 object-contain shrink-0"
        onError={(e) => {
          const target = e.currentTarget
          if (!target.src.includes('favicon')) {
            target.src = '/favicon.ico'
          }
        }}
      />
      <div className="flex flex-col">
        <span className="font-bold text-sm leading-tight text-slate-800">
          BGN
        </span>
        <span className="text-[11px] text-slate-500 font-medium">
          Manajemen Penerima Manfaat
        </span>
      </div>
    </div>
  )
}

export default function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({})
  const [isKioskOpen, setIsKioskOpen] = useState(false)

  const menuSections: MenuSection[] = [
    {
      title: 'MENU',
      items: [
        { 
          name: 'Beranda', 
          icon: <LayoutGrid size={17} />, 
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
          icon: <MapPin size={17} />, 
          path: '/sppg',
          active: pathname === '/sppg'
        },
        { 
          name: 'Kelompok Penerima Manfaat', 
          icon: <BookOpen size={17} className="text-emerald-600" />, 
          path: '/kelompok-penerima-manfaat',
          active: pathname === '/kelompok-penerima-manfaat'
        },
        { 
          name: 'Data Relawan SPPG', 
          icon: <Users size={17} className="text-blue-600" />, 
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
          icon: <UtensilsCrossed size={17} className="text-amber-600" />,
          path: '/kelola-menu-harian',
          active: pathname === '/kelola-menu-harian' || pathname === '/kelola-menu'
        }
      ]
    }
  ]

  const toggleSubmenu = (name: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [name]: !prev[name]
    }))
  }

  const renderMenuItem = (item: MenuItem) => {
    const isExplicitActive = item.active || (item.path === '/' ? pathname === '/' : item.path && pathname.startsWith(item.path) && item.path !== '#')
    const hasSubmenus = !!item.submenus
    const isExpanded = openSubmenus[item.name]
    const isDisabled = !!item.disabled

    if (isDisabled) {
      return (
        <div
          key={item.name}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-gray-400 opacity-60 cursor-not-allowed select-none"
        >
          <div className="flex items-center gap-3">
            <span>{item.icon}</span>
            <span>{item.name}</span>
          </div>
        </div>
      )
    }

    if (hasSubmenus) {
      const isAnySubActive = item.submenus?.some(sub => pathname.startsWith(sub.path))
      return (
        <div key={item.name} className="space-y-1">
          <button
            onClick={() => toggleSubmenu(item.name)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition duration-150 cursor-pointer ${
              isAnySubActive 
                ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-100' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={isAnySubActive ? 'text-emerald-600' : 'text-gray-500'}>{item.icon}</span>
              <span>{item.name}</span>
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.15 }}
            >
              <ChevronDown size={14} className="text-gray-400" />
            </motion.div>
          </button>

          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden pl-7 space-y-1"
              >
                {item.submenus!.map((sub) => {
                  const isSubActive = pathname === sub.path || pathname.startsWith(sub.path)
                  return (
                    <Link
                      key={sub.path}
                      href={sub.path}
                      onClick={() => setMobileOpen(false)}
                      className={`block px-3 py-1.5 rounded-md text-[11px] font-medium transition duration-150 ${
                        isSubActive 
                          ? 'text-emerald-700 font-semibold bg-emerald-50/80' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {sub.name}
                    </Link>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )
    }

    return (
      <Link
        key={item.name}
        href={item.path || '#'}
        onClick={() => setMobileOpen(false)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition duration-200 ${
          isExplicitActive 
            ? 'bg-white/90 shadow-xs text-blue-600 font-bold border border-white/80 backdrop-blur-md' 
            : 'text-slate-700 hover:bg-white/50 hover:text-blue-600'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className={isExplicitActive ? 'text-blue-600' : 'text-slate-500'}>{item.icon}</span>
          <span>{item.name}</span>
        </div>
      </Link>
    )
  }

  const renderSidebarContents = () => (
    <div className="flex flex-col h-full bg-white/40 backdrop-blur-2xl border-r border-white/50 text-slate-700 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)]">
      {/* Sidebar Nav Sections */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6 scrollbar-thin">
        {menuSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1.5">
            <div className="px-3 pb-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                {section.title}
              </span>
            </div>
            <div className="space-y-1">
              {section.items.map((item) => renderMenuItem(item))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e0e7ff] via-[#f1f5f9] to-[#dbeafe] relative flex flex-col font-sans print:bg-white print:min-h-0 overflow-x-hidden">
      {/* Background Mesh Gradient Glow Accents */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-purple-300/30 rounded-full blur-3xl pointer-events-none no-print print:hidden" />
      <div className="fixed top-1/3 -right-40 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl pointer-events-none no-print print:hidden" />
      <div className="fixed -bottom-40 left-1/3 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl pointer-events-none no-print print:hidden" />

      {/* Header Top Navbar (Glassmorphism - Hidden on print) */}
      <header className="no-print print:hidden bg-white/60 backdrop-blur-xl border-b border-white/50 h-16 px-4 lg:px-6 flex items-center justify-between sticky top-0 z-40 shadow-[0_4px_20px_0_rgba(31,38,135,0.04)]">
        {/* Left Header: Mobile Toggle + Logo + App Title */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-1.5 text-slate-600 hover:bg-white/60 rounded-lg transition cursor-pointer"
          >
            <Menu size={20} />
          </button>
          
          <div className="flex items-center gap-2">
            <BgnLogo />
          </div>
        </div>

        {/* Right Header: Kiosk Mode Trigger + User Profile Badge */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined' && document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(() => {})
              }
              setIsKioskOpen(true)
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 hover:bg-white/90 border border-white/80 backdrop-blur-md shadow-xs transition-all duration-300 text-slate-800 font-semibold text-xs cursor-pointer active:scale-95"
            title="Buka Mode Presentasi TV Dinding"
          >
            <Tv size={15} className="text-blue-600 animate-pulse" />
            <span>Mode Layar TV</span>
          </button>

          <div className="flex items-center gap-2.5 bg-white/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/70 shadow-2xs">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center border border-white/80 shadow-xs flex-shrink-0">
              AS
            </div>
            <div className="hidden sm:block text-left">
              <h4 className="text-xs font-bold text-slate-900 leading-tight">
                AHMAD SAYYIDANI KH...
              </h4>
              <p className="text-[10px] text-slate-500 font-medium leading-tight">
                Kepala SPPG | SPPG PASURUAN WONOREJO ...
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body: Sidebar + Full Width Content */}
      <div className="flex-1 flex min-w-0 print:block z-10">
        {/* Desktop Sidebar (Glassmorphism rounded-r-3xl - Hidden on print) */}
        <aside className="no-print print:hidden hidden lg:block w-64 flex-shrink-0 border-r border-white/50 bg-white/40 backdrop-blur-2xl rounded-r-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] my-3 ml-2">
          {renderSidebarContents()}
        </aside>

        {/* Mobile Sidebar Overlay Drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
                className="no-print print:hidden fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-50 lg:hidden"
              />
              
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="no-print print:hidden fixed top-0 bottom-0 left-0 w-64 max-w-[80vw] z-50 lg:hidden bg-white/90 backdrop-blur-2xl h-full shadow-2xl"
              >
                <div className="p-4 border-b border-slate-200/60 flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800">Menu SIPGN</span>
                  <button 
                    onClick={() => setMobileOpen(false)}
                    className="p-1 text-slate-500 hover:bg-slate-100 rounded-md transition"
                  >
                    <X size={18} />
                  </button>
                </div>
                {renderSidebarContents()}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content Area (Full width, no tight max-w) */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 min-w-0 print:p-0 print:bg-white print:overflow-visible">
          {children}
        </main>
      </div>

      {/* Executive Kiosk TV Display Overlay Component */}
      <KioskModeDisplay
        isOpen={isKioskOpen}
        onClose={() => setIsKioskOpen(false)}
      />
    </div>
  )
}
