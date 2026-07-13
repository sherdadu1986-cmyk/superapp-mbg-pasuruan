"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getLocalToday } from '@/lib/date'
import { useParams, useRouter, usePathname } from 'next/navigation'
import {
  LayoutDashboard, LogOut, Menu, Utensils, Store,
  CheckCircle2, School, Trash2, Plus, Edit3, Pencil, ClipboardList, Users,
  ChevronLeft, Calendar as CalendarIcon, AlertCircle, FileText, Hourglass, Sparkles, X
} from 'lucide-react'
import { useToast } from '@/components/toast'

export default function DashboardSPPGPage() {
  const { id } = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()

  // UI State
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'sekolah' | 'riwayat'>('sekolah')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Data State
  const [selectedUnit, setSelectedUnit] = useState<any>(null)
  const [listSekolah, setListSekolah] = useState<any[]>([])
  const [riwayat, setRiwayat] = useState<any[]>([])
  const [totalPM, setTotalPM] = useState(0)
  const [laporanHariIni, setLaporanHariIni] = useState<any>(null)

  // Tanggal Hari Ini (WIB)
  const todayISO = getLocalToday()
  const todayFormatted = new Date(todayISO + 'T12:00:00').toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  // Sapaan Dinamis berdasarkan jam WIB
  const jamWIB = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })).getHours()
  const sapaan = jamWIB >= 4 && jamWIB < 11 ? 'Selamat Pagi' : jamWIB >= 11 && jamWIB < 15 ? 'Selamat Siang' : jamWIB >= 15 && jamWIB < 18 ? 'Selamat Sore' : 'Selamat Malam'

  // Tanggal singkat untuk pesan status
  const todayShort = new Date(todayISO + 'T12:00:00').toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short'
  })

  // Form Tambah / Edit Sekolah
  const [newSekolah, setNewSekolah] = useState({ nama: '', jenjang: 'SD/MI', porsi_siswa: 0, porsi_siswa_1_3: 0, porsi_siswa_4_6: 0, porsi_guru: 0, porsi_tendik: 0, porsi_kader: 0 })
  const [editingId, setEditingId] = useState<string | null>(null)
  const isSD = newSekolah.jenjang === 'SD/MI'
  const totalPorsiNew = isSD
    ? newSekolah.porsi_siswa_1_3 + newSekolah.porsi_siswa_4_6 + newSekolah.porsi_guru + newSekolah.porsi_tendik + newSekolah.porsi_kader
    : newSekolah.porsi_siswa + newSekolah.porsi_guru + newSekolah.porsi_tendik + newSekolah.porsi_kader
  const KATEGORI_PM = ["PAUD/KB", "TK/RA", "SD/MI", "SMP/MTS", "SMA/SMK", "SLB", "SANTRI", "BALITA", "BUMIL", "BUSUI"]

  // Jenjang Pill Badge Color Map
  const jenjangColor: Record<string, string> = {
    'PAUD/KB': 'bg-violet-50 text-violet-700 border-violet-200',
    'TK/RA': 'bg-purple-50 text-purple-700 border-purple-200',
    'SD/MI': 'bg-blue-50 text-blue-700 border-blue-200',
    'SMP/MTS': 'bg-cyan-50 text-cyan-700 border-cyan-200',
    'SMA/SMK': 'bg-teal-50 text-teal-700 border-teal-200',
    'SLB': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'SANTRI': 'bg-amber-50 text-amber-700 border-amber-200',
    'BALITA': 'bg-pink-50 text-pink-700 border-pink-200',
    'BUMIL': 'bg-rose-50 text-rose-700 border-rose-200',
    'BUSUI': 'bg-orange-50 text-orange-700 border-orange-200',
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const { data: unit } = await supabase.from('daftar_sppg').select('*').eq('id', id).single()
      const { data: sekolah } = await supabase.from('daftar_sekolah').select('*').eq('sppg_id', id).order('id', { ascending: true })
      const { data: laporan } = await supabase.from('laporan_harian_final').select('*').eq('unit_id', id).order('tanggal_ops', { ascending: false })

      // Cek Laporan Hari Ini
      const checkToday = laporan?.find(l => l.tanggal_ops === todayISO)

      if (unit) setSelectedUnit(unit)
      if (checkToday) setLaporanHariIni(checkToday)
      if (sekolah) {
        setListSekolah(sekolah)
        const total = sekolah.reduce((acc, curr) => acc + (Number(curr.target_porsi) || 0), 0)
        setTotalPM(total)
      }
      if (laporan) setRiwayat(laporan)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (id) loadData() }, [id])

  const resetForm = () => {
    setNewSekolah({ nama: '', jenjang: 'SD/MI', porsi_siswa: 0, porsi_siswa_1_3: 0, porsi_siswa_4_6: 0, porsi_guru: 0, porsi_tendik: 0, porsi_kader: 0 })
    setEditingId(null)
  }

  const handleAddSekolah = async () => {
    if (!newSekolah.nama || totalPorsiNew <= 0) return toast('warning', 'Lengkapi Data', 'Nama & minimal 1 porsi harus diisi.')
    const computedPorsiSiswa = isSD ? newSekolah.porsi_siswa_1_3 + newSekolah.porsi_siswa_4_6 : newSekolah.porsi_siswa
    await supabase.from('daftar_sekolah').insert([{
      sppg_id: id, nama_sekolah: newSekolah.nama, jenjang: newSekolah.jenjang,
      porsi_siswa: computedPorsiSiswa,
      porsi_siswa_1_3: isSD ? newSekolah.porsi_siswa_1_3 : 0,
      porsi_siswa_4_6: isSD ? newSekolah.porsi_siswa_4_6 : 0,
      porsi_guru: newSekolah.porsi_guru,
      porsi_tendik: newSekolah.porsi_tendik, porsi_kader: newSekolah.porsi_kader,
      target_porsi: totalPorsiNew
    }])
    resetForm()
    loadData()
  }

  const handleEditSekolah = (s: any) => {
    setEditingId(s.id)
    setNewSekolah({
      nama: s.nama_sekolah,
      jenjang: s.jenjang,
      porsi_siswa: s.porsi_siswa || 0,
      porsi_siswa_1_3: s.porsi_siswa_1_3 || 0,
      porsi_siswa_4_6: s.porsi_siswa_4_6 || 0,
      porsi_guru: s.porsi_guru || 0,
      porsi_tendik: s.porsi_tendik || 0,
      porsi_kader: s.porsi_kader || 0,
    })
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleUpdateSekolah = async () => {
    if (!editingId) return
    if (!newSekolah.nama || totalPorsiNew <= 0) return toast('warning', 'Lengkapi Data', 'Nama & minimal 1 porsi harus diisi.')
    const computedPorsiSiswa = isSD ? newSekolah.porsi_siswa_1_3 + newSekolah.porsi_siswa_4_6 : newSekolah.porsi_siswa
    await supabase.from('daftar_sekolah').update({
      nama_sekolah: newSekolah.nama, jenjang: newSekolah.jenjang,
      porsi_siswa: computedPorsiSiswa,
      porsi_siswa_1_3: isSD ? newSekolah.porsi_siswa_1_3 : 0,
      porsi_siswa_4_6: isSD ? newSekolah.porsi_siswa_4_6 : 0,
      porsi_guru: newSekolah.porsi_guru,
      porsi_tendik: newSekolah.porsi_tendik, porsi_kader: newSekolah.porsi_kader,
      target_porsi: totalPorsiNew
    }).eq('id', editingId)
    toast('success', 'Data Diperbarui', 'Titik layanan berhasil diupdate.')
    resetForm()
    loadData()
  }

  const handleDeleteSekolah = async (sid: string) => {
    if (confirm("Hapus titik layanan ini?")) {
      await supabase.from('daftar_sekolah').delete().eq('id', sid)
      if (editingId === sid) resetForm()
      loadData()
    }
  }

  if (loading && !selectedUnit) return <div className="min-h-screen flex items-center justify-center font-black text-slate-400 animate-pulse uppercase tracking-widest text-xs">Syncing Data SPPG...</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-[#F1F5F9] to-blue-50/40 flex font-sans text-slate-800 transition-all duration-300 relative overflow-hidden">

      {/* DECORATIVE BLOBS — behind sidebar for glassmorphism visibility */}
      <div className="fixed top-[-100px] left-[-100px] w-[500px] h-[500px] bg-indigo-400/20 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed bottom-[-80px] left-[-60px] w-[400px] h-[400px] bg-emerald-400/20 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed top-[-120px] right-[-120px] w-[400px] h-[400px] bg-blue-300/10 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="fixed top-[40%] right-[10%] w-[250px] h-[250px] bg-indigo-200/10 rounded-full blur-[80px] pointer-events-none z-0" />

      {/* SIDEBAR BUKA TUTUP — GLASSMORPHISM */}
      <aside className={`bg-[#0F2650]/75 backdrop-blur-xl text-white flex flex-col fixed h-full z-50 transition-all duration-300 border-r border-white/30 ${sidebarOpen ? 'w-72' : 'w-24'}`} style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.15), inset 0 -1px 1px rgba(255,255,255,0.05), 0 25px 50px -12px rgba(0,0,0,0.2)' }}>
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className={`animate-slide-in-left flex items-center gap-3 hover:scale-105 transition-transform duration-300 overflow-hidden ${sidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
            <img src="/logo.png" style={{ width: '48px', height: '48px', objectFit: 'contain' }} className="shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm leading-none text-white whitespace-nowrap">SPPG PASURUAN <span className="text-[9px] bg-yellow-400 text-[#0F2650] px-2 py-0.5 rounded-md tracking-widest font-black ml-1">V2</span></span>
              <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap mt-1">Sistem Manajemen Operasional Gizi</span>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-white/10 rounded-xl text-yellow-400">
            {sidebarOpen ? <ChevronLeft size={24} /> : <Menu size={24} />}
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-4">
          {[
            { label: 'Dashboard', icon: LayoutDashboard, href: `/sppg/dashboard/${id}` },
            { label: 'Profil SPPG', icon: Store, href: `/sppg/profil/${id}` },
          ].map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <button
                key={item.label}
                onClick={() => router.push(item.href)}
                className={`w-full flex items-center gap-4 px-4 py-4 text-xs font-black uppercase rounded-2xl transition-all duration-300 backdrop-blur-sm ${isActive
                    ? 'bg-white/10 text-white shadow-lg hover:bg-white/20'
                    : 'text-white/50 hover:bg-white/5 hover:text-white/80'
                  }`}
              >
                <item.icon size={24} className="shrink-0" />
                <span className={sidebarOpen ? 'block' : 'hidden'}>{item.label}</span>
              </button>
            )
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button onClick={async () => { await fetch('/api/logout', { method: 'POST' }); localStorage.clear(); router.push('/') }} className="w-full flex items-center gap-4 px-4 py-4 text-[10px] font-black text-red-400 hover:bg-red-500/10 rounded-2xl transition-all duration-300 uppercase tracking-widest overflow-hidden">
            <LogOut size={24} className="shrink-0" />
            <span className={sidebarOpen ? 'block' : 'hidden'}>Logout</span>
          </button>
        </div>
      </aside>

      <main className={`flex-1 h-screen overflow-hidden flex flex-col transition-all duration-300 ${sidebarOpen ? 'pl-72' : 'pl-24'}`}>
        <header className="bg-white border-b h-20 flex items-center justify-between px-10 shrink-0">
          <div className="flex flex-col">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] leading-none mb-2">Sistem Manajemen Operasional</p>
            <div className="text-sm font-black text-[#0F2650] uppercase tracking-tight">{sapaan}, SPPG {selectedUnit?.nama_unit}! 🍛</div>
          </div>

          <div className="flex items-center gap-5">
            <div className="text-right hidden sm:block">
              <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1 tracking-widest">Penanggung Jawab:</p>
              <p className="text-xs font-black text-[#0F2650] uppercase italic">{selectedUnit?.kepala_unit}</p>
            </div>
            <div className="w-12 h-12 bg-[#0F2650] rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-xl shadow-indigo-900/20 border-2 border-white">
              {selectedUnit?.kepala_unit?.charAt(0)}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-5">
          <div className="max-w-7xl mx-auto space-y-5">

            {/* ROW 0: DAILY MENU HIGHLIGHT + SMART STATUS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* MENU HARI INI — with shimmer */}
              <div className="shimmer-card bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200/60 shadow-sm relative overflow-hidden group">
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
                      <Utensils size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] leading-none">Menu Hari Ini</p>
                      <p className="text-[9px] font-bold text-amber-400/70 uppercase tracking-widest mt-0.5">{todayFormatted}</p>
                    </div>
                  </div>
                  {laporanHariIni?.menu_makanan ? (
                    <div className="flex items-center gap-2">
                      <Sparkles size={14} className="text-amber-400" />
                      <p className="text-lg font-black text-[#0F2650] italic leading-tight">"{laporanHariIni.menu_makanan}"</p>
                    </div>
                  ) : (
                    <p className="text-sm font-bold text-amber-600/60 italic">Menu sedang disiapkan oleh Korwil...</p>
                  )}
                </div>
              </div>

              {/* SMART STATUS CARD */}
              {laporanHariIni ? (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200/60 shadow-sm relative overflow-hidden group">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <CheckCircle2 size={24} className="text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-2">Status Laporan</p>
                      <p className="text-sm font-bold text-slate-700 leading-snug">Mantap! Laporan hari ini sudah tersimpan rapi. ✅</p>
                      <p className="text-[10px] text-emerald-500 font-bold mt-2 uppercase tracking-widest">Menu: {laporanHariIni.menu_makanan}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-6 border border-amber-200/60 shadow-sm relative overflow-hidden group">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0 animate-pulse">
                      <Hourglass size={24} className="text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-2">Status Laporan</p>
                      <p className="text-sm font-bold text-slate-700 leading-snug">Laporan hari ini ({todayShort}) belum masuk. Jangan lupa lapor ya! ⏳</p>
                      <button
                        onClick={() => router.push(`/sppg/dashboard/${id}/input`)}
                        className="mt-3 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-md shadow-amber-500/20"
                      >
                        Input Sekarang
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ROW 1: BANNER & TOTAL */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-[#0F2650] rounded-2xl p-8 text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-lg relative overflow-hidden group">
                <div className="relative z-10 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-yellow-400 mb-2">
                      <CalendarIcon size={18} />
                      <p className="text-[11px] font-black uppercase tracking-[0.3em]">{todayFormatted}</p>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter leading-none">{selectedUnit?.nama_unit}</h2>
                  </div>

                  {/* STATUS BADGE (compact) */}
                  {laporanHariIni ? (
                    <div className="flex items-center gap-3 bg-emerald-500 text-white px-4 py-2 rounded-xl w-fit shadow-md shadow-emerald-500/20">
                      <CheckCircle2 size={20} />
                      <p className="text-[11px] font-black uppercase tracking-widest">Sudah Laporan ✓</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 bg-rose-500 text-white px-4 py-2 rounded-xl w-fit shadow-md shadow-rose-500/20">
                      <AlertCircle size={20} />
                      <p className="text-[11px] font-black uppercase tracking-widest">Belum Laporan</p>
                    </div>
                  )}
                </div>

                {/* BUTTON ACTION */}
                <button
                  onClick={() => router.push(`/sppg/dashboard/${id}/input${laporanHariIni ? `?edit=${laporanHariIni.id}` : ''}`)}
                  className={`relative z-10 px-6 py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-3 ${laporanHariIni ? 'bg-white text-[#0F2650]' : 'bg-yellow-400 text-[#0F2650]'}`}
                >
                  <ClipboardList size={22} />
                  {laporanHariIni ? 'Edit Laporan Hari Ini' : 'Input Laporan Sekarang'}
                </button>
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
              </div>

              {/* CARD TOTAL */}
              <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center relative group overflow-hidden">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:bg-[#0F2650] group-hover:text-white transition-all duration-500 mb-4">
                  <Users size={36} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1 leading-none">Total Penerima Manfaat</p>
                <h3 className="text-5xl font-black text-[#0F2650] italic tracking-tighter leading-none">{totalPM.toLocaleString()}</h3>
                <p className="text-[10px] font-bold text-slate-300 uppercase mt-3 tracking-widest italic">Paket Porsi Terdaftar</p>
              </div>
            </div>

            {/* ROW 2: CONTENT TABS */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex bg-slate-50 border-b">
                <button onClick={() => setActiveTab('sekolah')} className={`flex-1 py-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${activeTab === 'sekolah' ? 'text-[#0F2650] bg-white border-b-4 border-[#0F2650]' : 'text-slate-400'}`}>
                  <School size={16} /> Titik Layanan
                </button>
                <button onClick={() => setActiveTab('riwayat')} className={`flex-1 py-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${activeTab === 'riwayat' ? 'text-[#0F2650] bg-white border-b-4 border-[#0F2650]' : 'text-slate-400'}`}>
                  <FileText size={16} /> Riwayat Distribusi
                </button>
              </div>

              <div className="p-5">
                {activeTab === 'sekolah' ? (
                  <div className="space-y-5 animate-in fade-in duration-700">
                    {/* FORM ADD */}
                    <div className="bg-slate-50 p-5 rounded-xl border-2 border-dashed border-slate-200 space-y-4">
                      {/* Row 1: Jenjang & Nama */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-3">Pilih Jenjang</label>
                          <select className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all" value={newSekolah.jenjang} onChange={e => setNewSekolah({ ...newSekolah, jenjang: e.target.value })}>{KATEGORI_PM.map(k => <option key={k} value={k}>{k}</option>)}</select>
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-3">Nama Sekolah / Titik</label>
                          <input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all" placeholder="MISAL: SDN KOTA..." value={newSekolah.nama} onChange={e => setNewSekolah({ ...newSekolah, nama: e.target.value })} />
                        </div>
                      </div>
                      {/* Row 2: Porsi Inputs (conditional on jenjang) */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {isSD ? (
                          <>
                            <div className="space-y-3">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-3">Siswa Kls 1-3</label>
                              <input type="number" min="0" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all" placeholder="0" value={newSekolah.porsi_siswa_1_3 || ''} onChange={e => setNewSekolah({ ...newSekolah, porsi_siswa_1_3: parseInt(e.target.value) || 0 })} />
                            </div>
                            <div className="space-y-3">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-3">Siswa Kls 4-6</label>
                              <input type="number" min="0" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all" placeholder="0" value={newSekolah.porsi_siswa_4_6 || ''} onChange={e => setNewSekolah({ ...newSekolah, porsi_siswa_4_6: parseInt(e.target.value) || 0 })} />
                            </div>
                          </>
                        ) : (
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-3">
                              {newSekolah.jenjang === 'BALITA' ? 'Porsi Balita' : 
                               newSekolah.jenjang === 'BUMIL' ? 'Porsi Ibu Hamil' : 
                               newSekolah.jenjang === 'BUSUI' ? 'Porsi Ibu Menyusui' : 'Porsi Siswa'}
                            </label>
                            <input type="number" min="0" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all" placeholder="0" value={newSekolah.porsi_siswa || ''} onChange={e => setNewSekolah({ ...newSekolah, porsi_siswa: parseInt(e.target.value) || 0 })} />
                          </div>
                        )}
                        {[
                          { label: 'Porsi Guru', key: 'porsi_guru' as const },
                          { label: 'Porsi Tendik', key: 'porsi_tendik' as const },
                          { label: 'Porsi Kader', key: 'porsi_kader' as const },
                        ].map(item => (
                          <div key={item.key} className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-3">{item.label}</label>
                            <input type="number" min="0" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all" placeholder="0" value={newSekolah[item.key] || ''} onChange={e => setNewSekolah({ ...newSekolah, [item.key]: parseInt(e.target.value) || 0 })} />
                          </div>
                        ))}
                      </div>
                      {/* Row 3: Total + Simpan/Update */}
                      <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="flex-1 w-full bg-indigo-50 border-2 border-indigo-200 rounded-xl p-3 flex items-center justify-between">
                          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-2">Total Porsi</span>
                          <span className="text-xl font-black text-indigo-700 italic tracking-tighter mr-2">{totalPorsiNew.toLocaleString()}</span>
                        </div>
                        {editingId ? (
                          <div className="flex items-center gap-2 w-full md:w-auto">
                            <button onClick={handleUpdateSekolah} className="flex-1 md:flex-none bg-emerald-600 text-white px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg flex items-center justify-center gap-2 whitespace-nowrap"><Edit3 size={16} /> Update Data</button>
                            <button onClick={resetForm} className="flex-none bg-white text-slate-500 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-200 flex items-center justify-center gap-1.5 whitespace-nowrap"><X size={16} /> Batal</button>
                          </div>
                        ) : (
                          <button onClick={handleAddSekolah} className="w-full md:w-auto bg-[#0F2650] text-white px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg flex items-center justify-center gap-2 whitespace-nowrap"><Plus size={18} /> Simpan Data</button>
                        )}
                      </div>
                      {/* Edit Mode Indicator */}
                      {editingId && (
                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
                          <Pencil size={14} className="text-amber-600" />
                          <span className="text-[11px] font-bold text-amber-700">Mode Edit — Mengubah data <span className="font-black italic">{newSekolah.nama}</span></span>
                        </div>
                      )}
                    </div>

                    {/* DATA TABLE — LUXURY MINIMALIST */}
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                      {/* Table Header */}
                      <div className="bg-slate-50/80 border-b border-slate-100">
                        <div className="grid grid-cols-12 gap-2 px-5 py-3">
                          <div className="col-span-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">#</div>
                          <div className="col-span-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Titik Layanan</div>
                          <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jenjang</div>
                          <div className="col-span-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Detail Porsi</div>
                          <div className="col-span-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Total</div>
                          <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Aksi</div>
                        </div>
                      </div>
                      {/* Table Body */}
                      <div className="divide-y divide-slate-100">
                        {listSekolah.map((s, index) => (
                          <div key={s.id} className={`grid grid-cols-12 gap-2 px-5 py-4 items-center transition-colors duration-200 hover:bg-slate-50/60 ${editingId === s.id ? 'bg-amber-50/40 border-l-2 border-l-amber-400' : ''}`}>
                            {/* # */}
                            <div className="col-span-1 text-[12px] font-bold text-slate-400">{index + 1}</div>
                            {/* Nama */}
                            <div className="col-span-3">
                              <p className="text-[13px] font-bold text-slate-800 leading-tight">{s.nama_sekolah}</p>
                            </div>
                            {/* Jenjang Badge */}
                            <div className="col-span-2">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${jenjangColor[s.jenjang] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>{s.jenjang}</span>
                            </div>
                            {/* Detail Porsi */}
                            <div className="col-span-3">
                              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                                {s.jenjang === 'SD/MI' ? (
                                  <>Kls 1-3: <span className="font-bold text-slate-700">{s.porsi_siswa_1_3 ?? 0}</span> · Kls 4-6: <span className="font-bold text-slate-700">{s.porsi_siswa_4_6 ?? 0}</span></>
                                ) : (
                                  <>{s.jenjang === 'BALITA' ? 'Balita' : s.jenjang === 'BUMIL' ? 'Ibu Hamil' : s.jenjang === 'BUSUI' ? 'Ibu Menyusui' : 'Siswa'}: <span className="font-bold text-slate-700">{s.porsi_siswa ?? 0}</span></>
                                )}<br />Guru: <span className="font-bold text-slate-700">{s.porsi_guru ?? 0}</span> · Tendik: <span className="font-bold text-slate-700">{s.porsi_tendik ?? 0}</span> · Kader: <span className="font-bold text-slate-700">{s.porsi_kader ?? 0}</span>
                              </p>
                            </div>
                            {/* Total */}
                            <div className="col-span-1 text-center">
                              <span className="text-[14px] font-extrabold text-[#0F2650]">{s.target_porsi}</span>
                            </div>
                            {/* Aksi — Always Visible */}
                            <div className="col-span-2 flex items-center justify-center gap-2">
                              <button onClick={() => handleEditSekolah(s)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 hover:text-blue-700 transition-all duration-200" title="Edit">
                                <Pencil size={15} />
                              </button>
                              <button onClick={() => handleDeleteSekolah(s.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 hover:text-red-700 transition-all duration-200" title="Hapus">
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        ))}
                        {listSekolah.length === 0 && (
                          <div className="px-5 py-16 text-center">
                            <School size={32} className="mx-auto text-slate-200 mb-3" />
                            <p className="text-sm font-semibold text-slate-400">Belum ada titik layanan terdaftar</p>
                            <p className="text-[11px] text-slate-300 mt-1">Gunakan form di atas untuk menambah data baru</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in duration-700">
                    {riwayat.map(l => (
                      <div key={l.id} className="p-4 border border-slate-200 rounded-xl flex justify-between items-center bg-white hover:bg-slate-50 transition-all shadow-sm group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center group-hover:bg-[#0F2650] group-hover:text-white transition-all"><Utensils size={20} /></div>
                          <div>
                            <p className="text-[14px] font-black text-slate-700 uppercase italic leading-none mb-2 group-hover:text-[#0F2650] transition-colors">"{l.menu_makanan}"</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{l.tanggal_ops}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {l.tanggal_ops === todayISO && (
                            <button onClick={() => router.push(`/sppg/dashboard/${id}/input?edit=${l.id}`)} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-[11px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                              <Edit3 size={14} /> Edit
                            </button>
                          )}
                          <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-[11px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm">Terkirim ✓</div>
                        </div>
                      </div>
                    ))}
                    {riwayat.length === 0 && (
                      <div className="p-20 text-center text-slate-300 font-black uppercase tracking-widest text-xs">Belum ada riwayat laporan</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}