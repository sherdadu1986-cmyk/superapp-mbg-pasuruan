import ExcelJS from 'exceljs'
import * as XLSX from 'xlsx'
import type { PenerimaManfaatBnba } from './data-helpers'

export const BNBA_3B_HEADERS = [
  'nama_lengkap',
  'tanggal_lahir',
  'gender',
  'type',
  'identity_code',
  'kategori',
  'sub_kategori',
  'hpht',
  'nama_anak',
  'type_identity_anak',
  'identity_code_anak',
  'tanggal_lahir_anak',
  'nama_ibu',
  'type_identity_ibu',
  'identity_code_ibu',
] as const

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

export interface Bnba3BValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface Parsed3BImportRow {
  item: PenerimaManfaatBnba
  normalized: NormalizedBnba3B
  validation: Bnba3BValidationResult
  rowNumber: number
}

export interface Parsed3BImportResult {
  rows: Parsed3BImportRow[]
  totalRows: number
  validCount: number
  invalidCount: number
  skippedExampleCount: number
}

const META_PREFIX = '__3B__:'

export function normalizeSubKategori3B(val?: string | null): SubKategori3B {
  const s = String(val || '').trim().toLowerCase()
  if (s.includes('hamil') || s.includes('bumil')) return 'POS - Ibu Hamil'
  if (s.includes('menyusui') || s.includes('busui')) return 'POS - Ibu Menyusui'
  return 'POS - Balita'
}

export function subKategoriToPosisi(subKat: SubKategori3B): 'Bumil' | 'Busui' | 'Balita' {
  if (subKat === 'POS - Ibu Hamil') return 'Bumil'
  if (subKat === 'POS - Ibu Menyusui') return 'Busui'
  return 'Balita'
}

export function cleanNikString(val: unknown): string {
  if (val === null || val === undefined) return ''
  return String(val).replace(/[^0-9]/g, '').trim()
}

export function parseGender3B(val: unknown): 'L' | 'P' {
  const s = String(val || '').trim().toUpperCase()
  if (s === 'P' || s.startsWith('PEREMPUAN') || s.startsWith('WANITA') || s === 'F') return 'P'
  return 'L'
}

/**
 * Parse DD/MM/YYYY, YYYY-MM-DD, Date, or Excel serial number to ISO YYYY-MM-DD.
 */
export function parse3BDateToIso(val: unknown): string {
  if (val === null || val === undefined || val === '') return ''

  if (val instanceof Date && !isNaN(val.getTime())) {
    const yyyy = val.getFullYear()
    const mm = String(val.getMonth() + 1).padStart(2, '0')
    const dd = String(val.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  if (typeof val === 'number' && !isNaN(val)) {
    // Excel serial number (epoch 1899-12-30)
    const utcDays = Math.floor(val - 25569)
    const d = new Date(utcDays * 86400 * 1000)
    if (!isNaN(d.getTime())) {
      const yyyy = d.getUTCFullYear()
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
      const dd = String(d.getUTCDate()).padStart(2, '0')
      return `${yyyy}-${mm}-${dd}`
    }
    return ''
  }

  const str = String(val).trim()
  if (!str || str === '-' || str === '—') return ''

  // ISO YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/)
  if (isoMatch) {
    const yyyy = isoMatch[1]
    const mm = String(parseInt(isoMatch[2], 10)).padStart(2, '0')
    const dd = String(parseInt(isoMatch[3], 10)).padStart(2, '0')
    if (isValidCalendarDate(Number(yyyy), Number(mm), Number(dd))) {
      return `${yyyy}-${mm}-${dd}`
    }
    return ''
  }

  // Indonesian DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (dmyMatch) {
    let day = parseInt(dmyMatch[1], 10)
    let month = parseInt(dmyMatch[2], 10)
    const year = parseInt(dmyMatch[3], 10)
    if (month > 12 && day <= 12) {
      // Fallback if MM/DD/YYYY was entered
      const tmp = day
      day = month
      month = tmp
    }
    if (isValidCalendarDate(year, month, day)) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }
    return ''
  }

  // Short DD/MM/YY
  const shortMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/)
  if (shortMatch) {
    let day = parseInt(shortMatch[1], 10)
    let month = parseInt(shortMatch[2], 10)
    const yy = parseInt(shortMatch[3], 10)
    const year = yy <= 35 ? 2000 + yy : 1900 + yy
    if (month > 12 && day <= 12) {
      const tmp = day
      day = month
      month = tmp
    }
    if (isValidCalendarDate(year, month, day)) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }
    return ''
  }

  const parsed = new Date(str)
  if (!isNaN(parsed.getTime())) {
    const yyyy = parsed.getFullYear()
    const mm = String(parsed.getMonth() + 1).padStart(2, '0')
    const dd = String(parsed.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  return ''
}

function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) return false
  const d = new Date(year, month - 1, day)
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day
}

