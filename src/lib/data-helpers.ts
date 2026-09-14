import { supabase } from './supabase'

// ─── Type Definitions ───────────────────────────────────────

export type Jenjang = 'KB_PAUD' | 'TK_RA' | 'SD_MI' | 'SMP_MTS' | 'SMA_SMK_MA'
export type Kategori3B = 'balita' | 'bumil' | 'busui'

export interface LembagaSekolah {
  id: string
  nama_sekolah: string
  jenjang: Jenjang
  alamat: string
  kontak: string
  penanggung_jawab: string
  created_at?: string
}

export interface PenerimaManfaatSiswa {
  id: string
  nama: string
  jenis_kelamin: 'L' | 'P'
  tanggal_lahir: string
  lembaga_id: string
  kelas: string
  status_aktif: boolean
  catatan_alergi: string
  created_at?: string
  // Joined field
  lembaga?: LembagaSekolah
}

export interface PenerimaManfaat3B {
  id: string
  nama: string
  kategori: Kategori3B
  nik: string
  tanggal_lahir: string
  usia_kehamilan: string
  nama_wali_atau_anak: string
  rt_rw: string
  kontak: string
  status_gizi: string
  catatan_alergi: string
  status_aktif: boolean
  created_at?: string
}

export interface DashboardStats {
  totalSiswa: number
  siswaPaud: number
  siswaTk: number
  siswaSd: number
  siswaSmp: number
  siswaSma: number
  totalBalita: number
  totalBumil: number
  totalBusui: number
  total3B: number
  totalPorsiHarian: number
}

// ─── Display Labels ─────────────────────────────────────────

export const JENJANG_LABELS: Record<Jenjang, string> = {
  KB_PAUD: 'KB/PAUD',
  TK_RA: 'TK/RA',
  SD_MI: 'SD/MI',
  SMP_MTS: 'SMP/MTs',
  SMA_SMK_MA: 'SMA/SMK/MA',
}

export const KATEGORI_3B_LABELS: Record<Kategori3B, string> = {
  balita: 'Balita',
  bumil: 'Ibu Hamil (Bumil)',
  busui: 'Ibu Menyusui (Busui)',
}

// ─── LocalStorage Keys ──────────────────────────────────────

const LS_LEMBAGA = 'sppg_lembaga_sekolah'
const LS_SISWA = 'sppg_penerima_siswa'
const LS_3B = 'sppg_penerima_3b'

// ─── UUID Generator (for localStorage fallback) ─────────────

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

// ─── LocalStorage Helpers ───────────────────────────────────

function lsGet<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function lsSet<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(data))
}

// ─── Lembaga Sekolah CRUD ───────────────────────────────────

export async function fetchLembaga(jenjang?: Jenjang): Promise<LembagaSekolah[]> {
  try {
    let query = supabase.from('lembaga_sekolah').select('*').order('nama_sekolah')
    if (jenjang) query = query.eq('jenjang', jenjang)
    const { data, error } = await query
    if (error) throw error
    return data || []
  } catch {
    // Fallback to localStorage
    const all = lsGet<LembagaSekolah>(LS_LEMBAGA)
    return jenjang ? all.filter(l => l.jenjang === jenjang) : all
  }
}

export async function createLembaga(input: Omit<LembagaSekolah, 'id' | 'created_at'>): Promise<LembagaSekolah | null> {
  try {
    const { data, error } = await supabase.from('lembaga_sekolah').insert(input).select().single()
    if (error) throw error
    return data
  } catch {
    const record: LembagaSekolah = { ...input, id: generateId(), created_at: new Date().toISOString() }
    const all = lsGet<LembagaSekolah>(LS_LEMBAGA)
    all.push(record)
    lsSet(LS_LEMBAGA, all)
    return record
  }
}

export async function updateLembaga(id: string, input: Partial<LembagaSekolah>): Promise<LembagaSekolah | null> {
  try {
    const { data, error } = await supabase.from('lembaga_sekolah').update(input).eq('id', id).select().single()
    if (error) throw error
    return data
  } catch {
    const all = lsGet<LembagaSekolah>(LS_LEMBAGA)
    const idx = all.findIndex(l => l.id === id)
    if (idx === -1) return null
    all[idx] = { ...all[idx], ...input }
    lsSet(LS_LEMBAGA, all)
    return all[idx]
  }
}

export async function deleteLembaga(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('lembaga_sekolah').delete().eq('id', id)
    if (error) throw error
    return true
  } catch {
    const all = lsGet<LembagaSekolah>(LS_LEMBAGA)
    lsSet(LS_LEMBAGA, all.filter(l => l.id !== id))
    return true
  }
}

// ─── Penerima Manfaat Siswa CRUD ────────────────────────────

