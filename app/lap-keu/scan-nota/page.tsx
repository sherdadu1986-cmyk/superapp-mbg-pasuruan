"use client"

import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ScanLine,
  Upload,
  Camera,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Trash2,
  Plus,
  RefreshCw,
  Receipt,
  Building2,
  Calendar,
  CreditCard,
  Wallet,
  Tag,
  ArrowRight
} from 'lucide-react'
import { FinoraStore, formatRupiah } from '@/lib/finora-store'

interface ScannedItem {
  item_name: string
  price: number
  category?: string
  quantity?: number
}

interface ScanResult {
  merchant: string
  date: string
  total: number
  payment_method: string
  category: string
  items: ScannedItem[]
  confidence: number
}

export default function ScanNotaPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [saveAccount, setSaveAccount] = useState('GoPay / QRIS')
  const [savedSuccess, setSavedSuccess] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelected = (base64Str: string) => {
    setSelectedImage(base64Str)
    scanReceiptAPI(base64Str)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      if (evt.target?.result) {
        handleImageSelected(evt.target.result as string)
      }
    }
    reader.readAsDataURL(file)
  }

  // API Call Handler
  const scanReceiptAPI = async (imageBase64: string) => {
    setIsScanning(true)
    setSavedSuccess(false)
    try {
      const res = await fetch('/api/fin-scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 })
      })

      const data = await res.json()
      if (data.success && data.data) {
        const formattedData: ScanResult = {
          ...data.data,
          items: (data.data.items || []).map((it: any) => ({
            item_name: it.item_name || it.name || 'Item Nota',
            price: Number(it.price) || 0,
            category: it.category || data.data.category,
            quantity: it.quantity || 1
          }))
        }
        setScanResult(formattedData)
        setShowConfirmModal(true)
      } else {
        alert('Gagal memproses gambar nota: ' + (data.error || 'Format tidak valid'))
      }
    } catch (err: any) {
      alert('Terjadi kesalahan sistem saat memproses nota: ' + err.message)
    } finally {
      setIsScanning(false)
    }
  }

  // Presets for fast instant demo
  const loadPreset = (presetType: 'indomaret' | 'bensin' | 'resto') => {
    let base64Mock = 'data:image/jpeg;base64,mockImage'
    if (presetType === 'bensin') base64Mock += '12345'
    if (presetType === 'resto') base64Mock += '123'
    handleImageSelected(base64Mock)
  }

  // Edit item inside modal
  const handleItemChange = (index: number, field: keyof ScannedItem, value: any) => {
    if (!scanResult) return
    const updatedItems = [...scanResult.items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }

    const newTotal = updatedItems.reduce((acc, item) => acc + (Number(item.price) || 0), 0)
    setScanResult({
      ...scanResult,
      items: updatedItems,
      total: newTotal > 0 ? newTotal : scanResult.total
    })
  }

  const addItemRow = () => {
    if (!scanResult) return
    setScanResult({
      ...scanResult,
      items: [...scanResult.items, { item_name: 'Item Baru', price: 10000, category: scanResult.category }]
    })
  }

  const removeItemRow = (index: number) => {
    if (!scanResult) return
    const updatedItems = scanResult.items.filter((_, i) => i !== index)
    const newTotal = updatedItems.reduce((acc, item) => acc + (Number(item.price) || 0), 0)
    setScanResult({
      ...scanResult,
      items: updatedItems,
      total: newTotal
    })
  }

  // Save to DB & Store
  const handleConfirmAndSave = () => {
    if (!scanResult) return

    FinoraStore.addTransaction({
      date: scanResult.date || new Date().toISOString().split('T')[0],
      amount: scanResult.total,
      type: 'expense',
      category: scanResult.category,
      account_name: saveAccount,
      merchant: scanResult.merchant,
      notes: `Nota OCR AI (${scanResult.items.length} items)`,
      payment_method: scanResult.payment_method,
      items: scanResult.items
    })

    setShowConfirmModal(false)
    setSavedSuccess(true)
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/50 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-widest flex items-center gap-1">
              <Sparkles size={13} /> VISION AI ENGINE
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <ScanLine className="text-emerald-400" />
            AI Receipt & Invoice Scanner
          </h1>
          <p className="text-xs text-slate-400">
            Unggah atau foto nota fisik belanja. Vision AI akan mengekstrak merchant, tanggal, total, dan rincian item secara otomatis!
          </p>
        </div>
      </div>

      {/* Success Notification Banner */}
      {savedSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-between text-xs font-bold"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-400" />
            <span>Transaksi nota belanja berhasil diekstrak dan disimpan ke database! Saldo akun diperbarui.</span>
          </div>
          <a href="/lap-keu/transaksi" className="underline hover:text-white">
            Lihat di Transaksi →
          </a>
        </motion.div>
      )}

      {/* Main Upload Dropzone & Camera Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Drag & Drop Area */}
        <div className="lg:col-span-2 p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileUpload}
          />

          <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <Upload size={36} />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Unggah atau Ambil Foto Nota Fisik</h3>
            <p className="text-xs text-slate-400 max-w-md">
              Mendukung nota Alfamart, Indomaret, SPBU Pertamina, Restoran, Supermarket, dan Tokopedia.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 hover:scale-105 transition active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Upload size={16} />
              <span>Pilih Gambar Nota</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition flex items-center gap-2 cursor-pointer"
            >
              <Camera size={16} className="text-emerald-400" />
              <span>Kamera HP</span>
            </button>
          </div>

          {/* Loading Indicator */}
          {isScanning && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center space-y-3 z-20">
              <RefreshCw size={36} className="text-emerald-400 animate-spin" />
              <div className="text-sm font-bold text-white">Vision AI Sedang Menganalisis Nota...</div>
              <p className="text-xs text-slate-400">Mengekstrak Merchant, Tanggal, Total, & Rincian Baris Item...</p>
            </div>
          )}
        </div>

        {/* Right 1 Col: Preset Quick Testing Buttons */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="space-y-1">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Sparkles size={18} className="text-emerald-400" />
              Demo Cepat Preset Nota
            </h3>
            <p className="text-xs text-slate-400">
              Uji coba fitur Vision AI secara langsung tanpa mengunggah foto fisik.
            </p>
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => loadPreset('indomaret')}
              className="w-full p-3.5 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-left transition flex items-center justify-between group"
            >
              <div>
                <div className="font-bold text-white text-xs group-hover:text-emerald-400">🛒 Nota Indomaret Kiduldalem</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Sembako: Minyak, Beras, Deterjen</div>
              </div>
              <ArrowRight size={14} className="text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition" />
            </button>

            <button
              type="button"
              onClick={() => loadPreset('bensin')}
              className="w-full p-3.5 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-left transition flex items-center justify-between group"
            >
              <div>
                <div className="font-bold text-white text-xs group-hover:text-cyan-400">⛽ Struk SPBU Pertamina</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Bensin Pertamax Green 95 Full Tank</div>
              </div>
              <ArrowRight size={14} className="text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition" />
            </button>

            <button
              type="button"
              onClick={() => loadPreset('resto')}
              className="w-full p-3.5 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-left transition flex items-center justify-between group"
            >
              <div>
                <div className="font-bold text-white text-xs group-hover:text-amber-400">🍲 Struk Resto Bebek Goreng</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Makan Malam Keluarga 5 Item</div>
              </div>
              <ArrowRight size={14} className="text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Confirmation Modal (Side-by-Side Analysis & Editing) */}
      <AnimatePresence>
        {showConfirmModal && scanResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl p-6 relative my-8"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles size={20} className="text-emerald-400" />
                  <h3 className="font-extrabold text-white text-base">Hasil Konfirmasi Vision AI OCR</h3>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Akurasi {Math.round(scanResult.confidence * 100)}%
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg"
                >
                  ✕
                </button>
              </div>

              {/* Side-by-Side Grid Layout */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mt-4">
                {/* Left 2 Cols: Image Preview */}
                <div className="md:col-span-2 p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center space-y-3">
                  <span className="text-xs font-bold text-slate-400 self-start">Visual Pre-Scan:</span>
                  <div className="w-full h-64 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden relative">
                    {selectedImage && !selectedImage.includes('mockImage') ? (
                      <img src={selectedImage} alt="Receipt" className="max-h-full object-contain" />
                    ) : (
                      <div className="p-4 text-center space-y-2">
                        <Receipt size={48} className="text-emerald-400 mx-auto opacity-80" />
                        <span className="text-xs font-bold text-slate-300 block">{scanResult.merchant}</span>
                        <span className="text-[11px] text-slate-500 block font-mono">{scanResult.date}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 text-center">
                    Periksa kembali data ekstraksi di sisi kanan sebelum menyimpan.
                  </p>
                </div>

                {/* Right 3 Cols: Editable Analysis Form & Itemized Table */}
                <div className="md:col-span-3 space-y-4">
                  {/* Top Metadata Editable Fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Nama Merchant / Toko</label>
                      <input
                        type="text"
                        value={scanResult.merchant}
                        onChange={(e) => setScanResult({ ...scanResult, merchant: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Tanggal Transaksi</label>
                      <input
                        type="date"
                        value={scanResult.date}
                        onChange={(e) => setScanResult({ ...scanResult, date: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Kategori Pos</label>
                      <select
                        value={scanResult.category}
                        onChange={(e) => setScanResult({ ...scanResult, category: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Kebutuhan Rumah Tangga">Kebutuhan Rumah Tangga</option>
                        <option value="Makanan & Kuliner">Makanan & Kuliner</option>
                        <option value="Transportasi">Transportasi</option>
                        <option value="Tagihan & Utilitas">Tagihan & Utilitas</option>
                        <option value="Rumah & Cicilan">Rumah & Cicilan</option>
                        <option value="Hiburan & Gaya Hidup">Hiburan & Gaya Hidup</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Potong Rekening</label>
                      <select
                        value={saveAccount}
                        onChange={(e) => setSaveAccount(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="GoPay / QRIS">GoPay / QRIS</option>
                        <option value="BCA Express">BCA Express</option>
                        <option value="Mandiri Utama">Mandiri Utama</option>
                        <option value="Dompet Tunai">Dompet Tunai</option>
                      </select>
                    </div>
                  </div>

                  {/* Itemized Table Breakdown */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                      <span>Rincian Item Nota Per Baris:</span>
                      <button
                        type="button"
                        onClick={addItemRow}
                        className="text-emerald-400 hover:underline flex items-center gap-1 text-[11px]"
                      >
                        <Plus size={12} /> Tambah Item
                      </button>
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                      {scanResult.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 text-xs">
                          <input
                            type="text"
                            value={item.item_name}
                            onChange={(e) => handleItemChange(idx, 'item_name', e.target.value)}
                            className="flex-1 bg-transparent text-white font-semibold focus:outline-none border-b border-slate-700 px-1"
                            placeholder="Nama Item"
                          />
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) => handleItemChange(idx, 'price', Number(e.target.value))}
                            className="w-24 bg-transparent text-emerald-400 font-extrabold text-right focus:outline-none border-b border-slate-700 px-1"
                            placeholder="Harga"
                          />
                          <button
                            type="button"
                            onClick={() => removeItemRow(idx)}
                            className="p-1 text-slate-500 hover:text-rose-400"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total & Action Button */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block">Total Akhir Nota:</span>
                      <span className="text-xl font-extrabold text-emerald-400">{formatRupiah(scanResult.total)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowConfirmModal(false)}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmAndSave}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/25 hover:scale-105 transition cursor-pointer flex items-center gap-1.5"
                      >
                        <CheckCircle2 size={16} />
                        <span>✓ Konfirmasi & Simpan Transaksi</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
