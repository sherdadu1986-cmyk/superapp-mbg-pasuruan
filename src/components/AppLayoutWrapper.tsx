"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
  LogOut,
  Eye,
  AlertCircle,
  Truck
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

interface UserAccount {
  name: string;
  role: string;
  initials: string;
}

type AccessType = 'full' | 'readonly' | 'hidden';

// RBAC access decision engine
export function getPathAccess(role: string, path: string): AccessType {
  if (!role) return 'hidden';
  
  // Kepala SPPG has full access to everything
  if (role === 'Kepala SPPG') return 'full';

  // Root path is the work dashboard for everyone
  if (path === '/') return 'full';

  // Akuntan Allowed Paths
  if (role === 'Akuntan') {
    if (path.includes('/pembelian') || path.includes('/supplier') || path === '/dokumen') {
      return 'full';
    }
    return 'hidden';
  }

  // Ahli Gizi Allowed Paths
  if (role === 'Ahli Gizi') {
    if (path.includes('/menu-harian') || path.includes('/kalkulator-bahan') || path === '/laporan') {
      return 'full';
    }
    return 'hidden';
  }

  // Aslap Allowed Paths
  if (role === 'Aslap') {
    if (path.includes('/checklist') || path.includes('/packing') || path === '/dokumen' || path === '/laporan') {
      return 'full';
    }
    return 'hidden';
  }

  // Keamanan Allowed Paths
  if (role === 'Keamanan') {
    if (path === '/') {
      return 'full';
    }
    return 'hidden';
  }

  return 'hidden';
}