export async function fetchSiswa(lembagaId?: string): Promise<PenerimaManfaatSiswa[]> {
  try {
    let query = supabase.from('penerima_manfaat_siswa').select('*, lembaga:lembaga_sekolah(*)').order('nama')
    if (lembagaId) query = query.eq('lembaga_id', lembagaId)
    const { data, error } = await query
    if (error) throw error
    return data || []
  } catch {
    const all = lsGet<PenerimaManfaatSiswa>(LS_SISWA)
    return lembagaId ? all.filter(s => s.lembaga_id === lembagaId) : all
  }
}

export async function fetchSiswaByJenjang(jenjang: Jenjang): Promise<PenerimaManfaatSiswa[]> {
  try {
    const { data, error } = await supabase
      .from('penerima_manfaat_siswa')
      .select('*, lembaga:lembaga_sekolah!inner(*)')
      .eq('lembaga.jenjang', jenjang)
      .order('nama')
    if (error) throw error
    return data || []
  } catch {
    const lembagaList = lsGet<LembagaSekolah>(LS_LEMBAGA).filter(l => l.jenjang === jenjang)
    const lembagaIds = new Set(lembagaList.map(l => l.id))
    return lsGet<PenerimaManfaatSiswa>(LS_SISWA).filter(s => lembagaIds.has(s.lembaga_id))
  }
}

export async function createSiswa(input: Omit<PenerimaManfaatSiswa, 'id' | 'created_at' | 'lembaga'>): Promise<PenerimaManfaatSiswa | null> {
  try {
    const { data, error } = await supabase.from('penerima_manfaat_siswa').insert(input).select().single()
    if (error) throw error
    return data
  } catch {
    const record = { ...input, id: generateId(), created_at: new Date().toISOString() } as PenerimaManfaatSiswa
    const all = lsGet<PenerimaManfaatSiswa>(LS_SISWA)
    all.push(record)
    lsSet(LS_SISWA, all)
    return record
  }
}

export async function updateSiswa(id: string, input: Partial<PenerimaManfaatSiswa>): Promise<PenerimaManfaatSiswa | null> {
  try {
    const { lembaga: _l, ...cleanInput } = input as PenerimaManfaatSiswa
    const { data, error } = await supabase.from('penerima_manfaat_siswa').update(cleanInput).eq('id', id).select().single()
    if (error) throw error
    return data
  } catch {
    const all = lsGet<PenerimaManfaatSiswa>(LS_SISWA)
    const idx = all.findIndex(s => s.id === id)
    if (idx === -1) return null
    all[idx] = { ...all[idx], ...input }
    lsSet(LS_SISWA, all)
    return all[idx]
  }
}

export async function deleteSiswa(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('penerima_manfaat_siswa').delete().eq('id', id)
    if (error) throw error
    return true
  } catch {
    const all = lsGet<PenerimaManfaatSiswa>(LS_SISWA)
    lsSet(LS_SISWA, all.filter(s => s.id !== id))
    return true
  }
}

// ─── Penerima Manfaat 3B CRUD ───────────────────────────────

export async function fetch3B(kategori?: Kategori3B): Promise<PenerimaManfaat3B[]> {
  try {
    let query = supabase.from('penerima_manfaat_3b').select('*').order('nama')
    if (kategori) query = query.eq('kategori', kategori)
    const { data, error } = await query
    if (error) throw error
    return data || []
  } catch {
    const all = lsGet<PenerimaManfaat3B>(LS_3B)
    return kategori ? all.filter(r => r.kategori === kategori) : all
  }
}

export async function create3B(input: Omit<PenerimaManfaat3B, 'id' | 'created_at'>): Promise<PenerimaManfaat3B | null> {
  try {
    const { data, error } = await supabase.from('penerima_manfaat_3b').insert(input).select().single()
    if (error) throw error
    return data
  } catch {
    const record: PenerimaManfaat3B = { ...input, id: generateId(), created_at: new Date().toISOString() }
    const all = lsGet<PenerimaManfaat3B>(LS_3B)
    all.push(record)
    lsSet(LS_3B, all)
    return record
  }
}

export async function update3B(id: string, input: Partial<PenerimaManfaat3B>): Promise<PenerimaManfaat3B | null> {
  try {
    const { data, error } = await supabase.from('penerima_manfaat_3b').update(input).eq('id', id).select().single()
    if (error) throw error
    return data
  } catch {
    const all = lsGet<PenerimaManfaat3B>(LS_3B)
    const idx = all.findIndex(r => r.id === id)
    if (idx === -1) return null
    all[idx] = { ...all[idx], ...input }
    lsSet(LS_3B, all)
    return all[idx]
  }
}

export async function delete3B(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('penerima_manfaat_3b').delete().eq('id', id)
    if (error) throw error
    return true
  } catch {
    const all = lsGet<PenerimaManfaat3B>(LS_3B)
    lsSet(LS_3B, all.filter(r => r.id !== id))
    return true
  }
}

// ─── Dashboard Statistics ───────────────────────────────────

