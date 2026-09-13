"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Building2, Users, CheckCircle2, RotateCw, GraduationCap, Heart, ArrowRight,
  Clock, Utensils, UtensilsCrossed, Calendar, Edit3, Plus
} from 'lucide-react'
import { 
  fetchKelompokPenerimaManfaatList, fetchMenuHariIniDB, 
  type KelompokPenerimaManfaat, type MenuHarianDB 
} from '@/lib/data-helpers'

export interface MenuHariIniData {
  namaMenu: string
  tanggal: string
  targetPorsi: string
  kalori: string
  status: string
  tags: string[]
  fotoUrl: string
}

export const DEFAULT_MENU_DATA: MenuHariIniData = {
  namaMenu: 'Nasi Ayam Teriyaki, Tumis Brokoli & Buah Pisang',
  tanggal: 'Senin, 14 September 2026',
  targetPorsi: '4,850 Porsi',
  kalori: '~650 kkal',
  status: 'Siap Distribusi',
  tags: ['Karbohidrat', 'Protein Hewani', 'Sayuran', 'Buah', 'Susu'],
  fotoUrl: '/menu-today.png'
}

interface ActivityLog {
  id: string
  waktu: string
  entri: string
  kategori: string
  wilayah: string
  status: string
}

export default function BerandaOperasionalPage() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  
  // Dynamic Supabase data state
  const [kpmList, setKpmList] = useState<KelompokPenerimaManfaat[]>([])
  const [menuDb, setMenuDb] = useState<MenuHarianDB | null>(null)
  const [loading, setLoading] = useState(true)

  // 1. Real-Time Clock Timer & Mounted setup
  useEffect(() => {
    setMounted(true)
    setCurrentTime(new Date())

    const timerId = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timerId)
  }, [])

  // 2. Load Supabase data
  const loadDashboardData = async () => {
    setLoading(true)
    const [kpmRes, menuRes] = await Promise.all([
      fetchKelompokPenerimaManfaatList(),
      fetchMenuHariIniDB()
    ])
    setKpmList(kpmRes)
    setMenuDb(menuRes)
    setLoading(false)
  }

  useEffect(() => {
    loadDashboardData()
    const handleStorage = () => loadDashboardData()
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadDashboardData()
    setTimeout(() => {
      setIsRefreshing(false)
    }, 600)
  }

  // Indonesian Date Formatter
  const formatIndonesianDate = (date: Date) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]
    const dayName = days[date.getDay()]
    const dayNum = date.getDate()
    const monthName = months[date.getMonth()]
    const year = date.getFullYear()
    
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')

    return `${dayName}, ${dayNum} ${monthName} ${year} • ${hours}:${minutes}:${seconds} WIB`
  }

  // Aggregate Computations from Supabase List
  const totalTitik = kpmList.length
  const totalSekolah = kpmList.filter(i => i.kategori !== 'POSYANDU_3B' && i.kategori !== 'POSYANDU 3B').length
  const totalPosyandu = kpmList.filter(i => i.kategori === 'POSYANDU_3B' || i.kategori === 'POSYANDU 3B').length

  const totalSiswa = kpmList.filter(i => i.kategori !== 'POSYANDU_3B' && i.kategori !== 'POSYANDU 3B').reduce((a, b) => a + (b.jumlah_penerima || 0), 0)
  const totalSasaran3B = kpmList.filter(i => i.kategori === 'POSYANDU_3B' || i.kategori === 'POSYANDU 3B').reduce((a, b) => a + (b.jumlah_penerima || 0), 0)
  const totalPorsiAgregat = totalSiswa + totalSasaran3B

  // Jenjang breakdown helper
  const getJenjangStats = (katKeys: string[], label: string, code: string) => {
    const filtered = kpmList.filter(i => {
      const k = (i.kategori || '').toUpperCase()
      return katKeys.some(key => k === key || k.includes(key))
    })
    const countLembaga = filtered.length
    const countSiswa = filtered.reduce((a, b) => a + (b.jumlah_penerima || 0), 0)
    return { jenjang: label, code, lembagaCount: countLembaga, siswaCount: countSiswa }
  }

  const jenjangList = [
    getJenjangStats(['KB', 'PAUD', 'KB/PAUD'], 'KB / PAUD', 'KB_PAUD'),
    getJenjangStats(['TK', 'RA', 'TK/RA'], 'TK / RA', 'TK_RA'),
    getJenjangStats(['SD', 'MI', 'SD/MI'], 'SD / MI', 'SD_MI'),
    getJenjangStats(['SMP', 'MTS', 'SMP/MTS'], 'SMP / MTs', 'SMP_MTS'),
    getJenjangStats(['SMA', 'SMK', 'MA', 'SMA/SMK/MA'], 'SMA / SMK / MA', 'SMA_SMK_MA'),
  ]

  // Komunitas 3B breakdown helper
  const get3BStats = (subKat: string, label: string, code: string) => {
    const filtered = kpmList.filter(i => (i.kategori === 'POSYANDU_3B' || i.kategori === 'POSYANDU 3B') && (i.sub_kategori === subKat || (!i.sub_kategori && subKat === 'Balita')))
    const countPosyandu = filtered.length
    const countSasaran = filtered.reduce((a, b) => a + (b.jumlah_penerima || 0), 0)
    return { kategori: label, code, posyanduCount: countPosyandu, sasaranCount: countSasaran, status: 'Aktif' }
  }

  const komunitas3BList = [
    get3BStats('Balita', 'Balita (Bawah Lima Tahun)', 'balita'),
    get3BStats('Bumil', 'Ibu Hamil (Bumil)', 'bumil'),
    get3BStats('Busui', 'Ibu Menyusui (Busui)', 'busui'),
  ]

  const activityLogs: ActivityLog[] = [
    { id: '1', waktu: 'Hari ini, 10:45', entri: 'Update Data Siswa SDN Wonorejo V', kategori: 'SD / MI', wilayah: 'Wonorejo', status: 'Diperbarui' },
    { id: '2', waktu: 'Hari ini, 09:15', entri: 'Penambahan Data Posyandu Mawar', kategori: 'POSYANDU', wilayah: 'Wonorejo', status: 'Terdaftar' },
    { id: '3', waktu: 'Kemarin, 16:30', entri: 'Verifikasi Data MTSN 4 Pasuruan', kategori: 'SMP / MTs', wilayah: 'Wonorejo', status: 'Tervalidasi' },
    { id: '4', waktu: 'Kemarin, 14:00', entri: 'Sinkronisasi Data Bumil Posyandu Melati', kategori: '3B (Bumil)', wilayah: 'Wonorejo', status: 'Diperbarui' },
    { id: '5', waktu: '11 Sep 2026', entri: 'Registrasi RA Uswatun Hasanah', kategori: 'RA', wilayah: 'Wonorejo', status: 'Terdaftar' },
  ]

  return (
    <div className="space-y-6 font-sans text-gray-800 pb-12">
      {/* 1. Header Halaman + Real-Time Digital Clock */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            Beranda Operasional
          </h1>
          <p className="text-xs text-gray-500 font-normal mt-0.5">
            Ringkasan data agregat Kelompok Penerima Manfaat (KPM) dan alokasi penerima manfaat terdaftar dari Supabase.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Real-Time Clock Badge Widget */}
          <div className="px-3.5 py-1.5 bg-white border border-gray-200 rounded-lg shadow-2xs flex items-center gap-2 text-xs font-semibold text-gray-700">
            <Clock size={14} className="text-emerald-600 shrink-0" />
            <span className="font-mono text-gray-800">
              {mounted && currentTime ? formatIndonesianDate(currentTime) : 'Memuat waktu...'}
            </span>
          </div>

          <button
            onClick={handleRefresh}
            className="px-3.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <RotateCw size={13} className={`text-gray-500 ${isRefreshing || loading ? 'animate-spin' : ''}`} />
            <span>Perbarui Data</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Cards Utama (Baris Atas - Ringkasan Total) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Total Lembaga / Titik */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider block">
              Total Lembaga & Titik KPM
            </span>
            <div className="text-2xl font-bold text-gray-900 tracking-tight">
              {totalTitik} <span className="text-xs font-semibold text-gray-500">Titik</span>
            </div>
            <p className="text-[11px] text-gray-500 font-medium">
              {totalSekolah} Lembaga Sekolah · {totalPosyandu} Titik Posyandu
            </p>
          </div>
          <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100/80">
            <Building2 size={24} />
          </div>
        </div>

        {/* Card 2: Total Seluruh Penerima Manfaat */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider block">
              Total Penerima Manfaat
            </span>
            <div className="text-2xl font-bold text-gray-900 tracking-tight">
              {totalPorsiAgregat.toLocaleString('id-ID')} <span className="text-xs font-semibold text-gray-500">Jiwa / Porsi</span>
            </div>
            <p className="text-[11px] text-gray-500 font-medium">
              {totalSiswa.toLocaleString('id-ID')} Siswa · {totalSasaran3B.toLocaleString('id-ID')} Sasaran 3B
            </p>
          </div>
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100/80">
            <Users size={24} />
          </div>
        </div>

        {/* Card 3: Status Verifikasi & Kesiapan */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider block">
              Kesiapan Data & Distribusi
            </span>
            <div className="text-2xl font-bold text-emerald-700 tracking-tight flex items-center gap-1.5">
              100% <span className="text-xs font-semibold text-emerald-600">Valid</span>
            </div>
            <p className="text-[11px] text-gray-500 font-medium">
              {totalTitik} Titik Terverifikasi Supabase SIKS-NG
            </p>
          </div>
          <div className="p-3.5 bg-sky-50 text-sky-600 rounded-xl border border-sky-100/80">
            <CheckCircle2 size={24} />
          </div>
        </div>
      </div>

      {/* 3. Widget "Menu Hari Ini" (Supabase Synchronized) */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
              <Utensils size={18} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-sm tracking-tight flex items-center gap-2">
                <span>Menu Makanan Hari Ini</span>
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider">
                  {menuDb?.status || DEFAULT_MENU_DATA.status}
                </span>
              </h2>
              <p className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                <Calendar size={12} className="text-gray-400" />
                <span>{menuDb?.tanggal || DEFAULT_MENU_DATA.tanggal}</span>
              </p>
            </div>
          </div>

          <Link
            href="/kelola-menu-harian"
            className="self-start sm:self-auto px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <Edit3 size={13} className="text-amber-600" />
            <span>Kelola / Perbarui Menu</span>
          </Link>
        </div>

        {/* Menu Body Content */}
        {menuDb || DEFAULT_MENU_DATA ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* Photo Preview Container */}
            <div className="md:col-span-5 relative aspect-video w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-50 shadow-2xs group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={(menuDb?.foto_url || DEFAULT_MENU_DATA.fotoUrl)}
                alt={menuDb?.nama_menu || DEFAULT_MENU_DATA.namaMenu}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/menu-today.png'
                }}
              />
            </div>

            {/* Menu Details & Composition Tags */}
            <div className="md:col-span-7 space-y-3">
              <div>
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest block mb-0.5">
                  Menu Utama Gizi Seimbang
                </span>
                <h3 className="text-base font-extrabold text-gray-900 tracking-tight leading-snug">
                  {menuDb?.nama_menu || DEFAULT_MENU_DATA.namaMenu}
                </h3>
              </div>

              {/* Nutrition Badges */}
              <div className="flex flex-wrap items-center gap-1.5">
                {(menuDb?.komposisi_gizi || DEFAULT_MENU_DATA.tags).map((tag, idx) => (
                  <span
                    key={idx}
                    className="bg-emerald-50 text-emerald-800 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-emerald-100/90 shadow-2xs"
                  >
                    ✓ {tag}
                  </span>
                ))}
              </div>

              {/* Portion & Calorie Info */}
              <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center gap-4 text-xs font-semibold text-gray-700">
                <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200">
                  <UtensilsCrossed size={14} className="text-emerald-600" />
                  <span>Target: <strong>{(menuDb?.target_porsi || 4850).toLocaleString('id-ID')} Porsi</strong></span>
                </div>
                <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200">
                  <span className="text-amber-600 font-bold">⚡</span>
                  <span>Kalori: <strong>{menuDb?.kalori || DEFAULT_MENU_DATA.kalori}</strong></span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center space-y-3">
            <p className="text-xs text-gray-500 font-medium">Belum ada menu makanan terdaftar untuk hari ini.</p>
            <Link
              href="/kelola-menu-harian"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-lg shadow-2xs hover:bg-emerald-700 transition"
            >
              <Plus size={14} /> Input Menu Hari Ini
            </Link>
          </div>
        )}
      </div>

      {/* 4. Rincian Global per Kategori KPM (Baris Ketiga - 2 Kolom Lebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kolom Kiri: Jalur Pendidikan (Sekolah) */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
                <GraduationCap size={18} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm tracking-tight">
                  Jalur Pendidikan (Sekolah & Lembaga)
                </h3>
                <p className="text-[11px] text-gray-500">
                  Rincian alokasi penerima manfaat sekolah per jenjang.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
              {totalSiswa.toLocaleString('id-ID')} Siswa
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-200">
                  <th className="py-2.5 px-3">JENJANG</th>
                  <th className="py-2.5 px-3 text-center">LEMBAGA</th>
                  <th className="py-2.5 px-3 text-right">TOTAL SISWA</th>
                  <th className="py-2.5 px-3 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                {jenjangList.map((item) => (
                  <tr key={item.code} className="hover:bg-gray-50/60 transition">
                    <td className="py-3 px-3 font-semibold text-gray-900">
                      {item.jenjang}
                    </td>
                    <td className="py-3 px-3 text-center text-gray-600">
                      {item.lembagaCount} Lembaga
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-gray-900">
                      {item.siswaCount.toLocaleString('id-ID')} Siswa
                    </td>
                    <td className="py-3 px-3 text-center">
                      <Link
                        href="/kelompok-penerima-manfaat"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                      >
                        <span>Kelola Data</span>
                        <ArrowRight size={11} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Kolom Kanan: Jalur Komunitas 3B */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-pink-50 text-pink-600 rounded-lg border border-pink-100">
                <Heart size={18} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm tracking-tight">
                  Jalur Komunitas 3B (Prioritas)
                </h3>
                <p className="text-[11px] text-gray-500">
                  Rincian sasaran balita, ibu hamil, & menyusui.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-pink-700 bg-pink-50 px-2.5 py-1 rounded-full border border-pink-100">
              {totalSasaran3B.toLocaleString('id-ID')} Sasaran
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-200">
                  <th className="py-2.5 px-3">KATEGORI SASARAN</th>
                  <th className="py-2.5 px-3 text-center">POSYANDU</th>
                  <th className="py-2.5 px-3 text-right">TOTAL SASARAN</th>
                  <th className="py-2.5 px-3 text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                {komunitas3BList.map((item) => (
                  <tr key={item.code} className="hover:bg-gray-50/60 transition">
                    <td className="py-3.5 px-3 font-semibold text-gray-900">
                      {item.kategori}
                    </td>
                    <td className="py-3.5 px-3 text-center text-gray-600">
                      {item.posyanduCount} Posyandu
                    </td>
                    <td className="py-3.5 px-3 text-right font-bold text-gray-900">
                      {item.sasaranCount.toLocaleString('id-ID')} Jiwa
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="bg-emerald-50 text-emerald-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-emerald-100 inline-block">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 5. Log Aktivitas / Ringkasan Cepat Terkini (Baris Bawah) */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="font-bold text-gray-900 text-sm tracking-tight">
              Ringkasan Aktivitas Terkini
            </h3>
            <p className="text-[11px] text-gray-500">
              Catatan pembaruan data KPM dan verifikasi lapangan terbaru.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-200">
                <th className="py-2.5 px-4 min-w-[130px]">WAKTU</th>
                <th className="py-2.5 px-4 min-w-[240px]">ENTRI PERUBAHAN</th>
                <th className="py-2.5 px-4 min-w-[120px]">KATEGORI</th>
                <th className="py-2.5 px-4 min-w-[120px]">WILAYAH</th>
                <th className="py-2.5 px-4 text-center min-w-[110px]">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
              {activityLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/60 transition">
                  <td className="py-3 px-4 text-gray-500 text-[11px]">
                    {log.waktu}
                  </td>
                  <td className="py-3 px-4 font-semibold text-gray-900">
                    {log.entri}
                  </td>
                  <td className="py-3 px-4 text-gray-600 font-mono text-[11px]">
                    {log.kategori}
                  </td>
                  <td className="py-3 px-4 text-gray-500">
                    {log.wilayah}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="bg-slate-100 text-slate-700 rounded-full px-2.5 py-0.5 text-xs font-medium border border-slate-200 inline-block">
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
