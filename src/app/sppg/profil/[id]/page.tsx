"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter, usePathname } from 'next/navigation'
import { useToast } from '@/components/toast'
import {
  LayoutDashboard, LogOut, Menu, ChevronLeft, Store,
  Building2, Users, ChefHat, MapPin, Calendar, Award, Hash,
  Pencil, X, Save, Loader2, Phone, Handshake, FileCheck, Shield,
  ArrowLeft, BadgeCheck, XCircle, ClipboardList, MapPinned, KeyRound
} from 'lucide-react'

export default function ProfilSPPGPage() {
  const { id } = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isEditing, setIsEditing] = useState(false)

  // Form Data
  const [formData, setFormData] = useState({
    idDapur: '',
    no: '',
    sppiBatch: '',
    namaKaSppg: '',
    gelarKaSppg: '',
    noHpKaSppg: '',
    skepNomor: '',
    idSppg: '',
    tanggalOperasional: '',
    namaSppg: '',
    alamatLengkap: '',
    kecamatan: '',
    gmaps: '',
    namaMitra: '',
    noHpMitra: '',
    yayasan: '',
    namaPerwakilanYayasan: '',
    noHpPerwakilanYayasan: '',
  })

  // Legalitas
  const [legalitas, setLegalitas] = useState({
    ikl: false,
    slhs: false,
    smo: false,
    bpjs: false,
  })

  // Backup for cancel
  const [backupForm, setBackupForm] = useState(formData)
  const [backupLegalitas, setBackupLegalitas] = useState(legalitas)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const { data: unit } = await supabase.from('daftar_sppg').select('*').eq('id', id).single()
        if (unit) {
          const loaded = {
            idDapur: unit.id_dapur || '',
            no: unit.no || '',
            sppiBatch: unit.sppi_batch || '',
            namaKaSppg: unit.kepala_unit || '',
            gelarKaSppg: unit.gelar_ka_sppg || '',
            noHpKaSppg: unit.no_hp_ka_sppg || '',
            skepNomor: unit.skep_nomor || '',
            idSppg: String(unit.id) || '',
            tanggalOperasional: unit.tanggal_operasional || '',
            namaSppg: unit.nama_unit || '',
            alamatLengkap: unit.alamat || '',
            kecamatan: unit.kecamatan || '',
            gmaps: unit.gmaps || '',
            namaMitra: unit.nama_mitra || '',
            noHpMitra: unit.no_hp_mitra || '',
            yayasan: unit.yayasan || '',
            namaPerwakilanYayasan: unit.nama_perwakilan_yayasan || '',
            noHpPerwakilanYayasan: unit.no_hp_perwakilan_yayasan || '',
          }
          const loadedLegalitas = {
            ikl: unit.ikl ?? false,
            slhs: unit.slhs ?? false,
            smo: unit.smo ?? false,
            bpjs: unit.bpjs ?? false,
          }
          setFormData(loaded)
          setBackupForm(loaded)
          setLegalitas(loadedLegalitas)
          setBackupLegalitas(loadedLegalitas)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    if (id) loadData()
  }, [id])

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleStartEdit = () => {
    setBackupForm(formData)
    setBackupLegalitas(legalitas)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setFormData(backupForm)
    setLegalitas(backupLegalitas)
    setIsEditing(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase.from('daftar_sppg').update({
        id_dapur: formData.idDapur,
        no: formData.no,
        sppi_batch: formData.sppiBatch,
        kepala_unit: formData.namaKaSppg,
        gelar_ka_sppg: formData.gelarKaSppg,
        no_hp_ka_sppg: formData.noHpKaSppg,
        skep_nomor: formData.skepNomor,
        id_sppg: formData.idSppg,
        tanggal_operasional: formData.tanggalOperasional,
        nama_unit: formData.namaSppg,
        alamat: formData.alamatLengkap,
        kecamatan: formData.kecamatan,
        gmaps: formData.gmaps,
        nama_mitra: formData.namaMitra,
        no_hp_mitra: formData.noHpMitra,
        yayasan: formData.yayasan,
        nama_perwakilan_yayasan: formData.namaPerwakilanYayasan,
        no_hp_perwakilan_yayasan: formData.noHpPerwakilanYayasan,
        ikl: legalitas.ikl,
        slhs: legalitas.slhs,
        smo: legalitas.smo,
        bpjs: legalitas.bpjs,
      }).eq('id', id)

      if (error) {
        console.error('Supabase update error:', error)
        toast('error', 'Gagal Menyimpan', error.message || error.details || 'Error tidak diketahui dari Supabase.')
      } else {
        toast('success', 'Profil Tersimpan!', 'Data profil SPPG berhasil diperbarui.')
        setBackupForm(formData)
        setBackupLegalitas(legalitas)
        setIsEditing(false)
      }
    } catch (err: any) {
      console.error('Save error:', err)
      toast('error', 'Kesalahan Sistem', err?.message || 'Terjadi kesalahan tak terduga.')
    } finally {
      setSaving(false)
    }
  }

  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: `/sppg/dashboard/${id}` },
    { label: 'Profil SPPG', icon: Store, href: `/sppg/profil/${id}` },
  ]

  // Shared input styling
  const inputBase = "w-full text-sm font-medium text-slate-700 transition-all duration-200 rounded-lg px-3 py-2.5"
  const inputView = `${inputBase} bg-transparent cursor-default`
  const inputEdit = `${inputBase} bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none shadow-sm`

  const renderField = (label: string, key: string, icon: any, options?: { type?: string; textarea?: boolean }) => {
    const Icon = icon
    const value = (formData as any)[key] || ''
    return (
      <div className="space-y-1.5">
        <label className="flex items-center gap-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
          <Icon size={13} className="text-slate-300" />
          {label}
        </label>
        {options?.textarea ? (
          <textarea
            disabled={!isEditing}
            value={value}
            onChange={(e) => handleChange(key, e.target.value)}
            rows={3}
            className={`${isEditing ? inputEdit : inputView} resize-none`}
            placeholder={isEditing ? `Masukkan ${label.toLowerCase()}...` : '—'}
          />
        ) : (
          <input
            disabled={!isEditing}
            type={options?.type || 'text'}
            value={value}
            onChange={(e) => handleChange(key, e.target.value)}
            className={isEditing ? inputEdit : inputView}
            placeholder={isEditing ? `Masukkan ${label.toLowerCase()}...` : '—'}
          />
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/30 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest animate-pulse">Memuat Profil...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex font-sans text-slate-800 transition-all duration-300 relative overflow-hidden">

      {/* DECORATIVE BLOBS */}
      <div className="fixed top-[-100px] left-[-100px] w-[500px] h-[500px] bg-indigo-400/20 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed bottom-[-80px] left-[-60px] w-[400px] h-[400px] bg-emerald-400/20 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed top-[-120px] right-[-120px] w-[400px] h-[400px] bg-blue-200/10 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* SIDEBAR — GLASSMORPHISM */}
      <aside className={`bg-white/40 backdrop-blur-xl border-r border-white/50 flex flex-col fixed h-full z-50 transition-all duration-300 ${sidebarOpen ? 'w-60' : 'w-[70px]'}`} style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.6), inset 0 -1px 1px rgba(255,255,255,0.3), 0 10px 40px -10px rgba(0,0,0,0.08)' }}>
        <div className="p-4 border-b border-white/20 flex items-center justify-between">
          <div className={`flex items-center gap-4 hover:scale-105 transition-transform duration-300 overflow-hidden ${sidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
            <img src="/logo.png" style={{ width: '48px', height: '48px', objectFit: 'contain' }} className="shrink-0" />
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-none text-slate-800 whitespace-nowrap">SPPG PASURUAN</span>
              <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap mt-1">Sistem Manajemen Operasional Gizi</span>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
            {sidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1 mt-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <button
                key={item.label}
                onClick={() => router.push(item.href)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-lg backdrop-blur-sm transition-all duration-300 ${
                  isActive
                    ? 'bg-indigo-500/10 text-indigo-700 hover:bg-indigo-500/20'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                }`}
              >
                <item.icon size={18} className="shrink-0" />
                <span className={sidebarOpen ? 'block' : 'hidden'}>{item.label}</span>
              </button>
            )
          })}
        </nav>
        <div className="p-3 border-t border-white/20">
          <button onClick={() => { localStorage.clear(); router.push('/') }} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-red-500 hover:bg-red-500/10 rounded-lg transition-all duration-300">
            <LogOut size={18} className="shrink-0" />
            <span className={sidebarOpen ? 'block' : 'hidden'}>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className={`flex-1 min-h-screen transition-all duration-300 ${sidebarOpen ? 'pl-60' : 'pl-[70px]'}`}>

        {/* HEADER */}
        <header className="bg-white border-b border-slate-200 px-6 lg:px-8 py-4 flex justify-between items-center sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push(`/sppg/dashboard/${id}`)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-800">Profil Unit SPPG</h1>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Informasi detail & data unit</p>
            </div>
          </div>

          {/* EDIT / SAVE / CANCEL Buttons */}
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={handleStartEdit}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-all duration-200"
              >
                <Pencil size={14} />
                Edit Profil
              </button>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold transition-all duration-200"
                >
                  <X size={14} />
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-all duration-200 shadow-sm shadow-emerald-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      Simpan Perubahan
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </header>

        <div className="p-5 lg:p-8 max-w-5xl mx-auto space-y-6">

          {/* ========================================== */}
          {/* CARD 1: INFORMASI UNIT SPPG               */}
          {/* ========================================== */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-50 text-indigo-500 rounded-lg flex items-center justify-center">
                <Building2 size={18} />
              </div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Informasi Unit SPPG</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              {/* ID SPPG — system UUID, always read-only */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                  <Hash size={13} className="text-slate-300" />
                  ID SPPG <span className="text-[9px] text-slate-300 normal-case tracking-normal">(System ID)</span>
                </label>
                <input
                  disabled
                  type="text"
                  value={formData.idSppg}
                  className={`${inputBase} bg-slate-50 text-slate-400 cursor-not-allowed border border-dashed border-slate-200 font-mono text-xs`}
                  placeholder="—"
                />
              </div>
              {/* ID Dapur — editable custom ID */}
              {renderField('ID Dapur', 'idDapur', KeyRound)}
              {renderField('Nama SPPG (sesuai Dialur)', 'namaSppg', Building2)}
              {renderField('No', 'no', Hash)}
              {renderField('SPPI Batch', 'sppiBatch', ClipboardList)}
              {renderField('Tanggal Operasional', 'tanggalOperasional', Calendar, { type: 'date' })}
              {renderField('SKEP Nomor', 'skepNomor', FileCheck)}
              {renderField('Kecamatan', 'kecamatan', MapPin)}
              {renderField('Google Maps', 'gmaps', MapPinned)}
              <div className="md:col-span-2">
                {renderField('Alamat Lengkap SPPG', 'alamatLengkap', MapPin, { textarea: true })}
              </div>
            </div>
          </div>

          {/* ========================================== */}
          {/* CARD 2: DATA PERSONEL & KEMITRAAN          */}
          {/* ========================================== */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-50 text-amber-500 rounded-lg flex items-center justify-center">
                <Users size={18} />
              </div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Data Personel & Kemitraan</h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Ka SPPG Section */}
              <div>
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <ChefHat size={13} /> Kepala SPPG
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 pl-5 border-l-2 border-indigo-100">
                  {renderField('Nama Lengkap Ka SPPG', 'namaKaSppg', Users)}
                  {renderField('Gelar Ka SPPG', 'gelarKaSppg', Award)}
                  {renderField('No. HP Ka SPPG', 'noHpKaSppg', Phone, { type: 'tel' })}
                </div>
              </div>

              {/* Mitra Section */}
              <div>
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Handshake size={13} /> Mitra
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 pl-5 border-l-2 border-emerald-100">
                  {renderField('Nama Mitra', 'namaMitra', Users)}
                  {renderField('No. HP Mitra', 'noHpMitra', Phone, { type: 'tel' })}
                </div>
              </div>

              {/* Yayasan Section */}
              <div>
                <p className="text-[10px] font-bold text-violet-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Building2 size={13} /> Yayasan
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 pl-5 border-l-2 border-violet-100">
                  {renderField('Yayasan', 'yayasan', Building2)}
                  {renderField('Nama Perwakilan Yayasan', 'namaPerwakilanYayasan', Users)}
                  {renderField('No. HP Perwakilan Yayasan', 'noHpPerwakilanYayasan', Phone, { type: 'tel' })}
                </div>
              </div>
            </div>
          </div>

          {/* ========================================== */}
          {/* CARD 3: STATUS LEGALITAS & KEPATUHAN       */}
          {/* ========================================== */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-50 text-emerald-500 rounded-lg flex items-center justify-center">
                <Shield size={18} />
              </div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Status Legalitas & Kepatuhan</h2>
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {([
                { key: 'ikl' as const, label: 'IKL', desc: 'Izin Komitmen Lingkungan' },
                { key: 'slhs' as const, label: 'SLHS', desc: 'Sertifikat Laik Hygiene Sanitasi' },
                { key: 'smo' as const, label: 'SMO', desc: 'Surat Memulai Operasional' },
                { key: 'bpjs' as const, label: 'BPJS', desc: 'Jaminan Sosial Tenaga Kerja' },
              ]).map((item) => {
                const isActive = legalitas[item.key]

                if (isEditing) {
                  // Toggle mode
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setLegalitas(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 text-left group ${
                        isActive
                          ? 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-slate-700">{item.label}</span>
                        {/* Toggle Switch */}
                        <div className={`w-10 h-5 rounded-full p-0.5 transition-all duration-300 ${isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                          <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium leading-snug">{item.desc}</p>
                    </button>
                  )
                }

                // Badge/status mode
                return (
                  <div
                    key={item.key}
                    className={`p-4 rounded-xl border transition-all duration-300 ${
                      isActive
                        ? 'border-emerald-200 bg-emerald-50/50'
                        : 'border-red-200 bg-red-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {isActive ? (
                        <BadgeCheck size={18} className="text-emerald-500" />
                      ) : (
                        <XCircle size={18} className="text-red-400" />
                      )}
                      <span className="text-sm font-bold text-slate-700">{item.label}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium leading-snug mb-2">{item.desc}</p>
                    <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      isActive
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {isActive ? '✓ Terpenuhi' : '✗ Belum'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
