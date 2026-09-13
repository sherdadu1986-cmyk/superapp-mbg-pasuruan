"use client"
import React, { useState, useEffect } from 'react'
import { UtensilsCrossed, Upload, Check, Image as ImageIcon, ArrowLeft, RotateCw, Save } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { fetchMenuHariIniDB, saveMenuHariIniDB, type MenuHarianDB } from '@/lib/data-helpers'

export default function KelolaMenuHarianPage() {
  const router = useRouter()
  const [namaMenu, setNamaMenu] = useState('Nasi Ayam Teriyaki, Tumis Brokoli & Buah Pisang')
  const [tanggal, setTanggal] = useState('2026-09-14')
  const [targetPorsi, setTargetPorsi] = useState(4850)
  const [kalori, setKalori] = useState('~650 kkal')
  const [status, setStatus] = useState('Siap Distribusi')
  const [tags, setTags] = useState<string[]>(['Karbohidrat', 'Protein Hewani', 'Sayuran', 'Buah', 'Susu'])
  const [fotoUrl, setFotoUrl] = useState('/menu-today.png')

  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [allTags] = useState<string[]>(['Karbohidrat', 'Protein Hewani', 'Sayuran', 'Buah', 'Susu', 'Serat Tinggi', 'Rendah Gula'])

  const loadCurrentMenu = async () => {
    const data = await fetchMenuHariIniDB()
    if (data) {
      if (data.nama_menu) setNamaMenu(data.nama_menu)
      if (data.tanggal) setTanggal(data.tanggal)
      if (data.target_porsi) setTargetPorsi(data.target_porsi)
      if (data.kalori) setKalori(data.kalori)
      if (data.status) setStatus(data.status)
      if (data.komposisi_gizi && data.komposisi_gizi.length > 0) setTags(data.komposisi_gizi)
      if (data.foto_url) setFotoUrl(data.foto_url)
    }
  }

  useEffect(() => {
    loadCurrentMenu()
  }, [])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        setFotoUrl(base64)
      }
      reader.readAsDataURL(file)
    }
  }

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const payload: MenuHarianDB = {
      tanggal,
      nama_menu: namaMenu,
      foto_url: fotoUrl,
      komposisi_gizi: tags,
      kalori,
      target_porsi: Number(targetPorsi),
      status
    }

    await saveMenuHariIniDB(payload)
    setSaving(false)
    setSavedSuccess(true)

    setTimeout(() => {
      setSavedSuccess(false)
      router.push('/')
    }, 1200)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans text-gray-800 pb-12">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <Link href="/" className="hover:text-emerald-700 font-medium flex items-center gap-1">
              <ArrowLeft size={12} /> Beranda
            </Link>
            <span>/</span>
            <span>Operasional</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <UtensilsCrossed size={20} className="text-amber-600" />
            Kelola Menu Makanan Harian (Supabase Sync)
          </h1>
          <p className="text-xs text-gray-500 font-normal mt-0.5">
            Atur rincian menu, komposisi gizi, porsi, dan unggah foto makanan yang tersimpan otomatis ke database.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadCurrentMenu}
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <RotateCw size={13} className="text-gray-500" />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-2xs animate-fadeIn">
          <Check size={16} className="text-emerald-600" />
          <span>Menu harian tersimpan di Supabase! Mengalihkan ke Beranda...</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-xl shadow-2xs p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Nama Menu Makanan Utama *
              </label>
              <input
                type="text"
                required
                value={namaMenu}
                onChange={(e) => setNamaMenu(e.target.value)}
                placeholder="Contoh: Nasi Ayam Teriyaki, Tumis Brokoli & Pisang"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Tanggal Berlaku *
                </label>
                <input
                  type="date"
                  required
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Status Distribusi
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                >
                  <option value="Siap Distribusi">Siap Distribusi</option>
                  <option value="Prosedur Memasak">Prosedur Memasak</option>
                  <option value="Perencanaan Menu">Perencanaan Menu</option>
                  <option value="Selesai Distribusi">Selesai Distribusi</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Target Porsi (Jiwa) *
                </label>
                <input
                  type="number"
                  required
                  value={targetPorsi}
                  onChange={(e) => setTargetPorsi(Number(e.target.value))}
                  placeholder="4850"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Estimasi Kalori
                </label>
                <input
                  type="text"
                  value={kalori}
                  onChange={(e) => setKalori(e.target.value)}
                  placeholder="~650 kkal"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                />
              </div>
            </div>

            {/* Nutrition Composition Tags */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Tag Komposisi Gizi / Komponen
              </label>
              <div className="flex flex-wrap gap-1.5">
                {allTags.map((tag) => {
                  const isSelected = tags.includes(tag)
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-2xs'
                          : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {isSelected ? `✓ ${tag}` : `+ ${tag}`}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Image Preview & Upload */}
          <div className="space-y-4">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Foto Preview Makanan Hari Ini
            </label>
            
            <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-gray-300 bg-gray-50 shadow-2xs flex items-center justify-center group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fotoUrl || '/menu-today.png'}
                alt="Preview Menu Makanan"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/menu-today.png'
                }}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <span className="text-xs text-white font-semibold flex items-center gap-1.5">
                  <ImageIcon size={16} /> Ganti Foto Makanan
                </span>
              </div>
            </div>

            {/* Upload Button Input */}
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="w-full py-2.5 px-4 border border-dashed border-gray-300 hover:border-emerald-500 rounded-xl text-center bg-gray-50/50 hover:bg-emerald-50/30 transition flex items-center justify-center gap-2">
                <Upload size={16} className="text-emerald-600" />
                <span className="text-xs font-semibold text-gray-700">
                  Unggah Foto Baru (PNG, JPG)
                </span>
              </div>
            </div>
            <p className="text-[11px] text-gray-400">
              Disarankan foto bento box/makanan sehat rasio 16:9 dengan pencahayaan terang.
            </p>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <Link
            href="/"
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs transition cursor-pointer flex items-center gap-1.5 border border-emerald-700 disabled:opacity-50"
          >
            {saving ? <RotateCw size={14} className="animate-spin" /> : <Save size={14} />}
            <span>Simpan Menu ke Supabase</span>
          </button>
        </div>
      </form>
    </div>
  )
}