export async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
    // Try Supabase first
    const [lembagaRes, siswaRes, tigaBRes] = await Promise.all([
      supabase.from('lembaga_sekolah').select('id, jenjang'),
      supabase.from('penerima_manfaat_siswa').select('id, lembaga_id, status_aktif'),
      supabase.from('penerima_manfaat_3b').select('id, kategori, status_aktif'),
    ])

    if (lembagaRes.error || siswaRes.error || tigaBRes.error) throw new Error('Supabase error')

    const lembagaList = lembagaRes.data || []
    const siswaList = (siswaRes.data || []).filter((s: { status_aktif: boolean }) => s.status_aktif !== false)
    const tigaBList = (tigaBRes.data || []).filter((r: { status_aktif: boolean }) => r.status_aktif !== false)

    // Build jenjang→lembaga_id mapping
    const jenjangIds: Record<Jenjang, Set<string>> = {
      KB_PAUD: new Set(), TK_RA: new Set(), SD_MI: new Set(), SMP_MTS: new Set(), SMA_SMK_MA: new Set()
    }
    lembagaList.forEach((l: { id: string; jenjang: Jenjang }) => jenjangIds[l.jenjang]?.add(l.id))

    const countByJenjang = (j: Jenjang) => siswaList.filter((s: { lembaga_id: string }) => jenjangIds[j].has(s.lembaga_id)).length
    const countByKat = (k: Kategori3B) => tigaBList.filter((r: { kategori: string }) => r.kategori === k).length

    const totalSiswa = siswaList.length
    const totalBalita = countByKat('balita')
    const totalBumil = countByKat('bumil')
    const totalBusui = countByKat('busui')

    return {
      totalSiswa,
      siswaPaud: countByJenjang('KB_PAUD') + countByJenjang('TK_RA'),
      siswaTk: countByJenjang('TK_RA'),
      siswaSd: countByJenjang('SD_MI'),
      siswaSmp: countByJenjang('SMP_MTS'),
      siswaSma: countByJenjang('SMA_SMK_MA'),
      totalBalita,
      totalBumil,
      totalBusui,
      total3B: totalBalita + totalBumil + totalBusui,
      totalPorsiHarian: totalSiswa + totalBalita + totalBumil + totalBusui,
    }
  } catch {
    // Fallback to localStorage
    return computeLocalStats()
  }
}

function computeLocalStats(): DashboardStats {
  const lembagaList = lsGet<LembagaSekolah>(LS_LEMBAGA)
  const siswaList = lsGet<PenerimaManfaatSiswa>(LS_SISWA).filter(s => s.status_aktif !== false)
  const tigaBList = lsGet<PenerimaManfaat3B>(LS_3B).filter(r => r.status_aktif !== false)

  const jenjangIds: Record<Jenjang, Set<string>> = {
    KB_PAUD: new Set(), TK_RA: new Set(), SD_MI: new Set(), SMP_MTS: new Set(), SMA_SMK_MA: new Set()
  }
  lembagaList.forEach(l => jenjangIds[l.jenjang]?.add(l.id))

  const countByJenjang = (j: Jenjang) => siswaList.filter(s => jenjangIds[j].has(s.lembaga_id)).length
  const countByKat = (k: Kategori3B) => tigaBList.filter(r => r.kategori === k).length

  const totalSiswa = siswaList.length
  const totalBalita = countByKat('balita')
  const totalBumil = countByKat('bumil')
  const totalBusui = countByKat('busui')

  return {
    totalSiswa,
    siswaPaud: countByJenjang('KB_PAUD') + countByJenjang('TK_RA'),
    siswaTk: countByJenjang('TK_RA'),
    siswaSd: countByJenjang('SD_MI'),
    siswaSmp: countByJenjang('SMP_MTS'),
    siswaSma: countByJenjang('SMA_SMK_MA'),
    totalBalita,
    totalBumil,
    totalBusui,
    total3B: totalBalita + totalBumil + totalBusui,
    totalPorsiHarian: totalSiswa + totalBalita + totalBumil + totalBusui,
  }
}

// ─── Super App Schema Types & Functions ─────────────────────────────

export interface SppgProfile {
  id?: string
  nama_unit: string
  penanggung_jawab: string
  wilayah: string
  kapasitas_harian: number
  status_operasional: string
  updated_at?: string
}

export interface KelompokPenerimaManfaat {
  id?: string
  urutan?: number
  nama: string
  kategori: string // 'KB/PAUD' | 'TK/RA' | 'SD/MI' | 'SMP/MTS' | 'SMA/SMK/MA' | 'POSYANDU_3B'
  sub_kategori?: string // 'Balita' | 'Bumil' | 'Busui'
  identitas_npsn_tmp: string
  kode: string
  wilayah: string
  kepemilikan?: string
  kecamatan?: string
  kel_desa?: string
  alamat?: string
  target_pria?: number
  target_wanita?: number
  target_guru?: number
  target_tendik?: number
  jumlah_penerima: number
  pimpinan?: string
  hp?: string
  email?: string
  status: string
  created_at?: string
  surat_pernyataan_url?: string
  mou_url?: string
}

