import { supabase } from './supabase'

export const DIVISI_RELAWAN_OPTIONS = [
  'Divisi Persiapan',
  'Divisi Pengolahan / Masak',
  'Divisi Pemorsian / Packing',
  'Divisi Distribusi',
  'Divisi Cuci Ompreng',
  'Divisi Kebersihan & Sanitasi',
  'Divisi Umum / Keamanan'
] as const

export type DivisiRelawan = (typeof DIVISI_RELAWAN_OPTIONS)[number]

export const DIVISI_FILTER_OPTIONS = [
  { label: 'Semua Divisi', value: 'ALL' },
  { label: 'Persiapan', value: 'Divisi Persiapan' },
  { label: 'Pengolahan', value: 'Divisi Pengolahan / Masak' },
  { label: 'Pemorsian', value: 'Divisi Pemorsian / Packing' },
  { label: 'Distribusi', value: 'Divisi Distribusi' },
  { label: 'Cuci Ompreng', value: 'Divisi Cuci Ompreng' },
  { label: 'Kebersihan', value: 'Divisi Kebersihan & Sanitasi' },
  { label: 'Umum', value: 'Divisi Umum / Keamanan' }
] as const

export interface LaporanRelawanRecord {
  id: string
  created_at: string
  tanggal_laporan: string
  waktu_laporan: string
  divisi: string
  nama_relawan: string
  keterangan: string
  lokasi_alamat: string
  koordinat_gps: string
  kode_foto: string
  image_url: string
  isLocalFallback?: boolean
}

export interface SaveLaporanInput {
  tanggal_laporan: string
  waktu_laporan: string
  divisi: string
  nama_relawan: string
  keterangan: string
  lokasi_alamat: string
  koordinat_gps: string
  kode_foto: string
  imageBlob: Blob
  fallbackDataUrl?: string
}

export interface SaveLaporanResult {
  record: LaporanRelawanRecord
  savedToCloud: boolean
  storageUploaded: boolean
  warningMessage?: string
}

const LOCAL_CACHE_KEY = 'sppg_laporan_relawan_local_v1'
export const LAPORAN_BUCKET = 'laporan-relawan'

function readLocalCache(): LaporanRelawanRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(LOCAL_CACHE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeLocalCache(rows: LaporanRelawanRecord[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(rows.slice(0, 50)))
  } catch (err) {
    console.warn('Local cache quota notice:', err)
  }
}

export function isSupabaseMissingInfraError(message: string): boolean {
  const lower = (message || '').toLowerCase()
  return (
    lower.includes('could not find the table') ||
    lower.includes('relation') ||
    lower.includes('bucket not found') ||
    lower.includes('does not exist')
  )
}

export async function fetchLaporanRelawanList(): Promise<{
  records: LaporanRelawanRecord[]
  cloudReady: boolean
  cloudError?: string
}> {
  const localRows = readLocalCache()
  try {
    const { data, error } = await supabase
      .from('laporan_relawan')
      .select('*')
      .order('tanggal_laporan', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) {
      return {
        records: localRows,
        cloudReady: false,
        cloudError: error.message
      }
    }

    const cloudRows: LaporanRelawanRecord[] = (data || []).map((row) => ({
      ...row,
      keterangan: row.keterangan || '',
      lokasi_alamat: row.lokasi_alamat || '',
      koordinat_gps: row.koordinat_gps || '',
      kode_foto: row.kode_foto || ''
    }))

    // Keep any unsynced local-only records visible so volunteer data is never lost
    const cloudCodes = new Set(cloudRows.map((r) => r.kode_foto).filter(Boolean))
    const unsyncedLocal = localRows.filter((r) => r.isLocalFallback && !cloudCodes.has(r.kode_foto))

    return {
      records: [...unsyncedLocal, ...cloudRows],
      cloudReady: true
    }
  } catch (err: any) {
    return {
      records: localRows,
      cloudReady: false,
      cloudError: err?.message || 'Gagal menghubungi Supabase'
    }
  }
}

