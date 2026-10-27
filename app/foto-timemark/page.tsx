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

// Timemark Watermark Canvas Engine Interface
export interface TimemarkWatermarkOptions {
  width: number
  height: number
  scale?: number
  bgImg?: HTMLImageElement | null
  zoom?: number
  offset?: { x: number; y: number }
  activity: string
  timeStr: string
  dateStr: string
  address: string
  gpsCoords: string
  timemarkCode: string
  showBgnLogo: boolean
  showRegionalLogo: boolean
  bgnLogo?: HTMLImageElement | null
  regionalLogo?: HTMLImageElement | null
  customLogo?: HTMLImageElement | null
  mapImg?: HTMLImageElement | null
  dynamicMapTileImg?: HTMLImageElement | null
}

// Pure canvas renderer for Timemark watermark matching official BGN standard 100%
export function drawTimemarkWatermark(ctx: CanvasRenderingContext2D, options: TimemarkWatermarkOptions) {
  const {
    width,
    height,
    scale: propScale,
    bgImg,
    zoom = 1,
    offset = { x: 0, y: 0 },
    activity,
    timeStr,
    dateStr,
    address,
    gpsCoords,
    timemarkCode,
    showBgnLogo,
    showRegionalLogo,
    bgnLogo,
    regionalLogo,
    customLogo,
    mapImg,
    dynamicMapTileImg
  } = options

  // Base canvas dimensions & scale factor (960px width base)
  const W = width
  const H = height
  const s = propScale || (W / 960)

  // Clear Canvas
  ctx.clearRect(0, 0, W, H)

  // 1. Draw Background Image (Cover mode + Pan Offset) or Sleek Gradient
  if (bgImg) {
    const imgRatio = bgImg.width / bgImg.height
    const canvasRatio = W / H
    let drawW: number, drawH: number

    if (imgRatio > canvasRatio) {
      drawH = H * zoom
      drawW = drawH * imgRatio
    } else {
      drawW = W * zoom
      drawH = drawW / imgRatio
    }

    const posX = (W - drawW) / 2 + offset.x
    const posY = (H - drawH) / 2 + offset.y

    ctx.drawImage(bgImg, posX, posY, drawW, drawH)
  } else {
    const grad = ctx.createLinearGradient(0, 0, W, H)
    grad.addColorStop(0, '#1e293b')
    grad.addColorStop(0.5, '#0f172a')
    grad.addColorStop(1, '#020617')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // Subtle grid pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
    ctx.lineWidth = 2 * s
    const step = 60 * s
    for (let x = 0; x < W; x += step) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, H)
      ctx.stroke()
    }
    for (let y = 0; y < H; y += step) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(W, y)
      ctx.stroke()
    }
  }

  // Ultra-soft gentle gradient at the bottom edge (0 to 18% opacity) to guarantee text legibility on white photos
  const softGrad = ctx.createLinearGradient(0, H - (0.28 * H), 0, H)
  softGrad.addColorStop(0, 'rgba(0, 0, 0, 0)')
  softGrad.addColorStop(1, 'rgba(0, 0, 0, 0.18)')
  ctx.fillStyle = softGrad
  ctx.fillRect(0, H - (0.28 * H), W, 0.28 * H)

  // -------------------------------------------------------------
  // SPESIFIKASI 2: PETA MINI (KIRI ATAS)
  // Ukuran: lebar = 0.26 * W, tinggi = 0.26 * W
  // Posisi: x = 0.045 * W, y = 0.035 * W
  // Border radius: 14px. Border tipis putih/abu-abu transparan.
  // Titik pin lokasi biru muda berlingkaran putih di tengah dengan jangkauan sektor hijau toska transparan.
  // Di pojok kiri bawah peta: label teks "📍 Peta" dan teks jalan miring "Wonorejo / Pasuruan".
  // -------------------------------------------------------------
  const mapW = 0.26 * W
  const mapH = 0.26 * W
  const mapX = 0.045 * W
  const mapY = 0.035 * W
  const mapRadius = 14 * s

  // Card shadow & background container
  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.16)'
  ctx.shadowBlur = 8 * s
  ctx.shadowOffsetY = 2 * s

  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.roundRect(mapX, mapY, mapW, mapH, mapRadius)
  ctx.fill()

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)'
  ctx.lineWidth = 1.5 * s
  ctx.stroke()
  ctx.restore()

  // Inset map content clipped inside
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(mapX, mapY, mapW, mapH, mapRadius)
  ctx.clip()

  if (dynamicMapTileImg) {
    ctx.drawImage(dynamicMapTileImg, mapX, mapY, mapW, mapH)
  } else if (mapImg) {
    ctx.drawImage(mapImg, mapX, mapY, mapW, mapH)
  } else {
    // Vector road illustration with subtle grey/yellow roads
    ctx.fillStyle = '#f8fafc'
    ctx.fillRect(mapX, mapY, mapW, mapH)

    // Grey base road
    ctx.strokeStyle = '#cbd5e1'
    ctx.lineWidth = 7.5 * s
    ctx.beginPath()
    ctx.moveTo(mapX, mapY + (mapH * 0.36))
    ctx.lineTo(mapX + mapW, mapY + (mapH * 0.74))
    ctx.stroke()

    // Yellow highway overlay
    ctx.strokeStyle = '#fde68a'
    ctx.lineWidth = 4.2 * s
    ctx.beginPath()
    ctx.moveTo(mapX, mapY + (mapH * 0.36))
    ctx.lineTo(mapX + mapW, mapY + (mapH * 0.74))
    ctx.stroke()

    // Cross street
    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 4 * s
    ctx.beginPath()
    ctx.moveTo(mapX + (mapW * 0.42), mapY)
    ctx.lineTo(mapX + (mapW * 0.62), mapY + mapH)
    ctx.stroke()
  }

  const pinX = mapX + (mapW / 2)
  const pinY = mapY + (mapH / 2)

  // Radar Cone (Jangkauan sektor hijau toska transparan)
  ctx.save()
  ctx.fillStyle = 'rgba(45, 212, 191, 0.45)'
  ctx.beginPath()
  ctx.moveTo(pinX, pinY)
  ctx.arc(pinX, pinY, mapW * 0.38, (25 * Math.PI) / 180, (75 * Math.PI) / 180, false)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  // Titik pin lokasi biru muda berlingkaran putih di tengah
  ctx.fillStyle = '#0ea5e9'
  ctx.beginPath()
  ctx.arc(pinX, pinY, 7.5 * s, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2 * s
  ctx.stroke()

  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(pinX, pinY, 2.5 * s, 0, Math.PI * 2)
  ctx.fill()

  // Teks jalan miring "Wonorejo / Pasuruan"
  ctx.save()
  ctx.translate(mapX + mapW - (26 * s), mapY + (30 * s))
  ctx.rotate((-35 * Math.PI) / 180)
  ctx.font = `700 ${9.5 * s}px "Inter", sans-serif`
  ctx.fillStyle = '#64748b'
  ctx.fillText('Wonorejo / Pasuruan', 0, 0)
  ctx.restore()

  // Di pojok kiri bawah peta: label teks "📍 Peta"
  ctx.font = `700 ${9.5 * s}px "Inter", sans-serif`
  ctx.fillStyle = '#1e293b'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText('📍 Peta', mapX + (8 * s), mapY + mapH - (8 * s))

  // Border tipis transparan pembungkus peta
  ctx.strokeStyle = 'rgba(226, 232, 240, 0.7)'
  ctx.lineWidth = 1 * s
  ctx.stroke()

  ctx.restore() // End map clipping

  // -------------------------------------------------------------
  // SPESIFIKASI 3: WATERMARK TIMEMARK (KANAN ATAS)
  // Posisi: kanan atas (x = W - 0.045 * W, y = 0.045 * W, text-align: right)
  // Teks "Timemark": font sans-serif bold, warna #f59e0b (kuning keemasan), ukuran ~20px
  // Teks "Foto 100% akurat": font sans-serif regular, warna #ffffff (putih transparan ~90%), ukuran ~12px, tepat di bawah teks Timemark
  // -------------------------------------------------------------
  const tmX = W - (0.045 * W)
  let tmY = 0.045 * W

  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)'
  ctx.shadowBlur = 2.5 * s
  ctx.shadowOffsetX = 1 * s
  ctx.shadowOffsetY = 1 * s
  ctx.textAlign = 'right'
  ctx.textBaseline = 'top'

  // Baris 1: Teks "Timemark"
  ctx.font = `700 ${20 * s}px "Inter", sans-serif`
  ctx.fillStyle = '#f59e0b'
  ctx.fillText('Timemark', tmX, tmY)

  // Baris 2: Teks "Foto 100% akurat"
  tmY += 24 * s
  ctx.font = `400 ${12 * s}px "Inter", sans-serif`
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)'
  ctx.fillText('Foto 100% akurat', tmX, tmY)
  ctx.restore()

  // -------------------------------------------------------------
  // SPESIFIKASI 4: KARTU HEADER JAM & IDENTITAS (KIRI BAWAH)
  // Posisi: x = 0.045 * W, y = H - 0.22 * H
  // Background: rounded card putih murni (#ffffff), radius 8px, border tipis (#e2e8f0)
  // Susunan Horizontal:
  // - Blok Kuning (#fbbf24): padding horizontal ketat, teks hitam pekat sans-serif bold: "Apel Ka SPPG"
  // - Jam: angka jam "23:41" warna biru dongker gelap (#1e3a8a), font sans-serif bold besar sejajar dengan blok kuning
  // - Divider vertikal tipis (#cbd5e1)
  // - Dua Logo: Logo BGN (bulat) dan Logo Pemkab Pasuruan (perisai hijau) berdampingan dalam proporsi rapi (tinggi ~26px)
  // -------------------------------------------------------------
  const cardX = 0.045 * W
  const cardY = H - (0.22 * H)
  const cardHeight = 36 * s
  const cardRadius = 8 * s

  // 1. Teks Jam
  const timeFontSize = 24 * s
  ctx.font = `700 ${timeFontSize}px "Inter", "Roboto Condensed", sans-serif`
  const timeDisplay = timeStr || '23:41'
  const timeWidth = ctx.measureText(timeDisplay).width

  // 2. Blok Kuning (Aktivitas)
  const actText = (activity && activity.trim()) ? activity.trim() : 'Apel Ka SPPG'
  ctx.font = `800 ${13 * s}px "Inter", sans-serif`
  const actTextWidth = ctx.measureText(actText).width
  const actBadgePadX = 8 * s
  const actBadgeWidth = actTextWidth + (actBadgePadX * 2)

  // 3. Dua Logo (Tinggi ~26px)
  const logoH = 26 * s
  const logoSpacing = 6 * s
  interface ActiveLogoItem {
    img: HTMLImageElement
    width: number
    height: number
  }
  const activeLogos: ActiveLogoItem[] = []

  if (showBgnLogo && bgnLogo) {
    const nw = bgnLogo.naturalWidth || bgnLogo.width || 1
    const nh = bgnLogo.naturalHeight || bgnLogo.height || 1
    activeLogos.push({
      img: bgnLogo,
      width: logoH * (nw / nh),
      height: logoH
    })
  }

  if (showRegionalLogo && regionalLogo) {
    const nw = regionalLogo.naturalWidth || regionalLogo.width || 1
    const nh = regionalLogo.naturalHeight || regionalLogo.height || 1
    activeLogos.push({
      img: regionalLogo,
      width: logoH * (nw / nh),
      height: logoH
    })
  }

  if (customLogo) {
    const nw = customLogo.naturalWidth || customLogo.width || 1
    const nh = customLogo.naturalHeight || customLogo.height || 1
    activeLogos.push({
      img: customLogo,
      width: logoH * (nw / nh),
      height: logoH
    })
  }

  let logosTotalWidth = 0
  for (let i = 0; i < activeLogos.length; i++) {
    logosTotalWidth += activeLogos[i].width
    if (i < activeLogos.length - 1) logosTotalWidth += logoSpacing
  }

  const dividerWidth = 1 * s
  const padLeft = 4 * s
  const padRight = 8 * s
  const itemGap = 8 * s

  // Hitung total lebar kartu secara dinamis
  let innerWidth = padLeft + actBadgeWidth + itemGap + timeWidth
  if (activeLogos.length > 0) {
    innerWidth += itemGap + dividerWidth + itemGap + logosTotalWidth
  }
  innerWidth += padRight
  const cardWidth = innerWidth

  // Render Background Kartu Putih Murni
  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.08)'
  ctx.shadowBlur = 6 * s
  ctx.shadowOffsetY = 2 * s

  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.roundRect(cardX, cardY, cardWidth, cardHeight, cardRadius)
  ctx.fill()

  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 1 * s
  ctx.stroke()
  ctx.restore()

  let currX = cardX + padLeft

  // Render Blok Kuning (#fbbf24)
  const badgeY = cardY + (4 * s)
  const badgeH = cardHeight - (8 * s)

  ctx.fillStyle = '#fbbf24'
  ctx.beginPath()
  ctx.roundRect(currX, badgeY, actBadgeWidth, badgeH, 5 * s)
  ctx.fill()

  ctx.fillStyle = '#0f172a'
  ctx.font = `800 ${13 * s}px "Inter", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(actText, currX + (actBadgeWidth / 2), badgeY + (badgeH / 2))

  currX += actBadgeWidth + itemGap

  // Render Jam: angka jam warna biru dongker gelap (#1e3a8a)
  ctx.fillStyle = '#1e3a8a'
  ctx.font = `700 ${timeFontSize}px "Inter", "Roboto Condensed", sans-serif`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(timeDisplay, currX, cardY + (cardHeight / 2))

  currX += timeWidth

  // Render Divider vertikal tipis (#cbd5e1) & Dua Logo
  if (activeLogos.length > 0) {
    currX += itemGap
    const divH = 20 * s
    const divY = cardY + (cardHeight - divH) / 2

    ctx.fillStyle = '#cbd5e1'
    ctx.fillRect(currX, divY, dividerWidth, divH)

    currX += dividerWidth + itemGap

    for (const logo of activeLogos) {
      const logoY = cardY + (cardHeight - logo.height) / 2
      ctx.drawImage(logo.img, currX, logoY, logo.width, logo.height)
      currX += logo.width + logoSpacing
    }
  }

  // -------------------------------------------------------------
  // SPESIFIKASI 5: TEKS KETERANGAN DI BAWAH KARTU JAM
  // - Jarak dari kartu jam: ~14px ke bawah
  // - Garis Aksen Vertikal Oranye:
  //   * Posisi x = 0.045 * W
  //   * Lebar: 3.5px, warna #f97316 (oranye cerah), lineCap = 'round'
  //   * Titik mulai y = sejajar atas teks "Selasa, 27 Oktober 2026"
  //   * Titik selesai y = sejajar bawah teks koordinat "7.720852°S, 112.797835°E"
  // - Teks Informasi (Semua warna putih bersih #ffffff, drop shadow sangat tipis: shadowBlur = 2, shadowColor = 'rgba(0,0,0,0.5)'):
  //   * Jarak teks dari garis oranye: padding-left 10px
  //   * Baris 1: "Selasa, 27 Oktober 2026" (Font semi-bold, 15px)
  //   * Spasi antar baris (gap): 4px
  //   * Baris 2: "Wonorejo, Pasuruan, Jawa Timur, 67173" (Font regular, 13px)
  //   * Baris 3: "7.720852°S, 112.797835°E" (Font regular, 13px)
  // - Baris Kode Foto:
  //   * Diberi jarak 8px di bawah koordinat (tidak terkena garis oranye)
  //   * Teks: Ikon shield check + "Kode Foto: WLHMYXL4GYPRUE" warna abu-abu terang (#cbd5e1), font 11.5px
  // -------------------------------------------------------------
  const lineX = 0.045 * W
  const textX = lineX + (10 * s)

  const yDate = cardY + cardHeight + (14 * s)
  const dateFontH = 15 * s
  const rowGap = 4 * s
  const addrFontH = 13 * s
  const coordsFontH = 13 * s

  // Address calculation & wrapping if needed
  ctx.save()
  ctx.font = `400 ${addrFontH}px "Inter", sans-serif`
  const maxAddrWidth = W - textX - (24 * s)
  let addrLine1 = address || 'Wonorejo, Pasuruan, Jawa Timur, 67173'
  let addrLine2 = ''
  if (ctx.measureText(addrLine1).width > maxAddrWidth) {
    const words = addrLine1.split(' ')
    addrLine1 = ''
    for (let i = 0; i < words.length; i++) {
      const testLine = addrLine1 ? addrLine1 + ' ' + words[i] : words[i]
      if (ctx.measureText(testLine).width <= maxAddrWidth) {
        addrLine1 = testLine
      } else {
        addrLine2 = words.slice(i).join(' ')
        break
      }
    }
  }
  ctx.restore()

  const yAddr1 = yDate + dateFontH + rowGap
  const hasAddr2 = Boolean(addrLine2 && addrLine2.trim())
  const yAddr2 = hasAddr2 ? yAddr1 + addrFontH + rowGap : yAddr1
  const yCoords = (hasAddr2 ? yAddr2 : yAddr1) + addrFontH + rowGap
  const coordsBottom = yCoords + coordsFontH

  // Garis Aksen Vertikal Oranye
  ctx.save()
  ctx.strokeStyle = '#f97316'
  ctx.lineWidth = 3.5 * s
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(lineX, yDate + (1.75 * s))
  ctx.lineTo(lineX, coordsBottom - (1.75 * s))
  ctx.stroke()
  ctx.restore()

  // Teks Informasi (Warna putih murni #ffffff, drop shadow tipis)
  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
  ctx.shadowBlur = 2 * s
  ctx.shadowOffsetX = 1 * s
  ctx.shadowOffsetY = 1 * s
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'

  // Baris 1: Tanggal (Font semi-bold, 15px)
  ctx.font = `600 ${dateFontH}px "Inter", sans-serif`
  ctx.fillText(dateStr || 'Selasa, 27 Oktober 2026', textX, yDate)

  // Baris 2: Alamat (Font regular, 13px)
  ctx.font = `400 ${addrFontH}px "Inter", sans-serif`
  ctx.fillText(addrLine1, textX, yAddr1)
  if (hasAddr2) {
    ctx.fillText(addrLine2, textX, yAddr2)
  }

  // Baris 3: Koordinat (Font regular, 13px)
  ctx.fillText(gpsCoords || '7.720852°S, 112.797835°E', textX, yCoords)
  ctx.restore()

  // Baris Kode Foto: Diberi jarak 8px di bawah koordinat (tidak terkena garis oranye)
  const yCode = coordsBottom + (8 * s)
  const codeFontH = 11.5 * s

  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
  ctx.shadowBlur = 2 * s
  ctx.shadowOffsetX = 1 * s
  ctx.shadowOffsetY = 1 * s

  const shieldW = 11 * s
  const shieldH = 13 * s
  const shieldX = textX
  const shieldY = yCode + (1 * s)

  // Outline perisai tipis (#cbd5e1)
  ctx.strokeStyle = '#cbd5e1'
  ctx.lineWidth = 1.2 * s
  ctx.beginPath()
  ctx.moveTo(shieldX, shieldY)
  ctx.lineTo(shieldX + shieldW, shieldY)
  ctx.lineTo(shieldX + shieldW, shieldY + shieldH * 0.6)
  ctx.quadraticCurveTo(shieldX + shieldW / 2, shieldY + shieldH, shieldX, shieldY + shieldH * 0.6)
  ctx.closePath()
  ctx.stroke()

  // Centang tipis di dalam perisai
  ctx.beginPath()
  ctx.moveTo(shieldX + (2.5 * s), shieldY + (5.5 * s))
  ctx.lineTo(shieldX + (4.5 * s), shieldY + (8 * s))
  ctx.lineTo(shieldX + (8.5 * s), shieldY + (4 * s))
  ctx.stroke()

  // Teks "Kode Foto: [KODE_FOTO]" warna abu-abu terang (#cbd5e1), font 11.5px
  ctx.fillStyle = '#cbd5e1'
  ctx.font = `400 ${codeFontH}px "Inter", sans-serif`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  const activeCode = timemarkCode || 'WLHMYXL4GYPRUE'
  ctx.fillText(`Kode Foto: ${activeCode}`, shieldX + shieldW + (5 * s), yCode)
  ctx.restore()

  // -------------------------------------------------------------
  // SPESIFIKASI 6: WATERMARK VERTIKAL KANAN
  // Posisi: menempel rapat di tepi kanan (x = W - 14px, tengah vertikal)
  // Rotasi: -90 derajat
  // Teks: "© [KODE_FOTO] Timemark Verified"
  // Warna putih tipis (#ffffff, opacity 0.75), font sans-serif ramping 11px
  // -------------------------------------------------------------
  const vertX = W - (14 * s)
  const vertY = H / 2

  ctx.save()
  ctx.translate(vertX, vertY)
  ctx.rotate((-90 * Math.PI) / 180)
  ctx.font = `400 ${11 * s}px "Inter", sans-serif`
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)'
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
  ctx.shadowBlur = 2 * s
  ctx.shadowOffsetX = 1 * s
  ctx.shadowOffsetY = 1 * s
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(`© ${activeCode} Timemark Verified`, 0, 0)
  ctx.restore()
}

export default function FotoTimemarkPage() {
  // Form State
  const [activity, setActivity] = useState('Apel Ka SPPG')
  const [timeStr, setTimeStr] = useState('')
  const [dateStr, setDateStr] = useState('')
  const [address, setAddress] = useState('Wonorejo, Pasuruan, Jawa Timur, 67173')
  const [gpsCoords, setGpsCoords] = useState('7.720852°S, 112.797835°E')
  const [timemarkCode, setTimemarkCode] = useState('WLHMYXL4GYPRUE')

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

  // Canvas Reference (Locked to 3:4 Smartphone Portrait Mode)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [canvasAspectRatio, setCanvasAspectRatio] = useState<number>(3 / 4)

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

    // Standard High-Resolution 960x1280 (Portrait 3:4 Smartphone Camera Ratio)
    const CANVAS_WIDTH = 960
    const CANVAS_HEIGHT = 1280

    canvas.width = CANVAS_WIDTH
    canvas.height = CANVAS_HEIGHT

    const scale = CANVAS_WIDTH / 960

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

    // Wait for Inter webfonts to load
    if (typeof document !== 'undefined' && document.fonts) {
      try {
        await Promise.all([
          document.fonts.load(`bold ${24 * scale}px "Inter"`),
          document.fonts.load(`bold ${20 * scale}px "Inter"`),
          document.fonts.load(`800 ${13 * scale}px "Inter"`),
          document.fonts.load(`600 ${15 * scale}px "Inter"`),
          document.fonts.load(`normal ${13 * scale}px "Inter"`),
          document.fonts.load(`normal ${12 * scale}px "Inter"`),
          document.fonts.load(`normal ${11.5 * scale}px "Inter"`),
          document.fonts.load(`normal ${11 * scale}px "Inter"`),
        ])
      } catch (e) {
        console.warn('Font loading notice:', e)
      }
    }

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
      dynamicMapTileImg = await loadImage(mapTileUrl).catch(() => null)
    } catch (e) {
      console.warn('Image preloading notice:', e)
    }

    const currentTimeText = timeStr || getNowJam()
    const currentDateText = dateStr || formatIndoDate(new Date())

    // Convert screen drag offset to canvas scale
    const rect = canvas.getBoundingClientRect()
    const scaleFactor = rect.width > 0 ? CANVAS_WIDTH / rect.width : 1

    drawTimemarkWatermark(ctx, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      scale,
      bgImg,
      zoom,
      offset: {
        x: offset.x * scaleFactor,
        y: offset.y * scaleFactor
      },
      activity,
      timeStr: currentTimeText,
      dateStr: currentDateText,
      address: address || 'Wonorejo, Pasuruan, Jawa Timur, 67173',
      gpsCoords: gpsCoords || '7.720852°S, 112.797835°E',
      timemarkCode,
      showBgnLogo,
      showRegionalLogo,
      bgnLogo: bgnLogoRef.current,
      regionalLogo: regionalLogoRef.current,
      customLogo: customLogoRef.current,
      mapImg: mapImgRef.current,
      dynamicMapTileImg
    })
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
            <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex items-center justify-center p-2">
              <canvas
                ref={canvasRef}
                className="w-full aspect-[3/4] max-w-[460px] mx-auto object-contain rounded-xl shadow-xl touch-none select-none block cursor-grab active:cursor-grabbing"
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
