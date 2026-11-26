import { NextRequest, NextResponse } from 'next/server'

const FALLBACK_ADDRESS = 'Wonorejo, Pasuruan, Jawa Timur, 67173'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const latStr = searchParams.get('lat')
  const lngStr = searchParams.get('lng')

  const lat = Number(latStr)
  const lng = Number(lngStr)

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({
      success: false,
      address: FALLBACK_ADDRESS,
      source: 'fallback'
    })
  }

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)

    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1&accept-language=id`

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'SPPG-Pasuruan-MBG-App/1.0 (operasional@sppg-pasuruan.id)',
        Accept: 'application/json'
      },
      signal: controller.signal,
      cache: 'no-store'
    })

    clearTimeout(timer)

    if (!res.ok) {
      throw new Error(`Nominatim status ${res.status}`)
    }

    const data = await res.json()
    const a = data?.address || {}

    const parts = [
      a.road || a.pedestrian || a.neighbourhood || a.hamlet,
      a.village || a.suburb || a.town,
      a.city_district || a.subdistrict || a.municipality,
      a.county || a.city || a.regency,
      a.state,
      a.postcode
    ].filter((part): part is string => Boolean(part && String(part).trim()))

    const uniqueParts = parts.filter(
      (part, index) => parts.findIndex((p) => p.toLowerCase() === part.toLowerCase()) === index
    )

    const formattedAddress =
      uniqueParts.length > 0
        ? uniqueParts.join(', ')
        : data?.display_name || FALLBACK_ADDRESS

    return NextResponse.json({
      success: true,
      address: formattedAddress,
      mapLabel: a.city_district || a.village || a.county || 'Wonorejo / Pasuruan',
      source: 'nominatim'
    })
  } catch (err) {
    console.warn('Reverse geocode fallback triggered:', err)
    return NextResponse.json({
      success: false,
      address: FALLBACK_ADDRESS,
      mapLabel: 'Wonorejo / Pasuruan',
      source: 'fallback'
    })
  }
}
