-- ============================================================
-- Script SQL untuk Supabase: Tabel daftar_sppg
-- Jalankan di Supabase SQL Editor (https://app.supabase.com)
-- ============================================================

-- 1. Tambah kolom id_dapur (kode seri dapur, misal: DAPUR-001)
ALTER TABLE daftar_sppg ADD COLUMN IF NOT EXISTS id_dapur TEXT;

-- 2. Tambah kolom legalitas (boolean)
ALTER TABLE daftar_sppg ADD COLUMN IF NOT EXISTS ikl BOOLEAN DEFAULT false;
ALTER TABLE daftar_sppg ADD COLUMN IF NOT EXISTS slhs BOOLEAN DEFAULT false;
ALTER TABLE daftar_sppg ADD COLUMN IF NOT EXISTS smo BOOLEAN DEFAULT false;
ALTER TABLE daftar_sppg ADD COLUMN IF NOT EXISTS bpjs BOOLEAN DEFAULT false;

-- 3. Tambah kolom profil lainnya yang mungkin belum ada
ALTER TABLE daftar_sppg ADD COLUMN IF NOT EXISTS no TEXT;
ALTER TABLE daftar_sppg ADD COLUMN IF NOT EXISTS sppi_batch TEXT;
ALTER TABLE daftar_sppg ADD COLUMN IF NOT EXISTS gelar_ka_sppg TEXT;
ALTER TABLE daftar_sppg ADD COLUMN IF NOT EXISTS no_hp_ka_sppg TEXT;
ALTER TABLE daftar_sppg ADD COLUMN IF NOT EXISTS skep_nomor TEXT;
ALTER TABLE daftar_sppg ADD COLUMN IF NOT EXISTS id_sppg TEXT;
ALTER TABLE daftar_sppg ADD COLUMN IF NOT EXISTS tanggal_operasional TEXT;
ALTER TABLE daftar_sppg ADD COLUMN IF NOT EXISTS alamat TEXT;
ALTER TABLE daftar_sppg ADD COLUMN IF NOT EXISTS gmaps TEXT;
ALTER TABLE daftar_sppg ADD COLUMN IF NOT EXISTS nama_mitra TEXT;
ALTER TABLE daftar_sppg ADD COLUMN IF NOT EXISTS no_hp_mitra TEXT;
ALTER TABLE daftar_sppg ADD COLUMN IF NOT EXISTS yayasan TEXT;
ALTER TABLE daftar_sppg ADD COLUMN IF NOT EXISTS nama_perwakilan_yayasan TEXT;
ALTER TABLE daftar_sppg ADD COLUMN IF NOT EXISTS no_hp_perwakilan_yayasan TEXT;

-- ============================================================
-- 4. RLS (Row Level Security) — Izinkan UPDATE untuk semua user
-- ============================================================

-- Aktifkan RLS jika belum
ALTER TABLE daftar_sppg ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama (jika ada) lalu buat ulang
DROP POLICY IF EXISTS "Allow read daftar_sppg" ON daftar_sppg;
CREATE POLICY "Allow read daftar_sppg"
  ON daftar_sppg
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow update daftar_sppg" ON daftar_sppg;
CREATE POLICY "Allow update daftar_sppg"
  ON daftar_sppg
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow insert daftar_sppg" ON daftar_sppg;
CREATE POLICY "Allow insert daftar_sppg"
  ON daftar_sppg
  FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- CATATAN:
-- Jika masih error 'policy', coba nonaktifkan RLS sementara:
--   ALTER TABLE daftar_sppg DISABLE ROW LEVEL SECURITY;
--
-- Atau gunakan Supabase Dashboard > Authentication > Policies
-- untuk mengatur policy secara visual.
-- ============================================================
