"use client"
import React, { useState, useEffect } from 'react'
import { Users, Plus, Trash2, ShieldCheck, Heart, User, FileText, CheckCircle2 } from 'lucide-react'

interface VolunteerDetail {
  name: string;
  jabatan: string;
  divisi: string;
  nik: string;
  tempatLahir: string;
  tanggalLahir: string;
  status: string;
  noHp: string;
  pendidikan: string;
  mulaiKerja: string;
  alamat: string;
  berkas: string[]; // List of documents that are present
}

export default function RelawanPage() {
  const [volunteers, setVolunteers] = useState<VolunteerDetail[]>([])
  const [activeTab, setActiveTab] = useState<'biodata' | 'berkas'>('biodata')

  // Form states - Biodata
  const [name, setName] = useState('')
  const [jabatan, setJabatan] = useState('Relawan Dapur')
  const [divisi, setDivisi] = useState('Tim Produksi')
  const [nik, setNik] = useState('')
  const [tempatLahir, setTempatLahir] = useState('Pasuruan')
  const [tanggalLahir, setTanggalLahir] = useState('1998-05-12')
  const [status, setStatus] = useState('Aktif Bekerja')
  const [noHp, setNoHp] = useState('')
  const [pendidikan, setPendidikan] = useState('SMA / Sederajat')
  const [mulaiKerja, setMulaiKerja] = useState('2025-01-10')
  const [alamat, setAlamat] = useState('')

  // Form states - Checklist Berkas
  const requiredDocs = [
    'Surat Lamaran Kerja',
    'Daftar Riwayat Hidup (CV)',
    'FC KTP',
    'Pas Foto',
    'FC Ijazah',
    'FC SIM A',
    'FC Sertifikat Kursus',
    'Sertifikat Penjamah Makanan',
    'SKCK',
    'Surat Keterangan Sehat',
    'Surat Bebas Narkoba',
    'Surat Pengalaman Kerja'
  ]
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({})

  useEffect(() => {
    // Load and check if database is valid and matches the legal-checklist schema
    const storedDetails = localStorage.getItem('sppg_volunteers_details')
    let parsed: VolunteerDetail[] = []
    
    if (storedDetails) {
      try {
        parsed = JSON.parse(storedDetails)
      } catch {
        parsed = []
      }
    }

    // Self-healing check: if the first element has no 'berkas' field, regenerate everything (empty array by default)
    if (parsed.length > 0 && parsed[0].berkas && Array.isArray(parsed[0].berkas)) {
      setVolunteers(parsed)
    } else {
      localStorage.setItem('sppg_volunteers_details', JSON.stringify([]))
      localStorage.setItem('sppg_volunteers', JSON.stringify([]))
      setVolunteers([])
    }
  }, [])

  const handleDocCheckbox = (docName: string) => {
    setCheckedDocs(prev => ({
      ...prev,
      [docName]: !prev[docName]
    }))
  }

  const handleAddVolunteer = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || nik.length !== 16) {
      alert('Nama tidak boleh kosong & NIK harus tepat 16 digit!')
      return
    }

    const presentDocs = requiredDocs.filter(doc => checkedDocs[doc])

    const newVol: VolunteerDetail = {
      name: name.trim(),
      jabatan,
      divisi,
      nik,
      tempatLahir,
      tanggalLahir,
      status,
      noHp,
      pendidikan,
      mulaiKerja,
      alamat,
      berkas: presentDocs
    }

    const updatedList = [...volunteers, newVol]
    setVolunteers(updatedList)

    localStorage.setItem('sppg_volunteers_details', JSON.stringify(updatedList))
    localStorage.setItem('sppg_volunteers', JSON.stringify(updatedList.map(v => v.name)))

    // Reset Form
    setName('')
    setNik('')
    setNoHp('')
    setAlamat('')
    setCheckedDocs({})
    setActiveTab('biodata')
  }

  const handleDeleteVolunteer = (nameToDelete: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus relawan ${nameToDelete}?`)) {
      const updatedList = volunteers.filter(v => v.name !== nameToDelete)
      setVolunteers(updatedList)
      localStorage.setItem('sppg_volunteers_details', JSON.stringify(updatedList))
      localStorage.setItem('sppg_volunteers', JSON.stringify(updatedList.map(v => v.name)))
    }
  }

  return (
    <div className="space-y-6 bg-[#F8FAFC] min-h-screen text-slate-800 font-sans">
      
      {/* Banner / Header */}
      <div className="bg-white border border-gray-200 p-6 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-emerald-900 text-white text-[10px] font-bold rounded uppercase tracking-wider">
              SDM / Relawan
            </span>
            <span className="text-xs text-gray-500 font-medium">Kepala SPPG · Database Profil Audit</span>
          </div>
          <h1 className="text-xl font-bold text-emerald-950">Database Master Profil Relawan</h1>
          <p className="text-gray-500 text-xs font-medium">
            Pengelolaan berkas legalitas, NIK harian, data pribadi, dan status kepatuhan relawan dapur SPPG Wonorejo.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Form Tabbed Biodata & Berkas */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
            
            {/* Tab Controller Header */}
            <div className="flex border-b border-gray-200 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('biodata')}
                className={`flex-1 pb-2 font-bold uppercase tracking-wider text-center border-b-2 transition cursor-pointer ${
                  activeTab === 'biodata' ? 'border-emerald-900 text-emerald-950' : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                1. Profil & Biodata
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('berkas')}
                className={`flex-1 pb-2 font-bold uppercase tracking-wider text-center border-b-2 transition cursor-pointer ${
                  activeTab === 'berkas' ? 'border-emerald-900 text-emerald-950' : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                2. Checklist Berkas
              </button>
            </div>

            <form onSubmit={handleAddVolunteer} className="space-y-4 text-xs font-semibold">
              {activeTab === 'biodata' ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-gray-600">Nama Lengkap Relawan</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nama Lengkap"
                      className="w-full p-2 border border-gray-200 rounded text-gray-755 outline-none font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-gray-600">NIK (16 Digit)</label>
                      <input
                        type="text"
                        required
                        maxLength={16}
                        value={nik}
                        onChange={(e) => setNik(e.target.value.replace(/\D/g, ''))}
                        placeholder="NIK"
                        className="w-full p-2 border border-gray-200 rounded text-gray-755 outline-none font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-gray-600">No HP</label>
                      <input
                        type="text"
                        required
                        value={noHp}
                        onChange={(e) => setNoHp(e.target.value)}
                        placeholder="No HP"
                        className="w-full p-2 border border-gray-200 rounded text-gray-755 outline-none font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-gray-600">Jabatan</label>
                      <input
                        type="text"
                        required
                        value={jabatan}
                        onChange={(e) => setJabatan(e.target.value)}
                        placeholder="Contoh: Juru Masak"
                        className="w-full p-2 border border-gray-200 rounded text-gray-755 outline-none font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-gray-600">Divisi</label>
                      <select
                        value={divisi}
                        onChange={(e) => setDivisi(e.target.value)}
                        className="w-full p-2 border border-gray-200 rounded bg-white text-gray-700 outline-none"
                      >
                        <option value="Tim Gudang">Tim Gudang</option>
                        <option value="Tim Produksi">Tim Produksi</option>
                        <option value="Tim Packing">Tim Packing</option>
                        <option value="Driver/Distribusi">Driver/Distribusi</option>
                        <option value="Admin Dokumentasi">Admin Dokumentasi</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-gray-600">Tempat Lahir</label>
                      <input
                        type="text"
                        required
                        value={tempatLahir}
                        onChange={(e) => setTempatLahir(e.target.value)}
                        className="w-full p-2 border border-gray-200 rounded text-gray-755 outline-none font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-gray-600">Tanggal Lahir</label>
                      <input
                        type="date"
                        required
                        value={tanggalLahir}
                        onChange={(e) => setTanggalLahir(e.target.value)}
                        className="w-full p-2 border border-gray-200 rounded text-gray-755 outline-none font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-gray-600">Status Pernikahan/Kerja</label>
                      <input
                        type="text"
                        required
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full p-2 border border-gray-200 rounded text-gray-755 outline-none font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-gray-600">Pendidikan Terakhir</label>
                      <input
                        type="text"
                        required
                        value={pendidikan}
                        onChange={(e) => setPendidikan(e.target.value)}
                        className="w-full p-2 border border-gray-200 rounded text-gray-755 outline-none font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-600">Tanggal Mulai Bekerja</label>
                    <input
                      type="date"
                      required
                      value={mulaiKerja}
                      onChange={(e) => setMulaiKerja(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded text-gray-755 outline-none font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-600">Alamat Lengkap</label>
                    <textarea
                      required
                      rows={2}
                      value={alamat}
                      onChange={(e) => setAlamat(e.target.value)}
                      placeholder="Tulis alamat rumah lengkap..."
                      className="w-full p-2 border border-gray-200 rounded text-gray-755 outline-none font-medium resize-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('berkas')}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-950 text-white font-bold uppercase rounded border transition cursor-pointer text-center"
                  >
                    Lanjutkan ke Checklist Berkas
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-gray-500 block">Checklist Kelengkapan Berkas Relawan</label>
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                      {requiredDocs.map((doc) => (
                        <label key={doc} className="flex items-start gap-1.5 p-2 bg-slate-50 border border-gray-200 rounded cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={!!checkedDocs[doc]}
                            onChange={() => handleDocCheckbox(doc)}
                            className="mt-0.5 cursor-pointer"
                          />
                          <span className={checkedDocs[doc] ? 'text-emerald-900 font-extrabold' : 'text-slate-500 font-medium'}>
                            {doc}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('biodata')}
                      className="flex-1 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold uppercase rounded border border-gray-200 transition cursor-pointer"
                    >
                      Kembali
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-emerald-900 hover:bg-emerald-950 text-white font-bold uppercase rounded border border-emerald-950 transition cursor-pointer"
                    >
                      Simpan Relawan
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Right Column: Tabel Master Relawan (Horizontal Scrollable) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Users size={16} className="text-emerald-950" /> Daftar Master Relawan (Profil Audit)
              </h2>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-gray-200">
                Database: {volunteers.length} Relawan
              </span>
            </div>
            
            {volunteers.length === 0 ? (
              <div className="p-8 text-center text-gray-400 font-semibold text-xs">
                Tidak ada data relawan terdaftar.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto w-full">
                <table className="min-w-[1200px] w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-gray-200 sticky top-0 z-10">
                      <th className="px-4 py-2.5 text-center w-12 bg-slate-50">No</th>
                      <th className="px-4 py-2.5 bg-slate-50">Nama</th>
                      <th className="px-4 py-2.5 bg-slate-50">Jabatan</th>
                      <th className="px-4 py-2.5 bg-slate-50">Divisi</th>
                      <th className="px-4 py-2.5 bg-slate-50">NIK</th>
                      <th className="px-4 py-2.5 bg-slate-50">Lahir</th>
                      <th className="px-4 py-2.5 bg-slate-50">Status</th>
                      <th className="px-4 py-2.5 bg-slate-50">No HP</th>
                      <th className="px-4 py-2.5 bg-slate-50">Pendidikan</th>
                      <th className="px-4 py-2.5 bg-slate-50">Mulai Kerja</th>
                      <th className="px-4 py-2.5 bg-slate-50">Alamat</th>
                      <th className="px-4 py-2.5 text-center bg-slate-50">Berkas Legalitas</th>
                      <th className="px-4 py-2.5 text-center w-16 bg-slate-50">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150 font-semibold text-gray-700">
                    {volunteers.map((v, i) => (
                      <tr key={i} className="hover:bg-slate-50/40">
                        <td className="px-4 py-3 text-center text-slate-400 font-bold">{i + 1}</td>
                        <td className="px-4 py-3 font-bold text-slate-800">{v.name}</td>
                        <td className="px-4 py-3 text-slate-600">{v.jabatan}</td>
                        <td className="px-4 py-3 text-slate-600">{v.divisi}</td>
                        <td className="px-4 py-3 text-slate-500 font-mono">{v.nik}</td>
                        <td className="px-4 py-3 text-slate-600">{v.tempatLahir}, {v.tanggalLahir}</td>
                        <td className="px-4 py-3 text-slate-600">{v.status}</td>
                        <td className="px-4 py-3 text-slate-500">{v.noHp}</td>
                        <td className="px-4 py-3 text-slate-600">{v.pendidikan}</td>
                        <td className="px-4 py-3 text-slate-500">{v.mulaiKerja}</td>
                        <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={v.alamat}>{v.alamat}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            (v.berkas?.length || 0) === 12 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                              : (v.berkas?.length || 0) >= 8 
                                ? 'bg-indigo-50 text-indigo-800 border-indigo-200' 
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}>
                            {v.berkas?.length || 0}/12 Berkas
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleDeleteVolunteer(v.name)}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                            title="Hapus Relawan"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
