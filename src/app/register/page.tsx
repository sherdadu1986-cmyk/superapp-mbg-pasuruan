"use client"
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { UserPlus, Building2, Mail, Lock, ArrowLeft, UserCircle } from 'lucide-react'

export default function RegisterUnitPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nama_unit: '',
    kepala_unit: '',
    email: '',
    password: ''
  })

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // 1. Buat data di daftar_sppg
      const { data: unit, error: unitErr } = await supabase
        .from('daftar_sppg')
        .insert([{ 
          nama_unit: form.nama_unit, 
          kepala_unit: form.kepala_unit 
        }])
        .select().single()

      if (unitErr) throw unitErr

      if (unit) {
        // 2. Buat akun di users_app dengan role 'pending'
        const { error: userErr } = await supabase.from('users_app').insert([{
          email: form.email,
          password: form.password,
          role: 'pending', // KUNCI: Status pending agar tidak bisa login langsung
          sppg_unit_id: unit.id
        }])
        
        if (userErr) throw userErr

        alert("✅ Pendaftaran Berhasil! Akun Anda sedang diverifikasi oleh IT Admin. Mohon tunggu aktivasi.")
        router.push('/')
      }
    } catch (err: any) {
      alert("Error: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F3F4F9] flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-[3rem] p-10 shadow-2xl border border-slate-100 relative overflow-hidden">
        <button onClick={() => router.push('/')} className="mb-8 flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-indigo-600 transition-colors">
          <ArrowLeft size={16}/> Kembali ke Login
        </button>
        
        <div className="mb-10">
          <h1 className="text-3xl font-black text-[#0F2650] uppercase italic tracking-tighter leading-none">Registrasi Unit</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Pendaftaran Mandiri Akun SPPG</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5 relative z-10">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Nama Unit SPPG</label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
              <input required className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="Contoh: SPPG Wonorejo" onChange={e => setForm({...form, nama_unit: e.target.value})}/>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Nama Kepala Unit</label>
            <div className="relative">
              <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
              <input required className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="Nama Lengkap & Gelar" onChange={e => setForm({...form, kepala_unit: e.target.value})}/>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Email Login</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
              <input required type="email" className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="unit@mbg.com" onChange={e => setForm({...form, email: e.target.value})}/>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Buat Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
              <input required type="text" className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="Masukkan Password" onChange={e => setForm({...form, password: e.target.value})}/>
            </div>
          </div>

          <button disabled={loading} className="w-full py-5 bg-[#6366F1] text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-indigo-200 mt-6 hover:bg-[#4F46E5] transition-all flex items-center justify-center gap-3">
            {loading ? 'SISTEM MEMPROSES...' : <><UserPlus size={18}/> Kirim Pendaftaran</>}
          </button>
        </form>
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      </div>
    </div>
  )
}