"use client"
import React, { useState, useEffect, useMemo } from 'react'
import { 
  UtensilsCrossed, Upload, Check, Image as ImageIcon, ArrowLeft, RotateCw, 
  Save, Search, Calendar, Eye, X, AlertTriangle, Clock, Sparkles
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  fetchMenuHariIniDB, 
  saveMenuHariIniDB, 
  fetchMenuHistoryDB, 
  type MenuHarianDB 
} from '@/lib/data-helpers'

export default function KelolaMenuHarianPage() {
  const router = useRouter()

  // Active Menu Form States
  const [namaMenu, setNamaMenu] = useState('Nasi Ayam Teriyaki, Tumis Brokoli & Buah Pisang')
  const [tanggal, setTanggal] = useState('2026-09-14')
  const [targetPorsi, setTargetPorsi] = useState(4850)
  const [kalori, setKalori] = useState('~650 kkal')
  const [status, setStatus] = useState('Siap Distribusi')
  const [tags, setTags] = useState<string[]>(['Karbohidrat', 'Protein Hewani', 'Sayuran', 'Buah', 'Susu'])
  const [fotoUrl, setFotoUrl] = useState('/menu-today.png')
  const [catatanMenu, setCatatanMenu] = useState('Menu standar gizi tinggi protein BGN Pasuruan')

  // Loading & Feedback States
  const [saving, setSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  // Toast Notification State
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success')

  // Menu History States
  const [menuHistory, setMenuHistory] = useState<MenuHarianDB[]>([])
  const [historySearch, setHistorySearch] = useState('')
  const [historyDateFilter, setHistoryDateFilter] = useState('')
  const [loadingHistory, setLoadingHistory] = useState(true)

  // Photo Zoom Preview Modal State
  const [previewModalMenu, setPreviewModalMenu] = useState<MenuHarianDB | null>(null)

  const [allTags] = useState<string[]>([
    'Karbohidrat', 'Protein Hewani', 'Protein Nabati', 'Sayuran', 'Buah', 'Susu', 'Serat Tinggi', 'Rendah Gula'
  ])

  const triggerToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMsg(msg)
    setToastType(type)
    setTimeout(() => setToastMsg(null), 4000)
  }

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
      if (data.catatan) setCatatanMenu(data.catatan)
    }
  }

  const loadHistoryMenu = async () => {
    setLoadingHistory(true)
    try {
      const history = await fetchMenuHistoryDB()
      setMenuHistory(history || [])
    } catch (err) {
      console.error('Error fetching menu history:', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    loadCurrentMenu()
    loadHistoryMenu()
  }, [])

  // ─── File Upload Handler with Validation & Robust Error Catch ─────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 1. Validasi Ukuran File: Maksimal 3MB
    const MAX_SIZE = 3 * 1024 * 1024 // 3MB
    if (file.size > MAX_SIZE) {
      triggerToast('Ukuran file terlalu besar, maksimal 3MB', 'error')
      e.target.value = ''
      return
    }

    // 2. Validasi Format File: Hanya gambar (.jpg, .jpeg, .png, .webp)
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp']
    const fileExt = file.name.split('.').pop()?.toLowerCase() || ''
    const isAllowedFormat = allowedExtensions.includes(fileExt) || file.type.startsWith('image/')
    if (!isAllowedFormat) {
      triggerToast('Format file tidak didukung. Harap unggah gambar (.jpg, .jpeg, .png, .webp)', 'error')
      e.target.value = ''
      return
    }

    setIsUploading(true)

    try {
      // 3. Nama file unik berbasis timestamp agar tidak bentrok
      const fileName = `menu_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt || 'png'}`

      // 4. Unggah ke Supabase Storage (Bucket public 'menu-images')
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('menu-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.warn('Storage upload notice:', uploadError.message)
        // Fallback jika storage bucket belum disetting di Supabase console
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64 = reader.result as string
          setFotoUrl(base64)
          triggerToast('Foto dimuat via lokal fallback. Klik simpan untuk memperbarui.', 'info')
        }
        reader.readAsDataURL(file)
      } else {
        const { data: urlData } = supabase.storage.from('menu-images').getPublicUrl(fileName)
        if (urlData?.publicUrl) {
          setFotoUrl(urlData.publicUrl)
          triggerToast('Foto menu berhasil diunggah ke Supabase Storage!', 'success')
        }
      }
    } catch (err: any) {
      console.error('Error uploading image:', err)
      triggerToast(`Gagal mengunggah foto: ${err.message || 'Terjadi kesalahan'}`, 'error')
    } finally {
      setIsUploading(false)
      e.target.value = ''
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

    try {
      const payload: MenuHarianDB = {
        tanggal,
        nama_menu: namaMenu,
        foto_url: fotoUrl,
        komposisi_gizi: tags,
        kalori,
        target_porsi: Number(targetPorsi),
        status,
        catatan: catatanMenu
      }

      await saveMenuHariIniDB(payload)
      setSavedSuccess(true)
      triggerToast('Menu harian berhasil disimpan ke database!', 'success')

      // Refresh history list dynamically
      loadHistoryMenu()

      setTimeout(() => {
        setSavedSuccess(false)
        router.push('/')
      }, 1200)
    } catch (err: any) {
      console.error('Error saving menu:', err)
      triggerToast(`Gagal menyimpan menu: ${err.message || 'Error'}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  const filteredHistory = useMemo(() => {
    return menuHistory
      .filter((item) => {
        const q = historySearch.toLowerCase().trim()
        const matchSearch =
          !q ||
          item.nama_menu.toLowerCase().includes(q) ||
          item.tanggal.includes(q) ||
          item.kalori.toLowerCase().includes(q) ||
          (item.status && item.status.toLowerCase().includes(q)) ||
          (item.komposisi_gizi && item.komposisi_gizi.some((t) => t.toLowerCase().includes(q)))

        const matchDate = !historyDateFilter || item.tanggal === historyDateFilter

        return matchSearch && matchDate
      })
      .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
  }, [menuHistory, historySearch, historyDateFilter])

  const formatIndonesianDateStr = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return dateStr
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ]
      return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
    } catch {
      return dateStr
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 font-sans text-gray-800 pb-16">
      {/* Toast Alert Banner */}
      {toastMsg && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border text-xs font-bold flex items-center gap-2 animate-bounce ${
          toastType === 'error' 
            ? 'bg-rose-50 border-rose-200 text-rose-800' 
            : toastType === 'info'
            ? 'bg-sky-50 border-sky-200 text-sky-800'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          {toastType === 'error' ? (
            <AlertTriangle size={18} className="text-rose-600 shrink-0" />
          ) : (
            <Check size={18} className="text-emerald-600 shrink-0" />
          )}
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-gray-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <Link href="/" className="hover:text-emerald-700 font-medium flex items-center gap-1">
              <ArrowLeft size={12} /> Beranda Operasional
            </Link>
            <span>/</span>
            <span className="font-semibold text-gray-700">Kelola Menu Harian</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <UtensilsCrossed size={22} className="text-amber-600" />
            Kelola Menu Makanan Harian (Supabase Sync)
          </h1>
          <p className="text-xs text-gray-500 font-normal mt-0.5">
            Atur rincian menu, komposisi gizi, porsi, dan unggah foto makanan yang tersimpan otomatis ke database.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              loadCurrentMenu()
              loadHistoryMenu()
              triggerToast('Data disegarkan dari database', 'info')
            }}
            className="px-3.5 py-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <RotateCw size={14} className="text-gray-500" />
            <span>Segarkan Data</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-2xs">
          <Check size={16} className="text-emerald-600" />
          <span>Menu harian tersimpan di Supabase! Mengalihkan ke Beranda...</span>
        </div>
      )}

      {/* 1. Form Card Edit Menu Aktif */}
      <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-xl shadow-2xs p-6 space-y-6">
        <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 text-base tracking-tight flex items-center gap-2">
            <Sparkles size={18} className="text-amber-500" />
            Formulir Publikasi Menu Hari Ini
          </h2>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Standar BGN Pasuruan
          </span>
        </div>

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
                className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
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
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Status Distribusi
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
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
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
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
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
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

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Catatan / Keterangan Menu
              </label>
              <textarea
                rows={2}
                value={catatanMenu}
                onChange={(e) => setCatatanMenu(e.target.value)}
                placeholder="Catatan tambahan nutrisi atau alergen..."
                className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              />
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

            {/* Upload Button Input with File Type & Size Validation */}
            <div className="relative">
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                disabled={isUploading}
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
              />
              <div className={`w-full py-2.5 px-4 border border-dashed rounded-xl text-center transition flex items-center justify-center gap-2 ${
                isUploading 
                  ? 'bg-amber-50 border-amber-300 text-amber-700' 
                  : 'bg-gray-50/50 border-gray-300 hover:border-emerald-500 hover:bg-emerald-50/30'
              }`}>
                {isUploading ? (
                  <>
                    <RotateCw size={16} className="animate-spin text-amber-600" />
                    <span className="text-xs font-semibold text-amber-800">
                      Mengunggah ke Storage...
                    </span>
                  </>
                ) : (
                  <>
                    <Upload size={16} className="text-emerald-600" />
                    <span className="text-xs font-semibold text-gray-700">
                      Unggah Foto Baru (.PNG, .JPG, .WEBP - Maks 3MB)
                    </span>
                  </>
                )}
              </div>
            </div>
            <p className="text-[11px] text-gray-400">
              Maksimal 3MB. Disarankan rasio foto 16:9 dengan pencahayaan terang.
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
            disabled={saving || isUploading}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs transition cursor-pointer flex items-center gap-1.5 border border-emerald-700 disabled:opacity-50"
          >
            {saving ? <RotateCw size={14} className="animate-spin" /> : <Save size={14} />}
            <span>{saving ? 'Menyimpan...' : 'Simpan & Publikasikan'}</span>
          </button>
        </div>
      </form>

      {/* 2. Section Riwayat & Arsip Menu Sebelumnya (Task 2 Requirement) */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <h2 className="font-bold text-gray-900 text-lg tracking-tight flex items-center gap-2">
              <Clock size={20} className="text-indigo-600" />
              Riwayat & Arsip Menu Makanan Sebelumnya
            </h2>
            <p className="text-xs text-gray-500 font-normal mt-0.5">
              Daftar rekam jejak menu harian yang pernah dipublikasikan pada hari-hari sebelumnya.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full border border-indigo-200">
              {filteredHistory.length} Arsip Menu
            </span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder="Cari nama menu, tag gizi, atau status..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-44">
              <Calendar size={15} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="date"
                value={historyDateFilter}
                onChange={(e) => setHistoryDateFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              />
            </div>

            {(historySearch || historyDateFilter) && (
              <button
                onClick={() => {
                  setHistorySearch('')
                  setHistoryDateFilter('')
                }}
                className="px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Menu History Table */}
        {loadingHistory ? (
          <div className="py-12 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
            <RotateCw size={16} className="animate-spin text-emerald-600" />
            <span>Memuat arsip menu harian...</span>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="py-12 text-center space-y-2 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
            <UtensilsCrossed size={32} className="mx-auto text-gray-300" />
            <p className="text-xs font-semibold text-gray-600">Tidak ada riwayat menu yang cocok.</p>
            <p className="text-[11px] text-gray-400">Coba ubah kata kunci pencarian atau filter tanggal.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <th className="py-3 px-3">TANGGAL</th>
                  <th className="py-3 px-3 text-center">FOTO</th>
                  <th className="py-3 px-3">NAMA MENU & KOMPOSISI GIZI</th>
                  <th className="py-3 px-3 text-center">KALORI & TARGET</th>
                  <th className="py-3 px-3 text-center">STATUS</th>
                  <th className="py-3 px-3 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredHistory.map((item) => (
                  <tr key={item.id || item.tanggal} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-3 font-semibold text-gray-900 whitespace-nowrap">
                      {formatIndonesianDateStr(item.tanggal)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => setPreviewModalMenu(item)}
                        className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 shadow-2xs group inline-block cursor-pointer"
                        title="Klik untuk zoom foto"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.foto_url || '/menu-today.png'}
                          alt={item.nama_menu}
                          className="w-full h-full object-cover group-hover:scale-110 transition duration-200"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/menu-today.png'
                          }}
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                          <Eye size={14} />
                        </div>
                      </button>
                    </td>
                    <td className="py-3 px-3 space-y-1">
                      <div className="font-bold text-gray-900 leading-snug">
                        {item.nama_menu}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(item.komposisi_gizi || ['Gizi Seimbang']).map((tag, idx) => (
                          <span
                            key={idx}
                            className="bg-gray-100 text-gray-600 text-[10px] font-medium px-2 py-0.5 rounded border border-gray-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="font-bold text-amber-700 font-mono">
                        {item.kalori || '~650 kkal'}
                      </div>
                      <div className="text-[11px] text-gray-500 font-medium">
                        {(item.target_porsi || 4850).toLocaleString('id-ID')} Porsi
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        item.status === 'Selesai Distribusi'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : item.status === 'Siap Distribusi'
                          ? 'bg-sky-50 text-sky-700 border-sky-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        ● {item.status || 'Siap Distribusi'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => setPreviewModalMenu(item)}
                        className="px-2.5 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1 mx-auto cursor-pointer shadow-2xs"
                      >
                        <Eye size={13} className="text-gray-500" />
                        <span>Detail</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. Modal Zoom Preview Foto & Detail Menu */}
      {previewModalMenu && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl space-y-4 border border-gray-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  Detail Menu Harian
                </span>
                <h3 className="font-bold text-gray-900 text-base mt-0.5">
                  {formatIndonesianDateStr(previewModalMenu.tanggal)}
                </h3>
              </div>
              <button
                onClick={() => setPreviewModalMenu(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-gray-200 bg-gray-100 shadow-2xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewModalMenu.foto_url || '/menu-today.png'}
                  alt={previewModalMenu.nama_menu}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/menu-today.png'
                  }}
                />
              </div>

              <div className="space-y-2">
                <h4 className="text-lg font-extrabold text-gray-900 tracking-tight leading-snug">
                  {previewModalMenu.nama_menu}
                </h4>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                    ⚡ {previewModalMenu.kalori}
                  </span>
                  <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                    📦 {(previewModalMenu.target_porsi || 4850).toLocaleString('id-ID')} Target Porsi
                  </span>
                  <span className="font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    ● {previewModalMenu.status}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {(previewModalMenu.komposisi_gizi || []).map((tag, idx) => (
                    <span key={idx} className="bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-0.5 rounded-md border border-gray-200">
                      ✓ {tag}
                    </span>
                  ))}
                </div>

                {previewModalMenu.catatan && (
                  <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200 mt-2 font-medium">
                    💬 {previewModalMenu.catatan}
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setPreviewModalMenu(null)}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
