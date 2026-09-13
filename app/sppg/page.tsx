"use client"
import React, { useState, useEffect } from 'react'
import { MapPin, Save, Check, RotateCw, ArrowLeft, ShieldCheck, Building2, User } from 'lucide-react'
import Link from 'next/link'
import { fetchSppgProfile, saveSppgProfile, type SppgProfile } from '@/lib/data-helpers'

export default function SppgProfilePage() {
  const [profile, setProfile] = useState<SppgProfile>({
    nama_unit: 'SPPG PASURUAN WONOREJO',
    penanggung_jawab: 'Ahmad Sayyidani Haqiqi, S.Pd.',
    wilayah: 'JAWA TIMUR · PASURUAN · WONOREJO · WONOREJO',
    kapasitas_harian: 5000,
    status_operasional: 'Aktif'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  const loadData = async () => {
    setLoading(true)
    const data = await fetchSppgProfile()
    setProfile(data)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await saveSppgProfile(profile)
    setSaving(false)
    setSavedSuccess(true)
    setTimeout(() => {
      setSavedSuccess(false)
    }, 2000)
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
            <span>Referensi</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <MapPin size={20} className="text-emerald-600" />
            Profil & Konfigurasi Unit SPPG
          </h1>
          <p className="text-xs text-gray-500 font-normal mt-0.5">
            Manajemen identitas resmi Satuan Pelayanan Pemenuhan Gizi (SPPG) Pasuruan Wonorejo.
          </p>
        </div>

        <div>
          <button
            onClick={loadData}
            className="px-3.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <RotateCw size={13} className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-2xs animate-fadeIn">
          <Check size={16} className="text-emerald-600" />
          <span>Profil SPPG berhasil tersimpan ke Supabase & Penyimpanan Lokal!</span>
        </div>
      )}

      {/* Main Profile Form Card */}
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl shadow-2xs p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center border border-emerald-100 text-lg">
              🏛️
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-sm">{profile.nama_unit}</h2>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 inline-block mt-0.5">
                Status Operasional: {profile.status_operasional}
              </span>
            </div>
          </div>

          <span className="text-xs text-gray-400 font-mono">ID: SPPG-PAS-001</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <Building2 size={13} className="text-gray-400" />
              Nama Unit SPPG *
            </label>
            <input
              type="text"
              required
              value={profile.nama_unit}
              onChange={(e) => setProfile({ ...profile, nama_unit: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <User size={13} className="text-gray-400" />
              Penanggung Jawab Utama *
            </label>
            <input
              type="text"
              required
              value={profile.penanggung_jawab}
              onChange={(e) => setProfile({ ...profile, penanggung_jawab: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <MapPin size={13} className="text-gray-400" />
              Wilayah Operasional / Alamat Terdaftar *
            </label>
            <input
              type="text"
              required
              value={profile.wilayah}
              onChange={(e) => setProfile({ ...profile, wilayah: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Kapasitas Porsi Harian Maksimal
            </label>
            <input
              type="number"
              value={profile.kapasitas_harian}
              onChange={(e) => setProfile({ ...profile, kapasitas_harian: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Status Operasional Unit
            </label>
            <select
              value={profile.status_operasional}
              onChange={(e) => setProfile({ ...profile, status_operasional: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            >
              <option value="Aktif">Aktif (Operasional Penuh)</option>
              <option value="Pemeliharaan">Pemeliharaan / Maintenance</option>
              <option value="Persiapan">Persiapan Logistik</option>
            </select>
          </div>
        </div>

        {/* Verification Footer Note */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-600" />
            <span>Unit terverifikasi SIKS-NG & Badan Gizi Nasional</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">STATUS: VERIFIED</span>
        </div>

        {/* Action Buttons */}
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
            <span>{saving ? 'Menyimpan...' : 'Simpan'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
