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
  UserCircle
} from 'lucide-react'

export default function UnifiedAdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [dataMaster, setDataMaster] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  
  // State Form Gabungan (Unit + Akun)
  const [form, setForm] = useState({
    nama_unit: '',
    kepala_unit: '',
    email: '',
    password: '',
    role: 'sppg'
  })

  const fetchData = async () => {
    // Mengambil data user sekaligus informasi unit terkait
    const { data } = await supabase
      .from('users_app')
      .select(`*, daftar_sppg(nama_unit, kepala_unit)`)
      .order('created_at', { ascending: false })
    if (data) setDataMaster(data)
  }

  useEffect(() => { fetchData() }, [])

  const handleSimpan = async () => {
    if (!form.nama_unit || !form.email || !form.password) {
      return alert("Mohon lengkapi Nama Unit, Email, dan Kata Sandi!")
    }

    setLoading(true)
    try {
      // 1. Simpan Unit baru ke daftar_sppg
      const { data: unitBaru, error: errUnit } = await supabase
        .from('daftar_sppg')
        .insert([{ 
          nama_unit: form.nama_unit, 
          kepala_unit: form.kepala_unit 
        }])
        .select()
        .single()

      if (errUnit) throw errUnit

      // 2. Hubungkan Unit baru ke Akun User baru di users_app
      const { error: errUser } = await supabase
        .from('users_app')
        .insert([{
          email: form.email,
          password: form.password,
          role: form.role,
          sppg_unit_id: unitBaru.id // Menghubungkan ID unit
        }])

      if (errUser) throw errUser

      alert("✅ Sukses: Unit " + form.nama_unit + " dan Akun Login telah aktif!")
      setForm({ nama_unit: '', kepala_unit: '', email: '', password: '', role: 'sppg' })
      fetchData()
    } catch (err: any) {
      alert("Gagal menyimpan: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (userId: string, unitId: string) => {
    if (confirm("Hapus akun dan unit ini secara permanen?")) {
      await supabase.from('users_app').delete().eq('id', userId)
      if (unitId) await supabase.from('daftar_sppg').delete().eq('id', unitId)
      fetchData()
    }
  }

  return (
    <div className="min-h-screen bg-[#F3F4F9] flex font-sans">
      
      {/* SIDEBAR (Warna Ungu/Biru Tua Elegant) */}
      <aside className="w-64 bg-[#4F46E5] text-white flex flex-col shrink-0">
        <div className="p-8 border-b border-white/10 flex items-center gap-3">
          <ShieldCheck size={28} className="text-yellow-400" />
          <span className="font-bold text-xl tracking-tight">IT Admin</span>
        </div>
        <nav className="flex-1 p-4 mt-4 space-y-2">
          <div className="px-4 py-2 text-[10px] font-bold text-blue-200 uppercase tracking-widest opacity-50">Main Menu</div>
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 rounded-xl text-sm font-semibold">
            <Users size={18} /> Members
          </button>
        </nav>
        <div className="p-6 border-t border-white/10">
          <button onClick={() => router.push('/')} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-200 hover:bg-red-500/10 rounded-xl transition-all">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* CONTENT AREA */}
      <main className="flex-1 p-8 lg:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* HEADER & SEARCH */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div>
                <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Members</h1>
                <p className="text-sm text-slate-400 font-medium">Manajemen Akun Unit Operasional</p>
             </div>
             <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#4F46E5] transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Cari unit atau email..." 
                  className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all w-full md:w-80 shadow-sm"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
          </div>

          {/* FORM GABUNGAN (Unified Registration) */}
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
             <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Plus size={18} className="text-[#4F46E5]" /> Registrasi Unit & Akun Baru
             </h2>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                <div className="space-y-1 lg:col-span-1">
                   <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Nama Unit</label>
                   <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white outline-none transition-all" placeholder="Contoh: SPPG Wonorejo" value={form.nama_unit} onChange={e => setForm({...form, nama_unit: e.target.value})} />
                   </div>
                </div>
                <div className="space-y-1 lg:col-span-1">
                   <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Kepala Unit</label>
                   <div className="relative">
                      <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white outline-none transition-all" placeholder="Nama Lengkap" value={form.kepala_unit} onChange={e => setForm({...form, kepala_unit: e.target.value})} />
                   </div>
                </div>
                <div className="space-y-1 lg:col-span-1">
                   <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Email Login</label>
                   <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white outline-none transition-all" placeholder="user@mbg.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                   </div>
                </div>
                <div className="space-y-1 lg:col-span-1">
                   <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Password</label>
                   <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input type="password" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white outline-none transition-all" placeholder="Minimal 6 karakter" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                   </div>
                </div>
                <button onClick={handleSimpan} disabled={loading} className="bg-[#4F46E5] text-white py-3.5 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#4338CA] shadow-lg shadow-[#4F46E5]/20 transition-all flex items-center justify-center gap-2">
                   {loading ? '...' : <><Plus size={16}/> Add New</>}
                </button>
             </div>
          </div>

          {/* TABLE DATA (Mirip Referensi image_bb7747.jpg) */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
             <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                   <tr>
                      <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unit Name & Kepala</th>
                      <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</th>
                      <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                      <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Operation</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {dataMaster.filter(u => u.email.includes(searchTerm) || u.daftar_sppg?.nama_unit.toLowerCase().includes(searchTerm.toLowerCase())).map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/30 transition-all">
                         <td className="p-6">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 bg-blue-50 text-[#4F46E5] rounded-xl flex items-center justify-center font-bold text-sm">
                                  {user.daftar_sppg?.nama_unit.charAt(0).toUpperCase()}
                               </div>
                               <div>
                                  <p className="text-sm font-bold text-slate-700">{user.daftar_sppg?.nama_unit || 'Akses Global'}</p>
                                  <p className="text-[10px] text-slate-400 font-medium uppercase">{user.daftar_sppg?.kepala_unit || 'Super Admin'}</p>
                               </div>
                            </div>
                         </td>
                         <td className="p-6 text-sm font-medium text-slate-500">{user.email}</td>
                         <td className="p-6">
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-bold rounded-full uppercase tracking-tighter">Active</span>
                         </td>
                         <td className="p-6 text-right">
                            <button 
                              onClick={() => handleDelete(user.id, user.sppg_unit_id)}
                              className="p-2 text-slate-300 hover:text-red-500 transition-all"
                            >
                               <Trash2 size={18} />
                            </button>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
        </div>
      </main>
    </div>
  )
}