import { supabase } from './supabase'
import type { PenerimaManfaatBnba } from './data-helpers'

export type SubKategori3B = 'POS - Ibu Hamil' | 'POS - Ibu Menyusui' | 'POS - Balita'

export interface NormalizedBnba3B {
  nama_lengkap: string
  tanggal_lahir: string // YYYY-MM-DD
  gender: 'L' | 'P'
  type: string
  identity_code: string
  kategori: string
  sub_kategori: SubKategori3B
  hpht: string // YYYY-MM-DD or ''
  nama_anak: string
  type_identity_anak: string
  identity_code_anak: string
  tanggal_lahir_anak: string // YYYY-MM-DD or ''
  nama_ibu: string
  type_identity_ibu: string
  identity_code_ibu: string
}

export interface Nik3BParsedInfo {
  isFormatValid: boolean
  isTempZeros: boolean
  extractedBirthIso: string | null
  extractedBirthDisplay: string | null
  extractedGender: 'L' | 'P' | null
  error: string | null
  warning: string | null
}

export interface Duplicate3BMatch {
  id: string
  nama: string
  lokasi: string
  subKategori: string
  message: string
}

export interface AgeIndicator {
  months: number | null
  text: string
  isValid: boolean
}

export interface Bnba3BValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  nikInfo: Nik3BParsedInfo
  anakNikInfo?: Nik3BParsedInfo
  ibuNikInfo?: Nik3BParsedInfo
  recipientAgeIndicator: AgeIndicator | null
  childAgeIndicator: AgeIndicator | null
  hphtIndicator: AgeIndicator | null
}

export function cleanDigits(val: unknown): string {
  if (val === null || val === undefined) return ''
  return String(val).replace(/[^0-9]/g, '').trim()
}

export function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) return false
  const d = new Date(year, month - 1, day)
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day
}

export function formatIsoDateToDDMMYYYY(iso?: string | null): string {
  if (!iso || iso === '-' || iso === '—') return '—'
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(iso)) return iso
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return iso
  return `${match[3]}/${match[2]}/${match[1]}`
}

/**
 * Exact completed calendar months from `fromIso` (YYYY-MM-DD) to `refDate`.
 * Returns negative if `fromIso` is in the future.
 */
export function getCalendarMonthsDiff(fromIso: string, refDate: Date = new Date()): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fromIso)) return null
  const [fy, fm, fd] = fromIso.split('-').map(Number)
  if (!isValidCalendarDate(fy, fm, fd)) return null

  const ty = refDate.getFullYear()
  const tm = refDate.getMonth() + 1
  const td = refDate.getDate()

  const fromDateOnly = new Date(fy, fm - 1, fd)
  const toDateOnly = new Date(ty, tm - 1, td)
  if (fromDateOnly.getTime() > toDateOnly.getTime()) {
    return -1
  }

  let months = (ty - fy) * 12 + (tm - fm)
  if (td < fd) {
    months -= 1
  }
  return months
}

/**
 * Parse and validate 16-digit Indonesian NIK structure (digits 7-12 = DDMMYY, +40 for female).
 * - Rejects non-16-digit or non-numeric strings.
 * - Flags trailing `0000` as yellow warning (non-blocking).
 */
