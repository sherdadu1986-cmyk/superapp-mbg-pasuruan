'use client'

/**
 * Shared HTML5 Canvas engine for Timemark SPPG watermark & multi-photo collage.
 */

export const formatIndoDate = (d: Date = new Date()): string => {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

export const padZero = (n: number): string => String(n).padStart(2, '0')

export const getNowJam = (d: Date = new Date()): string =>
  `${padZero(d.getHours())}:${padZero(d.getMinutes())}`

export const getLocalDateISO = (d: Date = new Date()): string =>
  d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })

export interface JakartaTimeParts {
  tanggalISO: string
  timeStr: string
  timeWithSeconds: string
  dateStr: string
}

/**
 * Strictly format date and time in Asia/Jakarta (WIB) timezone regardless of device timezone.
 */
export function getJakartaNowParts(d: Date = new Date()): JakartaTimeParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })

  const partsMap: Record<string, string> = {}
  for (const p of formatter.formatToParts(d)) {
    if (p.type !== 'literal') partsMap[p.type] = p.value
  }

  const weekdayMap: Record<string, string> = {
    Sun: 'Minggu',
    Mon: 'Senin',
    Tue: 'Selasa',
    Wed: 'Rabu',
    Thu: 'Kamis',
    Fri: 'Jumat',
    Sat: 'Sabtu'
  }
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]

  const year = partsMap.year || String(d.getFullYear())
  const monthNum = parseInt(partsMap.month || '1', 10)
  const dayNum = parseInt(partsMap.day || '1', 10)
  const dayPadded = String(dayNum).padStart(2, '0')
  const monthPadded = String(monthNum).padStart(2, '0')
  const rawHour = partsMap.hour === '24' ? '00' : (partsMap.hour || '00').padStart(2, '0')
  const minute = (partsMap.minute || '00').padStart(2, '0')
  const second = (partsMap.second || '00').padStart(2, '0')

  const dayIndo = weekdayMap[partsMap.weekday || ''] || 'Hari'
  const monthIndo = monthNames[Math.max(0, Math.min(11, monthNum - 1))] || 'Januari'

  return {
    tanggalISO: `${year}-${monthPadded}-${dayPadded}`,
    timeStr: `${rawHour}:${minute}`,
    timeWithSeconds: `${rawHour}:${minute}:${second}`,
    dateStr: `${dayIndo}, ${dayNum} ${monthIndo} ${year}`
  }
}

export function generateTimemarkCode(prefix = 'SPPG'): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = prefix
  for (let i = 0; i < 10; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export function formatGpsCoords(lat: number, lng: number): string {
  const latFormatted = `${Math.abs(lat).toFixed(6)}°${lat < 0 ? 'S' : 'N'}`
  const lngFormatted = `${Math.abs(lng).toFixed(6)}°${lng < 0 ? 'E' : 'W'}`
  return `${latFormatted}, ${lngFormatted}`
}

export function parseGpsCoords(coordsStr: string): { lat: number; lng: number } {
  let lat = -7.721026
  let lng = 112.797828

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

export function getTileXY(lat: number, lon: number, zoom: number = 16) {
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

export function loadCanvasImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = (err) => reject(err)
    img.src = src
  })
}

export interface CollageSlot {
  x: number
  y: number
  w: number
  h: number
}

/**
 * Compute symmetrical grid slots for 1 to 6 photos with a crisp 4px white divider.
 */
