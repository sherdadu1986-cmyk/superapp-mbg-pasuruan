"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Building2, Users, CheckCircle2, RotateCw, GraduationCap, Heart, ArrowRight,
  Clock, Utensils, UtensilsCrossed, Calendar, Edit3, Plus, Printer,
  FileCheck, ShieldCheck, Database, Award, Activity
} from 'lucide-react'
import { 
  fetchKelompokPenerimaManfaatList, fetchBnbaList, fetchMenuHariIniDB, 
  type KelompokPenerimaManfaat, type PenerimaManfaatBnba, type MenuHarianDB 
} from '@/lib/data-helpers'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

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
  kalori: '~680 kkal',
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

function OperationalDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse p-1">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-6 w-56 bg-slate-200 rounded-md" />
          <div className="h-4 w-96 bg-slate-100 rounded-md" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-44 bg-slate-200 rounded-lg" />
          <div className="h-9 w-28 bg-slate-200 rounded-lg" />
        </div>
      </div>

      {/* Top 4 KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-2xs">
            <div className="h-4 w-24 bg-slate-200 rounded" />
            <div className="h-8 w-20 bg-slate-300 rounded" />
            <div className="h-3 w-32 bg-slate-100 rounded" />
          </div>
        ))}
      </div>

      {/* Center 2-Column Section Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 h-80 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs" />
        <div className="lg:col-span-7 h-80 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs" />
      </div>

      {/* Bottom 2 Tables Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-72 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs" />
        <div className="h-72 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs" />
      </div>
    </div>
  )
}

export default function BerandaOperasionalPage() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [realtimeStatus, setRealtimeStatus] = useState<'SUBSCRIBED' | 'REST' | 'CONNECTING'>('CONNECTING')
  
  // Dynamic Supabase state
  const [kpmList, setKpmList] = useState<KelompokPenerimaManfaat[]>([])
  const [bnbaList, setBnbaList] = useState<PenerimaManfaatBnba[]>([])
  const [totalBnba, setTotalBnba] = useState<number | null>(null)
  const [totalKpm, setTotalKpm] = useState<number | null>(null)
  const [targetPenerima, setTargetPenerima] = useState<number | null>(null)
  const [menuDb, setMenuDb] = useState<MenuHarianDB | null>(null)
  const [loading, setLoading] = useState(true)

  // Real-Time Clock Timer
  useEffect(() => {
    setMounted(true)
    setCurrentTime(new Date())

    const timerId = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timerId)
  }, [])

  // Load Real-Time Supabase Data
  const loadDashboardData = async () => {
    try {
      // Ambil KPM langsung via REST API
      const { data: kpmData, error: kpmErr } = await supabase
        .from('kelompok_penerima_manfaat')
        .select('*')
        
      // Ambil BNBA riil langsung via REST API
      const { data: bnbaData, count, error: bnbaErr } = await supabase
        .from('penerima_manfaat_bnba')
        .select('*', { count: 'exact' })

      console.log('Direct Fetch BNBA Count:', count ?? bnbaData?.length)

      let fetchedKpm = kpmData
      if (kpmErr || !fetchedKpm) {
        fetchedKpm = await fetchKelompokPenerimaManfaatList()
      }

      let fetchedBnba = bnbaData
      if (bnbaErr || !fetchedBnba) {
        fetchedBnba = await fetchBnbaList()
      }

      const menuRes = await fetchMenuHariIniDB()

      // Update state langsung tanpa menunggu socket
      if (fetchedBnba) {
        setBnbaList(fetchedBnba)
        setTotalBnba(count ?? fetchedBnba.length)
      }
      if (fetchedKpm) {
        setKpmList(fetchedKpm)
        setTotalKpm(fetchedKpm.length)
        const totalTarget = fetchedKpm.reduce((acc, curr) => acc + (Number(curr.jumlah_penerima) || 0), 0)
        setTargetPenerima(totalTarget)
      }
      if (menuRes) {
        setMenuDb(menuRes)
      }
    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()

    // Supabase Realtime Subscription Channel for Instant Sync across Local & Vercel
    const channel = supabase
      .channel('schema-db-changes-dashboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'kelompok_penerima_manfaat' },
        () => {
          console.log('Realtime change detected in kelompok_penerima_manfaat, re-fetching dashboard...')
          loadDashboardData()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'penerima_manfaat_bnba' },
        () => {
          console.log('Realtime change detected in penerima_manfaat_bnba, re-fetching dashboard...')
          loadDashboardData()
        }
      )
      .subscribe((status) => {
        console.log('Supabase Realtime Status:', status)
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('SUBSCRIBED')
        } else if (status === 'TIMED_OUT' || status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setRealtimeStatus('REST')
        }
      })

    // Timeout safety fallback: if socket stays pending for 3s, show '● Terhubung (REST)'
    const timeoutId = setTimeout(() => {
      setRealtimeStatus((prev) => (prev === 'CONNECTING' ? 'REST' : prev))
    }, 3000)

    const handleStorage = () => loadDashboardData()
    window.addEventListener('storage', handleStorage)

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('storage', handleStorage)
      supabase.removeChannel(channel)
    }
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await loadDashboardData()
    } finally {
      setTimeout(() => {
        setIsRefreshing(false)
      }, 400)
    }
  }

  const handlePrintDistribution = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
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

  // ─── Dynamic KPI Calculations ──────────────────────────────────────────
  const totalKelompok = totalKpm !== null ? totalKpm : kpmList.length
  const totalTargetPenerima = targetPenerima !== null 
    ? targetPenerima 
    : kpmList.reduce((acc, item) => acc + (item.jumlah_penerima || 0), 0)

  // Sanitize BNBA count: exclude orphan records not connected to an active KPM
  const activeKpmIdSet = new Set<string>()
  kpmList.forEach(kpm => {
    if (kpm.id) activeKpmIdSet.add(kpm.id)
    if (kpm.kode) activeKpmIdSet.add(kpm.kode)
  })

  const validBnbaList = bnbaList.filter(item => activeKpmIdSet.size === 0 || activeKpmIdSet.has(item.kelompok_id))
  const realisasiTotal = totalBnba !== null ? totalBnba : validBnbaList.length
  const isOverAllocated = realisasiTotal > totalTargetPenerima && totalTargetPenerima > 0

  const persentase = totalTargetPenerima > 0 
    ? Math.min(Math.round((realisasiTotal / totalTargetPenerima) * 100), 100) 
    : 0

  // ─── Real-Time Portion Calculations (BGN Standard Rules) ──────────────
  let totalPorsiKecil = 0
  let totalPorsiBesar = 0

  kpmList.forEach(item => {
    const kat = (item.kategori || '').toUpperCase()
    const subKat = (item.sub_kategori || '').toUpperCase()
    const total = item.jumlah_penerima || 0
    const guruTendik = (item.target_guru || 0) + (item.target_tendik || 0)

    if (kat.includes('KB') || kat.includes('PAUD') || kat.includes('TK') || kat.includes('RA')) {
      const siswa = Math.max(0, total - guruTendik)
      totalPorsiKecil += siswa
      totalPorsiBesar += guruTendik
    } else if (kat.includes('SD') || kat.includes('MI')) {
      const siswa = Math.max(0, total - guruTendik)
      const porsiKecilSiswa = Math.round(siswa * 0.5)
      const porsiBesarSiswa = siswa - porsiKecilSiswa
      totalPorsiKecil += porsiKecilSiswa
      totalPorsiBesar += porsiBesarSiswa + guruTendik
    } else if (kat.includes('SMP') || kat.includes('MTS') || kat.includes('SMA') || kat.includes('SMK') || kat.includes('MA')) {
      totalPorsiBesar += total
    } else if (kat.includes('POSYANDU') || kat.includes('3B')) {
      if (subKat.includes('BUMIL') || subKat.includes('BUSUI')) {
        totalPorsiBesar += total
      } else {
        totalPorsiKecil += total
      }
    } else {
      if (subKat.includes('BUMIL') || subKat.includes('BUSUI')) {
        totalPorsiBesar += total
      } else {
        totalPorsiKecil += total
      }
    }
  })

  // ─── BNBA Helper Mapping by KPM ID & Kode ─────────────────────────────
  const bnbaCountMap = new Map<string, number>()
  validBnbaList.forEach(item => {
    const key = item.kelompok_id
    bnbaCountMap.set(key, (bnbaCountMap.get(key) || 0) + 1)
  })

  const getBnbaCountForKpms = (kpms: KelompokPenerimaManfaat[]) => {
    return kpms.reduce((acc, kpm) => {
      const countById = kpm.id ? (bnbaCountMap.get(kpm.id) || 0) : 0
      const countByKode = kpm.kode ? (bnbaCountMap.get(kpm.kode) || 0) : 0
      return acc + Math.max(countById, countByKode)
    }, 0)
  }

  // ─── Table 1: Jalur Pendidikan Breakdown ──────────────────────────────
  const getJenjangRowStats = (katKeys: string[], label: string, code: string) => {
    const matchedKpms = kpmList.filter(i => {
      const k = (i.kategori || '').toUpperCase()
      return katKeys.some(key => k === key || k.includes(key))
    })
    const countLembaga = matchedKpms.length
    const countTarget = matchedKpms.reduce((a, b) => a + (b.jumlah_penerima || 0), 0)
    const countBnba = getBnbaCountForKpms(matchedKpms)
    return { 
      jenjang: label, 
      code, 
      lembagaCount: countLembaga, 
      targetCount: countTarget,
      bnbaCount: countBnba
    }
  }

  const jalurPendidikanRows = [
    getJenjangRowStats(['KB', 'PAUD', 'TK', 'RA', 'KB/PAUD', 'TK/RA'], 'KB / PAUD / TK / RA', 'KB_PAUD_TK'),
    getJenjangRowStats(['SD', 'MI', 'SD/MI'], 'SD / MI (Porsi Kecil & Besar)', 'SD_MI'),
    getJenjangRowStats(['SMP', 'MTS', 'SMP/MTS'], 'SMP / MTs', 'SMP_MTS'),
    getJenjangRowStats(['SMA', 'SMK', 'MA', 'SMA/SMK/MA'], 'SMA / SMK / MA', 'SMA_SMK_MA'),
  ]

  // ─── Table 2: Jalur Komunitas 3B Breakdown ─────────────────────────────
  const get3BRowStats = (subKatKey: string, label: string, code: string) => {
    const matchedKpms = kpmList.filter(i => {
      const isPosy = (i.kategori || '').toUpperCase().includes('POSYANDU') || (i.kategori || '').toUpperCase().includes('3B')
      const sub = (i.sub_kategori || '').toLowerCase()
      if (!isPosy) return false
      if (subKatKey === 'baduta') return sub.includes('baduta')
      if (subKatKey === 'balita') return sub.includes('balita') || (!sub && subKatKey === 'balita')
      if (subKatKey === 'bumil') return sub.includes('bumil') || sub.includes('hamil')
      if (subKatKey === 'busui') return sub.includes('busui') || sub.includes('menyusui')
      return false
    })

    const posyanduCount = matchedKpms.length
    const targetCount = matchedKpms.reduce((a, b) => a + (b.jumlah_penerima || 0), 0)

    // Calculate BNBA count directly for 3B category from validBnbaList
    const bnbaCount = validBnbaList.filter(item => {
      const pos = (item.posisi || '').toLowerCase()
      if (subKatKey === 'baduta' || subKatKey === 'balita') return pos.includes('balita')
      if (subKatKey === 'bumil') return pos.includes('bumil')
      if (subKatKey === 'busui') return pos.includes('busui')
      return false
    }).length

    return {
      kategori: label,
      code,
      posyanduCount,
      targetCount,
      bnbaCount
    }
  }

  const jalur3BRows = [
    get3BRowStats('baduta', 'Balita Bawah Dua Tahun (Baduta)', 'baduta'),
    get3BRowStats('balita', 'Balita (2 - 5 Tahun)', 'balita'),
    get3BRowStats('bumil', 'Ibu Hamil (Bumil)', 'bumil'),
    get3BRowStats('busui', 'Ibu Menyusui (Busui)', 'busui'),
  ]

  const activityLogs: ActivityLog[] = [
    { id: '1', waktu: 'Hari ini, 10:45', entri: 'Update Data Siswa SDN Wonorejo V', kategori: 'SD / MI', wilayah: 'Wonorejo', status: 'Diperbarui' },
    { id: '2', waktu: 'Hari ini, 09:15', entri: 'Penambahan Data Posyandu Mawar', kategori: 'POSYANDU', wilayah: 'Wonorejo', status: 'Terdaftar' },
    { id: '3', waktu: 'Kemarin, 16:30', entri: 'Verifikasi Data MTSN 4 Pasuruan', kategori: 'SMP / MTs', wilayah: 'Wonorejo', status: 'Tervalidasi' },
    { id: '4', waktu: 'Kemarin, 14:00', entri: 'Sinkronisasi Data Bumil Posyandu Melati', kategori: '3B (Bumil)', wilayah: 'Wonorejo', status: 'Diperbarui' },
    { id: '5', waktu: '11 Sep 2026', entri: 'Registrasi RA Uswatun Hasanah', kategori: 'RA', wilayah: 'Wonorejo', status: 'Terdaftar' },
  ]

  if (loading) {
    return <OperationalDashboardSkeleton />
  }

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-12">
      {/* 1. Header Halaman + Real-Time Digital Clock */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase">
              BGN SuperApp
            </span>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
              realtimeStatus === 'SUBSCRIBED' 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : realtimeStatus === 'REST'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                realtimeStatus === 'SUBSCRIBED' 
                  ? 'bg-emerald-500 animate-pulse' 
                  : realtimeStatus === 'REST'
                  ? 'bg-emerald-500'
                  : 'bg-amber-500 animate-ping'
              }`} />
              <span>
                {realtimeStatus === 'SUBSCRIBED' 
                  ? '● Sinkron Realtime' 
                  : realtimeStatus === 'REST'
                  ? '● Terhubung (REST)'
                  : '○ Menghubungkan'}
              </span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Beranda Operasional (Enterprise Dashboard)
          </h1>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Pemantauan alokasi porsi gizi harian, verifikasi BNBA, dan kesiapan distribusi real-time BGN Pasuruan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Real-Time Clock Badge Widget */}
          <div className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg shadow-2xs flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Clock size={15} className="text-emerald-600 shrink-0" />
            <span className="font-mono text-slate-800">
              {mounted && currentTime ? formatIndonesianDate(currentTime) : 'Memuat waktu...'}
            </span>
          </div>

          <button
            onClick={handleRefresh}
            className="px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <RotateCw size={14} className={`text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Perbarui Data</span>
          </button>
        </div>
      </div>

      {/* 2. Kartu Metrik Ringkasan Atas (Dynamic 4 KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Kelompok / Titik */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs hover:shadow-md transition duration-200 flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Titik KPM
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {totalKelompok} <span className="text-xs font-semibold text-slate-500">Titik</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Tabel <code className="text-slate-700 font-mono">kelompok_penerima_manfaat</code>
            </p>
          </div>
          <div className="p-3 bg-slate-100 text-slate-700 rounded-xl group-hover:bg-slate-900 group-hover:text-white transition duration-200">
            <Building2 size={24} />
          </div>
        </div>

        {/* KPI 2: Total Target Penerima */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs hover:shadow-md transition duration-200 flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Target Alokasi Penerima
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {totalTargetPenerima.toLocaleString('id-ID')} <span className="text-xs font-semibold text-slate-500">Jiwa</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              SUM Target Seluruh KPM
            </p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition duration-200">
            <Users size={24} />
          </div>
        </div>

        {/* KPI 3: Realisasi BNBA Terdata */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs hover:shadow-md transition duration-200 flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Realisasi BNBA Terdata
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 tracking-tight">
              {realisasiTotal.toLocaleString('id-ID')} <span className="text-xs font-semibold text-slate-500">BNBA</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Data Valid KPM Supabase
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition duration-200">
            <FileCheck size={24} />
          </div>
        </div>

        {/* KPI 4: Rasio Kelengkapan Data */}
        <div className={`bg-white rounded-xl border p-4 sm:p-5 shadow-2xs hover:shadow-md transition duration-200 flex items-center justify-between group ${
          isOverAllocated ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
        }`}>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Kelengkapan BNBA
              </span>
              {isOverAllocated && (
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300">
                  ⚠️ Kelebihan Input
                </span>
              )}
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-baseline gap-1">
              {persentase}%
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              {realisasiTotal.toLocaleString('id-ID')} dari {totalTargetPenerima.toLocaleString('id-ID')} Jiwa ({persentase}%)
            </p>
          </div>
          <div className={`p-3 rounded-xl transition duration-200 ${
            isOverAllocated 
              ? 'bg-amber-100 text-amber-700 group-hover:bg-amber-600 group-hover:text-white' 
              : 'bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white'
          }`}>
            <ShieldCheck size={24} />
          </div>
        </div>
      </div>

      {/* 3. Area Menu Harian & Ringkasan Alokasi Porsi (2 Kolom Responsif Bagian Tengah) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri (5/12): Foto Menu Aktif & Detail Siklus */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4 flex flex-col justify-between hover:shadow-md transition duration-200">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-50 text-amber-600 rounded-md border border-amber-200">
                  <Utensils size={16} />
                </div>
                <h2 className="font-bold text-slate-900 text-sm tracking-tight">
                  Menu Utama Hari Ini
                </h2>
              </div>
              <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider">
                ● {menuDb?.status || DEFAULT_MENU_DATA.status}
              </span>
            </div>

            {/* Menu Photo Container */}
            <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={menuDb?.foto_url || DEFAULT_MENU_DATA.fotoUrl}
                alt={menuDb?.nama_menu || DEFAULT_MENU_DATA.namaMenu}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/menu-today.png'
                }}
              />
              <div className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-md">
                ⚡ {menuDb?.kalori || DEFAULT_MENU_DATA.kalori}
              </div>
            </div>

            {/* Menu Description & Tags */}
            <div className="space-y-2">
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight leading-snug">
                {menuDb?.nama_menu || DEFAULT_MENU_DATA.namaMenu}
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Calendar size={13} className="text-slate-400" />
                <span>{menuDb?.tanggal || DEFAULT_MENU_DATA.tanggal}</span>
              </p>

              {/* Nutrition Tags */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {(menuDb?.komposisi_gizi || DEFAULT_MENU_DATA.tags).map((tag, idx) => (
                  <span
                    key={idx}
                    className="bg-slate-100 text-slate-700 text-[11px] font-medium px-2.5 py-0.5 rounded-md border border-slate-200"
                  >
                    ✓ {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Siklus Standar Nutrisi BGN</span>
            <span className="font-semibold text-slate-800">Standardized Meal</span>
          </div>
        </div>

        {/* Kolom Kanan (7/12): Panel "Kebutuhan Porsi Harian (Real-Time BGN)" */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-5 flex flex-col justify-between hover:shadow-md transition duration-200">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h2 className="font-bold text-slate-900 text-base tracking-tight flex items-center gap-2">
                  <span>Kebutuhan Porsi Harian (Real-Time BGN)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Perhitungan otomatis rasio porsi kecil dan besar dari alokasi Supabase.
                </p>
              </div>
              <span className="bg-slate-100 text-slate-700 text-xs font-mono font-bold px-2.5 py-1 rounded-md border border-slate-200">
                {totalTargetPenerima.toLocaleString('id-ID')} Total Porsi
              </span>
            </div>

            {/* 2 Cards Grid for Portion Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Kartu Porsi Kecil */}
              <div className="bg-gradient-to-br from-amber-50/60 to-orange-50/40 border border-amber-200/80 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                    Kartu Porsi Kecil
                  </span>
                  <span className="p-1.5 bg-amber-100 text-amber-700 rounded-md">
                    <UtensilsCrossed size={16} />
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-amber-900 tracking-tight">
                  {totalPorsiKecil.toLocaleString('id-ID')} <span className="text-xs font-semibold text-amber-700">Porsi</span>
                </div>
                <p className="text-[11px] text-amber-800/80 font-medium leading-relaxed">
                  Balita + PAUD/TK + SD Kelas 1-3
                </p>
              </div>

              {/* Kartu Porsi Besar */}
              <div className="bg-gradient-to-br from-indigo-50/60 to-slate-50/80 border border-indigo-200/80 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">
                    Kartu Porsi Besar
                  </span>
                  <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-md">
                    <Utensils size={16} />
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-indigo-950 tracking-tight">
                  {totalPorsiBesar.toLocaleString('id-ID')} <span className="text-xs font-semibold text-indigo-700">Porsi</span>
                </div>
                <p className="text-[11px] text-indigo-800/80 font-medium leading-relaxed">
                  SD Kelas 4-6 + SMP/SMA + Bumil/Busui + Guru/Tendik
                </p>
              </div>
            </div>

            {/* Status Kesiapan Distribusi (Progress Bar) */}
            <div className="mt-5 space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                <span>Status Kesiapan & Kelengkapan Data BNBA</span>
                <span className={`font-mono ${isOverAllocated ? 'text-amber-700 font-bold' : 'text-emerald-700'}`}>
                  {persentase}% Valid {isOverAllocated ? '(Kelebihan Input)' : ''}
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${isOverAllocated ? 'bg-amber-500' : 'bg-emerald-600'}`} 
                  style={{ width: `${persentase}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 font-medium flex items-center justify-between">
                <span>Data Riil Valid: <strong>{realisasiTotal.toLocaleString('id-ID')}</strong> terdaftar</span>
                <span>Target: <strong>{totalTargetPenerima.toLocaleString('id-ID')}</strong> alokasi</span>
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
            <Link
              href="/kelola-menu-harian"
              className="flex-1 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-2xs transition cursor-pointer"
            >
              <Edit3 size={15} />
              <span>Kelola Siklus Menu</span>
            </Link>
            <button
              onClick={handlePrintDistribution}
              className="flex-1 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-2xs transition cursor-pointer"
            >
              <Printer size={15} className="text-slate-600" />
              <span>Cetak Lembar Distribusi</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Dua Tabel Pemantauan Operasional di Bawah (Agregasi Nyata) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tabel Kiri: Jalur Pendidikan (Sekolah & Lembaga) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4 hover:shadow-md transition duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
                <GraduationCap size={18} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm tracking-tight">
                  Jalur Pendidikan (Sekolah & Lembaga)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Agregasi otomatis KPM sekolah terdaftar per jenjang.
                </p>
              </div>
            </div>
            <Link
              href="/kelompok-penerima-manfaat"
              className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1"
            >
              <span>Kelola KPM</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-3">JENJANG</th>
                  <th className="py-2.5 px-3 text-center">LEMBAGA</th>
                  <th className="py-2.5 px-3 text-right">TARGET SISWA</th>
                  <th className="py-2.5 px-3 text-center">BNBA MASUK</th>
                  <th className="py-2.5 px-3 text-center">KESIAPAN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {jalurPendidikanRows.map((row) => {
                  const ratio = row.targetCount > 0 ? Math.round((row.bnbaCount / row.targetCount) * 100) : 0
                  return (
                    <tr key={row.code} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {row.jenjang}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600 font-mono">
                        {row.lembagaCount}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {row.targetCount.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-semibold text-emerald-700">
                        {row.bnbaCount}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          ratio >= 80 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {ratio >= 100 ? '100% Valid' : `${ratio}% Terisi`}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabel Kanan: Jalur Komunitas 3B (Prioritas Posyandu) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4 hover:shadow-md transition duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-pink-50 text-pink-600 rounded-lg border border-pink-100">
                <Heart size={18} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm tracking-tight">
                  Jalur Komunitas 3B (Prioritas Posyandu)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Agregasi sasaran balita, ibu hamil, & menyusui.
                </p>
              </div>
            </div>
            <Link
              href="/kelompok-penerima-manfaat"
              className="text-xs font-bold text-pink-700 hover:text-pink-900 flex items-center gap-1"
            >
              <span>Kelola 3B</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-3">KATEGORI SASARAN</th>
                  <th className="py-2.5 px-3 text-center">POSYANDU</th>
                  <th className="py-2.5 px-3 text-right">TOTAL JIWA</th>
                  <th className="py-2.5 px-3 text-center">BNBA MASUK</th>
                  <th className="py-2.5 px-3 text-center">KESIAPAN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {jalur3BRows.map((row) => {
                  return (
                    <tr key={row.code} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {row.kategori}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600 font-mono">
                        {row.posyanduCount}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {row.targetCount.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-semibold text-emerald-700">
                        {row.bnbaCount}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                          Siap Distribusi
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 5. Log Aktivitas / Ringkasan Cepat Terkini (Baris Bawah) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4 hover:shadow-md transition duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm tracking-tight">
              Catatan Aktivitas Operasional Terkini
            </h3>
            <p className="text-[11px] text-slate-500">
              Riwayat pembaruan data KPM dan verifikasi alokasi penerima manfaat.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
            Audit Trail BGN
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-2.5 px-4 min-w-[130px]">WAKTU</th>
                <th className="py-2.5 px-4 min-w-[240px]">ENTRI PERUBAHAN</th>
                <th className="py-2.5 px-4 min-w-[120px]">KATEGORI</th>
                <th className="py-2.5 px-4 min-w-[120px]">WILAYAH</th>
                <th className="py-2.5 px-4 text-center min-w-[110px]">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {activityLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 text-slate-500 text-[11px]">
                    {log.waktu}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {log.entri}
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                    {log.kategori}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
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
