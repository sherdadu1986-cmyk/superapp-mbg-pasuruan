"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Building2,
  MapPin,
  UserCheck,
  Shield,
  Briefcase,
  FileText,
  CreditCard,
  Landmark,
  UserPlus,
  Phone,
  Mail,
  Copy,
  Check,
  ExternalLink,
  RotateCw,
  Printer,
  Edit3,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Info,
  Calendar,
  Layers,
  Award,
  Sparkles,
  Share2,
  X,
  Save,
  RefreshCcw,
  MessageCircle,
  Hash
} from 'lucide-react'
import {
  fetchSppgOfficialIdentity,
  saveSppgOfficialIdentity,
  DEFAULT_SPPG_OFFICIAL_IDENTITY,
  type SppgOfficialIdentity
} from '@/lib/data-helpers'
import { showToast } from '@/components/toast'

export default function SppgProfilePage() {
  const [data, setData] = useState<SppgOfficialIdentity>(DEFAULT_SPPG_OFFICIAL_IDENTITY)
  const [loading, setLoading] = useState(true)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editFormData, setEditFormData] = useState<SppgOfficialIdentity>(DEFAULT_SPPG_OFFICIAL_IDENTITY)
  const [isSaving, setIsSaving] = useState(false)
  const [activeEditTab, setActiveEditTab] = useState<'sppg' | 'kasatpel' | 'mitra' | 'legalitas' | 'bank' | 'pic'>('sppg')

  // Load official data on mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await fetchSppgOfficialIdentity()
      setData(res)
      setEditFormData(res)
    } catch {
      setData(DEFAULT_SPPG_OFFICIAL_IDENTITY)
      setEditFormData(DEFAULT_SPPG_OFFICIAL_IDENTITY)
    } finally {
      setLoading(false)
    }
  }

  // Copy helper with feedback
  const handleCopy = (text: string, key: string, label: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text)
      setCopiedKey(key)
      showToast(`${label} berhasil disalin ke clipboard!`, 'success')
      setTimeout(() => {
        setCopiedKey(null)
      }, 2000)
    }
  }

  // Handle Save
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const updated = await saveSppgOfficialIdentity(editFormData)
      setData(updated)
      setIsEditModalOpen(false)
      showToast('Data Profil SPPG berhasil diperbarui dan disimpan!', 'success')
    } catch {
      showToast('Gagal menyimpan pembaruan data', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  // Reset to original official data
  const handleResetToDefault = async () => {
    if (confirm('Kembalikan semua data ke identitas resmi default BGN?')) {
      setIsSaving(true)
      try {
        const resetData = await saveSppgOfficialIdentity(DEFAULT_SPPG_OFFICIAL_IDENTITY)
        setData(resetData)
        setEditFormData(resetData)
        setIsEditModalOpen(false)
        showToast('Data berhasil dikembalikan ke standar resmi BGN!', 'success')
      } catch {
        showToast('Gagal mereset data', 'error')
      } finally {
        setIsSaving(false)
      }
    }
  }

  // Print Profile Sheet
  const handlePrint = () => {
    window.print()
  }

  // Google Maps URL
  const gmapsUrl = `https://www.google.com/maps?q=${data.latitude},${data.longitude}`

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans text-slate-800 pb-16 px-2 sm:px-4">
      {/* ─── Breadcrumb & Top Bar (Hidden on Print) ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 print:hidden">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5 font-medium">
            <Link href="/" className="hover:text-emerald-700 transition flex items-center gap-1">
              <ArrowLeft size={13} /> Beranda
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600">Referensi</span>
            <span className="text-slate-300">/</span>
            <span className="text-emerald-700 font-semibold">Profil Identitas SPPG</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-xs">
              <Building2 size={20} />
            </div>
            <span>Identitas Resmi Unit SPPG</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Data terpadu verifikasi dan validasi Satuan Pelayanan Pemenuhan Gizi (SPPG) Pasuruan Wonorejo Wonorejo.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={loadData}
            title="Segarkan Data"
            className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCw size={14} className={loading ? 'animate-spin text-emerald-600' : 'text-slate-500'} />
            <span className="hidden sm:inline">Segarkan</span>
          </button>

          <button
            onClick={handlePrint}
            title="Cetak Profil Resmi"
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Printer size={14} className="text-slate-600" />
            <span>Cetak Profil</span>
          </button>

          <button
            onClick={() => {
              setEditFormData(data)
              setIsEditModalOpen(true)
            }}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition flex items-center gap-1.5 cursor-pointer border border-emerald-600"
          >
            <Edit3 size={14} />
            <span>Kelola / Edit Data</span>
          </button>
        </div>
      </div>

      {/* ─── Official BGN Institutional Header Banner ─── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white p-5 sm:p-6 shadow-md border border-slate-800">
        {/* Subtle Background Pattern & Accents */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -top-12 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            {/* Agency Emblem / Logo Frame */}
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-white/10 backdrop-blur-md p-2.5 flex items-center justify-center border border-white/20 shadow-inner">
                <img
                  src="/logo-bgn.png"
                  alt="Badan Gizi Nasional"
                  className="w-full h-full object-contain filter drop-shadow"
                  onError={(e) => {
                    e.currentTarget.src = '/favicon.ico'
                  }}
                />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full shadow-xs">
                <ShieldCheck size={12} />
              </div>
            </div>

            {/* Institution Hierarchy */}
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  BADAN GIZI NASIONAL (BGN) REPUBLIK INDONESIA
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-slate-300 border border-white/15">
                  Unit Dapur MBG
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {data.nama_sppg}
              </h2>
              <div className="flex items-center gap-3 text-xs text-slate-300 mt-1 flex-wrap">
                <span className="flex items-center gap-1 font-mono text-emerald-400 font-semibold">
                  <Hash size={13} /> {data.kode_sppg}
                </span>
                <span className="text-slate-600 hidden sm:inline">•</span>
                <span className="flex items-center gap-1 text-slate-300">
                  <MapPin size={13} className="text-emerald-400" />
                  {data.kecamatan}, {data.kabupaten}
                </span>
                <span className="text-slate-600 hidden sm:inline">•</span>
                <span className="text-slate-300 font-medium">
                  ID: <span className="font-mono text-amber-300 font-bold">{data.id_sppg}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Operational Status Badge with Live Pulse */}
          <div className="flex flex-col sm:items-end justify-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-white/10">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 shadow-sm backdrop-blur-md">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
              </span>
              <span className="text-xs font-bold tracking-tight">
                {data.status_operasional}: Beroperasi sejak {data.tgl_operasional}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 sm:text-right font-medium">
              Nomor BA Verval: <span className="text-slate-200 font-mono">{data.no_ba_verval}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Quick Highlights KPI Strip ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 print:grid-cols-4">
        {/* KPI 1: ID SPPG */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">ID SPPG</span>
            <button
              onClick={() => handleCopy(data.id_sppg, 'kpi_id', 'ID SPPG')}
              className="text-slate-400 hover:text-emerald-600 transition cursor-pointer p-0.5"
              title="Salin ID"
            >
              {copiedKey === 'kpi_id' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
            </button>
          </div>
          <div className="text-base font-black font-mono text-slate-900 tracking-wide">
            {data.id_sppg}
          </div>
          <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 inline-block mt-1">
            Terverifikasi Sistem
          </span>
        </div>

        {/* KPI 2: Kode SPPG */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Kode Satuan</span>
            <button
              onClick={() => handleCopy(data.kode_sppg, 'kpi_kode', 'Kode SPPG')}
              className="text-slate-400 hover:text-emerald-600 transition cursor-pointer p-0.5"
              title="Salin Kode"
            >
              {copiedKey === 'kpi_kode' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
            </button>
          </div>
          <div className="text-base font-black font-mono text-slate-900">
            {data.kode_sppg}
          </div>
          <span className="text-[10px] text-slate-600 font-medium block mt-1 truncate">
            Wilayah Kab. Pasuruan
          </span>
        </div>

        {/* KPI 3: BA Verval */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">BA Verval</span>
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1 rounded">Resmi</span>
          </div>
          <div className="text-sm font-bold font-mono text-slate-800 truncate" title={data.no_ba_verval}>
            {data.no_ba_verval}
          </div>
          <span className="text-[10px] text-slate-500 font-medium block mt-1">
            Ditetapkan: {data.tgl_ba_verval}
          </span>
        </div>

        {/* KPI 4: Jenis / Kemitraan */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Skema Unit</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-base font-black text-slate-900">
            {data.jenis_sppg}
          </div>
          <span className="text-[10px] text-slate-600 font-medium block mt-1 truncate">
            {data.mitra_nama}
          </span>
        </div>
      </div>

      {/* ─── 6 FORMAL INSTITUTIONAL CARDS (Grid 2-Columns on Desktop) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2">

        {/* ════════ CARD 1: IDENTITAS & LOKASI SPPG ════════ */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:shadow-md transition duration-200 overflow-hidden flex flex-col">
          {/* Card Header */}
          <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50/60 via-slate-50/40 to-transparent flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-2xs">
                <Building2 size={18} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-2">
                  1. Identitas & Lokasi SPPG
                </h3>
                <p className="text-[11px] text-slate-500 font-normal">
                  Identitas resmi & penetapan kedudukan fisik dapur
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {data.id_sppg}
            </span>
          </div>

          {/* Card Body */}
          <div className="p-5 space-y-3.5 text-xs flex-1">
            {/* Row: Nama SPPG */}
            <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">Nama Resmi Unit SPPG</span>
              <div className="text-sm font-bold text-slate-900 leading-snug">
                {data.nama_sppg}
              </div>
            </div>

            {/* Grid 2 Cols for Codes & BA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Kode SPPG */}
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 block">Kode SPPG</span>
                  <span className="font-mono font-bold text-slate-800 text-xs">{data.kode_sppg}</span>
                </div>
                <button
                  onClick={() => handleCopy(data.kode_sppg, 'card1_kode', 'Kode SPPG')}
                  className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                  title="Salin Kode"
                >
                  {copiedKey === 'card1_kode' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                </button>
              </div>

              {/* ID SPPG */}
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 block">ID SPPG</span>
                  <span className="font-mono font-bold text-slate-800 text-xs">{data.id_sppg}</span>
                </div>
                <button
                  onClick={() => handleCopy(data.id_sppg, 'card1_id', 'ID SPPG')}
                  className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                  title="Salin ID"
                >
                  {copiedKey === 'card1_id' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            {/* BA Verval Details */}
            <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">Nomor BA Verval</span>
                <button
                  onClick={() => handleCopy(data.no_ba_verval, 'card1_ba', 'Nomor BA Verval')}
                  className="text-[10px] text-emerald-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'card1_ba' ? <Check size={11} /> : <Copy size={11} />}
                  <span>Salin BA</span>
                </button>
              </div>
              <div className="font-mono text-xs font-bold text-slate-900">
                {data.no_ba_verval}
              </div>
              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 border-t border-slate-200/50">
                <span>Tanggal BA Verval: <strong className="text-slate-700">{data.tgl_ba_verval}</strong></span>
                <span>Operasional: <strong className="text-emerald-700">{data.tgl_operasional}</strong></span>
              </div>
            </div>

            {/* Skema & Bangunan */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-semibold text-slate-500 block">Jenis SPPG</span>
                <span className="font-bold text-slate-800 text-xs">{data.jenis_sppg}</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-semibold text-slate-500 block">Asal / Jenis Bangunan</span>
                <span className="font-bold text-slate-800 text-xs">{data.jenis_bangunan}</span>
              </div>
            </div>

            {/* Alamat & Wilayah */}
            <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 block">Alamat Lengkap Unit</span>
              <p className="text-xs font-semibold text-slate-900 leading-relaxed">
                {data.alamat_lengkap}
              </p>
              <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-600 flex-wrap">
                <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-medium">Kec. {data.kecamatan}</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-medium">Kab. {data.kabupaten}</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-medium">Prov. {data.provinsi}</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-medium">Pos: {data.kode_pos}</span>
              </div>
            </div>

            {/* Titik Koordinat & Google Maps Action */}
            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1">
                  <MapPin size={12} className="text-emerald-700" />
                  Titik Koordinat GPS
                </span>
                <div className="font-mono text-xs text-emerald-950 font-semibold">
                  {data.latitude}, {data.longitude}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(`${data.latitude}, ${data.longitude}`, 'card1_coord', 'Koordinat')}
                  className="px-2 py-1 bg-white hover:bg-emerald-100 border border-emerald-300 rounded-lg text-[11px] font-semibold text-emerald-800 transition flex items-center gap-1 cursor-pointer"
                  title="Salin Koordinat"
                >
                  {copiedKey === 'card1_coord' ? <Check size={12} /> : <Copy size={12} />}
                  <span>Salin</span>
                </button>

                <a
                  href={gmapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-bold shadow-2xs transition flex items-center gap-1 cursor-pointer"
                >
                  <ExternalLink size={12} />
                  <span>Buka di Google Maps</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ════════ CARD 2: DATA KASATPEL / KEPALA SPPG (SPPI) ════════ */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:shadow-md transition duration-200 overflow-hidden flex flex-col">
          {/* Card Header */}
          <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50/60 via-slate-50/40 to-transparent flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-2xs">
                <UserCheck size={18} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-2">
                  2. Data Kasatpel / Kepala SPPG (SPPI)
                </h3>
                <p className="text-[11px] text-slate-500 font-normal">
                  Penanggung jawab teknis, operasional, & manajerial dapur
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-100/80 px-2.5 py-0.5 rounded-full border border-blue-200">
              Kasatpel SPPI
            </span>
          </div>

          {/* Card Body */}
          <div className="p-5 space-y-4 text-xs flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Profile Card Banner */}
              <div className="p-4 bg-gradient-to-br from-blue-50/80 via-slate-50/50 to-white rounded-xl border border-blue-100/80 flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-base flex items-center justify-center shadow-sm flex-shrink-0 border border-white">
                  AS
                </div>
                <div>
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                    Kepala Satuan Pelayanan
                  </span>
                  <div className="text-base font-black text-slate-900 leading-snug">
                    {data.kasatpel_nama}
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {data.kasatpel_jabatan}
                  </span>
                </div>
              </div>

              {/* Contact Channels */}
              <div className="space-y-2.5">
                {/* Email */}
                <div className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
                      <Mail size={14} />
                    </div>
                    <div className="overflow-hidden">
                      <span className="text-[10px] font-semibold text-slate-400 block">Email Resmi</span>
                      <a
                        href={`mailto:${data.kasatpel_email}`}
                        className="font-mono text-xs font-semibold text-blue-700 hover:underline truncate block"
                      >
                        {data.kasatpel_email}
                      </a>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopy(data.kasatpel_email, 'kasatpel_email', 'Email Kasatpel')}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                    title="Salin Email"
                  >
                    {copiedKey === 'kasatpel_email' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  </button>
                </div>

                {/* Phone & WhatsApp Link */}
                <div className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                      <Phone size={14} />
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block">Nomor HP / WhatsApp</span>
                      <span className="font-mono text-xs font-bold text-slate-900 block">
                        {data.kasatpel_telepon}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopy(data.kasatpel_telepon, 'kasatpel_phone', 'Nomor HP Kasatpel')}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                      title="Salin Nomor"
                    >
                      {copiedKey === 'kasatpel_phone' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    </button>
                    <a
                      href={`https://wa.me/62${data.kasatpel_telepon.replace(/^0/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageCircle size={13} />
                      <span>Chat WA</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Official Note / Link to Petugas */}
            <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl space-y-2 mt-2">
              <div className="flex items-start gap-2.5">
                <Info size={16} className="text-blue-700 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-blue-900 text-xs block">Catatan Kelengkapan:</span>
                  <p className="text-[11px] text-blue-800 leading-relaxed">
                    {data.kasatpel_catatan}
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-blue-200/60 flex justify-end">
                <Link
                  href="/data-relawan-sppg"
                  className="text-xs font-bold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1 hover:underline"
                >
                  <span>Buka Menu Petugas & Relawan SPPG</span>
                  <ArrowLeft size={12} className="rotate-180" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ════════ CARD 3: IDENTITAS MITRA / INSTANSI ════════ */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:shadow-md transition duration-200 overflow-hidden flex flex-col">
          {/* Card Header */}
          <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-amber-50/60 via-slate-50/40 to-transparent flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-2xs">
                <Shield size={18} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-2">
                  3. Identitas Mitra / Instansi
                </h3>
                <p className="text-[11px] text-slate-500 font-normal">
                  Badan pendukung operasional, sarana, & prasarana lokal
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-200">
              {data.mitra_jenis}
            </span>
          </div>

          {/* Card Body */}
          <div className="p-5 space-y-3.5 text-xs flex-1">
            {/* Nama Mitra & Pimpinan */}
            <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 space-y-2">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Nama Mitra / Lembaga
                </span>
                <div className="text-sm font-black text-slate-900">
                  {data.mitra_nama}
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block">Nama Pimpinan</span>
                  <span className="font-bold text-slate-800 text-xs">{data.mitra_pimpinan}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <a
                    href={`https://wa.me/62${data.mitra_telepon.replace(/^0/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer"
                  >
                    <MessageCircle size={12} />
                    <span>WA Pimpinan</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Kontak Mitra */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 block">No. Telepon / HP</span>
                  <span className="font-mono font-bold text-slate-800 text-xs">{data.mitra_telepon}</span>
                </div>
                <button
                  onClick={() => handleCopy(data.mitra_telepon, 'mitra_phone', 'Telepon Mitra')}
                  className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                  title="Salin Telepon"
                >
                  {copiedKey === 'mitra_phone' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                </button>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between">
                <div className="truncate">
                  <span className="text-[10px] font-semibold text-slate-500 block">Email Mitra</span>
                  <span className="font-mono font-semibold text-slate-800 text-xs truncate block" title={data.mitra_email}>
                    {data.mitra_email}
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(data.mitra_email, 'mitra_email', 'Email Mitra')}
                  className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer flex-shrink-0"
                  title="Salin Email"
                >
                  {copiedKey === 'mitra_email' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            {/* Alamat Operasional */}
            <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 block">Alamat Wilayah Operasional</span>
              <p className="text-xs font-semibold text-slate-900 leading-relaxed">
                {data.mitra_alamat_operasional}
              </p>
            </div>

            {/* Bentuk Dukungan / Kepemilikan Aset */}
            <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/60 space-y-2">
              <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                <Briefcase size={13} className="text-amber-700" />
                Bentuk Dukungan / Kepemilikan Aset:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {data.mitra_bentuk_dukungan.split(',').map((item, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-white border border-amber-200 rounded-lg text-[11px] font-semibold text-amber-950 shadow-2xs inline-flex items-center gap-1"
                  >
                    <CheckCircle2 size={11} className="text-emerald-600" />
                    <span>{item.trim()}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ════════ CARD 4: IDENTITAS MITRA / YAYASAN (BERMITRA LANGSUNG DENGAN BGN) ════════ */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:shadow-md transition duration-200 overflow-hidden flex flex-col">
          {/* Card Header */}
          <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-teal-50/60 via-slate-50/40 to-transparent flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-2xs">
                <FileText size={18} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-2">
                  4. Legalitas Mitra BGN
                </h3>
                <p className="text-[11px] text-slate-500 font-normal">
                  Identitas badan hukum yang terikat langsung kontrak BGN RI
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-teal-800 bg-teal-100/80 px-2.5 py-0.5 rounded-full border border-teal-200">
              Mitra Resmi BGN
            </span>
          </div>

          {/* Card Body */}
          <div className="p-5 space-y-3.5 text-xs flex-1 flex flex-col justify-between">
            <div className="space-y-3.5">
              {/* Nama Yayasan */}
              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Nama Yayasan Badan Hukum
                </span>
                <div className="text-sm font-black text-slate-900">
                  {data.yayasan_nama}
                </div>
              </div>

              {/* NPWP */}
              <div className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 block">NPWP Yayasan</span>
                  <span className="font-mono font-bold text-slate-900 text-sm tracking-wide">
                    {data.yayasan_npwp}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Terdaftar Pajak
                  </span>
                  <button
                    onClick={() => handleCopy(data.yayasan_npwp, 'yayasan_npwp', 'NPWP Yayasan')}
                    className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition cursor-pointer"
                    title="Salin NPWP"
                  >
                    {copiedKey === 'yayasan_npwp' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              {/* Domisili Legal */}
              <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 block">Alamat Domisili Legal</span>
                <p className="text-xs font-semibold text-slate-900 leading-relaxed">
                  {data.yayasan_alamat_legal}
                </p>
                <span className="inline-block bg-slate-100 text-slate-600 font-mono text-[10px] px-2 py-0.5 rounded">
                  Kode Pos: {data.yayasan_kode_pos}
                </span>
              </div>

              {/* Kontak Legal Yayasan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between">
                  <div className="truncate">
                    <span className="text-[10px] font-semibold text-slate-500 block">Email Legal</span>
                    <span className="font-mono font-semibold text-slate-800 text-xs truncate block" title={data.yayasan_email}>
                      {data.yayasan_email}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(data.yayasan_email, 'yayasan_email', 'Email Yayasan')}
                    className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition cursor-pointer flex-shrink-0"
                    title="Salin Email"
                  >
                    {copiedKey === 'yayasan_email' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  </button>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 block">Telepon Kantor</span>
                    <span className="font-mono font-bold text-slate-800 text-xs">{data.yayasan_telepon}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(data.yayasan_telepon, 'yayasan_phone', 'Telepon Yayasan')}
                    className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition cursor-pointer"
                    title="Salin Telepon"
                  >
                    {copiedKey === 'yayasan_phone' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Catatan Yayasan */}
            <div className="p-3.5 bg-teal-50/70 border border-teal-200/80 rounded-xl space-y-1 mt-2">
              <div className="flex items-start gap-2.5">
                <Info size={16} className="text-teal-700 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-teal-900 text-xs block">Catatan Administrasi:</span>
                  <p className="text-[11px] text-teal-800 leading-relaxed">
                    {data.yayasan_catatan}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ════════ CARD 5: DATA BANK DAN REKENING OPERASIONAL ════════ */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:shadow-md transition duration-200 overflow-hidden flex flex-col">
          {/* Card Header */}
          <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-rose-50/60 via-slate-50/40 to-transparent flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-2xs">
                <Landmark size={18} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-2">
                  5. Bank & Rekening Operasional
                </h3>
                <p className="text-[11px] text-slate-500 font-normal">
                  Kanal transaksi resmi penyaluran & perputaran dana operasional MBG
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-rose-800 bg-rose-100/80 px-2.5 py-0.5 rounded-full border border-rose-200 flex items-center gap-1">
              <CreditCard size={12} /> BNI Terverifikasi
            </span>
          </div>

          {/* Card Body */}
          <div className="p-5 space-y-4 text-xs flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Passbook 1: Rekening Utama */}
              <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl shadow-sm border border-slate-700 relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-28 h-28 bg-rose-500/10 rounded-full blur-xl pointer-events-none" />

                <div className="flex items-center justify-between mb-3 relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 text-rose-200 border border-white/20 uppercase tracking-wider">
                      {data.bank_utama_nama}
                    </span>
                    <span className="text-[10px] text-slate-300 font-medium">
                      Rekening Operasional Utama
                    </span>
                  </div>
                  <CreditCard size={16} className="text-slate-400" />
                </div>

                <div className="space-y-1 relative z-10">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-medium">
                    Nomor Rekening
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xl sm:text-2xl font-black tracking-wider text-white">
                      {data.bank_utama_rekening}
                    </span>
                    <button
                      onClick={() => handleCopy(data.bank_utama_rekening, 'bank_rek_utama', 'Nomor Rekening Utama')}
                      className="px-3 py-1 bg-white/15 hover:bg-white/25 text-white rounded-lg text-xs font-semibold backdrop-blur-sm transition flex items-center gap-1.5 cursor-pointer border border-white/20"
                      title="Salin No Rekening"
                    >
                      {copiedKey === 'bank_rek_utama' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      <span>{copiedKey === 'bank_rek_utama' ? 'Tersalin' : 'Salin'}</span>
                    </button>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between text-[11px] relative z-10">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Atas Nama Pemilik:</span>
                    <span className="font-bold text-slate-200 uppercase tracking-wide">
                      {data.bank_utama_pemilik}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                    Aktif
                  </span>
                </div>
              </div>

              {/* Passbook 2: Rekening Virtual Account */}
              <div className="p-4 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-2xl shadow-sm border border-indigo-900/60 relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-28 h-28 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />

                <div className="flex items-center justify-between mb-3 relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 uppercase tracking-wider">
                      {data.bank_va_nama} VA
                    </span>
                    <span className="text-[10px] text-indigo-200 font-medium">
                      Rekening Virtual Account BGN
                    </span>
                  </div>
                  <Landmark size={16} className="text-indigo-300" />
                </div>

                <div className="space-y-1 relative z-10">
                  <span className="text-[10px] text-indigo-300 uppercase tracking-widest block font-medium">
                    Nomor Virtual Account
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-lg sm:text-xl font-black tracking-wider text-indigo-100">
                      {data.bank_va_nomor}
                    </span>
                    <button
                      onClick={() => handleCopy(data.bank_va_nomor, 'bank_rek_va', 'Nomor Virtual Account')}
                      className="px-3 py-1 bg-white/15 hover:bg-white/25 text-white rounded-lg text-xs font-semibold backdrop-blur-sm transition flex items-center gap-1.5 cursor-pointer border border-white/20"
                      title="Salin No Virtual Account"
                    >
                      {copiedKey === 'bank_rek_va' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      <span>{copiedKey === 'bank_rek_va' ? 'Tersalin' : 'Salin'}</span>
                    </button>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between text-[11px] relative z-10">
                  <div>
                    <span className="text-[10px] text-indigo-300 block">Nama Akun Virtual Account:</span>
                    <span className="font-mono font-bold text-white uppercase tracking-wide">
                      {data.bank_va_pemilik}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                    BGN Verified
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-[11px] text-slate-600">
              <ShieldCheck size={14} className="text-emerald-600 flex-shrink-0" />
              <span>Rekening resmi penampung dan pengelola dana program Makanan Bergizi Gratis (MBG).</span>
            </div>
          </div>
        </div>

        {/* ════════ CARD 6: DATA PERWAKILAN YAYASAN DI SPPG (PIC / PEMEGANG VA) ════════ */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:shadow-md transition duration-200 overflow-hidden flex flex-col">
          {/* Card Header */}
          <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-purple-50/60 via-slate-50/40 to-transparent flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-2xs">
                <UserPlus size={18} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-2">
                  6. PIC / Pemegang Akun VA
                </h3>
                <p className="text-[11px] text-slate-500 font-normal">
                  Perwakilan yayasan di unit dapur & pengelola teknis Virtual Account
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-purple-800 bg-purple-100/80 px-2.5 py-0.5 rounded-full border border-purple-200">
              PIC Resmi SPPG
            </span>
          </div>

          {/* Card Body */}
          <div className="p-5 space-y-4 text-xs flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Profile Card Banner */}
              <div className="p-4 bg-gradient-to-br from-purple-50/80 via-slate-50/50 to-white rounded-xl border border-purple-100/80 flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white font-black text-base flex items-center justify-center shadow-sm flex-shrink-0 border border-white">
                  DH
                </div>
                <div>
                  <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                    Perwakilan Yayasan di SPPG
                  </span>
                  <div className="text-base font-black text-slate-900 leading-snug">
                    {data.pic_nama}
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    PIC / Kuasa Pemegang Akun Virtual Account BNI
                  </span>
                </div>
              </div>

              {/* NIK Card */}
              <div className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 block">Nomor Induk Kependudukan (NIK)</span>
                  <span className="font-mono font-bold text-slate-900 text-sm tracking-wide">
                    {data.pic_nik}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Terverifikasi
                  </span>
                  <button
                    onClick={() => handleCopy(data.pic_nik, 'pic_nik', 'NIK PIC')}
                    className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition cursor-pointer"
                    title="Salin NIK"
                  >
                    {copiedKey === 'pic_nik' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              {/* Email PIC */}
              <div className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
                    <Mail size={14} />
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-[10px] font-semibold text-slate-400 block">Email PIC</span>
                    <a
                      href={`mailto:${data.pic_email}`}
                      className="font-mono text-xs font-semibold text-purple-700 hover:underline truncate block"
                    >
                      {data.pic_email}
                    </a>
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(data.pic_email, 'pic_email', 'Email PIC')}
                  className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition cursor-pointer"
                  title="Salin Email"
                >
                  {copiedKey === 'pic_email' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                </button>
              </div>

              {/* WhatsApp Link */}
              <div className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <Phone size={14} />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block">Nomor HP / WhatsApp</span>
                    <span className="font-mono text-xs font-bold text-slate-900 block">
                      {data.pic_telepon}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopy(data.pic_telepon, 'pic_phone', 'Nomor HP PIC')}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                    title="Salin Nomor"
                  >
                    {copiedKey === 'pic_phone' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  </button>
                  <a
                    href={`https://wa.me/62${data.pic_telepon.replace(/^0/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageCircle size={13} />
                    <span>Chat WA</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-purple-50/70 border border-purple-200/80 rounded-xl space-y-1 mt-2">
              <span className="text-[11px] font-bold text-purple-900 block">Otoritas PIC:</span>
              <p className="text-[11px] text-purple-800 leading-relaxed">
                Bertanggung jawab penuh atas rekonsiliasi transaksi kas, validasi struk belanja, dan pencocokan mutasi Virtual Account di SPPG Wonorejo.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* ─── Formal Institutional Footer Verification Seal ─── */}
      <div className="p-4 sm:p-5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0 border border-slate-200">
            <ShieldCheck size={22} className="text-emerald-600" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">
              Dokumen Profil Terverifikasi Badan Gizi Nasional (BGN) RI
            </h4>
            <p className="text-[11px] text-slate-500">
              Status: <span className="text-emerald-700 font-semibold">Aktif & Sah</span> • Berlaku untuk operasional penyaluran Program Makanan Bergizi Gratis (MBG).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={() => {
              const summaryText = `IDENTITAS RESMI SPPG PASURUAN WONOREJO WONOREJO
ID SPPG: ${data.id_sppg}
Kode SPPG: ${data.kode_sppg}
No BA Verval: ${data.no_ba_verval} (${data.tgl_ba_verval})
Status: ${data.status_operasional} sejak ${data.tgl_operasional}
Alamat: ${data.alamat_lengkap} (${data.latitude}, ${data.longitude})
Kepala SPPG: ${data.kasatpel_nama} (${data.kasatpel_telepon})
Mitra Yayasan: ${data.mitra_nama} (Pimpinan: ${data.mitra_pimpinan} - ${data.mitra_telepon})
NPWP: ${data.yayasan_npwp}
Bank BNI Rek Utama: ${data.bank_utama_rekening} (${data.bank_utama_pemilik})
Bank BNI VA: ${data.bank_va_nomor} (${data.bank_va_pemilik})
PIC VA: ${data.pic_nama} (${data.pic_telepon})`
              handleCopy(summaryText, 'all_summary', 'Seluruh Ringkasan Data Profil')
            }}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
          >
            {copiedKey === 'all_summary' ? <Check size={13} className="text-emerald-600" /> : <Share2 size={13} />}
            <span>Salin Seluruh Data</span>
          </button>
        </div>
      </div>

      {/* ─── PRINT ONLY: Formal Sign-off Block ─── */}
      <div className="hidden print:grid grid-cols-2 gap-8 pt-8 text-center text-xs">
        <div className="space-y-16">
          <div>
            <p className="font-semibold text-slate-600">Kepala Satuan Pelayanan (Kasatpel SPPI)</p>
            <p className="text-[10px] text-slate-400">SPPG Pasuruan Wonorejo Wonorejo</p>
          </div>
          <div>
            <p className="font-bold underline text-slate-900">{data.kasatpel_nama}</p>
            <p className="text-[10px] text-slate-500 font-mono">Kasatpel SPPI BGN RI</p>
          </div>
        </div>

        <div className="space-y-16">
          <div>
            <p className="font-semibold text-slate-600">Pimpinan Mitra Pelaksana</p>
            <p className="text-[10px] text-slate-400">{data.mitra_nama}</p>
          </div>
          <div>
            <p className="font-bold underline text-slate-900">{data.mitra_pimpinan}</p>
            <p className="text-[10px] text-slate-500">Ketua Yayasan</p>
          </div>
        </div>
      </div>

      {/* ─── EDIT MODAL: Management & Customization ─── */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs print:hidden animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-600 text-white rounded-xl">
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Kelola & Perbarui Data Profil SPPG
                  </h3>
                  <p className="text-xs text-slate-500">
                    Perubahan akan tersimpan otomatis ke penyimpanan lokal dan Supabase.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex items-center gap-1.5 px-6 pt-3 pb-2 border-b border-slate-200 bg-white overflow-x-auto text-xs">
              <button
                type="button"
                onClick={() => setActiveEditTab('sppg')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer whitespace-nowrap ${
                  activeEditTab === 'sppg'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                1. Identitas SPPG
              </button>
              <button
                type="button"
                onClick={() => setActiveEditTab('kasatpel')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer whitespace-nowrap ${
                  activeEditTab === 'kasatpel'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                2. Kasatpel SPPI
              </button>
              <button
                type="button"
                onClick={() => setActiveEditTab('mitra')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer whitespace-nowrap ${
                  activeEditTab === 'mitra'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                3. Mitra / Instansi
              </button>
              <button
                type="button"
                onClick={() => setActiveEditTab('legalitas')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer whitespace-nowrap ${
                  activeEditTab === 'legalitas'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                4. Legalitas BGN
              </button>
              <button
                type="button"
                onClick={() => setActiveEditTab('bank')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer whitespace-nowrap ${
                  activeEditTab === 'bank'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                5. Bank & Rekening
              </button>
              <button
                type="button"
                onClick={() => setActiveEditTab('pic')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer whitespace-nowrap ${
                  activeEditTab === 'pic'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                6. PIC / VA
              </button>
            </div>

            {/* Modal Body: Form Fields */}
            <form onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* Tab 1: Identitas SPPG */}
              {activeEditTab === 'sppg' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="font-semibold text-slate-700">Nama Resmi SPPG *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.nama_sppg}
                      onChange={(e) => setEditFormData({ ...editFormData, nama_sppg: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">ID SPPG *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.id_sppg}
                      onChange={(e) => setEditFormData({ ...editFormData, id_sppg: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Kode SPPG *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.kode_sppg}
                      onChange={(e) => setEditFormData({ ...editFormData, kode_sppg: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Nomor BA Verval *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.no_ba_verval}
                      onChange={(e) => setEditFormData({ ...editFormData, no_ba_verval: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Tanggal BA Verval *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.tgl_ba_verval}
                      onChange={(e) => setEditFormData({ ...editFormData, tgl_ba_verval: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Status Operasional *</label>
                    <select
                      value={editFormData.status_operasional}
                      onChange={(e) => setEditFormData({ ...editFormData, status_operasional: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      <option value="Beroperasi">Beroperasi (Aktif Penuh)</option>
                      <option value="Persiapan">Persiapan / Uji Coba</option>
                      <option value="Pemeliharaan">Pemeliharaan / Maintenance</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Tanggal Operasional *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.tgl_operasional}
                      onChange={(e) => setEditFormData({ ...editFormData, tgl_operasional: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Jenis SPPG *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.jenis_sppg}
                      onChange={(e) => setEditFormData({ ...editFormData, jenis_sppg: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Jenis / Asal Bangunan *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.jenis_bangunan}
                      onChange={(e) => setEditFormData({ ...editFormData, jenis_bangunan: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="font-semibold text-slate-700">Alamat Lengkap Unit *</label>
                    <textarea
                      rows={2}
                      required
                      value={editFormData.alamat_lengkap}
                      onChange={(e) => setEditFormData({ ...editFormData, alamat_lengkap: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Provinsi</label>
                    <input
                      type="text"
                      value={editFormData.provinsi}
                      onChange={(e) => setEditFormData({ ...editFormData, provinsi: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Kabupaten</label>
                    <input
                      type="text"
                      value={editFormData.kabupaten}
                      onChange={(e) => setEditFormData({ ...editFormData, kabupaten: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Kecamatan</label>
                    <input
                      type="text"
                      value={editFormData.kecamatan}
                      onChange={(e) => setEditFormData({ ...editFormData, kecamatan: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Desa / Kelurahan</label>
                    <input
                      type="text"
                      value={editFormData.desa}
                      onChange={(e) => setEditFormData({ ...editFormData, desa: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Kode Pos</label>
                    <input
                      type="text"
                      value={editFormData.kode_pos}
                      onChange={(e) => setEditFormData({ ...editFormData, kode_pos: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Koordinat Latitude & Longitude</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        step="any"
                        placeholder="Lat"
                        value={editFormData.latitude}
                        onChange={(e) => setEditFormData({ ...editFormData, latitude: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono"
                      />
                      <input
                        type="number"
                        step="any"
                        placeholder="Long"
                        value={editFormData.longitude}
                        onChange={(e) => setEditFormData({ ...editFormData, longitude: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Kasatpel */}
              {activeEditTab === 'kasatpel' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Nama Lengkap Kasatpel *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.kasatpel_nama}
                      onChange={(e) => setEditFormData({ ...editFormData, kasatpel_nama: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Jabatan Struktural *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.kasatpel_jabatan}
                      onChange={(e) => setEditFormData({ ...editFormData, kasatpel_jabatan: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Email Kasatpel *</label>
                      <input
                        type="email"
                        required
                        value={editFormData.kasatpel_email}
                        onChange={(e) => setEditFormData({ ...editFormData, kasatpel_email: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Nomor HP / WhatsApp *</label>
                      <input
                        type="text"
                        required
                        value={editFormData.kasatpel_telepon}
                        onChange={(e) => setEditFormData({ ...editFormData, kasatpel_telepon: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Catatan Kasatpel</label>
                    <textarea
                      rows={2}
                      value={editFormData.kasatpel_catatan}
                      onChange={(e) => setEditFormData({ ...editFormData, kasatpel_catatan: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Tab 3: Mitra / Instansi */}
              {activeEditTab === 'mitra' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Jenis Mitra / Instansi *</label>
                      <input
                        type="text"
                        required
                        value={editFormData.mitra_jenis}
                        onChange={(e) => setEditFormData({ ...editFormData, mitra_jenis: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Nama Mitra / Instansi *</label>
                      <input
                        type="text"
                        required
                        value={editFormData.mitra_nama}
                        onChange={(e) => setEditFormData({ ...editFormData, mitra_nama: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs font-semibold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Nama Pimpinan *</label>
                      <input
                        type="text"
                        required
                        value={editFormData.mitra_pimpinan}
                        onChange={(e) => setEditFormData({ ...editFormData, mitra_pimpinan: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Nomor Telepon / HP *</label>
                      <input
                        type="text"
                        required
                        value={editFormData.mitra_telepon}
                        onChange={(e) => setEditFormData({ ...editFormData, mitra_telepon: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Email Mitra *</label>
                    <input
                      type="email"
                      required
                      value={editFormData.mitra_email}
                      onChange={(e) => setEditFormData({ ...editFormData, mitra_email: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Alamat Wilayah Operasional</label>
                    <textarea
                      rows={2}
                      value={editFormData.mitra_alamat_operasional}
                      onChange={(e) => setEditFormData({ ...editFormData, mitra_alamat_operasional: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Bentuk Dukungan / Kepemilikan Aset</label>
                    <input
                      type="text"
                      value={editFormData.mitra_bentuk_dukungan}
                      onChange={(e) => setEditFormData({ ...editFormData, mitra_bentuk_dukungan: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Tab 4: Legalitas BGN */}
              {activeEditTab === 'legalitas' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Nama Yayasan Resmi *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.yayasan_nama}
                      onChange={(e) => setEditFormData({ ...editFormData, yayasan_nama: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">NPWP Yayasan *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.yayasan_npwp}
                      onChange={(e) => setEditFormData({ ...editFormData, yayasan_npwp: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Alamat Domisili Legal *</label>
                    <textarea
                      rows={2}
                      required
                      value={editFormData.yayasan_alamat_legal}
                      onChange={(e) => setEditFormData({ ...editFormData, yayasan_alamat_legal: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Kode Pos Legal</label>
                      <input
                        type="text"
                        value={editFormData.yayasan_kode_pos}
                        onChange={(e) => setEditFormData({ ...editFormData, yayasan_kode_pos: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono text-xs"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="font-semibold text-slate-700">Email Legal Yayasan</label>
                      <input
                        type="email"
                        value={editFormData.yayasan_email}
                        onChange={(e) => setEditFormData({ ...editFormData, yayasan_email: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Catatan Yayasan</label>
                    <textarea
                      rows={2}
                      value={editFormData.yayasan_catatan}
                      onChange={(e) => setEditFormData({ ...editFormData, yayasan_catatan: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Tab 5: Bank & Rekening */}
              {activeEditTab === 'bank' && (
                <div className="space-y-5">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <span className="font-bold text-slate-900 block text-xs">A. Rekening Operasional Utama</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700">Nama Bank *</label>
                        <input
                          type="text"
                          required
                          value={editFormData.bank_utama_nama}
                          onChange={(e) => setEditFormData({ ...editFormData, bank_utama_nama: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700">Nomor Rekening *</label>
                        <input
                          type="text"
                          required
                          value={editFormData.bank_utama_rekening}
                          onChange={(e) => setEditFormData({ ...editFormData, bank_utama_rekening: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono text-xs font-bold"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <label className="font-semibold text-slate-700">Nama Pemilik Rekening *</label>
                        <input
                          type="text"
                          required
                          value={editFormData.bank_utama_pemilik}
                          onChange={(e) => setEditFormData({ ...editFormData, bank_utama_pemilik: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs font-semibold uppercase"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-3">
                    <span className="font-bold text-indigo-950 block text-xs">B. Rekening Virtual Account (VA BGN)</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700">Bank Virtual Account *</label>
                        <input
                          type="text"
                          required
                          value={editFormData.bank_va_nama}
                          onChange={(e) => setEditFormData({ ...editFormData, bank_va_nama: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700">Nomor Virtual Account *</label>
                        <input
                          type="text"
                          required
                          value={editFormData.bank_va_nomor}
                          onChange={(e) => setEditFormData({ ...editFormData, bank_va_nomor: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono text-xs font-bold"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <label className="font-semibold text-slate-700">Nama Akun Virtual Account *</label>
                        <input
                          type="text"
                          required
                          value={editFormData.bank_va_pemilik}
                          onChange={(e) => setEditFormData({ ...editFormData, bank_va_pemilik: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs font-semibold uppercase"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 6: PIC / VA */}
              {activeEditTab === 'pic' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Nama Lengkap Perwakilan (PIC) *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.pic_nama}
                      onChange={(e) => setEditFormData({ ...editFormData, pic_nama: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Nomor Induk Kependudukan (NIK) *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.pic_nik}
                      onChange={(e) => setEditFormData({ ...editFormData, pic_nik: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Email PIC *</label>
                      <input
                        type="email"
                        required
                        value={editFormData.pic_email}
                        onChange={(e) => setEditFormData({ ...editFormData, pic_email: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Nomor HP / WhatsApp *</label>
                      <input
                        type="text"
                        required
                        value={editFormData.pic_telepon}
                        onChange={(e) => setEditFormData({ ...editFormData, pic_telepon: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCcw size={13} />
                  <span>Kembalikan ke Default Resmi</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? <RotateCw size={13} className="animate-spin" /> : <Save size={13} />}
                    <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
