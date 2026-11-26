-- ============================================================
-- BGN (Badan Gizi Nasional) Super App Schema Migration
-- Module: Laporan Relawan Harian (Kolase Foto & Timemark)
-- Execute this SQL script in Supabase SQL Editor.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Table: public.laporan_relawan
CREATE TABLE IF NOT EXISTS public.laporan_relawan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    tanggal_laporan DATE NOT NULL DEFAULT CURRENT_DATE,
    waktu_laporan VARCHAR(10) NOT NULL,
    divisi VARCHAR(100) NOT NULL,
    nama_relawan VARCHAR(255) NOT NULL,
    keterangan TEXT,
    lokasi_alamat TEXT,
    koordinat_gps VARCHAR(100),
    kode_foto VARCHAR(100),
    image_url TEXT NOT NULL
);

-- Indexes for fast filtering by date, division, and recency
CREATE INDEX IF NOT EXISTS idx_laporan_relawan_tanggal ON public.laporan_relawan(tanggal_laporan DESC);
CREATE INDEX IF NOT EXISTS idx_laporan_relawan_divisi ON public.laporan_relawan(divisi);
CREATE INDEX IF NOT EXISTS idx_laporan_relawan_created_at ON public.laporan_relawan(created_at DESC);

-- Enable RLS with operational public policies matching SPPG app tables
ALTER TABLE public.laporan_relawan ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'laporan_relawan'
          AND policyname = 'Allow public read access on laporan_relawan'
    ) THEN
        CREATE POLICY "Allow public read access on laporan_relawan"
            ON public.laporan_relawan
            FOR SELECT
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'laporan_relawan'
          AND policyname = 'Allow public insert update delete on laporan_relawan'
    ) THEN
        CREATE POLICY "Allow public insert update delete on laporan_relawan"
            ON public.laporan_relawan
            FOR ALL
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

-- 2. Public Storage Bucket: laporan-relawan
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'laporan-relawan',
    'laporan-relawan',
    true,
    10485760,
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Storage RLS Policies for bucket laporan-relawan
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'storage'
          AND tablename = 'objects'
          AND policyname = 'Public read laporan-relawan storage'
    ) THEN
        CREATE POLICY "Public read laporan-relawan storage"
            ON storage.objects
            FOR SELECT
            USING (bucket_id = 'laporan-relawan');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'storage'
          AND tablename = 'objects'
          AND policyname = 'Public upload laporan-relawan storage'
    ) THEN
        CREATE POLICY "Public upload laporan-relawan storage"
            ON storage.objects
            FOR INSERT
            WITH CHECK (bucket_id = 'laporan-relawan');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'storage'
          AND tablename = 'objects'
          AND policyname = 'Public update laporan-relawan storage'
    ) THEN
        CREATE POLICY "Public update laporan-relawan storage"
            ON storage.objects
            FOR UPDATE
            USING (bucket_id = 'laporan-relawan')
            WITH CHECK (bucket_id = 'laporan-relawan');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'storage'
          AND tablename = 'objects'
          AND policyname = 'Public delete laporan-relawan storage'
    ) THEN
        CREATE POLICY "Public delete laporan-relawan storage"
            ON storage.objects
            FOR DELETE
            USING (bucket_id = 'laporan-relawan');
    END IF;
END $$;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
