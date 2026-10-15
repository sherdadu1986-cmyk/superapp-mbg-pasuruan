import { supabase } from '@/lib/supabase'

export interface SppgOfficialIdentity {
  // 1. Identitas SPPG
  id_sppg: string
  no_ba_verval: string
  tgl_ba_verval: string
  status_operasional: string
  tgl_operasional: string
  kode_sppg: string
  nama_sppg: string
  provinsi: string
  kabupaten: string
  kecamatan: string
  desa: string
  alamat_lengkap: string
  kode_pos: string
  latitude: number
  longitude: number
  jenis_bangunan: string
  jenis_sppg: string

  // 2. Data Kasatpel / Kepala SPPG (SPPI)
  kasatpel_nama: string
  kasatpel_jabatan: string
  kasatpel_email: string
  kasatpel_telepon: string
  kasatpel_catatan: string

  // 3. Identitas Mitra / Instansi
  mitra_jenis: string
  mitra_nama: string
  mitra_pimpinan: string
  mitra_telepon: string
  mitra_email: string
  mitra_bentuk_dukungan: string
  mitra_alamat_operasional: string

  // 4. Identitas Mitra / Yayasan (Bermitra Langsung Dengan BGN)
  yayasan_nama: string
  yayasan_npwp: string
  yayasan_alamat_legal: string
  yayasan_kode_pos: string
  yayasan_email: string
  yayasan_telepon: string
  yayasan_catatan: string

  // 5. Data Bank Dan Rekening Operasional
  bank_utama_nama: string
  bank_utama_rekening: string
  bank_utama_pemilik: string
  bank_va_nama: string
  bank_va_nomor: string
  bank_va_pemilik: string

  // 6. Data Perwakilan Yayasan di SPPG (PIC / Pemegang Virtual Account)
  pic_nama: string
  pic_nik: string
  pic_email: string
  pic_telepon: string
}

export const DEFAULT_SPPG_OFFICIAL_IDENTITY: SppgOfficialIdentity = {
  // 1. IDENTITAS SPPG
  id_sppg: 'FFTYXNNF',
  no_ba_verval: '12/BA/VERVAL/JAKARTA/VIII/2025',
  tgl_ba_verval: '7 Agustus 2025',
  status_operasional: 'Beroperasi',
  tgl_operasional: '27 Agustus 2025',
  kode_sppg: '35.14.07.2005.01',
  nama_sppg: 'SPPG Pasuruan Wonorejo Wonorejo',
  provinsi: 'Jawa Timur',
  kabupaten: 'Pasuruan',
  kecamatan: 'Wonorejo',
  desa: 'Wonorejo',
  alamat_lengkap: 'Desa Wonorejo, Kecamatan Wonorejo, Kabupaten Pasuruan, Jawa Timur',
  kode_pos: '67173',
  latitude: -7.721026128263655,
  longitude: 112.79782779,
  jenis_bangunan: 'Rumah Tinggal',
  jenis_sppg: 'SPPG Mitra',

  // 2. DATA KASATPEL / KEPALA SPPG (SPPI)
  kasatpel_nama: 'Ahmad Sayyidani Khaqiqi',
  kasatpel_jabatan: 'Kepala SPPG / Kasatpel SPPI (Satuan Pelayanan Pemenuhan Gizi)',
  kasatpel_email: 'sayyidhaq0@gmail.com',
  kasatpel_telepon: '089617390529',
  kasatpel_catatan: 'Kelengkapan data Kasatpel/Kepala SPPG lainnya terdapat pada menu Petugas.',

  // 3. IDENTITAS MITRA / INSTANSI
  mitra_jenis: 'Yayasan',
  mitra_nama: 'Yayasan Ainul Yakin Al Kasitolah',
  mitra_pimpinan: 'Ani Mustabsyiroh',
  mitra_telepon: '082337941120',
  mitra_email: 'yayasanainulyakinalkasitolah1@gmail.com',
  mitra_bentuk_dukungan: 'Lahan, bangunan, alat masak, alat makan, kendaraan, dan tenaga kerja (relawan)',
  mitra_alamat_operasional: 'Jl. Rahayu No. 06, RT 001/RW 008, Kidul Dalem, Wonorejo, Kabupaten Pasuruan, Jawa Timur 67173',

  // 4. IDENTITAS MITRA / YAYASAN (BERMITRA LANGSUNG DENGAN BGN)
  yayasan_nama: 'Yayasan Ainul Yakin Al Kasitolah',
  yayasan_npwp: '1000000002194706',
  yayasan_alamat_legal: 'Jatigede, Kecamatan Sumberrejo, Kabupaten Bojonegoro, Jawa Timur',
  yayasan_kode_pos: '62191',
  yayasan_email: 'yayasanainulyakinalkasitolah1@gmail.com',
  yayasan_telepon: '082337941120',
  yayasan_catatan: 'Kelengkapan data yayasan lainnya terdapat pada menu Kerjasama.',

  // 5. DATA BANK DAN REKENING OPERASIONAL
  bank_utama_nama: 'Bank BNI',
  bank_utama_rekening: '5365999996',
  bank_utama_pemilik: 'AINUL YAKIN AL KASITOLAH',
  bank_va_nama: 'Bank BNI',
  bank_va_nomor: '5268080020155800',
  bank_va_pemilik: '201558 FFTYXNNF AINUL YAKI',

  // 6. DATA PERWAKILAN YAYASAN DI SPPG (PIC / PEMEGANG VIRTUAL ACCOUNT)
  pic_nama: 'Desy Hidayah Shobrina',
  pic_nik: '3522105412990001',
  pic_email: 'personilainulyakindesy@gmail.com',
  pic_telepon: '089671722848'
}

export const SPPG_STORAGE_KEY = 'sppg_official_identity_v2'

export async function fetchSppgOfficialIdentity(): Promise<SppgOfficialIdentity> {
  try {
    const { data, error } = await supabase.from('sppg_identity').select('*').limit(1).single()
    if (!error && data) {
      return { ...DEFAULT_SPPG_OFFICIAL_IDENTITY, ...data }
    }
  } catch {
    // fallback to local storage
  }

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(SPPG_STORAGE_KEY)
      if (stored) {
        return { ...DEFAULT_SPPG_OFFICIAL_IDENTITY, ...JSON.parse(stored) }
      }
    } catch {
      // ignore JSON parse error
    }
  }

  return { ...DEFAULT_SPPG_OFFICIAL_IDENTITY }
}

export async function saveSppgOfficialIdentity(data: SppgOfficialIdentity): Promise<SppgOfficialIdentity> {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(SPPG_STORAGE_KEY, JSON.stringify(data))
      // Also update legacy sppg_profile_data for backward compatibility
      const legacyData = {
        nama_unit: data.nama_sppg,
        penanggung_jawab: data.kasatpel_nama,
        wilayah: `${data.provinsi} · ${data.kabupaten} · ${data.kecamatan} · ${data.desa}`,
        kapasitas_harian: 5000,
        status_operasional: data.status_operasional
      }
      localStorage.setItem('sppg_profile_data', JSON.stringify(legacyData))
      window.dispatchEvent(new Event('storage'))
    } catch {
      // storage error
    }
  }

  try {
    await supabase.from('sppg_identity').upsert({ id: 'current', ...data })
  } catch {
    // ignore supabase error if table not migrated yet
  }

  return data
}
