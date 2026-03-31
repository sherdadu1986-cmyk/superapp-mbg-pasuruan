-- ============================================================
-- SCRIPT: Migrasi Sertifikasi Standar Kompetensi
-- Tabel: daftar_sppg
-- Jalankan di Supabase SQL Editor (satu kali saja)
-- ============================================================

-- Kolom sertifikasi baru (BOOLEAN, default false)
ALTER TABLE daftar_sppg ADD COLUMN IF NOT EXISTS sertifikat_halal BOOLEAN DEFAULT false;
ALTER TABLE daftar_sppg ADD COLUMN IF NOT EXISTS sertifikat_haccp BOOLEAN DEFAULT false;
ALTER TABLE daftar_sppg ADD COLUMN IF NOT EXISTS sertifikat_chef BOOLEAN DEFAULT false;
ALTER TABLE daftar_sppg ADD COLUMN IF NOT EXISTS sertifikat_iso22000 BOOLEAN DEFAULT false;
ALTER TABLE daftar_sppg ADD COLUMN IF NOT EXISTS sertifikat_iso45001 BOOLEAN DEFAULT false;

-- Catatan:
-- Kolom 'slhs' sudah ada dari migrasi sebelumnya (supabase_migration_profil_sppg.sql)
-- Kolom lama 'ikl', 'smo', 'bpjs' TIDAK dihapus agar data lama tetap aman.
-- Jika ingin membersihkan kolom lama nanti, jalankan:
--   ALTER TABLE daftar_sppg DROP COLUMN IF EXISTS ikl;
--   ALTER TABLE daftar_sppg DROP COLUMN IF EXISTS smo;
--   ALTER TABLE daftar_sppg DROP COLUMN IF EXISTS bpjs;
