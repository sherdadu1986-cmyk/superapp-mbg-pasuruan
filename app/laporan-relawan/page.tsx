'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  Camera,
  MapPin,
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
  Lock,
  UtensilsCrossed,
  ChefHat,
  PackageCheck,
  Truck,
  Droplets,
  Sparkles,
  Shield
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
  DIVISI_FILTER_OPTIONS,
  fetchLaporanRelawanList,
  saveLaporanRelawan,
  deleteLaporanRelawan,
  buildLaporanFilename,
  isSupabaseMissingInfraError,
  type DivisiRelawan,
  type LaporanRelawanRecord
} from '@/lib/laporan-relawan'

export const dynamic = 'force-dynamic'

interface DivisionCardConfig {
  value: DivisiRelawan
  shortLabel: string
  subtitle: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  iconBg: string
  iconText: string
  badgeStyle: string
}

const DIVISION_CARDS: DivisionCardConfig[] = [
  {
    value: 'Divisi Persiapan',
    shortLabel: 'Persiapan',
    subtitle: 'Racik & Bahan',
    icon: UtensilsCrossed,
    iconBg: 'bg-amber-100',
    iconText: 'text-amber-700',
    badgeStyle: 'bg-amber-100 text-amber-900 border-amber-300'
  },
  {
    value: 'Divisi Pengolahan / Masak',
    shortLabel: 'Pengolahan / Masak',
    subtitle: 'Dapur & Masak',
    icon: ChefHat,
    iconBg: 'bg-orange-100',
    iconText: 'text-orange-700',
    badgeStyle: 'bg-orange-100 text-orange-900 border-orange-300'
  },
  {
    value: 'Divisi Pemorsian / Packing',
    shortLabel: 'Pemorsian / Packing',
    subtitle: 'Ompreng & Kemas',
    icon: PackageCheck,
    iconBg: 'bg-blue-100',
    iconText: 'text-blue-700',
    badgeStyle: 'bg-blue-100 text-blue-900 border-blue-300'
  },
  {
    value: 'Divisi Distribusi',
    shortLabel: 'Distribusi',
    subtitle: 'Antar & Rute',
    icon: Truck,
    iconBg: 'bg-emerald-100',
    iconText: 'text-emerald-700',
    badgeStyle: 'bg-emerald-100 text-emerald-900 border-emerald-300'
  },
  {
    value: 'Divisi Cuci Ompreng',
    shortLabel: 'Cuci Ompreng',
    subtitle: 'Cuci & Bilas Steril',
    icon: Droplets,
    iconBg: 'bg-cyan-100',
    iconText: 'text-cyan-700',
    badgeStyle: 'bg-cyan-100 text-cyan-900 border-cyan-300'
  },
  {
    value: 'Divisi Kebersihan & Sanitasi',
    shortLabel: 'Kebersihan & Sanitasi',
    subtitle: 'Higienitas Dapur',
    icon: Sparkles,
    iconBg: 'bg-teal-100',
    iconText: 'text-teal-700',
    badgeStyle: 'bg-teal-100 text-teal-900 border-teal-300'
  },
  {
    value: 'Divisi Umum / Keamanan',
    shortLabel: 'Umum / Keamanan',
    subtitle: 'Area & Logistik',
    icon: Shield,
    iconBg: 'bg-slate-200',
    iconText: 'text-slate-700',
    badgeStyle: 'bg-slate-200 text-slate-800 border-slate-300'
  }
]

const TOTAL_DIVISI = DIVISION_CARDS.length

