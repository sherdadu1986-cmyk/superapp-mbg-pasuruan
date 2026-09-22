"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { 
  Camera, 
  Upload, 
  MapPin, 
  Clock, 
  Calendar, 
  ShieldCheck, 
  RefreshCw, 
  Download, 
  Check, 
  Sparkles, 
  Image as ImageIcon,
  Compass,
  Tag,
  Sliders,
  CheckCircle2,
  FileText
} from 'lucide-react'
import { showToast } from '@/components/toast'

export default function FotoTimemarkPage() {
  // Form State
  const [activity, setActivity] = useState('Apel Ka SPPG')
  const [timeStr, setTimeStr] = useState('05:09')
  const [dateStr, setDateStr] = useState('Kamis, 17 September 2026')
  const [address, setAddress] = useState('Wonorejo, Wonorejo, Pasuruan, Jawa Timur, 67173')
  const [gpsCoords, setGpsCoords] = useState('7.721269°S, 112.798141°E')
  const [timemarkCode, setTimemarkCode] = useState('3MR1PA66P1TC46')

  // Logo Toggles & Custom Logos
  const [showBgnLogo, setShowBgnLogo] = useState(true)
  const [showRegionalLogo, setShowRegionalLogo] = useState(true)
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(null)
  
  // Custom Background Image
  const [bgImageUrl, setBgImageUrl] = useState<string | null>('/menu-today.png')
  const [isGettingGps, setIsGettingGps] = useState(false)

  // Canvas Reference
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [canvasAspectRatio, setCanvasAspectRatio] = useState<number>(4 / 3)

  // Loaded Images State to prevent unnecessary redraw flickering
  const bgImgRef = useRef<HTMLImageElement | null>(null)
  const bgnLogoRef = useRef<HTMLImageElement | null>(null)
  const regionalLogoRef = useRef<HTMLImageElement | null>(null)
  const customLogoRef = useRef<HTMLImageElement | null>(null)
  const mapImgRef = useRef<HTMLImageElement | null>(null)

  // Helper to generate random Timemark Code
  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = 'PERYM'
    for (let i = 0; i < 9; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setTimemarkCode(code)
    showToast('Kode foto Timemark baru dijana!', 'success')
  }

  // Helper to fetch live GPS Location
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolokasi tidak disokong oleh pelayar ini.', 'error')
      return
    }

    setIsGettingGps(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        const latFormatted = `${Math.abs(lat).toFixed(6)}°${lat < 0 ? 'S' : 'N'}`
        const lngFormatted = `${Math.abs(lng).toFixed(6)}°${lng < 0 ? 'E' : 'W'}`
        setGpsCoords(`${latFormatted}, ${lngFormatted}`)
        setIsGettingGps(false)
        showToast('Koordinat GPS berjaya dikemas kini!', 'success')
      },
      (error) => {
        setIsGettingGps(false)
        console.warn('Geolocation error:', error)
        showToast('Gagal mengambil lokasi GPS peranti.', 'error')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // Auto set current Date & Time
  const handleAutoDateTime = () => {
    const now = new Date()
    const hours = String(now.getHours()).padStart(2, '0')
    const mins = String(now.getMinutes()).padStart(2, '0')
    setTimeStr(`${hours}:${mins}`)

    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]
    const dayName = days[now.getDay()]
    const dateNum = now.getDate()
    const monthName = months[now.getMonth()]
    const year = now.getFullYear()
    setDateStr(`${dayName}, ${dateNum} ${monthName} ${year}`)
    showToast('Waktu & tarikh diselaraskan dengan jam sistem!', 'info')
  }

  // Handle Background Image Upload
  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setBgImageUrl(event.target.result as string)
          showToast('Gambar latar baru berjaya dimuat naik!', 'success')
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle Custom Logo Upload
  const handleCustomLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setCustomLogoUrl(event.target.result as string)
          showToast('Logo tersuai dimuat naik!', 'success')
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Preload Image Utility
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
      img.src = src
    })
  }

  // Redraw Canvas Engine
  const drawCanvas = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Target Canvas Resolution (default 1440 x 1080 for high definition output)
    let targetWidth = 1440
    let targetHeight = 1080

    // Load Background Image if available
    let bgImg: HTMLImageElement | null = null
    if (bgImageUrl) {
      try {
        bgImg = await loadImage(bgImageUrl)
        bgImgRef.current = bgImg
        if (bgImg.width && bgImg.height) {
          targetWidth = Math.max(1200, bgImg.width)
          targetHeight = Math.max(900, bgImg.height)
          setCanvasAspectRatio(targetWidth / targetHeight)
        }
      } catch (err) {
        console.warn('Fallback drawing without bg image:', err)
      }
    }

    canvas.width = targetWidth
    canvas.height = targetHeight

    // 1. Draw Background Image or Dynamic Gradient Fallback
    if (bgImg) {
      ctx.drawImage(bgImg, 0, 0, targetWidth, targetHeight)
    } else {
      const grad = ctx.createLinearGradient(0, 0, targetWidth, targetHeight)
      grad.addColorStop(0, '#1e293b')
      grad.addColorStop(0.5, '#0f172a')
      grad.addColorStop(1, '#020617')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, targetWidth, targetHeight)

      // Decorative grid pattern for empty fallback
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
      ctx.lineWidth = 2
      const step = 60
      for (let x = 0; x < targetWidth; x += step) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, targetHeight)
        ctx.stroke()
      }
      for (let y = 0; y < targetHeight; y += step) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(targetWidth, y)
        ctx.stroke()
      }
    }

    // Load Logos & Map Images asynchronously
    try {
      if (showBgnLogo && !bgnLogoRef.current) {
        bgnLogoRef.current = await loadImage('/logo-bgn.png').catch(() => null)
      }
      if (showRegionalLogo && !regionalLogoRef.current) {
        regionalLogoRef.current = await loadImage('/peta.png').catch(() => null)
      }
      if (customLogoUrl) {
        customLogoRef.current = await loadImage(customLogoUrl).catch(() => null)
      }
      if (!mapImgRef.current) {
        mapImgRef.current = await loadImage('/peta.png').catch(() => null)
      }
    } catch (e) {
      console.warn('Logo preloading notice:', e)
    }

    const scale = targetWidth / 1440
    const margin = 36 * scale

    // -------------------------------------------------------------
    // OVERLAY 1: Peta Mini (Sudut Kiri Atas)
    // -------------------------------------------------------------
    const mapBoxWidth = 230 * scale
    const mapBoxHeight = 135 * scale
    const mapBoxX = margin
    const mapBoxY = margin

    // White rounded card background for map
    ctx.save()
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)'
    ctx.shadowBlur = 12 * scale
    ctx.shadowOffsetY = 4 * scale

    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.roundRect(mapBoxX, mapBoxY, mapBoxWidth, mapBoxHeight, 14 * scale)
    ctx.fill()
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.9)'
    ctx.lineWidth = 1.5 * scale
    ctx.stroke()
    ctx.restore()

    // Map texture / vector roads clipped inside white box
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(mapBoxX + 5 * scale, mapBoxY + 5 * scale, mapBoxWidth - 10 * scale, mapBoxHeight - 10 * scale, 10 * scale)
    ctx.clip()

    if (mapImgRef.current) {
      ctx.drawImage(mapImgRef.current, mapBoxX + 5 * scale, mapBoxY + 5 * scale, mapBoxWidth - 10 * scale, mapBoxHeight - 10 * scale)
    } else {
      ctx.fillStyle = '#f1f5f9'
      ctx.fillRect(mapBoxX + 5 * scale, mapBoxY + 5 * scale, mapBoxWidth - 10 * scale, mapBoxHeight - 10 * scale)
      
      // Vector road illustration
      ctx.strokeStyle = '#cbd5e1'
      ctx.lineWidth = 6 * scale
      ctx.beginPath()
      ctx.moveTo(mapBoxX, mapBoxY + 40 * scale)
      ctx.lineTo(mapBoxX + mapBoxWidth, mapBoxY + 90 * scale)
      ctx.moveTo(mapBoxX + 70 * scale, mapBoxY)
      ctx.lineTo(mapBoxX + 110 * scale, mapBoxY + mapBoxHeight)
      ctx.stroke()
    }

    // Blue Location Pin Dot with Light Green Radar Ripple Circles
    const pinX = mapBoxX + mapBoxWidth / 2
    const pinY = mapBoxY + (mapBoxHeight / 2) - 4 * scale

    // Light Green Radar Ripple Circles (#22c55e / #4ade80)
    ctx.fillStyle = 'rgba(74, 222, 128, 0.35)'
    ctx.beginPath()
    ctx.arc(pinX, pinY, 26 * scale, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = 'rgba(34, 197, 94, 0.55)'
    ctx.beginPath()
    ctx.arc(pinX, pinY, 15 * scale, 0, Math.PI * 2)
    ctx.fill()

    // Blue Location Pin Dot
    ctx.fillStyle = '#2563EB' // Bright Blue Pin
    ctx.beginPath()
    ctx.arc(pinX, pinY, 7.5 * scale, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 2.5 * scale
    ctx.stroke()

    // Angled "Peta" label on edge
    ctx.font = `italic 700 ${11 * scale}px sans-serif`
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)'
    ctx.textAlign = 'right'
    ctx.fillText('Peta', mapBoxX + mapBoxWidth - 12 * scale, mapBoxY + mapBoxHeight - 12 * scale)
    ctx.restore()

    // -------------------------------------------------------------
    // OVERLAY 2: Teks Vertikal Sisi Kanan (Watermark Timemark Verified)
    // -------------------------------------------------------------
    ctx.save()
    ctx.translate(targetWidth - (24 * scale), targetHeight / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.font = `700 ${16 * scale}px sans-serif`
    ctx.fillStyle = '#FFFFFF'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)'
    ctx.shadowBlur = 4 * scale
    ctx.shadowOffsetX = 1 * scale
    ctx.shadowOffsetY = 1 * scale
    ctx.textAlign = 'center'
    ctx.fillText(`© ${timemarkCode} Timemark Verified`, 0, 0)
    ctx.restore()

    // -------------------------------------------------------------
    // OVERLAY 3: Kotak Putih Kiri Bawah (HANYA UNTUK JAM & LOGO)
    // -------------------------------------------------------------
    const timeFontSize = 46 * scale
    ctx.font = `900 ${timeFontSize}px sans-serif`
    const timeText = timeStr || '05:09'
    const timeWidth = ctx.measureText(timeText).width

    let logoCount = 0
    if (showBgnLogo && bgnLogoRef.current) logoCount++
    if (showRegionalLogo && regionalLogoRef.current) logoCount++
    if (customLogoUrl && customLogoRef.current) logoCount++

    const logoSize = 42 * scale
    const logoSpacing = 10 * scale
    const logosTotalWidth = logoCount > 0 ? (logoCount * logoSize) + ((logoCount - 1) * logoSpacing) : 0

    const hasActivity = Boolean(activity && activity.trim())
    let activityBadgeWidth = 0
    if (hasActivity) {
      ctx.font = `800 ${12 * scale}px sans-serif`
      activityBadgeWidth = Math.max(90 * scale, ctx.measureText(activity.toUpperCase()).width + (20 * scale))
    }

    const cardPaddingX = 18 * scale
    const whiteBoxWidth = cardPaddingX + (hasActivity ? activityBadgeWidth + (14 * scale) : 0) + timeWidth + (logosTotalWidth > 0 ? (24 * scale) + logosTotalWidth : 0) + cardPaddingX
    const whiteBoxHeight = 74 * scale

    // Position of white box: bottom left, leaving room for detail text underneath
    const whiteBoxX = margin
    const whiteBoxY = targetHeight - (240 * scale)

    // Draw CLEAN WHITE (#FFFFFF) Rounded Box
    ctx.save()
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)'
    ctx.shadowBlur = 16 * scale
    ctx.shadowOffsetY = 6 * scale

    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.roundRect(whiteBoxX, whiteBoxY, whiteBoxWidth, whiteBoxHeight, 14 * scale)
    ctx.fill()
    ctx.restore()

    // Draw elements INSIDE the white box
    let currX = whiteBoxX + cardPaddingX

    // 3a. Activity Badge (Yellow/Orange #f59e0b) if present
    if (hasActivity) {
      const badgeY = whiteBoxY + (16 * scale)
      const badgeH = whiteBoxHeight - (32 * scale)

      ctx.fillStyle = '#f59e0b'
      ctx.beginPath()
      ctx.roundRect(currX, badgeY, activityBadgeWidth, badgeH, 6 * scale)
      ctx.fill()

      ctx.fillStyle = '#0f172a'
      ctx.font = `900 ${11 * scale}px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(activity.toUpperCase(), currX + (activityBadgeWidth / 2), badgeY + (badgeH / 2) + (4 * scale))

      currX += activityBadgeWidth + (14 * scale)
    }

    // 3b. Angka Jam (Biru Tua Navy #0b2246)
    ctx.fillStyle = '#0b2246'
    ctx.font = `900 ${timeFontSize}px sans-serif`
    ctx.textAlign = 'left'
    ctx.fillText(timeText, currX, whiteBoxY + (52 * scale))

    currX += timeWidth + (24 * scale)

    // 3c. Side-by-side Logos inside white box
    if (showBgnLogo && bgnLogoRef.current) {
      const logoY = whiteBoxY + (whiteBoxHeight - logoSize) / 2
      ctx.drawImage(bgnLogoRef.current, currX, logoY, logoSize, logoSize)
      currX += logoSize + logoSpacing
    }

    if (showRegionalLogo && regionalLogoRef.current) {
      const logoY = whiteBoxY + (whiteBoxHeight - logoSize) / 2
      ctx.drawImage(regionalLogoRef.current, currX, logoY, logoSize, logoSize)
      currX += logoSize + logoSpacing
    }

    if (customLogoUrl && customLogoRef.current) {
      const logoY = whiteBoxY + (whiteBoxHeight - logoSize) / 2
      ctx.drawImage(customLogoRef.current, currX, logoY, logoSize, logoSize)
      currX += logoSize + logoSpacing
    }

    // -------------------------------------------------------------
    // OVERLAY 4: Teks Informasi di Bawah Jam (TRANSPARAN DI ATAS FOTO)
    // -------------------------------------------------------------
    const textStartY = whiteBoxY + whiteBoxHeight + (18 * scale)
    const textLineHeight = 24 * scale
    const totalLines = 4
    const lineBarHeight = (totalLines * textLineHeight) - (6 * scale)

    // 4a. Garis Vertikal Oranye tebal (#f59e0b) di sebelah kiri blok teks
    const lineX = margin + (2 * scale)
    ctx.fillStyle = '#f59e0b'
    ctx.beginPath()
    ctx.roundRect(lineX, textStartY - (12 * scale), 4.5 * scale, lineBarHeight, 2 * scale)
    ctx.fill()

    // Setup high contrast drop shadow for all text over photo
    ctx.save()
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)'
    ctx.shadowBlur = 4 * scale
    ctx.shadowOffsetX = 1 * scale
    ctx.shadowOffsetY = 1 * scale
    ctx.fillStyle = '#FFFFFF'

    const textX = lineX + (16 * scale)
    let currentTextY = textStartY

    // Baris 1: Tarikh / Hari (Font Bold)
    ctx.font = `700 ${17 * scale}px sans-serif`
    ctx.fillText(dateStr || 'Kamis, 17 September 2026', textX, currentTextY)

    // Baris 2: Alamat Lengkap (Font Reguler)
    currentTextY += textLineHeight
    ctx.font = `400 ${14 * scale}px sans-serif`
    ctx.fillText(address || 'Wonorejo, Wonorejo, Pasuruan, Jawa Timur, 67173', textX, currentTextY)

    // Baris 3: Koordinat GPS (Font Reguler)
    currentTextY += textLineHeight
    ctx.font = `400 ${14 * scale}px sans-serif`
    ctx.fillText(gpsCoords || '7.721269°S, 112.798141°E', textX, currentTextY)

    // Baris 4: Kode Foto (Dengan ikon pelindung/check badge)
    currentTextY += textLineHeight

    const badgeIconRadius = 8 * scale
    const badgeIconX = textX + badgeIconRadius
    const badgeIconY = currentTextY - (5 * scale)

    ctx.fillStyle = '#22C55E'
    ctx.beginPath()
    ctx.arc(badgeIconX, badgeIconY, badgeIconRadius, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 1.8 * scale
    ctx.beginPath()
    ctx.moveTo(badgeIconX - (3 * scale), badgeIconY)
    ctx.lineTo(badgeIconX - (0.5 * scale), badgeIconY + (2.5 * scale))
    ctx.lineTo(badgeIconX + (4 * scale), badgeIconY - (2.5 * scale))
    ctx.stroke()

    ctx.fillStyle = '#FFFFFF'
    ctx.font = `700 ${14 * scale}px sans-serif`
    ctx.fillText(`Kode Foto: ${timemarkCode}`, textX + (badgeIconRadius * 2) + (8 * scale), currentTextY)

    ctx.restore()

    // -------------------------------------------------------------
    // OVERLAY 5: Logo Timemark Kanan Bawah (TANPA KOTAK BACKGROUND HITAM!)
    // -------------------------------------------------------------
    const stampX = targetWidth - margin - (200 * scale)
    const stampY = targetHeight - margin - (35 * scale)

    ctx.save()
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)'
    ctx.shadowBlur = 6 * scale
    ctx.shadowOffsetX = 1 * scale
    ctx.shadowOffsetY = 1 * scale

    // Tulisan Atas: "Timemark" warna KUNING TERANG (#facc15), font tebal
    ctx.fillStyle = '#facc15'
    ctx.font = `900 ${28 * scale}px sans-serif`
    ctx.textAlign = 'left'
    ctx.fillText('Timemark', stampX, stampY)

    // Tulisan Bawah: "Foto 100% akurat" warna PUTIH (#ffffff), font reguler
    ctx.fillStyle = '#FFFFFF'
    ctx.font = `500 ${14 * scale}px sans-serif`
    ctx.fillText('Foto 100% akurat', stampX, stampY + (20 * scale))
    ctx.restore()

  }, [activity, timeStr, dateStr, address, gpsCoords, timemarkCode, showBgnLogo, showRegionalLogo, customLogoUrl, bgImageUrl])

  // Trigger re-render whenever dependency state changes
  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  // Download Timemark Image
  const handleDownloadImage = () => {
    const canvas = canvasRef.current
    if (!canvas) {
      showToast('Kanvas belum bersedia untuk dimuat turun.', 'error')
      return
    }

    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95)
      const cleanActivity = activity.replace(/[^a-zA-Z0-9]/g, '_') || 'aktiviti'
      const cleanDate = dateStr.replace(/[^a-zA-Z0-9]/g, '_') || 'tarikh'
      const fileName = `Timemark-${cleanActivity}-${cleanDate}.jpg`

      const link = document.createElement('a')
      link.href = dataUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      showToast(`Foto Timemark berjaya dimuat turun (${fileName})!`, 'success')
    } catch (err) {
      console.error('Download error:', err)
      showToast('Gagal memuat turun foto.', 'error')
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 md:p-8 text-white shadow-2xl border border-white/20">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold mb-3 backdrop-blur-md">
              <Camera size={14} className="text-blue-400" />
              <span>Studio Dokumentasi SPPG Pasuruan</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Custom Timemark Watermark Studio
            </h1>
            <p className="mt-1 text-slate-300 text-sm max-w-2xl">
              Jana gambar dokumentasi rasmi bertanda masa SPPG Pasuruan lengkap dengan koordinat GPS, tajuk aktiviti, kad maklumat, dan lencana sah Timemark.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleAutoDateTime}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold transition backdrop-blur-md shadow-sm active:scale-95"
            >
              <Clock size={15} className="text-amber-400" />
              <span>Selaraskan Jam Current</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Studio Grid (2-Column Responsive Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Control Form Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-5 md:p-6 border border-white/80 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
              <div className="flex items-center gap-2">
                <Sliders size={18} className="text-blue-600" />
                <h2 className="text-base font-bold text-slate-800">Borang Kawalan Watermark</h2>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                Tetapan Presisi
              </span>
            </div>

            {/* 1. Muat Naik Gambar Latar */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ImageIcon size={14} className="text-indigo-600" />
                  Gambar Latar Dokumentasi
                </span>
                <span className="text-[10px] text-slate-400">Format JPG / PNG</span>
              </label>
              
              <div className="relative group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBgUpload}
                  className="hidden"
                  id="bg-upload-input"
                />
                <label
                  htmlFor="bg-upload-input"
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-400 cursor-pointer transition text-xs font-semibold text-blue-700 group-hover:shadow-sm"
                >
                  <Upload size={16} className="text-blue-600 group-hover:scale-110 transition-transform" />
                  <span>Pilih Gambar Latar Baru</span>
                </label>
              </div>
            </div>

            {/* 2. Medan Aktiviti */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Tag size={14} className="text-amber-600" />
                Nama / Tajuk Aktiviti
              </label>
              <input
                type="text"
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                placeholder="Cth: Apel Ka SPPG"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white/80 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs font-medium text-slate-800 transition"
              />
            </div>

            {/* 3. Medan Jam/Waktu & Medan Tarikh */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock size={14} className="text-blue-600" />
                  Jam / Waktu
                </label>
                <input
                  type="text"
                  value={timeStr}
                  onChange={(e) => setTimeStr(e.target.value)}
                  placeholder="04:03"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white/80 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs font-bold text-blue-700 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar size={14} className="text-emerald-600" />
                  Tarikh Rasmi
                </label>
                <input
                  type="text"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  placeholder="Kamis, 10 September 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white/80 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs font-medium text-slate-800 transition"
                />
              </div>
            </div>

            {/* 4. Medan Alamat */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileText size={14} className="text-slate-600" />
                Alamat Lokasi Penuh
              </label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Wonorejo, Wonorejo, Pasuruan, Jawa Timur, 67173"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white/80 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs font-medium text-slate-800 transition resize-none"
              />
            </div>

            {/* 5. Medan Koordinat GPS */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Compass size={14} className="text-rose-600" />
                  Koordinat Latitud / Longitud GPS
                </label>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={isGettingGps}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 disabled:opacity-50"
                >
                  <RefreshCw size={12} className={isGettingGps ? 'animate-spin' : ''} />
                  <span>{isGettingGps ? 'Mengambil GPS...' : 'Ambil GPS Peranti'}</span>
                </button>
              </div>
              <input
                type="text"
                value={gpsCoords}
                onChange={(e) => setGpsCoords(e.target.value)}
                placeholder="7.721035°S, 112.797907°E"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white/80 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs font-mono text-slate-800 transition"
              />
            </div>

            {/* 6. Kod Foto Timemark */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  Kod Foto Timemark Unique
                </label>
                <button
                  type="button"
                  onClick={generateRandomCode}
                  className="text-[11px] font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1"
                >
                  <Sparkles size={12} />
                  <span>Jana Kod Rawak</span>
                </button>
              </div>
              <input
                type="text"
                value={timemarkCode}
                onChange={(e) => setTimemarkCode(e.target.value)}
                placeholder="PERYM941XXPHMD"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white/80 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs font-mono font-bold tracking-wider text-purple-700 uppercase transition"
              />
            </div>

            {/* 7. Pengurusan Logo */}
            <div className="pt-2 border-t border-slate-200/60 space-y-3">
              <span className="text-xs font-bold text-slate-700 block">Pengurusan Logo & Lencana</span>
              
              <div className="grid grid-cols-2 gap-3">
                {/* Toggle Logo BGN */}
                <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white/60 hover:bg-white cursor-pointer transition">
                  <span className="text-xs font-semibold text-slate-700">Logo BGN</span>
                  <input
                    type="checkbox"
                    checked={showBgnLogo}
                    onChange={(e) => setShowBgnLogo(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                </label>

                {/* Toggle Logo Daerah */}
                <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white/60 hover:bg-white cursor-pointer transition">
                  <span className="text-xs font-semibold text-slate-700">Logo Pasuruan</span>
                  <input
                    type="checkbox"
                    checked={showRegionalLogo}
                    onChange={(e) => setShowRegionalLogo(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                </label>
              </div>

              {/* Upload Custom Logo Option */}
              <div className="pt-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCustomLogoUpload}
                  className="hidden"
                  id="custom-logo-input"
                />
                <label
                  htmlFor="custom-logo-input"
                  className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer transition text-xs font-medium text-slate-700"
                >
                  <span className="truncate">
                    {customLogoUrl ? 'Logo Tersuai Dimuat Naik ✓' : 'Muat Naik Logo Tersuai (Optional)'}
                  </span>
                  <Upload size={14} className="text-slate-500 shrink-0 ml-2" />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: HTML5 Canvas Preview & Liquid Glass Download (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-5 md:p-6 border border-white/80 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
              <div className="flex items-center gap-2">
                <Camera size={18} className="text-indigo-600" />
                <h2 className="text-base font-bold text-slate-800">Pratonton Langsung HTML5 Canvas</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  HD Timemark Ready
                </span>
              </div>
            </div>

            {/* High-Resolution Live Canvas Display */}
            <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex items-center justify-center min-h-[380px]">
              <canvas
                ref={canvasRef}
                className="w-full h-auto max-h-[650px] object-contain block transition-all"
                style={{ aspectRatio: `${canvasAspectRatio}` }}
              />
            </div>

            {/* Liquid Glass Download Button */}
            <div className="pt-3">
              <button
                type="button"
                onClick={handleDownloadImage}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-extrabold text-sm md:text-base tracking-wide shadow-[0_10px_25px_-5px_rgba(37,99,235,0.4)] hover:shadow-[0_15px_30px_-5px_rgba(37,99,235,0.6)] active:scale-[0.99] transition-all duration-300 border border-white/30 backdrop-blur-xl flex items-center justify-center gap-3 cursor-pointer"
              >
                <Download size={22} className="animate-bounce" />
                <span>Muat Turun Foto Timemark (JPG)</span>
              </button>
            </div>

            {/* Specification Notes Footer */}
            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 text-[11px] text-slate-600 space-y-1">
              <p className="font-bold text-blue-900 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-blue-600" />
                Jaminan Kualiti Timemark Verification:
              </p>
              <p>
                - Gambar dijana pada resolusi penuh (HD High DPI) tanpa mampatan mengurangkan kejelasan teks.
              </p>
              <p>
                - Menepati format dokumentasi rasmi SPPG Pasuruan bagi pelaporan aktiviti harian penerima manfaat MBG.
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