export function formatIsoToDDMMYYYY(dateStr?: string | null): string {
  if (!dateStr || dateStr === '-' || dateStr === '—') return '—'
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr
  const iso = parse3BDateToIso(dateStr)
  if (!iso) return dateStr
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

/**
 * Exact completed calendar months from an ISO YYYY-MM-DD date to reference date.
 * Returns negative if fromIso is in the future.
 */
export function getMonthsDiff(fromIso: string, refDate: Date = new Date()): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fromIso)) return null
  const [fy, fm, fd] = fromIso.split('-').map(Number)
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
 * Check if `fromIso` is strictly older than `maxMonths` calendar months relative to `refDate`.
 */
function isOlderThanMonths(fromIso: string, maxMonths: number, refDate: Date = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fromIso)) return false
  const [fy, fm, fd] = fromIso.split('-').map(Number)
  const fromDate = new Date(fy, fm - 1, fd)
  const minAllowed = new Date(refDate.getFullYear(), refDate.getMonth() - maxMonths, refDate.getDate())
  return fromDate.getTime() < minAllowed.getTime()
}

export function validate3BRecord(rec: NormalizedBnba3B, refDate: Date = new Date()): Bnba3BValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Common mandatory fields
  if (!rec.nama_lengkap.trim()) {
    errors.push('nama_lengkap wajib diisi')
  }
  if (!rec.tanggal_lahir) {
    errors.push('tanggal_lahir wajib diisi (DD/MM/YYYY)')
  }
  if (rec.gender !== 'L' && rec.gender !== 'P') {
    errors.push('gender harus L atau P')
  }
  if (!/^\d{16}$/.test(rec.identity_code)) {
    errors.push(`identity_code harus 16 digit NIK (terbaca ${rec.identity_code.length} digit)`)
  }

  // Minimum recipient age: 6 months
  if (rec.tanggal_lahir) {
    const recipientMonths = getMonthsDiff(rec.tanggal_lahir, refDate)
    if (recipientMonths === null) {
      errors.push('Format tanggal_lahir tidak valid')
    } else if (recipientMonths < 0) {
      errors.push('tanggal_lahir tidak boleh melebihi hari ini')
    } else if (recipientMonths < 6) {
      errors.push(`Usia penerima minimal 6 bulan (saat ini ${recipientMonths} bulan)`)
    }
  }

  if (rec.sub_kategori === 'POS - Ibu Hamil') {
    if (!rec.hpht) {
      errors.push('hpht wajib diisi untuk Ibu Hamil')
    } else {
      const hphtMonths = getMonthsDiff(rec.hpht, refDate)
      if (hphtMonths === null) {
        errors.push('Format hpht tidak valid')
      } else if (hphtMonths < 0) {
        errors.push('hpht tidak boleh melebihi hari ini')
      } else if (hphtMonths > 11) {
        errors.push(`hpht maksimal 11 bulan ke belakang (${hphtMonths} bulan)`)
      }
    }
    if (rec.gender === 'L') {
      warnings.push('Gender Ibu Hamil umumnya Perempuan (P)')
    }
  } else if (rec.sub_kategori === 'POS - Ibu Menyusui') {
    if (!rec.nama_anak.trim()) {
      errors.push('nama_anak wajib diisi untuk Ibu Menyusui')
    }
    if (!/^\d{16}$/.test(rec.identity_code_anak)) {
      errors.push(`identity_code_anak harus 16 digit NIK (${rec.identity_code_anak.length} digit)`)
    }
    if (!rec.tanggal_lahir_anak) {
      errors.push('tanggal_lahir_anak wajib diisi untuk Ibu Menyusui')
    } else {
      const childMonths = getMonthsDiff(rec.tanggal_lahir_anak, refDate)
      if (childMonths === null) {
        errors.push('Format tanggal_lahir_anak tidak valid')
      } else if (childMonths < 0) {
        errors.push('tanggal_lahir_anak tidak boleh melebihi hari ini')
      } else if (childMonths < 6) {
        errors.push(`Usia anak Busui minimal 6 bulan (saat ini ${childMonths} bulan)`)
      } else if (childMonths > 24) {
        errors.push(`Usia anak Busui maksimal 24 bulan / 2 tahun (saat ini ${childMonths} bulan)`)
      }
    }
    if (rec.gender === 'L') {
      warnings.push('Gender Ibu Menyusui umumnya Perempuan (P)')
    }
  } else if (rec.sub_kategori === 'POS - Balita') {
    if (!rec.nama_ibu.trim()) {
      errors.push('nama_ibu wajib diisi untuk Balita')
    }
    if (!/^\d{16}$/.test(rec.identity_code_ibu)) {
      errors.push(`identity_code_ibu harus 16 digit NIK (${rec.identity_code_ibu.length} digit)`)
    }
    if (rec.tanggal_lahir) {
      const balitaMonths = getMonthsDiff(rec.tanggal_lahir, refDate)
      if (balitaMonths !== null && balitaMonths >= 0) {
        if (balitaMonths < 6) {
          // Already covered above, avoid duplicating
        } else if (balitaMonths > 59) {
          errors.push(`Usia Balita maksimal 59 bulan (saat ini ${balitaMonths} bulan)`)
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Extract 15-column 3B fields from a PenerimaManfaatBnba row, supporting both
 * dedicated DB columns and fallback `__3B__:` JSON packed in `kelas`.
 */
export function normalizeBnba3BFields(row: Partial<PenerimaManfaatBnba>): NormalizedBnba3B {
  let embedded: Record<string, any> = {}
  if (typeof row.kelas === 'string' && row.kelas.startsWith(META_PREFIX)) {
    try {
      embedded = JSON.parse(row.kelas.slice(META_PREFIX.length)) || {}
    } catch {
      embedded = {}
    }
  }

  const subKategori = normalizeSubKategori3B(
    row.sub_kategori || embedded.sub_kategori || row.posisi
  )
  const gender = parseGender3B(row.gender || embedded.gender || row.jenis_kelamin || row.jk)
  const identityCode = cleanNikString(
    row.identity_code || embedded.identity_code || row.nisn_nik || row.nik || ''
  )
  const namaLengkap = String(
    row.nama_lengkap || row.nama_penerima || row.nama || ''
  ).toUpperCase().trim()

  const fallbackOrtu = row.nama_ortu && row.nama_ortu !== '-' ? String(row.nama_ortu).toUpperCase().trim() : ''

  return {
    nama_lengkap: namaLengkap,
    tanggal_lahir: parse3BDateToIso(row.tanggal_lahir),
    gender,
    type: String(row.type || embedded.type || 'nik').toLowerCase(),
    identity_code: identityCode,
    kategori: String(row.kategori || embedded.kategori || 'POS').toUpperCase(),
    sub_kategori: subKategori,
    hpht: subKategori === 'POS - Ibu Hamil'
      ? parse3BDateToIso(row.hpht ?? embedded.hpht)
      : '',
    nama_anak: subKategori === 'POS - Ibu Menyusui'
      ? String(row.nama_anak ?? embedded.nama_anak ?? fallbackOrtu ?? '').toUpperCase().trim()
      : '',
    type_identity_anak: subKategori === 'POS - Ibu Menyusui'
      ? String(row.type_identity_anak ?? embedded.type_identity_anak ?? 'nik').toLowerCase()
      : '',
    identity_code_anak: subKategori === 'POS - Ibu Menyusui'
      ? cleanNikString(row.identity_code_anak ?? embedded.identity_code_anak ?? '')
      : '',
    tanggal_lahir_anak: subKategori === 'POS - Ibu Menyusui'
      ? parse3BDateToIso(row.tanggal_lahir_anak ?? embedded.tanggal_lahir_anak)
      : '',
    nama_ibu: subKategori === 'POS - Balita'
      ? String(row.nama_ibu ?? embedded.nama_ibu ?? fallbackOrtu ?? '').toUpperCase().trim()
      : '',
    type_identity_ibu: subKategori === 'POS - Balita'
      ? String(row.type_identity_ibu ?? embedded.type_identity_ibu ?? 'nik').toLowerCase()
      : '',
    identity_code_ibu: subKategori === 'POS - Balita'
      ? cleanNikString(row.identity_code_ibu ?? embedded.identity_code_ibu ?? '')
      : '',
  }
}

export function buildBnba3BPayloads(kelompokId: string, rec: NormalizedBnba3B) {
  const posisi = subKategoriToPosisi(rec.sub_kategori)
  const namaOrtuMirror =
    rec.sub_kategori === 'POS - Balita'
      ? (rec.nama_ibu || '-')
      : rec.sub_kategori === 'POS - Ibu Menyusui'
      ? (rec.nama_anak || '-')
      : '-'

  const fullPayload = {
    kelompok_id: kelompokId,
    nisn_nik: rec.identity_code,
    nama_lengkap: rec.nama_lengkap.toUpperCase().trim(),
    tanggal_lahir: rec.tanggal_lahir || '2020-01-01',
    jenis_kelamin: rec.gender,
    nama_ortu: namaOrtuMirror,
    posisi,
    kelas: '-',
    gender: rec.gender,
    type: rec.type || 'nik',
    identity_code: rec.identity_code,
    kategori: 'POS',
    sub_kategori: rec.sub_kategori,
    hpht: rec.sub_kategori === 'POS - Ibu Hamil' && rec.hpht ? rec.hpht : null,
    nama_anak: rec.sub_kategori === 'POS - Ibu Menyusui' && rec.nama_anak ? rec.nama_anak.toUpperCase().trim() : null,
    type_identity_anak: rec.sub_kategori === 'POS - Ibu Menyusui' ? (rec.type_identity_anak || 'nik') : null,
    identity_code_anak: rec.sub_kategori === 'POS - Ibu Menyusui' && rec.identity_code_anak ? rec.identity_code_anak : null,
    tanggal_lahir_anak: rec.sub_kategori === 'POS - Ibu Menyusui' && rec.tanggal_lahir_anak ? rec.tanggal_lahir_anak : null,
    nama_ibu: rec.sub_kategori === 'POS - Balita' && rec.nama_ibu ? rec.nama_ibu.toUpperCase().trim() : null,
    type_identity_ibu: rec.sub_kategori === 'POS - Balita' ? (rec.type_identity_ibu || 'nik') : null,
    identity_code_ibu: rec.sub_kategori === 'POS - Balita' && rec.identity_code_ibu ? rec.identity_code_ibu : null,
  }

  const metaCompact: Record<string, string> = {
    sub_kategori: rec.sub_kategori,
    kategori: 'POS',
    type: rec.type || 'nik',
  }
  if (rec.sub_kategori === 'POS - Ibu Hamil' && rec.hpht) {
    metaCompact.hpht = rec.hpht
  } else if (rec.sub_kategori === 'POS - Ibu Menyusui') {
    if (rec.nama_anak) metaCompact.nama_anak = rec.nama_anak.toUpperCase().trim()
    if (rec.type_identity_anak) metaCompact.type_identity_anak = rec.type_identity_anak
    if (rec.identity_code_anak) metaCompact.identity_code_anak = rec.identity_code_anak
    if (rec.tanggal_lahir_anak) metaCompact.tanggal_lahir_anak = rec.tanggal_lahir_anak
  } else if (rec.sub_kategori === 'POS - Balita') {
    if (rec.nama_ibu) metaCompact.nama_ibu = rec.nama_ibu.toUpperCase().trim()
    if (rec.type_identity_ibu) metaCompact.type_identity_ibu = rec.type_identity_ibu
    if (rec.identity_code_ibu) metaCompact.identity_code_ibu = rec.identity_code_ibu
  }

  const fallbackPayload = {
    kelompok_id: kelompokId,
    nisn_nik: rec.identity_code,
    nama_lengkap: rec.nama_lengkap.toUpperCase().trim(),
    tanggal_lahir: rec.tanggal_lahir || '2020-01-01',
    jenis_kelamin: rec.gender,
    nama_ortu: namaOrtuMirror,
    posisi,
    kelas: `${META_PREFIX}${JSON.stringify(metaCompact)}`,
  }

  return { fullPayload, fallbackPayload }
}

function formatMonthsAgoDDMMYYYY(monthsAgo: number): string {
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, Math.min(now.getDate(), 28))
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

const TEMPLATE_EXAMPLE_NAMES = new Set(['SITI AMINAH', 'DEWI LESTARI', 'AHMAD ZAINUDDIN'])
const TEMPLATE_EXAMPLE_NIKS = new Set(['3514015506950001', '3514016003970002', '3514011205240004'])

/**
 * Generate & download official 15-column `Template_BNBA_3B.xlsx` using ExcelJS.
 */
export async function downloadTemplateBnba3B(groupName?: string) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'SPPG Pasuruan BGN'
  wb.created = new Date()

  const ws = wb.addWorksheet('Template BNBA 3B', {
    views: [{ state: 'frozen', xSplit: 1, ySplit: 2 }],
  })

  const colWidths = [26, 16, 10, 10, 20, 12, 22, 16, 24, 18, 20, 18, 24, 18, 20]
  ws.columns = BNBA_3B_HEADERS.map((h, i) => ({
    header: h,
    key: h,
    width: colWidths[i] || 18,
  }))

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  }

  // Row 1: Dark Blue #1e3a8a Header with white bold text
  const headerRow = ws.getRow(1)
  headerRow.height = 26
  BNBA_3B_HEADERS.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1)
    cell.value = h
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' },
    }
    cell.font = {
      name: 'Calibri',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = thinBorder
  })

  // Row 2: Yellow #fef08a Instruction Row with small black wrap-text
  const instructionTexts = [
    'WAJIB HURUF KAPITAL sesuai KTP/KK',
    'Format DD/MM/YYYY. Usia penerima min. 6 bln (Balita maks. 59 bln)',
    'L atau P',
    'Default: nik',
    'WAJIB 16 digit NIK resmi',
    'Default: POS',
    'Pilih: POS - Ibu Hamil / POS - Ibu Menyusui / POS - Balita',
    'WAJIB Ibu Hamil (DD/MM/YYYY). Maks. 11 bln ke belakang, tidak melebihi hari ini',
    'WAJIB Ibu Menyusui (HURUF KAPITAL)',
    'Default: nik (Ibu Menyusui)',
    'WAJIB 16 digit NIK anak (Ibu Menyusui)',
    'WAJIB Ibu Menyusui (DD/MM/YYYY). Usia anak min. 6 bln & maks. 2 tahun (24 bln)',
    'WAJIB Balita (HURUF KAPITAL)',
    'Default: nik (Balita)',
    'WAJIB 16 digit NIK ibu (Balita)',
  ]

  const instrRow = ws.getRow(2)
  instrRow.height = 48
  instructionTexts.forEach((txt, idx) => {
    const cell = instrRow.getCell(idx + 1)
    cell.value = txt
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFEF08A' },
    }
    cell.font = {
      name: 'Calibri',
      size: 9,
      bold: false,
      color: { argb: 'FF0F172A' },
    }
    cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true }
    cell.border = thinBorder
  })

  // Rows 3, 4, 5: Examples with #e2e8f0 gray inactive cells
  const exampleRows: Array<{ values: string[]; grayCols: number[] }> = [
    {
      // Baris 3: POS - Ibu Hamil (Cols I-O = 9..15 gray)
      values: [
        'SITI AMINAH',
        '15/06/1995',
        'P',
        'nik',
        '3514015506950001',
        'POS',
        'POS - Ibu Hamil',
        formatMonthsAgoDDMMYYYY(4),
        '', '', '', '', '', '', '',
      ],
      grayCols: [9, 10, 11, 12, 13, 14, 15],
    },
    {
      // Baris 4: POS - Ibu Menyusui (Col H = 8, Cols M-O = 13..15 gray)
      values: [
        'DEWI LESTARI',
        '20/03/1997',
        'P',
        'nik',
        '3514016003970002',
        'POS',
        'POS - Ibu Menyusui',
        '',
        'MUHAMMAD RAYYAN',
        'nik',
        '3514011001250003',
        formatMonthsAgoDDMMYYYY(10),
        '', '', '',
      ],
      grayCols: [8, 13, 14, 15],
    },
    {
      // Baris 5: POS - Balita (Cols H-L = 8..12 gray)
      values: [
        'AHMAD ZAINUDDIN',
        formatMonthsAgoDDMMYYYY(24),
        'L',
        'nik',
        '3514011205240004',
        'POS',
        'POS - Balita',
        '', '', '', '', '',
        'NURUL HIDAYAH',
        'nik',
        '3514014809940005',
      ],
      grayCols: [8, 9, 10, 11, 12],
    },
  ]

  exampleRows.forEach((ex, rowOffset) => {
    const r = ws.getRow(3 + rowOffset)
    r.height = 22
    const graySet = new Set(ex.grayCols)
    ex.values.forEach((val, colIdx) => {
      const colNum = colIdx + 1
      const cell = r.getCell(colNum)
      cell.value = val
      cell.numFmt = '@'
      cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF0F172A' } }
      cell.alignment = { vertical: 'middle', horizontal: colNum === 3 || colNum === 4 || colNum === 6 ? 'center' : 'left' }
      cell.border = thinBorder
      if (graySet.has(colNum)) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE2E8F0' },
        }
      }
    })
  })

  // Apply text format '@' on NIK & date columns for rows 3..500 so Excel preserves leading zeros & DD/MM/YYYY
  for (let rowIdx = 3; rowIdx <= 500; rowIdx++) {
    const row = ws.getRow(rowIdx)
    ;[2, 5, 8, 11, 12, 15].forEach(c => {
      row.getCell(c).numFmt = '@'
    })

    // Data Validations
    row.getCell(3).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"L,P"'],
    }
    row.getCell(4).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"nik"'],
    }
    row.getCell(6).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"POS"'],
    }
    row.getCell(7).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"POS - Ibu Hamil,POS - Ibu Menyusui,POS - Balita"'],
    }
    row.getCell(10).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"nik"'],
    }
    row.getCell(14).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"nik"'],
    }
  }

  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  const suffix = groupName ? `_${groupName.replace(/[^a-zA-Z0-9_-]/g, '_')}` : ''
  link.download = suffix ? `Template_BNBA_3B${suffix}.xlsx` : 'Template_BNBA_3B.xlsx'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

