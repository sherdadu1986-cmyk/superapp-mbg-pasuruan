import { supabase } from './supabase'

/**
 * Menerima/mengaktifkan akun (Korwil & Admin memanggil logika yang sama)
 * @param userId ID pada tabel users_app
 */
export async function verifyAccount(userId: string) {
  // Gunakan 'role' sebagai Single Source of Truth penentu akses SPPG
  const { error } = await supabase
    .from('users_app')
    .update({ role: 'sppg', status: 'aktif' }) // Set status aktif juga berjaga-jaga jika ada relasi UI lain
    .eq('id', userId)

  if (error) throw error
  return true
}

/**
 * Menolak & Menghapus akun (Hard Delete)
 * @param userId ID pada tabel users_app
 * @param unitId ID pada tabel daftar_sppg (sppg_unit_id)
 */
export async function rejectAccount(userId: string, unitId: string) {
  // 1. Hapus kredensial dari tabel users_app
  const { error: userErr } = await supabase.from('users_app').delete().eq('id', userId)
  if (userErr) throw userErr

  // 2. Terkait unitId, pastikan kita hapus rekam jejaknya dari DB
  if (unitId) {
    // A. Hapus realisasi sekolah yg mengikat
    await supabase.from('daftar_sekolah').delete().eq('sppg_id', unitId)
    // B. Hapus laporan harian 
    await supabase.from('laporan_harian_final').delete().eq('unit_id', unitId)
    // C. Bongkar profil sppg nya
    await supabase.from('daftar_sppg').delete().eq('id', unitId)
  }

  return true
}
