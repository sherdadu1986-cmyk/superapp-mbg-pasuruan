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

// Helper to format Indonesian Date
const formatIndoDate = (d: Date) => {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}
const padZero = (n: number) => String(n).padStart(2, '0')
const getNowJam = (d: Date = new Date()) => `${padZero(d.getHours())}:${padZero(d.getMinutes())}`

// Helper to parse GPS coordinate string into numeric lat and lng
function parseGpsCoords(coordsStr: string): { lat: number; lng: number } {
  let lat = -7.721269
  let lng = 112.798141

  if (!coordsStr || !coordsStr.trim()) return { lat, lng }

  try {
    const parts = coordsStr.split(',')
    if (parts.length >= 2) {
      const latPart = parts[0].trim()
      const lngPart = parts[1].trim()

      const latMatch = latPart.match(/(-?\d+(?:\.\d+)?)/)
      if (latMatch) {
        let val = parseFloat(latMatch[1])
        if (latPart.toUpperCase().includes('S') && val > 0) val = -val
        lat = val
      }

      const lngMatch = lngPart.match(/(-?\d+(?:\.\d+)?)/)
      if (lngMatch) {
        let val = parseFloat(lngMatch[1])
        if (lngPart.toUpperCase().includes('W') && val > 0) val = -val
        lng = val
      }
    }
  } catch (e) {
    console.warn('GPS coordinate parse notice:', e)
  }

  return { lat, lng }
}

// Helper to convert lat/lng to OpenStreetMap tile X, Y at specified zoom level
function getTileXY(lat: number, lon: number, zoom: number = 16) {
  const x = Math.floor(((lon + 180) / 360) * Math.pow(2, zoom))
  const y = Math.floor(
    ((1 -
      Math.log(
        Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)
      ) /
        Math.PI) /
      2) *
      Math.pow(2, zoom)
  )
  return { x, y }
}

