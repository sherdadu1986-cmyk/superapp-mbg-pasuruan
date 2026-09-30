"use client"

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Check, Trash2, Loader2 } from 'lucide-react'
import { OlloWallet, formatRupiahFull } from '@/lib/ollo-store'
import { BANK_PRESETS, BankPreset } from '@/lib/bank-presets'
import { supabase } from '@/lib/supabase'

interface ModalWalletProps {
  isOpen: boolean
  editingWallet: OlloWallet | null
  totalWalletsCount?: number
  onClose: () => void
  onSave: (data: {
    name: string
    balance: number
    card_number?: string
    type: 'cash' | 'bank' | 'wallet' | 'credit'
    color: 'emerald' | 'blue' | 'cyan' | 'purple' | 'amber' | 'rose'
    logo_url?: string
    icon?: string
  }) => void
  onDelete?: (id: string) => void
}

export default function ModalWallet({
  isOpen,
  editingWallet,
  totalWalletsCount = 1,
  onClose,
  onSave,
  onDelete
}: ModalWalletProps) {
  const [name, setName] = useState('')
  const [balance, setBalance] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [type, setType] = useState<'cash' | 'bank' | 'wallet' | 'credit'>('bank')
  const [color, setColor] = useState<'emerald' | 'blue' | 'cyan' | 'purple' | 'amber' | 'rose'>('blue')
  const [selectedPresetId, setSelectedPresetId] = useState<string>('')
  const [logoUrl, setLogoUrl] = useState<string>('')
  const [customLogoPreview, setCustomLogoPreview] = useState<string>('')
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingWallet) {
      setName(editingWallet.name)
      setBalance(formatRupiahFull(editingWallet.balance))
      setCardNumber(editingWallet.card_number || '')
      setType(editingWallet.type)
      setColor(editingWallet.color)
      setLogoUrl(editingWallet.logo_url || '')
      setCustomLogoPreview(editingWallet.logo_url || '')
      setSelectedPresetId('')
    } else {
      const defaultPreset = BANK_PRESETS[3] || BANK_PRESETS[0] // Default to BNI
      setName(defaultPreset.shortName)
      setBalance('Rp 5.000.000')
      setCardNumber('')
      setType(defaultPreset.type)
      setColor(defaultPreset.color)
      setLogoUrl(defaultPreset.logoSvg)
      setCustomLogoPreview('')
      setSelectedPresetId(defaultPreset.id)
    }
  }, [editingWallet, isOpen])

  const handleSelectPreset = (preset: BankPreset) => {
    setSelectedPresetId(preset.id)
    setName(preset.shortName)
    setType(preset.type)
    setColor(preset.color)
    setLogoUrl(preset.logoSvg)
    setCustomLogoPreview('')
  }

  const handleCustomLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    // Generate local preview
    const reader = new FileReader()
    reader.onload = (evt) => {
      if (evt.target?.result) {
        const dataUrl = evt.target.result as string
        setCustomLogoPreview(dataUrl)
        setLogoUrl(dataUrl)
        setSelectedPresetId('custom')
      }
    }
    reader.readAsDataURL(file)

    // Upload file to Supabase Storage bucket 'fin_assets' or 'fin_receipts'
    try {
      const fileName = `wallet_logo_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
      
      const { data, error } = await supabase.storage
        .from('fin_assets')
        .upload(fileName, file, { upsert: true })

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage
          .from('fin_assets')
          .getPublicUrl(fileName)

        if (publicUrlData?.publicUrl) {
          setLogoUrl(publicUrlData.publicUrl)
        }
      } else {
        const { data: fallbackData, error: fallbackErr } = await supabase.storage
          .from('fin_receipts')
          .upload(fileName, file, { upsert: true })

        if (!fallbackErr && fallbackData) {
          const { data: publicUrlData } = supabase.storage
            .from('fin_receipts')
            .getPublicUrl(fileName)

          if (publicUrlData?.publicUrl) {
            setLogoUrl(publicUrlData.publicUrl)
          }
        }
      }
    } catch (err) {
      console.warn('Storage upload error note:', err)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    const num = parseInt(balance.replace(/\D/g, '')) || 0

    setTimeout(() => {
      onSave({
        name: name.trim(),
        balance: num,
        card_number: cardNumber.trim() || undefined,
        type,
        color,
        logo_url: logoUrl,
        icon: type === 'bank' ? '🏦' : type === 'wallet' ? '📱' : '💵'
      })
      setIsSubmitting(false)
    }, 200)
  }

  const handleDelete = () => {
    if (!editingWallet || !onDelete) return

    if (totalWalletsCount <= 1) {
      alert('Tidak dapat menghapus. Sistem memerlukan minimal 1 dompet/rekening aktif.')
      return
    }

    if (confirm(`Hapus dompet "${editingWallet.name}"? Seluruh riwayat transaksi dompet ini akan ikut terhapus.`)) {
      onDelete(editingWallet.id)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 border border-slate-100 max-h-[90vh] overflow-y-auto scrollbar-thin"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center text-lg font-bold">
                🏦
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                  {editingWallet ? 'Sunting & Koreksi Saldo Rekening' : 'Tambah Rekening / Dompet Baru'}
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">
                  {editingWallet ? 'Perbarui informasi saldo & identitas dompet' : 'Daftarkan akun dompet atau bank baru'}
                </p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded-full">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* 1. Preset Bank & E-Wallet Selection Grid */}
            <div className="space-y-2">
              <label className="block font-bold text-slate-700">
                Pilih Logo / Preset Bank (Popular ID):
              </label>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                {BANK_PRESETS.map((preset) => {
                  const isSelected = selectedPresetId === preset.id
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`p-2 rounded-xl border text-center flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                        isSelected
                          ? 'bg-white border-indigo-600 ring-2 ring-indigo-500/20 shadow-2xs font-extrabold text-slate-900'
                          : 'bg-white/80 border-slate-200/80 hover:bg-white text-slate-600 font-semibold'
                      }`}
                    >
                      <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                        {preset.logoSvg.startsWith('http') ? (
                          <img src={preset.logoSvg} alt={preset.name} className="w-full h-full object-contain p-0.5" />
                        ) : (
                          <span className="text-sm">{preset.logoSvg}</span>
                        )}
                      </div>
                      <span className="text-[10px] leading-tight truncate w-full text-center">{preset.shortName}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 2. Custom Upload Logo Option */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 text-[11px]">Upload Custom Logo (Opsional):</span>
                {customLogoPreview && (
                  <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1">
                    <Check size={12} /> Custom Logo Active
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCustomLogoUpload}
                />

                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                >
                  {isUploading ? (
                    <Loader2 size={14} className="animate-spin text-indigo-600" />
                  ) : (
                    <Upload size={14} className="text-indigo-600" />
                  )}
                  <span>{isUploading ? 'Mengunggah...' : 'Unggah File Logo'}</span>
                </button>

                {customLogoPreview && (
                  <div className="w-8 h-8 rounded-xl border border-slate-200 bg-white overflow-hidden p-0.5 shrink-0">
                    <img src={customLogoPreview} alt="Preview" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>
            </div>

            {/* 3. Main Form Inputs */}
            <div className="space-y-3">
              {/* Account Name */}
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Nama Rekening / Akun</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: BNI Utama, BCA Savings, GoPay"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Current Balance / Balance Correction */}
              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  Saldo Sekarang (Koreksi Saldo Utama)
                </label>
                <input
                  type="text"
                  placeholder="Rp 0"
                  value={balance}
                  onChange={(e) => {
                    const num = parseInt(e.target.value.replace(/\D/g, '')) || 0
                    setBalance(formatRupiahFull(num))
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 font-black text-xl focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Account / Card Number */}
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Nomor Rekening / Kartu (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: •••• •••• •••• 1922 atau 00192288"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-medium font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Type & Color Selector */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Tipe Rekening</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
                  >
                    <option value="bank">Bank (Tabungan)</option>
                    <option value="wallet">E-Wallet (QRIS)</option>
                    <option value="cash">Tunai (Cash)</option>
                    <option value="credit">Kartu Kredit</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Warna Kartu</label>
                  <select
                    value={color}
                    onChange={(e) => setColor(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
                  >
                    <option value="blue">Biru (BCA / BNI)</option>
                    <option value="emerald">Hijau (Cash / BSI)</option>
                    <option value="cyan">Cyan (GoPay / QRIS)</option>
                    <option value="purple">Ungu (OVO / Neon)</option>
                    <option value="amber">Kuning (Mandiri)</option>
                    <option value="rose">Merah (ShopeePay / CIMB)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex items-center justify-between border-t border-slate-100">
              {editingWallet ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold transition flex items-center gap-1.5 cursor-pointer"
                  title="Hapus Rekening Ini"
                >
                  <Trash2 size={14} />
                  <span>Hapus Rekening</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-100 font-semibold text-slate-600 hover:bg-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-extrabold cursor-pointer hover:bg-indigo-700 shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <span>✓ Simpan Perubahan</span>
                  )}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
