'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  Camera,
  MapPin,
  Clock,
  Calendar,
  RefreshCw,
  Download,
  Share2,
  Save,
  Trash2,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Search,
  LayoutGrid,
  Table as TableIcon,
  ZoomIn,
  X,
  User,
  Briefcase,
  FileText,
  Compass,
  Copy,
  Database,
  ExternalLink,
  Images,
  Lock
} from 'lucide-react'
import { showToast } from '@/components/toast'
import { fetchRelawanSppgList, type RelawanSppg } from '@/lib/data-helpers'
import LiveCameraCapture, { type CapturedPhotoItem } from '@/components/LiveCameraCapture'
import {
  formatIndoDate,
  getJakartaNowParts,
  generateTimemarkCode,
  formatGpsCoords,
  parseGpsCoords,
  getTileXY,
  loadCanvasImage,
  renderCollageBackgroundCanvas,
  drawTimemarkWatermark,
  type JakartaTimeParts
} from '@/lib/timemarkWatermark'
import {
  DIVISI_RELAWAN_OPTIONS,
  DIVISI_FILTER_OPTIONS,
  fetchLaporanRelawanList,
  saveLaporanRelawan,
  deleteLaporanRelawan,
  buildLaporanFilename,
  isSupabaseMissingInfraError,
  type LaporanRelawanRecord
} from '@/lib/laporan-relawan'

export const dynamic = 'force-dynamic'

const DIVISI_BADGE_COLORS: Record<string, string> = {
  'Divisi Persiapan': 'bg-amber-100 text-amber-900 border-amber-300',
  'Divisi Pengolahan / Masak': 'bg-orange-100 text-orange-900 border-orange-300',
  'Divisi Pemorsian / Packing': 'bg-blue-100 text-blue-900 border-blue-300',
  'Divisi Distribusi': 'bg-emerald-100 text-emerald-900 border-emerald-300',
  'Divisi Kebersihan & Sanitasi': 'bg-teal-100 text-teal-900 border-teal-300',
  'Divisi Umum / Keamanan': 'bg-slate-200 text-slate-800 border-slate-300'
}

function getDivisiBadgeStyle(divisi: string): string {
  return DIVISI_BADGE_COLORS[divisi] || 'bg-indigo-100 text-indigo-900 border-indigo-300'
}

function formatShortIndoDate(isoDate: string): string {
  if (!isoDate) return '-'
  try {
    const [y, m, d] = isoDate.split('-').map(Number)
    if (!y || !m || !d) return isoDate
    const dt = new Date(y, m - 1, d)
    return formatIndoDate(dt)
  } catch {
    return isoDate
  }
}