export async function saveLaporanRelawan(input: SaveLaporanInput): Promise<SaveLaporanResult> {
  const cleanDate = input.tanggal_laporan || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
  const cleanCode = (input.kode_foto || `SPPG${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '')
  const storagePath = `${cleanDate}/${cleanCode}.jpg`

  let finalImageUrl = ''
  let storageUploaded = false
  let storageErrorMsg = ''

  // 1. Upload JPG blob to Supabase Storage bucket `laporan-relawan`
  try {
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(LAPORAN_BUCKET)
      .upload(storagePath, input.imageBlob, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: true
      })

    if (!uploadError && uploadData) {
      const { data: urlData } = supabase.storage
        .from(LAPORAN_BUCKET)
        .getPublicUrl(uploadData.path || storagePath)
      if (urlData?.publicUrl) {
        finalImageUrl = urlData.publicUrl
        storageUploaded = true
      }
    } else if (uploadError) {
      storageErrorMsg = uploadError.message
    }
  } catch (err: any) {
    storageErrorMsg = err?.message || 'Upload storage gagal'
  }

  // Fallback to compressed Data URL only if bucket hasn't been created yet
  if (!finalImageUrl && input.fallbackDataUrl) {
    finalImageUrl = input.fallbackDataUrl
  }

  const payload = {
    tanggal_laporan: cleanDate,
    waktu_laporan: input.waktu_laporan || '00:00',
    divisi: input.divisi,
    nama_relawan: input.nama_relawan.trim(),
    keterangan: input.keterangan.trim(),
    lokasi_alamat: input.lokasi_alamat.trim(),
    koordinat_gps: input.koordinat_gps.trim(),
    kode_foto: cleanCode,
    image_url: finalImageUrl
  }

  // 2. Insert metadata into Supabase `laporan_relawan`
  try {
    const { data, error } = await supabase
      .from('laporan_relawan')
      .insert([payload])
      .select()
      .single()

    if (!error && data) {
      const savedRecord: LaporanRelawanRecord = {
        ...data,
        keterangan: data.keterangan || '',
        lokasi_alamat: data.lokasi_alamat || '',
        koordinat_gps: data.koordinat_gps || '',
        kode_foto: data.kode_foto || cleanCode
      }
      return {
        record: savedRecord,
        savedToCloud: true,
        storageUploaded,
        warningMessage: !storageUploaded && storageErrorMsg
          ? `Laporan tersimpan di database, namun Storage '${LAPORAN_BUCKET}' belum siap (${storageErrorMsg}).`
          : undefined
      }
    }

    // Fall through to local cache on missing table / network issue
    const localRecord: LaporanRelawanRecord = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `local-${Date.now()}`,
      created_at: new Date().toISOString(),
      ...payload,
      isLocalFallback: true
    }
    const existing = readLocalCache()
    writeLocalCache([localRecord, ...existing])

    return {
      record: localRecord,
      savedToCloud: false,
      storageUploaded,
      warningMessage: error?.message || storageErrorMsg || 'Database belum siap; tersimpan sementara di browser.'
    }
  } catch (err: any) {
    const localRecord: LaporanRelawanRecord = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `local-${Date.now()}`,
      created_at: new Date().toISOString(),
      ...payload,
      isLocalFallback: true
    }
    const existing = readLocalCache()
    writeLocalCache([localRecord, ...existing])

    return {
      record: localRecord,
      savedToCloud: false,
      storageUploaded,
      warningMessage: err?.message || 'Koneksi cloud bermasalah; tersimpan sementara di browser.'
    }
  }
}

export async function deleteLaporanRelawan(record: LaporanRelawanRecord): Promise<boolean> {
  if (record.isLocalFallback) {
    const existing = readLocalCache().filter((r) => r.id !== record.id)
    writeLocalCache(existing)
    return true
  }

  try {
    if (record.tanggal_laporan && record.kode_foto && !record.image_url?.startsWith('data:')) {
      await supabase.storage
        .from(LAPORAN_BUCKET)
        .remove([`${record.tanggal_laporan}/${record.kode_foto}.jpg`])
        .catch(() => {})
    }
    const { error } = await supabase.from('laporan_relawan').delete().eq('id', record.id)
    if (error) {
      console.error('Delete laporan_relawan error:', error)
      return false
    }
    const existing = readLocalCache().filter((r) => r.id !== record.id)
    writeLocalCache(existing)
    return true
  } catch (err) {
    console.error('Delete laporan_relawan exception:', err)
    return false
  }
}

export function buildLaporanFilename(divisi: string, tanggal: string, waktu: string): string {
  const cleanDivisi = (divisi || 'Laporan')
    .replace(/\s*\/\s*/g, '-')
    .replace(/[^a-zA-Z0-9-]+/g, '_')
    .replace(/^_+|_+$/g, '')
  const cleanDate = (tanggal || getTodayDateStr()).replace(/[^0-9-]/g, '')
  const cleanTime = (waktu || '00-00').replace(/:/g, '-')
  return `Laporan-${cleanDivisi}-${cleanDate}-${cleanTime}.jpg`
}

function getTodayDateStr(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
}
