"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  ShieldCheck, 
  Users, 
  Building2, 
  LogOut, 
  Plus, 
  Trash2, 
  Search,
  LayoutGrid
} from 'lucide-react'

export default function ITDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'users' | 'units'>('users')
  const [users, setUsers] = useState<any[]>([])
  const [units, setUnits] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'sppg', unit_id: '' })
  const [newUnit, setNewUnit] = useState({ nama: '', kepala: '', yayasan: '' })

  const fetchData = async () => {
    const { data: u } = await supabase.from('users_app').select(`*, daftar_sppg(nama_unit)`).order('created_at', { ascending: false })
    const { data: s } = await supabase.from('daftar_sppg').select('*').order('nama_unit')
    if(u) setUsers(u)
    if(s) setUnits(s)
  }

  useEffect(() => { fetchData() }, [])

  const handleCreateUser = async () => {
    if(!newUser.email || !newUser.password) return alert("Lengkapi data!")
    setLoading(true)
    const { error } = await supabase.from('users_app').insert([{
      email: newUser.email, password: newUser.password, role: newUser.role,
      sppg_unit_id: newUser.role === 'sppg' ? newUser.unit_id : null
    }])
    if(!error) { alert("User Berhasil Dibuat"); fetchData(); }
    setLoading(false)
  }

  const handleDelete = async (table: string, id: string) => {
    if(confirm("Yakin ingin menghapus data ini?")) {
      await supabase.from(table).delete().eq('id', id)
      fetchData()
    }
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex font-sans text-slate-800">
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#0F2650] text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <ShieldCheck className="text-yellow-400" />
          <span className="font-black tracking-tighter text-lg uppercase">IT ADMIN</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'users' ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5'}`}>
            <Users size={18} /> MANAJEMEN USER
          </button>
          <button onClick={() => setActiveTab('units')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'units' ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5'}`}>
            <Building2 size={18} /> UNIT LAYANAN
          </button>
        </nav>
        <div className="p-4 border-t border-white/10">
          <button onClick={() => router.push('/')} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-xl">
            <LogOut size={16} /> LOGOUT
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          <header className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl font-black text-[#0F2650] uppercase tracking-tight">
                {activeTab === 'users' ? 'Kontrol Pengguna' : 'Daftar Unit Operasional'}
              </h2>
              <p className="text-xs text-slate-400 font-bold uppercase">Super Admin Console</p>
            </div>
            <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 text-[10px] font-bold text-slate-500">
              Total: {activeTab === 'users' ? users.length : units.length} Data
            </div>
          </header>

          {/* FORM TAMBAH (MODERN CARD) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-xs font-black text-[#0F2650] uppercase mb-4 flex items-center gap-2"><Plus size={14}/> Tambah {activeTab === 'users' ? 'Akun' : 'Unit'} Baru</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {activeTab === 'users' ? (
                <>
                  <input placeholder="Email" className="p-2.5 rounded-lg border border-slate-200 text-xs font-bold outline-none bg-slate-50 focus:bg-white" onChange={e => setNewUser({...newUser, email: e.target.value})} />
                  <input placeholder="Password" title="password" className="p-2.5 rounded-lg border border-slate-200 text-xs font-bold outline-none bg-slate-50 focus:bg-white" onChange={e => setNewUser({...newUser, password: e.target.value})} />
                  <select className="p-2.5 rounded-lg border border-slate-200 text-xs font-bold outline-none bg-slate-50" onChange={e => setNewUser({...newUser, role: e.target.value})}>
                    <option value="sppg">ROLE: KA SPPG</option>
                    <option value="korwil">ROLE: KORWIL</option>
                    <option value="it">ROLE: ADMIN IT</option>
                  </select>
                  {newUser.role === 'sppg' && (
                    <select className="p-2.5 rounded-lg border border-slate-200 text-xs font-bold outline-none bg-slate-50" onChange={e => setNewUser({...newUser, unit_id: e.target.value})}>
                      <option value="">-- Pilih Unit --</option>
                      {units.map(u => <option key={u.id} value={u.id}>{u.nama_unit}</option>)}
                    </select>
                  )}
                </>
              ) : (
                <>
                  <input placeholder="Nama Unit" className="p-2.5 rounded-lg border border-slate-200 text-xs font-bold outline-none bg-slate-50" onChange={e => setNewUnit({...newUnit, nama: e.target.value})} />
                  <input placeholder="Kepala" className="p-2.5 rounded-lg border border-slate-200 text-xs font-bold outline-none bg-slate-50" onChange={e => setNewUnit({...newUnit, kepala: e.target.value})} />
                  <input placeholder="Yayasan" className="p-2.5 rounded-lg border border-slate-200 text-xs font-bold outline-none bg-slate-50" onChange={e => setNewUnit({...newUnit, yayasan: e.target.value})} />
                </>
              )}
              <button onClick={activeTab === 'users' ? handleCreateUser : fetchData} className="bg-[#0F2650] text-white rounded-lg text-xs font-bold uppercase py-2.5 hover:bg-blue-900 transition-all">SIMPAN DATA</button>
            </div>
          </div>

          {/* DATA TABLE (MODERN & CLEAN) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
             <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Detail Informasi</th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status / Role</th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(activeTab === 'users' ? users : units).map((item, i) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-all group">
                      <td className="p-4">
                        <p className="text-xs font-black text-slate-700 uppercase">{activeTab === 'users' ? item.email : item.nama_unit}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{activeTab === 'users' ? (item.daftar_sppg?.nama_unit || 'Akses Global') : item.kepala_unit}</p>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${activeTab === 'users' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {activeTab === 'users' ? item.role : 'AKTIF'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => handleDelete(activeTab === 'users' ? 'users_app' : 'daftar_sppg', item.id)} className="p-2 text-slate-300 hover:text-red-500 transition-all">
                          <Trash2 size={16} />
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