export default function LaporanRelawanPage() {
  // ─── Form State ──────────────────────────────────────────
  const [divisi, setDivisi] = useState<string>(DIVISI_RELAWAN_OPTIONS[2])
  const [namaRelawan, setNamaRelawan] = useState<string>('')
  const [keterangan, setKeterangan] = useState<string>('')
  const [photos, setPhotos] = useState<CapturedPhotoItem[]>([])
  const [canvasAspect, setCanvasAspect] = useState<'4:3' | '1:1'>('4:3')
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false)

  // ─── Strict Read-Only Real-Time Clock (Asia/Jakarta) ──────
  const [jakartaNow, setJakartaNow] = useState<JakartaTimeParts>(() => getJakartaNowParts())

  // ─── Strict High-Accuracy GPS Lock State (No Static Fallback)
  const [gpsStatus, setGpsStatus] = useState<'searching' | 'locked' | 'error'>('searching')
  const [gpsCoords, setGpsCoords] = useState<string>('')
  const [gpsAccuracyMeters, setGpsAccuracyMeters] = useState<number | null>(null)
  const [gpsErrorMessage, setGpsErrorMessage] = useState<string>(
    'Mengambil koordinat GPS presisi tinggi dari perangkat...'
  )
  const [address, setAddress] = useState<string>('')
  const [mapLabel, setMapLabel] = useState<string>('Menunggu GPS')
  const [isRefreshingGps, setIsRefreshingGps] = useState<boolean>(false)

  // Locked Verification Photo Code (system-generated)
  const [kodeFoto, setKodeFoto] = useState<string>(() => generateTimemarkCode('SPPG'))

  // ─── Action & Save State ─────────────────────────────────
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [isRendering, setIsRendering] = useState<boolean>(false)
  const [lastSavedRecord, setLastSavedRecord] = useState<LaporanRelawanRecord | null>(null)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)

  // ─── Registered Relawan Autocomplete ─────────────────────
  const [relawanOptions, setRelawanOptions] = useState<RelawanSppg[]>([])

  // ─── Archive & Monitoring State ──────────────────────────
  const [archiveRecords, setArchiveRecords] = useState<LaporanRelawanRecord[]>([])
  const [loadingArchive, setLoadingArchive] = useState<boolean>(true)
  const [cloudReady, setCloudReady] = useState<boolean>(true)
  const [cloudWarning, setCloudWarning] = useState<string>('')
  const [filterDate, setFilterDate] = useState<string>('')
  const [filterDivisi, setFilterDivisi] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [archiveViewMode, setArchiveViewMode] = useState<'gallery' | 'table'>('gallery')
  const [lightboxItem, setLightboxItem] = useState<LaporanRelawanRecord | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // ─── Canvas & Preloaded Asset Refs ───────────────────────
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const archiveSectionRef = useRef<HTMLElement | null>(null)
  const bgnLogoRef = useRef<HTMLImageElement | null>(null)
  const regionalLogoRef = useRef<HTMLImageElement | null>(null)
  const mapFallbackRef = useRef<HTMLImageElement | null>(null)
  const tileCacheRef = useRef<Map<string, HTMLImageElement | null>>(new Map())

  const gpsLocked = gpsStatus === 'locked' && Boolean(gpsCoords)

  // ─── Strict High-Accuracy GPS Fetch + Reverse Geocoding ──
  const requestRealTimeGps = useCallback((manualTrigger = false) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsStatus('error')
      setGpsCoords('')
      setAddress('')
      setGpsAccuracyMeters(null)
      setGpsErrorMessage(
        'Browser atau perangkat ini tidak mendukung GPS (Geolocation API).'
      )
      if (manualTrigger) {
        showToast('Perangkat ini tidak mendukung GPS.', 'error')
      }
      return
    }

    setIsRefreshingGps(true)
    if (!gpsCoords) {
      setGpsStatus('searching')
      setGpsErrorMessage('Mengunci sinyal satelit / lokasi GPS presisi tinggi...')
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        const acc = Number.isFinite(pos.coords.accuracy) ? Math.round(pos.coords.accuracy) : null
        const formatted = formatGpsCoords(lat, lng)

        setGpsCoords(formatted)
        setGpsAccuracyMeters(acc)
        setGpsStatus('locked')
        setGpsErrorMessage('')

        try {
          const res = await fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`)
          if (res.ok) {
            const geo = await res.json()
            if (geo?.success && geo?.address) {
              setAddress(geo.address)
              setMapLabel(geo.mapLabel || 'Lokasi Terkunci')
            } else {
              setAddress(`Koordinat GPS Terverifikasi (${formatted})`)
              setMapLabel(geo?.mapLabel || 'Lokasi GPS')
            }
          } else {
            setAddress(`Koordinat GPS Terverifikasi (${formatted})`)
          }
        } catch {
          setAddress(`Koordinat GPS Terverifikasi (${formatted})`)
        } finally {
          setIsRefreshingGps(false)
        }

        if (manualTrigger) {
          showToast(
            `GPS terkunci (${formatted}${acc !== null ? ` • Akurasi ±${acc}m` : ''})`,
            'success'
          )
        }
      },
      (err) => {
        setIsRefreshingGps(false)
        setGpsStatus('error')
        setGpsCoords('')
        setAddress('')
        setGpsAccuracyMeters(null)

        let friendly = 'Gagal mengunci GPS. Nyalakan GPS HP lalu tekan "Aktifkan / Refresh GPS".'
        if (err?.code === 1) {
          friendly =
            'Izin lokasi ditolak oleh browser. Aktifkan GPS HP dan izinkan akses Lokasi pada situs ini.'
        } else if (err?.code === 2) {
          friendly =
            'Sinyal GPS tidak tersedia. Pastikan Layanan Lokasi (GPS) HP menyala dan berada di area terbuka.'
        } else if (err?.code === 3) {
          friendly =
            'Waktu pencarian GPS habis (timeout). Tekan "Aktifkan / Refresh GPS" untuk mencoba lagi.'
        }
        setGpsErrorMessage(friendly)
        if (manualTrigger) {
          showToast(friendly, 'error')
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }, [gpsCoords])

  // ─── Initial Load: Live Clock (1s), GPS, Font, Relawan, Archive
  useEffect(() => {
    setJakartaNow(getJakartaNowParts(new Date()))
    const clockTimer = setInterval(() => {
      setJakartaNow(getJakartaNowParts(new Date()))
    }, 1000)

    if (typeof document !== 'undefined') {
      const fontId = 'bebas-neue-google-font'
      if (!document.getElementById(fontId)) {
        const link = document.createElement('link')
        link.id = fontId
        link.rel = 'stylesheet'
        link.href = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap'
        document.head.appendChild(link)
      }
    }

    fetchRelawanSppgList()
      .then((list) => setRelawanOptions(list || []))
      .catch(() => {})

    loadArchiveData()

    return () => clearInterval(clockTimer)
  }, [])

  // Trigger GPS request on mount
  useEffect(() => {
    requestRealTimeGps(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadArchiveData = async () => {
    setLoadingArchive(true)
    const res = await fetchLaporanRelawanList()
    setArchiveRecords(res.records)
    setCloudReady(res.cloudReady)
    setCloudWarning(res.cloudError || '')
    setLoadingArchive(false)
  }

  // ─── Render Collage + Tamper-Proof Timemark Watermark ───
  const renderCollageCanvas = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    setIsRendering(true)
    try {
      const W = 1200
      const H = canvasAspect === '1:1' ? 1200 : 900
      canvas.width = W
      canvas.height = H

      if (typeof document !== 'undefined' && document.fonts) {
        const scale = Math.min(W, H) / 1000
        await Promise.all([
          document.fonts.load(`bold ${Math.round(44 * scale)}px "Bebas Neue"`),
          document.fonts.load(`44px "Bebas Neue"`),
          document.fonts.load(`bold ${Math.round(20 * scale)}px Arial`),
          document.fonts.load(`normal ${Math.round(18 * scale)}px Arial`)
        ]).catch(() => {})
      }

      if (!bgnLogoRef.current) {
        bgnLogoRef.current = await loadCanvasImage('/logo-bgn.png').catch(() => null)
      }
      if (!regionalLogoRef.current) {
        regionalLogoRef.current = await loadCanvasImage('/logo-pasuruan.png').catch(() => null)
      }
      if (!mapFallbackRef.current) {
        mapFallbackRef.current = await loadCanvasImage('/peta.png').catch(() => null)
      }

      let dynamicMapTileImg: HTMLImageElement | null = null
      if (gpsLocked && gpsCoords) {
        const { lat, lng } = parseGpsCoords(gpsCoords)
        const tileZoom = 16
        const { x, y } = getTileXY(lat, lng, tileZoom)
        const tileKey = `${tileZoom}/${x}/${y}`

        if (tileCacheRef.current.has(tileKey)) {
          dynamicMapTileImg = tileCacheRef.current.get(tileKey) || null
        } else {
          const tileUrl = `https://tile.openstreetmap.org/${tileZoom}/${x}/${y}.png`
          dynamicMapTileImg = await loadCanvasImage(tileUrl).catch(() => null)
          tileCacheRef.current.set(tileKey, dynamicMapTileImg)
        }
      }

      const collageBg =
        photos.length > 0
          ? renderCollageBackgroundCanvas(
              photos.map((p) => p.img),
              W,
              H,
              4
            )
          : null

      drawTimemarkWatermark(ctx, {
        width: W,
        height: H,
        bgImg: collageBg,
        activity: (divisi || 'LAPORAN RELAWAN').toUpperCase(),
        timeStr: jakartaNow.timeStr,
        dateStr: jakartaNow.dateStr,
        address: gpsLocked
          ? address || `Koordinat GPS Terverifikasi (${gpsCoords})`
          : 'GPS belum aktif — nyalakan GPS perangkat untuk mengunci alamat',
        gpsCoords: gpsLocked ? gpsCoords : 'GPS Belum Terkunci (Menunggu Lokasi Asli)',
        timemarkCode: kodeFoto,
        showBgnLogo: true,
        showRegionalLogo: true,
        bgnLogo: bgnLogoRef.current,
        regionalLogo: regionalLogoRef.current,
        mapImg: gpsLocked ? mapFallbackRef.current : null,
        dynamicMapTileImg,
        mapLabel: gpsLocked ? mapLabel : 'Menunggu GPS'
      })
    } finally {
      setIsRendering(false)
    }
  }, [
    photos,
    canvasAspect,
    divisi,
    jakartaNow.timeStr,
    jakartaNow.dateStr,
    gpsLocked,
    gpsCoords,
    address,
    kodeFoto,
    mapLabel
  ])

  useEffect(() => {
    renderCollageCanvas()
  }, [renderCollageCanvas])

  // ─── Multi-Shot Camera Handlers ──────────────────────────
  const handleCameraShot = (item: CapturedPhotoItem) => {
    if (!gpsLocked) {
      showToast('GPS belum aktif! Aktifkan GPS terlebih dahulu sebelum memotret.', 'error')
      return
    }
    setPhotos((prev) => {
      if (prev.length >= 6) return prev
      return [...prev, item]
    })
    setKodeFoto(generateTimemarkCode('SPPG'))
    setLastSavedRecord(null)
    showToast(`Foto #${Math.min(6, photos.length + 1)} berhasil dijepret!`, 'success')
  }

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id))
    setLastSavedRecord(null)
  }

  const handleMovePhoto = (index: number, direction: -1 | 1) => {
    setPhotos((prev) => {
      const nextIdx = index + direction
      if (nextIdx < 0 || nextIdx >= prev.length) return prev
      const copy = [...prev]
      const temp = copy[index]
      copy[index] = copy[nextIdx]
      copy[nextIdx] = temp
      return copy
    })
    setLastSavedRecord(null)
  }

  const handleClearPhotos = () => {
    setPhotos([])
    setLastSavedRecord(null)
  }

  // ─── Canvas Export Helpers ───────────────────────────────
  const getCanvasJpegBlob = (quality = 0.92): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = canvasRef.current
      if (!canvas) {
        reject(new Error('Kanvas belum tersedia.'))
        return
      }
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Gagal menghasilkan file JPG dari kanvas.'))
        },
        'image/jpeg',
        quality
      )
    })
  }

  const triggerDownloadUrl = (url: string, filename: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // ─── Action 1: Simpan Laporan ke Web (Locked to Live GPS) ─
  const handleSaveToWeb = async () => {
    if (!gpsLocked) {
      showToast(
        'Simpan ditolak: GPS wajib aktif dan terkunci terlebih dahulu.',
        'error'
      )
      return
    }
    if (!divisi) {
      showToast('Pilih Divisi terlebih dahulu.', 'warning')
      return
    }
    if (!namaRelawan.trim()) {
      showToast('Isi Nama Relawan / PIC Shift terlebih dahulu.', 'warning')
      return
    }
    if (photos.length === 0) {
      showToast('Ambil minimal 1 foto langsung dari kamera sebelum menyimpan.', 'warning')
      return
    }

    setIsSaving(true)
    try {
      await renderCollageCanvas()
      const blob = await getCanvasJpegBlob(0.92)
      const fallbackDataUrl = canvasRef.current?.toDataURL('image/jpeg', 0.78) || ''
      const lockedNow = getJakartaNowParts(new Date())

      const result = await saveLaporanRelawan({
        tanggal_laporan: lockedNow.tanggalISO,
        waktu_laporan: lockedNow.timeStr,
        divisi,
        nama_relawan: namaRelawan,
        keterangan,
        lokasi_alamat: address || `Koordinat GPS Terverifikasi (${gpsCoords})`,
        koordinat_gps: gpsCoords,
        kode_foto: kodeFoto,
        imageBlob: blob,
        fallbackDataUrl
      })

      setLastSavedRecord(result.record)
      setArchiveRecords((prev) => [
        result.record,
        ...prev.filter((r) => r.id !== result.record.id)
      ])
      setHighlightedId(result.record.id)

      if (result.savedToCloud && result.storageUploaded) {
        setCloudReady(true)
        setCloudWarning('')
        showToast('Laporan kolase real-time berhasil disimpan ke web & Supabase Storage!', 'success')
      } else {
        if (result.warningMessage && isSupabaseMissingInfraError(result.warningMessage)) {
          setCloudReady(false)
          setCloudWarning(result.warningMessage)
        }
        showToast(
          result.warningMessage || 'Laporan tersimpan di riwayat lokal browser.',
          'warning'
        )
      }

      setTimeout(() => {
        archiveSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 250)
    } catch (err: any) {
      console.error('Save laporan error:', err)
      showToast(err?.message || 'Gagal menyimpan laporan.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  // ─── Action 2: Download Foto Kolase (JPG) ────────────────
  const handleDownloadCollage = async () => {
    const canvas = canvasRef.current
    if (!canvas) {
      showToast('Kanvas kolase belum siap.', 'error')
      return
    }
    if (!gpsLocked || photos.length === 0) {
      showToast('Pastikan GPS aktif dan minimal 1 foto sudah dijepret.', 'warning')
      return
    }
    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95)
      const filename = buildLaporanFilename(divisi, jakartaNow.tanggalISO, jakartaNow.timeStr)
      triggerDownloadUrl(dataUrl, filename)
      showToast(`Foto kolase diunduh (${filename})`, 'success')
    } catch (err) {
      console.error('Download JPG error:', err)
      showToast('Gagal mengunduh foto kolase.', 'error')
    }
  }

  // ─── Action 3: Share ke WhatsApp (File API + wa.me Fallback)
  const handleShareWhatsApp = async (customRecord?: LaporanRelawanRecord) => {
    if (!customRecord && (!gpsLocked || photos.length === 0)) {
      showToast('Pastikan GPS aktif dan minimal 1 foto sudah dijepret.', 'warning')
      return
    }

    const targetDivisi = customRecord?.divisi || divisi
    const targetRelawan = customRecord?.nama_relawan || namaRelawan.trim() || '-'
    const targetDate = customRecord
      ? formatShortIndoDate(customRecord.tanggal_laporan)
      : jakartaNow.dateStr
    const targetDateISO = customRecord?.tanggal_laporan || jakartaNow.tanggalISO
    const targetTime = customRecord?.waktu_laporan || jakartaNow.timeStr
    const targetAddress =
      customRecord?.lokasi_alamat || address || `Koordinat GPS (${gpsCoords})`
    const targetCoords = customRecord?.koordinat_gps || gpsCoords
    const targetKet = customRecord?.keterangan || keterangan.trim() || '-'
    const targetCode = customRecord?.kode_foto || kodeFoto
    const targetUrl =
      customRecord?.image_url && !customRecord.image_url.startsWith('data:')
        ? customRecord.image_url
        : lastSavedRecord?.image_url && !lastSavedRecord.image_url.startsWith('data:')
          ? lastSavedRecord.image_url
          : ''

    const filename = buildLaporanFilename(targetDivisi, targetDateISO, targetTime)
    const lines = [
      '*LAPORAN HARIAN RELAWAN SPPG PASURUAN*',
      `Divisi: ${targetDivisi}`,
      `Relawan / PIC: ${targetRelawan}`,
      `Waktu: ${targetDate} pukul ${targetTime} WIB`,
      `Lokasi: ${targetAddress} (${targetCoords})`,
      `Keterangan: ${targetKet}`,
      `Kode Foto: ${targetCode}`
    ]
    if (targetUrl) {
      lines.push(`Foto Kolase Web: ${targetUrl}`)
    }
    const shareText = lines.join('\n')

    try {
      let blob: Blob | null = null
      if (customRecord?.image_url) {
        const res = await fetch(customRecord.image_url)
        if (res.ok) blob = await res.blob()
      } else {
        blob = await getCanvasJpegBlob(0.92)
      }

      if (blob && typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        const file = new File([blob], filename, { type: 'image/jpeg' })
        const canShareFiles =
          typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })

        if (canShareFiles) {
          await navigator.share({
            files: [file],
            title: `Laporan ${targetDivisi} - ${targetRelawan}`,
            text: shareText
          })
          showToast('Berhasil membuka menu share file WhatsApp!', 'success')
          return
        }
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return
      console.warn('Web Share API fallback to wa.me:', err)
    }

    const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`
    window.open(waUrl, '_blank', 'noopener,noreferrer')
    if (!targetUrl) {
      showToast(
        'Membuka WhatsApp Web. Simpan laporan ke web terlebih dahulu agar tautan foto otomatis ikut terkirim.',
        'warning'
      )
    } else {
      showToast('Membuka WhatsApp dengan ringkasan laporan & tautan foto web.', 'success')
    }
  }

  // ─── Archive Actions ─────────────────────────────────────
  const handleDownloadArchiveItem = async (item: LaporanRelawanRecord) => {
    const filename = buildLaporanFilename(item.divisi, item.tanggal_laporan, item.waktu_laporan)
    try {
      if (item.image_url.startsWith('data:')) {
        triggerDownloadUrl(item.image_url, filename)
        showToast(`Mengunduh ulang (${filename})`, 'success')
        return
      }
      const res = await fetch(item.image_url)
      if (!res.ok) throw new Error('Fetch image failed')
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      triggerDownloadUrl(objectUrl, filename)
      setTimeout(() => URL.revokeObjectURL(objectUrl), 3000)
      showToast(`Mengunduh ulang (${filename})`, 'success')
    } catch {
      window.open(item.image_url, '_blank', 'noopener,noreferrer')
    }
  }

  const handleDeleteArchiveItem = async (item: LaporanRelawanRecord) => {
    if (!confirm(`Hapus laporan ${item.divisi} oleh ${item.nama_relawan}?`)) return
    setDeletingId(item.id)
    const ok = await deleteLaporanRelawan(item)
    setDeletingId(null)
    if (ok) {
      setArchiveRecords((prev) => prev.filter((r) => r.id !== item.id))
      if (lightboxItem?.id === item.id) setLightboxItem(null)
      showToast('Laporan berhasil dihapus.', 'success')
    } else {
      showToast('Gagal menghapus laporan dari Supabase.', 'error')
    }
  }

  // ─── Derived Stats & Filtered Archive ────────────────────
  const todayISO = jakartaNow.tanggalISO
  const todayCount = useMemo(
    () => archiveRecords.filter((r) => r.tanggal_laporan === todayISO).length,
    [archiveRecords, todayISO]
  )
  const activeDivisionsToday = useMemo(
    () =>
      new Set(
        archiveRecords
          .filter((r) => r.tanggal_laporan === todayISO)
          .map((r) => r.divisi)
      ).size,
    [archiveRecords, todayISO]
  )

  const filteredArchive = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return archiveRecords.filter((item) => {
      if (filterDate && item.tanggal_laporan !== filterDate) return false
      if (filterDivisi !== 'ALL' && item.divisi !== filterDivisi) return false
      if (q) {
        const hay = `${item.nama_relawan} ${item.divisi} ${item.keterangan} ${item.lokasi_alamat} ${item.kode_foto}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [archiveRecords, filterDate, filterDivisi, searchQuery])

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-14">
      {/* ─── TOP HEADER (Tamper-Proof Light ERP) ──────────────── */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 md:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-bold uppercase tracking-wider">
              <Lock size={12} />
              <span>Kamera Langsung &amp; Kunci GPS Real-Time SPPG</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              Laporan Kerja Harian Relawan
            </h1>
            <p className="text-xs md:text-sm text-slate-600 max-w-2xl">
              Ambil 1–6 foto langsung menggunakan kamera perangkat dengan jam WIB &amp; koordinat GPS presisi tinggi yang dikunci otomatis oleh sistem (tanpa unggah galeri dan tanpa edit manual).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => requestRealTimeGps(true)}
              disabled={isRefreshingGps}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border text-xs font-bold transition cursor-pointer disabled:opacity-60 ${
                gpsLocked
                  ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-900'
                  : 'bg-rose-700 hover:bg-rose-800 border-rose-700 text-white'
              }`}
            >
              <RefreshCw size={14} className={isRefreshingGps ? 'animate-spin' : ''} />
              <span>Aktifkan / Refresh GPS</span>
            </button>

            <button
              type="button"
              onClick={() => archiveSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-xs font-semibold transition cursor-pointer"
            >
              <Images size={14} />
              <span>Arsip Laporan ({archiveRecords.length})</span>
            </button>
          </div>
        </div>

        {/* Summary KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-200">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Laporan Hari Ini</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{todayCount}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Total Arsip Web</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{archiveRecords.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Jam Sistem WIB</p>
            <p className="text-base font-mono font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
              <Lock size={13} className="text-blue-700 shrink-0" />
              <span>{jakartaNow.timeWithSeconds}</span>
            </p>
          </div>
          <div
            className={`rounded-xl border px-3.5 py-2.5 ${
              gpsLocked
                ? 'border-emerald-300 bg-emerald-50'
                : 'border-rose-300 bg-rose-50'
            }`}
          >
            <p
              className={`text-[11px] font-semibold uppercase tracking-wide ${
                gpsLocked ? 'text-emerald-800' : 'text-rose-800'
              }`}
            >
              Status Kunci GPS
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${
                  gpsLocked
                    ? 'bg-emerald-600'
                    : gpsStatus === 'searching'
                      ? 'bg-rose-500 animate-pulse'
                      : 'bg-rose-600'
                }`}
              />
              <span
                className={`text-xs font-bold truncate ${
                  gpsLocked ? 'text-emerald-900' : 'text-rose-900'
                }`}
              >
                {gpsLocked
                  ? `GPS Terkunci${gpsAccuracyMeters !== null ? ` • Akurasi ±${gpsAccuracyMeters}m` : ''}`
                  : 'GPS Belum Aktif / Izin Ditolak'}
              </span>
            </div>
          </div>
        </div>

        {/* Strict GPS Blocker Notice when not locked */}
        {!gpsLocked && (
          <div className="mt-4 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 text-xs text-rose-950">
              <AlertTriangle size={18} className="text-rose-700 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold">GPS Belum Aktif / Izin Lokasi Diperlukan</p>
                <p className="text-rose-800">
                  {gpsErrorMessage} Tombol <strong>Cekrek Foto</strong> dan <strong>Simpan Laporan ke Web</strong> dinonaktifkan sampai koordinat GPS asli perangkat terkunci.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => requestRealTimeGps(true)}
              disabled={isRefreshingGps}
              className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold cursor-pointer disabled:opacity-60"
            >
              <RefreshCw size={13} className={isRefreshingGps ? 'animate-spin' : ''} />
              <span>Aktifkan / Refresh GPS</span>
            </button>
          </div>
        )}
      </section>

      {/* Conditional Cloud Setup Notice if migration SQL hasn't been executed */}
      {!cloudReady && cloudWarning && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Database size={18} className="text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 space-y-0.5">
              <p className="font-bold">Database / Bucket Storage Supabase Belum Diinisialisasi</p>
              <p className="text-amber-800">
                Jalankan file migrasi <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">supabase/migration_laporan_relawan.sql</code> di Supabase SQL Editor agar laporan tersimpan ke cloud. Sementara ini laporan tetap disimpan aman di cache browser lokal.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText('supabase/migration_laporan_relawan.sql')
              showToast('Path file migrasi disalin: supabase/migration_laporan_relawan.sql', 'success')
            }}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold cursor-pointer"
          >
            <Copy size={13} />
            <span>Salin Path SQL</span>
          </button>
        </div>
      )}

      {/* ─── MAIN WORKSPACE: FORM + LIVE CAMERA CAPTURE + CANVAS ─── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: FORM INPUT & CAMERA TRIGGER (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-blue-700" />
              <h2 className="text-sm md:text-base font-bold text-slate-900">
                1. Data Relawan &amp; Kamera Langsung
              </h2>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              {photos.length}/6 Foto
            </span>
          </div>

          {/* Dropdown Divisi */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Briefcase size={14} className="text-amber-600" />
              <span>Divisi Relawan</span>
              <span className="text-rose-600">*</span>
            </label>
            <select
              value={divisi}
              onChange={(e) => {
                setDivisi(e.target.value)
                setLastSavedRecord(null)
              }}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            >
              {DIVISI_RELAWAN_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Nama Relawan / PIC Shift */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <User size={14} className="text-blue-700" />
              <span>Nama Relawan / PIC Shift</span>
              <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              list="relawan-sppg-datalist"
              value={namaRelawan}
              onChange={(e) => setNamaRelawan(e.target.value)}
              placeholder="Contoh: Siti Aminah / Budi Santoso"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
            <datalist id="relawan-sppg-datalist">
              {relawanOptions.map((r) => (
                <option key={r.id} value={r.nama_lengkap}>
                  {r.divisi}
                </option>
              ))}
            </datalist>
          </div>

          {/* Ringkasan Hasil Pekerjaan */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <FileText size={14} className="text-emerald-700" />
              <span>Ringkasan Hasil Pekerjaan</span>
            </label>
            <textarea
              rows={2}
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Selesai pemorsian 3.200 ompreng rute kiri dalam kondisi higienis"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 resize-none"
            />
          </div>

          {/* Live Camera Multi-Shot Trigger (NO File Upload / Gallery) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Camera size={14} className="text-indigo-700" />
                <span>Pengambilan Foto Langsung (1–6 Foto)</span>
                <span className="text-rose-600">*</span>
              </span>
              {photos.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearPhotos}
                  className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 cursor-pointer"
                >
                  Hapus Semua
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsCameraOpen(true)}
              className="w-full flex flex-col items-center justify-center gap-1.5 px-4 py-4 rounded-xl border-2 border-blue-600 bg-blue-700 hover:bg-blue-800 text-white transition text-center shadow-xs cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Camera size={20} />
                <span className="text-sm font-extrabold">
                  {photos.length === 0
                    ? 'Buka Kamera Laporan'
                    : photos.length < 6
                      ? `Buka Kamera & Tambah Foto (${photos.length}/6)`
                      : `Kelola / Edit Jepretan Kamera (${photos.length}/6)`}
                </span>
              </div>
              <span className="text-[11px] text-blue-100">
                Kamera WebRTC multi-cekrek langsung tanpa akses galeri HP
              </span>
            </button>

            {/* Thumbnail Strip of Camera Captures */}
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 pt-1">
                {photos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-100 aspect-square"
                  >
                    <img
                      src={photo.previewUrl}
                      alt={`Jepretan ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-slate-900/80 text-white text-[10px] font-bold">
                      #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(photo.id)}
                      title="Hapus foto"
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                    {photos.length > 1 && (
                      <div className="absolute bottom-1 inset-x-1 flex items-center justify-between gap-1">
                        <button
                          type="button"
                          onClick={() => handleMovePhoto(index, -1)}
                          disabled={index === 0}
                          title="Geser kiri"
                          className="p-1 rounded bg-white/90 hover:bg-white text-slate-800 disabled:opacity-30 shadow cursor-pointer"
                        >
                          <ArrowLeft size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMovePhoto(index, 1)}
                          disabled={index === photos.length - 1}
                          title="Geser kanan"
                          className="p-1 rounded bg-white/90 hover:bg-white text-slate-800 disabled:opacity-30 shadow cursor-pointer"
                        >
                          <ArrowRight size={11} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Read-Only Tamper-Proof Real-Time Lock Panel */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Lock size={14} className="text-blue-700" />
                <span>Data Waktu &amp; Lokasi (Terkunci Sistem)</span>
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  gpsLocked
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : 'bg-rose-100 text-rose-900 border-rose-300'
                }`}
              >
                {gpsLocked ? 'READ-ONLY TERKUNCI' : 'MENUNGGU GPS'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2">
                <p className="text-[10px] font-semibold text-slate-500 flex items-center gap-1 uppercase">
                  <Clock size={10} /> Jam Server WIB
                </p>
                <p className="text-xs font-mono font-bold text-slate-900 mt-0.5">
                  {jakartaNow.timeWithSeconds} WIB
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2">
                <p className="text-[10px] font-semibold text-slate-500 flex items-center gap-1 uppercase">
                  <Calendar size={10} /> Tanggal Real-Time
                </p>
                <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                  {jakartaNow.dateStr}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold text-slate-500 flex items-center gap-1 uppercase">
                  <MapPin size={10} className="text-rose-600" /> Alamat Lokasi GPS
                </p>
                <button
                  type="button"
                  onClick={() => requestRealTimeGps(true)}
                  disabled={isRefreshingGps}
                  className="text-[10px] font-bold text-blue-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={10} className={isRefreshingGps ? 'animate-spin' : ''} />
                  <span>Refresh GPS</span>
                </button>
              </div>
              <p
                className={`text-xs mt-1 leading-snug ${
                  gpsLocked ? 'text-slate-900 font-medium' : 'text-rose-700 font-semibold'
                }`}
              >
                {gpsLocked
                  ? address || `Koordinat GPS Terverifikasi (${gpsCoords})`
                  : gpsErrorMessage}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2">
                <p className="text-[10px] font-semibold text-slate-500 flex items-center gap-1 uppercase">
                  <Compass size={10} /> Koordinat GPS
                </p>
                <p
                  className={`text-[11px] font-mono mt-0.5 truncate ${
                    gpsLocked ? 'text-slate-900 font-bold' : 'text-rose-700 font-semibold'
                  }`}
                >
                  {gpsLocked ? gpsCoords : 'Belum Terkunci'}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2">
                <p className="text-[10px] font-semibold text-slate-500 flex items-center gap-1 uppercase">
                  <ShieldCheck size={10} /> Kode Foto
                </p>
                <p className="text-[11px] font-mono font-bold text-slate-900 mt-0.5 truncate">
                  {kodeFoto}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE COLLAGE CANVAS & ACTIONS (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Camera size={18} className="text-indigo-700" />
              <h2 className="text-sm md:text-base font-bold text-slate-900">
                2. Pratinjau Kolase &amp; Watermark Timemark
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-lg border border-slate-300 bg-slate-100 p-0.5 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setCanvasAspect('4:3')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                    canvasAspect === '4:3'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  4:3 (1200×900)
                </button>
                <button
                  type="button"
                  onClick={() => setCanvasAspect('1:1')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                    canvasAspect === '1:1'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  1:1 (1200×1200)
                </button>
              </div>
              {isRendering && (
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded">
                  Merender...
                </span>
              )}
            </div>
          </div>

          {/* Canvas Frame */}
          <div className="relative rounded-xl overflow-hidden border border-slate-300 bg-slate-100 p-1.5 flex items-center justify-center">
            <canvas
              ref={canvasRef}
              className="w-full h-auto max-h-[70vh] object-contain rounded-lg shadow-sm block"
            />
            {photos.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-4 text-center">
                <div className="bg-white/95 border border-slate-200 rounded-xl px-4 py-3 shadow-md max-w-sm">
                  <p className="text-xs font-bold text-slate-900">
                    Belum Ada Jepretan Kamera
                  </p>
                  <p className="text-[11px] text-slate-600 mt-1">
                    {gpsLocked
                      ? 'Tekan "Buka Kamera Laporan" untuk mengambil 1–6 foto langsung di lokasi.'
                      : 'Aktifkan GPS terlebih dahulu, lalu tekan "Buka Kamera Laporan" untuk mulai memotret.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Layout Summary Info */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
            <span className="font-medium">
              Layout aktif:{' '}
              <strong className="text-slate-900">
                {photos.length === 0
                  ? 'Menunggu Jepretan Kamera'
                  : photos.length === 1
                    ? '1 Frame Penuh'
                    : photos.length === 2
                      ? 'Split 2 Kolom (50%-50%)'
                      : photos.length === 3
                        ? '1 Besar Kiri + 2 Kanan'
                        : photos.length === 4
                          ? 'Grid 2×2 Simetris'
                          : photos.length === 5
                            ? 'Grid 2 Atas + 3 Bawah Simetris'
                            : 'Grid 3×2 Simetris (6 Foto)'}
              </strong>
            </span>
            <span className="text-[11px] text-slate-500">
              Pemisah putih 4px · Object-cover center-crop
            </span>
          </div>

          {/* 3 Primary Action Buttons (Save disabled until GPS is locked) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <button
              type="button"
              onClick={handleSaveToWeb}
              disabled={isSaving || !gpsLocked || photos.length === 0}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 disabled:text-slate-500 text-white text-xs md:text-sm font-bold shadow-xs transition cursor-pointer disabled:cursor-not-allowed"
            >
              <Save size={16} />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Laporan ke Web'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadCollage}
              disabled={!gpsLocked || photos.length === 0}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 disabled:text-slate-500 text-white text-xs md:text-sm font-bold shadow-xs transition cursor-pointer disabled:cursor-not-allowed"
            >
              <Download size={16} />
              <span>Download Foto Kolase (JPG)</span>
            </button>

            <button
              type="button"
              onClick={() => handleShareWhatsApp()}
              disabled={!gpsLocked || photos.length === 0}
              style={gpsLocked && photos.length > 0 ? { backgroundColor: '#25D366' } : undefined}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl hover:brightness-95 disabled:bg-slate-300 disabled:text-slate-500 text-white text-xs md:text-sm font-bold shadow-xs transition cursor-pointer disabled:cursor-not-allowed"
            >
              <Share2 size={16} />
              <span>Share ke WhatsApp</span>
            </button>
          </div>

          {lastSavedRecord && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-900">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
                <span>
                  Laporan <strong className="font-mono">{lastSavedRecord.kode_foto}</strong> sudah masuk ke riwayat web.
                </span>
              </div>
              {lastSavedRecord.image_url && !lastSavedRecord.image_url.startsWith('data:') && (
                <a
                  href={lastSavedRecord.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-emerald-800 hover:underline"
                >
                  <span>Buka URL Foto</span>
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ─── SECTION 5: ARSIP & MONITORING LAPORAN RELAWAN ──────── */}
      <section
        ref={archiveSectionRef}
        className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 md:p-6 space-y-5 scroll-mt-20"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-base md:text-lg font-bold text-slate-900">
              Arsip &amp; Monitoring Laporan Relawan di Web
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Pantau dokumentasi kerja harian tiap divisi, klik gambar untuk zoom, unduh ulang JPG, atau teruskan ke WhatsApp.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-300 bg-slate-100 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setArchiveViewMode('gallery')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition cursor-pointer ${
                  archiveViewMode === 'gallery'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid size={14} />
                <span>Galeri</span>
              </button>
              <button
                type="button"
                onClick={() => setArchiveViewMode('table')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition cursor-pointer ${
                  archiveViewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TableIcon size={14} />
                <span>Tabel ERP</span>
              </button>
            </div>

            <button
              type="button"
              onClick={loadArchiveData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <RefreshCw size={13} className={loadingArchive ? 'animate-spin' : ''} />
              <span>Muat Ulang</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-900"
              />
              <button
                type="button"
                onClick={() => setFilterDate(filterDate === todayISO ? '' : todayISO)}
                className={`px-3 py-2 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                  filterDate === todayISO
                    ? 'bg-blue-700 border-blue-700 text-white'
                    : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Hari Ini
              </button>
              {filterDate && (
                <button
                  type="button"
                  onClick={() => setFilterDate('')}
                  className="px-2.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-600 cursor-pointer"
                >
                  Semua Tanggal
                </button>
              )}
            </div>

            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama relawan, keterangan, lokasi, atau kode foto..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {DIVISI_FILTER_OPTIONS.map((opt) => {
              const active = filterDivisi === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFilterDivisi(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                    active
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Archive Content */}
        {loadingArchive ? (
          <div className="py-12 text-center text-xs font-medium text-slate-500">
            Memuat arsip laporan relawan...
          </div>
        ) : filteredArchive.length === 0 ? (
          <div className="py-12 text-center rounded-xl border border-dashed border-slate-300 bg-slate-50 space-y-2">
            <Images size={28} className="mx-auto text-slate-400" />
            <p className="text-sm font-bold text-slate-800">Belum ada laporan pada filter ini</p>
            <p className="text-xs text-slate-500">
              Ambil foto lewat Kamera Laporan dan klik &ldquo;Simpan Laporan ke Web&rdquo; untuk mencatat laporan relawan.
            </p>
          </div>
        ) : archiveViewMode === 'gallery' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredArchive.map((item) => {
              const isHighlighted = highlightedId === item.id
              return (
                <article
                  key={item.id}
                  className={`rounded-xl border bg-white overflow-hidden flex flex-col transition ${
                    isHighlighted
                      ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md'
                      : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setLightboxItem(item)}
                    className="relative group aspect-[4/3] w-full bg-slate-100 overflow-hidden cursor-pointer block text-left"
                  >
                    <img
                      src={item.image_url}
                      alt={`${item.divisi} - ${item.nama_relawan}`}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/95 text-slate-900 text-xs font-bold shadow">
                        <ZoomIn size={14} />
                        <span>Perbesar Foto</span>
                      </span>
                    </div>
                    <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-slate-900/80 text-white text-[10px] font-mono font-bold">
                      {item.waktu_laporan} WIB
                    </span>
                    {item.isLocalFallback && (
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-amber-500 text-white text-[10px] font-bold">
                        Cache Lokal
                      </span>
                    )}
                  </button>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-md border text-[11px] font-bold ${getDivisiBadgeStyle(
                            item.divisi
                          )}`}
                        >
                          {item.divisi}
                        </span>
                        <span className="text-[11px] font-medium text-slate-500 shrink-0">
                          {item.tanggal_laporan}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{item.nama_relawan}</h3>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                          {item.keterangan || 'Tidak ada catatan tambahan.'}
                        </p>
                      </div>

                      <div className="text-[11px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-100">
                        <p className="truncate flex items-center gap-1">
                          <MapPin size={11} className="text-rose-500 shrink-0" />
                          <span className="truncate">{item.lokasi_alamat || item.koordinat_gps || '-'}</span>
                        </p>
                        <p className="font-mono text-[10px] text-slate-400">
                          Kode: {item.kode_foto || '-'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => handleDownloadArchiveItem(item)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold transition cursor-pointer"
                      >
                        <Download size={13} />
                        <span>Download Ulang</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleShareWhatsApp(item)}
                        style={{ backgroundColor: '#25D366' }}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg hover:brightness-95 text-white text-xs font-bold transition cursor-pointer"
                      >
                        <Share2 size={13} />
                        <span>Share WA</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteArchiveItem(item)}
                        disabled={deletingId === item.id}
                        title="Hapus laporan"
                        className="p-2 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                  <th className="py-3 px-3">No</th>
                  <th className="py-3 px-3">Foto Kolase</th>
                  <th className="py-3 px-3">Tanggal &amp; Jam</th>
                  <th className="py-3 px-3">Divisi</th>
                  <th className="py-3 px-3">Nama Relawan</th>
                  <th className="py-3 px-3">Ringkasan Pekerjaan</th>
                  <th className="py-3 px-3">Lokasi &amp; Kode</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredArchive.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={
                      highlightedId === item.id
                        ? 'bg-blue-50/70'
                        : 'hover:bg-slate-50 transition-colors'
                    }
                  >
                    <td className="py-3 px-3 font-semibold text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => setLightboxItem(item)}
                        className="w-20 h-14 rounded-md overflow-hidden border border-slate-300 bg-slate-100 hover:ring-2 hover:ring-blue-500 transition cursor-pointer block"
                      >
                        <img
                          src={item.image_url}
                          alt={item.divisi}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{item.tanggal_laporan}</div>
                      <div className="text-slate-500 font-mono">{item.waktu_laporan} WIB</div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded border text-[11px] font-bold ${getDivisiBadgeStyle(
                          item.divisi
                        )}`}
                      >
                        {item.divisi}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">{item.nama_relawan}</td>
                    <td className="py-3 px-3 text-slate-700 max-w-xs">
                      <p className="line-clamp-2">{item.keterangan || '-'}</p>
                    </td>
                    <td className="py-3 px-3 max-w-[220px]">
                      <p className="truncate text-slate-700">{item.lokasi_alamat || '-'}</p>
                      <p className="font-mono text-[10px] text-slate-500">{item.kode_foto || '-'}</p>
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setLightboxItem(item)}
                          title="Lihat & Zoom"
                          className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 cursor-pointer"
                        >
                          <ZoomIn size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadArchiveItem(item)}
                          title="Download Ulang JPG"
                          className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 cursor-pointer"
                        >
                          <Download size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleShareWhatsApp(item)}
                          title="Share ke WhatsApp"
                          style={{ backgroundColor: '#25D366' }}
                          className="p-1.5 rounded text-white hover:brightness-95 cursor-pointer"
                        >
                          <Share2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteArchiveItem(item)}
                          title="Hapus"
                          className="p-1.5 rounded border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ─── LIVE CAMERA MULTI-SHOT MODAL ───────────────────────── */}
      <LiveCameraCapture
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        photos={photos}
        onCapturePhoto={handleCameraShot}
        onRemovePhoto={handleRemovePhoto}
        onMovePhoto={handleMovePhoto}
        maxPhotos={6}
        gpsLocked={gpsLocked}
        gpsStatusMessage={gpsErrorMessage}
        gpsAccuracyMeters={gpsAccuracyMeters}
        onRefreshGps={() => requestRealTimeGps(true)}
        isRefreshingGps={isRefreshingGps}
        liveClockWithSeconds={jakartaNow.timeWithSeconds}
        liveDateStr={jakartaNow.dateStr}
        divisiLabel={divisi}
        liveAddress={address || `Koordinat GPS Terverifikasi (${gpsCoords})`}
      />

      {/* ─── LIGHTBOX MODAL FOR ZOOM INSPECTION ─────────────────── */}
      {lightboxItem && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setLightboxItem(null)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded border text-xs font-bold ${getDivisiBadgeStyle(
                    lightboxItem.divisi
                  )}`}
                >
                  {lightboxItem.divisi}
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {lightboxItem.nama_relawan}
                </span>
                <span className="text-xs text-slate-500">
                  · {formatShortIndoDate(lightboxItem.tanggal_laporan)} ({lightboxItem.waktu_laporan} WIB)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setLightboxItem(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-100 overflow-auto flex items-center justify-center">
              <img
                src={lightboxItem.image_url}
                alt={lightboxItem.divisi}
                className="max-w-full max-h-[62vh] object-contain rounded-lg border border-slate-300 shadow-sm"
              />
            </div>

            <div className="px-5 py-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-700 space-y-1">
                <p className="font-semibold text-slate-900">
                  {lightboxItem.keterangan || 'Tidak ada catatan tambahan.'}
                </p>
                <p className="text-slate-500">
                  {lightboxItem.lokasi_alamat} · {lightboxItem.koordinat_gps} · Kode:{' '}
                  <span className="font-mono font-bold text-slate-700">{lightboxItem.kode_foto}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownloadArchiveItem(lightboxItem)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold cursor-pointer"
                >
                  <Download size={14} />
                  <span>Download JPG</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleShareWhatsApp(lightboxItem)}
                  style={{ backgroundColor: '#25D366' }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg hover:brightness-95 text-white text-xs font-bold cursor-pointer"
                >
                  <Share2 size={14} />
                  <span>Share WA</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
