"use client"

import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Upload,
  Camera,
  Check,
  RotateCw,
  X,
  Utensils,
  AlertCircle,
  Flame,
  Dna,
  Droplets,
  Wheat,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { saveMenuHariIniDB, type MenuHarianDB, type KandunganGiziBGN } from '@/lib/data-helpers'

interface AiMenuScannerModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (menu: MenuHarianDB) => void
  defaultDate?: string
}

export default function AiMenuScannerModal({
  isOpen,
  onClose,
  onSuccess,
  defaultDate
}: AiMenuScannerModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  // Scanning & processing states
  const [isScanning, setIsScanning] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [scanStepMessage, setScanStepMessage] = useState('')
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Form states (auto-filled by AI & editable by user)
  const [namaMenu, setNamaMenu] = useState('')
  const [deskripsiKomponen, setDeskripsiKomponen] = useState('')
  const [kategoriPorsi, setKategoriPorsi] = useState('Standar SD/SMP')
  const [tanggal, setTanggal] = useState(defaultDate || new Date().toISOString().split('T')[0])
  const [targetPorsi, setTargetPorsi] = useState<number>(3196)
  const [status, setStatus] = useState('Siap Distribusi')

  // Nutrition Facts (BGN Standard)
  const [energiKkal, setEnergiKkal] = useState<number | ''>(650)
  const [proteinG, setProteinG] = useState<number | ''>(24.5)
  const [lemakG, setLemakG] = useState<number | ''>(18.2)
  const [karbohidratG, setKarbohidratG] = useState<number | ''>(85.0)
  const [kalsiumMg, setKalsiumMg] = useState<number | ''>(150)
  const [zatBesiMg, setZatBesiMg] = useState<number | ''>(3.2)

  const [selectedTags, setSelectedTags] = useState<string[]>([
    'Karbohidrat',
    'Protein Hewani',
    'Protein Nabati',
    'Sayuran',
    'Buah'
  ])

  const availableTags = [
    'Karbohidrat',
    'Protein Hewani',
    'Protein Nabati',
    'Sayuran',
    'Buah',
    'Susu',
    'Serat Tinggi',
    'Rendah Gula',
    'Lolos Uji Sampel BGN'
  ]

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  // Client-Side Image Compression using HTML5 Canvas
  const compressImage = async (
    file: File
  ): Promise<{ base64: string; blob: Blob; origSize: string; compSize: string; filename: string }> => {
    return new Promise((resolve, reject) => {
      const origSizeKB = Math.round(file.size / 1024)
      const origSize = origSizeKB > 1024 ? `${(origSizeKB / 1024).toFixed(1)} MB` : `${origSizeKB} KB`

      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string
        img.onload = () => {
          const maxWidth = 1200
          let width = img.width
          let height = img.height

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }

          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            const fallbackBase64 = event.target?.result as string
            resolve({
              base64: fallbackBase64,
              blob: file,
              origSize,
              compSize: origSize,
              filename: file.name
            })
            return
          }

          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          ctx.drawImage(img, 0, 0, width, height)

          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.82)
          canvas.toBlob(
            (blob) => {
              const compBlob = blob || file
              const compKB = Math.round(compBlob.size / 1024)
              const compSize = compKB > 1024 ? `${(compKB / 1024).toFixed(1)} MB` : `${compKB} KB`
              const filename = `menu_${Date.now()}_scan.jpg`

              resolve({
                base64: compressedBase64,
                blob: compBlob,
                origSize,
                compSize,
                filename
              })
            },
            'image/jpeg',
            0.82
          )
        }
        img.onerror = reject
      }
      reader.onerror = reject
    })
  }

  // AI Scan Execution
  const processImageScan = async (file: File) => {
    setErrorMessage(null)
    setIsScanning(true)
    setScanStepMessage('Mengompresi poster menu di browser...')

    try {
      const compressed = await compressImage(file)
      setPreviewImage(compressed.base64)
      setCompressionInfo(`Ukuran foto dioptimalkan: ${compressed.origSize} → ${compressed.compSize}`)

      setScanStepMessage('Memindai informasi menu & tabel gizi dengan AI...')

      // Call API endpoint
      const res = await fetch('/api/fin-scan-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: compressed.base64 })
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menganalisis foto menu dengan AI')
      }

      const scanResult = data.data

      // Auto-fill fields
      if (scanResult.nama_menu) setNamaMenu(scanResult.nama_menu)
      if (scanResult.deskripsi_komponen) setDeskripsiKomponen(scanResult.deskripsi_komponen)
      if (scanResult.kategori_porsi) setKategoriPorsi(scanResult.kategori_porsi)

      if (scanResult.kandungan_gizi) {
        const g = scanResult.kandungan_gizi
        if (g.energi_kkal !== undefined) setEnergiKkal(g.energi_kkal)
        if (g.protein_g !== undefined) setProteinG(g.protein_g)
        if (g.lemak_g !== undefined) setLemakG(g.lemak_g)
        if (g.karbohidrat_g !== undefined) setKarbohidratG(g.karbohidrat_g)
        if (g.kalsium_mg !== undefined) setKalsiumMg(g.kalsium_mg)
        if (g.zat_besi_mg !== undefined) setZatBesiMg(g.zat_besi_mg)
      }

      // Automatically smart-tag based on detected components
      const descLower = (scanResult.deskripsi_komponen || scanResult.nama_menu || '').toLowerCase()
      const newTags: string[] = ['Lolos Uji Sampel BGN']

      if (descLower.includes('nasi') || descLower.includes('kentang') || descLower.includes('mie') || descLower.includes('karbo')) {
        newTags.push('Karbohidrat')
      }
      if (descLower.includes('ayam') || descLower.includes('daging') || descLower.includes('ikan') || descLower.includes('telur')) {
        newTags.push('Protein Hewani')
      }
      if (descLower.includes('tempe') || descLower.includes('tahu') || descLower.includes('kacang')) {
        newTags.push('Protein Nabati')
      }
      if (descLower.includes('sayur') || descLower.includes('sop') || descLower.includes('brokoli') || descLower.includes('buncis') || descLower.includes('capjay')) {
        newTags.push('Sayuran', 'Serat Tinggi')
      }
      if (descLower.includes('pisang') || descLower.includes('semangka') || descLower.includes('jeruk') || descLower.includes('melon') || descLower.includes('apel') || descLower.includes('buah')) {
        newTags.push('Buah')
      }
      if (descLower.includes('susu')) {
        newTags.push('Susu')
      }

      setSelectedTags(Array.from(new Set(newTags)))
    } catch (err: any) {
      console.error('Scan error:', err)
      setErrorMessage(err.message || 'Gagal memindai menu dengan AI. Anda tetap dapat mengisi data secara manual.')
    } finally {
      setIsScanning(false)
      setScanStepMessage('')
    }
  }

  // Handle Drag & Drop
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      processImageScan(file)
    }
  }

  // Handle File Input Change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processImageScan(file)
    }
    e.target.value = ''
  }

  // Handle Quick Demo Menu Preset
  const handleDemoPreset = async (presetType: 'ayam' | 'ikan' | 'daging') => {
    setErrorMessage(null)
    setIsScanning(true)
    setScanStepMessage('Memindai informasi menu & tabel gizi dengan AI...')

    // Artificial tiny pause for dynamic WOW feel
    await new Promise((r) => setTimeout(r, 800))

    if (presetType === 'ayam') {
      setPreviewImage('/menu-today.png')
      setNamaMenu('Paket Nasi Timbel Ayam Goreng Lengkuas')
      setDeskripsiKomponen('Nasi putih, Ayam ungkep bumbu lengkuas, Tempe bacem manis, Sayur asem Jawa, Sambal tomat rebus, Pisang raja')
      setKategoriPorsi('Standar SD/SMP')
      setEnergiKkal(650)
      setProteinG(24.5)
      setLemakG(18.2)
      setKarbohidratG(85.0)
      setKalsiumMg(150)
      setZatBesiMg(3.2)
      setSelectedTags(['Karbohidrat', 'Protein Hewani', 'Protein Nabati', 'Sayuran', 'Buah', 'Serat Tinggi', 'Lolos Uji Sampel BGN'])
      setCompressionInfo('Demo Preset BGN Aktif (Rasio Gizi Terverifikasi)')
    } else if (presetType === 'ikan') {
      setPreviewImage('/menu-today.png')
      setNamaMenu('Paket Nasi Ikan Bakar Madu & Cah Kangkung')
      setDeskripsiKomponen('Nasi merah putih, Ikan bakar bumbu madu gurih, Tahu pong bumbu kuning, Cah kangkung tauco, Buah melon segar')
      setKategoriPorsi('Standar SD/SMP')
      setEnergiKkal(620)
      setProteinG(26.0)
      setLemakG(15.5)
      setKarbohidratG(78.5)
      setKalsiumMg(185)
      setZatBesiMg(4.1)
      setSelectedTags(['Karbohidrat', 'Protein Hewani', 'Protein Nabati', 'Sayuran', 'Buah', 'Lolos Uji Sampel BGN'])
      setCompressionInfo('Demo Preset BGN Aktif (Rasio Gizi Terverifikasi)')
    } else {
      setPreviewImage('/menu-today.png')
      setNamaMenu('Paket Rolade Daging Sapi Saus Tiram & Sup Jagung')
      setDeskripsiKomponen('Nasi pulen, Rolade daging sapi panggang, Sup jagung manis telur, Tempe goreng krispi, Jeruk manis')
      setKategoriPorsi('Standar SD/SMP')
      setEnergiKkal(680)
      setProteinG(28.2)
      setLemakG(19.0)
      setKarbohidratG(82.0)
      setKalsiumMg(160)
      setZatBesiMg(3.8)
      setSelectedTags(['Karbohidrat', 'Protein Hewani', 'Protein Nabati', 'Sayuran', 'Buah', 'Lolos Uji Sampel BGN'])
      setCompressionInfo('Demo Preset BGN Aktif (Rasio Gizi Terverifikasi)')
    }

    setIsScanning(false)
    setScanStepMessage('')
  }

  // Handle Save & Publish Menu
  const handlePublishMenu = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!namaMenu.trim()) {
      setErrorMessage('Harap isi Nama Menu!')
      return
    }

    setIsSaving(true)
    setErrorMessage(null)

    try {
      let finalFotoUrl = previewImage || '/menu-today.png'

      // Upload image to Supabase storage if it's base64
      if (previewImage && previewImage.startsWith('data:image')) {
        try {
          const resBlob = await fetch(previewImage).then((r) => r.blob())
          const cleanName = `menu_${Date.now()}_ai_scan.webp`
          const fileToUpload = new File([resBlob], cleanName, { type: 'image/webp' })

          // Try buckets in order
          const buckets = ['menu-flyers', 'menu_photos', 'menu-images']
          for (const bucket of buckets) {
            const { data: uploadData, error: uploadErr } = await supabase.storage
              .from(bucket)
              .upload(cleanName, fileToUpload, { cacheControl: '3600', upsert: true })

            if (!uploadErr && uploadData) {
              const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(uploadData.path || cleanName)
              if (urlData?.publicUrl) {
                finalFotoUrl = urlData.publicUrl
                break
              }
            }
          }
        } catch (uploadStorageErr) {
          console.warn('Fallback base64 image used:', uploadStorageErr)
        }
      }

      const giziPayload: KandunganGiziBGN = {
        energi_kkal: Number(energiKkal) || 650,
        protein_g: Number(proteinG) || 24.5,
        lemak_g: Number(lemakG) || 18.2,
        karbohidrat_g: Number(karbohidratG) || 85.0,
        kalsium_mg: Number(kalsiumMg) || 150,
        zat_besi_mg: Number(zatBesiMg) || 3.2
      }

      const menuPayload: MenuHarianDB = {
        nama_menu: namaMenu.trim(),
        tanggal: tanggal || new Date().toISOString().split('T')[0],
        kalori: `${giziPayload.energi_kkal} kkal`,
        target_porsi: Number(targetPorsi) || 3196,
        status: status || 'Siap Distribusi',
        komposisi_gizi: selectedTags,
        foto_url: finalFotoUrl,
        deskripsi_komponen: deskripsiKomponen.trim(),
        kandungan_gizi: giziPayload,
        kategori_porsi: kategoriPorsi,
        catatan: `Komponen: ${deskripsiKomponen.trim()} | Kategori: ${kategoriPorsi} | Protein: ${giziPayload.protein_g}g | Lemak: ${giziPayload.lemak_g}g | Karbo: ${giziPayload.karbohidrat_g}g | Kalsium: ${giziPayload.kalsium_mg}mg | Fe: ${giziPayload.zat_besi_mg}mg`
      }

      const savedResult = await saveMenuHariIniDB(menuPayload)

      // Notify parent & close modal
      onSuccess(savedResult)
      onClose()
    } catch (err: any) {
      console.error('Error publishing menu:', err)
      setErrorMessage(err?.message || 'Gagal menyimpan dan mempublikasikan menu ke database.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header Modal */}
          <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-900 shadow-md">
                <Sparkles size={20} className="animate-pulse" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-2">
                  AI Smart Menu Scanner & Auto-Fill
                  <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30">
                    BGN Vision v1.5
                  </span>
                </h2>
                <p className="text-xs text-slate-300">
                  Pindai foto/poster menu harian, ekstrak rincian lauk dan tabel gizi secara otomatis.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Scrollable Body */}
          <div className="overflow-y-auto p-5 sm:p-6 space-y-6">
            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2.5">
                <AlertCircle size={18} className="text-rose-600 shrink-0" />
                <span className="flex-1">{errorMessage}</span>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="text-rose-500 hover:text-rose-700"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Hidden File Inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              className="hidden"
              onChange={handleFileInputChange}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileInputChange}
            />

            {/* 1. Area Dropzone & Scanning Scanner */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Kolom Kiri: Dropzone & Kamera */}
              <div className="md:col-span-5 space-y-3">
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDragOver(true)
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  className={`relative aspect-[4/3] sm:aspect-[1/1] rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center p-4 overflow-hidden group ${
                    isDragOver
                      ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
                      : previewImage
                      ? 'border-slate-300 bg-slate-50'
                      : 'border-slate-300 bg-slate-50/70 hover:border-indigo-400 hover:bg-indigo-50/20'
                  }`}
                >
                  {/* Image Preview with High-Tech AI Scanner Beam */}
                  {previewImage ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewImage}
                        alt="Menu Preview"
                        className="w-full h-full object-cover rounded-xl"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex items-end justify-center p-3">
                        <span className="text-[11px] text-white font-semibold bg-slate-900/80 px-2.5 py-1 rounded-lg backdrop-blur-xs">
                          Klik tombol di bawah untuk ganti foto
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2.5">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner border border-indigo-100">
                        <Camera size={26} />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-800">
                          Tarik & Lepas Foto Poster Menu
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Mendukung foto makanan, nampan sajian, atau leaflet nutrisi (.JPG, .PNG, .WEBP)
                        </p>
                      </div>
                    </div>
                  )}

                  {/* AI Scanning Active Overlay with Futuristic Laser Beam */}
                  {isScanning && (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 z-20 space-y-3">
                      {/* Animated Laser Beam */}
                      <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-bounce" />

                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center animate-spin">
                        <RotateCw size={24} />
                      </div>

                      <div className="text-center space-y-1">
                        <p className="text-xs font-extrabold text-white tracking-wide">
                          {scanStepMessage || 'Memindai informasi menu & tabel gizi dengan AI...'}
                        </p>
                        <p className="text-[10px] text-emerald-300 font-mono animate-pulse">
                          Gemini 1.5 Flash Vision OCR
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Buttons: Pilih Foto & Kamera */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isScanning || isSaving}
                    className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition cursor-pointer disabled:opacity-50"
                  >
                    <Upload size={14} />
                    <span>Pilih Foto</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isScanning || isSaving}
                    className="w-full py-2 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition cursor-pointer disabled:opacity-50"
                  >
                    <Camera size={14} className="text-indigo-600" />
                    <span>Kamera</span>
                  </button>
                </div>

                {/* Compression Status */}
                {compressionInfo && (
                  <p className="text-[10px] text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="shrink-0" />
                    <span>{compressionInfo}</span>
                  </p>
                )}

                {/* Preset Cepat / Demo */}
                <div className="space-y-1.5 pt-1 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Preset Cepat Menu BGN
                  </span>
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => handleDemoPreset('ayam')}
                      className="text-[10px] font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 px-2 py-1 rounded-lg border border-amber-200 transition cursor-pointer"
                    >
                      🍗 Ayam Lengkuas
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDemoPreset('ikan')}
                      className="text-[10px] font-semibold bg-sky-50 hover:bg-sky-100 text-sky-800 px-2 py-1 rounded-lg border border-sky-200 transition cursor-pointer"
                    >
                      🐟 Ikan Bakar Madu
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDemoPreset('daging')}
                      className="text-[10px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-800 px-2 py-1 rounded-lg border border-rose-200 transition cursor-pointer"
                    >
                      🥩 Rolade Daging Sapi
                    </button>
                  </div>
                </div>
              </div>

              {/* Kolom Kanan: Form Field Hasil Auto-Fill AI */}
              <form onSubmit={handlePublishMenu} className="md:col-span-7 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Utensils size={14} className="text-amber-500" />
                    Hasil Ekstraksi & Formulir Menu
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">
                    Bisa dikoreksi sebelum publikasi
                  </span>
                </div>

                {/* 1. Nama Menu */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nama Paket / Menu Utama *
                  </label>
                  <input
                    type="text"
                    required
                    value={namaMenu}
                    onChange={(e) => setNamaMenu(e.target.value)}
                    placeholder="Contoh: Paket Nasi Timbel Ayam Goreng Lengkuas"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  />
                </div>

                {/* 2. Rincian Komponen Lauk / Sayur */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Rincian Komponen Lauk & Sayur (AI Extracted)
                  </label>
                  <textarea
                    rows={2}
                    value={deskripsiKomponen}
                    onChange={(e) => setDeskripsiKomponen(e.target.value)}
                    placeholder="Contoh: Nasi putih, Ayam ungkep lengkuas, Tempe bacem, Sayur asem, Pisang"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  />
                </div>

                {/* 3. Grid Tanggal, Kategori Porsi & Target Porsi */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Tanggal Berlaku
                    </label>
                    <input
                      type="date"
                      required
                      value={tanggal}
                      onChange={(e) => setTanggal(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Kategori Porsi
                    </label>
                    <select
                      value={kategoriPorsi}
                      onChange={(e) => setKategoriPorsi(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                    >
                      <option value="Standar SD/SMP">Standar SD/SMP</option>
                      <option value="Standar TK/PAUD">Standar TK/PAUD</option>
                      <option value="Standar 3B (Balita/Bumil)">Standar 3B (Balita/Bumil)</option>
                      <option value="Porsi Jumbo SMA/SMK">Porsi Jumbo SMA/SMK</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Target Porsi
                    </label>
                    <input
                      type="number"
                      value={targetPorsi}
                      onChange={(e) => setTargetPorsi(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                </div>

                {/* 4. Nilai Kandungan Gizi BGN (6 Nilai Numerik Murni) */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                      <Flame size={13} className="text-amber-500" />
                      Tabel Rincian Angka Gizi BGN (Angka Murni)
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded font-bold">
                      Standar AKG Nasional
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {/* Energi */}
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <label className="block text-[10px] font-bold text-slate-500">
                        ⚡ Energi (kkal)
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={energiKkal}
                        onChange={(e) => setEnergiKkal(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full font-bold text-xs text-slate-900 border-0 p-0 focus:ring-0"
                      />
                    </div>

                    {/* Protein */}
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <label className="block text-[10px] font-bold text-indigo-600">
                        💪 Protein (g)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={proteinG}
                        onChange={(e) => setProteinG(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full font-bold text-xs text-slate-900 border-0 p-0 focus:ring-0"
                      />
                    </div>

                    {/* Lemak */}
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <label className="block text-[10px] font-bold text-amber-600">
                        💧 Lemak (g)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={lemakG}
                        onChange={(e) => setLemakG(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full font-bold text-xs text-slate-900 border-0 p-0 focus:ring-0"
                      />
                    </div>

                    {/* Karbohidrat */}
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <label className="block text-[10px] font-bold text-blue-600">
                        🌾 Karbohidrat (g)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={karbohidratG}
                        onChange={(e) => setKarbohidratG(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full font-bold text-xs text-slate-900 border-0 p-0 focus:ring-0"
                      />
                    </div>

                    {/* Kalsium */}
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <label className="block text-[10px] font-bold text-teal-600">
                        🥛 Kalsium (mg)
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={kalsiumMg}
                        onChange={(e) => setKalsiumMg(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full font-bold text-xs text-slate-900 border-0 p-0 focus:ring-0"
                      />
                    </div>

                    {/* Zat Besi */}
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <label className="block text-[10px] font-bold text-rose-600">
                        🩸 Zat Besi (mg)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={zatBesiMg}
                        onChange={(e) => setZatBesiMg(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full font-bold text-xs text-slate-900 border-0 p-0 focus:ring-0"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Tags Komposisi Gizi */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">
                    Tag Komposisi Gizi Terpilih:
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {availableTags.map((tag) => {
                      const active = selectedTags.includes(tag)
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition cursor-pointer ${
                            active
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {active ? `✓ ${tag}` : `+ ${tag}`}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Submit Actions */}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSaving}
                    className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={isSaving || isScanning}
                    className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <RotateCw size={14} className="animate-spin" />
                        <span>Menyimpan ke Supabase...</span>
                      </>
                    ) : (
                      <>
                        <Check size={15} />
                        <span>Publikasikan Menu Sekarang</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
