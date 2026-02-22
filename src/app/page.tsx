"use client"
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Mail, ShieldCheck, ArrowRight, UserPlus, Sparkles } from 'lucide-react'

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
      
      {/* ANIMASI BACKGROUND FLOATING SHAPES */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
        transition={{ duration: 20, repeat: Infinity }}
        className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"
      />
      <motion.div 
        animate={{ scale: [1, 1.5, 1], x: [0, 50, 0] }}
        transition={{ duration: 15, repeat: Infinity }}
        className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl"
      />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-md w-full bg-white rounded-[3.5rem] p-10 lg:p-14 shadow-[0_30px_100px_rgba(0,0,0,0.05)] border border-white/50 relative z-10 backdrop-blur-sm"
      >
        
        {/* LOGO DENGAN ANIMASI PULSE & BOUNCE */}
        <motion.div 
          whileHover={{ scale: 1.1, rotate: 5 }}
          className="text-center mb-10"
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
            className="w-20 h-20 bg-gradient-to-tr from-[#0F2650] to-[#6366F1] rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-300 ring-4 ring-white"
          >
            <ShieldCheck size={40} className="text-white" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-4xl font-black text-[#0F2650] uppercase italic tracking-tighter leading-none"
          >
            MBG App
          </motion.h1>
          <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.4em] mt-3 flex items-center justify-center gap-2">
            <Sparkles size={12} /> Kabupaten Pasuruan <Sparkles size={12} />
          </p>
        </motion.div>

        {/* LOGIN FORM */}
        <form onSubmit={handleLogin} className="space-y-6">
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
            <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Email Access</label>
            <div className="relative group">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#6366F1] transition-colors" size={20} />
              <input 
                required 
                type="email" 
                className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.8rem] text-sm font-bold text-slate-700 outline-none focus:border-indigo-100 focus:bg-white transition-all shadow-inner" 
                placeholder="name@example.com" 
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>
          </motion.div>

          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.6 }}>
            <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Security Password</label>
            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#6366F1] transition-colors" size={20} />
              <input 
                required 
                type="password" 
                className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.8rem] text-sm font-bold text-slate-700 outline-none focus:border-indigo-100 focus:bg-white transition-all shadow-inner" 
                placeholder="••••••••" 
                onChange={(e) => setPassword(e.target.value)} 
              />
            </div>
          </motion.div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading} 
            className="w-full py-5 bg-[#0F2650] text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-[0_20px_40px_rgba(15,38,80,0.3)] hover:bg-[#1a3a70] transition-all flex items-center justify-center gap-3 mt-10"
          >
            {loading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
            ) : (
              <>MASUK KE SISTEM <ArrowRight size={18} /></>
            )}
          </motion.button>
        </form>

        {/* REGISTER SECTION WITH STAGGERED ANIMATION */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 pt-8 border-t border-slate-100 text-center"
        >
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Unit Baru Belum Terdaftar?</p>
          <motion.button 
            whileHover={{ y: -3 }}
            onClick={() => router.push('/register')} 
            className="flex items-center justify-center gap-3 mx-auto px-8 py-4 bg-indigo-50 text-[#6366F1] rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-100 transition-all border border-indigo-100 shadow-sm"
          >
            <UserPlus size={18} /> Daftar Akun Unit
          </motion.button>
        </motion.div>

      </motion.div>
    </div>
  )
}