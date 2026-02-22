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
  const [rememberMe, setRememberMe] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)

    try {
      // Menggunakan query aman yang tadi berhasil tembus error 406
      const { data: user, error } = await supabase
        .from('users_app')
        .select('*')
        .eq('email', email.trim())
        .eq('password', password.trim())
        .maybeSingle()

      if (error || !user) {
        alert("❌ Email atau Password salah!")
      } else {
        if (user.role === 'pending') {
          alert("⚠️ Akun Anda sedang dalam verifikasi Admin.")
          setLoading(false)
          return
        }

        // Simpan Session
        localStorage.clear()
        localStorage.setItem('user_role', user.role)
        localStorage.setItem('unit_id', user.sppg_unit_id)

        // LOGIKA NAVIGASI (ROLE "it" SESUAI DATABASE)
        if (user.role === 'it') {
          router.push('/it') 
        } else if (user.role === 'korwil') {
          router.push('/korwil')
        } else if (user.role === 'sppg') {
          router.push(`/sppg/dashboard/${user.sppg_unit_id}`)
        }
      }
    } catch (err) {
      alert("Terjadi kesalahan sistem")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row font-sans overflow-hidden">
      
      {/* SISI KIRI: BRANDING (DARK BLUE) */}
      <div className="md:w-1/2 bg-[#0F2650] flex flex-col items-center justify-center p-12 text-center text-white relative">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 space-y-8 max-w-lg"
        >
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl inline-block border border-white/20 mb-4 shadow-2xl">
            <Image src="/logo.png" alt="Logo" width={140} height={140} className="object-contain" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight uppercase italic">
              Operasional <span className="text-yellow-400">SPPG</span> <br/>
              Kab. Pasuruan
            </h1>
            <p className="text-sm text-indigo-200 font-medium leading-relaxed opacity-80">
              Platform terintegrasi untuk pemantauan distribusi gizi wilayah Kabupaten Pasuruan.
            </p>
          </div>
        </motion.div>
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white rounded-full blur-[120px]"></div>
        </div>
      </div>

      {/* SISI KANAN: LOGIN FORM */}
      <div className="md:w-1/2 flex flex-col items-center justify-center p-8 md:p-24 bg-white relative">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md space-y-10"
        >
          <div className="text-center md:text-left">
             <h2 className="text-4xl font-black text-[#0F2650] tracking-tight mb-2 uppercase italic">Silakan Login</h2>
             <p className="text-sm text-slate-400 font-medium tracking-wide">Masuk untuk mengakses dashboard operasional</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Email / Akun</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={20} />
                <input required type="email" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all" placeholder="admin@mbg.com" onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Kata Sandi</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={20} />
                <input required type="password" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all" placeholder="••••••••" onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>

            <button disabled={loading} className="w-full py-5 bg-[#0F2650] text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-[#1a3a70] transition-all flex items-center justify-center gap-3 mt-4">
              {loading ? 'MEMPROSES...' : <>MASUK SISTEM <ArrowRight size={18} /></>}
            </button>
          </form>

          <div className="pt-8 border-t border-slate-50 flex flex-col items-center gap-4 text-center">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Belum Terdaftar?</p>
             <button onClick={() => router.push('/register')} className="flex items-center gap-2 text-xs font-black text-indigo-600 hover:text-indigo-800 transition-all uppercase tracking-widest">
                <UserPlus size={18} /> Daftar Akun SPPG Sekarang
             </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}