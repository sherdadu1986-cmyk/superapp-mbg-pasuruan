"use client"
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Lock, Mail, ArrowRight } from 'lucide-react'
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
      // Gunakan query yang lebih sederhana untuk menghindari error 406
      const { data, error } = await supabase
        .from('users_app')
        .select('*')
        .eq('email', email.trim()) // trim untuk hapus spasi tak sengaja
        .eq('password', password.trim())
        .maybeSingle() // Gunakan maybeSingle agar tidak crash jika data kosong

      if (error) throw error

      if (!data) {
        alert("❌ Akun tidak ditemukan atau password salah!")
      } else {
        // Cek status pending
        if (data.role === 'pending') {
          alert("⚠️ Akun Anda sedang diverifikasi.");
          setLoading(false);
          return;
        }

        // Simpan session
        localStorage.clear()
        localStorage.setItem('user_role', data.role)
        localStorage.setItem('unit_id', data.sppg_unit_id)

        // Pengarahan Role sesuai Database Anda
        if (data.role === 'it') {
          router.push('/it')
        } else if (data.role === 'sppg') {
          router.push(`/sppg/dashboard/${data.sppg_unit_id}`)
        } else if (data.role === 'korwil') {
          router.push('/korwil')
        }
      }
    } catch (err: any) {
      console.error("Login Error:", err.message)
      alert("Terjadi masalah koneksi: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F2650] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Image src="/logo.png" alt="Logo" width={100} height={100} className="mx-auto mb-4" />
          <h2 className="text-2xl font-black text-[#0F2650] uppercase italic">Login MBG APP</h2>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input required type="email" placeholder="Email Admin/SPPG" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20" onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input required type="password" placeholder="Password" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20" onChange={e => setPassword(e.target.value)} />
          </div>
          <button disabled={loading} className="w-full py-5 bg-[#0F2650] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all">
            {loading ? 'MEMPROSES...' : 'MASUK KE SISTEM'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}