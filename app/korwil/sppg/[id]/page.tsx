"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getLocalToday } from '@/lib/date'
import { useParams, useRouter } from 'next/navigation'
import {
  BarChart3, LogOut, Settings, Map, Camera, Users, Database,
  ArrowLeft, Building2, MapPin, ChefHat, Phone, Award, Calendar,
  Shield, BadgeCheck, XCircle, Utensils, Sparkles, FileText,
  Hash, ClipboardList, MapPinned, FileCheck, Handshake, Loader2,
  Store, CheckCircle2, Clock, AlertCircle
} from 'lucide-react'

export default function KorwilSPPGDetailPage() {
  const { id } = useParams()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [unit, setUnit] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'profil' | 'menu' | 'riwayat'>('profil')

  // Profil tab data
  const [totalSekolah, setTotalSekolah] = useState(0)
  const [totalPM, setTotalPM] = useState(0)

  // Menu tab data
  const [laporanHariIni, setLaporanHariIni] = useState<any>(null)

  // Riwayat tab data
  const [riwayat, setRiwayat] = useState<any[]>([])

  const todayISO = getLocalToday()
  const todayFormatted = new Date(todayISO + 'T12:00:00').toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const { data: unitData } = await supabase.from('daftar_sppg').select('*').eq('id', id).single()
        const { data: sekolah } = await supabase.from('daftar_sekolah').select('*').eq('sppg_id', id)
        const { data: laporan } = await supabase.from('laporan_harian_final').select('*').eq('unit_id', id).order('tanggal_ops', { ascending: false })

        if (unitData) setUnit(unitData)
        if (sekolah) {
          setTotalSekolah(sekolah.length)
          setTotalPM(sekolah.reduce((acc: number, s: any) => acc + (Number(s.target_porsi) || 0), 0))
        }
        if (laporan) {
          setRiwayat(laporan)
          const todayLaporan = laporan.find((l: any) => l.tanggal_ops === todayISO)
          if (todayLaporan) setLaporanHariIni(todayLaporan)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    if (id) loadData()
  }, [id])

  const tabs = [
    { key: 'profil' as const, label: 'Profil', icon: Building2 },
    { key: 'menu' as const, label: 'Menu Hari Ini', icon: Utensils },
    { key: 'riwayat' as const, label: 'Riwayat Laporan', icon: FileText },
  ]

  if (loading && !unit) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9FAFB] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest animate-pulse">Memuat Detail SPPG...</p>
      </div>
    )
  }

  // Profil info items (read-only)
  const profilFields = [
    { icon: Hash, label: 'ID SPPG', value: unit?.id_sppg || String(unit?.id) || '—' },
    { icon: Building2, label: 'Nama SPPG', value: unit?.nama_unit || '—' },
    { icon: Hash, label: 'No', value: unit?.no || '—' },
    { icon: ClipboardList, label: 'SPPI Batch', value: unit?.sppi_batch || '—' },
    { icon: Calendar, label: 'Tanggal Operasional', value: unit?.tanggal_operasional || '—' },
    { icon: FileCheck, label: 'SKEP Nomor', value: unit?.skep_nomor || '—' },
    { icon: MapPin, label: 'Kecamatan', value: unit?.kecamatan || '—' },
    { icon: MapPinned, label: 'Google Maps', value: unit?.gmaps || '—' },
    { icon: MapPin, label: 'Alamat Lengkap', value: unit?.alamat || '—' },
  ]

  const personelFields = [
    { section: 'Kepala SPPG', color: 'indigo', icon: ChefHat, fields: [
      { icon: Users, label: 'Nama Lengkap', value: unit?.kepala_unit || '—' },
      { icon: Award, label: 'Gelar', value: unit?.gelar_ka_sppg || '—' },
      { icon: Phone, label: 'No. HP', value: unit?.no_hp_ka_sppg || '—' },
    ]},
    { section: 'Mitra', color: 'emerald', icon: Handshake, fields: [
      { icon: Users, label: 'Nama Mitra', value: unit?.nama_mitra || '—' },
      { icon: Phone, label: 'No. HP Mitra', value: unit?.no_hp_mitra || '—' },
    ]},
    { section: 'Yayasan', color: 'violet', icon: Building2, fields: [
      { icon: Building2, label: 'Yayasan', value: unit?.yayasan || '—' },
      { icon: Users, label: 'Perwakilan', value: unit?.nama_perwakilan_yayasan || '—' },
      { icon: Phone, label: 'No. HP', value: unit?.no_hp_perwakilan_yayasan || '—' },
    ]},
  ]

  const sertifikasiItems = [
    { key: 'slhs', label: 'Sertifikat SLHS', desc: 'Sertifikat Laik Higiene Sanitasi' },
    { key: 'sertifikat_halal', label: 'Sertifikat Halal', desc: 'Sertifikasi Halal dari BPJPH/MUI' },
    { key: 'sertifikat_haccp', label: 'Sertifikat HACCP', desc: 'Hazard Analysis and Critical Control Points' },
    { key: 'sertifikat_chef', label: 'Sertifikat Chef', desc: 'Sertifikasi Kompetensi Koki' },
    { key: 'sertifikat_iso22000', label: 'Sertifikat ISO 22000', desc: 'Food Safety Management System' },
    { key: 'sertifikat_iso45001', label: 'Sertifikat ISO 45001 K3', desc: 'Keselamatan dan Kesehatan Kerja' },
  ]

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-800 font-sans relative">

      {/* SIDEBAR — SOLID DARK NAVY */}
      <aside className="w-20 lg:w-64 bg-[#111827] fixed h-full z-50 transition-all duration-300 flex flex-col">
        <div className="p-5 lg:px-6 lg:py-7 border-b border-white/[0.06] flex items-center gap-3.5">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
            <Settings size={20} className="text-white" />
          </div>
          <div className="hidden lg:block">
            <h1 className="font-extrabold tracking-tight text-[15px] text-white leading-none">KORWIL</h1>
            <p className="text-[10px] font-medium text-slate-500 tracking-wider mt-0.5">Control Panel</p>
          </div>
        </div>

        <nav className="flex-1 p-3 lg:p-4 space-y-1.5 mt-2">
          {[
            { label: 'Monitoring', icon: BarChart3, action: () => router.push('/korwil'), isActive: false },
            { label: 'Peta Wilayah', icon: Map, action: () => router.push('/korwil/monitoring-wilayah'), isActive: false },
            { label: 'Galeri', icon: Camera, action: () => router.push('/korwil'), isActive: false },
            { label: 'Data SPPG', icon: Database, action: () => router.push('/korwil/sppg'), isActive: true },
            { label: 'Akun Pengguna', icon: Users, action: () => router.push('/korwil/akun'), isActive: false },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className={`w-full flex items-center gap-3.5 px-3.5 py-3 lg:px-4 lg:py-3 rounded-xl transition-all duration-200 group relative ${
                item.isActive
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'text-slate-500 hover:bg-white/[0.04] hover:text-slate-300'
              }`}
            >
              {item.isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-emerald-400 rounded-r-full" />
              )}
              <item.icon size={20} className="shrink-0" />
              <span className="hidden lg:block font-semibold text-[13px] tracking-wide">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-3 lg:p-4 border-t border-white/[0.06]">
          <button onClick={async () => { await fetch('/api/logout', { method: 'POST' }); localStorage.clear(); router.push('/') }} className="w-full flex items-center gap-3.5 px-3.5 py-3 lg:px-4 lg:py-3 rounded-xl text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200">
            <LogOut size={20} className="shrink-0" />
            <span className="hidden lg:block font-semibold text-[13px]">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="pl-20 lg:pl-64 min-h-screen transition-all">
        <div className="max-w-6xl mx-auto p-5 lg:p-8 space-y-5">

          {/* HEADER */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/korwil/sppg')} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-colors border border-[#E5E7EB]">
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none">{unit?.nama_unit}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-200">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Operasional Aktif
                  </span>
                  {unit?.kecamatan && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-slate-500 rounded-full text-[10px] font-medium border border-[#E5E7EB]">
                      <MapPin size={10} /> {unit.kecamatan}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* TAB NAVIGATION */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-1.5 flex gap-1 shadow-sm">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'bg-[#111827] text-white'
                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                }`}
              >
                <tab.icon size={15} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* TAB CONTENT */}
          <div className="space-y-5">
            {/* ================================ */}
            {/* TAB: PROFIL (READ ONLY)          */}
            {/* ================================ */}
            {activeTab === 'profil' && (
              <div className="space-y-5">
                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-5 text-center">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Kapasitas Porsi</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">{(totalPM || 0).toLocaleString()}</p>
                    <p className="text-[10px] text-emerald-500 font-medium mt-1">porsi/hari</p>
                  </div>
                  <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-5 text-center">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Titik Layanan</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">{totalSekolah}</p>
                    <p className="text-[10px] text-emerald-500 font-medium mt-1">sekolah aktif</p>
                  </div>
                </div>

                {/* Card 1: Informasi Unit */}
                <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center">
                      <Building2 size={18} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Informasi Unit</h3>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    {profilFields.map((f, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                          <f.icon size={14} />
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{f.label}</p>
                          <p className="text-sm font-semibold text-slate-700 mt-0.5">{f.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card 2: Personel & Kemitraan */}
                <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center">
                      <Users size={18} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Data Personel & Kemitraan</h3>
                  </div>
                  <div className="p-6 space-y-6">
                    {personelFields.map((section, sIdx) => (
                      <div key={sIdx}>
                        <p className={`text-[10px] font-bold text-${section.color}-500 uppercase tracking-widest mb-3 flex items-center gap-2`}>
                          <section.icon size={13} /> {section.section}
                        </p>
                        <div className={`grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 pl-5 border-l-2 border-${section.color}-100`}>
                          {section.fields.map((f, fIdx) => (
                            <div key={fIdx} className="flex items-start gap-3">
                              <div className="w-7 h-7 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center shrink-0">
                                <f.icon size={13} />
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{f.label}</p>
                                <p className="text-sm font-semibold text-slate-700 mt-0.5">{f.value}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card 3: Sertifikasi Standar Kompetensi */}
                <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-50 text-emerald-500 rounded-lg flex items-center justify-center">
                      <Shield size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Sertifikasi Standar Kompetensi</h3>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">Status kelengkapan sertifikasi unit SPPG</p>
                    </div>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {sertifikasiItems.map((item) => {
                      const isActive = unit?.[item.key] ?? false
                      return (
                        <div
                          key={item.key}
                          className={`p-4 rounded-xl border transition-all duration-200 ${
                            isActive ? 'border-emerald-200 bg-emerald-50/40' : 'border-[#E5E7EB] bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {isActive ? <BadgeCheck size={17} className="text-emerald-500" /> : <XCircle size={17} className="text-slate-300" />}
                              <span className="text-[13px] font-bold text-slate-700">{item.label}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                              isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                            }`}>
                              {isActive ? '✓ Ada' : '—'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium leading-snug">{item.desc}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ================================ */}
            {/* TAB: MENU HARI INI               */}
            {/* ================================ */}
            {activeTab === 'menu' && (
              <div className="space-y-5">
                {/* Date Info */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                    <Calendar size={14} className="text-indigo-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">{todayFormatted}</span>
                  </div>
                </div>

                {laporanHariIni ? (
                  <>
                    {/* Menu Card */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200/60 shadow-sm overflow-hidden">
                      <div className="p-8">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shadow-inner">
                            <Utensils size={24} />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Menu Disajikan</p>
                            <p className="text-xs text-amber-400/70 font-medium mt-0.5">Hari Ini</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Sparkles size={16} className="text-amber-400" />
                          <h3 className="text-xl font-bold text-slate-800 italic leading-tight">"{laporanHariIni.menu_makanan}"</h3>
                        </div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Status</p>
                        <div className="flex items-center gap-2 mt-2">
                          <CheckCircle2 size={18} className="text-emerald-500" />
                          <span className="text-sm font-bold text-emerald-600">Terkirim</span>
                        </div>
                      </div>
                      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Total Porsi</p>
                        <p className="text-2xl font-bold text-slate-800 mt-1">{(totalPM || 0).toLocaleString()}</p>
                      </div>
                      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Titik Layanan</p>
                        <p className="text-2xl font-bold text-slate-800 mt-1">{totalSekolah}</p>
                      </div>
                      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Waktu Kirim</p>
                        <div className="flex items-center gap-1.5 mt-2">
                          <Clock size={14} className="text-slate-400" />
                          <span className="text-sm font-bold text-slate-700">
                            {laporanHariIni.created_at
                              ? new Date(laporanHariIni.created_at).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' }) + ' WIB'
                              : '—'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Foto if exists */}
                    {laporanHariIni.foto_url && laporanHariIni.foto_url.startsWith('http') && (
                      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-50 text-indigo-500 rounded-lg flex items-center justify-center">
                            <Camera size={18} />
                          </div>
                          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Foto Dokumentasi</h3>
                        </div>
                        <div className="p-4">
                          <img src={laporanHariIni.foto_url} alt="Dokumentasi" className="w-full max-h-96 object-contain rounded-lg" />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-white/60 backdrop-blur-sm border border-white/50 rounded-xl p-16 text-center shadow-sm">
                    <div className="w-16 h-16 bg-amber-50 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <AlertCircle size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-600">Belum Ada Laporan Hari Ini</h3>
                    <p className="text-sm text-slate-400 mt-2">Unit ini belum mengirimkan laporan untuk tanggal {todayFormatted}</p>
                  </div>
                )}
              </div>
            )}

            {/* ================================ */}
            {/* TAB: RIWAYAT LAPORAN             */}
            {/* ================================ */}
            {activeTab === 'riwayat' && (
              <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-white/50 shadow-sm overflow-hidden" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)' }}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/50">
                        <th className="text-left py-3 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tanggal</th>
                        <th className="text-left py-3 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Menu Disajikan</th>
                        <th className="text-left py-3 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Status</th>
                        <th className="text-center py-3 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {riwayat.map((l) => (
                        <tr key={l.id} className="border-b border-slate-100 hover:bg-indigo-50/30 transition-colors group">
                          <td className="py-3 px-5">
                            <div className="flex items-center gap-2">
                              <Calendar size={13} className="text-slate-300" />
                              <span className="text-sm font-medium text-slate-600">
                                {new Date(l.tanggal_ops + 'T12:00:00').toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-5">
                            <span className="text-sm font-semibold text-slate-700">{l.menu_makanan || '—'}</span>
                          </td>
                          <td className="py-3 px-5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-md text-[10px] font-bold uppercase tracking-wider">
                              <CheckCircle2 size={12} /> Selesai
                            </span>
                          </td>
                          <td className="py-3 px-5 text-center">
                            <button
                              onClick={() => router.push(`/korwil/detail/${id}`)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-700 rounded-md text-[10px] font-semibold transition-all"
                            >
                              Lihat Laporan
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {riwayat.length === 0 && (
                    <div className="py-16 text-center text-xs text-slate-300 font-medium">Belum ada riwayat laporan untuk unit ini</div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}
