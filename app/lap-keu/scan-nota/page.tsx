"use client"

import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Receipt,
  X,
  ArrowRight
} from 'lucide-react'
import { OlloStore, OlloWallet, formatRupiahFull } from '@/lib/ollo-store'

export default function OlloScanNotaPage() {
  const [isScanning, setIsScanning] = useState(false)
  const [scanData, setScanData] = useState<any>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [selectedWalletId, setSelectedWalletId] = useState('w-gopay')
  const [savedSuccess, setSavedSuccess] = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)
  const wallets = OlloStore.getWallets()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      if (evt.target?.result) {
        processReceipt(evt.target.result as string)
      }
    }
    reader.readAsDataURL(file)
  }

  const processReceipt = async (base64Str: string) => {
    setIsScanning(true)
    setSavedSuccess(false)
    try {
      const res = await fetch('/api/fin-scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Str })
      })

      const data = await res.json()
      if (res.ok && data.success && data.data) {
        setScanData(data.data)
        setShowConfirmation(true)
      } else {
        alert(data.error || 'Gagal membaca nota dengan AI. Pastikan GEMINI_API_KEY sudah disetel.')
      }
    } catch (err: any) {
      alert('Gagal memproses nota: ' + (err?.message || err))
    } finally {
      setIsScanning(false)
    }
  }

  const loadDemo = (type: 'indomaret' | 'bensin' | 'resto') => {
    let mock = 'data:image/jpeg;base64,mock'
    if (type === 'bensin') mock += '123'
    if (type === 'resto') mock += '456'
    processReceipt(mock)
  }

  const handleConfirmSave = () => {
    if (!scanData) return

    OlloStore.addTransaction({
      wallet_id: selectedWalletId,
      type: 'expense',
      amount: scanData.total,
      category: scanData.category.includes('Makanan') ? '🍜 Makanan & Minuman' : '🛒 Belanja Bulanan',
      note: `${scanData.merchant} (${scanData.items?.length || 1} items)`,
      date: scanData.date || new Date().toISOString().split('T')[0],
      merchant: scanData.merchant
    })

    setShowConfirmation(false)
    setSavedSuccess(true)
  }

  return (
    <div className="space-y-6 pb-12 max-w-xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Camera className="text-emerald-600" size={22} />
          Scan Nota Belanja AI
        </h1>
        <p className="text-xs text-slate-500">
          Foto atau unggah nota belanja. Ollo Vision AI akan membaca nominal, merchant, & kategori secara otomatis.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>Transaksi nota belanja berhasil ditambahkan!</span>
          </div>
          <a href="/lap-keu" className="underline text-emerald-700">Lihat Home →</a>
        </div>
      )}

      {/* Main Dropzone */}
      <div className="p-8 bg-white border border-slate-200/80 rounded-3xl text-center space-y-4 shadow-2xs relative">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-2xl border border-emerald-100">
          📷
        </div>

        <div className="space-y-1">
          <h3 className="font-bold text-sm text-slate-900">Unggah Foto Struk Belanja</h3>
          <p className="text-xs text-slate-400">Indomaret, Alfamart, SPBU Pertamina, Restoran</p>
        </div>

        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs shadow-xs hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Upload size={15} />
            <span>Pilih Foto</span>
          </button>
        </div>

        {isScanning && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-xs rounded-3xl flex flex-col items-center justify-center space-y-2 z-10">
            <RefreshCw size={28} className="text-emerald-600 animate-spin" />
            <span className="text-xs font-bold text-slate-800">Menganalisis Nota Belanja...</span>
          </div>
        )}
      </div>

      {/* Demo Presets */}
      <div className="space-y-2">
        <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
          Demo Cepat Preset Struk
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => loadDemo('indomaret')}
            className="p-3 bg-white border border-slate-200 rounded-xl text-left text-xs font-bold text-slate-700 hover:border-emerald-500 transition"
          >
            🛒 Indomaret Sembako
          </button>
          <button
            type="button"
            onClick={() => loadDemo('bensin')}
            className="p-3 bg-white border border-slate-200 rounded-xl text-left text-xs font-bold text-slate-700 hover:border-emerald-500 transition"
          >
            ⛽ SPBU Pertamina
          </button>
          <button
            type="button"
            onClick={() => loadDemo('resto')}
            className="p-3 bg-white border border-slate-200 rounded-xl text-left text-xs font-bold text-slate-700 hover:border-emerald-500 transition"
          >
            🍲 Resto Bebek Goreng
          </button>
        </div>
      </div>

      {/* Single-Screen Confirmation Sheet */}
      <AnimatePresence>
        {showConfirmation && scanData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 border border-slate-100"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={16} className="text-emerald-600" />
                  <h3 className="font-extrabold text-slate-900 text-sm">Konfirmasi Nota Belanja</h3>
                </div>
                <button onClick={() => setShowConfirmation(false)} className="p-1 text-slate-400 hover:text-slate-700">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-1">
                  <div className="text-[10px] text-slate-400 font-semibold">Toko / Merchant:</div>
                  <div className="font-extrabold text-slate-900 text-sm">{scanData.merchant}</div>
                  <div className="text-[10px] text-slate-500">Tanggal: {scanData.date}</div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Pilih Dompet Pemotongan</label>
                  <select
                    value={selectedWalletId}
                    onChange={(e) => setSelectedWalletId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium"
                  >
                    {wallets.map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({formatRupiahFull(w.balance)})</option>
                    ))}
                  </select>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500">Item Terbaca:</span>
                  <div className="space-y-1 max-h-32 overflow-y-auto pt-1">
                    {scanData.items?.map((it: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-[11px]">
                        <span className="text-slate-700 font-medium">{it.item_name || it.name}</span>
                        <span className="font-bold text-slate-900">{formatRupiahFull(it.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-baseline pt-2 border-t border-slate-100">
                  <span className="font-bold text-slate-600">Total Nominal:</span>
                  <span className="text-lg font-black text-emerald-600">{formatRupiahFull(scanData.total)}</span>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowConfirmation(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 font-semibold text-slate-600"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmSave}
                    className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-extrabold shadow-md cursor-pointer hover:bg-emerald-700"
                  >
                    ✓ Catat Transaksi
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
