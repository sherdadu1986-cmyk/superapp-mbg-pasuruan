"use client"
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Lock, Mail, ArrowRight, UserPlus, Sparkles } from 'lucide-react'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: user, error } = await supabase
        .from('users_app')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single()

      if (error || !user) {
        alert("Email atau Password salah!")
      } else {
        if (user.role === 'pending') {
          alert("⚠️ Akun Anda masih dalam proses verifikasi oleh IT Admin.")
          setLoading(false)
          return
        }
        localStorage.setItem('user_role', user.role)
        localStorage.setItem('unit_id', user.sppg_unit_id)

        if (user.role === 'admin') router.push('/it')
        else if (user.role === 'korwil') router.push('/korwil')
        else router.push('/sppg')
      }
    } catch (err) {
      alert("Terjadi kesalahan sistem")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F3F4F9] flex items-center justify-center p-6 font-sans overflow-hidden relative">
      
      {/* ANIMASI BACKGROUND */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
        transition={{ duration: 20, repeat: Infinity }}
        className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"
      />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-md w-full bg-white rounded-[3.5rem] p-10 lg:p-14 shadow-2xl border border-white/50 relative z-10"
      >
        
        {/* LOGO RESMI & JUDUL BARU */}
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, delay: 0.2 }}
            className="w-24 h-24 mx-auto mb-6 relative"
          >
            {/* Mengganti Shield dengan Logo PNG */}
            <Image 
              src="/logo.png" 
              alt="Logo Kabupaten Pasuruan" 
              width={100} 
              height={100}
              className="object-contain"
            />
          </motion.div>
          <h1 className="text-2xl font-black text-[#0F2650] uppercase italic tracking-tighter leading-tight">
            SUPER APP
          </h1>
          <p className="text-[11px] text-indigo-500 font-black uppercase tracking-[0.3em] mt-1 flex items-center justify-center gap-2">
            <Sparkles size={12} /> KABUPATEN PASURUAN <Sparkles size={12} />
          </p>
        </div>

        {/* LOGIN FORM */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Email Access</label>
            <div className="relative group">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500" size={20} />
              <input 
                required 
                type="email" 
                className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.8rem] text-sm font-bold text-slate-700 outline-none focus:border-indigo-100 focus:bg-white transition-all" 
                placeholder="email@example.com" 
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Password</label>
            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500" size={20} />
              <input 
                required 
                type="password" 
                className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.8rem] text-sm font-bold text-slate-700 outline-none focus:border-indigo-100 focus:bg-white transition-all" 
                placeholder="••••••••" 
                onChange={(e) => setPassword(e.target.value)} 
              />
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading} 
            className="w-full py-5 bg-[#0F2650] text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-xl hover:bg-[#1a3a70] transition-all flex items-center justify-center gap-3 mt-8"
          >
            {loading ? 'MEMPROSES...' : <>MASUK KE SISTEM <ArrowRight size={18} /></>}
          </motion.button>
        </form>

        {/* REGISTER SECTION */}
        <div className="mt-12 pt-8 border-t border-slate-100 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Unit Baru Belum Terdaftar?</p>
          <button 
            onClick={() => router.push('/register')} 
            className="flex items-center justify-center gap-3 mx-auto px-8 py-4 bg-indigo-50 text-[#6366F1] rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-100 transition-all border border-indigo-100"
          >
            <UserPlus size={18} /> Daftar Akun Unit
          </button>
        </div>

      </motion.div>
    </div>
  )
}