export interface MenuHarianDB {
  id?: string
  tanggal: string
  nama_menu: string
  foto_url: string
  komposisi_gizi?: string[]
  kalori: string
  target_porsi?: number
  porsi_kecil?: number
  porsi_besar?: number
  catatan?: string
  status: string
  created_at?: string
}

// ─── SPPG Profile Helpers ───
export async function fetchSppgProfile(): Promise<SppgProfile> {
  const defaultProfile: SppgProfile = {
    nama_unit: 'SPPG PASURUAN WONOREJO',
    penanggung_jawab: 'Ahmad Sayyidani Haqiqi, S.Pd.',
    wilayah: 'JAWA TIMUR · PASURUAN · WONOREJO · WONOREJO',
    kapasitas_harian: 5000,
    status_operasional: 'Aktif'
  }

  try {
    const { data, error } = await supabase.from('sppg_profile').select('*').limit(1).single()
    if (error || !data) throw error
    return data
  } catch {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('sppg_profile_data') : null
    if (stored) {
      try { return JSON.parse(stored) } catch { /* use default */ }
    }
    return defaultProfile
  }
}

export async function saveSppgProfile(profile: SppgProfile): Promise<SppgProfile> {
  if (typeof window !== 'undefined') {
    localStorage.setItem('sppg_profile_data', JSON.stringify(profile))
    window.dispatchEvent(new Event('storage'))
  }
  try {
    const { data, error } = await supabase.from('sppg_profile').upsert(profile).select().single()
    if (!error && data) return data
  } catch {
    // fallback
  }
  return profile
}

// ─── Kelompok Penerima Manfaat Helpers ───
export const INITIAL_KPM_DATA: KelompokPenerimaManfaat[] = []

export function sortKpmList<T = any>(list: T[]): T[] {
  if (!Array.isArray(list)) return []
  return [...list].sort((a: any, b: any) => {
    const rawA = a?.urutan
    const rawB = b?.urutan

    const orderA = rawA !== null && rawA !== undefined && !isNaN(Number(rawA)) ? Number(rawA) : 999
    const orderB = rawB !== null && rawB !== undefined && !isNaN(Number(rawB)) ? Number(rawB) : 999

    if (orderA !== orderB) {
      return orderA - orderB
    }

    // Fallback jika urutan sama atau null
    const isPosyanduA = Boolean(
      a?.kategori?.toLowerCase().includes('posyandu') ||
      a?.jenis_kelompok?.toLowerCase().includes('posyandu') ||
      a?.nama_kelompok?.toLowerCase().includes('posyandu') ||
      a?.nama?.toLowerCase().includes('posyandu') ||
      a?.kategori?.toLowerCase().includes('3b')
    )
    const isPosyanduB = Boolean(
      b?.kategori?.toLowerCase().includes('posyandu') ||
      b?.jenis_kelompok?.toLowerCase().includes('posyandu') ||
      b?.nama_kelompok?.toLowerCase().includes('posyandu') ||
      b?.nama?.toLowerCase().includes('posyandu') ||
      b?.kategori?.toLowerCase().includes('3b')
    )

    if (isPosyanduA && !isPosyanduB) return 1
    if (!isPosyanduA && isPosyanduB) return -1
    return (a?.nama_kelompok || a?.nama || '').localeCompare(b?.nama_kelompok || b?.nama || '')
  })
}

export function calculateKpmPortion(item: KelompokPenerimaManfaat) {
  const kat = (item.kategori || '').toUpperCase()
  const subKat = (item.sub_kategori || '').toUpperCase()
  const total = item.jumlah_penerima || (item.target_pria || 0) + (item.target_wanita || 0) || 0
  const guruTendik = (item.target_guru || 0) + (item.target_tendik || 0)

  let porsiKecil = 0
  let porsiBesar = 0

  if (kat.includes('KB') || kat.includes('PAUD') || kat.includes('TK') || kat.includes('RA')) {
    const siswa = Math.max(0, total - guruTendik)
    porsiKecil = siswa
    porsiBesar = guruTendik
  } else if (kat.includes('SD') || kat.includes('MI')) {
    const siswa = Math.max(0, total - guruTendik)
    const porsiKecilSiswa = Math.round(siswa * 0.5)
    const porsiBesarSiswa = siswa - porsiKecilSiswa
    porsiKecil = porsiKecilSiswa
    porsiBesar = porsiBesarSiswa + guruTendik
  } else if (kat.includes('SMP') || kat.includes('MTS') || kat.includes('SMA') || kat.includes('SMK') || kat.includes('MA')) {
    porsiBesar = total
  } else if (kat.includes('POSYANDU') || kat.includes('3B')) {
    if (subKat.includes('BUMIL') || subKat.includes('BUSUI')) {
      porsiBesar = total
    } else {
      porsiKecil = total
    }
  } else {
    if (subKat.includes('BUMIL') || subKat.includes('BUSUI')) {
      porsiBesar = total
    } else {
      porsiKecil = total
    }
  }

  return {
    total,
    porsiKecil,
    porsiBesar,
    guruTendik
  }
}

