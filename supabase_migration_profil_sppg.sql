-- ============================================================
-- SCRIPT FINAL: Migrasi Tabel daftar_sppg
-- Jalankan di Supabase SQL Editor (satu kali saja)
-- ============================================================

-- Kolom Identitas & Info Unit
ALTER TABLE daftar_sppg ADD COLUMN IF NOT EXISTS id_dapur TEXT;
ALTER TABLE daftar_sppg ADD COLUMN IF NOT EXISTS no TEXT;
ALTER TABLE daftar_sppg ADD COLUMN IF NOT EXISTS sppi_batch TEXT;
ALTER TABLE daftar_sppg ADD COLUMN IF NOT EXISTS skep_nomor TEXT;
ALTER TABLE daftar_sppg ADD COLUMN IF NOT EXISTS id_sppg TEXT;
ALTER TABLE daftar_sppg ADD COLUMN IF NOT EXISTS tanggal_operasional TEXT;
ALTER TABLE daftar_sppg ADD COLUMN IF NOT EXISTS kecamatan TEXT;
ALTER TABLE daftar_sppg ADD COLUMN IF NOT EXISTS alamat TEXT;
ALTER TABLE daftar_sppg ADD COLUMN IF NOT EXISTS gmaps TEXT;

-- Kolom Personel Ka SPPG
ALTER TABLE daftar_sppg ADD COLUMN IF NOT EXISTS gelar_ka_sppg TEXT;
ALTER TABLE daftar_sppg ADD COLUMN IF NOT EXISTS no_hp_ka_sppg TEXT;

-- Kolom Mitra
ALTER TABLE daftar_sppg ADD COLUMN IF NOT EXISTS nama_mitra TEXT;
ALTER TABLE daftar_sppg ADD COLUMN IF NOT EXISTS no_hp_mitra TEXT;

-- Kolom Yayasan
ALTER TABLE daftar_sppg ADD COLUMN IF NOT EXISTS yayasan TEXT;
ALTER TABLE daftar_sppg ADD COLUMN IF NOT EXISTS nama_perwakilan_yayasan TEXT;
ALTER TABLE daftar_sppg ADD COLUMN IF NOT EXISTS no_hp_perwakilan_yayasan TEXT;

-- Kolom Legalitas (boolean)
ALTER TABLE daftar_sppg ADD COLUMN IF NOT EXISTS ikl BOOLEAN DEFAULT false;
ALTER TABLE daftar_sppg ADD COLUMN IF NOT EXISTS slhs BOOLEAN DEFAULT false;
ALTER TABLE daftar_sppg ADD COLUMN IF NOT EXISTS smo BOOLEAN DEFAULT false;
ALTER TABLE daftar_sppg ADD COLUMN IF NOT EXISTS bpjs BOOLEAN DEFAULT false;

-- ============================================================
-- RLS Policies
-- ============================================================
ALTER TABLE daftar_sppg ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read daftar_sppg" ON daftar_sppg;
CREATE POLICY "Allow read daftar_sppg"
  ON daftar_sppg FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow update daftar_sppg" ON daftar_sppg;
CREATE POLICY "Allow update daftar_sppg"
  ON daftar_sppg FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow insert daftar_sppg" ON daftar_sppg;
CREATE POLICY "Allow insert daftar_sppg"
  ON daftar_sppg FOR INSERT WITH CHECK (true);