/**
 * Export 3B BNBA records to Excel using the exact 15-column template format.
 */
export async function exportBnba3BExcel(records: PenerimaManfaatBnba[], groupName: string) {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('BNBA 3B', {
    views: [{ state: 'frozen', xSplit: 1, ySplit: 1 }],
  })

  const colWidths = [26, 16, 10, 10, 20, 12, 22, 16, 24, 18, 20, 18, 24, 18, 20]
  ws.columns = BNBA_3B_HEADERS.map((h, i) => ({
    header: h,
    key: h,
    width: colWidths[i] || 18,
  }))

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  }

  const headerRow = ws.getRow(1)
  headerRow.height = 24
  BNBA_3B_HEADERS.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1)
    cell.value = h
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } }
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = thinBorder
  })

  records.forEach((rec, idx) => {
    const n = normalizeBnba3BFields(rec)
    const row = ws.getRow(idx + 2)
    row.height = 20

    const graySet = new Set<number>(
      n.sub_kategori === 'POS - Ibu Hamil'
        ? [9, 10, 11, 12, 13, 14, 15]
        : n.sub_kategori === 'POS - Ibu Menyusui'
        ? [8, 13, 14, 15]
        : [8, 9, 10, 11, 12]
    )

    const values = [
      n.nama_lengkap,
      n.tanggal_lahir ? formatIsoToDDMMYYYY(n.tanggal_lahir) : '',
      n.gender,
      n.type,
      n.identity_code,
      n.kategori,
      n.sub_kategori,
      n.hpht ? formatIsoToDDMMYYYY(n.hpht) : '',
      n.nama_anak,
      n.type_identity_anak,
      n.identity_code_anak,
      n.tanggal_lahir_anak ? formatIsoToDDMMYYYY(n.tanggal_lahir_anak) : '',
      n.nama_ibu,
      n.type_identity_ibu,
      n.identity_code_ibu,
    ]

    values.forEach((v, cIdx) => {
      const colNum = cIdx + 1
      const cell = row.getCell(colNum)
      const isGray = graySet.has(colNum)
      cell.value = isGray ? '' : v
      cell.numFmt = '@'
      cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF0F172A' } }
      cell.border = thinBorder
      if (isGray) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } }
      }
    })
  })

  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  const cleanGroup = groupName.replace(/[^a-zA-Z0-9_-]/g, '_')
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  link.download = `BNBA_3B_${cleanGroup}_${dateStr}.xlsx`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