export function parseNikStructure3B(rawNik: string, refDate: Date = new Date()): Nik3BParsedInfo {
  const raw = String(rawNik || '').trim()
  if (!raw) {
    return {
      isFormatValid: false,
      isTempZeros: false,
      extractedBirthIso: null,
      extractedBirthDisplay: null,
      extractedGender: null,
      error: 'NIK wajib diisi tepat 16 digit angka',
      warning: null,
    }
  }

  if (!/^\d+$/.test(raw)) {
    return {
      isFormatValid: false,
      isTempZeros: false,
      extractedBirthIso: null,
      extractedBirthDisplay: null,
      extractedGender: null,
      error: 'NIK hanya boleh berisi angka (tanpa huruf atau spasi)',
      warning: null,
    }
  }

  if (raw.length !== 16) {
    return {
      isFormatValid: false,
      isTempZeros: false,
      extractedBirthIso: null,
      extractedBirthDisplay: null,
      extractedGender: null,
      error: `NIK wajib tepat 16 digit angka (saat ini ${raw.length} digit)`,
      warning: null,
    }
  }

  const rawDd = parseInt(raw.slice(6, 8), 10)
  const mm = parseInt(raw.slice(8, 10), 10)
  const yy = parseInt(raw.slice(10, 12), 10)

  const extractedGender: 'L' | 'P' = rawDd > 40 ? 'P' : 'L'
  const actualDay = rawDd > 40 ? rawDd - 40 : rawDd

  const currentYY = refDate.getFullYear() % 100
  const year = yy <= currentYY ? 2000 + yy : 1900 + yy

  if (!isValidCalendarDate(year, mm, actualDay)) {
    return {
      isFormatValid: false,
      isTempZeros: false,
      extractedBirthIso: null,
      extractedBirthDisplay: null,
      extractedGender: null,
      error: 'Kode tanggal/bulan lahir pada digit ke-7 s/d 12 NIK tidak valid',
      warning: null,
    }
  }

  const ddStr = String(actualDay).padStart(2, '0')
  const mmStr = String(mm).padStart(2, '0')
  const extractedBirthIso = `${year}-${mmStr}-${ddStr}`
  const extractedBirthDisplay = `${ddStr}/${mmStr}/${year}`

  const isTempZeros = raw.slice(12, 16) === '0000'
  const warning = isTempZeros
    ? 'NIK sementara: 4 digit terakhir 0000 (belum update KK)'
    : null

  return {
    isFormatValid: true,
    isTempZeros,
    extractedBirthIso,
    extractedBirthDisplay,
    extractedGender,
    error: null,
    warning,
  }
}

export interface GlobalNikRecordInfo {
  id: string
  nama: string
  lokasi: string
  subKategori: string
}

/**
 * Build an O(1) lookup map of all existing NIKs across Posyandu & Schools.
 */
export function buildGlobalNikLookupMap(
  allRecords: PenerimaManfaatBnba[],
  kpmList: Array<{ id: string; nama: string; npsnReg?: string }>
): Map<string, GlobalNikRecordInfo[]> {
  const kpmNameMap = new Map<string, string>()
  kpmList.forEach(k => {
    if (k.id) kpmNameMap.set(k.id, k.nama)
    if (k.npsnReg) kpmNameMap.set(k.npsnReg, k.nama)
  })

  const map = new Map<string, GlobalNikRecordInfo[]>()
  allRecords.forEach(rec => {
    const nik = cleanDigits(rec.identity_code || rec.nisn_nik || rec.nik || '')
    if (!nik || nik.length < 10) return
    const nama = (rec.nama_lengkap || rec.nama_penerima || rec.nama || 'Penerima').toUpperCase().trim()
    const lokasi = kpmNameMap.get(rec.kelompok_id) || (rec as any).nama_sekolah || (rec as any).nama_kelompok || 'Lembaga / Posyandu Terdaftar'
    const subKat = rec.sub_kategori || rec.posisi || 'Terdaftar'
    const existing = map.get(nik) || []
    existing.push({ id: rec.id, nama, lokasi, subKategori: subKat })
    map.set(nik, existing)
  })
  return map
}

export function formatDuplicateMessage(info: GlobalNikRecordInfo): string {
  return `NIK sudah terdaftar atas nama ${info.nama} di ${info.lokasi} (${info.subKategori})`
}

/**
 * Live Supabase + local fallback duplicate check for single-entry / edit BNBA modal.
 */
