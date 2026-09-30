"use client"

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Check, Building2, Smartphone, Wallet as WalletIcon } from 'lucide-react'
import { OlloWallet, formatRupiahFull } from '@/lib/ollo-store'
import { BANK_PRESETS, BankPreset } from '@/lib/bank-presets'

interface ModalWalletProps {
  isOpen: boolean
  editingWallet: OlloWallet | null
  onClose: () => void
  onSave: (data: {
    name: string
    balance: number
    type: 'cash' | 'bank' | 'wallet' | 'credit'
    color: 'emerald' | 'blue' | 'cyan' | 'purple' | 'amber' | 'rose'
    logo_url?: string
    icon?: string
  }) => void
}

export default function ModalWallet({ isOpen, editingWallet, onClose, onSave }: ModalWalletProps) {
  const [name, setName] = useState('')
  const [balance, setBalance] = useState('')
  const [type, setType] = useState<'cash' | 'bank' | 'wallet' | 'credit'>('bank')
  const [color, setColor] = useState<'emerald' | 'blue' | 'cyan' | 'purple' | 'amber' | 'rose'>('blue')
  const [selectedPresetId, setSelectedPresetId] = useState<string>('')
  const [logoUrl, setLogoUrl] = useState<string>('')
  const [customLogoPreview, setCustomLogoPreview] = useState<string>('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingWallet) {
      setName(editingWallet.name)
      setBalance(formatRupiahFull(editingWallet.balance))
      setType(editingWallet.type)
      setColor(editingWallet.color)
      setLogoUrl(editingWallet.logo_url || '')
      setCustomLogoPreview(editingWallet.logo_url || '')
      setSelectedPresetId('')
    } else {
      // Default to BCA Preset
      const defaultPreset = BANK_PRESETS[0]
      setName(defaultPreset.shortName)
      setBalance('')
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

  const handleCustomLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

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
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const num = parseInt(balance.replace(/\D/g, '')) || 0
    onSave({
      name,
      balance: num,
      type,
      color,
      logo_url: logoUrl,
      icon: type === 'bank' ? '🏦' : type === 'wallet' ? '📱' : '💵'
    })
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 border border-slate-100 max-h-[90vh] overflow-y-auto scrollbar-thin"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-sm font-bold">
                🏦
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">
                {editingWallet ? 'Edit Dompet / Koreksi Saldo' : 'Tambah Dompet / Bank Baru'}
              </h3>
            </div>
            <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* 1. Preset Bank/E-Wallet Selection Grid (Recommended) */}
            <div className="space-y-2">
              <label className="block font-bold text-slate-700">
                Pilih Preset Logo Bank & E-Wallet (Popular ID):
              </label>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1 bg-slate-50 rounded-2xl border border-slate-200/80">
                {BANK_PRESETS.map((preset) => {
                  const isSelected = selectedPresetId === preset.id
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`p-2 rounded-xl border text-center flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                        isSelected
                          ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/20 shadow-2xs font-extrabold text-slate-900'
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
                <span className="font-bold text-slate-700 text-[11px]">Upload Logo Sendiri (Opsional):</span>
                {customLogoPreview && (
                  <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1">
                    <Check size={12} /> Custom Logo Terpasang
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
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition flex items-center gap-1.5"
                >
                  <Upload size={14} className="text-emerald-600" />
                  <span>Pilih File Gambar</span>
                </button>

                {customLogoPreview && customLogoPreview.startsWith('data:') && (
                  <div className="w-8 h-8 rounded-xl border border-slate-200 bg-white overflow-hidden p-0.5 shrink-0">
                    <img src={customLogoPreview} alt="Preview" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>
            </div>

            {/* 3. Name & Balance Input */}
            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-500 mb-1">Nama Dompet / Rekening</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: BCA Utama, Mandiri, Cash, GoPay"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-500 mb-1">Saldo Awal / Penyesuaian (Rp)</label>
                <input
                  type="text"
                  placeholder="Rp 0"
                  value={balance}
                  onChange={(e) => {
                    const num = parseInt(e.target.value.replace(/\D/g, '')) || 0
                    setBalance(formatRupiahFull(num))
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-black text-lg focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Tipe</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium"
                  >
                    <option value="bank">Bank</option>
                    <option value="wallet">E-Wallet</option>
                    <option value="cash">Tunai</option>
                    <option value="credit">Kartu Kredit</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Warna Kartu</label>
                  <select
                    value={color}
                    onChange={(e) => setColor(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium"
                  >
                    <option value="blue">Biru (BCA / BRI)</option>
                    <option value="emerald">Hijau (Cash / BSI)</option>
                    <option value="cyan">Cyan (GoPay)</option>
                    <option value="purple">Ungu (OVO)</option>
                    <option value="amber">Kuning (Mandiri)</option>
                    <option value="rose">Merah (BNI / ShopeePay)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 font-semibold text-slate-600"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-extrabold cursor-pointer hover:bg-emerald-700 shadow-xs"
              >
                ✓ Simpan Dompet
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
