"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  PlusCircle, 
  Trash2, 
  ShieldCheck, 
  Server, 
  UserPlus,
  RefreshCcw,
  LayoutDashboard
} from 'lucide-react'

export default function ITAdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [units, setUnits] = useState<any[]>([])
  
  // State Form Gabungan
  const [form, setForm] = useState({
    nama_unit: '',
    kepala_unit: '',
    email: '',
    password: '',
    role: 'sppg' // Default role
  })

  const fetchData = async () => {
    const { data } = await supabase.from('daftar_sppg').select('*').order('nama_unit')
    if (data) setUnits(data)
  }

  useEffect(() => { fetchData() }, [])

  // FUNGSI GABUNGAN: TAMBAH UNIT + BUAT AKUN
  const handleSimpanDataMaster = async () => {
    // Validasi Sederhana
    if (!form.nama_unit || !form.email || !form.password) {
      return alert("Mohon lengkapi Nama Unit, Email, dan Password!")
    }

    setLoading(true)
    try {
      // 1. Simpan ke Tabel daftar_sppg
      const { data: unitBaru, error: errUnit } = await supabase
        .from('daftar_sppg')
        .insert([{ 
          nama_unit: form.nama_unit, 
          kepala_unit: form.kepala_unit 
        }])
        .select()
        .single()

      if (errUnit) throw errUnit

      // 2. Simpan ke Tabel users_app (Gunakan ID Unit yang baru dibuat)
      const { error: errUser } = await supabase
        .from('users_app')
        .insert([{
          email: form.email,
          password: form.password,
          role: form.role,
          unit_id: unitBaru.id
        }])

      if (errUser) throw errUser

      alert("✅ BERHASIL: Unit & Akun Login telah aktif!")
      setForm({ nama_unit: '', kepala_unit: '', email: '', password: '', role: 'sppg' })
      fetchData()
    } catch (error: any) {
      alert("Terjadi Kesalahan: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUnit = async (id: string) => {
    if (confirm("Hapus Unit ini? Akun terkait juga akan bermasalah.")) {
      await supabase.from('daftar_sppg').delete().eq('id', id)
      fetchData()
    }
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] p-4 lg:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#0F2650] text-white rounded-2xl">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-[#0F2650] uppercase italic tracking-tighter">IT Infrastructure</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">Management System</p>
            </div>
          </div>
          <button onClick={() => router.push('/')} className="text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest flex items-center gap-2">
            Logout <RefreshCcw size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* FORM GABUNGAN (KIRI) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
              <h3 className="text-xs font-black text-[#0F2650] uppercase tracking-widest mb-6 flex items-center gap-2">
                <PlusCircle size={18} className="text-blue-500" /> Registrasi Unit Baru
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Informasi Unit</label>
                  <input 
                    className="w-full p-3 mt-1 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#0F2650]" 
                    placeholder="Nama Unit (Contoh: SPPG Pandaan)"
                    value={form.nama_unit}
                    onChange={e => setForm({...form, nama_unit: e.target.value})}
                  />
                  <input 
                    className="w-full p-3 mt-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#0F2650]" 
                    placeholder="Nama Kepala Unit"
                    value={form.kepala_unit}
                    onChange={e => setForm({...form, kepala_unit: e.target.value})}
                  />
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Kredensial Login</label>
                  <input 
                    className="w-full p-3 mt-1 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#0F2650]" 
                    placeholder="Email Login"
                    value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})}
                  />
                  <input 
                    type="password"
                    className="w-full p-3 mt-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#0F2650]" 
                    placeholder="Password"
                    value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})}
                  />
                  <select 
                    className="w-full p-3 mt-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase outline-none focus:border-[#0F2650]"
                    value={form.role}
                    onChange={e => setForm({...form, role: e.target.value})}
                  >
                    <option value="sppg">Akses SPPG (Unit)</option>
                    <option value="korwil">Akses Korwil (Wilayah)</option>
                    <option value="it">Akses IT (Admin)</option>
                  </select>
                </div>

                <button 
                  onClick={handleSimpanDataMaster}
                  disabled={loading}
                  className="w-full py-4 bg-[#0F2650] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? 'Memproses...' : 'Aktifkan Unit & Akun'}
                </button>
              </div>
            </div>
          </div>

          {/* DAFTAR UNIT TERDAFTAR (KANAN) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-xs font-black text-[#0F2650] uppercase tracking-widest flex items-center gap-2">
                  <Server size={18} className="text-emerald-500" /> Database Unit Aktif
                </h3>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-600 text-[9px] font-black rounded-full">
                  {units.length} TOTAL
                </span>
              </div>
              
              <div className="divide-y divide-slate-50">
                {units.length > 0 ? units.map((u) => (
                  <div key={u.id} className="p-5 flex justify-between items-center hover:bg-slate-50 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-[#0F2650] text-xs">
                        {u.nama_unit.substring(0,2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-700 uppercase">{u.nama_unit}</h4>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{u.kepala_unit || 'Tanpa Kepala Unit'}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteUnit(u.id)}
                      className="p-2 text-slate-200 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )) : (
                  <div className="p-20 text-center">
                    <p className="text-xs text-slate-300 font-black uppercase tracking-widest">Belum ada unit terdaftar</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}