export async function checkDuplicateNik3BLive(
  nik: string,
  currentRecordId?: string,
  localRecords?: PenerimaManfaatBnba[],
  kpmList?: Array<{ id: string; nama: string; npsnReg?: string }>
): Promise<Duplicate3BMatch | null> {
  const cleanNik = cleanDigits(nik)
  if (cleanNik.length !== 16) return null

  const kpmNameMap = new Map<string, string>()
  ;(kpmList || []).forEach(k => {
    if (k.id) kpmNameMap.set(k.id, k.nama)
    if (k.npsnReg) kpmNameMap.set(k.npsnReg, k.nama)
  })

  try {
    let query = supabase
      .from('penerima_manfaat_bnba')
      .select('id, nisn_nik, nik, nama_lengkap, nama_penerima, nama, kelompok_id, posisi, kelas')
      .or(`nisn_nik.eq.${cleanNik},nik.eq.${cleanNik}`)

    if (currentRecordId) {
      query = query.neq('id', currentRecordId)
    }

    const { data: bnbaRows, error } = await query.limit(1)
    if (!error && bnbaRows && bnbaRows.length > 0) {
      const m: any = bnbaRows[0]
      let lokasi = kpmNameMap.get(m.kelompok_id) || 'Lembaga / Posyandu'
      if (m.kelompok_id && !kpmNameMap.has(m.kelompok_id)) {
        const { data: kpmData } = await supabase
          .from('kelompok_penerima_manfaat')
          .select('nama')
          .eq('id', m.kelompok_id)
          .maybeSingle()
        if (kpmData?.nama) lokasi = kpmData.nama
      }
      let subKat = m.posisi || 'Penerima'
      if (typeof m.kelas === 'string' && m.kelas.startsWith('__3B__:')) {
        try {
          const parsed = JSON.parse(m.kelas.slice(7))
          if (parsed?.sub_kategori) subKat = parsed.sub_kategori
        } catch {}
      }
      const nama = (m.nama_lengkap || m.nama_penerima || m.nama || 'Penerima').toUpperCase().trim()
      const info: GlobalNikRecordInfo = { id: m.id, nama, lokasi, subKategori: subKat }
      return { ...info, message: formatDuplicateMessage(info) }
    }

    // Also try checking identity_code column if migrated
    try {
      let idCodeQuery = supabase
        .from('penerima_manfaat_bnba')
        .select('id, identity_code, nama_lengkap, kelompok_id, posisi, sub_kategori')
        .eq('identity_code', cleanNik)
      if (currentRecordId) idCodeQuery = idCodeQuery.neq('id', currentRecordId)
      const { data: idRows } = await idCodeQuery.limit(1)
      if (idRows && idRows.length > 0) {
        const m: any = idRows[0]
        const lokasi = kpmNameMap.get(m.kelompok_id) || 'Posyandu Terdaftar'
        const nama = (m.nama_lengkap || 'Penerima').toUpperCase().trim()
        const subKat = m.sub_kategori || m.posisi || '3B'
        const info: GlobalNikRecordInfo = { id: m.id, nama, lokasi, subKategori: subKat }
        return { ...info, message: formatDuplicateMessage(info) }
      }
    } catch {
      // Ignore if column identity_code hasn't been migrated yet
    }

    // Fallback check on master_penerima_manfaat table if present
    try {
      let masterQuery = supabase
        .from('master_penerima_manfaat')
        .select('id, nama_lengkap, nama, nama_sekolah, sub_kategori')
        .or(`identity_code.eq.${cleanNik},nik.eq.${cleanNik}`)
      if (currentRecordId) masterQuery = masterQuery.neq('id', currentRecordId)
      const { data: masterRows } = await masterQuery.limit(1)
      if (masterRows && masterRows.length > 0) {
        const m: any = masterRows[0]
        const nama = (m.nama_lengkap || m.nama || 'Penerima').toUpperCase().trim()
        const lokasi = m.nama_sekolah || 'Posyandu / Sekolah Terdaftar'
        const subKat = m.sub_kategori || 'Terdaftar'
        const info: GlobalNikRecordInfo = { id: m.id, nama, lokasi, subKategori: subKat }
        return { ...info, message: formatDuplicateMessage(info) }
      }
    } catch {
      // Ignore if master_penerima_manfaat table does not exist
    }
  } catch (err) {
    console.warn('Live duplicate NIK 3B check warning:', err)
  }

  // Fallback to local records
  if (localRecords && localRecords.length > 0) {
    const localMap = buildGlobalNikLookupMap(localRecords, kpmList || [])
    const matches = (localMap.get(cleanNik) || []).filter(m => m.id !== currentRecordId)
    if (matches.length > 0) {
      return { ...matches[0], message: formatDuplicateMessage(matches[0]) }
    }
  }

  return null
}

