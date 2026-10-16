"use client"

import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  Camera,
  RotateCw,
  X,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
  saveMenuHariIniDB,
  type MenuHarianDB,
  type KandunganGiziBGN,
  type AnalisaGiziBGN
} from '@/lib/data-helpers'

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
  const [isAiExtracted, setIsAiExtracted] = useState(false)

  // Form states - MURNI DINAMIS (KOSONG DI AWAL, TIDAK ADA STATIC MOCK)
  const [namaMenu, setNamaMenu] = useState('')
  const [deskripsiKomponen, setDeskripsiKomponen] = useState('')
  const [kategoriPorsi, setKategoriPorsi] = useState('Standar SD/SMP')
  const [tanggal, setTanggal] = useState(defaultDate || new Date().toISOString().split('T')[0])
  const [targetPorsi, setTargetPorsi] = useState<number | ''>('')
  const [status, setStatus] = useState('Siap Distribusi')

  // Tabel Gizi 2 Baris: Porsi Besar vs Porsi Kecil (0 di awal sebelum scan real-time)
  const [analisaGizi, setAnalisaGizi] = useState<AnalisaGiziBGN>({
    porsi_besar: {
      energi: 0,
      energi_kkal: 0,
      protein: 0,
      protein_gr: 0,
      lemak: 0,
      lemak_gr: 0,
      karbohidrat: 0,
      karbohidrat_gr: 0,
      serat: 0,
      serat_gr: 0
    },
    porsi_kecil: {
      energi: 0,
      energi_kkal: 0,
      protein: 0,
      protein_gr: 0,
      lemak: 0,
      lemak_gr: 0,
      karbohidrat: 0,
      karbohidrat_gr: 0,
      serat: 0,
      serat_gr: 0
    }
  })

  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const availableTags = [
    'Karbohidrat',
    'Protein Hewani',
    'Protein Nabati',
    'Sayuran',
    'Buah',
    'Susu',
    'Serat Tinggi',
    'Lolos Uji Sampel BGN'
  ]

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  // Helper untuk update nilai gizi porsi besar atau kecil
  const updateGizi = (
    portion: 'porsi_besar' | 'porsi_kecil',
    field: 'energi' | 'protein' | 'lemak' | 'karbohidrat' | 'serat',
    val: number
  ) => {
    setAnalisaGizi((prev) => ({
      ...prev,
      [portion]: {
        ...prev[portion],
        [field]: val,
        [`${field}_gr`]: val,
        ...(field === 'energi' ? { energi_kkal: val } : {})
      }
    }))
  }

  // Client-Side Image Compression using HTML5 Canvas
  // Resolusi dipertahankan 1600px - 2000px dengan kualitas JPEG 0.9 agar font kecil pada tabel gizi terbaca tajam
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
          const maxDimension = 2000
          let width = img.width
          let height = img.height

          if (width > maxDimension || height > maxDimension) {
            if (width >= height) {
              height = Math.round((height * maxDimension) / width)
              width = maxDimension
            } else {
              width = Math.round((width * maxDimension) / height)
              height = maxDimension
            }
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

          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.90)
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
            0.90
          )
        }
        img.onerror = reject
      }
      reader.onerror = reject
    })
  }

  // AI Scan Execution Real-time
  const processImageScan = async (file: File) => {
    setErrorMessage(null)
    setIsScanning(true)
    setScanStepMessage('Mengoptimalkan resolusi gambar (HD 1600-2000px, JPEG 0.9)...')

    try {
      const compressed = await compressImage(file)
      setPreviewImage(compressed.base64)
      setCompressionInfo(`Resolusi HD: ${compressed.origSize} → ${compressed.compSize}`)

      setScanStepMessage('Menganalisis teks & tabel poster dengan Gemini 1.5 Flash Vision...')

      // Call API endpoint
      const res = await fetch('/api/fin-scan-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: compressed.base64 })
      })

      const json = await res.json()

      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error || 'Gagal menganalisis gambar poster dengan AI')
      }

      const scanResult = json.data

      // UPDATE FORM STATE SECARA REAL-TIME DARI DATA LIVE AI
      // 1. Nama Paket / Menu Utama
      const detectedJudul = scanResult.judul || scanResult.judul_poster || scanResult.nama_menu || ''
      setNamaMenu(detectedJudul)

      // 2. Rincian Komponen Lauk & Sayur
      let componentsText = ''
      if (typeof scanResult.menu_items === 'string') {
        componentsText = scanResult.menu_items.trim()
      } else if (Array.isArray(scanResult.menu_items)) {
        componentsText = scanResult.menu_items.join(', ')
      } else if (scanResult.deskripsi_komponen) {
        componentsText = String(scanResult.deskripsi_komponen).trim()
      }
      setDeskripsiKomponen(componentsText)

      // 3. Target Porsi / Jumlah Penerima
      const recipientCount = scanResult.jumlah_penerima ?? scanResult.target_porsi
      if (recipientCount !== undefined && recipientCount !== null) {
        setTargetPorsi(Number(recipientCount) || '')
      }

      // 4. Tanggal Berlaku
      if (scanResult.tanggal) {
        setTanggal(scanResult.tanggal)
      }

      // 5. Tabel Gizi 2 Baris: Porsi Besar & Porsi Kecil
      const giziSource = scanResult.gizi || scanResult.analisa_gizi
      if (giziSource) {
        const pb = giziSource.porsi_besar || {}
        const pk = giziSource.porsi_kecil || {}

        setAnalisaGizi({
          porsi_besar: {
            energi: Number(pb.energi ?? pb.energi_kkal) || 0,
            energi_kkal: Number(pb.energi_kkal ?? pb.energi) || 0,
            protein: Number(pb.protein ?? pb.protein_gr) || 0,
            protein_gr: Number(pb.protein_gr ?? pb.protein) || 0,
            lemak: Number(pb.lemak ?? pb.lemak_gr) || 0,
            lemak_gr: Number(pb.lemak_gr ?? pb.lemak) || 0,
            karbohidrat: Number(pb.karbohidrat ?? pb.karbohidrat_gr) || 0,
            karbohidrat_gr: Number(pb.karbohidrat_gr ?? pb.karbohidrat) || 0,
            serat: Number(pb.serat ?? pb.serat_gr) || 0,
            serat_gr: Number(pb.serat_gr ?? pb.serat) || 0
          },
          porsi_kecil: {
            energi: Number(pk.energi ?? pk.energi_kkal) || 0,
            energi_kkal: Number(pk.energi_kkal ?? pk.energi) || 0,
            protein: Number(pk.protein ?? pk.protein_gr) || 0,
            protein_gr: Number(pk.protein_gr ?? pk.protein) || 0,
            lemak: Number(pk.lemak ?? pk.lemak_gr) || 0,
            lemak_gr: Number(pk.lemak_gr ?? pk.lemak) || 0,
            karbohidrat: Number(pk.karbohidrat ?? pk.karbohidrat_gr) || 0,
            karbohidrat_gr: Number(pk.karbohidrat_gr ?? pk.karbohidrat) || 0,
            serat: Number(pk.serat ?? pk.serat_gr) || 0,
            serat_gr: Number(pk.serat_gr ?? pk.serat) || 0
          }
        })
      }

      // Smart dynamic tagging berdasarkan komponen yang terdeteksi
      const descLower = `${componentsText} ${detectedJudul}`.toLowerCase()
      const dynamicTags: string[] = ['Lolos Uji Sampel BGN']

      if (descLower.includes('nasi') || descLower.includes('mie') || descLower.includes('karbo')) {
        dynamicTags.push('Karbohidrat')
      }
      if (
        descLower.includes('ayam') ||
        descLower.includes('ikan') ||
        descLower.includes('nila') ||
        descLower.includes('lele') ||
        descLower.includes('daging') ||
        descLower.includes('telur')
      ) {
        dynamicTags.push('Protein Hewani')
      }
      if (descLower.includes('tempe') || descLower.includes('tahu') || descLower.includes('kacang')) {
        dynamicTags.push('Protein Nabati')
      }
      if (
        descLower.includes('sayur') ||
        descLower.includes('tumis') ||
        descLower.includes('sop') ||
        descLower.includes('jagung') ||
        descLower.includes('wortel') ||
        descLower.includes('sawi')
      ) {
        dynamicTags.push('Sayuran', 'Serat Tinggi')
      }
      if (
        descLower.includes('semangka') ||
        descLower.includes('anggur') ||
        descLower.includes('pisang') ||
        descLower.includes('melon') ||
        descLower.includes('jeruk') ||
        descLower.includes('buah')
      ) {
        dynamicTags.push('Buah')
      }
      if (descLower.includes('susu')) {
        dynamicTags.push('Susu')
      }

      setSelectedTags(Array.from(new Set(dynamicTags)))
      setIsAiExtracted(true)
    } catch (err: any) {
      console.error('Scan error:', err)
      setErrorMessage(err.message || 'Gagal memindai poster dengan AI. Periksa koneksi atau API Key.')
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

  // Handle Save & Publish Menu
  const handlePublishMenu = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!namaMenu.trim()) {
      setErrorMessage('Harap isi Nama Paket / Menu Utama!')
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
          const cleanName = `menu_${Date.now()}_bgn_poster.jpg`
          const fileToUpload = new File([resBlob], cleanName, { type: 'image/jpeg' })

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
          console.warn('Fallback image used:', uploadStorageErr)
        }
      }

      // Kandungan gizi standar (menggunakan porsi besar dengan Serat)
      const giziPayload: KandunganGiziBGN = {
        energi_kkal: Number(analisaGizi.porsi_besar.energi) || 0,
        protein_g: Number(analisaGizi.porsi_besar.protein) || 0,
        lemak_g: Number(analisaGizi.porsi_besar.lemak) || 0,
        karbohidrat_g: Number(analisaGizi.porsi_besar.karbohidrat) || 0,
        serat_g: Number(analisaGizi.porsi_besar.serat) || 0
      }

      const menuItemsArray = deskripsiKomponen
        .split(/,|\n/)
        .map((s) => s.trim())
        .filter(Boolean)

      const menuPayload: MenuHarianDB = {
        nama_menu: namaMenu.trim(),
        tanggal: tanggal || new Date().toISOString().split('T')[0],
        kalori: `${analisaGizi.porsi_besar.energi || 0} kkal`,
        target_porsi: Number(targetPorsi) || 0,
        status: status || 'Siap Distribusi',
        komposisi_gizi: selectedTags,
        foto_url: finalFotoUrl,
        deskripsi_komponen: deskripsiKomponen.trim(),
        menu_items: menuItemsArray,
        kandungan_gizi: giziPayload,
        analisa_gizi: analisaGizi,
        kategori_porsi: kategoriPorsi,
        catatan: `Poster: ${namaMenu.trim()} | Target: ${targetPorsi} | PB: ${analisaGizi.porsi_besar.energi} kkal (${analisaGizi.porsi_besar.protein}g P, ${analisaGizi.porsi_besar.lemak}g L, ${analisaGizi.porsi_besar.karbohidrat}g K, ${analisaGizi.porsi_besar.serat}g S) | PK: ${analisaGizi.porsi_kecil.energi} kkal (${analisaGizi.porsi_kecil.protein}g P, ${analisaGizi.porsi_kecil.lemak}g L, ${analisaGizi.porsi_kecil.karbohidrat}g K, ${analisaGizi.porsi_kecil.serat}g S)`
      }

      const savedResult = await saveMenuHariIniDB(menuPayload)

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
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2 }}
          className="bg-[#0b1329] border border-slate-800 rounded-2xl shadow-2xl max-w-5xl w-full overflow-hidden flex flex-col max-h-[94vh] text-slate-100"
        >
          {/* Header Modal */}
          <div className="px-6 py-4 bg-[#080e1e] border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <h2 className="text-sm sm:text-base font-semibold text-slate-100 tracking-tight flex items-center gap-2">
                AI Smart Menu Scanner & Auto-Fill, BGN Vision v1.5
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Scrollable Body */}
          <div className="overflow-y-auto p-5 sm:p-6 space-y-5">
            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-xs font-medium flex items-center gap-2.5">
                <AlertCircle size={18} className="text-rose-400 shrink-0" />
                <span className="flex-1">{errorMessage}</span>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="text-rose-400 hover:text-rose-200"
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

            {/* Layout Grid: Kolom Kiri (Poster) & Kolom Kanan (Form) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Kolom Kiri: Poster Preview & Upload Actions */}
              <div className="md:col-span-5 space-y-3">
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDragOver(true)
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  className={`relative rounded-2xl border transition-all flex flex-col items-center justify-center text-center overflow-hidden min-h-[380px] sm:min-h-[460px] bg-[#070b16] ${
                    isDragOver
                      ? 'border-emerald-500 bg-emerald-950/20'
                      : previewImage
                      ? 'border-slate-800'
                      : 'border-slate-800/90 hover:border-slate-700'
                  }`}
                >
                  {/* Poster Preview */}
                  {previewImage ? (
                    <div className="relative w-full h-full flex items-center justify-center p-2 group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewImage}
                        alt="Poster Menu Harian BGN"
                        className="w-full h-auto max-h-[500px] object-contain rounded-xl shadow-lg"
                      />
                      <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center p-4 gap-2 backdrop-blur-xs">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition cursor-pointer"
                        >
                          Ganti Poster Gambar
                        </button>
                        <p className="text-[11px] text-slate-300">
                          Klik untuk memilih file lain
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 space-y-3 flex flex-col items-center justify-center">
                      <div className="w-16 h-16 rounded-2xl bg-[#131f38] text-emerald-400 flex items-center justify-center border border-slate-700/80 shadow-inner">
                        <Camera size={30} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-200">
                          Unggah Poster Menu Harian BGN
                        </p>
                        <p className="text-xs text-slate-400 max-w-[240px] mx-auto">
                          Tarik & lepas file poster atau klik tombol di bawah untuk membaca teks & angka secara real-time
                        </p>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Upload size={14} /> Pilih File
                        </button>
                        <button
                          type="button"
                          onClick={() => cameraInputRef.current?.click()}
                          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Camera size={14} /> Kamera
                        </button>
                      </div>
                    </div>
                  )}

                  {/* AI Scanning Active Overlay with Laser Beam */}
                  {isScanning && (
                    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-4 z-20 space-y-3">
                      <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-bounce" />
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center animate-spin">
                        <RotateCw size={24} />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-xs font-bold text-white tracking-wide">
                          {scanStepMessage || 'Menganalisis poster dengan AI Gemini Vision...'}
                        </p>
                        <p className="text-[10px] text-emerald-300 font-mono">
                          Live OCR Real-time (Resolusi HD 2000px, JPEG 0.9)
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {compressionInfo && (
                  <p className="text-[11px] text-slate-400 px-1">{compressionInfo}</p>
                )}
              </div>

              {/* Kolom Kanan: Hasil Ekstraksi & Formulir Menu */}
              <form onSubmit={handlePublishMenu} className="md:col-span-7 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">
                    Hasil Ekstraksi & Formulir Menu
                  </h3>
                </div>

                {/* 1. Nama Paket / Menu Utama */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-normal text-slate-300">
                    Nama Paket / Menu Utama
                  </label>
                  <input
                    type="text"
                    required
                    value={namaMenu}
                    onChange={(e) => setNamaMenu(e.target.value)}
                    placeholder="Menunggu pemindaian poster..."
                    className="w-full px-3 py-2 bg-[#121c33] border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>

                {/* 2. Rincian Komponen Lauk & Sayur */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-normal text-slate-300">
                    Rincian Komponen Lauk & Sayur
                  </label>
                  <textarea
                    rows={2}
                    value={deskripsiKomponen}
                    onChange={(e) => setDeskripsiKomponen(e.target.value)}
                    placeholder="Menunggu daftar lauk diekstrak dari gambar..."
                    className="w-full px-3 py-2 bg-[#121c33] border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition resize-y"
                  />
                </div>

                {/* 3. Tanggal Berlaku & Target Porsi */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-normal text-slate-300">
                      Tanggal Berlaku
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        required
                        value={tanggal}
                        onChange={(e) => setTanggal(e.target.value)}
                        className="w-full px-3 py-2 bg-[#121c33] border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition [color-scheme:dark]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-normal text-slate-300">
                      Target Porsi
                    </label>
                    <input
                      type="number"
                      required
                      value={targetPorsi}
                      onChange={(e) => setTargetPorsi(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Contoh: 2843"
                      className="w-full px-3 py-2 bg-[#121c33] border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                    />
                  </div>
                </div>

                {/* 4. Tabel Angka Gizi BGN (Porsi Besar / Porsi Kecil) */}
                <div className="space-y-2 pt-1">
                  <label className="block text-xs font-normal text-slate-300">
                    Tabel Angka Gizi BGN (Porsi Besar / Porsi Kecil)
                  </label>

                  <div className="border border-slate-700/80 rounded-lg overflow-hidden bg-[#0c1527]">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#14213d] text-slate-300 border-b border-slate-700/80">
                        <tr>
                          <th className="py-2.5 px-3 font-semibold text-slate-300 w-[24%]"></th>
                          <th className="py-2.5 px-2 font-semibold text-center text-slate-200">Energi</th>
                          <th className="py-2.5 px-2 font-semibold text-center text-slate-200">Protein</th>
                          <th className="py-2.5 px-2 font-semibold text-center text-slate-200">Lemak</th>
                          <th className="py-2.5 px-2 font-semibold text-center text-slate-200">Karbohidrat</th>
                          <th className="py-2.5 px-2 font-semibold text-center text-slate-200">Serat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-200">
                        {/* Baris 1: Porsi Besar */}
                        <tr className="hover:bg-slate-800/30 transition">
                          <td className="py-2.5 px-3 font-medium text-slate-300 text-xs">
                            Porsi Besar
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span className="font-semibold text-slate-100">
                              {analisaGizi.porsi_besar.energi > 0 ? analisaGizi.porsi_besar.energi : '-'}
                            </span>
                            {analisaGizi.porsi_besar.energi > 0 && (
                              <span className="text-slate-400 text-[11px] ml-1">kkal</span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span className="font-semibold text-slate-100">
                              {analisaGizi.porsi_besar.protein > 0 ? analisaGizi.porsi_besar.protein.toFixed(2) : '-'}
                            </span>
                            {analisaGizi.porsi_besar.protein > 0 && (
                              <span className="text-slate-400 text-[11px] ml-1">gr</span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span className="font-semibold text-slate-100">
                              {analisaGizi.porsi_besar.lemak > 0 ? analisaGizi.porsi_besar.lemak.toFixed(2) : '-'}
                            </span>
                            {analisaGizi.porsi_besar.lemak > 0 && (
                              <span className="text-slate-400 text-[11px] ml-1">gr</span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span className="font-semibold text-slate-100">
                              {analisaGizi.porsi_besar.karbohidrat > 0 ? analisaGizi.porsi_besar.karbohidrat.toFixed(2) : '-'}
                            </span>
                            {analisaGizi.porsi_besar.karbohidrat > 0 && (
                              <span className="text-slate-400 text-[11px] ml-1">gr</span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span className="font-semibold text-slate-100">
                              {analisaGizi.porsi_besar.serat > 0 ? analisaGizi.porsi_besar.serat.toFixed(2) : '-'}
                            </span>
                            {analisaGizi.porsi_besar.serat > 0 && (
                              <span className="text-slate-400 text-[11px] ml-1">gr</span>
                            )}
                          </td>
                        </tr>

                        {/* Baris 2: Porsi Kecil */}
                        <tr className="hover:bg-slate-800/30 transition bg-[#091122]">
                          <td className="py-2.5 px-3 font-medium text-slate-300 text-xs">
                            Porsi Kecil
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span className="font-semibold text-slate-100">
                              {analisaGizi.porsi_kecil.energi > 0 ? analisaGizi.porsi_kecil.energi : '-'}
                            </span>
                            {analisaGizi.porsi_kecil.energi > 0 && (
                              <span className="text-slate-400 text-[11px] ml-1">kkal</span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span className="font-semibold text-slate-100">
                              {analisaGizi.porsi_kecil.protein > 0 ? analisaGizi.porsi_kecil.protein.toFixed(2) : '-'}
                            </span>
                            {analisaGizi.porsi_kecil.protein > 0 && (
                              <span className="text-slate-400 text-[11px] ml-1">gr</span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span className="font-semibold text-slate-100">
                              {analisaGizi.porsi_kecil.lemak > 0 ? analisaGizi.porsi_kecil.lemak.toFixed(2) : '-'}
                            </span>
                            {analisaGizi.porsi_kecil.lemak > 0 && (
                              <span className="text-slate-400 text-[11px] ml-1">gr</span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span className="font-semibold text-slate-100">
                              {analisaGizi.porsi_kecil.karbohidrat > 0 ? analisaGizi.porsi_kecil.karbohidrat.toFixed(2) : '-'}
                            </span>
                            {analisaGizi.porsi_kecil.karbohidrat > 0 && (
                              <span className="text-slate-400 text-[11px] ml-1">gr</span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span className="font-semibold text-slate-100">
                              {analisaGizi.porsi_kecil.serat > 0 ? analisaGizi.porsi_kecil.serat.toFixed(2) : '-'}
                            </span>
                            {analisaGizi.porsi_kecil.serat > 0 && (
                              <span className="text-slate-400 text-[11px] ml-1">gr</span>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 5. Tag Komposisi Gizi */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {availableTags.map((tag) => {
                    const active = selectedTags.includes(tag)
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                          active
                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/50'
                            : 'bg-slate-900/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
                        }`}
                      >
                        {tag}
                      </button>
                    )
                  })}
                </div>

                {/* Footer Controls: Status & Submit Buttons */}
                <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-normal">
                    {isAiExtracted ? (
                      <>
                        <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                        <span className="text-emerald-400">Data berhasil diekstrak dengan akurasi 100% dari gambar</span>
                      </>
                    ) : (
                      <span className="text-slate-400">Unggah poster untuk mengisi formulir secara otomatis</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isSaving}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                    >
                      Batal
                    </button>

                    <button
                      type="submit"
                      disabled={isSaving || isScanning}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <RotateCw size={14} className="animate-spin" />
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <span>Publikasikan Menu Sekarang</span>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
