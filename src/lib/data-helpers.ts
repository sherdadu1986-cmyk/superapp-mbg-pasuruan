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

export async function fetchKelompokPenerimaManfaatList(): Promise<KelompokPenerimaManfaat[]> {
  try {
    const { data, error } = await supabase.from('kelompok_penerima_manfaat').select('*').order('urutan', { ascending: true })
    if (error || !data) return []
    return data
  } catch {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('sppg_kpm_list') : null
    if (stored) {
      try { return JSON.parse(stored) } catch { return [] }
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

export async function fetchMenuHariIniDB(): Promise<MenuHarianDB | null> {
  try {
    const { data, error } = await supabase
      .from('menu_harian')
      .select('*')
      .order('tanggal', { ascending: false })
      .limit(1)
      .single()
    if (!error && data) return data
  } catch {
    // fallback
  }
  const history = await fetchMenuHistoryDB()
  return history && history.length > 0 ? history[0] : null
}

export async function fetchMenuHistoryDB(): Promise<MenuHarianDB[]> {
  try {
    const { data, error } = await supabase
      .from('menu_harian')
      .select('*')
      .order('tanggal', { ascending: false })
    if (error || !data) return []
    return data
  } catch {
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
  const newRecord: MenuHarianDB = {
    ...menu,
    id: menu.id || `menu-${Date.now()}`,
    created_at: menu.created_at || new Date().toISOString()
  }

  const localFormat = {
    namaMenu: menu.nama_menu,
    tanggal: menu.tanggal,
    targetPorsi: `${(menu.target_porsi || 4850).toLocaleString('id-ID')} Porsi`,
    kalori: menu.kalori,
    status: menu.status,
    tags: menu.komposisi_gizi || [],
    fotoUrl: menu.foto_url
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem('sppg_menu_hari_ini', JSON.stringify(localFormat))
    
    // Save to history list in localStorage
    const currentHistory = await fetchMenuHistoryDB()
    const updatedHistory = [newRecord, ...currentHistory.filter(h => h.id !== newRecord.id && h.tanggal !== menu.tanggal)]
    localStorage.setItem('sppg_menu_history_list', JSON.stringify(updatedHistory))

    window.dispatchEvent(new Event('storage'))
  }

  try {
    const { data, error } = await supabase.from('menu_harian').insert(newRecord).select().single()
    if (!error && data) return data
  } catch {
    // fallback
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
  jenis_kelamin: 'L' | 'P'
  nama_ortu: string
  posisi: 'Siswa' | 'Tendik' | 'Balita' | 'Bumil' | 'Busui'
  kelas: string
  created_at?: string
}

const LS_BNBA = 'sppg_penerima_bnba'

// Initial empty BNBA list
export const INITIAL_BNBA_DATA: PenerimaManfaatBnba[] = []

export async function fetchBnbaList(kelompokId?: string): Promise<PenerimaManfaatBnba[]> {
  try {
    let query = supabase.from('penerima_manfaat_bnba').select('*').limit(10000).order('created_at', { ascending: false })
    if (kelompokId) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (uuidRegex.test(kelompokId)) {
        query = query.or(`kelompok_id.eq.${kelompokId},kpm_id.eq.${kelompokId},sekolah_id.eq.${kelompokId}`)
      } else {
        const { data: kpm } = await supabase
          .from('kelompok_penerima_manfaat')
          .select('id, kode, identitas_npsn_tmp')
          .or(`kode.eq.${kelompokId},identitas_npsn_tmp.eq.${kelompokId},id.eq.${kelompokId}`)
          .limit(1)
          .maybeSingle()
        if (kpm?.id) {
          query = query.or(`kelompok_id.eq.${kelompokId},kelompok_id.eq.${kpm.id},kpm_id.eq.${kpm.id},npsn.eq.${kpm.identitas_npsn_tmp || kelompokId}`)
        } else {
          query = query.or(`kelompok_id.eq.${kelompokId},npsn.eq.${kelompokId},kode.eq.${kelompokId}`)
        }
      }
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


