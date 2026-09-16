"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Building2, Users, CheckCircle2, RotateCw, GraduationCap, Heart, ArrowRight,
  Clock, Utensils, UtensilsCrossed, Calendar, Edit3, Plus, Printer,
  FileCheck, ShieldCheck, Database, Award, Activity, Truck, MapPin, Sparkles, Package, Search, Tv
} from 'lucide-react'
import {
  fetchKelompokPenerimaManfaatList, fetchBnbaList, fetchMenuHariIniDB, sortKpmList,
  calculateKpmPortion, getPosyanduBreakdown, type KelompokPenerimaManfaat, type PenerimaManfaatBnba, type MenuHarianDB
} from '@/lib/data-helpers'
import { supabase } from '@/lib/supabase'
import LembarDistribusiPrint from '@/components/LembarDistribusiPrint'
import { TableSkeleton } from '@/components/TableSkeleton'
import { RingkasanLogistikHarian } from '@/components/RingkasanLogistikHarian'
import KioskModeDisplay from '@/components/KioskModeDisplay'

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

  // Operational Holiday Toggle State (Stored locally per date)
  const [liburKpmIds, setLiburKpmIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const todayStr = new Date().toISOString().slice(0, 10)
      const saved = localStorage.getItem(`sppg_kpm_libur_${todayStr}`)
      return saved ? JSON.parse(saved) : []
    }
    return []
  })

  // Operational Route & PIC Settings State (Stored locally per date)
  const [distribusiSettings, setDistribusiSettings] = useState<Record<string, { rute: 'Kiri' | 'Kanan'; no_hp_pic: string }>>(() => {
    if (typeof window !== 'undefined') {
      const todayStr = new Date().toISOString().slice(0, 10)
      const saved = localStorage.getItem(`sppg_distribusi_settings_${todayStr}`)
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {}
      }
    }
    return {}
  })

  const handleUpdateRute = (itemKey: string, newRute: 'Kiri' | 'Kanan', defaultHp: string = '') => {
    setDistribusiSettings((prev) => {
      const current = prev[itemKey] || {
        rute: 'Kiri',
        no_hp_pic: defaultHp
      }
      const next = {
        ...prev,
        [itemKey]: {
          ...current,
          rute: newRute
        }
      }
      if (typeof window !== 'undefined') {
        const todayStr = new Date().toISOString().slice(0, 10)
        localStorage.setItem(`sppg_distribusi_settings_${todayStr}`, JSON.stringify(next))
      }
      return next
    })
  }

  const handleUpdatePic = (itemKey: string, newPic: string, defaultRute: 'Kiri' | 'Kanan' = 'Kiri') => {
    setDistribusiSettings((prev) => {
      const current = prev[itemKey] || {
        rute: defaultRute,
        no_hp_pic: ''
      }
      const next = {
        ...prev,
        [itemKey]: {
          ...current,
          no_hp_pic: newPic
        }
      }
      if (typeof window !== 'undefined') {
        const todayStr = new Date().toISOString().slice(0, 10)
        localStorage.setItem(`sppg_distribusi_settings_${todayStr}`, JSON.stringify(next))
      }
      return next
    })
  }

  const getKpmSetting = (itemKey: string, item: KelompokPenerimaManfaat, idx: number) => {
    const saved = distribusiSettings[itemKey]
    const defaultRute: 'Kiri' | 'Kanan' = idx < Math.ceil(kpmList.length / 2) ? 'Kiri' : 'Kanan'
    const defaultHp = item.hp || item.pimpinan || ''
    return {
      rute: saved?.rute || defaultRute,
      no_hp_pic: saved?.no_hp_pic !== undefined ? saved.no_hp_pic : defaultHp
    }
  }

  const toggleLibur = (id: string) => {
    setLiburKpmIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      if (typeof window !== 'undefined') {
        const todayStr = new Date().toISOString().slice(0, 10)
        localStorage.setItem(`sppg_kpm_libur_${todayStr}`, JSON.stringify(next))
      }
      return next
    })
  }

  // Dynamic separation of KPM list into Sekolah & Posyandu
  const sekolahList = React.useMemo(() => {
    return kpmList.filter(kpm => {
      const nama = String(kpm.nama || (kpm as any).nama_kelompok || '').toUpperCase();
      const jenis = String(kpm.kategori || (kpm as any).jenis || '').toUpperCase();
      return !nama.includes('POSYANDU') && !jenis.includes('POSYANDU') && !nama.includes('DUSUN');
    });
  }, [kpmList]);

  const posyanduList = React.useMemo(() => {
    return kpmList.filter(kpm => {
      const nama = String(kpm.nama || (kpm as any).nama_kelompok || '').toUpperCase();
      const jenis = String(kpm.kategori || (kpm as any).jenis || '').toUpperCase();
      return nama.includes('POSYANDU') || jenis.includes('POSYANDU') || nama.includes('DUSUN');
    });
  }, [kpmList]);

  // Recalculation for active (non-holiday) KPMs per table
  const ringkasanOperasional = React.useMemo(() => {
    let sekolahTotal = 0
    let sekolahKecil = 0
    let sekolahSiswa = 0
    let sekolahTendik = 0
    let sekolahAktifCount = 0
    let sekolahLiburCount = 0

    sekolahList.forEach((item) => {
      const itemKey = item.id || item.kode || item.identitas_npsn_tmp || ''
      const isLibur = liburKpmIds.includes(itemKey) || (Boolean(item.id) && liburKpmIds.includes(item.id!))

      if (isLibur) {
        sekolahLiburCount += 1
        return
      }

      const breakdown = calculateKpmPortion(item)
      sekolahTotal += breakdown.total
      sekolahKecil += breakdown.porsiKecil
      sekolahSiswa += breakdown.siswaBesar
      sekolahTendik += breakdown.tendik
      sekolahAktifCount += 1
    })

    let posyanduTotal = 0
    let posyanduBalita = 0
    let posyanduBumil = 0
    let posyanduBusui = 0
    let posyanduAktifCount = 0
    let posyanduLiburCount = 0

    posyanduList.forEach((item) => {
      const itemKey = item.id || item.kode || item.identitas_npsn_tmp || ''
      const isLibur = liburKpmIds.includes(itemKey) || (Boolean(item.id) && liburKpmIds.includes(item.id!))

      if (isLibur) {
        posyanduLiburCount += 1
        return
      }

      const pos = getPosyanduBreakdown(item)
      posyanduTotal += pos.total
      posyanduBalita += pos.balita
      posyanduBumil += pos.bumil
      posyanduBusui += pos.busui
      posyanduAktifCount += 1
    })

    const grandTotal = sekolahTotal + posyanduTotal
    const totalAktif = sekolahAktifCount + posyanduAktifCount
    const totalLibur = sekolahLiburCount + posyanduLiburCount

    return {
      sekolahTotal, sekolahKecil, sekolahSiswa, sekolahTendik, sekolahAktifCount, sekolahLiburCount,
      posyanduTotal, posyanduBalita, posyanduBumil, posyanduBusui, posyanduAktifCount, posyanduLiburCount,
      grandTotal, totalAktif, totalLibur
    }
  }, [sekolahList, posyanduList, liburKpmIds])

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
      // Ambil KPM langsung via REST API dengan urutan ascending
      const { data: kpmData, error: kpmErr } = await supabase
        .from('kelompok_penerima_manfaat')
        .select('*')
        .order('urutan', { ascending: true })

      // Ambil BNBA riil langsung via REST API (limit 10000 agar tidak terpotong default 1000 baris Supabase)
      const { data: bnbaData, count, error: bnbaErr } = await supabase
        .from('penerima_manfaat_bnba')
        .select('*', { count: 'exact' })
        .limit(10000)

      console.log('Direct Fetch BNBA Count:', count ?? bnbaData?.length)

      let fetchedKpm = kpmData
      if (kpmErr || !fetchedKpm || fetchedKpm.length === 0) {
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
        const sorted = sortKpmList(fetchedKpm)
        setKpmList(sorted)
        setTotalKpm(sorted.length)
        const totalTarget = sorted.reduce((acc, curr) => acc + (Number(curr.jumlah_penerima) || 0), 0)
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
  const [isPrinting, setIsPrinting] = useState(false)
  const [showKioskModal, setShowKioskModal] = useState(false)

  const handlePrintDistribution = () => {
    setIsPrinting(true)
    setShowPrintModal(true)
    setTimeout(() => {
      setIsPrinting(false)
    }, 800)
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
      {/* 1. Top Header Glassmorphism */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/70 backdrop-blur-xl border border-white/60 p-5 rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] hover:bg-white/80 transition-all duration-300">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white font-extrabold text-base flex items-center justify-center border border-white/80 shadow-md shrink-0">
            AS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-slate-900/90 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full tracking-wider uppercase backdrop-blur-md">
                SPPG SuperApp
              </span>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 backdrop-blur-md ${realtimeStatus === 'SUBSCRIBED' || realtimeStatus === 'REST'
                ? 'bg-emerald-500/10 text-emerald-800 border-emerald-300/50'
                : 'bg-amber-500/10 text-amber-800 border-amber-300/50'
                }`}>
                <span className={`w-2 h-2 rounded-full ${realtimeStatus === 'SUBSCRIBED'
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-emerald-500'
                  }`} />
                <span>
                  {realtimeStatus === 'SUBSCRIBED'
                    ? '● Sinkron Realtime'
                    : '● Terhubung (REST)'}
                </span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              Selamat Bertugas, Ahmad Sayyidani
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Pemantauan alokasi porsi gizi harian, verifikasi BNBA, dan kesiapan distribusi real-time BGN Pasuruan.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Bar Kaca Minimalis */}
          <div className="relative hidden sm:block">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari KPM / Sekolah..."
              className="pl-8 pr-3 py-2 bg-white/50 backdrop-blur-md border border-white/80 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-44 transition shadow-inner"
            />
          </div>

          {/* Real-Time Clock Badge Widget */}
          <div className="px-3.5 py-2 bg-white/60 backdrop-blur-md border border-white/80 rounded-xl shadow-xs flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Clock size={15} className="text-emerald-600 shrink-0" />
            <span className="font-mono text-slate-800">
              {mounted && currentTime ? formatIndonesianDate(currentTime) : 'Memuat waktu...'}
            </span>
          </div>

          <button
            onClick={() => {
              if (typeof window !== 'undefined' && document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(() => {})
              }
              setShowKioskModal(true)
            }}
            className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 cursor-pointer active:scale-95 border border-blue-400/40"
            title="Buka Mode Presentasi TV Dinding"
          >
            <Tv size={15} className="animate-pulse text-cyan-300" />
            <span>Mode Layar TV</span>
          </button>

          <button
            onClick={handleRefresh}
            className="px-3.5 py-2 bg-white/80 backdrop-blur-md border border-white/90 rounded-xl text-xs font-bold text-slate-700 hover:bg-white hover:text-blue-600 flex items-center gap-1.5 shadow-xs transition-all duration-200 cursor-pointer active:scale-95"
          >
            <RotateCw size={14} className={`text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Perbarui Data</span>
          </button>
        </div>
      </div>

      {/* 2. Kartu Metrik Ringkasan Atas (Dynamic 4 Glass KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Kelompok / Titik */}
        <div className="bg-white/70 backdrop-blur-xl border border-white/60 p-5 rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] hover:bg-white/80 hover:shadow-[0_12px_40px_0_rgba(31,38,135,0.12)] transition-all duration-300 flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Titik KPM
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {totalKelompok} <span className="text-xs font-bold text-slate-500">Titik Aktif</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Sekolah & Posyandu BGN
            </p>
          </div>
          <div className="p-3 bg-blue-50/80 text-blue-600 rounded-2xl border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-xs">
            <Building2 size={24} />
          </div>
        </div>

        {/* KPI 2: Target Alokasi Penerima */}
        <div className="bg-white/70 backdrop-blur-xl border border-white/60 p-5 rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] hover:bg-white/80 hover:shadow-[0_12px_40px_0_rgba(31,38,135,0.12)] transition-all duration-300 flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Target Alokasi
            </span>
            <div className="text-2xl sm:text-3xl font-black text-blue-600 tracking-tight">
              {totalTargetPenerima.toLocaleString('id-ID')} <span className="text-xs font-bold text-blue-700/70">Porsi</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              SUM Target Seluruh KPM
            </p>
          </div>
          <div className="p-3 bg-indigo-50/80 text-indigo-600 rounded-2xl border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-xs">
            <Users size={24} />
          </div>
        </div>

        {/* KPI 3: Realisasi BNBA Terdata */}
        <div className="bg-white/70 backdrop-blur-xl border border-white/60 p-5 rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] hover:bg-white/80 hover:shadow-[0_12px_40px_0_rgba(31,38,135,0.12)] transition-all duration-300 flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Realisasi BNBA
            </span>
            <div className="text-2xl sm:text-3xl font-black text-teal-600 tracking-tight">
              {realisasiTotal.toLocaleString('id-ID')} <span className="text-xs font-bold text-teal-700/70">Siswa & Bumil</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Detail BNBA Terverifikasi
            </p>
          </div>
          <div className="p-3 bg-teal-50/80 text-teal-600 rounded-2xl border border-teal-100 group-hover:bg-teal-600 group-hover:text-white transition-all duration-300 shadow-xs">
            <FileCheck size={24} />
          </div>
        </div>

        {/* KPI 4: Rasio Kelengkapan Data with Astra Circular Progress Ring */}
        <div className={`bg-white/70 backdrop-blur-xl border p-5 rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] hover:bg-white/80 hover:shadow-[0_12px_40px_0_rgba(31,38,135,0.12)] transition-all duration-300 flex items-center justify-between group ${isOverAllocated ? 'border-amber-300/80 bg-amber-50/30' : 'border-white/60'
          }`}>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Rasio Kelengkapan
              </span>
              {isOverAllocated && (
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300">
                  ⚠️ Kelebihan Input
                </span>
              )}
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-baseline gap-1">
              {persentase}%
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              {realisasiTotal.toLocaleString('id-ID')} / {totalTargetPenerima.toLocaleString('id-ID')}
            </p>
          </div>

          {/* Astra Circular Ring Progress Mini */}
          <div className="relative w-13 h-13 flex items-center justify-center shrink-0">
            <svg className="w-13 h-13 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-200/80"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-blue-600 transition-all duration-1000 ease-out"
                strokeDasharray={`${persentase}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-[10px] font-black text-slate-800">{persentase}%</span>
          </div>
        </div>
      </div>

      {/* 3. Area Menu Harian & Ringkasan Alokasi Porsi (2 Kolom Responsif Bagian Tengah) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri (5/12): Foto Menu Aktif & Detail Siklus + Ringkasan Logistik */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          <div className="bg-white/70 backdrop-blur-xl border border-white/60 p-5 rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] space-y-4 flex flex-col justify-between hover:bg-white/80 transition-all duration-300">
            {menuDb ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-200 shadow-2xs">
                      <Utensils size={16} />
                    </div>
                    <h2 className="font-bold text-slate-900 text-sm tracking-tight">
                      Menu & Nutrisi Harian
                    </h2>
                  </div>
                  {menuDb.status && (
                    <span className="bg-emerald-500/10 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-300/50 uppercase tracking-wider backdrop-blur-md">
                      ● {menuDb.status}
                    </span>
                  )}
                </div>

                {menuDb.foto_url && (
                  <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden border border-white/80 bg-slate-100 shadow-xs group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={menuDb.foto_url}
                      alt={menuDb.nama_menu || 'Foto Menu'}
                      className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition duration-300"
                    />
                    {menuDb.kalori && (
                      <div className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-white/20">
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

                  {/* Nutrisi Glass Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="bg-blue-50/80 text-blue-700 text-[11px] font-bold px-2.5 py-0.5 rounded-lg border border-blue-200/80">
                      ⚡ Kalori 645 kkal
                    </span>
                    <span className="bg-indigo-50/80 text-indigo-700 text-[11px] font-bold px-2.5 py-0.5 rounded-lg border border-indigo-200/80">
                      💪 Protein 27g
                    </span>
                    <span className="bg-emerald-50/80 text-emerald-700 text-[11px] font-bold px-2.5 py-0.5 rounded-lg border border-emerald-200/80">
                      ✓ Lolos Uji Sampel
                    </span>
                    {menuDb.komposisi_gizi && menuDb.komposisi_gizi.map((tag, idx) => (
                      <span
                        key={idx}
                        className="bg-white/60 text-slate-700 text-[11px] font-medium px-2.5 py-0.5 rounded-lg border border-white/80 shadow-2xs"
                      >
                        ✓ {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-8 text-center flex flex-col items-center justify-center my-auto">
                <div className="p-4 bg-amber-50 text-amber-600 rounded-full border border-amber-200/60 shadow-2xs">
                  <Utensils size={30} />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Menu Hari Ini Belum Dipublikasikan
                  </h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                    Siklus menu diperbarui setiap hari. Silakan unggah menu harian terbaru melalui menu Kelola Menu Harian.
                  </p>
                </div>
                <Link
                  href="/kelola-menu-harian"
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-2xs transition cursor-pointer"
                >
                  <Plus size={15} />
                  <span>Unggah Menu Sekarang</span>
                </Link>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Siklus Standar Nutrisi BGN</span>
              <span className="font-semibold text-slate-800">Standardized Meal</span>
            </div>
          </div>

          {/* Widget Operational Ringkasan Logistik & Packing Dapur */}
          <RingkasanLogistikHarian
            kpmList={kpmList}
            liburKpmIds={liburKpmIds}
            distribusiSettings={distribusiSettings}
          />
        </div>

        {/* Kolom Kanan (7/12): Panel "Kebutuhan Porsi Harian (Real-Time BGN)" */}
        <div className="lg:col-span-7 bg-white/70 backdrop-blur-xl border border-white/60 p-5 rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] space-y-4 flex flex-col justify-between hover:bg-white/80 transition-all duration-300">
          <div className="space-y-4">
            {/* Header Card */}
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
              <div>
                <h2 className="font-bold text-slate-900 text-base tracking-tight flex items-center gap-2">
                  <span>Kebutuhan Porsi Harian (Real-Time BGN)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Distribusi porsi dinamis terpisah: Lembaga Sekolah & Posyandu / Sasaran 3B. Klik status untuk meliburkan KPM.
                </p>
              </div>
              <span className="bg-white/80 text-slate-800 text-xs font-mono font-bold px-3 py-1 rounded-xl border border-white/90 shadow-2xs shrink-0">
                {ringkasanOperasional.grandTotal.toLocaleString('id-ID')} Total Porsi ({ringkasanOperasional.totalAktif} Titik Aktif{ringkasanOperasional.totalLibur > 0 ? `, ${ringkasanOperasional.totalLibur} Libur` : ''})
              </span>
            </div>

            {loading ? (
              <TableSkeleton />
            ) : (
              <div className="space-y-6">
                {/* TABEL 1: LEMBAGA SEKOLAH */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0e2a5c] uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 size={14} /> TABEL 1: LEMBAGA SEKOLAH ({sekolahList.length} Titik)
                    </span>
                    <span className="text-[11px] font-mono font-bold text-slate-600">
                      Subtotal: {ringkasanOperasional.sekolahTotal.toLocaleString('id-ID')} Porsi
                    </span>
                  </div>
                  <div className="border border-white/80 rounded-xl overflow-x-auto shadow-xs bg-white/40">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-900/95 text-white backdrop-blur-md text-center font-bold text-[11px]">
                        <tr>
                          <th rowSpan={2} className="border border-slate-700/80 py-2.5 px-2.5 w-10">NO</th>
                          <th rowSpan={2} className="border border-slate-700/80 py-2.5 px-3 text-left">NAMA LEMBAGA SEKOLAH</th>
                          <th rowSpan={2} className="border border-slate-700/80 py-2.5 px-2.5">STATUS</th>
                          <th rowSpan={2} className="border border-slate-700/80 py-2.5 px-2.5">RUTE</th>
                          <th rowSpan={2} className="border border-slate-700/80 py-2.5 px-2.5">NO HP PIC</th>
                          <th rowSpan={2} className="border border-slate-700/80 py-2.5 px-2.5 text-right w-14">TOTAL</th>
                          <th colSpan={3} className="border border-slate-700/80 py-1.5 px-2 uppercase tracking-wide">PORSI</th>
                        </tr>
                        <tr className="bg-slate-900/90 text-white text-center font-bold text-[10px]">
                          <th className="border border-slate-700/80 py-1.5 px-2.5 text-right w-14 text-amber-300">KECIL</th>
                          <th className="border border-slate-700/80 py-1.5 px-2.5 text-right w-14 text-blue-300">SISWA</th>
                          <th className="border border-slate-700/80 py-1.5 px-2.5 text-right w-14 text-white">TENDIK</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/50 font-medium text-slate-700 bg-white/60">
                        {sekolahList.length > 0 ? (
                          sekolahList.map((item, idx) => {
                            const itemKey = item.id || item.kode || item.identitas_npsn_tmp || String(idx)
                            const isLibur = liburKpmIds.includes(itemKey) || (Boolean(item.id) && liburKpmIds.includes(item.id!))
                            const breakdown = calculateKpmPortion(item)
                            const setting = getKpmSetting(itemKey, item, idx)

                            const total = breakdown.total
                            const kecil = breakdown.porsiKecil
                            const siswaBesar = breakdown.siswaBesar
                            const tendik = breakdown.tendik

                            return (
                              <tr
                                key={itemKey}
                                className={`transition-colors ${isLibur ? 'bg-rose-50/40' : 'hover:bg-blue-50/50'}`}
                              >
                                <td className="py-2.5 px-3 text-center font-mono text-slate-500 text-[11px] font-bold border-b border-slate-200/50">
                                  {idx + 1}
                                </td>
                                <td className="py-2.5 px-3 border-b border-slate-200/50">
                                  <span
                                    className={`font-semibold block truncate max-w-[180px] ${
                                      isLibur ? 'line-through text-slate-400 opacity-60' : 'text-slate-900'
                                    }`}
                                    title={item.nama}
                                  >
                                    {item.nama}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center border-b border-slate-200/50">
                                  <button
                                    type="button"
                                    onClick={() => toggleLibur(itemKey)}
                                    title={isLibur ? 'Klik untuk mengaktifkan kembali' : 'Klik untuk meliburkan KPM ini'}
                                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border cursor-pointer transition flex items-center gap-1 mx-auto ${
                                      isLibur
                                        ? 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200'
                                        : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-amber-100 hover:text-amber-800'
                                    }`}
                                  >
                                    {isLibur ? <span>✖ Libur</span> : <span>● Aktif</span>}
                                  </button>
                                </td>
                                <td className="py-2.5 px-3 text-center border-b border-slate-200/50">
                                  <select
                                    value={setting.rute}
                                    onChange={(e) => handleUpdateRute(itemKey, e.target.value as 'Kiri' | 'Kanan', setting.no_hp_pic)}
                                    className="bg-white/80 border border-slate-300 rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold text-slate-800 focus:ring-1 focus:ring-slate-800 outline-hidden cursor-pointer"
                                  >
                                    <option value="Kiri">Rute Kiri</option>
                                    <option value="Kanan">Rute Kanan</option>
                                  </select>
                                </td>
                                <td className="py-2.5 px-3 text-center border-b border-slate-200/50">
                                  <input
                                    type="text"
                                    value={setting.no_hp_pic}
                                    onChange={(e) => handleUpdatePic(itemKey, e.target.value, setting.rute)}
                                    placeholder="08xxx..."
                                    className="w-28 text-center bg-white/80 border border-slate-300 rounded-md px-1.5 py-0.5 text-[10.5px] font-mono text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-slate-800 outline-hidden"
                                  />
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono border-b border-slate-200/50">
                                  {isLibur ? (
                                    <span className="font-bold text-slate-300">-</span>
                                  ) : (
                                    <span className="font-bold text-slate-900">{total.toLocaleString('id-ID')}</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono border-b border-slate-200/50">
                                  {isLibur ? (
                                    <span className="font-bold text-slate-300">-</span>
                                  ) : (
                                    <span className="font-bold text-amber-700">
                                      {kecil > 0 ? kecil.toLocaleString('id-ID') : '-'}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono border-b border-slate-200/50">
                                  {isLibur ? (
                                    <span className="font-bold text-slate-300">-</span>
                                  ) : (
                                    <span className="font-bold text-blue-700">
                                      {siswaBesar > 0 ? siswaBesar.toLocaleString('id-ID') : '-'}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono border-b border-slate-200/50">
                                  {isLibur ? (
                                    <span className="font-semibold text-slate-300">-</span>
                                  ) : (
                                    <span className="font-semibold text-slate-700">
                                      {tendik > 0 ? tendik.toLocaleString('id-ID') : '-'}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            )
                          })
                        ) : (
                          <tr>
                            <td colSpan={9} className="py-6 text-center text-slate-400 font-medium border-b border-slate-200">
                              Belum ada data Lembaga Sekolah terdaftar.
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot className="bg-slate-100/90 font-bold text-slate-900 border-t-2 border-slate-300 text-xs backdrop-blur-md">
                        <tr>
                          <td colSpan={5} className="py-2.5 px-3 font-extrabold uppercase tracking-wider text-slate-800 text-[11px]">
                            SUBTOTAL SEKOLAH ({ringkasanOperasional.sekolahAktifCount} LEMBAGA AKTIF)
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-950 font-black">
                            {ringkasanOperasional.sekolahTotal.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-amber-800 font-black">
                            {ringkasanOperasional.sekolahKecil.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-blue-900 font-black">
                            {ringkasanOperasional.sekolahSiswa.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-800 font-bold">
                            {ringkasanOperasional.sekolahTendik.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* TABEL 2: POSYANDU / SASARAN 3B */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Heart size={14} className="text-pink-600" /> TABEL 2: POSYANDU / SASARAN 3B ({posyanduList.length} Titik)
                    </span>
                    <span className="text-[11px] font-mono font-bold text-slate-600">
                      Subtotal: {ringkasanOperasional.posyanduTotal.toLocaleString('id-ID')} Porsi
                    </span>
                  </div>
                  <div className="border border-white/80 rounded-xl overflow-x-auto shadow-xs bg-white/40">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-emerald-950/95 text-white backdrop-blur-md text-center font-bold text-[11px]">
                        <tr>
                          <th className="border border-emerald-800/80 py-2.5 px-2.5 w-10">NO</th>
                          <th className="border border-emerald-800/80 py-2.5 px-3 text-left">NAMA POSYANDU / DUSUN</th>
                          <th className="border border-emerald-800/80 py-2.5 px-2.5">STATUS</th>
                          <th className="border border-emerald-800/80 py-2.5 px-2.5">RUTE</th>
                          <th className="border border-emerald-800/80 py-2.5 px-2.5">NO HP PIC</th>
                          <th className="border border-emerald-800/80 py-2.5 px-2.5 text-right w-14 text-amber-300">BALITA</th>
                          <th className="border border-emerald-800/80 py-2.5 px-2.5 text-right w-14 text-rose-300">BUMIL</th>
                          <th className="border border-emerald-800/80 py-2.5 px-2.5 text-right w-14 text-pink-300">BUSUI</th>
                          <th className="border border-emerald-800/80 py-2.5 px-2.5 text-right w-16 font-bold">TOTAL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/50 font-medium text-slate-700 bg-white/60">
                        {posyanduList.length > 0 ? (
                          posyanduList.map((item, idx) => {
                            const itemKey = item.id || item.kode || item.identitas_npsn_tmp || String(idx)
                            const isLibur = liburKpmIds.includes(itemKey) || (Boolean(item.id) && liburKpmIds.includes(item.id!))
                            const pos = getPosyanduBreakdown(item)
                            const setting = getKpmSetting(itemKey, item, sekolahList.length + idx)

                            const balita = pos.balita
                            const bumil = pos.bumil
                            const busui = pos.busui
                            const total = pos.total

                            return (
                              <tr
                                key={itemKey}
                                className={`transition-colors ${isLibur ? 'bg-rose-50/40' : 'hover:bg-emerald-50/40'}`}
                              >
                                <td className="py-2.5 px-3 text-center font-mono text-slate-500 text-[11px] font-bold border-b border-slate-200/50">
                                  {idx + 1}
                                </td>
                                <td className="py-2.5 px-3 border-b border-slate-200/50">
                                  <span
                                    className={`font-semibold block truncate max-w-[180px] ${
                                      isLibur ? 'line-through text-slate-400 opacity-60' : 'text-slate-900'
                                    }`}
                                    title={item.nama}
                                  >
                                    {item.nama}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center border-b border-slate-200/50">
                                  <button
                                    type="button"
                                    onClick={() => toggleLibur(itemKey)}
                                    title={isLibur ? 'Klik untuk mengaktifkan kembali' : 'Klik untuk meliburkan KPM ini'}
                                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border cursor-pointer transition flex items-center gap-1 mx-auto ${
                                      isLibur
                                        ? 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200'
                                        : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-amber-100 hover:text-amber-800'
                                    }`}
                                  >
                                    {isLibur ? <span>✖ Libur</span> : <span>● Aktif</span>}
                                  </button>
                                </td>
                                <td className="py-2.5 px-3 text-center border-b border-slate-200/50">
                                  <select
                                    value={setting.rute}
                                    onChange={(e) => handleUpdateRute(itemKey, e.target.value as 'Kiri' | 'Kanan', setting.no_hp_pic)}
                                    className="bg-white/80 border border-slate-300 rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold text-slate-800 focus:ring-1 focus:ring-slate-800 outline-hidden cursor-pointer"
                                  >
                                    <option value="Kiri">Rute Kiri</option>
                                    <option value="Kanan">Rute Kanan</option>
                                  </select>
                                </td>
                                <td className="py-2.5 px-3 text-center border-b border-slate-200/50">
                                  <input
                                    type="text"
                                    value={setting.no_hp_pic}
                                    onChange={(e) => handleUpdatePic(itemKey, e.target.value, setting.rute)}
                                    placeholder="08xxx..."
                                    className="w-28 text-center bg-white/80 border border-slate-300 rounded-md px-1.5 py-0.5 text-[10.5px] font-mono text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-slate-800 outline-hidden"
                                  />
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono border-b border-slate-200/50">
                                  {isLibur ? (
                                    <span className="font-bold text-slate-300">-</span>
                                  ) : (
                                    <span className="font-bold text-amber-700">
                                      {balita > 0 ? balita.toLocaleString('id-ID') : '-'}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono border-b border-slate-200/50">
                                  {isLibur ? (
                                    <span className="font-bold text-slate-300">-</span>
                                  ) : (
                                    <span className="font-bold text-rose-700">
                                      {bumil > 0 ? bumil.toLocaleString('id-ID') : '-'}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono border-b border-slate-200/50">
                                  {isLibur ? (
                                    <span className="font-semibold text-slate-300">-</span>
                                  ) : (
                                    <span className="font-bold text-pink-700">
                                      {busui > 0 ? busui.toLocaleString('id-ID') : '-'}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono border-b border-slate-200/50">
                                  {isLibur ? (
                                    <span className="font-bold text-slate-300">-</span>
                                  ) : (
                                    <span className="font-black text-slate-900">{total.toLocaleString('id-ID')}</span>
                                  )}
                                </td>
                              </tr>
                            )
                          })
                        ) : (
                          <tr>
                            <td colSpan={9} className="py-6 text-center text-slate-400 font-medium border-b border-slate-200">
                              Belum ada data Posyandu / Sasaran 3B terdaftar.
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot className="bg-emerald-100/80 font-bold text-slate-900 border-t-2 border-emerald-300 text-xs backdrop-blur-md">
                        <tr>
                          <td colSpan={5} className="py-2.5 px-3 font-extrabold uppercase tracking-wider text-slate-800 text-[11px]">
                            SUBTOTAL POSYANDU ({ringkasanOperasional.posyanduAktifCount} POSYANDU AKTIF)
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-amber-800 font-black">
                            {ringkasanOperasional.posyanduBalita.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-rose-800 font-black">
                            {ringkasanOperasional.posyanduBumil.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-pink-800 font-black">
                            {ringkasanOperasional.posyanduBusui.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-950 font-black">
                            {ringkasanOperasional.posyanduTotal.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* RINGKASAN GRAND TOTAL KESELURUHAN GLASS CONTAINER */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md border border-white/20">
                  <div>
                    <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider block">
                      GRAND TOTAL KESELURUHAN PORSI MBG
                    </span>
                    <div className="text-xl font-extrabold flex items-center gap-2">
                      <span>{ringkasanOperasional.grandTotal.toLocaleString('id-ID')} Porsi Harian</span>
                      <span className="text-xs font-normal text-slate-300">
                        ({ringkasanOperasional.totalAktif} Titik Distribusi Aktif)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-md">
                      Sekolah: <span className="font-bold text-amber-300">{ringkasanOperasional.sekolahTotal.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-md">
                      Posyandu: <span className="font-bold text-pink-300">{ringkasanOperasional.posyanduTotal.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-200/60">
            <Link
              href="/kelola-menu-harian"
              className="flex-1 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
            >
              <Edit3 size={15} />
              <span>Kelola Siklus Menu</span>
            </Link>
            <button
              onClick={handlePrintDistribution}
              disabled={isPrinting}
              className="flex-1 px-4 py-2.5 bg-white/80 backdrop-blur-md border border-white/90 hover:bg-white text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPrinting ? (
                <RotateCw size={15} className="text-slate-600 animate-spin" />
              ) : (
                <Printer size={15} className="text-slate-600" />
              )}
              <span>{isPrinting ? 'Memproses Cetak...' : 'Cetak Lembar Distribusi'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Dua Tabel Pemantauan Operasional di Bawah (Glass Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tabel Kiri: Jalur Pendidikan (Sekolah & Lembaga) */}
        <div className="bg-white/70 backdrop-blur-xl border border-white/60 p-5 rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] space-y-4 hover:bg-white/80 transition-all duration-300">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shadow-2xs">
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
                <tr className="bg-slate-100/70 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/60">
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
        <div className="bg-white/70 backdrop-blur-xl border border-white/60 p-5 rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] space-y-4 hover:bg-white/80 transition-all duration-300">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-pink-50 text-pink-600 rounded-xl border border-pink-100 shadow-2xs">
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
                <tr className="bg-slate-100/70 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/60">
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

      {/* 5. Status Jadwal & Rute Distribusi Harian SPPG (Glass Card) */}
      <div className="bg-white/70 backdrop-blur-xl border border-white/60 p-5 rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] space-y-5 hover:bg-white/80 transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/10 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-300/50 uppercase tracking-wider flex items-center gap-1 backdrop-blur-md">
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

          <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md p-2.5 rounded-xl border border-white/80 shrink-0 shadow-2xs">
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

        {/* 3 Wave Cards Grid (Sub Glass Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {gelombangStats.map((item) => (
            <div
              key={item.id}
              className="bg-white/60 backdrop-blur-md rounded-xl border border-white/80 p-4 space-y-3 shadow-2xs hover:border-white hover:bg-white/80 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
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
                <div className="bg-white/80 p-3 rounded-lg border border-white/90 space-y-2 shadow-2xs">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Total Porsi:</span>
                    <span className="font-mono font-black text-slate-900 text-sm">
                      {item.porsi.toLocaleString('id-ID')} <span className="text-[10px] font-normal text-slate-500">Porsi</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1.5 border-t border-slate-200/60">
                    <span className="text-slate-500 font-medium">Titik Tujuan:</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {item.titik} <span className="text-[10px] font-normal text-slate-500">Lokasi KPM</span>
                    </span>
                  </div>
                </div>

                {/* Armada & Rute Info */}
                <div className="space-y-1.5 text-[11px] text-slate-600 bg-slate-50/80 p-2.5 rounded-lg border border-slate-100 font-medium">
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

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
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
        liburKpmIds={liburKpmIds}
      />

      {/* Executive Kiosk TV Display Overlay Component */}
      <KioskModeDisplay
        isOpen={showKioskModal}
        onClose={() => setShowKioskModal(false)}
        initialKpmList={kpmList}
        initialBnbaList={bnbaList}
        initialMenuDb={menuDb}
        liburKpmIds={liburKpmIds}
        distribusiSettings={distribusiSettings}
      />
    </div>
  )
}