function getDivisiBadgeStyle(divisi: string): string {
  const found = DIVISION_CARDS.find((d) => d.value === divisi)
  return found ? found.badgeStyle : 'bg-indigo-100 text-indigo-900 border-indigo-300'
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
  const [divisi, setDivisi] = useState<string>(DIVISION_CARDS[2].value)
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

  // Locked Verification Photo Code & Anti-Duplicate Save Marker
  const [kodeFoto, setKodeFoto] = useState<string>(() => generateTimemarkCode('SPPG'))
  const [savedKodeFoto, setSavedKodeFoto] = useState<string | null>(null)

  // ─── Action & Save State ─────────────────────────────────
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [isSharingWa, setIsSharingWa] = useState<boolean>(false)
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

  // ─── Refs for Focus/Scroll Guidance & Canvas ─────────────
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const archiveSectionRef = useRef<HTMLElement | null>(null)
  const gpsBannerRef = useRef<HTMLDivElement | null>(null)
  const divisiSelectorRef = useRef<HTMLDivElement | null>(null)
  const namaInputRef = useRef<HTMLInputElement | null>(null)
  const cameraTriggerRef = useRef<HTMLButtonElement | null>(null)

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
  const loadArchiveData = useCallback(async (silent = false) => {
    if (!silent) setLoadingArchive(true)
    const res = await fetchLaporanRelawanList()
    setArchiveRecords(res.records)
    setCloudReady(res.cloudReady)
    setCloudWarning(res.cloudError || '')
    if (!silent) setLoadingArchive(false)
  }, [])

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

    loadArchiveData(false)

    return () => clearInterval(clockTimer)
  }, [loadArchiveData])

  useEffect(() => {
    requestRealTimeGps(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  // Invalidate previously saved version if payload is modified after saving
  const resetSavedVersionIfEdited = useCallback(() => {
    if (savedKodeFoto !== null) {
      setKodeFoto(generateTimemarkCode('SPPG'))
      setSavedKodeFoto(null)
      setLastSavedRecord(null)
    }
  }, [savedKodeFoto])

  const handleSelectDivision = (selected: DivisiRelawan) => {
    if (divisi === selected) return
    setDivisi(selected)
    resetSavedVersionIfEdited()
  }

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
    setSavedKodeFoto(null)
    setLastSavedRecord(null)
    showToast(`Foto #${Math.min(6, photos.length + 1)} berhasil dijepret!`, 'success')
  }

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id))
    setKodeFoto(generateTimemarkCode('SPPG'))
    setSavedKodeFoto(null)
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
    setKodeFoto(generateTimemarkCode('SPPG'))
    setSavedKodeFoto(null)
    setLastSavedRecord(null)
  }

  const handleClearPhotos = () => {
    setPhotos([])
    setKodeFoto(generateTimemarkCode('SPPG'))
    setSavedKodeFoto(null)
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

  // ─── Mandatory Validation Before Save / Share ────────────
  const validateBeforeSaveOrShare = (): boolean => {
    if (!divisi) {
      showToast('Pilih Divisi Relawan terlebih dahulu.', 'warning')
      divisiSelectorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      divisiSelectorRef.current?.focus()
      return false
    }
    if (!namaRelawan.trim()) {
      showToast('Isi Nama Relawan / PIC Shift terlebih dahulu.', 'warning')
      namaInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      namaInputRef.current?.focus()
      return false
    }
    if (photos.length === 0) {
      showToast('Ambil minimal 1 foto langsung dari kamera sebelum melanjutkan.', 'warning')
      cameraTriggerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      cameraTriggerRef.current?.focus()
      return false
    }
    if (!gpsLocked || !gpsCoords) {
      showToast(
        'GPS belum terkunci! Aktifkan GPS perangkat & izinkan lokasi sebelum menyimpan.',
        'error'
      )
      gpsBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return false
    }
    return true
  }

  // ─── Unified Anti-Duplicate Save Engine ──────────────────
  const persistCurrentReportIfNeeded = async (): Promise<{
    record: LaporanRelawanRecord
    blob: Blob
    newlySaved: boolean
  }> => {
    await renderCollageCanvas()
    const blob = await getCanvasJpegBlob(0.92)

    if (savedKodeFoto === kodeFoto && lastSavedRecord) {
      return { record: lastSavedRecord, blob, newlySaved: false }
    }

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

    setSavedKodeFoto(result.record.kode_foto || kodeFoto)
    setLastSavedRecord(result.record)
    setHighlightedId(result.record.id)
    setArchiveRecords((prev) => [
      result.record,
      ...prev.filter((r) => r.id !== result.record.id && r.kode_foto !== result.record.kode_foto)
    ])

    if (result.savedToCloud && result.storageUploaded) {
      setCloudReady(true)
      setCloudWarning('')
      loadArchiveData(true)
    } else if (result.warningMessage && isSupabaseMissingInfraError(result.warningMessage)) {
      setCloudReady(false)
      setCloudWarning(result.warningMessage)
    }

    return { record: result.record, blob, newlySaved: true }
  }

  // ─── Action 1: Simpan Laporan ke Web ─────────────────────
  const handleSaveToWeb = async () => {
    if (!validateBeforeSaveOrShare()) return

    if (savedKodeFoto === kodeFoto && lastSavedRecord) {
      showToast(`Laporan ${kodeFoto} sudah tersimpan di Arsip Web (anti-duplikat).`, 'success')
      archiveSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }

    setIsSaving(true)
    try {
      const { record } = await persistCurrentReportIfNeeded()
      if (!record.isLocalFallback) {
        showToast('Laporan kolase berhasil disimpan ke Arsip Web & Supabase Storage!', 'success')
      } else {
        showToast('Laporan tersimpan sementara di cache lokal (Supabase belum siap).', 'warning')
      }
      setTimeout(() => {
        archiveSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 220)
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

  // ─── Action 3: Auto-Save + Share ke WhatsApp (Anti-Duplikat)
  const handleShareWhatsApp = async (customRecord?: LaporanRelawanRecord) => {
    let recordForShare: LaporanRelawanRecord | undefined = customRecord
    let shareBlob: Blob | null = null

    if (!customRecord) {
      if (!validateBeforeSaveOrShare()) return

      setIsSharingWa(true)
      try {
        const persisted = await persistCurrentReportIfNeeded()
        recordForShare = persisted.record
        shareBlob = persisted.blob
        if (persisted.newlySaved) {
          showToast('Laporan tersimpan otomatis ke Arsip Web!', 'success')
        }
      } catch (err: any) {
        setIsSharingWa(false)
        showToast(err?.message || 'Gagal menyimpan laporan sebelum share WhatsApp.', 'error')
        return
      }
    }

    const targetDivisi = recordForShare?.divisi || divisi
    const targetRelawan = recordForShare?.nama_relawan || namaRelawan.trim() || '-'
    const targetDate = recordForShare
      ? formatShortIndoDate(recordForShare.tanggal_laporan)
      : jakartaNow.dateStr
    const targetDateISO = recordForShare?.tanggal_laporan || jakartaNow.tanggalISO
    const targetTime = recordForShare?.waktu_laporan || jakartaNow.timeStr
    const targetAddress =
      recordForShare?.lokasi_alamat || address || `Koordinat GPS (${gpsCoords})`
    const targetCoords = recordForShare?.koordinat_gps || gpsCoords
    const targetKet = recordForShare?.keterangan || keterangan.trim() || '-'
    const targetCode = recordForShare?.kode_foto || kodeFoto
    const targetUrl =
      recordForShare?.image_url && !recordForShare.image_url.startsWith('data:')
        ? recordForShare.image_url
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
    const captionWA = lines.join('\n')

    try {
      if (!shareBlob && recordForShare?.image_url) {
        const res = await fetch(recordForShare.image_url)
        if (res.ok) shareBlob = await res.blob()
      }

      if (shareBlob && typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        const jpgFile = new File([shareBlob], filename, { type: 'image/jpeg' })
        const canShareFiles =
          typeof navigator.canShare === 'function' && navigator.canShare({ files: [jpgFile] })

        if (canShareFiles) {
          await navigator.share({
            files: [jpgFile],
            title: 'Laporan Relawan SPPG',
            text: captionWA
          })
          setIsSharingWa(false)
          showToast('Berhasil membagikan kolase laporan ke WhatsApp!', 'success')
          return
        }
      }
    } catch (err: any) {
      setIsSharingWa(false)
      if (err?.name === 'AbortError') return
      console.warn('Web Share API fallback to desktop download + wa.me:', err)
    }

    try {
      if (shareBlob) {
        const objectUrl = URL.createObjectURL(shareBlob)
        triggerDownloadUrl(objectUrl, filename)
        setTimeout(() => URL.revokeObjectURL(objectUrl), 3000)
      } else if (!customRecord && canvasRef.current) {
        triggerDownloadUrl(canvasRef.current.toDataURL('image/jpeg', 0.95), filename)
      }
    } catch {}

    const waUrl = `https://wa.me/?text=${encodeURIComponent(captionWA)}`
    window.open(waUrl, '_blank', 'noopener,noreferrer')
    setIsSharingWa(false)
    showToast(
      customRecord
        ? 'JPG diunduh & WhatsApp Web dibuka.'
        : 'Laporan disimpan ke Arsip Web, JPG diunduh, & WhatsApp dibuka.',
      'success'
    )
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
      if (lastSavedRecord?.id === item.id) {
        setLastSavedRecord(null)
        setSavedKodeFoto(null)
      }
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

  const isAlreadySaved = savedKodeFoto === kodeFoto && Boolean(lastSavedRecord)
  const busyAction = isSaving || isSharingWa
  const step1Done = Boolean(divisi && namaRelawan.trim())
  const step2Done = photos.length > 0

  return (
    <div className="w-full max-w-7xl mx-auto overflow-x-hidden space-y-4 md:space-y-6 pb-8 md:pb-14">
      {/* ─── HEADER & 2-COL MOBILE / 4-COL DESKTOP STATUS CARDS ─ */}
      <section className="w-full max-w-full bg-white rounded-2xl border border-slate-200 shadow-xs p-3.5 sm:p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-teal-800 text-[10px] md:text-[11px] font-bold uppercase tracking-wider">
              <Lock size={11} />
              <span>Kamera Langsung &amp; Kunci GPS Real-Time</span>
            </div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              Laporan Kerja Harian Relawan
            </h1>
            <p className="hidden md:block text-sm text-slate-600 max-w-2xl">
              Pilih 1 dari 7 divisi operasional SPPG, potret langsung 1–6 foto via kamera, lalu klik <strong>Simpan &amp; Share ke WhatsApp</strong> untuk otomatis mengarsipkan ke web sekaligus mengirim ke grup.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => requestRealTimeGps(true)}
              disabled={isRefreshingGps}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer disabled:opacity-60 ${
                gpsLocked
                  ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-900'
                  : 'bg-rose-700 hover:bg-rose-800 border-rose-700 text-white'
              }`}
            >
              <RefreshCw size={13} className={isRefreshingGps ? 'animate-spin' : ''} />
              <span>{gpsLocked ? 'Refresh GPS' : 'Aktifkan GPS'}</span>
            </button>

            <button
              type="button"
              onClick={() => archiveSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-xs font-bold transition cursor-pointer"
            >
              <Images size={13} />
              <span>Lihat Arsip ({archiveRecords.length})</span>
            </button>
          </div>
        </div>

        {/* Status Grid: 2 Columns on Mobile, 4 Columns on Desktop (Anti-Overflow) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mt-3.5 md:mt-5 pt-3.5 md:pt-4 border-t border-slate-200">
          <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] md:text-[11px] font-semibold text-slate-500 uppercase tracking-wide truncate">
              Progres Divisi
            </p>
            <p className="text-sm md:text-lg font-bold text-slate-900 mt-0.5 truncate">
              {activeDivisionsToday} / {TOTAL_DIVISI} Divisi Aktif
            </p>
          </div>

          <button
            type="button"
            onClick={() => archiveSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="min-w-0 text-left rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-2.5 transition cursor-pointer"
          >
            <p className="text-[10px] md:text-[11px] font-semibold text-slate-500 uppercase tracking-wide truncate">
              Laporan Hari Ini / Arsip
            </p>
            <p className="text-sm md:text-lg font-bold text-slate-900 mt-0.5 truncate">
              {todayCount} Hari Ini · {archiveRecords.length}
            </p>
          </button>

          <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] md:text-[11px] font-semibold text-slate-500 uppercase tracking-wide truncate">
              Jam Sistem WIB
            </p>
            <p className="text-sm md:text-base font-mono font-bold text-slate-900 mt-0.5 flex items-center gap-1 truncate">
              <Lock size={12} className="text-blue-700 shrink-0" />
              <span className="truncate">{jakartaNow.timeWithSeconds}</span>
            </p>
          </div>

          <div
            className={`min-w-0 rounded-xl border px-3 py-2.5 ${
              gpsLocked
                ? 'border-emerald-300 bg-emerald-50'
                : 'border-rose-300 bg-rose-50'
            }`}
          >
            <p
              className={`text-[10px] md:text-[11px] font-semibold uppercase tracking-wide truncate ${
                gpsLocked ? 'text-emerald-800' : 'text-rose-800'
              }`}
            >
              Status Kunci GPS
            </p>
            <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
              <span
                className={`inline-block w-2 h-2 rounded-full shrink-0 ${
                  gpsLocked
                    ? 'bg-emerald-600'
                    : gpsStatus === 'searching'
                      ? 'bg-rose-500 animate-pulse'
                      : 'bg-rose-600'
                }`}
              />
              <span
                className={`text-xs md:text-sm font-bold truncate ${
                  gpsLocked ? 'text-emerald-900' : 'text-rose-900'
                }`}
              >
                {gpsLocked
                  ? `Terkunci${gpsAccuracyMeters !== null ? ` ±${gpsAccuracyMeters}m` : ''}`
                  : 'Belum Aktif'}
              </span>
            </div>
          </div>
        </div>

        {/* Interactive Readiness Progress Bar */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border ${
              step1Done
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}
          >
            <CheckCircle2 size={12} className={step1Done ? 'text-emerald-600' : 'text-slate-400'} />
            <span>1. Identitas</span>
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border ${
              step2Done
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}
          >
            <CheckCircle2 size={12} className={step2Done ? 'text-emerald-600' : 'text-slate-400'} />
            <span>2. Foto ({photos.length}/6)</span>
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border ${
              gpsLocked
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <CheckCircle2 size={12} className={gpsLocked ? 'text-emerald-600' : 'text-rose-500'} />
            <span>3. GPS {gpsLocked ? 'Terkunci' : 'Wajib Aktif'}</span>
          </span>
        </div>

        {/* Strict GPS Blocker Alert if not locked */}
        {!gpsLocked && (
          <div
            ref={gpsBannerRef}
            className="mt-3 rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
          >
            <div className="flex items-start gap-2 text-xs text-rose-950 min-w-0">
              <AlertTriangle size={16} className="text-rose-700 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-bold">GPS Belum Aktif / Izin Lokasi Diperlukan</p>
                <p className="text-[11px] text-rose-800 break-words">
                  {gpsErrorMessage} Tombol Cekrek &amp; Simpan terkunci sampai GPS aktif.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => requestRealTimeGps(true)}
              disabled={isRefreshingGps}
              className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold cursor-pointer disabled:opacity-60"
            >
              <RefreshCw size={12} className={isRefreshingGps ? 'animate-spin' : ''} />
              <span>Aktifkan / Refresh GPS</span>
            </button>
          </div>
        )}
      </section>

      {/* Conditional Cloud Setup Notice */}
      {!cloudReady && cloudWarning && (
        <div className="w-full max-w-full rounded-xl border border-amber-300 bg-amber-50 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-start gap-2 min-w-0">
            <Database size={16} className="text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 min-w-0 break-words">
              <span className="font-bold">Database / Bucket Storage Supabase Belum Diinisialisasi:</span>{' '}
              Jalankan <code className="bg-amber-100 px-1 py-0.5 rounded font-mono break-all">supabase/migration_laporan_relawan.sql</code> di Supabase SQL Editor. Data sementara disimpan aman di browser lokal.
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText('supabase/migration_laporan_relawan.sql')
              showToast('Path file migrasi disalin!', 'success')
            }}
            className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold cursor-pointer"
          >
            <Copy size={12} />
            <span>Salin Path SQL</span>
          </button>
        </div>
      )}

      {/* ─── MAIN WORKSPACE: SINGLE COLUMN MOBILE/TABLET (lg:grid-cols-12) ─ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start w-full max-w-full">
        {/* LEFT PANEL (Steps 1, 2 & Read-Only Location Strip) */}
        <div className="lg:col-span-5 min-w-0 w-full max-w-full bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
          {/* LANGKAH 1: IDENTITAS PELAPOR & INTERACTIVE DIVISION CARDS */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-700 text-white text-[11px] font-bold inline-flex items-center justify-center shrink-0">
                  1
                </span>
                <span>Pilih Divisi &amp; Identitas</span>
              </h2>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                7 Divisi Resmi
              </span>
            </div>

            {/* Interactive Division Selector Cards (2 cols HP, 3 cols SM, 2 cols LG, 3 cols XL) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Briefcase size={13} className="text-amber-600 shrink-0" />
                <span>Divisi Relawan</span>
                <span className="text-rose-600">*</span>
              </label>

              <div
                ref={divisiSelectorRef}
                tabIndex={-1}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2 outline-none"
              >
                {DIVISION_CARDS.map((card) => {
                  const IconComponent = card.icon
                  const selected = divisi === card.value
                  return (
                    <button
                      key={card.value}
                      type="button"
                      onClick={() => handleSelectDivision(card.value)}
                      className={`relative min-w-0 text-left rounded-xl border p-2.5 transition-all active:scale-[0.98] cursor-pointer flex flex-col justify-between gap-2 ${
                        selected
                          ? 'border-blue-600 bg-blue-50/90 ring-2 ring-blue-600/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            selected ? 'bg-blue-600 text-white' : `${card.iconBg} ${card.iconText}`
                          }`}
                        >
                          <IconComponent size={16} />
                        </span>
                        {selected && (
                          <CheckCircle2 size={15} className="text-blue-700 shrink-0" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p
                          className={`text-xs font-bold leading-tight break-words ${
                            selected ? 'text-blue-950' : 'text-slate-900'
                          }`}
                        >
                          {card.shortLabel}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                          {card.subtitle}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Nama Relawan / PIC Shift */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <User size={13} className="text-blue-700 shrink-0" />
                <span>Nama Relawan / PIC Shift</span>
                <span className="text-rose-600">*</span>
              </label>
              <input
                ref={namaInputRef}
                type="text"
                list="relawan-sppg-datalist"
                value={namaRelawan}
                onChange={(e) => {
                  setNamaRelawan(e.target.value)
                  resetSavedVersionIfEdited()
                }}
                placeholder="Contoh: Budi Santoso"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
              <datalist id="relawan-sppg-datalist">
                {relawanOptions.map((r) => (
                  <option key={r.id} value={r.nama_lengkap}>
                    {r.divisi}
                  </option>
                ))}
              </datalist>
            </div>

            {/* Catatan Pekerjaan (Opsional) */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileText size={13} className="text-emerald-700 shrink-0" />
                <span>Catatan Pekerjaan</span>
                <span className="text-[11px] font-normal text-slate-500">(Opsional)</span>
              </label>
              <textarea
                rows={2}
                value={keterangan}
                onChange={(e) => {
                  setKeterangan(e.target.value)
                  resetSavedVersionIfEdited()
                }}
                placeholder="Contoh: Selesai mencuci & mensterilkan 3.200 ompreng rute pagi"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 resize-none"
              />
            </div>
          </div>

          {/* LANGKAH 2: AMBIL FOTO KAMERA LANGSUNG */}
          <div className="space-y-2.5 pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-700 text-white text-[11px] font-bold inline-flex items-center justify-center shrink-0">
                  2
                </span>
                <span>Ambil Foto Kamera Langsung</span>
              </h2>
              {photos.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearPhotos}
                  className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 cursor-pointer shrink-0"
                >
                  Hapus Semua
                </button>
              )}
            </div>

            <button
              ref={cameraTriggerRef}
              type="button"
              onClick={() => setIsCameraOpen(true)}
              className="h-12 w-full rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-extrabold flex items-center justify-center gap-2 shadow-xs transition active:scale-[0.98] cursor-pointer"
            >
              <Camera size={19} />
              <span>Buka Kamera Laporan ({photos.length}/6 Foto)</span>
            </button>

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
                          className="p-1 rounded bg-white/90 hover:bg-white text-slate-800 disabled:opacity-30 shadow cursor-pointer"
                        >
                          <ArrowLeft size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMovePhoto(index, 1)}
                          disabled={index === photos.length - 1}
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

          {/* INFO WAKTU & LOKASI RINGKAS (READ-ONLY) */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2 text-xs w-full max-w-full">
            <div className="flex items-center justify-between gap-2 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <Lock size={12} className="text-blue-700 shrink-0" />
                <span className="font-mono font-bold text-slate-900 shrink-0">
                  {jakartaNow.timeStr} WIB
                </span>
                <span className="text-slate-300 shrink-0">·</span>
                <span className="truncate text-slate-700 font-medium">
                  {gpsLocked
                    ? address || `GPS (${gpsCoords})`
                    : 'Menunggu lokasi GPS aktif...'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => requestRealTimeGps(true)}
                disabled={isRefreshingGps}
                className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white hover:bg-slate-100 border border-slate-300 text-blue-700 text-[11px] font-bold cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={11} className={isRefreshingGps ? 'animate-spin' : ''} />
                <span>Refresh GPS</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-200/80 text-[11px] text-slate-500">
              <span className="flex items-center gap-1 font-mono truncate max-w-full">
                <Compass size={11} className="text-slate-400 shrink-0" />
                <span className="truncate">{gpsLocked ? gpsCoords : 'Koordinat belum terkunci'}</span>
              </span>
              <span className="flex items-center gap-1 font-mono font-semibold text-slate-700 shrink-0">
                <ShieldCheck size={11} className="text-emerald-600 shrink-0" />
                <span>{kodeFoto}</span>
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL (Step 3 — Pratinjau Kolase & Desktop Action Bar) */}
        <div className="lg:col-span-7 min-w-0 w-full max-w-full bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
            <h2 className="text-sm md:text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-700 text-white text-[11px] font-bold inline-flex items-center justify-center shrink-0">
                3
              </span>
              <span>Pratinjau Kolase &amp; Kirim</span>
            </h2>

            <div className="flex items-center gap-2 shrink-0">
              <div className="inline-flex rounded-lg border border-slate-300 bg-slate-100 p-0.5 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setCanvasAspect('4:3')}
                  className={`px-2 py-1 rounded-md transition cursor-pointer ${
                    canvasAspect === '4:3'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  4:3
                </button>
                <button
                  type="button"
                  onClick={() => setCanvasAspect('1:1')}
                  className={`px-2 py-1 rounded-md transition cursor-pointer ${
                    canvasAspect === '1:1'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  1:1
                </button>
              </div>
              {isRendering && (
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  Merender...
                </span>
              )}
            </div>
          </div>

          {/* Responsive Canvas Frame (Strictly 100% Width Bounded) */}
          <div className="relative w-full max-w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100 p-1 flex items-center justify-center">
            <canvas
              ref={canvasRef}
              className="w-full h-auto max-w-full rounded-xl shadow-sm block"
            />
            {photos.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-4 text-center">
                <div className="bg-white/95 border border-slate-200 rounded-xl px-4 py-3 shadow-md max-w-xs">
                  <p className="text-xs font-bold text-slate-900">
                    Pratinjau Kolase Siap
                  </p>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Tekan <strong>Buka Kamera Laporan</strong> di Langkah 2 untuk memotret 1–6 foto.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Layout & Sync Status Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
            <span>
              Layout:{' '}
              <strong className="text-slate-900">
                {photos.length === 0
                  ? 'Menunggu Kamera'
                  : photos.length === 1
                    ? '1 Foto Penuh'
                    : photos.length === 2
                      ? '2 Kolom'
                      : photos.length === 3
                        ? '1 Besar + 2 Kanan'
                        : photos.length === 4
                          ? 'Grid 2×2'
                          : photos.length === 5
                            ? 'Grid 2 + 3'
                            : 'Grid 3×2 (6 Foto)'}
              </strong>
            </span>
            {isAlreadySaved ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                <CheckCircle2 size={13} />
                <span>Tersimpan di Arsip Web</span>
              </span>
            ) : (
              <span className="text-[11px] text-slate-500">
                Otomatis tersimpan ke Web saat Share WA
              </span>
            )}
          </div>

          {/* DESKTOP ACTION BAR */}
          <div className="hidden lg:grid lg:grid-cols-12 gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => handleShareWhatsApp()}
              disabled={busyAction}
              style={{ backgroundColor: '#25D366' }}
              className="lg:col-span-6 h-12 px-4 rounded-xl hover:brightness-95 disabled:opacity-60 text-white text-sm font-extrabold shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Share2 size={17} />
              <span>
                {isSharingWa
                  ? 'Menyimpan ke Arsip & Menyiapkan WA...'
                  : 'Simpan & Share ke WhatsApp'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleSaveToWeb}
              disabled={busyAction || !gpsLocked || photos.length === 0}
              className="lg:col-span-3 h-12 px-3 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 disabled:text-slate-500 text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              <Save size={15} />
              <span>{isSaving ? 'Menyimpan...' : isAlreadySaved ? 'Tersimpan' : 'Simpan Web'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadCollage}
              disabled={!gpsLocked || photos.length === 0}
              className="lg:col-span-3 h-12 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 disabled:text-slate-500 text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              <Download size={15} />
              <span>Download JPG</span>
            </button>
          </div>

          {lastSavedRecord && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-900">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 size={15} className="text-emerald-700 shrink-0" />
                <span>
                  Tersimpan di Arsip (<span className="font-mono">{lastSavedRecord.kode_foto}</span>).
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

        {/* MOBILE & TABLET ONLY: Sticky Bottom Action Bar (Zero Horizontal Overflow) */}
        <div className="lg:hidden sticky bottom-2 z-30 w-full max-w-full bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-2.5 shadow-[0_8px_24px_rgba(15,23,42,0.12)] flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleShareWhatsApp()}
            disabled={busyAction}
            style={{ backgroundColor: '#25D366' }}
            className="flex-1 min-w-0 h-12 px-3 rounded-xl hover:brightness-95 disabled:opacity-60 text-white text-xs sm:text-sm font-extrabold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Share2 size={16} className="shrink-0" />
            <span className="truncate">
              {isSharingWa
                ? 'Menyimpan & Menyiapkan WA...'
                : 'Simpan & Share ke WhatsApp'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleSaveToWeb}
            disabled={busyAction}
            title="Simpan Laporan ke Web"
            className={`h-12 px-3 rounded-xl border font-bold text-xs flex flex-col items-center justify-center shrink-0 cursor-pointer ${
              isAlreadySaved
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-blue-700 border-blue-700 text-white'
            }`}
          >
            <Save size={15} />
            <span className="text-[10px] mt-0.5">{isAlreadySaved ? 'Tersimpan' : 'Simpan'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadCollage}
            disabled={!gpsLocked || photos.length === 0}
            title="Download JPG"
            className="h-12 px-3 rounded-xl bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs flex flex-col items-center justify-center shrink-0 cursor-pointer disabled:cursor-not-allowed"
          >
            <Download size={15} />
            <span className="text-[10px] mt-0.5">JPG</span>
          </button>
        </div>
      </div>

      {/* ─── SECTION 5: ARSIP & MONITORING LAPORAN RELAWAN ──────── */}
      <section
        ref={archiveSectionRef}
        className="w-full max-w-full bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 md:p-6 space-y-4 scroll-mt-20"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="min-w-0">
            <h2 className="text-base md:text-lg font-bold text-slate-900">
              Arsip &amp; Monitoring Laporan Relawan di Web
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Tap foto untuk zoom penuh, bagikan ulang ke WhatsApp, atau unduh JPG.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
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
              onClick={() => loadArchiveData(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <RefreshCw size={13} className={loadingArchive ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Muat Ulang</span>
            </button>
          </div>
        </div>

        {/* Filter Bar + Horizontal Swipeable 7-Division Pills */}
        <div className="space-y-3 w-full max-w-full">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-900 max-w-full"
              />
              <button
                type="button"
                onClick={() => setFilterDate(filterDate === todayISO ? '' : todayISO)}
                className={`px-3 py-2 rounded-lg border text-xs font-semibold transition cursor-pointer shrink-0 ${
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
                  className="px-2.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-600 cursor-pointer shrink-0"
                >
                  Semua
                </button>
              )}
            </div>

            <div className="relative flex-1 min-w-0">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari relawan, keterangan, atau kode foto..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>
          </div>

          {/* Horizontal Scrollable Pills Including Cuci Ompreng */}
          <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1 w-full max-w-full">
            {DIVISI_FILTER_OPTIONS.map((opt) => {
              const active = filterDivisi === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFilterDivisi(opt.value)}
                  className={`shrink-0 whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
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
          <div className="py-10 text-center text-xs font-medium text-slate-500">
            Memuat arsip laporan relawan...
          </div>
        ) : filteredArchive.length === 0 ? (
          <div className="py-10 text-center rounded-xl border border-dashed border-slate-300 bg-slate-50 space-y-1.5">
            <Images size={26} className="mx-auto text-slate-400" />
            <p className="text-sm font-bold text-slate-800">Belum ada laporan pada filter ini</p>
            <p className="text-xs text-slate-500">
              Ambil foto lewat Kamera Laporan lalu tekan &ldquo;Simpan &amp; Share ke WhatsApp&rdquo;.
            </p>
          </div>
        ) : archiveViewMode === 'gallery' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-full">
            {filteredArchive.map((item) => {
              const isHighlighted = highlightedId === item.id
              return (
                <article
                  key={item.id}
                  className={`min-w-0 rounded-xl border bg-white overflow-hidden flex flex-col transition ${
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

                  <div className="p-3.5 md:p-4 flex-1 flex flex-col justify-between space-y-3 min-w-0">
                    <div className="space-y-2 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-md border text-[11px] font-bold truncate max-w-[70%] ${getDivisiBadgeStyle(
                            item.divisi
                          )}`}
                        >
                          {item.divisi}
                        </span>
                        <span className="text-[11px] font-medium text-slate-500 shrink-0">
                          {item.tanggal_laporan}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-900 truncate">{item.nama_relawan}</h3>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2 break-words">
                          {item.keterangan || 'Tidak ada catatan tambahan.'}
                        </p>
                      </div>

                      <div className="text-[11px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-100 min-w-0">
                        <p className="truncate flex items-center gap-1">
                          <MapPin size={11} className="text-rose-500 shrink-0" />
                          <span className="truncate">{item.lokasi_alamat || item.koordinat_gps || '-'}</span>
                        </p>
                        <p className="font-mono text-[10px] text-slate-400 truncate">
                          Kode: {item.kode_foto || '-'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => handleShareWhatsApp(item)}
                        style={{ backgroundColor: '#25D366' }}
                        className="flex-1 min-w-0 inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg hover:brightness-95 text-white text-xs font-bold transition cursor-pointer"
                      >
                        <Share2 size={13} className="shrink-0" />
                        <span className="truncate">Share Ulang WA</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadArchiveItem(item)}
                        className="flex-1 min-w-0 inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold transition cursor-pointer"
                      >
                        <Download size={13} className="shrink-0" />
                        <span className="truncate">Unduh JPG</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteArchiveItem(item)}
                        disabled={deletingId === item.id}
                        title="Hapus laporan"
                        className="p-2 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition cursor-pointer disabled:opacity-50 shrink-0"
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
          <div className="w-full max-w-full overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                  <th className="py-3 px-3">No</th>
                  <th className="py-3 px-3">Foto Kolase</th>
                  <th className="py-3 px-3">Tanggal &amp; Jam</th>
                  <th className="py-3 px-3">Divisi</th>
                  <th className="py-3 px-3">Nama Relawan</th>
                  <th className="py-3 px-3">Catatan</th>
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
                          title="Unduh JPG"
                          className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 cursor-pointer"
                        >
                          <Download size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleShareWhatsApp(item)}
                          title="Share Ulang WA"
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
          className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
          onClick={() => setLightboxItem(null)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-w-full overflow-hidden flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <span
                  className={`px-2.5 py-0.5 rounded border text-xs font-bold ${getDivisiBadgeStyle(
                    lightboxItem.divisi
                  )}`}
                >
                  {lightboxItem.divisi}
                </span>
                <span className="text-sm font-bold text-slate-900 truncate">
                  {lightboxItem.nama_relawan}
                </span>
                <span className="text-xs text-slate-500">
                  · {formatShortIndoDate(lightboxItem.tanggal_laporan)} ({lightboxItem.waktu_laporan} WIB)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setLightboxItem(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3 sm:p-4 bg-slate-100 overflow-auto flex items-center justify-center">
              <img
                src={lightboxItem.image_url}
                alt={lightboxItem.divisi}
                className="max-w-full max-h-[62vh] object-contain rounded-lg border border-slate-300 shadow-sm"
              />
            </div>

            <div className="px-4 sm:px-5 py-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-700 space-y-1 min-w-0">
                <p className="font-semibold text-slate-900 break-words">
                  {lightboxItem.keterangan || 'Tidak ada catatan tambahan.'}
                </p>
                <p className="text-slate-500 break-words">
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
                  <span>Unduh JPG</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleShareWhatsApp(lightboxItem)}
                  style={{ backgroundColor: '#25D366' }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg hover:brightness-95 text-white text-xs font-bold cursor-pointer"
                >
                  <Share2 size={14} />
                  <span>Share Ulang WA</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
