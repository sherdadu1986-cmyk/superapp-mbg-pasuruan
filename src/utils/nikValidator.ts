import { supabase } from '@/lib/supabase';

export type IdType = 'NIK' | 'NISN' | 'UNKNOWN';
export type IdStatus = 'VALID' | 'DUPLICATE' | 'TEMP_ZEROS' | 'INVALID_FORMAT';

export interface IdentityAuditResult {
  idType: IdType;
  status: IdStatus;
  badgeLabel: string;
  badgeColor: 'emerald' | 'blue' | 'amber' | 'red';
  alasan: string;
  rekomendasi?: string;
}

export interface NikValidationResult {
  isValid: boolean;
  message: string;
  idType?: IdType;
  gender?: 'Laki-laki' | 'Perempuan';
  birthDate?: string;
}

export interface DuplicateNikMatch {
  id: string;
  nama: string;
  nama_sekolah: string;
}

// Legacy alias type for backward compatibility
export type NikStatus = IdStatus;
export type NikAuditDetail = IdentityAuditResult;

export function auditIdentityNumber(idNumber: string): IdentityAuditResult {
  const clean = (idNumber || '').trim();

  if (!clean) {
    return {
      idType: 'UNKNOWN',
      status: 'INVALID_FORMAT',
      badgeLabel: 'Kosong',
      badgeColor: 'red',
      alasan: 'Nomor identitas belum diisi',
      rekomendasi: 'Isikan 10 digit NISN sekolah atau 16 digit NIK Dukcapil'
    };
  }

  if (!/^\d+$/.test(clean)) {
    return {
      idType: 'UNKNOWN',
      status: 'INVALID_FORMAT',
      badgeLabel: 'Bukan Angka',
      badgeColor: 'red',
      alasan: 'Hanya boleh berisi angka',
      rekomendasi: 'Hapus karakter simbol/huruf dari nomor identitas'
    };
  }

  // =========================
  // 1. VALIDASI NISN (10 DIGIT)
  // =========================
  if (clean.length === 10) {
    if (clean === '0000000000') {
      return {
        idType: 'NISN',
        status: 'TEMP_ZEROS',
        badgeLabel: 'NISN 0000',
        badgeColor: 'amber',
        alasan: 'Nomor NISN sementara (belum diisi nomor asli)',
        rekomendasi: 'Cek nomor NISN resmi siswa di DAPODIK / EMIS'
      };
    }
    return {
      idType: 'NISN',
      status: 'VALID',
      badgeLabel: 'NISN Valid',
      badgeColor: 'blue',
      alasan: 'Format 10 Digit Resmi Kemendikbud',
      rekomendasi: 'Nomor NISN siswa terverifikasi resmi Kemendikbud'
    };
  }

  // =========================
  // 2. VALIDASI NIK (16 DIGIT)
  // =========================
  if (clean.length === 16) {
    const urut = clean.substring(12, 16);
    if (urut === '0000') {
      return {
        idType: 'NIK',
        status: 'TEMP_ZEROS',
        badgeLabel: 'Ujung 0000',
        badgeColor: 'amber',
        alasan: '4 Digit terakhir 0000 (Data sementara/belum verifikasi Dukcapil)',
        rekomendasi: 'Mintakan FC Kartu Keluarga asli ke wali murid / ibu'
      };
    }

    let tgl = parseInt(clean.substring(6, 8), 10);
    if (tgl > 40) tgl -= 40; // perempuan
    const bln = parseInt(clean.substring(8, 10), 10);

    if (tgl < 1 || tgl > 31 || bln < 1 || bln > 12) {
      return {
        idType: 'NIK',
        status: 'INVALID_FORMAT',
        badgeLabel: 'Tgl/Bln Salah',
        badgeColor: 'red',
        alasan: 'Struktur tanggal/bulan lahir NIK tidak valid',
        rekomendasi: 'Verifikasi ulang tanggal lahir dan NIK pada Kartu Keluarga'
      };
    }

    return {
      idType: 'NIK',
      status: 'VALID',
      badgeLabel: 'NIK Valid',
      badgeColor: 'emerald',
      alasan: 'Format 16 Digit Resmi Dukcapil',
      rekomendasi: 'Format NIK 16 digit terverifikasi resmi Dukcapil'
    };
  }

  // =========================
  // 3. DI LUAR 10 ATAU 16 DIGIT
  // =========================
  return {
    idType: 'UNKNOWN',
    status: 'INVALID_FORMAT',
    badgeLabel: `${clean.length} Digit`,
    badgeColor: 'red',
    alasan: `Jumlah digit tidak sesuai standar (Harus 10 digit untuk NISN atau 16 digit untuk NIK)`,
    rekomendasi: 'Pastikan nomor berupa 10 digit NISN sekolah atau 16 digit NIK Dukcapil'
  };
}

