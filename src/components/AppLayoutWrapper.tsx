"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard, 
  ChefHat, 
  Boxes, 
  Users, 
  School, 
  ShieldCheck, 
  BarChart3, 
  Folder, 
  ChevronDown, 
  Menu, 
  X,
  User
} from 'lucide-react'

interface SubMenuItem {
  name: string;
  path: string;
}

interface MenuItem {
  name: string;
  icon: React.ReactNode;
  path?: string;
  submenus?: SubMenuItem[];
}

export default function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({})

  // Menu structure configuration
  const menuItems: MenuItem[] = [
    {
      name: 'Dashboard',
      icon: <LayoutDashboard size={20} />,
      path: '/'
    },
    {
      name: 'Operasional',
      icon: <ChefHat size={20} />,
      submenus: [
        { name: 'Jadwal Produksi', path: '/operasional/jadwal-produksi' },
        { name: 'Menu Harian', path: '/operasional/menu-harian' },
        { name: 'Kalkulator Bahan', path: '/operasional/kalkulator-bahan' },
        { name: 'Packing', path: '/operasional/packing' },
        { name: 'Distribusi', path: '/operasional/distribusi' }
      ]
    },
    {
      name: 'Gudang',
      icon: <Boxes size={20} />,
      submenus: [
        { name: 'Stok', path: '/gudang/stok' },
        { name: 'Pembelian', path: '/gudang/pembelian' },
        { name: 'Supplier', path: '/gudang/supplier' }
      ]
    },
    {
      name: 'SDM',
      icon: <Users size={20} />,
      submenus: [
        { name: 'Relawan', path: '/sdm/relawan' },
        { name: 'Absensi', path: '/sdm/absensi' },
        { name: 'Shift', path: '/sdm/shift' }
      ]
    },
    {
      name: 'Sekolah',
      icon: <School size={20} />,
      submenus: [
        { name: 'Data Sekolah', path: '/sekolah/data-sekolah' },
        { name: 'Rute', path: '/sekolah/rute' }
      ]
    },
    {
      name: 'Quality',
      icon: <ShieldCheck size={20} />,
      submenus: [
        { name: 'Checklist', path: '/quality/checklist' },
        { name: 'Food Safety', path: '/quality/food-safety' },
        { name: 'QC', path: '/quality/qc' }
      ]
    },
    {
      name: 'Laporan',
      icon: <BarChart3 size={20} />,
      path: '/laporan'
    },
    {
      name: 'Dokumen',
      icon: <Folder size={20} />,
      path: '/dokumen'
    }
  ]

  // Automatically expand parent submenus if child path is active on load
  useEffect(() => {
    const activeSubmenu: Record<string, boolean> = {}
    menuItems.forEach((item) => {
      if (item.submenus) {
        const hasActiveChild = item.submenus.some((sub) => pathname === sub.path)
        if (hasActiveChild) {
          activeSubmenu[item.name] = true
        }
      }
    })
    setOpenSubmenus((prev) => ({ ...prev, ...activeSubmenu }))
  }, [pathname])

  const toggleSubmenu = (name: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [name]: !prev[name]
    }))
  }

  const isMenuItemActive = (item: MenuItem) => {
    if (item.path) {
      return pathname === item.path
    }
    if (item.submenus) {
      return item.submenus.some((sub) => pathname === sub.path)
    }
    return false
  }

  // Sidebar contents rendering (to avoid code repetition between desktop and mobile sidebar)
  const renderSidebarContents = () => (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 text-slate-300">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3 bg-slate-950/40">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-500/20">
          🍽️
        </div>
        <div>
          <h2 className="font-extrabold text-white text-base leading-tight tracking-tight">Dapur SPPG</h2>
          <span className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase">Pasuruan Wonorejo</span>
        </div>
      </div>

      {/* Nav Items */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 scrollbar-thin">
        {menuItems.map((item) => {
          const isActive = isMenuItemActive(item)
          const hasSubmenus = !!item.submenus
          const isExpanded = openSubmenus[item.name]

          if (hasSubmenus) {
            return (
              <div key={item.name} className="space-y-1">
                <button
                  onClick={() => toggleSubmenu(item.name)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? 'text-white bg-slate-800/80' 
                      : 'hover:text-slate-100 hover:bg-slate-800/40 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-emerald-400' : ''}>{item.icon}</span>
                    <span>{item.name}</span>
                  </div>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={16} />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden pl-7 space-y-1"
                    >
                      {item.submenus!.map((sub) => {
                        const isSubActive = pathname === sub.path
                        return (
                          <Link
                            key={sub.path}
                            href={sub.path}
                            onClick={() => setMobileOpen(false)}
                            className={`block px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                              isSubActive 
                                ? 'text-emerald-400 font-extrabold bg-emerald-950/30' 
                                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
                            }`}
                          >
                            • {sub.name}
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
              href={item.path!}
              onClick={() => setMobileOpen(false)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive 
                  ? 'text-white bg-emerald-600 font-bold shadow-md shadow-emerald-600/10' 
                  : 'hover:text-slate-100 hover:bg-slate-800/40 text-slate-400'
              }`}
            >
              <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          )
        })}
      </div>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
          <User size={18} />
        </div>
        <div className="flex-1 overflow-hidden">
          <h4 className="text-sm font-bold text-white truncate">Admin Dapur</h4>
          <span className="text-[10px] text-slate-500 font-medium">Pasuruan Wonorejo</span>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Desktop Sidebar (Left side, fixed width) */}
      <aside className="hidden lg:block w-72 flex-shrink-0 h-screen sticky top-0">
        {renderSidebarContents()}
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-slate-900 text-white shadow-md z-40 sticky top-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍽️</span>
            <div>
              <h1 className="font-extrabold text-sm leading-none">Dapur SPPG</h1>
              <span className="text-[9px] text-emerald-400 uppercase font-black">Pasuruan Wonorejo</span>
            </div>
          </div>
          <button 
            onClick={() => setMobileOpen(true)}
            className="p-2 hover:bg-slate-800 rounded-xl transition duration-150 cursor-pointer"
          >
            <Menu size={20} />
          </button>
        </header>

        {/* Mobile Sidebar Navigation Drawer Overlay */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              {/* Backdrop Overlay */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 lg:hidden"
              />
              
              {/* Sidebar Content Panel */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 bottom-0 left-0 w-72 max-w-[85vw] z-50 shadow-2xl lg:hidden h-full"
              >
                <div className="absolute top-4 right-4 z-50">
                  <button 
                    onClick={() => setMobileOpen(false)}
                    className="p-2 text-white bg-slate-950/40 hover:bg-slate-950/60 rounded-full transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
                {renderSidebarContents()}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Contents Window */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
