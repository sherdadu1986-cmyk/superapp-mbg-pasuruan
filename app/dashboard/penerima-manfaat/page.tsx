"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Building2, Users, CheckCircle2, RotateCw, GraduationCap, Heart, ArrowRight,
  Clock, Utensils, UtensilsCrossed, Calendar, Edit3, Plus, Printer,
  FileCheck, ShieldCheck, Database, Award, Activity, Truck, MapPin, Sparkles, Package
} from 'lucide-react'
import {
  fetchKelompokPenerimaManfaatList, fetchBnbaList, fetchMenuHariIniDB,
  type KelompokPenerimaManfaat, type PenerimaManfaatBnba, type MenuHarianDB
} from '@/lib/data-helpers'
import { supabase } from '@/lib/supabase'
import LembarDistribusiPrint from '@/components/LembarDistribusiPrint'

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

function calculateKpmPortion(item: KelompokPenerimaManfaat) {
  const kat = (item.kategori || '').toUpperCase()
  const subKat = (item.sub_kategori || '').toUpperCase()
  const total = item.jumlah_penerima || (item.target_pria || 0) + (item.target_wanita || 0) || 0
  const guruTendik = (item.target_guru || 0) + (item.target_tendik || 0)

  let porsiKecil = 0
  let porsiBesar = 0

  if (kat.includes('KB') || kat.includes('PAUD') || kat.includes('TK') || kat.includes('RA')) {
    const siswa = Math.max(0, total - guruTendik)
    porsiKecil = siswa
    porsiBesar = guruTendik
  } else if (kat.includes('SD') || kat.includes('MI')) {
    const siswa = Math.max(0, total - guruTendik)
    const porsiKecilSiswa = Math.round(siswa * 0.5)
    const porsiBesarSiswa = siswa - porsiKecilSiswa
    porsiKecil = porsiKecilSiswa
    porsiBesar = porsiBesarSiswa + guruTendik
  } else if (kat.includes('SMP') || kat.includes('MTS') || kat.includes('SMA') || kat.includes('SMK') || kat.includes('MA')) {
    porsiBesar = total
  } else if (kat.includes('POSYANDU') || kat.includes('3B')) {
    if (subKat.includes('BUMIL') || subKat.includes('BUSUI')) {
      porsiBesar = total
    } else {
      porsiKecil = total
    }
  } else {
    if (subKat.includes('BUMIL') || subKat.includes('BUSUI')) {
      porsiBesar = total
    } else {
      porsiKecil = total
    }
  }

  return {
    total,
    porsiKecil,
    porsiBesar,
    guruTendik
  }
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

  // Real-Time BNBA Fulfillment Recap Filter State
  const [bnbaFilter, setBnbaFilter] = useState<'perlu' | 'belum' | 'kurang' | 'lengkap'>('perlu')

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

      // Ambil BNBA riil langsung via REST API (limit 10000 agar tidak terpotong default 1000 baris Supabase)
      const { data: bnbaData, count, error: bnbaErr } = await supabase
        .from('penerima_manfaat_bnba')
        .select('*', { count: 'exact' })
        .limit(10000)

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

  const [showPrintModal, setShowPrintModal] = useState(false)

  const handlePrintDistribution = () => {
    setShowPrintModal(true)
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
  })

  // ─── Multi-Column FK & Multi-Key Indexing for BNBA records ──────────────────────
  const bnbaKeyToRowsMap = React.useMemo(() => {
    const map = new Map<string, Set<PenerimaManfaatBnba>>()
    ;(bnbaList || []).forEach(b => {
      const raw = b as any
      const candidateKeys = [
        raw.kelompok_id,
        raw.kpm_id,
        raw.npsn,
        raw.kode,
        raw.sekolah_id,
        raw.kode_kelompok
      ].filter(Boolean)

      candidateKeys.forEach(k => {
        const cleanKey = String(k).trim().toLowerCase()
        if (cleanKey) {
          if (!map.has(cleanKey)) map.set(cleanKey, new Set())
          map.get(cleanKey)!.add(b)
        }
      })
    })
    return map
  }, [bnbaList])

  const getBnbaCountForGroup = React.useCallback((group: { id?: string; kode?: string; identitas_npsn_tmp?: string; nama?: string }) => {
    const possibleKeys = [
      group.id ? String(group.id).trim().toLowerCase() : null,
      group.kode ? String(group.kode).trim().toLowerCase() : null,
      group.identitas_npsn_tmp ? String(group.identitas_npsn_tmp).trim().toLowerCase() : null,
      group.nama ? String(group.nama).trim().toLowerCase() : null,
    ].filter(Boolean) as string[]

    const matchedRows = new Set<PenerimaManfaatBnba>()
    possibleKeys.forEach(key => {
      const rows = bnbaKeyToRowsMap.get(key)
      if (rows) {
        rows.forEach(r => matchedRows.add(r))
      }
    })

    return matchedRows.size
  }, [bnbaKeyToRowsMap])

  const validBnbaList = React.useMemo(() => {
    const matched = new Set<PenerimaManfaatBnba>()
    kpmList.forEach(kpm => {
      const possibleKeys = [
        kpm.id ? String(kpm.id).trim().toLowerCase() : null,
        kpm.kode ? String(kpm.kode).trim().toLowerCase() : null,
        kpm.identitas_npsn_tmp ? String(kpm.identitas_npsn_tmp).trim().toLowerCase() : null,
        kpm.nama ? String(kpm.nama).trim().toLowerCase() : null,
      ].filter(Boolean) as string[]

      possibleKeys.forEach(key => {
        const rows = bnbaKeyToRowsMap.get(key)
        if (rows) {
          rows.forEach(r => matched.add(r))
        }
      })
    })
    return Array.from(matched)
  }, [kpmList, bnbaKeyToRowsMap])

  const realisasiTotal = totalBnba !== null ? totalBnba : validBnbaList.length
  const isOverAllocated = realisasiTotal > totalTargetPenerima && totalTargetPenerima > 0

  const persentase = totalTargetPenerima > 0
    ? Math.min(Math.round((realisasiTotal / totalTargetPenerima) * 100), 100)
    : 0

  // ─── Real-Time Portion Calculations (BGN Standard Rules) ──────────────
  let totalPorsiKecil = 0
  let totalPorsiBesar = 0
  let totalTendik = 0

  kpmList.forEach(item => {
    const res = calculateKpmPortion(item)
    totalPorsiKecil += res.porsiKecil
    totalPorsiBesar += res.porsiBesar
    totalTendik += res.guruTendik
  })

  const getBnbaCountForKpms = React.useCallback((kpms: KelompokPenerimaManfaat[]) => {
    return kpms.reduce((acc, kpm) => acc + getBnbaCountForGroup(kpm), 0)
  }, [getBnbaCountForGroup])

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

  // ─── Status Jadwal & Rute Distribusi Harian SPPG ─────────────────────────────────
  const gelombangStats = React.useMemo(() => {
    // Gelombang 1: 06.00 - 07.00 WIB (Sasaran 3B - Balita, Bumil, Busui di Posyandu)
    const g1Kpms = kpmList.filter(i => {
      const k = (i.kategori || '').toUpperCase()
      const sub = (i.sub_kategori || '').toLowerCase()
      return k.includes('POSYANDU') || k.includes('3B') || sub.includes('balita') || sub.includes('bumil') || sub.includes('busui')
    })
    const g1Titik = g1Kpms.length
    const g1Porsi = g1Kpms.reduce((acc, item) => acc + (item.jumlah_penerima || (item.target_pria || 0) + (item.target_wanita || 0)), 0)

    // Gelombang 2: 08.30 - 09.30 WIB (Jenjang KB, TK, RA, PAUD, dan SD Porsi Kecil & Besar)
    const g2Kpms = kpmList.filter(i => {
      const k = (i.kategori || '').toUpperCase()
      return k.includes('KB') || k.includes('TK') || k.includes('RA') || k.includes('PAUD') || k.includes('SD') || k.includes('MI')
    })
    const g2Titik = g2Kpms.length
    const g2Porsi = g2Kpms.reduce((acc, item) => acc + (item.jumlah_penerima || (item.target_pria || 0) + (item.target_wanita || 0)), 0)

    // Gelombang 3: 09.30 - 10.30 WIB (Jenjang SMP & MTs)
    const g3Kpms = kpmList.filter(i => {
      const k = (i.kategori || '').toUpperCase()
      return k.includes('SMP') || k.includes('MTS')
    })
    const g3Titik = g3Kpms.length
    const g3Porsi = g3Kpms.reduce((acc, item) => acc + (item.jumlah_penerima || (item.target_pria || 0) + (item.target_wanita || 0)), 0)

    return [
      {
        id: 'g1',
        gelombang: 'Gelombang 1',
        waktu: '06.00 - 07.00 WIB',
        sasaran: 'Sasaran 3B (Balita, Bumil, Busui di 5 Posyandu)',
        rincian: 'Diberangkatkan subuh untuk pemenuhan gizi balita & ibu hamil/menyusui posyandu.',
        armada: 'Motor Roda 3 & Mobil Logistik Pasuruan',
        rute: 'Rute Posyandu Mawar, Melati, Anggrek, Dahlia, Kamboja',
        titik: g1Titik,
        porsi: g1Porsi,
        status: 'Siap Berangkat',
        statusColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        badgeBg: 'bg-pink-50 text-pink-700 border-pink-200'
      },
      {
        id: 'g2',
        gelombang: 'Gelombang 2',
        waktu: '08.30 - 09.30 WIB',
        sasaran: 'Jenjang KB, TK, RA, PAUD, dan SD (Porsi Kecil & Porsi Besar)',
        rincian: 'Distribusi utama waktu makan pagi / istirahat siswa pendidikan dasar.',
        armada: 'Armada L300 Box BGN Pasuruan',
        rute: 'Rute Sekolah Wonorejo I - V, SDN Wonosari, TK PKK, KB Melati',
        titik: g2Titik,
        porsi: g2Porsi,
        status: 'Sesuai Jadwal',
        statusColor: 'bg-sky-50 text-sky-800 border-sky-200',
        badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200'
      },
      {
        id: 'g3',
        gelombang: 'Gelombang 3',
        waktu: '09.30 - 10.30 WIB',
        sasaran: 'Jenjang SMP & MTs',
        rincian: 'Distribusi makanan bergizi waktu istirahat siang siswa SMP & MTs.',
        armada: 'Armada Kendaraan Operasional BGN',
        rute: 'Rute SMPN 1 Wonorejo & SMPN 2 Wonorejo',
        titik: g3Titik,
        porsi: g3Porsi,
        status: 'Sesuai Jadwal',
        statusColor: 'bg-sky-50 text-sky-800 border-sky-200',
        badgeBg: 'bg-purple-50 text-purple-700 border-purple-200'
      }
    ]
  }, [kpmList])

  // ─── Real-Time BNBA Fulfillment Recap Dataset ─────────────────────────────
  const sortedBnbaRecapList = React.useMemo(() => {
    const mapped = kpmList.map(kpm => {
      const target = kpm.jumlah_penerima || (kpm.target_pria || 0) + (kpm.target_wanita || 0) + (kpm.target_guru || 0) + (kpm.target_tendik || 0) || 0
      const terisi = getBnbaCountForGroup(kpm)
      const selisih = terisi - target
      const kekurangan = Math.max(0, target - terisi)
      const pct = target > 0 ? Math.min(Math.round((terisi / target) * 100), 100) : 0

      return {
        ...kpm,
        target,
        terisi,
        selisih,
        kekurangan,
        pct
      }
    })

    // Default Priority Sort:
    // 1. Belum Ada Detail (0 terisi) with largest shortage first
    // 2. Kurang dari Kuota (terisi < target) with largest shortage first
    // 3. Sudah Lengkap (terisi >= target)
    return mapped.sort((a, b) => {
      const getPriority = (item: typeof a) => {
        if (item.terisi === 0) return 0
        if (item.terisi < item.target) return 1
        return 2
      }

      const pA = getPriority(a)
      const pB = getPriority(b)
      if (pA !== pB) return pA - pB

      if (a.kekurangan !== b.kekurangan) return b.kekurangan - a.kekurangan

      return a.nama.localeCompare(b.nama)
    })
  }, [kpmList, validBnbaList])

  const filteredBnbaRecap = React.useMemo(() => {
    return sortedBnbaRecapList.filter(item => {
      if (bnbaFilter === 'perlu') return item.terisi < item.target
      if (bnbaFilter === 'belum') return item.terisi === 0
      if (bnbaFilter === 'kurang') return item.terisi > 0 && item.terisi < item.target
      if (bnbaFilter === 'lengkap') return item.terisi >= item.target
      return true
    })
  }, [sortedBnbaRecapList, bnbaFilter])

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
              SPPG SuperApp
            </span>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${realtimeStatus === 'SUBSCRIBED'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : realtimeStatus === 'REST'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${realtimeStatus === 'SUBSCRIBED'
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
            Dashboard Operasional
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
              {totalTargetPenerima.toLocaleString('id-ID')} <span className="text-xs font-semibold text-slate-500">Penerima Manfaat</span>
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
        <div className={`bg-white rounded-xl border p-4 sm:p-5 shadow-2xs hover:shadow-md transition duration-200 flex items-center justify-between group ${isOverAllocated ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
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
              {realisasiTotal.toLocaleString('id-ID')} dari {totalTargetPenerima.toLocaleString('id-ID')} Penerima Manfaat ({persentase}%)
            </p>
          </div>
          <div className={`p-3 rounded-xl transition duration-200 ${isOverAllocated
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
          {menuDb ? (
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
                {menuDb.status && (
                  <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider">
                    ● {menuDb.status}
                  </span>
                )}
              </div>

              {menuDb.foto_url && (
                <div className="relative aspect-[1080/1350] max-w-sm mx-auto w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={menuDb.foto_url}
                    alt={menuDb.nama_menu || 'Foto Menu'}
                    className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition duration-300"
                  />
                  {menuDb.kalori && (
                    <div className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-md">
                      ⚡ {menuDb.kalori}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight leading-snug">
                  {menuDb.nama_menu}
                </h3>
                {menuDb.tanggal && (
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Calendar size={13} className="text-slate-400" />
                    <span>{menuDb.tanggal}</span>
                  </p>
                )}

                {menuDb.komposisi_gizi && menuDb.komposisi_gizi.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {menuDb.komposisi_gizi.map((tag, idx) => (
                      <span
                        key={idx}
                        className="bg-slate-100 text-slate-700 text-[11px] font-medium px-2.5 py-0.5 rounded-md border border-slate-200"
                      >
                        ✓ {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-8 text-center flex flex-col items-center justify-center my-auto">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-full border border-amber-100">
                <Utensils size={28} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Belum Ada Menu Harian Yang Diinput</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Siklus menu belum diunggah dari database. Silakan kelola siklus menu di halaman Kelola Siklus Menu.
                </p>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Siklus Standar Nutrisi BGN</span>
            <span className="font-semibold text-slate-800">Standardized Meal</span>
          </div>
        </div>

        {/* Kolom Kanan (7/12): Panel "Kebutuhan Porsi Harian (Real-Time BGN)" */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4 flex flex-col justify-between hover:shadow-md transition duration-200">
          <div className="space-y-3">
            {/* Header Card */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-bold text-slate-900 text-base tracking-tight flex items-center gap-2">
                  <span>Kebutuhan Porsi Harian (Real-Time BGN)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ringkasan alokasi porsi kecil dan porsi besar per KPM dari data Supabase.
                </p>
              </div>
              <span className="bg-slate-100 text-slate-700 text-xs font-mono font-bold px-2.5 py-1 rounded-md border border-slate-200 shrink-0">
                {totalTargetPenerima.toLocaleString('id-ID')} Total Porsi
              </span>
            </div>

            {/* Tabel Ringkas Distribusi (Full Unclipped Table) */}
            <div className="border border-slate-100 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-10 border-b border-slate-800">NO</th>
                    <th className="py-2.5 px-3 border-b border-slate-800">NAMA KPM / LEMBAGA</th>
                    <th className="py-2.5 px-3 text-right border-b border-slate-800">TOTAL</th>
                    <th className="py-2.5 px-3 text-right border-b border-slate-800">KECIL</th>
                    <th className="py-2.5 px-3 text-right border-b border-slate-800">BESAR</th>
                    <th className="py-2.5 px-3 text-right border-b border-slate-800">TENDIK</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700 bg-white">
                  {kpmList.length > 0 ? (
                    kpmList.map((item, idx) => {
                      const breakdown = calculateKpmPortion(item)
                      return (
                        <tr key={item.id || item.kode || idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3 text-center font-mono text-slate-400 text-[11px] font-bold">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-slate-900 block truncate max-w-[200px]" title={item.nama}>
                              {item.nama}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                            {breakdown.total.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-700">
                            {breakdown.porsiKecil > 0 ? breakdown.porsiKecil.toLocaleString('id-ID') : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-900">
                            {breakdown.porsiBesar > 0 ? breakdown.porsiBesar.toLocaleString('id-ID') : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-600">
                            {breakdown.guruTendik > 0 ? breakdown.guruTendik.toLocaleString('id-ID') : '-'}
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                        Belum ada data KPM terdaftar.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300 text-xs shadow-2xs">
                  <tr>
                    <td colSpan={2} className="py-2.5 px-3 font-extrabold uppercase tracking-wider text-slate-800 text-[11px]">
                      TOTAL KESELURUHAN
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-950 font-black">
                      {totalTargetPenerima.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-amber-800 font-black">
                      {totalPorsiKecil.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-indigo-950 font-black">
                      {totalPorsiBesar.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-800 font-bold">
                      {totalTendik.toLocaleString('id-ID')}
                    </td>
                  </tr>
                </tfoot>
              </table>
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
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ratio >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
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
                  <th className="py-2.5 px-3 text-right">TOTAL PENERIMA MANFAAT</th>
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

      {/* 5. Status Jadwal & Rute Distribusi Harian SPPG (Pengganti Widget BNBA) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-5 hover:shadow-md transition duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider flex items-center gap-1">
                <Sparkles size={11} /> Standard Operational Procedure
              </span>
              <span className="text-xs text-slate-400 font-medium">| SPPG Pasuruan</span>
            </div>
            <h3 className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight flex items-center gap-2 mt-1">
              <Truck size={20} className="text-emerald-700" />
              <span>Status Jadwal & Rute Distribusi Harian SPPG</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Jadwal keberangkatan armada, alokasi porsi per gelombang, dan titik rute penerima manfaat MBG.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 shrink-0">
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Operasional</span>
              <span className="text-sm font-black text-slate-900 font-mono">
                {gelombangStats.reduce((a, b) => a + b.porsi, 0).toLocaleString('id-ID')} <span className="text-[10px] font-semibold text-slate-500">Porsi</span>
              </span>
            </div>
            <div className="p-2 bg-slate-900 text-white rounded-lg">
              <Package size={18} />
            </div>
          </div>
        </div>

        {/* 3 Wave Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {gelombangStats.map((item) => (
            <div
              key={item.id}
              className="bg-gradient-to-b from-slate-50/80 to-white rounded-xl border border-slate-200/90 p-4 space-y-3 shadow-2xs hover:border-slate-300 hover:shadow-md transition duration-200 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header Card: Gelombang & Status */}
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border ${item.badgeBg}`}>
                    {item.gelombang}
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${item.statusColor}`}>
                    ● {item.status}
                  </span>
                </div>

                {/* Jam Waktu & Target Sasaran */}
                <div>
                  <div className="flex items-center gap-1.5 text-slate-900 font-black text-lg tracking-tight font-mono">
                    <Clock size={16} className="text-slate-500" />
                    <span>{item.waktu}</span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-800 mt-1 leading-snug">
                    {item.sasaran}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    {item.rincian}
                  </p>
                </div>

                {/* Box Ringkasan Porsi & Titik Lokasi */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2 shadow-2xs">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Total Porsi:</span>
                    <span className="font-mono font-black text-slate-900 text-sm">
                      {item.porsi.toLocaleString('id-ID')} <span className="text-[10px] font-normal text-slate-500">Porsi</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1.5 border-t border-slate-100">
                    <span className="text-slate-500 font-medium">Titik Tujuan:</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {item.titik} <span className="text-[10px] font-normal text-slate-500">Lokasi KPM</span>
                    </span>
                  </div>
                </div>

                {/* Armada & Rute Info */}
                <div className="space-y-1.5 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-medium">
                  <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                    <Truck size={13} className="text-slate-500 shrink-0" />
                    <span className="truncate">{item.armada}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <MapPin size={13} className="text-slate-400 shrink-0" />
                    <span className="truncate">{item.rute}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                <span>Standardized BGN Wave</span>
                <span className="text-emerald-700 font-bold">✓ Active Route</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Official BGN Distribution Control Sheet Print Modal */}
      <LembarDistribusiPrint
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        initialKpmList={kpmList}
      />
    </div>
  )
}