export async function fetchKelompokPenerimaManfaatList(): Promise<KelompokPenerimaManfaat[]> {
  try {
    const { data, error } = await supabase
      .from('kelompok_penerima_manfaat')
      .select('*')
      .order('urutan', { ascending: true })
    if (error || !data) return []
    return sortKpmList(data)
  } catch {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('sppg_kpm_list') : null
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        return sortKpmList(parsed)
      } catch {
        return []
      }
    }
    return []
  }
}

export async function saveKelompokPenerimaManfaat(kpm: KelompokPenerimaManfaat): Promise<KelompokPenerimaManfaat> {
  const currentList = await fetchKelompokPenerimaManfaatList()
  const updatedList = [kpm, ...currentList.filter(item => item.kode !== kpm.kode)]
  if (typeof window !== 'undefined') {
    localStorage.setItem('sppg_kpm_list', JSON.stringify(updatedList))
    window.dispatchEvent(new Event('storage'))
  }

  try {
    const { data, error } = await supabase.from('kelompok_penerima_manfaat').insert(kpm).select().single()
    if (!error && data) return data
  } catch {
    // fallback
  }
  return kpm
}

export async function deleteKelompokPenerimaManfaat(idOrKode: string): Promise<boolean> {
  const currentList = await fetchKelompokPenerimaManfaatList()
  const updatedList = currentList.filter(item => item.id !== idOrKode && item.kode !== idOrKode)
  if (typeof window !== 'undefined') {
    localStorage.setItem('sppg_kpm_list', JSON.stringify(updatedList))
    window.dispatchEvent(new Event('storage'))
  }

  try {
    let query = supabase.from('kelompok_penerima_manfaat').delete()
    if (idOrKode.length > 20 && idOrKode.includes('-') && !idOrKode.startsWith('kpm-') && !idOrKode.startsWith('K')) {
      query = query.eq('id', idOrKode)
    } else {
      query = query.eq('kode', idOrKode)
    }
    const { error } = await query
    if (error) {
      console.error('Delete Supabase helper error:', error.message)
    }
  } catch (err) {
    console.error('Delete Supabase helper exception:', err)
  }
  return true
}

// ─── Menu Harian Helpers ───
export const INITIAL_MENU_HISTORY: MenuHarianDB[] = []

export function getTodayDateString(): string {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  const parts = formatter.formatToParts(now)
  let year = ''
  let month = ''
  let day = ''
  parts.forEach(p => {
    if (p.type === 'year') year = p.value
    if (p.type === 'month') month = p.value
    if (p.type === 'day') day = p.value
  })
  if (year && month && day) {
    return `${year}-${month}-${day}`
  }
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export async function fetchMenuHariIniDB(): Promise<MenuHarianDB | null> {
  const todayDateStr = getTodayDateString()
  try {
    const { data, error } = await supabase
      .from('menu_harian')
      .select('*')
      .eq('tanggal', todayDateStr)
      .order('created_at', { ascending: false })
      .limit(1)
    if (!error && data && data.length > 0) return data[0]
  } catch (err) {
    console.warn('fetchMenuHariIniDB notice:', err)
  }
  const history = await fetchMenuHistoryDB()
  const todayMenu = history.find(m => m.tanggal === todayDateStr)
  return todayMenu || null
}

export async function fetchMenuHistoryDB(): Promise<MenuHarianDB[]> {
  try {
    const { data, error } = await supabase
      .from('menu_harian')
      .select('*')
      .order('created_at', { ascending: false })
    if (error || !data) return []
    return data
  } catch (err) {
    console.warn('fetchMenuHistoryDB notice:', err)
    const stored = typeof window !== 'undefined' ? localStorage.getItem('sppg_menu_history_list') : null
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) return parsed
      } catch { return [] }
    }
    return []
  }
}

