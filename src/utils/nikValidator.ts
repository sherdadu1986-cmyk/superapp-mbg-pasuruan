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

export function validateNikStructure(nik: string): NikValidationResult {
  const cleanNik = nik.trim();

  // 1. Cek panjang dan hanya angka
  if (!/^\d{16}$/.test(cleanNik)) {
    return { 
      isValid: false, 
      message: cleanNik.length !== 16 
        ? `Panjang NIK harus 16 digit (saat ini ${cleanNik.length} digit)` 
        : 'NIK hanya boleh berisi angka' 
    };
  }

  // 2. Ekstrak bagian kode
  const prov = cleanNik.substring(0, 2);
  const kab = cleanNik.substring(2, 4);
  const kec = cleanNik.substring(4, 6);
  let tgl = parseInt(cleanNik.substring(6, 8), 10);
  const bln = parseInt(cleanNik.substring(8, 10), 10);
  const thn = cleanNik.substring(10, 12);
  const urut = cleanNik.substring(12, 16);

  // Cek kode wilayah dasar
  if (prov === '00' || kab === '00' || kec === '00') {
    return { isValid: false, message: 'Kode wilayah NIK tidak valid' };
  }

  // Cek tanggal & gender (perempuan tanggal lahir + 40)
  let gender: 'Laki-laki' | 'Perempuan' = 'Laki-laki';
  if (tgl > 40) {
    gender = 'Perempuan';
    tgl -= 40;
  }

  if (tgl < 1 || tgl > 31) {
    return { isValid: false, message: 'Format tanggal lahir pada NIK tidak valid (01-31 atau 41-71)' };
  }

  // Cek bulan (01 - 12)
  if (bln < 1 || bln > 12) {
    return { isValid: false, message: 'Format bulan lahir pada NIK tidak valid (01-12)' };
  }

  // Cek nomor urut
  if (urut === '0000') {
    return { isValid: false, message: 'Nomor urut penerbitan NIK tidak valid (0000)' };
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
