"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutGrid, 
  MapPin, 
  BookOpen, 
  Users, 
  Menu, 
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  UtensilsCrossed,
  Tv,
  PanelLeftClose,
  PanelLeftOpen
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

function BgnLogo({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex items-center justify-center">
        <img
          src="/logo-bgn.png"
          alt="BGN"
          className="h-8 w-8 object-contain shrink-0"
          onError={(e) => {
            const target = e.currentTarget
            if (!target.src.includes('favicon')) {
              target.src = '/favicon.ico'
            }
          }}
        />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2.5">
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
        <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap">
          Manajemen Penerima Manfaat
        </span>
      </div>
    </div>
  )
}

export default function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({})
  const [isKioskOpen, setIsKioskOpen] = useState(false)

  // Load saved sidebar state preference from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('mbg_sidebar_state')
      if (savedState === 'collapsed') {
        setIsCollapsed(true)
      }
    }
  }, [])

  const toggleSidebarCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev
      if (typeof window !== 'undefined') {
        localStorage.setItem('mbg_sidebar_state', next ? 'collapsed' : 'expanded')
      }
      return next
    })
  }

  const menuSections: MenuSection[] = [
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

  const renderMenuItem = (item: MenuItem, forceExpanded = false) => {
    const collapsedMode = isCollapsed && !forceExpanded
    const isExplicitActive = item.active || (item.path === '/' ? pathname === '/' : item.path && pathname.startsWith(item.path) && item.path !== '#')
    const hasSubmenus = !!item.submenus
    const isExpanded = openSubmenus[item.name]
    const isDisabled = !!item.disabled

    if (isDisabled) {
      return (
        <div
          key={item.name}
          className={`w-full flex items-center ${collapsedMode ? 'justify-center px-2 py-2.5' : 'gap-3 px-3.5 py-2.5'} rounded-xl text-xs font-medium text-gray-400 opacity-60 cursor-not-allowed select-none`}
        >
          <span>{item.icon}</span>
          {!collapsedMode && <span>{item.name}</span>}
        </div>
      )
    }

    if (hasSubmenus) {
      const isAnySubActive = item.submenus?.some(sub => pathname.startsWith(sub.path))
      return (
        <div key={item.name} className="space-y-1">
          <button
            onClick={() => toggleSubmenu(item.name)}
            title={collapsedMode ? item.name : undefined}
            className={`group relative w-full flex items-center ${
              collapsedMode ? 'justify-center px-2 py-2.5' : 'justify-between px-3.5 py-2.5'
            } rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
              isAnySubActive 
                ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-100' 
                : 'text-slate-700 hover:bg-white/60 hover:text-blue-600'
            }`}
          >
            <div className={`flex items-center ${collapsedMode ? 'justify-center' : 'gap-3'}`}>
              <span className={isAnySubActive ? 'text-emerald-600' : 'text-slate-500'}>{item.icon}</span>
              {!collapsedMode && <span>{item.name}</span>}
            </div>
            {!collapsedMode && (
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.15 }}
              >
                <ChevronDown size={14} className="text-slate-400" />
              </motion.div>
            )}

            {collapsedMode && (
              <div className="fixed left-24 px-2.5 py-1 bg-slate-900/90 text-white text-[11px] font-semibold rounded-lg shadow-xl backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                {item.name}
              </div>
            )}
          </button>

          {!collapsedMode && (
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
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        {sub.name}
                      </Link>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      )
    }

    return (
      <Link
        key={item.name}
        href={item.path || '#'}
        onClick={() => setMobileOpen(false)}
        title={collapsedMode ? item.name : undefined}
        className={`group relative w-full flex items-center ${
          collapsedMode ? 'justify-center px-2 py-2.5' : 'justify-between px-3.5 py-2.5'
        } rounded-xl text-xs font-medium transition-all duration-200 ${
          isExplicitActive 
            ? 'bg-white/95 shadow-xs text-blue-600 font-bold border border-white/90 backdrop-blur-md' 
            : 'text-slate-700 hover:bg-white/60 hover:text-blue-600'
        }`}
      >
        <div className={`flex items-center ${collapsedMode ? 'justify-center' : 'gap-3'}`}>
          <span className={`shrink-0 transition-transform duration-200 ${isExplicitActive ? 'text-blue-600 scale-110' : 'text-slate-500 group-hover:text-blue-600 group-hover:scale-105'}`}>
            {item.icon}
          </span>
          {!collapsedMode && (
            <span className="truncate transition-opacity duration-300">{item.name}</span>
          )}
        </div>

        {/* Floating Tooltip when Collapsed */}
        {collapsedMode && (
          <div className="fixed left-24 px-2.5 py-1 bg-slate-900/90 text-white text-[11px] font-semibold rounded-lg shadow-xl backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
            {item.name}
          </div>
        )}
      </Link>
    )
  }

  const renderSidebarContents = (forceExpanded = false) => {
    const collapsedMode = isCollapsed && !forceExpanded
    return (
      <div className="flex flex-col h-full bg-white/40 backdrop-blur-2xl border-r border-white/50 text-slate-700 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)]">
        {/* Sidebar Nav Header Toggle */}
        <div className={`p-3.5 border-b border-white/50 flex items-center ${collapsedMode ? 'justify-center' : 'justify-between'}`}>
          {!collapsedMode ? (
            <BgnLogo />
          ) : (
            <button
              onClick={toggleSidebarCollapse}
              className="p-1 hover:bg-white/60 rounded-lg transition"
              title="Klik untuk membuka sidebar"
            >
              <BgnLogo compact />
            </button>
          )}

          {!forceExpanded && (
            <button
              type="button"
              onClick={toggleSidebarCollapse}
              className="hidden lg:flex items-center justify-center p-1.5 rounded-xl bg-white/70 hover:bg-white/95 border border-white/80 backdrop-blur-md shadow-xs text-slate-700 hover:text-blue-600 transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95"
              title={collapsedMode ? "Buka Sidebar (Lebar)" : "Kecilkan Sidebar"}
            >
              {collapsedMode ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
            </button>
          )}
        </div>

        {/* Sidebar Nav Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
          {menuSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1.5">
              {!collapsedMode ? (
                <div className="px-3 pb-1 pt-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                    {section.title}
                  </span>
                </div>
              ) : (
                <div className="my-2 border-t border-slate-200/50" />
              )}
              <div className="space-y-1">
                {section.items.map((item) => renderMenuItem(item, forceExpanded))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e0e7ff] via-[#f1f5f9] to-[#dbeafe] relative flex flex-col font-sans print:bg-white print:min-h-0 overflow-x-hidden">
      {/* Background Mesh Gradient Glow Accents */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-purple-300/30 rounded-full blur-3xl pointer-events-none no-print print:hidden" />
      <div className="fixed top-1/3 -right-40 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl pointer-events-none no-print print:hidden" />
      <div className="fixed -bottom-40 left-1/3 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl pointer-events-none no-print print:hidden" />

      {/* Header Top Navbar (Glassmorphism - Hidden on print) */}
      <header className="no-print print:hidden bg-white/60 backdrop-blur-xl border-b border-white/50 h-16 px-4 lg:px-6 flex items-center justify-between sticky top-0 z-40 shadow-[0_4px_20px_0_rgba(31,38,135,0.04)]">
        {/* Left Header: Mobile Toggle + Desktop Sidebar Toggle + Logo */}
        <div className="flex items-center gap-3">
          {/* Mobile Hamburger Drawer Button (Liquid Glass) */}
          <button 
            type="button"
            onClick={() => setMobileOpen(true)}
            className="lg:hidden px-2.5 py-2 rounded-xl bg-white/70 hover:bg-white/90 border border-white/80 backdrop-blur-md shadow-xs text-slate-700 transition-all duration-300 cursor-pointer active:scale-95 flex items-center justify-center"
            title="Buka Menu Navigation"
          >
            <Menu size={20} className="text-slate-800" />
          </button>

          {/* Desktop Toggle Button in Header (Liquid Glass) */}
          <button
            type="button"
            onClick={toggleSidebarCollapse}
            className="hidden lg:flex items-center justify-center px-2.5 py-2 rounded-xl bg-white/70 hover:bg-white/90 border border-white/80 backdrop-blur-md shadow-xs text-slate-700 hover:text-blue-600 transition-all duration-300 cursor-pointer active:scale-95"
            title={isCollapsed ? "Buka Sidebar (Lebar)" : "Kecilkan Sidebar"}
          >
            {isCollapsed ? <PanelLeftOpen size={19} className="text-blue-600" /> : <PanelLeftClose size={19} className="text-slate-700" />}
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
            <span className="hidden sm:inline">Mode Layar TV</span>
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
        <aside 
          className={`no-print print:hidden hidden lg:block flex-shrink-0 border-r border-white/50 bg-white/40 backdrop-blur-2xl rounded-r-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] my-3 ml-2 transition-all duration-300 ease-in-out ${
            isCollapsed ? 'w-20' : 'w-64'
          }`}
        >
          {renderSidebarContents()}
        </aside>

        {/* Mobile Sidebar Overlay Drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              {/* Backdrop Overlay */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
                className="no-print print:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 lg:hidden"
              />
              
              {/* Drawer Container */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="no-print print:hidden fixed top-0 bottom-0 left-0 w-72 max-w-[85vw] z-50 lg:hidden bg-white/95 backdrop-blur-2xl h-full shadow-2xl flex flex-col border-r border-white/60"
              >
                <div className="p-4 border-b border-slate-200/60 flex items-center justify-between bg-white/70">
                  <BgnLogo />
                  <button 
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {renderSidebarContents(true)}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content Area (Full width, auto-expands when sidebar collapses) */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 min-w-0 print:p-0 print:bg-white print:overflow-visible transition-all duration-300">
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
