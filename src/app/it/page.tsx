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
  Key,
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
    // Load Members & SPPG Units
    const { data: usr } = await supabase.from('users_app').select(`*, daftar_sppg(nama_unit, kepala_unit)`).order('created_at', { ascending: false })
    const { data: unt } = await supabase.from('daftar_sppg').select('*')
    const { data: lap } = await supabase.from('laporan_harian_final').select('*').eq('tanggal_ops', tanggal)
    
    if (usr) setDataMaster(usr)
    if (unt) setUnits(unt)
    if (lap) setLaporanHarian(lap)
  }

  useEffect(() => { fetchData() }, [])

  // FITUR APPROVE AKUN MANDIRI
  const handleApprove = async (id: string) => {
    const { error } = await supabase.from('users_app').update({ role: 'sppg' }).eq('id', id)
    if (!error) {
      alert("✅ Akun SPPG Telah Diaktifkan! Sekarang mereka bisa mulai mengirim laporan.")
      fetchData()
    }
  }

  const handleSimpan = async () => {
    if (!form.nama_unit || !form.email) return alert("Lengkapi data!")
    setLoading(true)
    try {
      if (isEdit) {
        const { data: user } = await supabase.from('users_app').select('sppg_unit_id').eq('id', editId).single()
        await supabase.from('users_app').update({ email: form.email, password: form.password }).eq('id', editId)
        if (user?.sppg_unit_id) {
          await supabase.from('daftar_sppg').update({ nama_unit: form.nama_unit, kepala_unit: form.kepala_unit }).eq('id', user.sppg_unit_id)
        }
        alert("✅ Data Berhasil Diperbarui!")
      } else {
        const { data: unit } = await supabase.from('daftar_sppg').insert([{ nama_unit: form.nama_unit, kepala_unit: form.kepala_unit }]).select().single()
        if (unit) {
          await supabase.from('users_app').insert([{ email: form.email, password: form.password, role: form.role, sppg_unit_id: unit.id }])
        }
        alert("✅ SPPG & Akun Berhasil Dibuat!")
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
    if (confirm("Hapus akun SPPG ini secara permanen?")) {
      await supabase.from('users_app').delete().eq('id', userId)
      if (unitId) await supabase.from('daftar_sppg').delete().eq('id', unitId)
      fetchData()
    }
  }

  return (
    <div className="min-h-screen bg-[#F3F4F9] flex font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#4F46E5] text-white flex flex-col shrink-0 fixed h-full z-50 shadow-2xl">
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
          <button onClick={() => router.push('/')} className="w-full flex items-center gap-4 px-4 py-3 text-sm font-semibold text-red-200 hover:bg-red-500/10 rounded-xl transition-all">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 pl-64 p-8 lg:p-12">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {activeTab === 'members' ? (
            <div className="space-y-8 animate-in fade-in">
              <header className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Management</h1>
                  <p className="text-sm text-slate-400 font-medium italic">Kendali Akun SPPG & Wilayah</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="text" placeholder="Cari SPPG..." className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:border-[#4F46E5] w-64 shadow-sm" onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </header>

              {/* FORM UNIFIED */}
              <div className={`rounded-[2.5rem] p-8 border transition-all duration-500 ${isEdit ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100 shadow-sm'}`}>
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-6 flex justify-between items-center px-2">
                   <div className="flex items-center gap-2">
                     {isEdit ? <Edit3 size={18} className="text-amber-600" /> : <Plus size={18} className="text-[#4F46E5]" />}
                     {isEdit ? 'Edit Akun SPPG' : 'Registrasi SPPG & Akun Baru'}
                   </div>
                   {isEdit && <button onClick={() => { setIsEdit(false); setForm({nama_unit:'', kepala_unit:'', email:'', password:'', role:'sppg'}) }} className="text-red-500"><X size={18}/></button>}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                  <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase px-1 tracking-widest">Nama SPPG</label>
                    <div className="relative"><Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input className="w-full pl-10 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#4F46E5]" placeholder="SPPG..." value={form.nama_unit} onChange={e => setForm({...form, nama_unit: e.target.value})} /></div>
                  </div>
                  <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase px-1 tracking-widest">Kepala SPPG</label>
                    <div className="relative"><UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input className="w-full pl-10 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#4F46E5]" placeholder="Nama..." value={form.kepala_unit} onChange={e => setForm({...form, kepala_unit: e.target.value})} /></div>
                  </div>
                  <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase px-1 tracking-widest">Email</label>
                    <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input className="w-full pl-10 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#4F46E5]" placeholder="Email..." value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
                  </div>
                  <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase px-1 tracking-widest">Password</label>
                    <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input type="text" className="w-full pl-10 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#4F46E5]" placeholder="Pass..." value={form.password} onChange={e => setForm({...form, password: e.target.value})} /></div>
                  </div>
                  <button onClick={handleSimpan} disabled={loading} className={`py-4 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-xl transition-all flex items-center justify-center gap-2 ${isEdit ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#4F46E5] hover:bg-[#4338CA]'}`}>
                    {loading ? '...' : isEdit ? 'Update Data' : 'Add Member'}
                  </button>
                </div>
              </div>

              {/* TABLE WITH PASSWORD & APPROVE FEATURE */}
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr>
                      <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">SPPG & Kepala</th>
                      <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Login</th>
                      <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Password</th>
                      <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Operation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700">
                    {dataMaster.filter(u => u.daftar_sppg?.nama_unit.toLowerCase().includes(searchTerm.toLowerCase())).map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-all group">
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm ${u.role === 'pending' ? 'bg-rose-50 text-rose-500' : 'bg-indigo-50 text-indigo-500'}`}>
                              {u.daftar_sppg?.nama_unit?.charAt(0) || 'S'}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{u.daftar_sppg?.nama_unit || 'ADMIN AKSES'}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{u.daftar_sppg?.kepala_unit || 'Super User'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-6 text-sm font-medium text-slate-600">{u.email}</td>
                        {/* PASSWORD COLUMN */}
                        <td className="p-6 text-center">
                           <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg w-fit mx-auto">
                              <Key size={12} className="text-amber-500" />
                              <span className="text-xs font-mono font-bold text-slate-700 tracking-wider">{u.password}</span>
                           </div>
                        </td>
                        <td className="p-6 text-right">
                          <div className="flex justify-end gap-2">
                            {/* APPROVE BUTTON */}
                            {u.role === 'pending' ? (
                              <button 
                                onClick={() => handleApprove(u.id)} 
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white text-[9px] font-black rounded-xl uppercase tracking-widest shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-all"
                              >
                                <CheckCircle2 size={14}/> Aktifkan SPPG
                              </button>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button onClick={() => handleEditClick(u)} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Edit3 size={16}/></button>
                                <button onClick={() => handleDelete(u.id, u.sppg_unit_id)} className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"><Trash2 size={16}/></button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-right">
              <header className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-slate-800 tracking-tight">System Monitor</h1>
                  <p className="text-sm text-slate-400 font-medium italic italic">Status Pengiriman Laporan Wilayah</p>
                </div>
                <div className="bg-white px-5 py-2.5 rounded-2xl border border-slate-200 font-bold text-xs text-[#4F46E5] uppercase shadow-sm tracking-widest">{tanggal}</div>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-6 group hover:border-[#4F46E5] transition-all">
                  <div className="w-16 h-16 bg-blue-50 text-[#4F46E5] rounded-[1.5rem] flex items-center justify-center font-bold text-2xl shadow-inner group-hover:bg-[#4F46E5] group-hover:text-white transition-all">{units.length}</div>
                  <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total SPPG</p><p className="text-lg font-bold text-slate-800 uppercase italic">Registered</p></div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-6 group hover:border-emerald-500 transition-all">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-[1.5rem] flex items-center justify-center font-bold text-2xl shadow-inner group-hover:bg-emerald-500 group-hover:text-white transition-all">{laporanHarian.length}</div>
                  <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Success</p><p className="text-lg font-bold text-slate-800 uppercase italic">Laporan Masuk</p></div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-6 group hover:border-red-500 transition-all">
                  <div className="w-16 h-16 bg-red-50 text-red-500 rounded-[1.5rem] flex items-center justify-center font-bold text-2xl shadow-inner group-hover:bg-red-500 group-hover:text-white transition-all">{units.length - laporanHarian.length}</div>
                  <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending</p><p className="text-lg font-bold text-slate-800 uppercase italic">Belum Kirim</p></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}