export async function saveMenuHariIniDB(menu: MenuHarianDB): Promise<MenuHarianDB> {
  const isValidUuid = (id?: string) => Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))

  const cleanNama = menu.nama_menu || (menu as any).nama || ''
  const cleanTanggal = menu.tanggal || (menu as any).tanggal_berlaku || new Date().toISOString().split('T')[0]
  const cleanKalori = menu.kalori || (menu as any).estimasi_kalori || (menu as any).estimasiKalori || '~650 kkal'
  const cleanPorsi = Number(menu.target_porsi || (menu as any).porsi || (menu as any).targetPorsi) || 3196
  const cleanStatus = menu.status || (menu as any).status_distribusi || (menu as any).statusDistribusi || 'Siap Distribusi'
  const cleanTags = menu.komposisi_gizi || (menu as any).tags || (menu as any).selectedTags || []
  const cleanCatatan = menu.catatan || ''
  const cleanFoto = menu.foto_url || (menu as any).foto || (menu as any).publicUploadedUrl || ''

  // Standardized Dual-Key Payload Object
  const menuPayload: Record<string, any> = {
    nama_menu: cleanNama,
    nama: cleanNama,
    tanggal: cleanTanggal,
    tanggal_berlaku: cleanTanggal,
    kalori: cleanKalori,
    estimasi_kalori: cleanKalori,
    porsi: cleanPorsi,
    target_porsi: cleanPorsi,
    status: cleanStatus,
    status_distribusi: cleanStatus,
    komposisi_gizi: cleanTags,
    tags: cleanTags,
    catatan: cleanCatatan,
    foto_url: cleanFoto,
    foto: cleanFoto
  }

  if (isValidUuid(menu.id)) {
    menuPayload.id = menu.id
  } else if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    menuPayload.id = crypto.randomUUID()
  }

  const newRecord: MenuHarianDB = {
    id: menuPayload.id || `menu-${Date.now()}`,
    nama_menu: cleanNama,
    tanggal: cleanTanggal,
    kalori: cleanKalori,
    target_porsi: cleanPorsi,
    status: cleanStatus,
    komposisi_gizi: cleanTags,
    catatan: cleanCatatan,
    foto_url: cleanFoto,
    created_at: menu.created_at || new Date().toISOString()
  }

  if (typeof window !== 'undefined') {
    const localFormat = {
      namaMenu: cleanNama,
      tanggal: cleanTanggal,
      targetPorsi: `${cleanPorsi.toLocaleString('id-ID')} Porsi`,
      kalori: cleanKalori,
      status: cleanStatus,
      tags: cleanTags,
      fotoUrl: cleanFoto
    }
    localStorage.setItem('sppg_menu_hari_ini', JSON.stringify(localFormat))
    
    // Save to history list in localStorage
    const currentHistory = await fetchMenuHistoryDB()
    const updatedHistory = [newRecord, ...currentHistory.filter(h => h.id !== newRecord.id && h.tanggal !== cleanTanggal)]
    localStorage.setItem('sppg_menu_history_list', JSON.stringify(updatedHistory))

    window.dispatchEvent(new Event('storage'))
  }

  // Resilient Supabase Insert with automatic missing-column stripping retry loop
  let currentPayload = { ...menuPayload }
  let lastError: any = null

  for (let attempt = 0; attempt < 10; attempt++) {
    const { data, error } = await supabase
      .from('menu_harian')
      .insert([currentPayload])
      .select()

    if (!error && data && data.length > 0) {
      return data[0]
    }

    if (!error && data) {
      return newRecord
    }

    lastError = error
    console.warn(`Supabase menu_harian insert attempt ${attempt + 1} notice:`, error.message)

    // Check if error is missing column error: "Could not find the 'xyz' column of 'menu_harian'"
    const match = error.message.match(/Could not find the '([^']+)' column/i) ||
                  error.message.match(/column "([^"]+)" of relation "menu_harian" does not exist/i) ||
                  error.message.match(/column ([^\s]+) does not exist/i)

    if (match && match[1]) {
      const badCol = match[1]
      console.log(`Column '${badCol}' does not exist on menu_harian table. Stripping '${badCol}' and retrying...`)
      delete currentPayload[badCol]
    } else {
      break
    }
  }

  if (lastError) {
    console.error('Final Supabase menu_harian insert error:', lastError.message, lastError)
    throw new Error(`Gagal menyimpan ke Supabase: ${lastError.message} (${lastError.code || 'DB_ERROR'})`)
  }

  return newRecord
}

// ─── BNBA (By Name By Address) Types & Helpers ───────────────────────

export interface PenerimaManfaatBnba {
  id: string
  kelompok_id: string
  nisn_nik: string
  nama_lengkap: string
  tanggal_lahir: string
  jenis_kelamin: string
  nama_ortu: string
  posisi: string
  kelas: string
  created_at?: string
  nama_penerima?: string
  nama?: string
  nik?: string
  nisn?: string
  jk?: string
}

const LS_BNBA = 'sppg_penerima_bnba'

// Initial empty BNBA list
export const INITIAL_BNBA_DATA: PenerimaManfaatBnba[] = []

export async function fetchBnbaList(kelompokId?: string): Promise<PenerimaManfaatBnba[]> {
  try {
    let query = supabase.from('penerima_manfaat_bnba').select('*').order('created_at', { ascending: false })
    if (kelompokId) {
      query = query.eq('kelompok_id', kelompokId)
    } else {
      query = query.limit(10000)
    }
    const { data, error } = await query
    if (error || !data) return []
    return data
  } catch {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(LS_BNBA) : null
    let all: PenerimaManfaatBnba[] = []
    if (stored) {
      try { all = JSON.parse(stored) } catch { return [] }
    }
    return kelompokId ? all.filter(item => item.kelompok_id === kelompokId) : all
  }
}

