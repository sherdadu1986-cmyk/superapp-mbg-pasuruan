-- ============================================================
-- BGN (Badan Gizi Nasional) Super App Schema Migration
-- Module: Kelompok Penerima Manfaat & Penerima Manfaat BNBA
-- Execute this SQL script in Supabase SQL Editor.
-- ============================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table: kelompok_penerima_manfaat
CREATE TABLE IF NOT EXISTS public.kelompok_penerima_manfaat (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama VARCHAR(255) NOT NULL,
    kategori VARCHAR(100) NOT NULL, -- 'KB', 'PAUD', 'TK', 'RA', 'SD', 'SMP', 'SMA', 'POSYANDU_3B'
    sub_kategori VARCHAR(100),       -- 'Balita', 'Bumil', 'Busui'
    identitas_npsn_tmp VARCHAR(100) NOT NULL,
    kode VARCHAR(50) UNIQUE NOT NULL,
    wilayah TEXT NOT NULL,
    kepemilikan VARCHAR(50) DEFAULT 'Negeri',
    kecamatan VARCHAR(100) DEFAULT 'WONOREJO',
    kel_desa VARCHAR(100) DEFAULT 'WONOREJO',
    alamat TEXT,
    target_pria INT DEFAULT 0,
    target_wanita INT DEFAULT 0,
    target_guru INT DEFAULT 0,
    target_tendik INT DEFAULT 0,
    jumlah_penerima INT NOT NULL DEFAULT 0,
    pimpinan VARCHAR(255),
    hp VARCHAR(50),
    email VARCHAR(150),
    status VARCHAR(50) NOT NULL DEFAULT 'Aktif',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table: penerima_manfaat_bnba (By Name By Address)
CREATE TABLE IF NOT EXISTS public.penerima_manfaat_bnba (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kelompok_id VARCHAR(100) NOT NULL,
    nisn_nik VARCHAR(50) NOT NULL,
    nama_lengkap VARCHAR(255) NOT NULL,
    tanggal_lahir VARCHAR(50) NOT NULL,
    jenis_kelamin CHAR(1) NOT NULL CHECK (jenis_kelamin IN ('L', 'P')),
    nama_ortu VARCHAR(255) DEFAULT '-',
    posisi VARCHAR(50) NOT NULL CHECK (posisi IN ('Siswa', 'Tendik', 'Balita', 'Bumil', 'Busui')),
    kelas VARCHAR(50) DEFAULT '-',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for high-performance querying
CREATE INDEX IF NOT EXISTS idx_kpm_status ON public.kelompok_penerima_manfaat(status);
CREATE INDEX IF NOT EXISTS idx_kpm_kode ON public.kelompok_penerima_manfaat(kode);
CREATE INDEX IF NOT EXISTS idx_bnba_kelompok_id ON public.penerima_manfaat_bnba(kelompok_id);
CREATE INDEX IF NOT EXISTS idx_bnba_nisn_nik ON public.penerima_manfaat_bnba(nisn_nik);

-- Row Level Security (RLS) Policies (Public Access for Operational App)
ALTER TABLE public.kelompok_penerima_manfaat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.penerima_manfaat_bnba ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on kelompok_penerima_manfaat" 
    ON public.kelompok_penerima_manfaat FOR SELECT USING (true);

CREATE POLICY "Allow public insert/update access on kelompok_penerima_manfaat" 
    ON public.kelompok_penerima_manfaat FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access on penerima_manfaat_bnba" 
    ON public.penerima_manfaat_bnba FOR SELECT USING (true);

CREATE POLICY "Allow public insert/update/delete access on penerima_manfaat_bnba" 
    ON public.penerima_manfaat_bnba FOR ALL USING (true) WITH CHECK (true);

-- Seed Initial Data if empty
INSERT INTO public.kelompok_penerima_manfaat 
(kode, nama, kategori, sub_kategori, identitas_npsn_tmp, wilayah, kepemilikan, kecamatan, kel_desa, alamat, target_pria, target_wanita, target_guru, target_tendik, jumlah_penerima, pimpinan, hp, email, status)
VALUES
('kpm-1', 'POSYANDU WONOREJO', 'POSYANDU_3B', 'Busui', '11111111111111', 'JAWA TIMUR · PASURUAN · WONOREJO · WONOREJO', 'Negeri', 'WONOREJO', 'WONOREJO', 'Wonorejo Pasuruan', 0, 67, 0, 0, 67, 'IBU NURUL HAYATI', '085784249845', 'posyandu.wonorejo1@gmail.com', 'Aktif'),
('kpm-2', 'POSYANDU WONOREJO', 'POSYANDU_3B', 'Balita', '00000000000000', 'JAWA TIMUR · PASURUAN · WONOREJO · WONOREJO', 'Negeri', 'WONOREJO', 'WONOREJO', 'Wonorejo Pasuruan', 179, 129, 0, 0, 308, 'IBU KHANIFAH', '081234567890', 'posyandu.balita@wonorejo.id', 'Aktif'),
('kpm-3', 'POSYANDU WONOREJO', 'POSYANDU_3B', 'Bumil', '09909090', 'JAWA TIMUR · PASURUAN · WONOREJO · WONOREJO', 'Negeri', 'WONOREJO', 'WONOREJO', 'Wonorejo Pasuruan', 0, 32, 0, 0, 32, 'IBU ROFI''AH', '081987654321', 'bumil.wonorejo@gmail.com', 'Aktif'),
('kpm-4', 'MTSN 4 PASURUAN', 'SMP/MTS', NULL, '20582152', 'JAWA TIMUR · PASURUAN · WONOREJO · WONOREJO', 'Negeri', 'WONOREJO', 'WONOREJO', 'Alun-Alun Besaran', 216, 172, 0, 40, 428, 'AKHMAD FAUZI, S.Ag, M.PdI', '081333444555', 'mtsn4pasuruan@kemenag.go.id', 'Aktif'),
('kpm-5', 'SMPN 2 WONOREJO', 'SMP/MTS', NULL, '20541400', 'JAWA TIMUR · PASURUAN · WONOREJO · WONOREJO', 'Negeri', 'WONOREJO', 'WONOREJO', 'Jl. Raya Wonorejo No. 12', 139, 85, 0, 20, 244, 'BAPAK SUGENG', '081233445566', 'smpn2wonorejo@kemdikbud.go.id', 'Aktif'),
('kpm-6', 'KB MELATI DESA WONOSARI', 'KB/PAUD', NULL, '69880987', 'JAWA TIMUR · PASURUAN · WONOREJO · WONOSARI', 'Swasta', 'WONOREJO', 'WONOSARI', 'Wonosari Wonorejo Pasuruan', 4, 2, 0, 3, 9, 'Susi yusniasari', '085233112233', 'kbmelati.wonosari@gmail.com', 'Aktif'),
('kpm-7', 'TK PKK IV DESA WONOSARI', 'TK/RA', NULL, '20552433', 'JAWA TIMUR · PASURUAN · WONOREJO · WONOSARI', 'Swasta', 'WONOREJO', 'WONOSARI', 'Wonosari Wonorejo Pasuruan', 11, 14, 0, 3, 28, 'NUR AFIFAH, S.Pd', '081399887766', 'tkpkk4wonosari@gmail.com', 'Aktif')
ON CONFLICT (kode) DO NOTHING;

-- 3. Table: menu_harian
CREATE TABLE IF NOT EXISTS public.menu_harian (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tanggal DATE NOT NULL,
    nama_menu VARCHAR(255) NOT NULL,
    foto_url TEXT,
    komposisi_gizi TEXT[],
    kalori VARCHAR(50),
    target_porsi INT DEFAULT 4850,
    porsi_kecil INT DEFAULT 0,
    porsi_besar INT DEFAULT 0,
    catatan TEXT,
    status VARCHAR(50) DEFAULT 'Siap Distribusi',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.menu_harian ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all access on menu_harian" 
    ON public.menu_harian FOR ALL USING (true) WITH CHECK (true);

-- 4. Table: relawan_sppg
CREATE TABLE IF NOT EXISTS public.relawan_sppg (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama_lengkap VARCHAR(255) NOT NULL,
    nik VARCHAR(50) UNIQUE NOT NULL,
    divisi VARCHAR(100) NOT NULL DEFAULT 'PENGOLAHAN',
    email VARCHAR(150),
    tempat_lahir VARCHAR(100),
    tanggal_lahir DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'Aktif',
    no_hp VARCHAR(50),
    pendidikan_terakhir VARCHAR(50),
    mulai_bekerja DATE,
    alamat TEXT,
    no_bpjstk VARCHAR(50),
    no_rekening_bni VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for relawan_sppg query performance
CREATE INDEX IF NOT EXISTS idx_relawan_nik ON public.relawan_sppg(nik);
CREATE INDEX IF NOT EXISTS idx_relawan_divisi ON public.relawan_sppg(divisi);

-- RLS Policy for relawan_sppg
ALTER TABLE public.relawan_sppg ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'relawan_sppg' AND policyname = 'Enable all operations for relawan_sppg'
    ) THEN 
        CREATE POLICY "Enable all operations for relawan_sppg" 
            ON public.relawan_sppg 
            FOR ALL 
            TO public 
            USING (true) 
            WITH CHECK (true); 
    END IF; 
END $$;

-- Sync & Fix Foreign Key mapping for SDN Tamansari & other imported BNBA records
UPDATE public.penerima_manfaat_bnba
SET kelompok_id = COALESCE(
    (SELECT id::text FROM public.kelompok_penerima_manfaat WHERE identitas_npsn_tmp = '20518988' OR kode = '20518988' OR nama ILIKE '%TAMANSARI%' LIMIT 1),
    kelompok_id
)
WHERE (kelompok_id IS NULL OR kelompok_id = '' OR kelompok_id = '20518988') 
  AND (nisn_nik ILIKE '%20518988%' OR kelompok_id = '20518988');