export default function FotoTimemarkPage() {
  // Form State
  const [activity, setActivity] = useState('Apel Ka SPPG')
  const [timeStr, setTimeStr] = useState('')
  const [dateStr, setDateStr] = useState('')
  const [address, setAddress] = useState('Wonorejo, Pasuruan, Jawa Timur, 67173')
  const [gpsCoords, setGpsCoords] = useState('7.720893°S, 112.797827°E')
  const [timemarkCode, setTimemarkCode] = useState('3MR1PA66P1TC46')

  // Auto initialize real-time current date & time on client mount
  useEffect(() => {
    const now = new Date()
    setTimeStr(getNowJam(now))
    setDateStr(formatIndoDate(now))
  }, [])

  // Logo Toggles & Custom Logos
  const [showBgnLogo, setShowBgnLogo] = useState(true)
  const [showRegionalLogo, setShowRegionalLogo] = useState(true)
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(null)
  
  // Custom Background Image
  const [bgImageUrl, setBgImageUrl] = useState<string | null>('/menu-today.png')
  const [isGettingGps, setIsGettingGps] = useState(false)

  // Photo Drag / Pan & Zoom State
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const isDraggingRef = useRef(false)
  const startPosRef = useRef({ x: 0, y: 0 })

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
    setTimeStr(getNowJam(now))
    setDateStr(formatIndoDate(now))
    showToast('Waktu & tarikh diselaraskan dengan waktu sistem saat ini!', 'info')
  }

  // Handle Background Image Upload
  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setBgImageUrl(event.target.result as string)
          setOffset({ x: 0, y: 0 })
          setZoom(1)
          const now = new Date()
          setTimeStr(getNowJam(now))
          setDateStr(formatIndoDate(now))
          showToast('Gambar latar baru dimuat naik & waktu diselaraskan!', 'success')
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
          customLogoRef.current = null
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
      img.onerror = (err) => reject(err)
      img.src = src
    })
  }

  // Redraw Canvas Engine
  const drawCanvas = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // High-Resolution 2400x1800 (High-DPI / 2x scale 4:3)
    const CANVAS_WIDTH = 2400
    const CANVAS_HEIGHT = 1800

    canvas.width = CANVAS_WIDTH
    canvas.height = CANVAS_HEIGHT

    const scale = CANVAS_WIDTH / 1200 // 2.0

    // Clear Canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Load Background Image if available
    let bgImg: HTMLImageElement | null = null
    if (bgImageUrl) {
      try {
        bgImg = await loadImage(bgImageUrl)
        bgImgRef.current = bgImg
      } catch (err) {
        console.warn('Fallback drawing without bg image:', err)
      }
    }

    // Wait for Roboto Condensed & Inter webfonts to load
    if (typeof document !== 'undefined' && document.fonts) {
      try {
        await Promise.all([
          document.fonts.load(`bold ${36 * scale}px "Roboto Condensed"`),
          document.fonts.load(`bold ${18 * scale}px "Inter"`),
          document.fonts.load(`600 ${19 * scale}px "Inter"`),
          document.fonts.load(`normal ${15 * scale}px "Inter"`),
        ])
      } catch (e) {
        console.warn('Font loading notice:', e)
      }
    }

    // 1. Draw Background Image or Dynamic Gradient Fallback (Cover + Pan Offset)
    if (bgImg) {
      const imgRatio = bgImg.width / bgImg.height
      const canvasRatio = CANVAS_WIDTH / CANVAS_HEIGHT
      let drawW: number, drawH: number

      // Cover mode (filling 2400x1800)
      if (imgRatio > canvasRatio) {
        drawH = CANVAS_HEIGHT * zoom
        drawW = drawH * imgRatio
      } else {
        drawW = CANVAS_WIDTH * zoom
        drawH = drawW / imgRatio
      }

      // Convert screen drag offset to canvas scale
      const rect = canvas.getBoundingClientRect()
      const scaleFactor = rect.width > 0 ? CANVAS_WIDTH / rect.width : 1

      const posX = (CANVAS_WIDTH - drawW) / 2 + (offset.x * scaleFactor)
      const posY = (CANVAS_HEIGHT - drawH) / 2 + (offset.y * scaleFactor)

      ctx.drawImage(bgImg, posX, posY, drawW, drawH)
    } else {
      const grad = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      grad.addColorStop(0, '#1e293b')
      grad.addColorStop(0.5, '#0f172a')
      grad.addColorStop(1, '#020617')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      // Decorative grid pattern for empty fallback
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
      ctx.lineWidth = 2 * scale
      const step = 60 * scale
      for (let x = 0; x < CANVAS_WIDTH; x += step) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, CANVAS_HEIGHT)
        ctx.stroke()
      }
      for (let y = 0; y < CANVAS_HEIGHT; y += step) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(CANVAS_WIDTH, y)
        ctx.stroke()
      }
    }

    // Ultra-soft gradient overlay at the bottom to guarantee text legibility without an aggressive black box
    const softGrad = ctx.createLinearGradient(0, CANVAS_HEIGHT - (340 * scale), 0, CANVAS_HEIGHT)
    softGrad.addColorStop(0, 'rgba(0, 0, 0, 0)')
    softGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.08)')
    softGrad.addColorStop(1, 'rgba(0, 0, 0, 0.18)')
    ctx.fillStyle = softGrad
    ctx.fillRect(0, CANVAS_HEIGHT - (340 * scale), CANVAS_WIDTH, 340 * scale)

    // Parse GPS Coordinates dynamically to fetch static map tile
    const { lat: currentLat, lng: currentLng } = parseGpsCoords(gpsCoords)
    const tileZoom = 16
    const { x: tileX, y: tileY } = getTileXY(currentLat, currentLng, tileZoom)
    const mapTileUrl = `https://tile.openstreetmap.org/${tileZoom}/${tileX}/${tileY}.png`

    let dynamicMapTileImg: HTMLImageElement | null = null

    // Load Logos & Map Images asynchronously
    try {
      if (showBgnLogo && !bgnLogoRef.current) {
        bgnLogoRef.current = await loadImage('/logo-bgn.png').catch(() => null)
      }
      if (showRegionalLogo && !regionalLogoRef.current) {
        regionalLogoRef.current = await loadImage('/logo-pasuruan.png').catch(() => null)
      }
      if (customLogoUrl && !customLogoRef.current) {
        customLogoRef.current = await loadImage(customLogoUrl).catch(() => null)
      }
      if (!mapImgRef.current) {
        mapImgRef.current = await loadImage('/peta.png').catch(() => null)
      }
      // Dynamic OSM tile with CORS
      dynamicMapTileImg = await loadImage(mapTileUrl).catch(() => null)
    } catch (e) {
      console.warn('Image preloading notice:', e)
    }

    // -------------------------------------------------------------
    // OVERLAY 1: Mini-Map (Sudut Kiri Atas)
    // -------------------------------------------------------------
    const mapX = 28 * scale
    const mapY = 28 * scale
    const mapWidth = 210 * scale
    const mapHeight = 210 * scale

    // Background Card #FFFFFF, radius 12 * scale
    ctx.save()
    ctx.shadowColor = 'rgba(0, 0, 0, 0.22)'
    ctx.shadowBlur = 12 * scale
    ctx.shadowOffsetY = 4 * scale

    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.roundRect(mapX, mapY, mapWidth, mapHeight, 12 * scale)
    ctx.fill()
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.9)'
    ctx.lineWidth = 1.5 * scale
    ctx.stroke()
    ctx.restore()

    // Map texture / tile clipped inside white box (5px inset)
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(mapX + 5 * scale, mapY + 5 * scale, mapWidth - 10 * scale, mapHeight - 10 * scale, 10 * scale)
    ctx.clip()

    if (dynamicMapTileImg) {
      ctx.drawImage(dynamicMapTileImg, mapX + 5 * scale, mapY + 5 * scale, mapWidth - 10 * scale, mapHeight - 10 * scale)
    } else if (mapImgRef.current) {
      ctx.drawImage(mapImgRef.current, mapX + 5 * scale, mapY + 5 * scale, mapWidth - 10 * scale, mapHeight - 10 * scale)
    } else {
      ctx.fillStyle = '#f1f5f9'
      ctx.fillRect(mapX + 5 * scale, mapY + 5 * scale, mapWidth - 10 * scale, mapHeight - 10 * scale)
      
      // Vector road illustration
      ctx.strokeStyle = '#cbd5e1'
      ctx.lineWidth = 6 * scale
      ctx.beginPath()
      ctx.moveTo(mapX, mapY + 80 * scale)
      ctx.lineTo(mapX + mapWidth, mapY + 150 * scale)
      ctx.moveTo(mapX + 100 * scale, mapY)
      ctx.lineTo(mapX + 140 * scale, mapY + mapHeight)
      ctx.stroke()
    }

    const pinX = mapX + mapWidth / 2
    const pinY = mapY + mapHeight / 2 - 4 * scale

    // Radar Cone (Kerucut Transparan Arah Hadap Kamera)
    ctx.save()
    ctx.fillStyle = 'rgba(52, 211, 153, 0.45)'
    ctx.beginPath()
    ctx.moveTo(pinX, pinY)
    ctx.arc(pinX, pinY, 75 * scale, (25 * Math.PI) / 180, (75 * Math.PI) / 180, false)
    ctx.closePath()
    ctx.fill()
    ctx.restore()

    // Pin Lokasi (Biru cerah #007AFF, radius 13 * scale, titik pusat putih radius 4.5 * scale)
    ctx.fillStyle = '#007AFF'
    ctx.beginPath()
    ctx.arc(pinX, pinY, 13 * scale, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 2.5 * scale
    ctx.stroke()

    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.arc(pinX, pinY, 4.5 * scale, 0, Math.PI * 2)
    ctx.fill()

    // Teks Jalan miring (-35 deg): Font 11 * scale, warna #475569
    ctx.save()
    ctx.translate(mapX + mapWidth - 45 * scale, mapY + 55 * scale)
    ctx.rotate((-35 * Math.PI) / 180)
    ctx.font = `700 ${11 * scale}px "Inter", sans-serif`
    ctx.fillStyle = '#475569'
    ctx.fillText('.WOSARI-PASURUAN', 0, 0)
    ctx.restore()

    // Label peta "Pasuruan / Wonorejo" di bagian sudut
    const badgeText = 'Pasuruan / Wonorejo'
    ctx.save()
    ctx.font = `700 ${10.5 * scale}px "Inter", sans-serif`
    const badgeTextW = ctx.measureText(badgeText).width
    const badgePadX = 7 * scale
    const badgeW = badgeTextW + (badgePadX * 2)
    const badgeH = 19 * scale
    const badgeX = mapX + 8 * scale
    const badgeY = mapY + mapHeight - badgeH - (8 * scale)

    ctx.fillStyle = 'rgba(255, 255, 255, 0.94)'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.16)'
    ctx.shadowBlur = 4 * scale
    ctx.beginPath()
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4 * scale)
    ctx.fill()

    ctx.fillStyle = '#0f172a'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(badgeText, badgeX + badgePadX, badgeY + (badgeH / 2))
    ctx.restore()

    // Close map clipping
    ctx.restore()

    // -------------------------------------------------------------
    // OVERLAY 2: Watermark Vertikal Sisi Kanan
    // -------------------------------------------------------------
    ctx.save()
    ctx.translate(CANVAS_WIDTH - (24 * scale), CANVAS_HEIGHT / 2)
    ctx.rotate((-90 * Math.PI) / 180)
    ctx.font = `500 ${14 * scale}px "Inter", sans-serif`
    ctx.fillStyle = '#FFFFFF'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)'
    ctx.shadowBlur = 4 * scale
    ctx.shadowOffsetX = 1 * scale
    ctx.shadowOffsetY = 1 * scale
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`© ${timemarkCode} Timemark Verified`, 0, 0)
    ctx.restore()

    // -------------------------------------------------------------
    // OVERLAY 3: Blok Teks Informasi & Kotak Putih Jam (Bottom-Up Layout)
    // -------------------------------------------------------------
    const currentTimeText = timeStr || getNowJam()
    const currentDateText = dateStr || formatIndoDate(new Date())

    const marginBottom = 32 * scale
    const yCode = CANVAS_HEIGHT - marginBottom
    const codeX = 28 * scale
    const yGps = yCode - (34 * scale)

    // Alamat Line-Height & Multi-line Handling
    ctx.save()
    ctx.font = `400 ${15 * scale}px "Inter", sans-serif`
    const fullAddr = address || 'Wonorejo, Pasuruan, Jawa Timur, 67173'
    const maxAddrLineWidth = CANVAS_WIDTH - (44 * scale) - (200 * scale)

    let addrLine1 = fullAddr
    let addrLine2 = ''
    if (ctx.measureText(fullAddr).width > maxAddrLineWidth) {
      const words = fullAddr.split(' ')
      addrLine1 = ''
      for (let i = 0; i < words.length; i++) {
        const testLine = addrLine1 ? addrLine1 + ' ' + words[i] : words[i]
        if (ctx.measureText(testLine).width <= maxAddrLineWidth) {
          addrLine1 = testLine
        } else {
          addrLine2 = words.slice(i).join(' ')
          break
        }
      }
    }
    ctx.restore()

    const hasTwoAddrLines = Boolean(addrLine2 && addrLine2.trim())
    const yAddr2 = hasTwoAddrLines ? yGps - (22 * scale) : yGps
    const yAddr1 = hasTwoAddrLines ? yAddr2 - (22 * scale) : yGps - (24 * scale)
    const yDate = yAddr1 - (26 * scale)

    // Bar aksen vertikal tipis warna oranye/kuning #f59e0b di sebelah kiri baris tanggal
    const lineX = 28 * scale
    const lineYTop = yDate - (16 * scale)
    const lineYBottom = yGps + (4 * scale)
    const lineH = lineYBottom - lineYTop

    ctx.fillStyle = '#f59e0b'
    ctx.beginPath()
    ctx.roundRect(lineX, lineYTop, 4.5 * scale, lineH, 2.25 * scale)
    ctx.fill()

    // Render Teks Informasi (Tanggal, Alamat, GPS) dengan Drop Shadow Tipis Langsung
    ctx.save()
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)'
    ctx.shadowBlur = 4 * scale
    ctx.shadowOffsetX = 1 * scale
    ctx.shadowOffsetY = 1 * scale

    const textX = 42 * scale

    // Baris 1: Tanggal hari ini - font semi-bold (#FFFFFF)
    ctx.font = `600 ${19 * scale}px "Inter", sans-serif`
    ctx.fillStyle = '#FFFFFF'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(currentDateText, textX, yDate)

    // Baris 2 & 3: Alamat Lengkap - font regular (#FFFFFF)
    ctx.font = `400 ${15 * scale}px "Inter", sans-serif`
    if (hasTwoAddrLines) {
      ctx.fillText(addrLine1, textX, yAddr1)
      ctx.fillText(addrLine2, textX, yAddr2)
    } else {
      ctx.fillText(fullAddr, textX, yAddr1)
    }

    // Baris 4: Titik Koordinat - font regular (#FFFFFF)
    ctx.fillText(gpsCoords || '7.720893°S, 112.797827°E', textX, yGps)
    ctx.restore()

    // Baris 4: Ikon verifikasi centang perisai + "Kode Foto: [KODE_FOTO]"
    ctx.save()
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)'
    ctx.shadowBlur = 4 * scale
    ctx.shadowOffsetX = 1 * scale
    ctx.shadowOffsetY = 1 * scale

    const shieldW = 15 * scale
    const shieldH = 17 * scale
    const shieldX = codeX
    const shieldY = yCode - (13 * scale)

    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 1.6 * scale
    ctx.beginPath()
    ctx.moveTo(shieldX, shieldY)
    ctx.lineTo(shieldX + shieldW, shieldY)
    ctx.lineTo(shieldX + shieldW, shieldY + shieldH * 0.6)
    ctx.quadraticCurveTo(shieldX + shieldW / 2, shieldY + shieldH, shieldX, shieldY + shieldH * 0.6)
    ctx.closePath()
    ctx.stroke()

    // Centang dalam perisai
    ctx.beginPath()
    ctx.moveTo(shieldX + 3.5 * scale, shieldY + 7.5 * scale)
    ctx.lineTo(shieldX + 6.5 * scale, shieldY + 10.5 * scale)
    ctx.lineTo(shieldX + 11.5 * scale, shieldY + 5 * scale)
    ctx.stroke()

    // Teks: "Kode Foto: " (Font Regular 14 * scale) + Kode Unik
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.font = `400 ${14 * scale}px "Inter", sans-serif`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText('Kode Foto: ', codeX + shieldW + (8 * scale), yCode)

    const codeLabelWidth = ctx.measureText('Kode Foto: ').width
    ctx.font = `700 ${14 * scale}px "Inter", sans-serif`
    ctx.fillText(timemarkCode, codeX + shieldW + (8 * scale) + codeLabelWidth, yCode)
    ctx.restore()

    // -------------------------------------------------------------
    // OVERLAY 4: Header Baris Informasi Utama (Card Kapsul Putih)
    // -------------------------------------------------------------
    const bottomWhiteBox = yDate - (22 * scale)
    const whiteBoxHeight = 58 * scale
    const whiteBoxY = bottomWhiteBox - whiteBoxHeight
    const whiteBoxX = 28 * scale
    const paddingX = 10 * scale
    const paddingRight = 12 * scale

    const timeFontSize = 36 * scale
    ctx.font = `700 ${timeFontSize}px "Roboto Condensed", "Inter", sans-serif`
    const timeWidth = ctx.measureText(currentTimeText).width

    const hasActivity = Boolean(activity && activity.trim())
    let activityBadgeWidth = 0
    if (hasActivity) {
      ctx.font = `800 ${18 * scale}px "Inter", sans-serif`
      activityBadgeWidth = ctx.measureText(activity.toUpperCase()).width + (24 * scale)
    }

    // Active Logos List (Logo BGN, Logo Kabupaten Pasuruan, Custom Logo)
    interface LogoItem {
      img: HTMLImageElement
      width: number
      height: number
      name: string
    }

    const logoTargetH = 38 * scale
    const logoSpacing = 10 * scale
    const activeLogos: LogoItem[] = []

    if (showBgnLogo && bgnLogoRef.current) {
      const nw = bgnLogoRef.current.naturalWidth || bgnLogoRef.current.width || 1
      const nh = bgnLogoRef.current.naturalHeight || bgnLogoRef.current.height || 1
      const aspect = nw / nh
      activeLogos.push({
        img: bgnLogoRef.current,
        width: logoTargetH * aspect,
        height: logoTargetH,
        name: 'bgn'
      })
    }

    if (showRegionalLogo && regionalLogoRef.current) {
      const nw = regionalLogoRef.current.naturalWidth || regionalLogoRef.current.width || 1
      const nh = regionalLogoRef.current.naturalHeight || regionalLogoRef.current.height || 1
      const aspect = nw / nh
      activeLogos.push({
        img: regionalLogoRef.current,
        width: logoTargetH * aspect,
        height: logoTargetH,
        name: 'pasuruan'
      })
    }

    if (customLogoUrl && customLogoRef.current) {
      const nw = customLogoRef.current.naturalWidth || customLogoRef.current.width || 1
      const nh = customLogoRef.current.naturalHeight || customLogoRef.current.height || 1
      const aspect = nw / nh
      activeLogos.push({
        img: customLogoRef.current,
        width: logoTargetH * aspect,
        height: logoTargetH,
        name: 'custom'
      })
    }

    let logosTotalWidth = 0
    for (let i = 0; i < activeLogos.length; i++) {
      logosTotalWidth += activeLogos[i].width
      if (i < activeLogos.length - 1) logosTotalWidth += logoSpacing
    }

    const dividerWidth = 1.5 * scale
    const gapBeforeDivider = 12 * scale
    const gapAfterDivider = 12 * scale

    const whiteBoxWidth = paddingX + 
      (hasActivity ? activityBadgeWidth + (10 * scale) : 0) + 
      timeWidth + 
      (activeLogos.length > 0 ? gapBeforeDivider + dividerWidth + gapAfterDivider + logosTotalWidth : 0) + 
      paddingRight

    // Draw Kapsul Putih Bersih (radius 9 * scale) dengan Shadow Tipis
    ctx.save()
    ctx.shadowColor = 'rgba(0, 0, 0, 0.16)'
    ctx.shadowBlur = 8 * scale
    ctx.shadowOffsetY = 3 * scale

    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.roundRect(whiteBoxX, whiteBoxY, whiteBoxWidth, whiteBoxHeight, 9 * scale)
    ctx.fill()
    ctx.restore()

    let currX = whiteBoxX + paddingX

    // 4a. Badge Kuning Tajuk Aktivitas (Blok kuning cerah #f59e0b)
    if (hasActivity) {
      const badgeY = whiteBoxY + (7 * scale)
      const badgeH = whiteBoxHeight - (14 * scale)

      ctx.fillStyle = '#f59e0b'
      ctx.beginPath()
      ctx.roundRect(currX, badgeY, activityBadgeWidth, badgeH, 6 * scale)
      ctx.fill()

      ctx.fillStyle = '#0f172a'
      ctx.font = `800 ${18 * scale}px "Inter", sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(activity.toUpperCase(), currX + (activityBadgeWidth / 2), badgeY + (badgeH / 2))

      currX += activityBadgeWidth + (10 * scale)
    }

    // 4b. Jam Angka Biru Tua Pekat (#1e3a8a) dengan font sans-serif modern tebal
    ctx.save()
    ctx.strokeStyle = 'rgba(30, 58, 138, 0.08)'
    ctx.lineWidth = 2 * scale
    for (let stripeX = currX; stripeX < currX + timeWidth; stripeX += 8 * scale) {
      ctx.beginPath()
      ctx.moveTo(stripeX, whiteBoxY + (8 * scale))
      ctx.lineTo(stripeX + (8 * scale), whiteBoxY + whiteBoxHeight - (8 * scale))
      ctx.stroke()
    }
    ctx.restore()

    ctx.fillStyle = '#1e3a8a'
    ctx.font = `700 ${timeFontSize}px "Roboto Condensed", "Inter", sans-serif`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(currentTimeText, currX, whiteBoxY + (whiteBoxHeight / 2) + (1 * scale))

    currX += timeWidth

    // 4c. Garis Pemisah Tipis Vertikal (#e2e8f0) & Dua Logo Berdampingan
    if (activeLogos.length > 0) {
      currX += gapBeforeDivider

      const divY = whiteBoxY + (whiteBoxHeight - (32 * scale)) / 2
      ctx.fillStyle = '#E2E8F0'
      ctx.fillRect(currX, divY, dividerWidth, 32 * scale)

      currX += dividerWidth + gapAfterDivider

      for (const logo of activeLogos) {
        const logoY = whiteBoxY + (whiteBoxHeight - logo.height) / 2
        ctx.drawImage(logo.img, currX, logoY, logo.width, logo.height)
        currX += logo.width + logoSpacing
      }
    }

    // -------------------------------------------------------------
    // OVERLAY 5: Watermark Timemark Kanan Bawah
    // -------------------------------------------------------------
    ctx.save()
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)'
    ctx.shadowBlur = 4 * scale
    ctx.shadowOffsetX = 1 * scale
    ctx.shadowOffsetY = 1 * scale

    const stampY = CANVAS_HEIGHT - (46 * scale)
    const rightMarginX = CANVAS_WIDTH - (36 * scale)

    ctx.font = `700 ${22 * scale}px "Inter", sans-serif`
    const timeWordWidth = ctx.measureText('Time').width
    const markWordWidth = ctx.measureText('mark').width
    const totalBrandWidth = timeWordWidth + markWordWidth
    const brandStartX = rightMarginX - totalBrandWidth

    // Teks "Time" (kuning-oranye khas Timemark #f59e0b)
    ctx.fillStyle = '#f59e0b'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText('Time', brandStartX, stampY)

    // Teks "mark" (putih murni #FFFFFF)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText('mark', brandStartX + timeWordWidth, stampY)

    // Subteks kecil "Foto 100% akurat" putih
    ctx.font = `400 ${13 * scale}px "Inter", sans-serif`
    ctx.textAlign = 'right'
    ctx.fillText('Foto 100% akurat', rightMarginX, stampY + (18 * scale))
    ctx.restore()
  }, [activity, timeStr, dateStr, address, gpsCoords, timemarkCode, showBgnLogo, showRegionalLogo, customLogoUrl, bgImageUrl, offset, zoom])

  // Preload Logos on component mount
  useEffect(() => {
    Promise.all([
      loadImage('/logo-bgn.png').then((img) => { bgnLogoRef.current = img }),
      loadImage('/logo-pasuruan.png').then((img) => { regionalLogoRef.current = img })
    ]).then(() => {
      drawCanvas()
    }).catch((err) => {
      console.warn('Initial logo preloading notice:', err)
    })
  }, [drawCanvas])

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
      const dataUrl = canvas.toDataURL('image/jpeg', 0.98)
      const cleanActivity = activity.replace(/[^a-zA-Z0-9]/g, '_') || 'aktivitas'
      const cleanDate = (dateStr || 'tanggal').replace(/[^a-zA-Z0-9]/g, '_')
      const fileName = `Timemark-${cleanActivity}-${cleanDate}.jpg`

      const link = document.createElement('a')
      link.href = dataUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      showToast(`Foto Timemark resolusi tinggi berjaya dimuat turun (${fileName})!`, 'success')
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
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold transition backdrop-blur-md shadow-sm active:scale-95 cursor-pointer"
            >
              <RefreshCw size={14} className="text-amber-400" />
              <span>🔄 Sinkronkan Waktu Sekarang</span>
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
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock size={14} className="text-blue-600" />
                  Waktu & Tarikh (Dinamis Real-time)
                </span>
                <button
                  type="button"
                  onClick={handleAutoDateTime}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 active:scale-95 transition cursor-pointer"
                  title="Sinkronkan Waktu Sekarang"
                >
                  <RefreshCw size={12} className="text-blue-600" />
                  <span>🔄 Sinkronkan Waktu Sekarang</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Jam / Waktu</label>
                  <input
                    type="text"
                    value={timeStr}
                    onChange={(e) => setTimeStr(e.target.value)}
                    placeholder="23:25"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white/80 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs font-bold text-blue-700 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Tarikh Rasmi</label>
                  <input
                    type="text"
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    placeholder="Selasa, 27 Oktober 2026"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white/80 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs font-medium text-slate-800 transition"
                  />
                </div>
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
                placeholder="Wonorejo, Pasuruan, Jawa Timur, 67173"
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

            {/* Touch / Pan Drag Instruction Badge */}
            <div className="flex items-center justify-between text-xs font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-800 rounded-xl px-3.5 py-2">
              <span className="flex items-center gap-1.5">
                <span>👆</span>
                <span>Sentuh dan geser foto untuk mengatur posisi wajah/objek sebelum didownload</span>
              </span>
              {(offset.x !== 0 || offset.y !== 0 || zoom !== 1) && (
                <button
                  type="button"
                  onClick={() => {
                    setOffset({ x: 0, y: 0 })
                    setZoom(1)
                  }}
                  className="text-[11px] underline hover:text-amber-900 font-bold shrink-0 ml-2"
                >
                  Reset Posisi
                </button>
              )}
            </div>

            {/* High-Resolution Live Canvas Display */}
            <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex items-center justify-center">
              <canvas
                ref={canvasRef}
                className="w-full aspect-[4/3] object-contain rounded-2xl shadow-xl touch-none select-none block cursor-grab active:cursor-grabbing"
                onTouchStart={(e) => {
                  if (e.touches.length === 1) {
                    isDraggingRef.current = true
                    startPosRef.current = {
                      x: e.touches[0].clientX - offset.x,
                      y: e.touches[0].clientY - offset.y,
                    }
                  }
                }}
                onTouchMove={(e) => {
                  if (!isDraggingRef.current || e.touches.length !== 1) return
                  const newX = e.touches[0].clientX - startPosRef.current.x
                  const newY = e.touches[0].clientY - startPosRef.current.y
                  setOffset({ x: newX, y: newY })
                }}
                onTouchEnd={() => {
                  isDraggingRef.current = false
                }}
                onMouseDown={(e) => {
                  isDraggingRef.current = true
                  startPosRef.current = { x: e.clientX - offset.x, y: e.clientY - offset.y }
                }}
                onMouseMove={(e) => {
                  if (!isDraggingRef.current) return
                  setOffset({
                    x: e.clientX - startPosRef.current.x,
                    y: e.clientY - startPosRef.current.y,
                  })
                }}
                onMouseUp={() => {
                  isDraggingRef.current = false
                }}
                onMouseLeave={() => {
                  isDraggingRef.current = false
                }}
              />
            </div>

            {/* Zoom Slider Control */}
            <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-100/80 border border-slate-200">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 shrink-0">
                <Sliders size={14} className="text-blue-600" />
                <span>Zoom: {zoom.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="1"
                max="2.5"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="text-xs text-slate-500 font-medium shrink-0">1x - 2.5x</span>
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