// Backwards compatibility alias for auditNik
export const auditNik = auditIdentityNumber;

export function validateNikStructure(nik: string): NikValidationResult {
  const audit = auditIdentityNumber(nik);

  if (audit.status !== 'VALID') {
    return {
      isValid: false,
      message: audit.alasan,
      idType: audit.idType
    };
  }

  const cleanNik = nik.trim();

  if (audit.idType === 'NISN') {
    return {
      isValid: true,
      message: 'Format NISN Valid (10 Digit Kemendikbud)',
      idType: 'NISN'
    };
  }

  let tgl = parseInt(cleanNik.substring(6, 8), 10);
  const bln = parseInt(cleanNik.substring(8, 10), 10);
  const thn = cleanNik.substring(10, 12);

  let gender: 'Laki-laki' | 'Perempuan' = 'Laki-laki';
  if (tgl > 40) {
    gender = 'Perempuan';
    tgl -= 40;
  }

  return {
    isValid: true,
    message: 'Format NIK Valid (16 Digit Dukcapil)',
    idType: 'NIK',
    gender,
    birthDate: `${String(tgl).padStart(2, '0')}-${String(bln).padStart(2, '0')}-${thn}`
  };
}

export async function checkDuplicateNik(
  nik: string,
  currentPmId?: string,
  localRecords?: Array<{ id: string; nisn_nik?: string; nik?: string; nama_lengkap?: string; nama_penerima?: string; nama?: string; kelompok_id?: string }>
): Promise<DuplicateNikMatch | null> {
  const cleanNik = nik.trim();
  if (!cleanNik) return null;

  try {
    // 1. Cek tabel penerima_manfaat_bnba di Supabase
    let query = supabase
      .from('penerima_manfaat_bnba')
      .select('id, nisn_nik, nama_lengkap, nama_penerima, nama, kelompok_id')
      .or(`nisn_nik.eq.${cleanNik},nik.eq.${cleanNik}`);

    if (currentPmId) {
      query = query.neq('id', currentPmId);
    }

    const { data: bnbaData, error } = await query.limit(1);

    if (!error && bnbaData && bnbaData.length > 0) {
      const match = bnbaData[0];
      let namaSekolah = 'Lembaga/Sekolah';
      if (match.kelompok_id) {
        const { data: kpmData } = await supabase
          .from('kelompok_penerima_manfaat')
          .select('nama')
          .eq('id', match.kelompok_id)
          .maybeSingle();
        if (kpmData?.nama) {
          namaSekolah = kpmData.nama;
        }
      }
      return {
        id: match.id,
        nama: match.nama_lengkap || match.nama_penerima || match.nama || 'Penerima Manfaat',
        nama_sekolah: namaSekolah,
      };
    }

    // 2. Cek tabel master_penerima_manfaat (fallback schema)
    try {
      let masterQuery = supabase
        .from('master_penerima_manfaat')
        .select('id, nama, nama_sekolah')
        .eq('nik', cleanNik);

      if (currentPmId) {
        masterQuery = masterQuery.neq('id', currentPmId);
      }

      const { data: masterData } = await masterQuery.limit(1);
      if (masterData && masterData.length > 0) {
        return {
          id: masterData[0].id,
          nama: masterData[0].nama || 'Penerima Manfaat',
          nama_sekolah: masterData[0].nama_sekolah || 'Lembaga/Sekolah',
        };
      }
    } catch {
      // Abaikan jika tabel master_penerima_manfaat belum dibuat
    }
  } catch (err) {
    console.warn('Supabase duplicate NIK/NISN check exception:', err);
  }

  // 3. Fallback: Cek data lokal / cache jika ada
  if (localRecords && localRecords.length > 0) {
    const found = localRecords.find((rec) => {
      const recNik = (rec.nisn_nik || rec.nik || '').trim();
      if (!recNik) return false;
      if (recNik !== cleanNik) return false;
      if (currentPmId && rec.id === currentPmId) return false;
      return true;
    });

    if (found) {
      return {
        id: found.id,
        nama: found.nama_lengkap || found.nama_penerima || found.nama || 'Penerima Manfaat',
        nama_sekolah: 'Lembaga/Sekolah',
      };
    }
  }

  return null;
}
