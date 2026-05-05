"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getLocalToday } from '@/lib/date'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/toast'
import {
  Users, Plus, Trash2, LogOut, Search, ShieldCheck,
  Building2, Mail, Lock, UserCircle, BarChart3, Edit3,
  X, Key, CheckCircle2, ChevronLeft, Menu, Loader2
} from 'lucide-react'
import Swal from 'sweetalert2'
import { verifyAccount, rejectAccount } from '@/lib/verification'

import * as XLSX from 'xlsx'

export default function SuperAdminITPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<'members' | 'monitor'>('members')
  const [searchTerm, setSearchTerm] = useState('')

  // FITUR SIDEBAR TOGGLE
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Data State
  const [dataMaster, setDataMaster] = useState<any[]>([])
  const [units, setUnits] = useState<any[]>([])
  const [laporanHarian, setLaporanHarian] = useState<any[]>([])
  const [tanggal] = useState(getLocalToday())

  // Import State
  const [isImporting, setIsImporting] = useState(false)

  // Form State
  const [isEdit, setIsEdit] = useState(false)
  const [editId, setEditId] = useState('')
  const [form, setForm] = useState({
    nama_unit: '', kepala_unit: '', email: '', password: '', role: 'sppg'
  })

  const fetchData = async () => {
    // IT Admin can see ALL users
    const { data: usr } = await supabase.from('users_app').select(`*, daftar_sppg(nama_unit, kepala_unit)`).order('created_at', { ascending: false })
    const { data: unt } = await supabase.from('daftar_sppg').select('*')
    const { data: lap } = await supabase.from('laporan_harian_final').select('*').eq('tanggal_ops', tanggal)

    if (usr) setDataMaster(usr)
    if (unt) setUnits(unt)
    if (lap) setLaporanHarian(lap)
  }

  useEffect(() => { fetchData() }, [])

  const handleApprove = async (id: string) => {
    const result = await Swal.fire({
      title: 'Aktifkan Akun?',
      text: "Akun ini akan diverifikasi dan diizinkan mengakses sistem.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, Aktifkan!'
    })

    if (result.isConfirmed) {
      try {
        await verifyAccount(id)
        Swal.fire({
          title: 'Berhasil!',
          text: 'Akun Diaktifkan!',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        })
        fetchData()
      } catch (err: any) {
        toast('error', 'Gagal', err.message)
      }
    }
  }

  const handleSimpan = async () => {
    if (!form.email || !form.password) return toast('warning', 'Lengkapi Data', 'Email dan Password wajib diisi.')
    setLoading(true)
    try {
      if (isEdit) {
        // Full Authority Edit
        const { error: userErr } = await supabase.from('users_app').update({ 
          email: form.email, 
          password: form.password,
          role: form.role 
        }).eq('id', editId)
        
        if (userErr) throw userErr

        // Sync with unit if role is sppg and unit exists
        const { data: user } = await supabase.from('users_app').select('sppg_unit_id').eq('id', editId).single()
        if (user?.sppg_unit_id && form.role === 'sppg') {
          await supabase.from('daftar_sppg').update({ 
            nama_unit: form.nama_unit, 
            kepala_unit: form.kepala_unit 
          }).eq('id', user.sppg_unit_id)
        }
        
        toast('success', 'Data Akun Berhasil Diperbarui!')
      } else {
        // Create Logic
        let unitId = null
        if (form.role === 'sppg') {
          const { data: unit, error: unitErr } = await supabase.from('daftar_sppg').insert([{ 
            nama_unit: form.nama_unit || form.email.split('@')[0], 
            kepala_unit: form.kepala_unit || '-' 
          }]).select().single()
          if (unitErr) throw unitErr
          unitId = unit?.id
        }

        const { error: userErr } = await supabase.from('users_app').insert([{ 
          email: form.email, 
          password: form.password, 
          role: form.role, 
          sppg_unit_id: unitId 
        }])
        if (userErr) throw userErr
        
        toast('success', `Akun dengan role ${form.role.toUpperCase()} Berhasil Dibuat!`)
      }
      setForm({ nama_unit: '', kepala_unit: '', email: '', password: '', role: 'sppg' })
      setIsEdit(false)
      fetchData()
    } catch (err: any) { 
      toast('error', 'Gagal', err.message) 
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = (u: any) => {
    setIsEdit(true)
    setEditId(u.id)
    setForm({
      nama_unit: u.daftar_sppg?.nama_unit || '',
      kepala_unit: u.daftar_sppg?.kepala_unit || '',
      email: u.email,
      password: u.password,
      role: u.role
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (userId: string, unitId: string, isPending: boolean) => {
    const result = await Swal.fire({
      title: 'Hapus Akun?',
      text: 'Tindakan ini tidak dapat dibatalkan!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, Hapus!'
    })

    if (result.isConfirmed) {
      try {
        await rejectAccount(userId, unitId)
        Swal.fire({
          title: 'Terhapus!',
          text: 'Akun berhasil dihapus.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        })
        fetchData()
      } catch (err: any) {
        toast('error', 'Gagal', err.message)
      }
    }
  }

  // --- EXCEL FUNCTIONS ---
  const handleDownloadTemplate = () => {
    const template = [
      { 'Nama Unit': 'Unit SPPG Contoh', Email: 'contoh@pasuruan.com', Password: 'pass123' }
    ]
    const ws = XLSX.utils.json_to_sheet(template)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Template SPPG')
    XLSX.writeFile(wb, 'Template_Import_SPPG.xlsx')
    toast('success', 'Berhasil', 'Template berhasil diunduh.')
  }

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsImporting(true)

    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data: any[] = XLSX.utils.sheet_to_json(ws)

        if (data.length === 0) throw new Error('File Excel kosong atau format salah.')

        // 1. Validation
        const errors: string[] = []
        const validData: any[] = []
        
        // Cek duplikat email yang sudah ada di DB
        const { data: existingUsers } = await supabase.from('users_app').select('email')
        const existingEmails = new Set(existingUsers?.map(u => u.email.toLowerCase()) || [])

        data.forEach((row, idx) => {
          const nama = row['Nama Unit']
          const email = row['Email']?.toString().trim().toLowerCase()
          const pass = row['Password']

          if (!nama || !email || !pass) {
            errors.push(`Baris ${idx + 2}: Data tidak lengkap.`)
          } else if (existingEmails.has(email)) {
            errors.push(`Baris ${idx + 2}: Email ${email} sudah terdaftar.`)
          } else {
            validData.push({ nama, email, pass })
          }
        })

        if (errors.length > 0) {
          Swal.fire({
            title: 'Kesalahan Validasi',
            html: `<div class="text-left text-xs max-h-40 overflow-auto">${errors.join('<br>')}</div>`,
            icon: 'error'
          })
          setIsImporting(false)
          return
        }

        // 2. Execution
        const result = await Swal.fire({
          title: 'Konfirmasi Import',
          text: `Akan mengimport ${validData.length} akun SPPG. Lanjutkan?`,
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Ya, Import Sekarang'
        })

        if (result.isConfirmed) {
          setLoading(true)
          for (const item of validData) {
            // Create Unit
            const { data: unit } = await supabase.from('daftar_sppg').insert([{ 
              nama_unit: item.nama, 
              kepala_unit: '-' 
            }]).select().single()

            if (unit) {
              // Create User
              await supabase.from('users_app').insert([{
                email: item.email,
                password: item.pass.toString(),
                role: 'sppg',
                sppg_unit_id: unit.id
              }])
            }
          }
          toast('success', 'Import Berhasil!', `${validData.length} akun telah ditambahkan.`)
          fetchData()
        }
      } catch (err: any) {
        toast('error', 'Gagal Import', err.message)
      } finally {
        setIsImporting(false)
        setLoading(false)
        e.target.value = '' // Reset input
      }
    }
    reader.readAsBinaryString(file)
  }

  return (
    <div className="min-h-screen bg-[#F3F4F9] flex font-sans transition-all duration-300">

      {/* SIDEBAR DENGAN FITUR TOGGLE */}
      <aside className={`bg-[#4F46E5] text-white flex flex-col fixed h-full z-50 shadow-2xl transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className={`flex items-center gap-3 overflow-hidden transition-all ${sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
            <ShieldCheck size={28} className="text-yellow-400 shrink-0" />
            <span className="font-bold text-xl tracking-tight whitespace-nowrap">IT Admin</span>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-white/10 rounded-lg transition-all text-yellow-400">
            {sidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 p-4 mt-4 space-y-2 overflow-hidden">
          <button onClick={() => setActiveTab('members')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'members' ? 'bg-white/20 shadow-lg' : 'hover:bg-white/10'}`}>
            <Users size={20} className="shrink-0" />
            <span className={`transition-all duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 invisible'}`}>Members</span>
          </button>
          <button onClick={() => setActiveTab('monitor')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'monitor' ? 'bg-white/20 shadow-lg' : 'hover:bg-white/10'}`}>
            <BarChart3 size={20} className="shrink-0" />
            <span className={`transition-all duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 invisible'}`}>Monitoring</span>
          </button>

          {/* DEWA SHORTCUT TO KORWIL */}
          <button 
            onClick={() => router.push('/korwil')}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-black text-yellow-300 hover:bg-yellow-500/10 transition-all border border-yellow-500/20 mt-8`}
          >
            <BarChart3 size={20} className="shrink-0" />
            <span className={`transition-all duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 invisible'} uppercase tracking-tighter`}>Dashboard Korwil</span>
          </button>
        </nav>

        <div className="p-4 border-t border-white/10">
          <button onClick={async () => { await fetch('/api/logout', { method: 'POST' }); localStorage.clear(); router.push('/') }} className="w-full flex items-center gap-4 px-4 py-3 text-sm font-semibold text-red-200 hover:bg-red-500/10 rounded-xl transition-all overflow-hidden">
            <LogOut size={20} className="shrink-0" />
            <span className={`transition-all duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 invisible'}`}>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT - MARGIN MENYESUAIKAN SIDEBAR */}
      <main className={`flex-1 transition-all duration-300 p-8 lg:p-12 ${sidebarOpen ? 'pl-72' : 'pl-28'}`}>
        <div className="max-w-7xl mx-auto space-y-8">

          {activeTab === 'members' ? (
            <div className="space-y-8 animate-in fade-in">
              <header className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-slate-800 tracking-tight leading-none uppercase italic">Authority</h1>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-2 italic">Kendali Penuh Seluruh Akun & Sistem</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end gap-1">
                    <button 
                      onClick={handleDownloadTemplate}
                      className="text-[9px] font-black text-indigo-500 uppercase tracking-widest hover:underline"
                    >
                      Unduh Template Excel
                    </button>
                    <label className="cursor-pointer bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2">
                      <Plus size={14} /> Import dari Excel
                      <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImportExcel} disabled={isImporting || loading} />
                    </label>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" placeholder="Cari Email / Unit..." className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-[#4F46E5] w-64 shadow-sm" onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                </div>
              </header>

              {/* FORM UNIFIED */}
              <div className={`rounded-[2.5rem] p-8 border transition-all duration-500 ${isEdit ? 'bg-amber-50 border-amber-200 shadow-xl' : 'bg-white border-slate-100 shadow-sm'}`}>
                <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-6 flex justify-between items-center px-2 italic">
                  <div className="flex items-center gap-3">
                    {isEdit ? <Edit3 size={18} className="text-amber-600" /> : <Plus size={18} className="text-[#4F46E5]" />}
                    {isEdit ? 'Edit Data Operasional SPPG' : 'Buat Akun Baru (Internal)'}
                  </div>
                  {isEdit && <button onClick={() => { setIsEdit(false); setForm({ nama_unit: '', kepala_unit: '', email: '', password: '', role: 'sppg' }) }} className="text-red-500 hover:scale-110 transition-all font-black flex items-center gap-1 text-[9px] uppercase tracking-widest bg-red-50 px-3 py-1 rounded-full border border-red-100">Batal Edit <X size={14} /></button>}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 items-end">
                  <div className="space-y-1 col-span-1 lg:col-span-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase px-1 tracking-widest">Akses (Role)</label>
                    <select 
                      className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:border-[#4F46E5] shadow-sm appearance-none"
                      value={form.role}
                      onChange={e => setForm({ ...form, role: e.target.value })}
                    >
                      <option value="it">IT (ADMIN)</option>
                      <option value="korwil">KORWIL</option>
                      <option value="sppg">SPPG (UNIT)</option>
                    </select>
                  </div>
                  <div className={`space-y-1 ${form.role === 'sppg' ? '' : 'opacity-30 pointer-events-none'}`}>
                    <label className="text-[10px] font-bold text-slate-400 uppercase px-1 tracking-widest">Nama SPPG</label>
                    <div className="relative"><Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input className="w-full pl-10 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:border-[#4F46E5] shadow-sm" placeholder="SPPG..." value={form.nama_unit} onChange={e => setForm({ ...form, nama_unit: e.target.value })} /></div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase px-1 tracking-widest">Email Login</label>
                    <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input className="w-full pl-10 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:border-[#4F46E5] shadow-sm" placeholder="Email..." value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase px-1 tracking-widest">Password</label>
                    <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input type="text" className="w-full pl-10 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:border-[#4F46E5] shadow-sm" placeholder="Pass..." value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
                  </div>
                  <button onClick={handleSimpan} disabled={loading} className={`py-4 px-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-xl transition-all flex items-center justify-center gap-2 ${isEdit ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#4F46E5] hover:bg-[#4338CA]'}`}>
                    {loading ? '...' : isEdit ? 'Simpan Update' : 'Buat Akun'}
                  </button>
                </div>
              </div>

              {/* TABLE */}
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr>
                      <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Informasi Akun</th>
                      <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Akses (Role)</th>
                      <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Password</th>
                      <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700">
                    {dataMaster.filter(u => u.email.toLowerCase().includes(searchTerm.toLowerCase()) || u.daftar_sppg?.nama_unit?.toLowerCase().includes(searchTerm.toLowerCase())).map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-all group">
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm ${u.role === 'it' ? 'bg-yellow-100 text-yellow-600' : u.role === 'korwil' ? 'bg-blue-100 text-blue-600' : 'bg-indigo-50 text-indigo-500'}`}>
                              {u.role === 'it' ? 'A' : u.role === 'korwil' ? 'K' : 'S'}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800 uppercase tracking-tighter italic leading-none">{u.daftar_sppg?.nama_unit || 'STAFF INTERNAL'}</p>
                              <p className="text-[9px] text-slate-400 font-black uppercase mt-1 opacity-70 tracking-widest">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                           <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${u.role === 'it' ? 'bg-yellow-500 text-white' : u.role === 'korwil' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                             {u.role}
                           </span>
                        </td>
                        <td className="p-6 text-center">
                          <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg w-fit mx-auto">
                            <Key size={12} className="text-amber-500" />
                            <span className="text-xs font-mono font-black text-slate-700 tracking-widest">{u.password}</span>
                          </div>
                        </td>
                        <td className="p-6 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleEditClick(u)} className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Edit3 size={16} /></button>
                            <button onClick={() => handleDelete(u.id, u.sppg_unit_id, false)} className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* MONITOR TAB */
            <div className="space-y-8 animate-in slide-in-from-right">
              <header className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-slate-800 tracking-tight leading-none uppercase italic">System Monitor</h1>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-2 italic">Status Pengiriman Laporan Wilayah</p>
                </div>
                <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200 font-black text-[10px] text-[#4F46E5] uppercase shadow-sm tracking-[0.2em]">{tanggal}</div>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-6 group hover:border-[#4F46E5] transition-all">
                  <div className="w-16 h-16 bg-blue-50 text-[#4F46E5] rounded-[1.5rem] flex items-center justify-center font-black text-2xl shadow-inner group-hover:bg-[#4F46E5] group-hover:text-white transition-all">{units.length}</div>
                  <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">Total SPPG</p><p className="text-lg font-black text-slate-800 uppercase italic leading-none">Registered</p></div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-6 group hover:border-emerald-500 transition-all">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-[1.5rem] flex items-center justify-center font-black text-2xl shadow-inner group-hover:bg-emerald-500 group-hover:text-white transition-all">{laporanHarian.length}</div>
                  <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">Success</p><p className="text-lg font-black text-slate-800 uppercase italic leading-none">Masuk</p></div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-6 group hover:border-red-500 transition-all">
                  <div className="w-16 h-16 bg-red-50 text-red-500 rounded-[1.5rem] flex items-center justify-center font-black text-2xl shadow-inner group-hover:bg-red-500 group-hover:text-white transition-all">{units.length - laporanHarian.length}</div>
                  <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">Pending</p><p className="text-lg font-black text-slate-800 uppercase italic leading-none">Belum</p></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}