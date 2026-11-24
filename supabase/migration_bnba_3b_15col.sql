-- ============================================================
-- Migration: 15-Column BNBA 3B (Posyandu) Schema Extension
-- Table: public.penerima_manfaat_bnba
-- Execute this SQL script in Supabase SQL Editor.
-- ============================================================

ALTER TABLE public.penerima_manfaat_bnba
  ADD COLUMN IF NOT EXISTS gender VARCHAR(10),
  ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'nik',
  ADD COLUMN IF NOT EXISTS identity_code VARCHAR(50),
  ADD COLUMN IF NOT EXISTS kategori VARCHAR(50),
  ADD COLUMN IF NOT EXISTS sub_kategori VARCHAR(100),
  ADD COLUMN IF NOT EXISTS hpht DATE,
  ADD COLUMN IF NOT EXISTS nama_anak VARCHAR(255),
  ADD COLUMN IF NOT EXISTS type_identity_anak VARCHAR(20) DEFAULT 'nik',
  ADD COLUMN IF NOT EXISTS identity_code_anak VARCHAR(50),
  ADD COLUMN IF NOT EXISTS tanggal_lahir_anak DATE,
  ADD COLUMN IF NOT EXISTS nama_ibu VARCHAR(255),
  ADD COLUMN IF NOT EXISTS type_identity_ibu VARCHAR(20) DEFAULT 'nik',
  ADD COLUMN IF NOT EXISTS identity_code_ibu VARCHAR(50);

-- Backfill core mirror columns for existing records
UPDATE public.penerima_manfaat_bnba
SET
  gender = COALESCE(gender, jenis_kelamin),
  type = COALESCE(type, 'nik'),
  identity_code = COALESCE(identity_code, nisn_nik, nik),
  kategori = COALESCE(kategori, CASE WHEN posisi IN ('Balita', 'Bumil', 'Busui') THEN 'POS' ELSE NULL END),
  sub_kategori = COALESCE(
    sub_kategori,
    CASE
      WHEN posisi = 'Bumil' THEN 'POS - Ibu Hamil'
      WHEN posisi = 'Busui' THEN 'POS - Ibu Menyusui'
      WHEN posisi = 'Balita' THEN 'POS - Balita'
      ELSE NULL
    END
  )
WHERE gender IS NULL OR identity_code IS NULL OR (posisi IN ('Balita', 'Bumil', 'Busui') AND sub_kategori IS NULL);

CREATE INDEX IF NOT EXISTS idx_bnba_identity_code ON public.penerima_manfaat_bnba(identity_code);
CREATE INDEX IF NOT EXISTS idx_bnba_sub_kategori ON public.penerima_manfaat_bnba(sub_kategori);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