export function getCollageSlots(
  count: number,
  width: number,
  height: number,
  gap: number = 4
): CollageSlot[] {
  const safeCount = Math.min(Math.max(count, 1), 6)

  if (safeCount === 1) {
    return [{ x: 0, y: 0, w: width, h: height }]
  }

  if (safeCount === 2) {
    const w1 = Math.floor((width - gap) / 2)
    const w2 = width - gap - w1
    return [
      { x: 0, y: 0, w: w1, h: height },
      { x: w1 + gap, y: 0, w: w2, h: height }
    ]
  }

  if (safeCount === 3) {
    const leftW = Math.floor((width - gap) * 0.56)
    const rightW = width - gap - leftW
    const topH = Math.floor((height - gap) / 2)
    const botH = height - gap - topH
    return [
      { x: 0, y: 0, w: leftW, h: height },
      { x: leftW + gap, y: 0, w: rightW, h: topH },
      { x: leftW + gap, y: topH + gap, w: rightW, h: botH }
    ]
  }

  if (safeCount === 4) {
    const w1 = Math.floor((width - gap) / 2)
    const w2 = width - gap - w1
    const h1 = Math.floor((height - gap) / 2)
    const h2 = height - gap - h1
    return [
      { x: 0, y: 0, w: w1, h: h1 },
      { x: w1 + gap, y: 0, w: w2, h: h1 },
      { x: 0, y: h1 + gap, w: w1, h: h2 },
      { x: w1 + gap, y: h1 + gap, w: w2, h: h2 }
    ]
  }

  if (safeCount === 5) {
    const h1 = Math.floor((height - gap) / 2)
    const h2 = height - gap - h1
    const tw1 = Math.floor((width - gap) / 2)
    const tw2 = width - gap - tw1
    const bw = Math.floor((width - 2 * gap) / 3)
    const bw3 = width - 2 * gap - 2 * bw
    return [
      { x: 0, y: 0, w: tw1, h: h1 },
      { x: tw1 + gap, y: 0, w: tw2, h: h1 },
      { x: 0, y: h1 + gap, w: bw, h: h2 },
      { x: bw + gap, y: h1 + gap, w: bw, h: h2 },
      { x: 2 * (bw + gap), y: h1 + gap, w: bw3, h: h2 }
    ]
  }

  // 6 photos: 3x2 symmetrical grid
  const cw = Math.floor((width - 2 * gap) / 3)
  const cw3 = width - 2 * gap - 2 * cw
  const ch1 = Math.floor((height - gap) / 2)
  const ch2 = height - gap - ch1

  return [
    { x: 0, y: 0, w: cw, h: ch1 },
    { x: cw + gap, y: 0, w: cw, h: ch1 },
    { x: 2 * (cw + gap), y: 0, w: cw3, h: ch1 },
    { x: 0, y: ch1 + gap, w: cw, h: ch2 },
    { x: cw + gap, y: ch1 + gap, w: cw, h: ch2 },
    { x: 2 * (cw + gap), y: ch1 + gap, w: cw3, h: ch2 }
  ]
}

/**
 * Draw an image into a rectangular slot using object-cover center-crop
 * so faces/objects are never stretched or distorted.
 */
export function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | HTMLCanvasElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number
) {
  const sw = img instanceof HTMLImageElement ? (img.naturalWidth || img.width) : img.width
  const sh = img instanceof HTMLImageElement ? (img.naturalHeight || img.height) : img.height
  if (!sw || !sh || dw <= 0 || dh <= 0) return

  const srcRatio = sw / sh
  const dstRatio = dw / dh
  let sx = 0
  let sy = 0
  let sWidth = sw
  let sHeight = sh

  if (srcRatio > dstRatio) {
    sWidth = sh * dstRatio
    sx = (sw - sWidth) / 2
  } else if (srcRatio < dstRatio) {
    sHeight = sw / dstRatio
    sy = (sh - sHeight) / 2
  }

  ctx.save()
  ctx.beginPath()
  ctx.rect(dx, dy, dw, dh)
  ctx.clip()
  ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dw, dh)
  ctx.restore()
}

/**
 * Build an offscreen collage canvas from 1 to 6 images with crisp white dividers.
 */
export function renderCollageBackgroundCanvas(
  images: HTMLImageElement[],
  width: number,
  height: number,
  gap: number = 4
): HTMLCanvasElement | null {
  if (!images || images.length === 0 || typeof document === 'undefined') return null

  const offscreen = document.createElement('canvas')
  offscreen.width = width
  offscreen.height = height
  const ctx = offscreen.getContext('2d')
  if (!ctx) return null

  // White background forms the thin separator lines between cells
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)

  const clipped = images.slice(0, 6)
  const slots = getCollageSlots(clipped.length, width, height, gap)

  slots.forEach((slot, idx) => {
    const img = clipped[idx]
    if (img) {
      drawImageCover(ctx, img, slot.x, slot.y, slot.w, slot.h)
    }
  })

  return offscreen
}

