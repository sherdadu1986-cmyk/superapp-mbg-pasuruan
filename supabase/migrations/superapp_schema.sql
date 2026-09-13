-- ============================================================
-- SPPG SUPER APP DATABASE SCHEMA MIGRATION
-- ============================================================

-- 1. TABEL PROFIL SPPG (sppg_profile)
CREATE TABLE IF NOT EXISTS public.sppg_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_unit TEXT NOT NULL DEFAULT 'SPPG PASURUAN WONOREJO',
    penanggung_jawab TEXT DEFAULT 'Ahmad Sayyidani Haqiqi, S.Pd.',
    wilayah TEXT DEFAULT 'JAWA TIMUR · PASURUAN · WONOREJO · WONOREJO',
    kapasitas_harian INT DEFAULT 5000,
    status_operasional TEXT DEFAULT 'Aktif',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL KELOMPOK PENERIMA MANFAAT (kelompok_penerima_manfaat)
CREATE TABLE IF NOT EXISTS public.kelompok_penerima_manfaat (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama TEXT NOT NULL,
    kategori TEXT NOT NULL, -- 'KB/PAUD', 'TK/RA', 'SD/MI', 'SMP/MTS', 'SMA/SMK/MA', 'POSYANDU_3B'
    sub_kategori TEXT,       -- 'Balita', 'Bumil', 'Busui' (khusus POSYANDU_3B)
    identitas_npsn_tmp TEXT,  -- NPSN / NSM / tmp ID
    kode TEXT UNIQUE NOT NULL,
    wilayah TEXT DEFAULT 'JAWA TIMUR · PASURUAN · WONOREJO · WONOREJO',
    jumlah_penerima INT DEFAULT 0,
    status TEXT DEFAULT 'Aktif',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL MENU HARIAN (menu_harian)
CREATE TABLE IF NOT EXISTS public.menu_harian (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    nama_menu TEXT NOT NULL,
    foto_url TEXT,
    komposisi_gizi TEXT[] DEFAULT ARRAY['Karbohidrat', 'Protein Hewani', 'Sayuran', 'Buah', 'Susu'],
    kalori TEXT DEFAULT '~650 kkal',
    target_porsi INT DEFAULT 4850,
    status TEXT DEFAULT 'Siap Distribusi',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.sppg_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kelompok_penerima_manfaat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_harian ENABLE ROW LEVEL SECURITY;

-- Policy Public Access Read/Write (Demo Mode)
DROP POLICY IF EXISTS "Public read sppg_profile" ON public.sppg_profile;
CREATE POLICY "Public read sppg_profile" ON public.sppg_profile FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public write sppg_profile" ON public.sppg_profile;
CREATE POLICY "Public write sppg_profile" ON public.sppg_profile FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read kelompok_penerima_manfaat" ON public.kelompok_penerima_manfaat;
CREATE POLICY "Public read kelompok_penerima_manfaat" ON public.kelompok_penerima_manfaat FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public write kelompok_penerima_manfaat" ON public.kelompok_penerima_manfaat;
CREATE POLICY "Public write kelompok_penerima_manfaat" ON public.kelompok_penerima_manfaat FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read menu_harian" ON public.menu_harian;
CREATE POLICY "Public read menu_harian" ON public.menu_harian FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public write menu_harian" ON public.menu_harian;
CREATE POLICY "Public write menu_harian" ON public.menu_harian FOR ALL USING (true);

-- 5. INITIAL SEED DATA
INSERT INTO public.sppg_profile (nama_unit, penanggung_jawab, wilayah, kapasitas_harian, status_operasional)
VALUES ('SPPG PASURUAN WONOREJO', 'Ahmad Sayyidani Haqiqi, S.Pd.', 'JAWA TIMUR · PASURUAN · WONOREJO · WONOREJO', 5000, 'Aktif')
ON CONFLICT DO NOTHING;

INSERT INTO public.kelompok_penerima_manfaat (nama, kategori, sub_kategori, identitas_npsn_tmp, kode, wilayah, jumlah_penerima, status)
VALUES
('3B POSYANDU UTAMA', 'POSYANDU_3B', 'Balita', 'tmp: TMP-K8395745266', 'K8395745266', 'JAWA TIMUR · PASURUAN · WONOREJO · WONOREJO', 640, 'Aktif'),
('RA USWATUN HASANAH', 'TK/RA', NULL, 'NPSN: 69746343 NSM: 101235140356', 'K9282069580', 'JAWA TIMUR · PASURUAN · WONOREJO · WONOREJO', 210, 'Aktif'),
('KB HARAPAN', 'KB/PAUD', NULL, 'NPSN: 69873373', 'K4829104821', 'JAWA TIMUR · PASURUAN · WONOREJO · WONOREJO', 180, 'Aktif'),
('MTSN 4 PASURUAN', 'SMP/MTS', NULL, 'NPSN: 20582152', 'K5920194812', 'JAWA TIMUR · PASURUAN · WONOREJO · WONOREJO', 480, 'Aktif'),
('TK AL-ALAWIYAH', 'TK/RA', NULL, 'NPSN: 69812401', 'K1029481920', 'JAWA TIMUR · PASURUAN · WONOREJO · WONOREJO', 210, 'Aktif'),
('SDN WONOREJO V WONOREJO', 'SD/MI', NULL, 'NPSN: 20518921', 'K9281048291', 'JAWA TIMUR · PASURUAN · WONOREJO · WONOREJO', 390, 'Aktif'),
('SD NEGERI WONOREJO I', 'SD/MI', NULL, 'NPSN: 20518925', 'K8291048292', 'JAWA TIMUR · PASURUAN · WONOREJO · WONOREJO', 420, 'Aktif'),
('KB AN-NUR', 'KB/PAUD', NULL, 'NPSN: 69873374', 'K7291048293', 'JAWA TIMUR · PASURUAN · WONOREJO · WONOREJO', 180, 'Aktif'),
('POSYANDU MAWAR', 'POSYANDU_3B', 'Bumil', 'tmp: TMP-K3819203819', 'K6291048294', 'JAWA TIMUR · PASURUAN · WONOREJO · WONOREJO', 145, 'Aktif'),
('SMPN 1 WONOREJO', 'SMP/MTS', NULL, 'NPSN: 20518900', 'K5291048295', 'JAWA TIMUR · PASURUAN · WONOREJO · WONOREJO', 500, 'Aktif'),
('SMAN 1 WONOREJO', 'SMA/SMK/MA', NULL, 'NPSN: 20518901', 'K4291048296', 'JAWA TIMUR · PASURUAN · WONOREJO · WONOREJO', 780, 'Aktif')
ON CONFLICT (kode) DO NOTHING;

INSERT INTO public.menu_harian (tanggal, nama_menu, foto_url, komposisi_gizi, kalori, target_porsi, status)
VALUES
(CURRENT_DATE, 'Nasi Ayam Teriyaki, Tumis Brokoli & Buah Pisang', '/menu-today.png', ARRAY['Karbohidrat', 'Protein Hewani', 'Sayuran', 'Buah', 'Susu'], '~650 kkal', 4850, 'Siap Distribusi')
ON CONFLICT DO NOTHING;