export default function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({})
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch active user on mount and every pathname change to keep it reactive
  useEffect(() => {
    const storedUser = localStorage.getItem('sppg_user')
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser))
    } else if (!pathname.startsWith('/login')) {
      router.push('/login')
    }
    setLoading(false)
  }, [pathname, router])

  // Pruned menus according to role
  const getMenuItemsForRole = (role: string): MenuItem[] => {
    if (role === 'Kepala SPPG') {
      return [
        { name: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/' },
        {
          name: 'Operasional',
          icon: <ChefHat size={18} />,
          submenus: [
            { name: 'Produksi', path: '/operasional/jadwal-produksi' },
            { name: 'Distribusi', path: '/operasional/distribusi' }
          ]
        },
        {
          name: 'Gudang',
          icon: <Boxes size={18} />,
          submenus: [
            { name: 'Stok', path: '/gudang/stok' },
            { name: 'Pembelian', path: '/gudang/pembelian' },
            { name: 'Supplier', path: '/gudang/supplier' }
          ]
        },
        {
          name: 'SDM',
          icon: <Users size={18} />,
          submenus: [
            { name: 'Relawan', path: '/sdm/relawan' },
            { name: 'Absensi', path: '/sdm/absensi' },
            { name: 'Shift', path: '/sdm/shift' }
          ]
        },
        {
          name: 'Sekolah',
          icon: <School size={18} />,
          submenus: [
            { name: 'Data Sekolah', path: '/sekolah/data-sekolah' },
            { name: 'Rute', path: '/sekolah/rute' }
          ]
        },
        {
          name: 'Quality',
          icon: <ShieldCheck size={18} />,
          submenus: [
            { name: 'Checklist', path: '/quality/checklist' },
            { name: 'Food Safety', path: '/quality/food-safety' },
            { name: 'QC', path: '/quality/qc' }
          ]
        },
        { name: 'Keuangan', icon: <BarChart3 size={18} />, path: '/laporan' },
        { name: 'Laporan', icon: <BarChart3 size={18} />, path: '/laporan' },
        { name: 'Dokumen', icon: <Folder size={18} />, path: '/dokumen' },
        { name: 'Pengaturan', icon: <Users size={18} />, path: '/sdm/shift' }
      ]
    }
    
    if (role === 'Akuntan') {
      return [
        { name: 'Pembelian', icon: <Boxes size={18} />, path: '/gudang/pembelian' },
        { name: 'Supplier', icon: <Boxes size={18} />, path: '/gudang/supplier' },
        { name: 'Pengeluaran', icon: <BarChart3 size={18} />, path: '/' },
        { name: 'Invoice', icon: <Folder size={18} />, path: '/dokumen' },
        { name: 'Riwayat', icon: <Folder size={18} />, path: '/dokumen' },
        { name: 'Profil', icon: <Users size={18} />, path: '/' }
      ]
    }

    if (role === 'Ahli Gizi') {
      return [
        { name: 'Menu Hari Ini', icon: <ChefHat size={18} />, path: '/' },
        { name: 'Resep', icon: <ChefHat size={18} />, path: '/operasional/menu-harian' },
        { name: 'Nilai Gizi', icon: <ChefHat size={18} />, path: '/operasional/kalkulator-bahan' },
        { name: 'Riwayat', icon: <Folder size={18} />, path: '/laporan' },
        { name: 'Profil', icon: <Users size={18} />, path: '/' }
      ]
    }

    if (role === 'Aslap') {
      return [
        { name: 'Checklist', icon: <ShieldCheck size={18} />, path: '/quality/checklist' },
        { name: 'Packing', icon: <ChefHat size={18} />, path: '/operasional/packing' },
        { name: 'Distribusi', icon: <Truck size={18} />, path: '/' },
        { name: 'Dokumentasi', icon: <Folder size={18} />, path: '/dokumen' },
        { name: 'Riwayat', icon: <Folder size={18} />, path: '/laporan' },
        { name: 'Profil', icon: <Users size={18} />, path: '/' }
      ]
    }

    if (role === 'Keamanan') {
      return [
        { name: 'Absensi Relawan', icon: <Users size={18} />, path: '/' },
        { name: 'Profil', icon: <Users size={18} />, path: '/' }
      ]
    }

    return []
  }

  const userRole = currentUser?.role || ''
  const filteredMenuItems = getMenuItemsForRole(userRole)

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

  const handleLogout = () => {
    localStorage.removeItem('sppg_user')
    setCurrentUser(null)
    router.push('/login')
  }

  const renderSidebarContents = () => (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 text-slate-300">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3 bg-slate-950/40">
        <div className="w-10 h-10 rounded bg-emerald-900 flex items-center justify-center text-white font-black text-lg border border-emerald-800">
          🍽️
        </div>
        <div>
          <h2 className="font-extrabold text-white text-sm leading-tight tracking-tight">Dapur SPPG</h2>
          <span className="text-[9px] font-bold text-emerald-400 tracking-wider uppercase">Pasuruan Wonorejo</span>
        </div>
      </div>

      {/* Nav Items */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1 scrollbar-thin">
        {filteredMenuItems.map((item) => {
          const isActive = isMenuItemActive(item)
          const hasSubmenus = !!item.submenus
          const isExpanded = openSubmenus[item.name]

          if (hasSubmenus) {
            return (
              <div key={item.name} className="space-y-1">
                <button
                  onClick={() => toggleSubmenu(item.name)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-bold transition duration-150 cursor-pointer ${
                    isActive 
                      ? 'text-white bg-slate-800' 
                      : 'hover:text-slate-100 hover:bg-slate-800/40 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={isActive ? 'text-emerald-400' : ''}>{item.icon}</span>
                    <span>{item.name}</span>
                  </div>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <ChevronDown size={14} />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden pl-6 space-y-1"
                    >
                      {item.submenus!.map((sub) => {
                        const isSubActive = pathname === sub.path
                        return (
                          <Link
                            key={sub.path}
                            href={sub.path}
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center justify-between px-3 py-1.5 rounded text-[11px] font-bold transition duration-150 ${
                              isSubActive 
                                ? 'text-emerald-400 bg-emerald-950/40' 
                                : 'text-slate-550 hover:text-slate-300 hover:bg-slate-800/20'
                            }`}
                          >
                            <span>• {sub.name}</span>
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
              className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-bold transition duration-150 ${
                isActive 
                  ? 'text-white bg-emerald-900 border border-emerald-950' 
                  : 'hover:text-slate-100 hover:bg-slate-800/40 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </div>
            </Link>
          )
        })}
      </div>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded bg-emerald-900 flex items-center justify-center text-white font-extrabold text-xs flex-shrink-0">
            {currentUser?.initials || 'U'}
          </div>
          <div className="flex-1 overflow-hidden">
            <h4 className="text-[11px] font-bold text-white truncate leading-tight" title={currentUser?.name}>
              {currentUser?.name || 'Guest'}
            </h4>
            <span className="text-[9px] text-emerald-400 font-bold uppercase">{currentUser?.role || 'Guest'}</span>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          title="Keluar dari Sistem"
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition duration-150 cursor-pointer flex-shrink-0"
        >
          <LogOut size={14} />
        </button>
      </div>
    </div>
  )

  // Bypass layout wrapper fully on all /login/* pages
  if (pathname.startsWith('/login')) {
    return <div className="min-h-screen bg-gray-50">{children}</div>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-900"></div>
      </div>
    )
  }

  if (!currentUser) {
    return <div className="min-h-screen bg-[#F8FAFC]"></div>
  }

  // Check RBAC access
  const currentAccess = getPathAccess(userRole, pathname)

  if (currentAccess === 'hidden') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 text-center font-sans">
        <div className="bg-white border border-gray-200 rounded p-6 max-w-sm space-y-4">
          <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto text-lg font-bold border border-red-100">
            ⚠️
          </div>
          <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Akses Terbatas</h1>
          <p className="text-xs text-gray-500 font-semibold">
            Peran Anda ({currentUser?.role}) tidak diizinkan untuk mengakses modul <span className="font-bold text-slate-700">{pathname}</span>.
          </p>
          <button 
            onClick={() => router.push('/')}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-950 text-white text-[10px] font-bold uppercase rounded transition duration-150 cursor-pointer border border-slate-950"
          >
            Kembali ke Beranda Kerja
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0 h-screen sticky top-0">
        {renderSidebarContents()}
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-slate-900 text-white shadow z-40 sticky top-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">🍽️</span>
            <div>
              <h1 className="font-extrabold text-xs leading-none">Dapur SPPG</h1>
              <span className="text-[8px] text-emerald-400 uppercase font-black">Wonorejo</span>
            </div>
          </div>
          <button 
            onClick={() => setMobileOpen(true)}
            className="p-2 hover:bg-slate-800 rounded transition duration-150 cursor-pointer"
          >
            <Menu size={18} />
          </button>
        </header>

        {/* Mobile Sidebar Navigation Drawer Overlay */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 lg:hidden"
              />
              
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 bottom-0 left-0 w-64 max-w-[80vw] z-50 lg:hidden h-full"
              >
                <div className="absolute top-4 right-4 z-50">
                  <button 
                    onClick={() => setMobileOpen(false)}
                    className="p-1.5 text-white bg-slate-950/40 hover:bg-slate-950/60 rounded-full transition cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
                {renderSidebarContents()}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Contents Window Flat Background */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-6xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