export async function saveBnbaItem(item: PenerimaManfaatBnba): Promise<PenerimaManfaatBnba> {
  const currentList = await fetchBnbaList()
  const updatedList = [item, ...currentList.filter(i => i.id !== item.id)]
  if (typeof window !== 'undefined') {
    localStorage.setItem(LS_BNBA, JSON.stringify(updatedList))
    window.dispatchEvent(new Event('storage'))
  }

  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const { id, ...cleanItem } = item as any
    const payload = (id && uuidRegex.test(id)) ? item : cleanItem

    const { data, error } = await supabase.from('penerima_manfaat_bnba').insert(payload).select().single()
    if (!error && data) return data
  } catch {
    // fallback
  }
  return item
}

export async function saveBnbaBulk(items: PenerimaManfaatBnba[]): Promise<boolean> {
  if (!items || items.length === 0) return true
  const currentList = await fetchBnbaList()
  const newIds = new Set(items.map(i => i.id))
  const updatedList = [...items, ...currentList.filter(i => !newIds.has(i.id))]

  if (typeof window !== 'undefined') {
    localStorage.setItem(LS_BNBA, JSON.stringify(updatedList))
    window.dispatchEvent(new Event('storage'))
  }

  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const payload = items.map(item => {
      const { id, ...cleanItem } = item as any
      if (id && uuidRegex.test(id)) {
        return item
      }
      return cleanItem
    })

    const { error } = await supabase.from('penerima_manfaat_bnba').insert(payload)
    if (error) {
      console.error('Error inserting bulk BNBA to Supabase:', error.message)
    }
  } catch (err) {
    console.error('Exception bulk BNBA Supabase:', err)
  }
  return true
}

export async function deleteBnbaItem(id: string): Promise<boolean> {
  const currentList = await fetchBnbaList()
  const updatedList = currentList.filter(i => i.id !== id)
  if (typeof window !== 'undefined') {
    localStorage.setItem(LS_BNBA, JSON.stringify(updatedList))
    window.dispatchEvent(new Event('storage'))
  }

  try {
    await supabase.from('penerima_manfaat_bnba').delete().eq('id', id)
  } catch {
    // fallback
  }
  return true
}

// ─── Data Relawan SPPG Helpers ───────────────────────────────

export interface RelawanSppg {
  id: string
  nama_lengkap: string
  nik?: string | null
  divisi: string
  email?: string | null
  tempat_lahir?: string | null
  tanggal_lahir?: string | null
  status: 'Aktif' | 'Cuti' | 'Non-Aktif'
  no_hp?: string | null
  pendidikan_terakhir?: string | null
  mulai_bekerja?: string | null
  alamat?: string | null
  no_bpjstk?: string | null
  no_rekening_bni?: string | null
  created_at?: string
}

export const INITIAL_RELAWAN_DATA: RelawanSppg[] = []

export async function fetchRelawanSppgList(): Promise<RelawanSppg[]> {
  try {
    const { data, error } = await supabase
      .from('relawan_sppg')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Fetch Relawan Error:', error)
    } else if (data) {
      return data
    }
  } catch (err) {
    console.error('Exception fetching relawan_sppg:', err)
  }

  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('sppg_relawan_list')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) return parsed
      } catch {}
    }
  }

  return []
}

function normalizeDateStr(val: any): string {
  if (val === null || val === undefined || val === '') return ''
  const s = String(val).trim()
  if (!s) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const dmYMatch = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/)
  if (dmYMatch) {
    const d = String(dmYMatch[1]).padStart(2, '0')
    const m = String(dmYMatch[2]).padStart(2, '0')
    const y = dmYMatch[3]
    return `${y}-${m}-${d}`
  }
  try {
    const parsed = new Date(s)
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0]
    }
  } catch {}
  return s
}

