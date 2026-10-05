import { supabase } from '@/lib/supabase';

export interface NikValidationResult {
  isValid: boolean;
  message: string;
  gender?: 'Laki-laki' | 'Perempuan';
  birthDate?: string;
}

export interface DuplicateNikMatch {
  id: string;
  nama: string;
  nama_sekolah: string;
}

export type NikStatus = 'VALID' | 'DUPLICATE' | 'TEMP_ZEROS' | 'INVALID_LENGTH' | 'INVALID_DATE' | 'INVALID_CHAR';

export interface NikAuditDetail {
  status: NikStatus;
  badgeLabel: string;
  badgeColor: 'green' | 'amber' | 'red' | 'purple';
  alasan: string;
  rekomendasi?: string;
}

export function auditNik(nik: string): NikAuditDetail {
  const clean = (nik || '').trim();
  if (!clean) {
    return {
      status: 'INVALID_CHAR',
      badgeLabel: 'NIK Kosong',
      badgeColor: 'red',
      alasan: 'Nomor NIK belum diisi',
      rekomendasi: 'Isikan nomor NIK 16 digit siswa/balita/ibu'
    };
  }
  if (!/^\d+$/.test(clean)) {
    return {
      status: 'INVALID_CHAR',
      badgeLabel: 'Bukan Angka',
      badgeColor: 'red',
      alasan: 'NIK mengandung karakter non-angka',
      rekomendasi: 'Hapus karakter simbol/huruf dari nomor NIK'
    };
  }
  if (clean.length !== 16) {
    return {
      status: 'INVALID_LENGTH',
      badgeLabel: `${clean.length} Digit`,
      badgeColor: 'amber',
      alasan: `Panjang NIK tidak 16 digit (terdeteksi ${clean.length} digit)`,
      rekomendasi: 'Cek ulang fisik KK/KIA, pastikan lengkap 16 digit'
    };
  }

  const urut = clean.substring(12, 16);
  if (urut === '0000') {
    return {
      status: 'TEMP_ZEROS',
      badgeLabel: 'Ujung 0000',
      badgeColor: 'amber',
      alasan: '4 Digit terakhir 0000 (Nomor urut kependudukan sementara/belum verifikasi KIA/KK)',
      rekomendasi: 'Mintakan FC Kartu Keluarga asli ke wali murid / ibu penerima manfaat'
    };
  }

  let tgl = parseInt(clean.substring(6, 8), 10);
  if (tgl > 40) tgl -= 40; // perempuan
  const bln = parseInt(clean.substring(8, 10), 10);
  if (tgl < 1 || tgl > 31 || bln < 1 || bln > 12) {
    return {
      status: 'INVALID_DATE',
      badgeLabel: 'Format Tgl Salah',
      badgeColor: 'red',
      alasan: 'Kombinasi tanggal/bulan pada NIK tidak logis',
      rekomendasi: 'Verifikasi ulang tanggal lahir dan NIK pada Kartu Keluarga'
    };
  }

  return {
    status: 'VALID',
    badgeLabel: 'Valid',
    badgeColor: 'green',
    alasan: 'Format NIK 16 Digit Sesuai Standar Dukcapil',
    rekomendasi: 'Data NIK terverifikasi sesuai standar'
  };
}

export function validateNikStructure(nik: string): NikValidationResult {
  const audit = auditNik(nik);

  if (audit.status !== 'VALID') {
    return {
      isValid: false,
      message: audit.alasan
    };
  }

  const cleanNik = nik.trim();
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
    message: 'Format NIK Valid',
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
    console.warn('Supabase duplicate NIK check exception:', err);
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