export interface TimemarkWatermarkOptions {
  width: number
  height: number
  scale?: number
  bgImg?: HTMLImageElement | HTMLCanvasElement | null
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
  mapLabel?: string
}

/**
 * Pure HTML5 Canvas renderer matching official SPPG Timemark standard.
 */
export function drawTimemarkWatermark(
  ctx: CanvasRenderingContext2D,
  options: TimemarkWatermarkOptions
) {
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
    dynamicMapTileImg,
    mapLabel = 'Wonorejo / Pasuruan'
  } = options

  const W = width
  const H = height
  const scale = propScale || Math.min(W, H) / 1000

  ctx.clearRect(0, 0, W, H)

  // 1. Background image / collage or dark technical fallback
  if (bgImg) {
    if (zoom === 1 && offset.x === 0 && offset.y === 0) {
      ctx.drawImage(bgImg, 0, 0, W, H)
    } else {
      const bgW = bgImg instanceof HTMLImageElement ? (bgImg.naturalWidth || bgImg.width) : bgImg.width
      const bgH = bgImg instanceof HTMLImageElement ? (bgImg.naturalHeight || bgImg.height) : bgImg.height
      const imgRatio = bgW / Math.max(1, bgH)
      const canvasRatio = W / H
      let drawW: number
      let drawH: number

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
    }
  } else {
    const grad = ctx.createLinearGradient(0, 0, W, H)
    grad.addColorStop(0, '#1e293b')
    grad.addColorStop(0.5, '#0f172a')
    grad.addColorStop(1, '#020617')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
    ctx.lineWidth = 2 * scale
    const step = 60 * scale
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

  // Subtle bottom gradient to ensure crisp legibility over bright photos
  const softGrad = ctx.createLinearGradient(0, H - 0.32 * H, 0, H)
  softGrad.addColorStop(0, 'rgba(0, 0, 0, 0)')
  softGrad.addColorStop(1, 'rgba(0, 0, 0, 0.42)')
  ctx.fillStyle = softGrad
  ctx.fillRect(0, H - 0.32 * H, W, 0.32 * H)

  // 2. Mini Map (Top-Left)
  const mapW = Math.round(205 * scale)
  const mapH = Math.round(205 * scale)
  const mapX = Math.round(35 * scale)
  const mapY = Math.round(35 * scale)
  const mapRadius = Math.round(14 * scale)

  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.22)'
  ctx.shadowBlur = 8 * scale
  ctx.shadowOffsetY = 2 * scale
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.roundRect(mapX, mapY, mapW, mapH, mapRadius)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.lineWidth = 1.5 * scale
  ctx.stroke()
  ctx.restore()

  ctx.save()
  ctx.beginPath()
  ctx.roundRect(mapX, mapY, mapW, mapH, mapRadius)
  ctx.clip()

  if (dynamicMapTileImg) {
    ctx.drawImage(dynamicMapTileImg, mapX, mapY, mapW, mapH)
  } else if (mapImg) {
    ctx.drawImage(mapImg, mapX, mapY, mapW, mapH)
  } else {
    ctx.fillStyle = '#f8fafc'
    ctx.fillRect(mapX, mapY, mapW, mapH)

    ctx.strokeStyle = '#cbd5e1'
    ctx.lineWidth = 7.5 * scale
    ctx.beginPath()
    ctx.moveTo(mapX, mapY + mapH * 0.36)
    ctx.lineTo(mapX + mapW, mapY + mapH * 0.74)
    ctx.stroke()

    ctx.strokeStyle = '#fde68a'
    ctx.lineWidth = 4.2 * scale
    ctx.beginPath()
    ctx.moveTo(mapX, mapY + mapH * 0.36)
    ctx.lineTo(mapX + mapW, mapY + mapH * 0.74)
    ctx.stroke()

    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 4 * scale
    ctx.beginPath()
    ctx.moveTo(mapX + mapW * 0.42, mapY)
    ctx.lineTo(mapX + mapW * 0.62, mapY + mapH)
    ctx.stroke()
  }

  const pinX = mapX + mapW / 2
  const pinY = mapY + mapH / 2

  ctx.save()
  ctx.fillStyle = 'rgba(45, 212, 191, 0.45)'
  ctx.beginPath()
  ctx.moveTo(pinX, pinY)
  ctx.arc(pinX, pinY, mapW * 0.38, (25 * Math.PI) / 180, (75 * Math.PI) / 180, false)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  ctx.fillStyle = '#0ea5e9'
  ctx.beginPath()
  ctx.arc(pinX, pinY, 7.5 * scale, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2 * scale
  ctx.stroke()

  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(pinX, pinY, 2.5 * scale, 0, Math.PI * 2)
  ctx.fill()

  ctx.save()
  ctx.translate(mapX + mapW - 26 * scale, mapY + 30 * scale)
  ctx.rotate((-35 * Math.PI) / 180)
  ctx.font = `bold ${Math.round(11 * scale)}px Arial, sans-serif`
  ctx.fillStyle = '#475569'
  ctx.fillText(mapLabel, 0, 0)
  ctx.restore()

  ctx.font = `bold ${Math.round(11 * scale)}px Arial, sans-serif`
  ctx.fillStyle = '#1e293b'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText('📍 Peta', mapX + 8 * scale, mapY + mapH - 8 * scale)

  ctx.strokeStyle = 'rgba(226, 232, 240, 0.7)'
  ctx.lineWidth = 1 * scale
  ctx.stroke()
  ctx.restore()

  // 3. Top-Right Timemark Wordmark
  const tmX = W - Math.round(35 * scale)
  let tmY = Math.round(35 * scale)

  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)'
  ctx.shadowBlur = 4 * scale
  ctx.shadowOffsetX = 1 * scale
  ctx.shadowOffsetY = 1 * scale
  ctx.textAlign = 'right'
  ctx.textBaseline = 'top'

  ctx.font = `bold ${Math.round(24 * scale)}px Arial, sans-serif`
  ctx.fillStyle = '#f59e0b'
  ctx.fillText('Timemark', tmX, tmY)

  tmY += Math.round(28 * scale)
  ctx.font = `normal ${Math.round(14 * scale)}px Arial, sans-serif`
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
  ctx.fillText('Foto 100% akurat', tmX, tmY)
  ctx.restore()

  // 4. Bottom Text Block Metrics
  const lineX = Math.round(35 * scale)
  const textX = lineX + Math.round(14 * scale)

  const dateFontH = Math.round(20 * scale)
  const addrFontH = Math.round(18 * scale)
  const coordsFontH = Math.round(18 * scale)
  const codeFontH = Math.round(14 * scale)
  const rowGap = Math.round(6 * scale)
  const codeGap = Math.round(10 * scale)
  const bottomMargin = Math.round(42 * scale)

  ctx.save()
  ctx.font = `normal ${addrFontH}px Arial, sans-serif`
  const maxAddrWidth = W - textX - Math.round(45 * scale)
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

  const hasAddr2 = Boolean(addrLine2 && addrLine2.trim())

  const yCode = H - bottomMargin - codeFontH
  const coordsBottom = yCode - codeGap
  const yCoords = coordsBottom - coordsFontH
  const yAddr2 = hasAddr2 ? yCoords - rowGap - addrFontH : yCoords
  const yAddr1 = hasAddr2 ? yAddr2 - rowGap - addrFontH : yCoords - rowGap - addrFontH
  const yDate = yAddr1 - rowGap - dateFontH

  // 5. White Badge Card (Yellow Division/Activity Tag + Bebas Neue Clock + Official Logos)
  const cardHeight = Math.round(52 * scale)
  const cardRadius = Math.round(8 * scale)
  const cardY = yDate - cardHeight - Math.round(26 * scale)
  const cardX = lineX

  const jamFontSize = Math.round(44 * scale)
  const timeDisplay = timeStr || '00:00'
  ctx.save()
  ctx.font = `bold ${jamFontSize}px 'Bebas Neue', sans-serif`
  const timeWidth = ctx.measureText(timeDisplay).width
  ctx.restore()

  const logoH = Math.round(34 * scale)
  const logoSpacing = Math.round(8 * scale)
  const activeLogos: Array<{ img: HTMLImageElement; width: number; height: number }> = []

  if (showBgnLogo && bgnLogo) {
    const nw = bgnLogo.naturalWidth || bgnLogo.width || 1
    const nh = bgnLogo.naturalHeight || bgnLogo.height || 1
    activeLogos.push({ img: bgnLogo, width: logoH * (nw / nh), height: logoH })
  }
  if (showRegionalLogo && regionalLogo) {
    const nw = regionalLogo.naturalWidth || regionalLogo.width || 1
    const nh = regionalLogo.naturalHeight || regionalLogo.height || 1
    activeLogos.push({ img: regionalLogo, width: logoH * (nw / nh), height: logoH })
  }
  if (customLogo) {
    const nw = customLogo.naturalWidth || customLogo.width || 1
    const nh = customLogo.naturalHeight || customLogo.height || 1
    activeLogos.push({ img: customLogo, width: logoH * (nw / nh), height: logoH })
  }

  let logosTotalWidth = 0
  for (let i = 0; i < activeLogos.length; i++) {
    logosTotalWidth += activeLogos[i].width
    if (i < activeLogos.length - 1) logosTotalWidth += logoSpacing
  }

  const dividerWidth = Math.round(1.5 * scale)
  const padLeft = Math.round(6 * scale)
  const padRight = Math.round(12 * scale)
  const itemGap = Math.round(10 * scale)
  const actBadgePadX = Math.round(12 * scale)

  const actText = activity && activity.trim() ? activity.trim() : 'LAPORAN SPPG'
  let actFontSize = Math.round(20 * scale)

  // Shrink yellow badge font slightly if the label is very long so card stays inside canvas
  const maxCardWidth = W - cardX - Math.round(35 * scale)
  const fixedOthersWidth =
    padLeft +
    actBadgePadX * 2 +
    itemGap +
    timeWidth +
    (activeLogos.length > 0 ? itemGap + dividerWidth + itemGap + logosTotalWidth : 0) +
    padRight

  ctx.save()
  ctx.font = `bold ${actFontSize}px Arial, sans-serif`
  let actTextWidth = ctx.measureText(actText).width
  while (actTextWidth + fixedOthersWidth > maxCardWidth && actFontSize > Math.round(12 * scale)) {
    actFontSize -= 1
    ctx.font = `bold ${actFontSize}px Arial, sans-serif`
    actTextWidth = ctx.measureText(actText).width
  }
  ctx.restore()

  const actBadgeWidth = actTextWidth + actBadgePadX * 2
  const cardWidth = fixedOthersWidth + actTextWidth

  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.16)'
  ctx.shadowBlur = 6 * scale
  ctx.shadowOffsetY = 2 * scale
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.roundRect(cardX, cardY, cardWidth, cardHeight, cardRadius)
  ctx.fill()
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = Math.max(1, Math.round(1 * scale))
  ctx.stroke()
  ctx.restore()

  let currX = cardX + padLeft
  const badgeY = cardY + Math.round(5 * scale)
  const badgeH = cardHeight - Math.round(10 * scale)

  ctx.fillStyle = '#fbbf24'
  ctx.beginPath()
  ctx.roundRect(currX, badgeY, actBadgeWidth, badgeH, Math.round(6 * scale))
  ctx.fill()

  ctx.fillStyle = '#000000'
  ctx.font = `bold ${actFontSize}px Arial, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(actText, currX + actBadgeWidth / 2, badgeY + badgeH / 2)

  currX += actBadgeWidth + itemGap

  const jamGradient = ctx.createLinearGradient(
    0,
    cardY + Math.round(4 * scale),
    0,
    cardY + cardHeight - Math.round(4 * scale)
  )
  jamGradient.addColorStop(0, '#1e3a8a')
  jamGradient.addColorStop(1, '#0f172a')
  ctx.fillStyle = jamGradient
  ctx.font = `bold ${jamFontSize}px 'Bebas Neue', sans-serif`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(timeDisplay, currX, cardY + cardHeight / 2 + Math.round(2 * scale))

  currX += timeWidth

  if (activeLogos.length > 0) {
    currX += itemGap
    const divH = Math.round(30 * scale)
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

  // 6. Orange Vertical Accent Line
  const lineWidth = Math.round(4 * scale)
  ctx.save()
  ctx.strokeStyle = '#f97316'
  ctx.lineWidth = lineWidth
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(lineX, yDate + lineWidth / 2)
  ctx.lineTo(lineX, coordsBottom - lineWidth / 2)
  ctx.stroke()
  ctx.restore()

  // 7. White Date, Address, GPS Text
  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)'
  ctx.shadowBlur = 4 * scale
  ctx.shadowOffsetX = 1 * scale
  ctx.shadowOffsetY = 1 * scale
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'

  ctx.font = `bold ${dateFontH}px Arial, sans-serif`
  ctx.fillText(dateStr || formatIndoDate(), textX, yDate)

  ctx.font = `normal ${addrFontH}px Arial, sans-serif`
  ctx.fillText(addrLine1, textX, yAddr1)
  if (hasAddr2) {
    ctx.fillText(addrLine2, textX, yAddr2)
  }

  ctx.font = `normal ${coordsFontH}px Arial, sans-serif`
  ctx.fillText(gpsCoords || '7.721026°S, 112.797828°E', textX, yCoords)
  ctx.restore()

  // 8. Photo Verification Code + Shield Icon
  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)'
  ctx.shadowBlur = 4 * scale
  ctx.shadowOffsetX = 1 * scale
  ctx.shadowOffsetY = 1 * scale

  const shieldW = Math.round(13 * scale)
  const shieldH = Math.round(15 * scale)
  const shieldX = textX
  const shieldY = yCode + Math.round(1 * scale)

  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = Math.max(1, 1.4 * scale)
  ctx.beginPath()
  ctx.moveTo(shieldX, shieldY)
  ctx.lineTo(shieldX + shieldW, shieldY)
  ctx.lineTo(shieldX + shieldW, shieldY + shieldH * 0.6)
  ctx.quadraticCurveTo(shieldX + shieldW / 2, shieldY + shieldH, shieldX, shieldY + shieldH * 0.6)
  ctx.closePath()
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(shieldX + 2.5 * scale, shieldY + 6.5 * scale)
  ctx.lineTo(shieldX + 5 * scale, shieldY + 9.5 * scale)
  ctx.lineTo(shieldX + 10 * scale, shieldY + 4.5 * scale)
  ctx.stroke()

  ctx.fillStyle = '#e2e8f0'
  ctx.font = `normal ${codeFontH}px Arial, sans-serif`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  const activeCode = timemarkCode || 'SPPGVERIFY01'
  ctx.fillText(`Kode Foto: ${activeCode} Timemark Verified`, shieldX + shieldW + Math.round(6 * scale), yCode)
  ctx.restore()

  // 9. Vertical Right Verification Stamp
  const vertX = W - Math.round(15 * scale)
  const vertY = H / 2

  ctx.save()
  ctx.translate(vertX, vertY)
  ctx.rotate((-90 * Math.PI) / 180)
  ctx.font = `normal ${Math.round(13 * scale)}px Arial, sans-serif`
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
  ctx.shadowBlur = 3 * scale
  ctx.shadowOffsetX = 1 * scale
  ctx.shadowOffsetY = 1 * scale
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(`© ${activeCode} Timemark Verified`, 0, 0)
  ctx.restore()
}