export async function saveRelawanSppg(item: Partial<RelawanSppg>): Promise<RelawanSppg> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const isEdit = !!(item.id && uuidRegex.test(item.id))

  const cleanNik = item.nik ? String(item.nik).replace(/[^0-9]/g, '').trim() : null
  const cleanHp = item.no_hp ? String(item.no_hp).replace(/[^0-9]/g, '').trim() : null
  const cleanBpjstk = item.no_bpjstk ? String(item.no_bpjstk).replace(/[^0-9]/g, '').trim() : null
  const cleanRekening = item.no_rekening_bni ? String(item.no_rekening_bni).replace(/[^0-9]/g, '').trim() : null

  const cleanTglLahir = item.tanggal_lahir ? normalizeDateStr(item.tanggal_lahir) : null
  const cleanMulaiBekerja = item.mulai_bekerja ? normalizeDateStr(item.mulai_bekerja) : null

  const payload: any = {
    nama_lengkap: item.nama_lengkap,
    nik: cleanNik,
    divisi: item.divisi || 'PENGOLAHAN',
    email: item.email || null,
    tempat_lahir: item.tempat_lahir || null,
    tanggal_lahir: cleanTglLahir || null,
    status: item.status || 'Aktif',
    no_hp: cleanHp || null,
    pendidikan_terakhir: item.pendidikan_terakhir || null,
    mulai_bekerja: cleanMulaiBekerja || null,
    alamat: item.alamat || null,
    no_bpjstk: cleanBpjstk || null,
    no_rekening_bni: cleanRekening || null,
  }

  if (isEdit && item.id) {
    payload.id = item.id
  }

  let dbData: RelawanSppg | null = null
  let dbError: any = null

  if (isEdit) {
    const { data, error } = await supabase
      .from('relawan_sppg')
      .update(payload)
      .eq('id', payload.id)
      .select()
      .single()
    dbData = data
    dbError = error
  } else {
    const { data, error } = await supabase
      .from('relawan_sppg')
      .insert([payload])
      .select()
      .single()
    dbData = data
    dbError = error
  }

  if (dbError) {
    console.error('Supabase Insert/Update Error:', dbError)
    throw dbError
  }

  if (!dbData) {
    throw new Error('Supabase tidak mengembalikan data relawan.')
  }

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('sppg_relawan_list')
      const currentList: RelawanSppg[] = stored ? JSON.parse(stored) : []
      let updatedList: RelawanSppg[] = []
      if (isEdit) {
        updatedList = currentList.map(r => r.id === dbData!.id ? dbData! : r)
      } else {
        updatedList = [dbData, ...currentList.filter(r => r.id !== dbData!.id)]
      }
      localStorage.setItem('sppg_relawan_list', JSON.stringify(updatedList))
      window.dispatchEvent(new Event('storage'))
    } catch {}
  }

  return dbData
}

export async function deleteRelawanSppg(id: string): Promise<boolean> {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('sppg_relawan_list')
    if (stored) {
      try {
        const currentList: RelawanSppg[] = JSON.parse(stored) || []
        const filtered = currentList.filter(r => r.id !== id && r.nik !== id)
        localStorage.setItem('sppg_relawan_list', JSON.stringify(filtered))
        window.dispatchEvent(new Event('storage'))
      } catch {}
    }
  }

  try {
    const { error } = await supabase.from('relawan_sppg').delete().or(`id.eq.${id},nik.eq.${id}`)
    if (error) console.error('Error deleting relawan:', error)
  } catch (err) {
    console.warn('Supabase relawan_sppg delete warning:', err)
  }

  return true
}

export async function bulkSaveRelawanSppg(items: Partial<RelawanSppg>[]): Promise<{ success: boolean; error?: any; data?: RelawanSppg[] }> {
  if (!items || items.length === 0) return { success: false }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  const cleanedRows = items.map((item) => {
    const { id, ...rest } = item
    const cleanNik = String(item.nik || '').replace(/[^0-9]/g, '').trim()
    const cleanHp = String(item.no_hp || '').replace(/[^0-9]/g, '').trim()
    const cleanBpjstk = String(item.no_bpjstk || '').replace(/[^0-9]/g, '').trim()
    const cleanRekening = String(item.no_rekening_bni || '').replace(/[^0-9]/g, '').trim()

    const payload: any = {
      ...rest,
      nik: cleanNik,
      no_hp: cleanHp,
      no_bpjstk: cleanBpjstk,
      no_rekening_bni: cleanRekening,
      status: item.status || 'Aktif',
      divisi: item.divisi || 'PENGOLAHAN'
    }

    if (id && uuidRegex.test(id)) {
      payload.id = id
    }

    return payload
  })

  // Sync to local storage for local fallback
  if (typeof window !== 'undefined') {
    const currentList = await fetchRelawanSppgList()
    const existingMap = new Map<string, RelawanSppg>()
    currentList.forEach(r => {
      const key = r.nik || r.id
      if (key) existingMap.set(key, r)
    })
    cleanedRows.forEach(r => {
      const key = r.nik || r.id || `rel-${Date.now()}`
      if (key) {
        const prev = existingMap.get(key)
        existingMap.set(key, { ...prev, ...r } as RelawanSppg)
      }
    })
    const updatedList = Array.from(existingMap.values())
    localStorage.setItem('sppg_relawan_list', JSON.stringify(updatedList))
    window.dispatchEvent(new Event('storage'))
  }

  try {
    const { data: insertedData, error: insertError } = await supabase
      .from('relawan_sppg')
      .insert(cleanedRows)
      .select()

    if (insertError) {
      console.error('Gagal Insert Relawan Supabase:', insertError)
      const { data: upsertData, error: upsertError } = await supabase
        .from('relawan_sppg')
        .upsert(cleanedRows)
        .select()

      if (upsertError) {
        console.error('Gagal Upsert Relawan Supabase:', upsertError)
        return { success: false, error: insertError }
      }
      return { success: true, data: upsertData || [] }
    }

    return { success: true, data: insertedData || [] }
  } catch (err) {
    console.error('Exception bulkSaveRelawanSppg:', err)
    return { success: false, error: err }
  }
}