/**
 * Centralized Pre-Save Validator shared by Manual Input Form & Excel Import Parser.
 */
export function validateBnba3BFull(
  rawRec: NormalizedBnba3B,
  options?: {
    duplicateMatch?: Duplicate3BMatch | null
    internalDuplicateRow?: number | null
    refDate?: Date
  }
): Bnba3BValidationResult {
  const refDate = options?.refDate || new Date()
  const rec: NormalizedBnba3B = {
    ...rawRec,
    nama_lengkap: String(rawRec.nama_lengkap || '').toUpperCase().trim(),
    nama_anak: String(rawRec.nama_anak || '').toUpperCase().trim(),
    nama_ibu: String(rawRec.nama_ibu || '').toUpperCase().trim(),
    identity_code: cleanDigits(rawRec.identity_code),
    identity_code_anak: cleanDigits(rawRec.identity_code_anak),
    identity_code_ibu: cleanDigits(rawRec.identity_code_ibu),
  }

  const errors: string[] = []
  const warnings: string[] = []

  // 1. Common Mandatory Fields
  if (!rec.nama_lengkap) {
    errors.push('Nama lengkap wajib diisi (HURUF KAPITAL)')
  }
  if (!rec.tanggal_lahir) {
    errors.push('Tanggal lahir wajib diisi (DD/MM/YYYY)')
  }
  if (rec.gender !== 'L' && rec.gender !== 'P') {
    errors.push('Gender wajib dipilih (L / P)')
  }

  // 2. NIK Structure & Mismatch Check
  const nikInfo = parseNikStructure3B(rec.identity_code, refDate)
  if (!nikInfo.isFormatValid && nikInfo.error) {
    errors.push(nikInfo.error)
  } else {
    if (nikInfo.warning) warnings.push(nikInfo.warning)
    if (rec.tanggal_lahir && nikInfo.extractedBirthIso && nikInfo.extractedGender) {
      if (rec.tanggal_lahir !== nikInfo.extractedBirthIso || rec.gender !== nikInfo.extractedGender) {
        errors.push(
          `Tanggal lahir / Gender tidak cocok dengan kode NIK (NIK terbaca: ${nikInfo.extractedBirthDisplay} - ${nikInfo.extractedGender})`
        )
      }
    }
  }

  // 3. Duplicate Checks (Internal Excel & Global DB)
  if (options?.internalDuplicateRow) {
    errors.push(`NIK ganda dengan baris ${options.internalDuplicateRow}`)
  }
  if (options?.duplicateMatch) {
    errors.push(options.duplicateMatch.message)
  }

  // 4. Age & Sub-Category Specific Rules
  let recipientAgeIndicator: AgeIndicator | null = null
  let childAgeIndicator: AgeIndicator | null = null
  let hphtIndicator: AgeIndicator | null = null
  let anakNikInfo: Nik3BParsedInfo | undefined
  let ibuNikInfo: Nik3BParsedInfo | undefined

  const recipientMonths = rec.tanggal_lahir ? getCalendarMonthsDiff(rec.tanggal_lahir, refDate) : null

  if (rec.sub_kategori === 'POS - Ibu Hamil') {
    if (rec.gender !== 'P') {
      errors.push('Gender untuk POS - Ibu Hamil wajib Perempuan (P)')
    }

    if (rec.tanggal_lahir) {
      if (recipientMonths === null) {
        errors.push('Format tanggal lahir tidak valid')
      } else if (recipientMonths < 0) {
        errors.push('Tanggal lahir tidak boleh melebihi hari ini')
        recipientAgeIndicator = { months: recipientMonths, text: 'Tanggal lahir masa depan', isValid: false }
      } else if (recipientMonths < 6) {
        errors.push('Belum masuk batas minimal usia 6 bulan')
        recipientAgeIndicator = { months: recipientMonths, text: `Umur: ${recipientMonths} bulan (Min. 6 bulan)`, isValid: false }
      } else {
        const yrs = Math.floor(recipientMonths / 12)
        recipientAgeIndicator = { months: recipientMonths, text: `Umur: ${yrs} tahun (${recipientMonths} bln)`, isValid: true }
      }
    }

    if (!rec.hpht) {
      errors.push('HPHT wajib diisi (DD/MM/YYYY) untuk Ibu Hamil')
      hphtIndicator = { months: null, text: 'HPHT wajib diisi', isValid: false }
    } else {
      const hphtMonths = getCalendarMonthsDiff(rec.hpht, refDate)
      if (hphtMonths === null) {
        errors.push('Format HPHT tidak valid')
        hphtIndicator = { months: null, text: 'Format HPHT tidak valid', isValid: false }
      } else if (hphtMonths < 0) {
        errors.push('HPHT tidak boleh melebihi tanggal hari ini')
        hphtIndicator = { months: hphtMonths, text: 'HPHT tidak boleh tanggal masa depan', isValid: false }
      } else if (hphtMonths > 11) {
        errors.push(`HPHT melebihi batas maksimal 11 bulan ke belakang (${hphtMonths} bulan)`)
        hphtIndicator = { months: hphtMonths, text: `HPHT: ${hphtMonths} bln lalu (Maks. 11 bln)`, isValid: false }
      } else {
        hphtIndicator = { months: hphtMonths, text: `HPHT: ${hphtMonths} bln lalu (Memenuhi syarat ≤ 11 bln)`, isValid: true }
      }
    }
  } else if (rec.sub_kategori === 'POS - Ibu Menyusui') {
    if (rec.gender !== 'P') {
      errors.push('Gender untuk POS - Ibu Menyusui wajib Perempuan (P)')
    }

    if (rec.tanggal_lahir) {
      if (recipientMonths === null) {
        errors.push('Format tanggal lahir tidak valid')
      } else if (recipientMonths < 0) {
        errors.push('Tanggal lahir tidak boleh melebihi hari ini')
        recipientAgeIndicator = { months: recipientMonths, text: 'Tanggal lahir masa depan', isValid: false }
      } else if (recipientMonths < 6) {
        errors.push('Belum masuk batas minimal usia 6 bulan')
        recipientAgeIndicator = { months: recipientMonths, text: `Umur: ${recipientMonths} bulan (Min. 6 bulan)`, isValid: false }
      } else {
        const yrs = Math.floor(recipientMonths / 12)
        recipientAgeIndicator = { months: recipientMonths, text: `Umur: ${yrs} tahun (${recipientMonths} bln)`, isValid: true }
      }
    }

    if (!rec.nama_anak) {
      errors.push('Nama anak wajib diisi untuk Ibu Menyusui')
    }
    if (!rec.type_identity_anak) {
      errors.push('type_identity_anak wajib diisi (nik)')
    }

    anakNikInfo = parseNikStructure3B(rec.identity_code_anak, refDate)
    if (!anakNikInfo.isFormatValid) {
      errors.push(`NIK Anak: ${anakNikInfo.error}`)
    } else {
      if (anakNikInfo.warning) warnings.push(`NIK Anak: ${anakNikInfo.warning}`)
      if (rec.tanggal_lahir_anak && anakNikInfo.extractedBirthIso && rec.tanggal_lahir_anak !== anakNikInfo.extractedBirthIso) {
        errors.push(
          `Tanggal lahir anak tidak cocok dengan kode NIK anak (NIK terbaca: ${anakNikInfo.extractedBirthDisplay} - ${anakNikInfo.extractedGender})`
        )
      }
    }

    if (!rec.tanggal_lahir_anak) {
      errors.push('Tanggal lahir anak wajib diisi untuk Ibu Menyusui')
      childAgeIndicator = { months: null, text: 'Tanggal lahir anak wajib diisi', isValid: false }
    } else {
      const childMonths = getCalendarMonthsDiff(rec.tanggal_lahir_anak, refDate)
      if (childMonths === null) {
        errors.push('Format tanggal lahir anak tidak valid')
        childAgeIndicator = { months: null, text: 'Format tanggal lahir anak tidak valid', isValid: false }
      } else if (childMonths < 0) {
        errors.push('Tanggal lahir anak tidak boleh melebihi hari ini')
        childAgeIndicator = { months: childMonths, text: 'Tanggal lahir anak masa depan', isValid: false }
      } else if (childMonths < 6) {
        errors.push(`Usia anak belum masuk batas minimal 6 bulan (saat ini ${childMonths} bulan)`)
        childAgeIndicator = { months: childMonths, text: `Umur anak: ${childMonths} bln (Min. 6 bln)`, isValid: false }
      } else if (childMonths > 24) {
        errors.push(`Usia anak melebihi batas maksimal 24 bulan / 2 tahun (saat ini ${childMonths} bulan)`)
        childAgeIndicator = { months: childMonths, text: `Umur anak: ${childMonths} bln (> maks 24 bln)`, isValid: false }
      } else {
        childAgeIndicator = { months: childMonths, text: `Umur anak: ${childMonths} bulan (Memenuhi syarat 6–24 bln)`, isValid: true }
      }
    }
  } else if (rec.sub_kategori === 'POS - Balita') {
    if (rec.tanggal_lahir) {
      if (recipientMonths === null) {
        errors.push('Format tanggal lahir tidak valid')
        recipientAgeIndicator = { months: null, text: 'Format tanggal lahir tidak valid', isValid: false }
      } else if (recipientMonths < 0) {
        errors.push('Tanggal lahir tidak boleh melebihi hari ini')
        recipientAgeIndicator = { months: recipientMonths, text: 'Tanggal lahir masa depan', isValid: false }
      } else if (recipientMonths < 6) {
        errors.push('Belum masuk batas minimal usia 6 bulan')
        recipientAgeIndicator = { months: recipientMonths, text: `Umur: ${recipientMonths} bulan (< min 6 bln)`, isValid: false }
      } else if (recipientMonths >= 60) {
        errors.push(`Usia melebihi batas maksimal Balita (59 bulan) (saat ini ${recipientMonths} bulan)`)
        recipientAgeIndicator = { months: recipientMonths, text: `Umur: ${recipientMonths} bln (> maks 59 bln)`, isValid: false }
      } else {
        recipientAgeIndicator = { months: recipientMonths, text: `Umur: ${recipientMonths} bulan (Memenuhi syarat 6–59 bln)`, isValid: true }
      }
    }

    if (!rec.nama_ibu) {
      errors.push('Nama ibu wajib diisi untuk Balita')
    }
    if (!rec.type_identity_ibu) {
      errors.push('type_identity_ibu wajib diisi (nik)')
    }
    ibuNikInfo = parseNikStructure3B(rec.identity_code_ibu, refDate)
    if (!ibuNikInfo.isFormatValid) {
      errors.push(`NIK Ibu: ${ibuNikInfo.error}`)
    } else if (ibuNikInfo.warning) {
      warnings.push(`NIK Ibu: ${ibuNikInfo.warning}`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    nikInfo,
    anakNikInfo,
    ibuNikInfo,
    recipientAgeIndicator,
    childAgeIndicator,
    hphtIndicator,
  }
}
