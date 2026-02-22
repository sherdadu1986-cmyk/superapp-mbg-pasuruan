"use client"
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Lock, Mail, ArrowRight, UserPlus, User } from 'lucide-react'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)

    try {
      // 1. Ambil data user
      const { data: user, error } = await supabase
        .from('users_app')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single()

      if (error || !user) {
        alert("❌ Email atau Password salah!")
        setLoading(false)
        return
      }

      if (user.role === 'pending') {
        alert("⚠️ Akun Anda sedang dalam verifikasi.")
        setLoading(false)
        return
      }

      // 2. Simpan session
      localStorage.clear()
      localStorage.setItem('user_role', user.role)
      localStorage.setItem('unit_id', user.sppg_unit_id)

      // 3. PENGARAHAN SESUAI DATABASE ANDA
      // Kita ganti 'admin' menjadi 'it' sesuai isi tabel anda
      if (user.role === 'it') { 
        router.push('/it') 
      } else if (user.role === 'korwil') {
        router.push('/korwil')
      } else if (user.role === 'sppg') {
        router.push(`/sppg/dashboard/${user.sppg_unit_id}`)
      }

    } catch (err) {
      alert("Terjadi kesalahan sistem")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row font-sans overflow-hidden">
      
      {/* SISI KIRI */}
      <div className="md:w-1/2 bg-[#0F2650] flex flex-col items-center justify-center p-12 text-center text-white relative">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 space-y-8 max-w-lg">
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl inline-block border border-white/20 mb-4 shadow-2xl">
            <Image src="/logo.png" alt="Logo" width={140} height={140} className="object-contain" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight">
            Sistem Manajemen <br/> 
            <span className="bg-yellow-400 text-[#0F2650] px-3 py-1 rounded-xl">Operasional SPPG</span> <br/>
            Kab. Pasuruan
          </h1>
        </motion.div>
      </div>

      {/* SISI KANAN */}
      <div className="md:w-1/2 flex flex-col items-center justify-center p-8 md:p-24 bg-white">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md space-y-10">
          <div className="text-center md:text-left">
             <h2 className="text-4xl font-black text-[#0F2650] tracking-tight mb-2 uppercase italic">Silakan Login</h2>
             <p className="text-sm text-slate-400 font-medium tracking-wide">Masuk menggunakan akun {email.includes('admin') ? 'IT Admin' : 'SPPG'}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Email / Akun</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input required type="email" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all" placeholder="admin@mbg.com" onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Kata Sandi</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input required type="password" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all" placeholder="••••••••" onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>

            <button disabled={loading} className="w-full py-5 bg-[#0F2650] text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-[#1a3a70] transition-all flex items-center justify-center gap-3">
              {loading ? 'MEMPROSES...' : <>MASUK SISTEM <ArrowRight size={18} /></>}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}