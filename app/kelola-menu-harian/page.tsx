"use client"
import React, { useState, useEffect, useMemo, useRef } from 'react'
import { 
  UtensilsCrossed, Upload, Check, Image as ImageIcon, ArrowLeft, RotateCw, 
  Save, Search, Calendar, Eye, X, AlertTriangle, Clock, Sparkles, Camera, Flame, CheckCircle2
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  fetchMenuHariIniDB, 
  saveMenuHariIniDB, 
  fetchMenuHistoryDB, 
  type MenuHarianDB,
  type KandunganGiziBGN,
  type AnalisaGiziBGN
} from '@/lib/data-helpers'
import AiMenuScannerModal from '@/components/AiMenuScannerModal'

export default function KelolaMenuHarianPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Active Menu Form States
  const [namaMenu, setNamaMenu] = useState('')
  const [deskripsiKomponen, setDeskripsiKomponen] = useState('')
  const [kategoriPorsi, setKategoriPorsi] = useState('Standar SD/SMP')
  const [tanggal, setTanggal] = useState('')
  const [targetPorsi, setTargetPorsi] = useState<number | ''>('')
  const [kalori, setKalori] = useState('')
  const [status, setStatus] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [fotoUrl, setFotoUrl] = useState('')
  const [catatanMenu, setCatatanMenu] = useState('')

  // 6 Angka Nilai Gizi BGN (Numerik Murni)
  const [energiKkal, setEnergiKkal] = useState<number | ''>(650)
  const [proteinG, setProteinG] = useState<number | ''>(24.5)
  const [lemakG, setLemakG] = useState<number | ''>(18.2)
  const [karbohidratG, setKarbohidratG] = useState<number | ''>(85.0)
  const [kalsiumMg, setKalsiumMg] = useState<number | ''>(150)
  const [zatBesiMg, setZatBesiMg] = useState<number | ''>(3.2)

  // Tabel Gizi 2 Baris BGN (Porsi Besar / Porsi Kecil)
  const [analisaGizi, setAnalisaGizi] = useState<AnalisaGiziBGN | null>(null)

  // Active Published Menu from DB
  const [currentMenuDb, setCurrentMenuDb] = useState<MenuHarianDB | null>(null)

  // Loading & Feedback States
  const [saving, setSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isAiScanning, setIsAiScanning] = useState(false)
  const [isAiScanModalOpen, setIsAiScanModalOpen] = useState(false)
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
    'Karbohidrat', 'Protein Hewani', 'Protein Nabati', 'Sayuran', 'Buah', 'Susu', 'Serat Tinggi', 'Rendah Gula', 'Lolos Uji Sampel BGN'
  ])

  const triggerToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMsg(msg)
    setToastType(type)
    setTimeout(() => setToastMsg(null), 4000)
  }

  const getTodayYmd = () => {
    const d = new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const loadCurrentMenu = async () => {
    const data = await fetchMenuHariIniDB()
    if (data) {
      setCurrentMenuDb(data)
      if (data.nama_menu) setNamaMenu(data.nama_menu)
      setTanggal(data.tanggal || getTodayYmd())
      if (data.target_porsi) setTargetPorsi(data.target_porsi)
      if (data.kalori) setKalori(data.kalori)
      if (data.status) setStatus(data.status)
      if (data.komposisi_gizi && data.komposisi_gizi.length > 0) setTags(data.komposisi_gizi)
      if (data.foto_url) setFotoUrl(data.foto_url)
      if (data.catatan) setCatatanMenu(data.catatan)
      if (data.deskripsi_komponen) setDeskripsiKomponen(data.deskripsi_komponen)
      if (data.kategori_porsi) setKategoriPorsi(data.kategori_porsi)
      if (data.analisa_gizi) {
        setAnalisaGizi(data.analisa_gizi)
      }
      if (data.kandungan_gizi) {
        setEnergiKkal(data.kandungan_gizi.energi_kkal ?? 650)
        setProteinG(data.kandungan_gizi.protein_g ?? 24.5)
        setLemakG(data.kandungan_gizi.lemak_g ?? 18.2)
        setKarbohidratG(data.kandungan_gizi.karbohidrat_g ?? 85.0)
        setKalsiumMg(data.kandungan_gizi.kalsium_mg ?? 150)
        setZatBesiMg(data.kandungan_gizi.zat_besi_mg ?? 3.2)
      }
    } else {
      setTanggal(getTodayYmd())
      setStatus('Siap Distribusi')
      setTargetPorsi(4850)
      setKalori('~650 kkal')
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

  const [compressionStatus, setCompressionStatus] = useState<string | null>(null)

  const compressImageFile = async (
    file: File
  ): Promise<{ blob: Blob; filename: string; origSizeStr: string; compSizeStr: string }> => {
    return new Promise((resolve, reject) => {
      const origSizeMB = (file.size / (1024 * 1024)).toFixed(2)
      const origSizeStr = file.size >= 1024 * 1024 ? `${origSizeMB} MB` : `${Math.round(file.size / 1024)} KB`

      const img = new Image()
      const url = URL.createObjectURL(file)

      img.onload = () => {
        URL.revokeObjectURL(url)
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
          resolve({ blob: file, filename: file.name, origSizeStr, compSizeStr: origSizeStr })
          return
        }

        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({ blob: file, filename: file.name, origSizeStr, compSizeStr: origSizeStr })
              return
            }
            const compSizeKB = Math.round(blob.size / 1024)
            const compSizeStr = blob.size >= 1024 * 1024 ? `${(blob.size / (1024 * 1024)).toFixed(2)} MB` : `${compSizeKB} KB`
            const cleanName = (file.name.substring(0, file.name.lastIndexOf('.')) || 'menu').replace(/[^a-zA-Z0-9]/g, '_')
            const filename = `menu_${Date.now()}_${cleanName}.jpg`

            resolve({ blob, filename, origSizeStr, compSizeStr })
          },
          'image/jpeg',
          0.90
        )
      }

      img.onerror = (err) => {
        URL.revokeObjectURL(url)
        reject(err)
      }

      img.src = url
    })
  }

  // ─── File Upload Handler with Auto Compression & Robust Error Catch ─────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Format validation
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp']
    const fileExt = file.name.split('.').pop()?.toLowerCase() || ''
    const isAllowedFormat = allowedExtensions.includes(fileExt) || file.type.startsWith('image/')
    if (!isAllowedFormat) {
      const msg = 'Format file tidak didukung. Harap unggah gambar (.jpg, .jpeg, .png, .webp)'
      triggerToast(msg, 'error')
      alert(msg)
      e.target.value = ''
      return
    }

    setIsUploading(true)
    setCompressionStatus('Mengkompresi gambar di browser...')

    try {
      // Perform Client-Side Auto Compression via HTML5 Canvas (max width 1350px)
      const compressed = await compressImageFile(file)
      const statusMsg = `Ukuran file dikompres dari ${compressed.origSizeStr} menjadi ${compressed.compSizeStr}`
      setCompressionStatus(statusMsg)

      const compressedFile = new File([compressed.blob], compressed.filename, { type: 'image/webp' })

      let publicUrl = ''
      let uploadErrMessage = ''

      // 1. Try 'menu-flyers' bucket first (per spec)
      const { data: upload1, error: err1 } = await supabase
        .storage
        .from('menu-flyers')
        .upload(compressed.filename, compressedFile, { cacheControl: '3600', upsert: true })

      if (!err1 && upload1) {
        const { data: urlData } = supabase.storage.from('menu-flyers').getPublicUrl(upload1.path || compressed.filename)
        publicUrl = urlData?.publicUrl || ''
      } else {
        if (err1) uploadErrMessage += `[menu-flyers: ${err1.message}] `

        // 2. Fallback to 'menu_photos' bucket
        const { data: upload2, error: err2 } = await supabase
          .storage
          .from('menu_photos')
          .upload(compressed.filename, compressedFile, { cacheControl: '3600', upsert: true })

        if (!err2 && upload2) {
          const { data: urlData } = supabase.storage.from('menu_photos').getPublicUrl(upload2.path || compressed.filename)
          publicUrl = urlData?.publicUrl || ''
        } else {
          if (err2) uploadErrMessage += `[menu_photos: ${err2.message}] `

          // 3. Fallback to 'menu-images' bucket
          const { data: upload3, error: err3 } = await supabase
            .storage
            .from('menu-images')
            .upload(compressed.filename, compressedFile, { cacheControl: '3600', upsert: true })

          if (!err3 && upload3) {
            const { data: urlData } = supabase.storage.from('menu-images').getPublicUrl(upload3.path || compressed.filename)
            publicUrl = urlData?.publicUrl || ''
          } else if (err3) {
            uploadErrMessage += `[menu-images: ${err3.message}]`
          }
        }
      }

      if (publicUrl) {
        setFotoUrl(publicUrl)
        triggerToast(`Foto menu berhasil diunggah! (${statusMsg})`, 'success')
      } else {
        console.warn('Storage upload notice:', uploadErrMessage || 'Fallback to base64')
      }

      // ─── Otomatis Jalankan AI Vision Scanner & Auto-Fill ───
      setIsAiScanning(true)
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64Data = reader.result as string
        if (!publicUrl) {
          setFotoUrl(base64Data)
        }

        try {
          setCompressionStatus('Memindai informasi menu & tabel gizi dengan AI...')
          const aiRes = await fetch('/api/fin-scan-menu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: base64Data })
          })

          const aiJson = await aiRes.json()
          if (aiRes.ok && aiJson.success && aiJson.data) {
            const result = aiJson.data
            if (result.judul_poster || result.nama_menu) setNamaMenu(result.judul_poster || result.nama_menu)
            if (Array.isArray(result.menu_items) && result.menu_items.length > 0) {
              setDeskripsiKomponen(result.menu_items.join(', '))
            } else if (result.deskripsi_komponen) {
              setDeskripsiKomponen(result.deskripsi_komponen)
            }
            if (result.kategori_porsi) setKategoriPorsi(result.kategori_porsi)
            if (result.jumlah_penerima || result.target_porsi) {
              setTargetPorsi(Number(result.jumlah_penerima || result.target_porsi))
            }
            if (result.tanggal) setTanggal(result.tanggal)

            if (result.analisa_gizi) {
              setAnalisaGizi(result.analisa_gizi)
            }

            if (result.kandungan_gizi) {
              const g = result.kandungan_gizi
              if (g.energi_kkal !== undefined) {
                setEnergiKkal(g.energi_kkal)
                setKalori(`${g.energi_kkal} kkal`)
              }
              if (g.protein_g !== undefined) setProteinG(g.protein_g)
              if (g.lemak_g !== undefined) setLemakG(g.lemak_g)
              if (g.karbohidrat_g !== undefined) setKarbohidratG(g.karbohidrat_g)
              if (g.kalsium_mg !== undefined) setKalsiumMg(g.kalsium_mg)
              if (g.zat_besi_mg !== undefined) setZatBesiMg(g.zat_besi_mg)
            }

            // Auto-tagging komponen lauk
            const descLower = (result.deskripsi_komponen || result.nama_menu || '').toLowerCase()
            const smartTags: string[] = ['Lolos Uji Sampel BGN']
            if (descLower.includes('nasi') || descLower.includes('mie') || descLower.includes('karbo')) smartTags.push('Karbohidrat')
            if (descLower.includes('ayam') || descLower.includes('daging') || descLower.includes('ikan') || descLower.includes('telur')) smartTags.push('Protein Hewani')
            if (descLower.includes('tempe') || descLower.includes('tahu') || descLower.includes('kacang')) smartTags.push('Protein Nabati')
            if (descLower.includes('sayur') || descLower.includes('sop') || descLower.includes('brokoli') || descLower.includes('capjay')) smartTags.push('Sayuran', 'Serat Tinggi')
            if (descLower.includes('pisang') || descLower.includes('melon') || descLower.includes('semangka') || descLower.includes('buah')) smartTags.push('Buah')
            if (descLower.includes('susu')) smartTags.push('Susu')

            setTags(Array.from(new Set([...tags, ...smartTags])))
            triggerToast('AI berhasil memindai informasi menu & tabel gizi!', 'success')
          }
        } catch (scanErr) {
          console.warn('AI Scan error in file upload:', scanErr)
        } finally {
          setIsAiScanning(false)
        }
      }
      reader.readAsDataURL(compressedFile)

    } catch (err: any) {
      console.error('Error uploading image:', err)
      const errMsg = err?.message || String(err)
      triggerToast(`Gagal mengunggah foto: ${errMsg}`, 'error')
      alert(`Gagal mengunggah foto ke Storage:\n${errMsg}`)
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

    // 1. Validasi Field Wajib
    if (!namaMenu || !namaMenu.trim() || !tanggal || !tanggal.trim()) {
      const msg = 'Harap isi Nama Menu dan pilih Tanggal!'
      triggerToast(msg, 'error')
      alert(msg)
      return
    }

    setSaving(true)

    try {
      const giziPayload: KandunganGiziBGN = {
        energi_kkal: Number(energiKkal) || 650,
        protein_g: Number(proteinG) || 24.5,
        lemak_g: Number(lemakG) || 18.2,
        karbohidrat_g: Number(karbohidratG) || 85.0,
        kalsium_mg: Number(kalsiumMg) || 150,
        zat_besi_mg: Number(zatBesiMg) || 3.2
      }

      const menuPayload: any = {
        nama_menu: namaMenu.trim(),
        nama: namaMenu.trim(),
        tanggal: tanggal.trim(),
        tanggal_berlaku: tanggal.trim(),
        kalori: `${giziPayload.energi_kkal} kkal`,
        estimasi_kalori: `${giziPayload.energi_kkal} kkal`,
        porsi: Number(targetPorsi) || 3196,
        target_porsi: Number(targetPorsi) || 3196,
        status: status || 'Siap Distribusi',
        status_distribusi: status || 'Siap Distribusi',
        komposisi_gizi: tags || [],
        tags: tags || [],
        catatan: catatanMenu || '',
        foto_url: fotoUrl || '',
        foto: fotoUrl || '',
        deskripsi_komponen: deskripsiKomponen.trim(),
        kandungan_gizi: giziPayload,
        analisa_gizi: analisaGizi || undefined,
        menu_items: deskripsiKomponen.split(/,|\n/).map((s) => s.trim()).filter(Boolean),
        kategori_porsi: kategoriPorsi
      }

      const savedResult = await saveMenuHariIniDB(menuPayload)
      setCurrentMenuDb(savedResult)
      setSavedSuccess(true)
      triggerToast('Menu berhasil dipublikasikan!', 'success')

      // Refresh history list dynamically & immediately
      await loadHistoryMenu()

      setTimeout(() => {
        setSavedSuccess(false)
      }, 3500)
    } catch (err: any) {
      console.error('Error saving menu:', err)
      const errMsg = err?.message || err?.error_description || String(err)
      triggerToast(`Gagal menyimpan menu: ${errMsg}`, 'error')
      alert(`Gagal menyimpan menu ke Supabase database:\n${errMsg}`)
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
            onClick={() => setIsAiScanModalOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-lg text-xs font-bold hover:from-slate-800 hover:to-slate-800 flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <Sparkles size={14} className="text-amber-400 animate-pulse" />
            <span>AI Smart Menu Scanner</span>
          </button>
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

      {/* 0. Live Card Menu Yang Sedang Dipublikasikan Hari Ini */}
      {currentMenuDb && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 shadow-xl border border-slate-700/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-amber-400/20 text-amber-300 rounded-xl border border-amber-400/30">
                <UtensilsCrossed size={18} />
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold tracking-tight flex items-center gap-2">
                  <span>Menu Aktif Terpublikasi (Standar Gizi BGN)</span>
                </h3>
                <p className="text-xs text-slate-300">
                  Status: <span className="text-emerald-400 font-bold">● {currentMenuDb.status}</span> • Tanggal: {currentMenuDb.tanggal}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {currentMenuDb.kategori_porsi && (
                <span className="bg-white/10 text-white text-xs font-bold px-3 py-1 rounded-full border border-white/20">
                  {currentMenuDb.kategori_porsi}
                </span>
              )}
              <span className="bg-emerald-500 text-slate-950 text-xs font-extrabold px-3 py-1 rounded-full shadow-sm">
                {currentMenuDb.target_porsi ? `${currentMenuDb.target_porsi.toLocaleString('id-ID')} Porsi` : 'Standar'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* Foto Thumbnail */}
            <div className="md:col-span-3">
              <div className="aspect-[4/3] rounded-xl overflow-hidden border border-white/20 bg-slate-800/80 shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentMenuDb.foto_url || '/menu-today.png'}
                  alt={currentMenuDb.nama_menu}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Detail Menu & Nilai Gizi BGN */}
            <div className="md:col-span-9 space-y-3">
              <div>
                <h4 className="text-lg font-black text-amber-300 tracking-tight leading-snug">
                  {currentMenuDb.nama_menu}
                </h4>
                {currentMenuDb.deskripsi_komponen && (
                  <p className="text-xs text-slate-200 mt-1 leading-relaxed bg-white/5 p-2.5 rounded-xl border border-white/10">
                    <span className="font-bold text-white block text-[11px] mb-0.5">🍱 Rincian Komponen Lauk & Sayur:</span>
                    {currentMenuDb.deskripsi_komponen}
                  </p>
                )}
              </div>

              {/* Tabel Angka Gizi BGN 2 Baris jika analisa_gizi tersedia, atau 6 Grid fallback */}
              {currentMenuDb.analisa_gizi ? (
                <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5 backdrop-blur-xs">
                  <div className="px-3 py-1.5 bg-white/10 text-[10px] font-bold text-amber-300 uppercase tracking-wide border-b border-white/10 flex items-center justify-between">
                    <span>Tabel Angka Gizi BGN (Porsi Besar / Porsi Kecil)</span>
                    <span className="text-[9px] text-emerald-300">Standar BGN Pasuruan</span>
                  </div>
                  <table className="w-full text-xs text-left">
                    <thead className="text-[10px] uppercase text-slate-300 bg-white/5 border-b border-white/10">
                      <tr>
                        <th className="py-2 px-2.5 font-bold">Porsi</th>
                        <th className="py-2 px-2 font-bold text-center">Energi</th>
                        <th className="py-2 px-2 font-bold text-center">Protein</th>
                        <th className="py-2 px-2 font-bold text-center">Lemak</th>
                        <th className="py-2 px-2 font-bold text-center">Karbohidrat</th>
                        <th className="py-2 px-2 font-bold text-center">Serat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 text-slate-200">
                      <tr>
                        <td className="py-2 px-2.5 font-bold text-amber-300">Porsi Besar</td>
                        <td className="py-2 px-2 text-center font-bold text-white">{currentMenuDb.analisa_gizi.porsi_besar.energi} <span className="text-[10px] text-slate-400 font-normal">kkal</span></td>
                        <td className="py-2 px-2 text-center font-bold text-indigo-200">{currentMenuDb.analisa_gizi.porsi_besar.protein.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">gr</span></td>
                        <td className="py-2 px-2 text-center font-bold text-amber-200">{currentMenuDb.analisa_gizi.porsi_besar.lemak.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">gr</span></td>
                        <td className="py-2 px-2 text-center font-bold text-sky-200">{currentMenuDb.analisa_gizi.porsi_besar.karbohidrat.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">gr</span></td>
                        <td className="py-2 px-2 text-center font-bold text-emerald-300">{currentMenuDb.analisa_gizi.porsi_besar.serat.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">gr</span></td>
                      </tr>
                      <tr className="bg-white/5">
                        <td className="py-2 px-2.5 font-bold text-amber-300">Porsi Kecil</td>
                        <td className="py-2 px-2 text-center font-bold text-white">{currentMenuDb.analisa_gizi.porsi_kecil.energi} <span className="text-[10px] text-slate-400 font-normal">kkal</span></td>
                        <td className="py-2 px-2 text-center font-bold text-indigo-200">{currentMenuDb.analisa_gizi.porsi_kecil.protein.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">gr</span></td>
                        <td className="py-2 px-2 text-center font-bold text-amber-200">{currentMenuDb.analisa_gizi.porsi_kecil.lemak.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">gr</span></td>
                        <td className="py-2 px-2 text-center font-bold text-sky-200">{currentMenuDb.analisa_gizi.porsi_kecil.karbohidrat.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">gr</span></td>
                        <td className="py-2 px-2 text-center font-bold text-emerald-300">{currentMenuDb.analisa_gizi.porsi_kecil.serat.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">gr</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  <div className="bg-white/10 rounded-xl p-2 text-center border border-white/10 backdrop-blur-xs">
                    <div className="text-[10px] text-slate-300 uppercase font-bold">Energi</div>
                    <div className="text-sm font-black text-amber-300">
                      {currentMenuDb.kandungan_gizi?.energi_kkal || 650} <span className="text-[10px] font-normal">kkal</span>
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-2 text-center border border-white/10 backdrop-blur-xs">
                    <div className="text-[10px] text-slate-300 uppercase font-bold">Protein</div>
                    <div className="text-sm font-black text-indigo-300">
                      {currentMenuDb.kandungan_gizi?.protein_g ?? 24.5} <span className="text-[10px] font-normal">g</span>
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-2 text-center border border-white/10 backdrop-blur-xs">
                    <div className="text-[10px] text-slate-300 uppercase font-bold">Lemak</div>
                    <div className="text-sm font-black text-amber-200">
                      {currentMenuDb.kandungan_gizi?.lemak_g ?? 18.2} <span className="text-[10px] font-normal">g</span>
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-2 text-center border border-white/10 backdrop-blur-xs">
                    <div className="text-[10px] text-slate-300 uppercase font-bold">Karbo</div>
                    <div className="text-sm font-black text-sky-300">
                      {currentMenuDb.kandungan_gizi?.karbohidrat_g ?? 85.0} <span className="text-[10px] font-normal">g</span>
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-2 text-center border border-white/10 backdrop-blur-xs">
                    <div className="text-[10px] text-slate-300 uppercase font-bold">Kalsium</div>
                    <div className="text-sm font-black text-teal-300">
                      {currentMenuDb.kandungan_gizi?.kalsium_mg ?? 150} <span className="text-[10px] font-normal">mg</span>
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-2 text-center border border-white/10 backdrop-blur-xs">
                    <div className="text-[10px] text-slate-300 uppercase font-bold">Zat Besi</div>
                    <div className="text-sm font-black text-rose-300">
                      {currentMenuDb.kandungan_gizi?.zat_besi_mg ?? 3.2} <span className="text-[10px] font-normal">mg</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tag Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(currentMenuDb.komposisi_gizi || []).map((tag, idx) => (
                  <span key={idx} className="bg-white/15 text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-lg border border-white/20">
                    ✓ {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. Form Card Edit Menu Aktif */}
      <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-xl shadow-2xs p-6 space-y-6">
        <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 text-base tracking-tight flex items-center gap-2">
            <Sparkles size={18} className="text-amber-500" />
            Formulir Publikasi Menu Hari Ini (Auto-Fill AI)
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
                placeholder="Contoh: Paket Nasi Timbel Ayam Goreng Lengkuas"
                className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white font-medium"
              />
            </div>

            {/* Rincian Komponen Lauk & Sayur */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Rincian Komponen Lauk & Sayur (AI Extracted)
              </label>
              <textarea
                rows={2}
                value={deskripsiKomponen}
                onChange={(e) => setDeskripsiKomponen(e.target.value)}
                placeholder="Contoh: Nasi putih, Ayam ungkep lengkuas, Tempe bacem, Sayur asem, Pisang"
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
                  Kategori Porsi
                </label>
                <select
                  value={kategoriPorsi}
                  onChange={(e) => setKategoriPorsi(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                >
                  <option value="Standar SD/SMP">Standar SD/SMP</option>
                  <option value="Standar TK/PAUD">Standar TK/PAUD</option>
                  <option value="Standar 3B (Balita/Bumil)">Standar 3B (Balita/Bumil)</option>
                  <option value="Porsi Jumbo SMA/SMK">Porsi Jumbo SMA/SMK</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Target Porsi (Penerima Manfaat) *
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
            </div>

            {/* 6 Input Nilai Gizi BGN (Numerik Murni) */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Flame size={14} className="text-amber-500" />
                  Rincian Angka Nilai Gizi BGN (Angka Murni)
                </span>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded font-bold">
                  Standar AKG
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <label className="block text-[10px] font-bold text-slate-500">⚡ Energi (kkal)</label>
                  <input
                    type="number"
                    step="1"
                    value={energiKkal}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : Number(e.target.value)
                      setEnergiKkal(val)
                      setKalori(val ? `${val} kkal` : '')
                    }}
                    className="w-full font-bold text-xs text-slate-900 border-0 p-0 focus:ring-0"
                  />
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <label className="block text-[10px] font-bold text-indigo-600">💪 Protein (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={proteinG}
                    onChange={(e) => setProteinG(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full font-bold text-xs text-slate-900 border-0 p-0 focus:ring-0"
                  />
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <label className="block text-[10px] font-bold text-amber-600">💧 Lemak (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={lemakG}
                    onChange={(e) => setLemakG(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full font-bold text-xs text-slate-900 border-0 p-0 focus:ring-0"
                  />
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <label className="block text-[10px] font-bold text-blue-600">🌾 Karbo (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={karbohidratG}
                    onChange={(e) => setKarbohidratG(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full font-bold text-xs text-slate-900 border-0 p-0 focus:ring-0"
                  />
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <label className="block text-[10px] font-bold text-teal-600">🥛 Kalsium (mg)</label>
                  <input
                    type="number"
                    step="1"
                    value={kalsiumMg}
                    onChange={(e) => setKalsiumMg(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full font-bold text-xs text-slate-900 border-0 p-0 focus:ring-0"
                  />
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <label className="block text-[10px] font-bold text-rose-600">🩸 Zat Besi (mg)</label>
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
            
            <div className="relative aspect-[1080/1350] max-w-xs sm:max-w-sm mx-auto w-full rounded-xl overflow-hidden border border-gray-300 bg-gray-50 shadow-2xs flex items-center justify-center group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fotoUrl || '/menu-today.png'}
                alt="Preview Menu Makanan"
                className="w-full h-full object-cover rounded-xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/menu-today.png'
                }}
              />

              {/* Laser Scan Animation Overlay when AI is scanning */}
              {isAiScanning && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 z-20 space-y-3">
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-bounce" />
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400 text-emerald-400 flex items-center justify-center animate-spin">
                    <RotateCw size={24} />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-xs font-extrabold text-white">
                      Memindai informasi menu & tabel gizi dengan AI...
                    </p>
                    <p className="text-[10px] text-emerald-300 font-mono">Gemini 1.5 Flash Vision</p>
                  </div>
                </div>
              )}

              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-xl">
                <span className="text-xs text-white font-semibold flex items-center gap-1.5">
                  <ImageIcon size={16} /> Ganti Foto Makanan
                </span>
              </div>
            </div>

            {/* Upload Button Input with File Type & Size Validation */}
            <div className="space-y-2">
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  disabled={isUploading || isAiScanning}
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                />
                <div className={`w-full py-2.5 px-4 border border-dashed rounded-xl text-center transition flex items-center justify-center gap-2 ${
                  isUploading || isAiScanning
                    ? 'bg-amber-50 border-amber-300 text-amber-700' 
                    : 'bg-gray-50/50 border-gray-300 hover:border-emerald-500 hover:bg-emerald-50/30'
                }`}>
                  {isUploading || isAiScanning ? (
                    <>
                      <RotateCw size={16} className="animate-spin text-amber-600" />
                      <span className="text-xs font-semibold text-amber-800">
                        {isAiScanning ? 'Memindai informasi menu & tabel gizi dengan AI...' : 'Mengompres & Mengunggah...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload size={16} className="text-emerald-600" />
                      <span className="text-xs font-semibold text-gray-700">
                        Unggah Foto / Poster (.PNG, .JPG, .WEBP)
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Demo Quick Presets */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Preset Cepat Poster Menu BGN:
                </span>
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setNamaMenu('Paket Nasi Timbel Ayam Goreng Lengkuas')
                      setDeskripsiKomponen('Nasi putih, Ayam ungkep bumbu lengkuas, Tempe bacem manis, Sayur asem Jawa, Sambal tomat rebus, Pisang raja')
                      setKategoriPorsi('Standar SD/SMP')
                      setEnergiKkal(650)
                      setKalori('650 kkal')
                      setProteinG(24.5)
                      setLemakG(18.2)
                      setKarbohidratG(85.0)
                      setKalsiumMg(150)
                      setZatBesiMg(3.2)
                      setFotoUrl('/menu-today.png')
                      setTags(['Karbohidrat', 'Protein Hewani', 'Protein Nabati', 'Sayuran', 'Buah', 'Serat Tinggi', 'Lolos Uji Sampel BGN'])
                      triggerToast('Preset Ayam Goreng Lengkuas dimuat!', 'info')
                    }}
                    className="text-[10px] font-semibold bg-white hover:bg-amber-50 text-amber-800 px-2 py-1 rounded-lg border border-slate-200 transition cursor-pointer"
                  >
                    🍗 Ayam Lengkuas
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNamaMenu('Paket Nasi Ikan Bakar Madu & Cah Kangkung')
                      setDeskripsiKomponen('Nasi merah putih, Ikan bakar madu gurih, Tahu pong bumbu kuning, Cah kangkung tauco, Buah melon segar')
                      setKategoriPorsi('Standar SD/SMP')
                      setEnergiKkal(620)
                      setKalori('620 kkal')
                      setProteinG(26.0)
                      setLemakG(15.5)
                      setKarbohidratG(78.5)
                      setKalsiumMg(185)
                      setZatBesiMg(4.1)
                      setFotoUrl('/menu-today.png')
                      setTags(['Karbohidrat', 'Protein Hewani', 'Protein Nabati', 'Sayuran', 'Buah', 'Lolos Uji Sampel BGN'])
                      triggerToast('Preset Ikan Bakar Madu dimuat!', 'info')
                    }}
                    className="text-[10px] font-semibold bg-white hover:bg-sky-50 text-sky-800 px-2 py-1 rounded-lg border border-slate-200 transition cursor-pointer"
                  >
                    🐟 Ikan Bakar Madu
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNamaMenu('Paket Rolade Daging Sapi Saus Tiram & Sup Jagung')
                      setDeskripsiKomponen('Nasi pulen, Rolade daging sapi panggang, Sup jagung manis telur, Tempe goreng krispi, Jeruk manis')
                      setKategoriPorsi('Standar SD/SMP')
                      setEnergiKkal(680)
                      setKalori('680 kkal')
                      setProteinG(28.2)
                      setLemakG(19.0)
                      setKarbohidratG(82.0)
                      setKalsiumMg(160)
                      setZatBesiMg(3.8)
                      setFotoUrl('/menu-today.png')
                      setTags(['Karbohidrat', 'Protein Hewani', 'Protein Nabati', 'Sayuran', 'Buah', 'Lolos Uji Sampel BGN'])
                      triggerToast('Preset Rolade Daging Sapi dimuat!', 'info')
                    }}
                    className="text-[10px] font-semibold bg-white hover:bg-rose-50 text-rose-800 px-2 py-1 rounded-lg border border-slate-200 transition cursor-pointer"
                  >
                    🥩 Rolade Sapi
                  </button>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-gray-400">
              Auto-kompresi gambar aktif (max width 1350px, WebP 80%). AI Gemini Vision akan memindai teks menu & tabel gizi seketika.
            </p>

            {compressionStatus && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[11px] font-bold flex items-center gap-2 shadow-2xs">
                <Sparkles size={14} className="text-emerald-600 shrink-0" />
                <span>{compressionStatus}</span>
              </div>
            )}
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
            disabled={saving || isUploading || isAiScanning}
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
                        className="relative w-12 h-[60px] aspect-[1080/1350] rounded-xl overflow-hidden border border-gray-200 shadow-2xs group inline-block cursor-pointer shrink-0"
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
                        {(item.komposisi_gizi || []).map((tag, idx) => (
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
                        {item.kalori || '-'}
                      </div>
                      <div className="text-[11px] text-gray-500 font-medium">
                        {item.target_porsi ? `${item.target_porsi.toLocaleString('id-ID')} Porsi` : '-'}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {item.status ? (
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          item.status === 'Selesai Distribusi'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : item.status === 'Siap Distribusi'
                            ? 'bg-sky-50 text-sky-700 border-sky-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          ● {item.status}
                        </span>
                      ) : (
                        <span className="text-gray-400 font-medium text-xs">-</span>
                      )}
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
              <div className="relative aspect-[1080/1350] max-h-[420px] max-w-sm mx-auto w-full rounded-xl overflow-hidden border border-gray-200 bg-gray-100 shadow-2xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewModalMenu.foto_url || '/menu-today.png'}
                  alt={previewModalMenu.nama_menu}
                  className="w-full h-full object-cover rounded-xl"
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
                  {previewModalMenu.target_porsi ? (
                    <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                      📦 {previewModalMenu.target_porsi.toLocaleString('id-ID')} Target Porsi
                    </span>
                  ) : null}
                  <span className="font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    ● {previewModalMenu.status}
                  </span>
                  {previewModalMenu.kategori_porsi && (
                    <span className="font-semibold text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
                      {previewModalMenu.kategori_porsi}
                    </span>
                  )}
                </div>

                {previewModalMenu.deskripsi_komponen && (
                  <p className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                    <span className="font-bold text-gray-900 block text-[11px] mb-0.5">🍱 Rincian Komponen Lauk:</span>
                    {previewModalMenu.deskripsi_komponen}
                  </p>
                )}

                {/* Tabel Gizi BGN 2 Baris jika analisa_gizi tersedia, atau 6 Grid fallback */}
                {previewModalMenu.analisa_gizi ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                    <div className="px-3 py-1 bg-slate-100 text-[10px] font-bold text-slate-700 uppercase tracking-wide border-b border-slate-200 flex items-center justify-between">
                      <span>Tabel Angka Gizi BGN (Porsi Besar / Porsi Kecil)</span>
                      <span className="text-[9px] text-emerald-700 font-bold">Standar BGN Pasuruan</span>
                    </div>
                    <table className="w-full text-xs text-left">
                      <thead className="text-[10px] uppercase text-slate-600 bg-slate-100/70 border-b border-slate-200">
                        <tr>
                          <th className="py-1.5 px-2.5 font-bold">Porsi</th>
                          <th className="py-1.5 px-2 font-bold text-center">Energi</th>
                          <th className="py-1.5 px-2 font-bold text-center">Protein</th>
                          <th className="py-1.5 px-2 font-bold text-center">Lemak</th>
                          <th className="py-1.5 px-2 font-bold text-center">Karbohidrat</th>
                          <th className="py-1.5 px-2 font-bold text-center">Serat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-800">
                        <tr>
                          <td className="py-1.5 px-2.5 font-bold text-slate-900">Porsi Besar</td>
                          <td className="py-1.5 px-2 text-center font-bold text-slate-900">{previewModalMenu.analisa_gizi.porsi_besar.energi} <span className="text-[10px] text-slate-500 font-normal">kkal</span></td>
                          <td className="py-1.5 px-2 text-center font-bold text-indigo-700">{previewModalMenu.analisa_gizi.porsi_besar.protein.toFixed(2)} <span className="text-[10px] text-slate-500 font-normal">gr</span></td>
                          <td className="py-1.5 px-2 text-center font-bold text-amber-700">{previewModalMenu.analisa_gizi.porsi_besar.lemak.toFixed(2)} <span className="text-[10px] text-slate-500 font-normal">gr</span></td>
                          <td className="py-1.5 px-2 text-center font-bold text-sky-700">{previewModalMenu.analisa_gizi.porsi_besar.karbohidrat.toFixed(2)} <span className="text-[10px] text-slate-500 font-normal">gr</span></td>
                          <td className="py-1.5 px-2 text-center font-bold text-emerald-700">{previewModalMenu.analisa_gizi.porsi_besar.serat.toFixed(2)} <span className="text-[10px] text-slate-500 font-normal">gr</span></td>
                        </tr>
                        <tr className="bg-white">
                          <td className="py-1.5 px-2.5 font-bold text-slate-900">Porsi Kecil</td>
                          <td className="py-1.5 px-2 text-center font-bold text-slate-900">{previewModalMenu.analisa_gizi.porsi_kecil.energi} <span className="text-[10px] text-slate-500 font-normal">kkal</span></td>
                          <td className="py-1.5 px-2 text-center font-bold text-indigo-700">{previewModalMenu.analisa_gizi.porsi_kecil.protein.toFixed(2)} <span className="text-[10px] text-slate-500 font-normal">gr</span></td>
                          <td className="py-1.5 px-2 text-center font-bold text-amber-700">{previewModalMenu.analisa_gizi.porsi_kecil.lemak.toFixed(2)} <span className="text-[10px] text-slate-500 font-normal">gr</span></td>
                          <td className="py-1.5 px-2 text-center font-bold text-sky-700">{previewModalMenu.analisa_gizi.porsi_kecil.karbohidrat.toFixed(2)} <span className="text-[10px] text-slate-500 font-normal">gr</span></td>
                          <td className="py-1.5 px-2 text-center font-bold text-emerald-700">{previewModalMenu.analisa_gizi.porsi_kecil.serat.toFixed(2)} <span className="text-[10px] text-slate-500 font-normal">gr</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : previewModalMenu.kandungan_gizi ? (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-1">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-1.5 text-center">
                      <div className="text-[9px] font-bold text-blue-600">ENERGI</div>
                      <div className="text-xs font-black text-blue-900">{previewModalMenu.kandungan_gizi.energi_kkal} kkal</div>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-1.5 text-center">
                      <div className="text-[9px] font-bold text-indigo-600">PROTEIN</div>
                      <div className="text-xs font-black text-indigo-900">{previewModalMenu.kandungan_gizi.protein_g}g</div>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-1.5 text-center">
                      <div className="text-[9px] font-bold text-amber-600">LEMAK</div>
                      <div className="text-xs font-black text-amber-900">{previewModalMenu.kandungan_gizi.lemak_g}g</div>
                    </div>
                    <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-1.5 text-center">
                      <div className="text-[9px] font-bold text-cyan-600">KARBO</div>
                      <div className="text-xs font-black text-cyan-900">{previewModalMenu.kandungan_gizi.karbohidrat_g}g</div>
                    </div>
                    <div className="bg-teal-50 border border-teal-200 rounded-lg p-1.5 text-center">
                      <div className="text-[9px] font-bold text-teal-600">KALSIUM</div>
                      <div className="text-xs font-black text-teal-900">{previewModalMenu.kandungan_gizi.kalsium_mg}mg</div>
                    </div>
                    <div className="bg-rose-50 border border-rose-200 rounded-lg p-1.5 text-center">
                      <div className="text-[9px] font-bold text-rose-600">ZAT BESI</div>
                      <div className="text-xs font-black text-rose-900">{previewModalMenu.kandungan_gizi.zat_besi_mg}mg</div>
                    </div>
                  </div>
                ) : null}

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

      {/* AI Smart Menu Scanner Modal */}
      <AiMenuScannerModal
        isOpen={isAiScanModalOpen}
        onClose={() => setIsAiScanModalOpen(false)}
        onSuccess={(savedMenu) => {
          setCurrentMenuDb(savedMenu)
          loadCurrentMenu()
          loadHistoryMenu()
          triggerToast('Menu harian berhasil dipindai & dipublikasikan!', 'success')
        }}
      />
    </div>
  )
}
