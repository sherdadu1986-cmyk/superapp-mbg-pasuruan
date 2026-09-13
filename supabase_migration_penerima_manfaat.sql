-- ============================================================
-- SCRIPT: Migrasi Tabel Penerima Manfaat SPPG Kiduldalem
-- Super App Modul 1: Data Penerima Manfaat
-- Jalankan di Supabase SQL Editor (satu kali saja)
-- ============================================================

-- ─── 1. Tabel Lembaga/Sekolah ───────────────────────────────
CREATE TABLE IF NOT EXISTS lembaga_sekolah (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_sekolah TEXT NOT NULL,
  jenjang TEXT NOT NULL CHECK (jenjang IN ('KB_PAUD', 'TK_RA', 'SD_MI', 'SMP_MTS', 'SMA_SMK_MA')),
  alamat TEXT,
  kontak TEXT,
  penanggung_jawab TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 2. Tabel Penerima Manfaat Siswa ────────────────────────
CREATE TABLE IF NOT EXISTS penerima_manfaat_siswa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  jenis_kelamin TEXT CHECK (jenis_kelamin IN ('L', 'P')),
  tanggal_lahir DATE,
  lembaga_id UUID REFERENCES lembaga_sekolah(id) ON DELETE SET NULL,
  kelas TEXT,
  status_aktif BOOLEAN DEFAULT true,
  catatan_alergi TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 3. Tabel Penerima Manfaat 3B (Balita, Bumil, Busui) ───
CREATE TABLE IF NOT EXISTS penerima_manfaat_3b (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  kategori TEXT NOT NULL CHECK (kategori IN ('balita', 'bumil', 'busui')),
  nik TEXT,
  tanggal_lahir DATE,
  usia_kehamilan TEXT,
  nama_wali_atau_anak TEXT,
  rt_rw TEXT,
  kontak TEXT,
  status_gizi TEXT,
  catatan_alergi TEXT,
  status_aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 4. Indexes untuk performa query ────────────────────────
CREATE INDEX IF NOT EXISTS idx_lembaga_jenjang ON lembaga_sekolah(jenjang);
CREATE INDEX IF NOT EXISTS idx_siswa_lembaga ON penerima_manfaat_siswa(lembaga_id);
CREATE INDEX IF NOT EXISTS idx_siswa_status ON penerima_manfaat_siswa(status_aktif);
CREATE INDEX IF NOT EXISTS idx_3b_kategori ON penerima_manfaat_3b(kategori);
CREATE INDEX IF NOT EXISTS idx_3b_status ON penerima_manfaat_3b(status_aktif);

-- ─── 5. RLS Policies ────────────────────────────────────────

-- Lembaga Sekolah
ALTER TABLE lembaga_sekolah ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read lembaga_sekolah" ON lembaga_sekolah;
CREATE POLICY "Allow read lembaga_sekolah"
  ON lembaga_sekolah FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert lembaga_sekolah" ON lembaga_sekolah;
CREATE POLICY "Allow insert lembaga_sekolah"
  ON lembaga_sekolah FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update lembaga_sekolah" ON lembaga_sekolah;
CREATE POLICY "Allow update lembaga_sekolah"
  ON lembaga_sekolah FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete lembaga_sekolah" ON lembaga_sekolah;
CREATE POLICY "Allow delete lembaga_sekolah"
  ON lembaga_sekolah FOR DELETE USING (true);

-- Penerima Manfaat Siswa
ALTER TABLE penerima_manfaat_siswa ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read penerima_manfaat_siswa" ON penerima_manfaat_siswa;
CREATE POLICY "Allow read penerima_manfaat_siswa"
  ON penerima_manfaat_siswa FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert penerima_manfaat_siswa" ON penerima_manfaat_siswa;
CREATE POLICY "Allow insert penerima_manfaat_siswa"
  ON penerima_manfaat_siswa FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update penerima_manfaat_siswa" ON penerima_manfaat_siswa;
CREATE POLICY "Allow update penerima_manfaat_siswa"
  ON penerima_manfaat_siswa FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete penerima_manfaat_siswa" ON penerima_manfaat_siswa;
CREATE POLICY "Allow delete penerima_manfaat_siswa"
  ON penerima_manfaat_siswa FOR DELETE USING (true);

-- Penerima Manfaat 3B
ALTER TABLE penerima_manfaat_3b ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read penerima_manfaat_3b" ON penerima_manfaat_3b;
CREATE POLICY "Allow read penerima_manfaat_3b"
  ON penerima_manfaat_3b FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert penerima_manfaat_3b" ON penerima_manfaat_3b;
CREATE POLICY "Allow insert penerima_manfaat_3b"
  ON penerima_manfaat_3b FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update penerima_manfaat_3b" ON penerima_manfaat_3b;
CREATE POLICY "Allow update penerima_manfaat_3b"
  ON penerima_manfaat_3b FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete penerima_manfaat_3b" ON penerima_manfaat_3b;
CREATE POLICY "Allow delete penerima_manfaat_3b"
  ON penerima_manfaat_3b FOR DELETE USING (true);