/**
 * Parse uploaded 15-column 3B Excel/CSV file, skipping header (row 1),
 * yellow instruction row (row 2), and unchanged template example rows.
 */
export async function parse3BExcelFile(
  file: File,
  selectedKelompokId: string
): Promise<Parsed3BImportResult> {
  const arrayBuffer = await file.arrayBuffer()
  const wb = XLSX.read(arrayBuffer, { type: 'array', cellDates: false })
  const wsName = wb.SheetNames[0]
  const sheet = wb.Sheets[wsName]

  const rowsArray: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: true,
    defval: '',
  })

  if (!rowsArray || rowsArray.length === 0) {
    return { rows: [], totalRows: 0, validCount: 0, invalidCount: 0, skippedExampleCount: 0 }
  }

  // Locate header row (normally row index 0)
  let headerIdx = 0
  for (let i = 0; i < Math.min(5, rowsArray.length); i++) {
    const joined = (rowsArray[i] || []).map(c => String(c || '').toLowerCase()).join(' ')
    if (joined.includes('nama_lengkap') || joined.includes('identity_code') || joined.includes('sub_kategori')) {
      headerIdx = i
      break
    }
  }

  const headerRow = (rowsArray[headerIdx] || []).map(c => String(c || '').trim().toLowerCase())
  const colIndex = (name: string, fallbackIdx: number): number => {
    const found = headerRow.findIndex(h => h === name || h.replace(/\s+/g, '_') === name)
    return found >= 0 ? found : fallbackIdx
  }

  const idxNama = colIndex('nama_lengkap', 0)
  const idxTgl = colIndex('tanggal_lahir', 1)
  const idxGender = colIndex('gender', 2)
  const idxType = colIndex('type', 3)
  const idxNik = colIndex('identity_code', 4)
  const idxKategori = colIndex('kategori', 5)
  const idxSubKat = colIndex('sub_kategori', 6)
  const idxHpht = colIndex('hpht', 7)
  const idxNamaAnak = colIndex('nama_anak', 8)
  const idxTypeAnak = colIndex('type_identity_anak', 9)
  const idxNikAnak = colIndex('identity_code_anak', 10)
  const idxTglAnak = colIndex('tanggal_lahir_anak', 11)
  const idxNamaIbu = colIndex('nama_ibu', 12)
  const idxTypeIbu = colIndex('type_identity_ibu', 13)
  const idxNikIbu = colIndex('identity_code_ibu', 14)

  const parsedRows: Parsed3BImportRow[] = []
  let skippedExampleCount = 0

  for (let r = headerIdx + 1; r < rowsArray.length; r++) {
    const row = rowsArray[r] || []
    const hasAnyValue = row.some(cell => String(cell ?? '').trim() !== '')
    if (!hasAnyValue) continue

    const firstCell = String(row[idxNama] ?? '').trim().toUpperCase()
    const secondCell = String(row[idxTgl] ?? '').trim().toUpperCase()

    // Skip yellow instruction row (row 2)
    if (
      firstCell.includes('WAJIB HURUF KAPITAL') ||
      secondCell.includes('FORMAT DD/MM/YYYY') ||
      String(row[idxNik] ?? '').toUpperCase().includes('WAJIB 16 DIGIT')
    ) {
      continue
    }

    const identityCode = cleanNikString(row[idxNik])

    // Skip unchanged template example rows (rows 3, 4, 5)
    if (TEMPLATE_EXAMPLE_NAMES.has(firstCell) && TEMPLATE_EXAMPLE_NIKS.has(identityCode)) {
      skippedExampleCount++
      continue
    }

    const subKategori = normalizeSubKategori3B(String(row[idxSubKat] ?? ''))
    const gender = parseGender3B(row[idxGender])
    const tanggalLahir = parse3BDateToIso(row[idxTgl])

    const normalized: NormalizedBnba3B = {
      nama_lengkap: firstCell,
      tanggal_lahir: tanggalLahir,
      gender,
      type: String(row[idxType] || 'nik').trim().toLowerCase() || 'nik',
      identity_code: identityCode,
      kategori: String(row[idxKategori] || 'POS').trim().toUpperCase() || 'POS',
      sub_kategori: subKategori,
      hpht: subKategori === 'POS - Ibu Hamil' ? parse3BDateToIso(row[idxHpht]) : '',
      nama_anak: subKategori === 'POS - Ibu Menyusui' ? String(row[idxNamaAnak] ?? '').toUpperCase().trim() : '',
      type_identity_anak: subKategori === 'POS - Ibu Menyusui' ? (String(row[idxTypeAnak] || 'nik').trim().toLowerCase() || 'nik') : '',
      identity_code_anak: subKategori === 'POS - Ibu Menyusui' ? cleanNikString(row[idxNikAnak]) : '',
      tanggal_lahir_anak: subKategori === 'POS - Ibu Menyusui' ? parse3BDateToIso(row[idxTglAnak]) : '',
      nama_ibu: subKategori === 'POS - Balita' ? String(row[idxNamaIbu] ?? '').toUpperCase().trim() : '',
      type_identity_ibu: subKategori === 'POS - Balita' ? (String(row[idxTypeIbu] || 'nik').trim().toLowerCase() || 'nik') : '',
      identity_code_ibu: subKategori === 'POS - Balita' ? cleanNikString(row[idxNikIbu]) : '',
    }

    const validation = validate3BRecord(normalized)
    const { fullPayload } = buildBnba3BPayloads(selectedKelompokId, normalized)

    const item: PenerimaManfaatBnba = {
      id: `bnba-3b-${Date.now()}-${r}`,
      ...fullPayload,
      created_at: new Date().toISOString(),
    }

    parsedRows.push({
      item,
      normalized,
      validation,
      rowNumber: r + 1,
    })
  }

  const validCount = parsedRows.filter(p => p.validation.isValid).length
  return {
    rows: parsedRows,
    totalRows: parsedRows.length,
    validCount,
    invalidCount: parsedRows.length - validCount,
    skippedExampleCount,
  }
}
