"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getLocalToday } from '@/lib/date'
import { useParams, useRouter, usePathname } from 'next/navigation'
import { useToast } from '@/components/toast'
import {
  LayoutDashboard, LogOut, Menu, Utensils, Store,
  CheckCircle2, School, Trash2, Plus, Edit3, Pencil, ClipboardList, Users,
  ChevronLeft, Calendar as CalendarIcon, AlertCircle, FileText, Hourglass, Sparkles, X
} from 'lucide-react'

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
  const KATEGORI_PM = ["PAUD/KB", "TK/RA", "SD/MI", "SMP/MTS", "SMA/SMK", "SANTRI", "BALITA", "BUMIL", "BUSUI"]

  // Jenjang Pill Badge Color Map
  const jenjangColor: Record<string, string> = {
    'PAUD/KB': 'bg-violet-50 text-violet-700 border-violet-200',
    'TK/RA': 'bg-purple-50 text-purple-700 border-purple-200',
    'SD/MI': 'bg-blue-50 text-blue-700 border-blue-200',
    'SMP/MTS': 'bg-cyan-50 text-cyan-700 border-cyan-200',
    'SMA/SMK': 'bg-teal-50 text-teal-700 border-teal-200',
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
    toast('success', 'Berhasil Ditambahkan', 'Titik layanan baru berhasil disimpan.')
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
    <div className="min-h-screen bg-[#F9FAFB] flex font-sans text-slate-800 transition-all duration-300 relative">

      {/* SIDEBAR — SOLID DARK NAVY */}
      <aside className={`bg-[#111827] flex flex-col fixed h-full z-50 transition-all duration-300 ${sidebarOpen ? 'w-60' : 'w-[70px]'}`}>
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
            <img src="/logo.png" style={{ width: '40px', height: '40px', objectFit: 'contain' }} className="shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm leading-none text-white whitespace-nowrap">SPPG PASURUAN</span>
              <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap mt-0.5">Manajemen Operasional</span>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 hover:bg-white/[0.06] rounded-lg text-slate-500 transition-colors shrink-0">
            {sidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1 mt-2">
          {[
            { label: 'Dashboard', icon: LayoutDashboard, href: `/sppg/dashboard/${id}` },
            { label: 'Profil SPPG', icon: Store, href: `/sppg/profil/${id}` },
          ].map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <button
                key={item.label}
                onClick={() => router.push(item.href)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'text-slate-500 hover:bg-white/[0.04] hover:text-slate-300'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-emerald-400 rounded-r-full" />
                )}
                <item.icon size={18} className="shrink-0" />
                <span className={`text-[13px] font-semibold ${sidebarOpen ? 'block' : 'hidden'}`}>{item.label}</span>
              </button>
            )
          })}
        </nav>
        <div className="p-3 border-t border-white/[0.06]">
          <button onClick={() => { localStorage.clear(); router.push('/') }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200">
            <LogOut size={18} className="shrink-0" />
            <span className={`text-[13px] font-semibold ${sidebarOpen ? 'block' : 'hidden'}`}>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className={`flex-1 min-h-screen transition-all duration-300 ${sidebarOpen ? 'pl-60' : 'pl-[70px]'}`}>

        {/* GREETING HEADER */}
        <header className="bg-white border-b border-[#E5E7EB] px-6 lg:px-8 py-4 flex justify-between items-center sticky top-0 z-40">
          <div>
            <h1 className="text-lg font-bold text-slate-800">{sapaan}, SPPG {selectedUnit?.nama_unit}! 🍛</h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Dashboard Operasional SPPG</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{todayFormatted}</p>
              <p className="text-xs font-bold text-slate-600 mt-0.5">PJ: {selectedUnit?.kepala_unit}</p>
            </div>
            <div className="w-9 h-9 bg-[#111827] rounded-lg flex items-center justify-center text-white font-bold text-sm">
              {selectedUnit?.kepala_unit?.charAt(0)}
            </div>
          </div>
        </header>

        <div className="p-5 lg:p-8 space-y-5 max-w-6xl mx-auto">

          {/* DAILY MENU HIGHLIGHT + SMART STATUS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* MENU HARI INI */}
            <div className="bg-white rounded-xl p-5 border border-[#E5E7EB] shadow-sm relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Utensils size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest leading-none">Menu Hari Ini</p>
                    <p className="text-[9px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">{todayFormatted}</p>
                  </div>
                </div>
                {laporanHariIni?.menu_makanan ? (
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-amber-400" />
                    <p className="text-base font-bold text-slate-800 italic leading-tight">"{laporanHariIni.menu_makanan}"</p>
                  </div>
                ) : (
                  <p className="text-sm font-medium text-slate-400 italic">Menu masih belum keliatan nih...</p>
                )}
              </div>
            </div>

            {/* SMART STATUS CARD */}
            {laporanHariIni ? (
              <div className="bg-white rounded-xl p-5 border border-emerald-200 shadow-sm relative overflow-hidden group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <CheckCircle2 size={24} className="text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1.5">Status Laporan</p>
                    <p className="text-sm font-semibold text-slate-700 leading-snug">Mantap! Laporan hari ini sudah tersimpan rapi. ✅</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => router.push(`/sppg/dashboard/${id}/input?edit=${laporanHariIni.id}`)}
                        className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-semibold transition-all flex items-center gap-1.5"
                      >
                        <Edit3 size={12} /> Edit Laporan
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-5 border border-amber-200 shadow-sm relative overflow-hidden group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center shrink-0 animate-pulse">
                    <Hourglass size={24} className="text-amber-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1.5">Status Laporan</p>
                    <p className="text-sm font-semibold text-slate-700 leading-snug">Laporan hari ini ({todayShort}) belum masuk. Jangan lupa lapor ya! ⏳</p>
                    <button
                      onClick={() => router.push(`/sppg/dashboard/${id}/input`)}
                      className="mt-2.5 px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                    >
                      <ClipboardList size={14} /> Input Sekarang
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SUMMARY STATS GRID */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-4">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Total Penerima</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{totalPM.toLocaleString()}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">porsi terdaftar</p>
            </div>
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-4">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Titik Layanan</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{listSekolah.length}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">sekolah aktif</p>
            </div>
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-4">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Menu Hari Ini</p>
              <p className="text-sm font-bold text-slate-800 mt-1 truncate">{laporanHariIni?.menu_makanan || '—'}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{laporanHariIni ? 'terkirim' : 'belum input'}</p>
            </div>
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-4">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Laporan Masuk</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{riwayat.length}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">total riwayat</p>
            </div>
          </div>

          {/* TABS */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
            <div className="flex border-b border-slate-100">
              <button onClick={() => setActiveTab('sekolah')} className={`flex-1 py-3 text-xs font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === 'sekolah' ? 'text-emerald-700 bg-emerald-50/50 border-b-2 border-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}>
                <School size={15} /> Titik Layanan
              </button>
              <button onClick={() => setActiveTab('riwayat')} className={`flex-1 py-3 text-xs font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === 'riwayat' ? 'text-emerald-700 bg-emerald-50/50 border-b-2 border-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}>
                <FileText size={15} /> Riwayat Laporan
              </button>
            </div>

            <div className="p-4">
              {activeTab === 'sekolah' ? (
                <div className="space-y-4">
                  {/* FORM ADD / EDIT */}
                  <div className={`p-4 rounded-lg border space-y-3 ${editingId ? 'bg-amber-50/40 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                    {/* Edit Mode Indicator */}
                    {editingId && (
                      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3.5 py-2">
                        <Pencil size={13} className="text-amber-600 shrink-0" />
                        <span className="text-[11px] font-semibold text-amber-700">Mode Edit — Mengubah <span className="font-bold">{newSekolah.nama}</span></span>
                      </div>
                    )}
                    {/* Row 1: Jenjang & Nama */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Jenjang</label>
                        <select className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all" value={newSekolah.jenjang} onChange={e => setNewSekolah({ ...newSekolah, jenjang: e.target.value })}>{KATEGORI_PM.map(k => <option key={k} value={k}>{k}</option>)}</select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Nama Sekolah / Titik</label>
                        <input className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all" placeholder="SDN Kota..." value={newSekolah.nama} onChange={e => setNewSekolah({ ...newSekolah, nama: e.target.value })} />
                      </div>
                    </div>
                    {/* Row 2: Porsi Inputs */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {isSD ? (
                        <>
                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Siswa 1-3</label>
                            <input type="number" min="0" className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all" placeholder="0" value={newSekolah.porsi_siswa_1_3 || ''} onChange={e => setNewSekolah({ ...newSekolah, porsi_siswa_1_3: parseInt(e.target.value) || 0 })} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Siswa 4-6</label>
                            <input type="number" min="0" className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all" placeholder="0" value={newSekolah.porsi_siswa_4_6 || ''} onChange={e => setNewSekolah({ ...newSekolah, porsi_siswa_4_6: parseInt(e.target.value) || 0 })} />
                          </div>
                        </>
                      ) : (
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Porsi Siswa</label>
                          <input type="number" min="0" className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all" placeholder="0" value={newSekolah.porsi_siswa || ''} onChange={e => setNewSekolah({ ...newSekolah, porsi_siswa: parseInt(e.target.value) || 0 })} />
                        </div>
                      )}
                      {[
                        { label: 'Guru', key: 'porsi_guru' as const },
                        { label: 'Tendik', key: 'porsi_tendik' as const },
                        { label: 'Kader', key: 'porsi_kader' as const },
                      ].map(item => (
                        <div key={item.key} className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{item.label}</label>
                          <input type="number" min="0" className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all" placeholder="0" value={newSekolah[item.key] || ''} onChange={e => setNewSekolah({ ...newSekolah, [item.key]: parseInt(e.target.value) || 0 })} />
                        </div>
                      ))}
                    </div>
                    {/* Row 3: Total + Action Buttons */}
                    <div className="flex items-center gap-3 pt-1">
                      <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2 flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-emerald-600 uppercase">Total Porsi</span>
                        <span className="text-lg font-bold text-emerald-700">{totalPorsiNew.toLocaleString()}</span>
                      </div>
                      {editingId ? (
                        <div className="flex items-center gap-2">
                          <button onClick={handleUpdateSekolah} className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap">
                            <Edit3 size={14} /> Update Data
                          </button>
                          <button onClick={resetForm} className="px-4 py-2 bg-white text-slate-500 border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-all flex items-center gap-1.5 whitespace-nowrap">
                            <X size={14} /> Batal
                          </button>
                        </div>
                      ) : (
                        <button onClick={handleAddSekolah} className="px-5 py-2 bg-[#111827] hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap">
                          <Plus size={15} /> Simpan
                        </button>
                      )}
                    </div>
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
                          {/* Jenjang Pill Badge */}
                          <div className="col-span-2">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${jenjangColor[s.jenjang] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>{s.jenjang}</span>
                          </div>
                          {/* Detail Porsi */}
                          <div className="col-span-3">
                            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                              {s.jenjang === 'SD/MI' ? (<>Kls 1-3: <span className="font-bold text-slate-700">{s.porsi_siswa_1_3 ?? 0}</span> · Kls 4-6: <span className="font-bold text-slate-700">{s.porsi_siswa_4_6 ?? 0}</span></>) : (<>Siswa: <span className="font-bold text-slate-700">{s.porsi_siswa ?? 0}</span></>)}<br />Guru: <span className="font-bold text-slate-700">{s.porsi_guru ?? 0}</span> · Tendik: <span className="font-bold text-slate-700">{s.porsi_tendik ?? 0}</span> · Kader: <span className="font-bold text-slate-700">{s.porsi_kader ?? 0}</span>
                            </p>
                          </div>
                          {/* Total */}
                          <div className="col-span-1 text-center">
                            <span className="text-[14px] font-extrabold text-[#111827]">{s.target_porsi}</span>
                          </div>
                          {/* Aksi — Always Visible, Solid */}
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
                <div className="space-y-0">
                  {riwayat.map(l => (
                    <div key={l.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-50 text-emerald-500 rounded-lg flex items-center justify-center shrink-0">
                          <Utensils size={14} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-700">{l.menu_makanan}</p>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                            {new Date(l.tanggal_ops + 'T12:00:00').toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {l.tanggal_ops === todayISO && (
                          <button onClick={() => router.push(`/sppg/dashboard/${id}/input?edit=${l.id}`)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-[10px] font-semibold transition-all">
                            <Edit3 size={12} /> Edit
                          </button>
                        )}
                        <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">Terkirim ✓</span>
                      </div>
                    </div>
                  ))}
                  {riwayat.length === 0 && (
                    <div className="py-16 text-center text-xs text-slate-300 font-medium">Belum ada riwayat laporan</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}