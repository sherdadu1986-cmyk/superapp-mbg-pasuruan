import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const latStr = searchParams.get('lat')
  const lngStr = searchParams.get('lng')

  const lat = Number(latStr)
  const lng = Number(lngStr)

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({
      success: false,
      address: '',
      mapLabel: 'GPS',
      source: 'invalid_coords'
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
        : data?.display_name || ''

    return NextResponse.json({
      success: Boolean(formattedAddress),
      address: formattedAddress,
      mapLabel: a.city_district || a.village || a.county || 'Lokasi GPS',
      source: 'nominatim'
    })
  } catch (err) {
    console.warn('Reverse geocode error:', err)
    return NextResponse.json({
      success: false,
      address: '',
      mapLabel: 'Lokasi GPS',
      source: 'fallback'
    })
  }
}
