"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  Plus, 
  Trash2, 
  LogOut, 
  Search, 
  ShieldCheck, 
  Building2,
  Mail,
  Lock,
  UserCircle,
  BarChart3,
  Edit3,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

export default function SuperAdminITPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'members' | 'monitor'>('members')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Data State
  const [dataMaster, setDataMaster] = useState<any[]>([])
  const [units, setUnits] = useState<any[]>([])
  const [laporanHarian, setLaporanHarian] = useState<any[]>([])
  const [tanggal] = useState(new Date().toISOString().split('T')[0])

  // Form State
  const [isEdit, setIsEdit] = useState(false)
  const [editId, setEditId] = useState('')
  const [form, setForm] = useState({
    nama_unit: '', kepala_unit: '', email: '', password: '', role: 'sppg'
  })

  const fetchData = async () => {
    // Load Members & Units
    const { data: usr } = await supabase.from('users_app').select(`*, daftar_sppg(nama_unit, kepala_unit)`).order('created_at', { ascending: false })
    const { data: unt } = await supabase.from('daftar_sppg').select('*')
    const { data: lap } = await supabase.from('laporan_harian_final').select('*').eq('tanggal_ops', tanggal)
    
    if (usr) setDataMaster(usr)
    if (unt) setUnits(unt)
    if (lap) setLaporanHarian(lap)
  }

  useEffect(() => { fetchData() }, [])

  const handleSimpan = async () => {
    if (!form.nama_unit || !form.email) return alert("Lengkapi data!")
    setLoading(true)
    try {
      if (isEdit) {
        // Logika Update
        const { data: user } = await supabase.from('users_app').select('sppg_unit_id').eq('id', editId).single()
        await supabase.from('users_app').update({ email: form.email, password: form.password }).eq('id', editId)
        if (user?.sppg_unit_id) {
          await supabase.from('daftar_sppg').update({ nama_unit: form.nama_unit, kepala_unit: form.kepala_unit }).eq('id', user.sppg_unit_id)
        }
        alert("✅ Data Berhasil Diperbarui!")
      } else {
        // Logika Tambah Baru
        const { data: unit } = await supabase.from('daftar_sppg').insert([{ nama_unit: form.nama_unit, kepala_unit: form.kepala_unit }]).select().single()
        if (unit) {
          await supabase.from('users_app').insert([{ email: form.email, password: form.password, role: form.role, sppg_unit_id: unit.id }])
        }
        alert("✅ Unit & Akun Berhasil Dibuat!")
      }
      setForm({ nama_unit: '', kepala_unit: '', email: '', password: '', role: 'sppg' })
      setIsEdit(false)
      fetchData()
    } catch (err: any) { alert(err.message) }
    setLoading(false)
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

  const handleDelete = async (userId: string, unitId: string) => {
    if (confirm("Hapus akun ini permanen?")) {
      await supabase.from('users_app').delete().eq('id', userId)
      if (unitId) await supabase.from('daftar_sppg').delete().eq('id', unitId)
      fetchData()
    }
  }

  return (
    <div className="min-h-screen bg-[#F3F4F9] flex font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#4F46E5] text-white flex flex-col shrink-0 fixed h-full z-50">
        <div className="p-8 border-b border-white/10 flex items-center gap-3">
          <ShieldCheck size={28} className="text-yellow-400" />
          <span className="font-bold text-xl tracking-tight">IT Admin</span>
        </div>
        <nav className="flex-1 p-4 mt-4 space-y-2">
          <button onClick={() => setActiveTab('members')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'members' ? 'bg-white/20 shadow-lg' : 'hover:bg-white/10'}`}>
            <Users size={18} /> Members
          </button>
          <button onClick={() => setActiveTab('monitor')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'monitor' ? 'bg-white/20 shadow-lg' : 'hover:bg-white/10'}`}>
            <BarChart3 size={18} /> Monitoring
          </button>
        </nav>
        <div className="p-6">
          <button onClick={() => router.push('/')} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-200 hover:bg-red-500/10 rounded-xl transition-all">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 pl-64 p-8 lg:p-12">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {activeTab === 'members' ? (
            /* === TAB MEMBERS === */
            <div className="space-y-8 animate-in fade-in">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Management</h1>
                  <p className="text-sm text-slate-400 font-medium italic">Kendali Akun SPPG & Wilayah</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="text" placeholder="Cari unit..." className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:border-[#4F46E5] w-64 shadow-sm" onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </div>

              {/* FORM UNIFIED (DIPERBAIKI: Text Hitam & Edit Mode) */}
              <div className={`rounded-[2rem] p-8 border transition-all duration-500 ${isEdit ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-slate-100 shadow-sm'}`}>
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-6 flex justify-between items-center">
                   <div className="flex items-center gap-2">
                     {isEdit ? <Edit3 size={18} className="text-yellow-600" /> : <Plus size={18} className="text-[#4F46E5]" />}
                     {isEdit ? 'Edit Akun Unit' : 'Registrasi Unit & Akun Baru'}
                   </div>
                   {isEdit && <button onClick={() => { setIsEdit(false); setForm({nama_unit:'', kepala_unit:'', email:'', password:'', role:'sppg'}) }} className="text-red-500"><X size={18}/></button>}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                  <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase px-1">Nama Unit</label>
                    <div className="relative"><Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#4F46E5]" placeholder="SPPG..." value={form.nama_unit} onChange={e => setForm({...form, nama_unit: e.target.value})} /></div>
                  </div>
                  <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase px-1">Kepala Unit</label>
                    <div className="relative"><UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#4F46E5]" placeholder="Nama..." value={form.kepala_unit} onChange={e => setForm({...form, kepala_unit: e.target.value})} /></div>
                  </div>
                  <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase px-1">Email</label>
                    <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#4F46E5]" placeholder="Email..." value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
                  </div>
                  <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase px-1">Password</label>
                    <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input type="password" className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#4F46E5]" placeholder="Pass..." value={form.password} onChange={e => setForm({...form, password: e.target.value})} /></div>
                  </div>
                  <button onClick={handleSimpan} disabled={loading} className={`py-3.5 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg transition-all flex items-center justify-center gap-2 ${isEdit ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-[#4F46E5] hover:bg-[#4338CA]'}`}>
                    {loading ? '...' : isEdit ? 'Update Data' : 'Add Member'}
                  </button>
                </div>
              </div>

              {/* TABLE */}
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr>
                      <th className="p-6 text-[10px] font-bold text-slate-400 uppercase">Unit & Kepala</th>
                      <th className="p-6 text-[10px] font-bold text-slate-400 uppercase">Email Login</th>
                      <th className="p-6 text-[10px] font-bold text-slate-400 uppercase text-right">Operation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700">
                    {dataMaster.filter(u => u.daftar_sppg?.nama_unit.toLowerCase().includes(searchTerm.toLowerCase())).map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-all">
                        <td className="p-6">
                          <p className="text-sm font-bold">{u.daftar_sppg?.nama_unit || 'ADMIN AKSES'}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{u.daftar_sppg?.kepala_unit || 'Super User'}</p>
                        </td>
                        <td className="p-6 text-sm font-medium">{u.email}</td>
                        <td className="p-6 text-right flex justify-end gap-2">
                          <button onClick={() => handleEditClick(u)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"><Edit3 size={16}/></button>
                          <button onClick={() => handleDelete(u.id, u.sppg_unit_id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* === TAB MONITORING (MIRIP KORWIL) === */
            <div className="space-y-8 animate-in slide-in-from-right">
              <header className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-slate-800 tracking-tight">System Monitor</h1>
                  <p className="text-sm text-slate-400 font-medium">Status Pengiriman Laporan Wilayah</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 font-bold text-xs text-[#4F46E5] uppercase">{tanggal}</div>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-6">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-[#4F46E5] font-bold text-2xl">{units.length}</div>
                  <div><p className="text-[10px] font-bold text-slate-400 uppercase">Total Unit</p><p className="text-lg font-bold text-slate-800 uppercase italic">Registered</p></div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-6">
                  <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 font-bold text-2xl">{laporanHarian.length}</div>
                  <div><p className="text-[10px] font-bold text-slate-400 uppercase">Success</p><p className="text-lg font-bold text-slate-800 uppercase italic">Laporan Masuk</p></div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-6">
                  <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 font-bold text-2xl">{units.length - laporanHarian.length}</div>
                  <div><p className="text-[10px] font-bold text-slate-400 uppercase">Pending</p><p className="text-lg font-bold text-slate-800 uppercase italic">Belum Kirim</p></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest flex items-center gap-2"><AlertCircle size={16}/> Warning: Belum Lapor</h3>
                  <div className="space-y-2">
                    {units.filter(u => !laporanHarian.find(l => l.unit_id === u.id)).map(u => (
                      <div key={u.id} className="p-4 bg-red-50/50 border border-red-100 rounded-xl flex justify-between items-center">
                         <span className="text-xs font-bold text-slate-700 uppercase">{u.nama_unit}</span>
                         <span className="text-[8px] font-black bg-red-500 text-white px-2 py-1 rounded-full uppercase tracking-tighter">Action Required</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2"><CheckCircle2 size={16}/> Success: Sudah Lapor</h3>
                  <div className="space-y-2">
                    {laporanHarian.map(l => (
                      <div key={l.id} className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl flex justify-between items-center">
                         <span className="text-xs font-bold text-slate-700 uppercase">{l.nama_unit}</span>
                         <span className="text-[8px] font-bold text-emerald-600 italic truncate max-w-[100px]">{l.menu_makanan}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}