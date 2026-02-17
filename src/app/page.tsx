"use client"
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { User, Lock } from 'lucide-react' // Shield dihapus karena diganti logo gambar

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: any) => {
    e.preventDefault()
    setLoading(true)

    // 1. Cek User di Database
    const { data, error } = await supabase
      .from('users_app')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single()

    if (error || !data) {
      alert("❌ Login Gagal! Nama Akun atau Kata Sandi salah.")
      setLoading(false)
      return
    }

    // 2. Simpan Sesi
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_role', data.role)
      localStorage.setItem('user_unit_id', data.sppg_unit_id || '')
      localStorage.setItem('user_email', data.email)
    }

    // 3. Arahkan sesuai Role
    if (data.role === 'it') router.push('/it')
    else if (data.role === 'korwil') router.push('/korwil')
    else if (data.role === 'sppg') router.push('/sppg')
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex font-sans">
      
      {/* BAGIAN KIRI (BIRU GELAP & LOGO BESAR) */}
      <div className="hidden lg:flex w-1/2 bg-[#0F2650] flex-col justify-center items-center relative overflow-hidden">
        {/* Dekorasi Bulatan Background */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>

        <div className="relative z-10 text-center p-10">
            {/* LOGO GAMBAR BESAR */}
            <div className="bg-white/10 p-6 rounded-3xl inline-block mb-8 backdrop-blur-sm border border-white/10 shadow-2xl">
                {/* Pastikan file logo.png ada di folder public */}
                <img 
                  src="/logo.png" 
                  alt="Logo Kab Pasuruan" 
                  className="w-24 h-auto mx-auto" 
                  onError={(e) => {
                    // Fallback kalau gambar tidak ketemu (biar tidak rusak)
                    e.currentTarget.style.display = 'none'; 
                    alert("Gambar logo.png belum dimasukkan ke folder public!"); 
                  }}
                />
            </div>

            <h1 className="text-3xl font-bold text-white mb-2 leading-tight">
                Sistem Manajemen <br/>
                <span className="text-yellow-400 bg-white/10 px-2 rounded">Operasional SPPG</span><br/>
                Kab. Pasuruan
            </h1>
            <p className="text-slate-300 text-sm mt-4 max-w-md mx-auto leading-relaxed opacity-80">
                Platform terintegrasi untuk pemantauan distribusi gizi dan operasional unit layanan di wilayah Kabupaten Pasuruan.
            </p>
        </div>
      </div>

      {/* BAGIAN KANAN (FORM PUTIH) */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center items-center p-8 lg:p-16">
        
        <div className="w-full max-w-md space-y-8">
            {/* Header Form */}
            <div className="text-center">
                <div className="flex justify-center items-center gap-3 mb-4">
                    {/* LOGO KECIL DI SAMPING JUDUL */}
                    <img src="/logo.png" alt="Logo" className="w-12 h-auto" />
                    <div className="text-left">
                        <h2 className="text-xl font-black text-[#0F2650] uppercase leading-none">Kabupaten<br/>Pasuruan</h2>
                    </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-800">Silakan Login</h3>
                <p className="text-slate-400 text-xs mt-1">Masuk untuk mengakses dashboard operasional</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
                
                {/* Input Nama Akun (Email) */}
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 ml-1">Nama Akun / Email</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User size={18} className="text-slate-400" />
                        </div>
                        <input 
                            type="email" 
                            placeholder="Contoh: wonorejo@mbg.com" 
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-[#0F2650] focus:ring-1 focus:ring-[#0F2650] transition-all"
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>
                </div>

                {/* Input Kata Sandi */}
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 ml-1">Kata Sandi</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock size={18} className="text-slate-400" />
                        </div>
                        <input 
                            type="password" 
                            placeholder="Masukkan kata sandi..." 
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-[#0F2650] focus:ring-1 focus:ring-[#0F2650] transition-all"
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex justify-between items-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="rounded text-[#0F2650] focus:ring-[#0F2650]" />
                        <span className="text-xs font-bold text-slate-500">Ingat Saya</span>
                    </label>
                    <a href="#" className="text-xs font-bold text-blue-600 hover:underline">Lupa Password?</a>
                </div>

                {/* Button Login */}
                <button disabled={loading} className="w-full py-4 bg-[#0F2650] text-white rounded-xl font-bold shadow-lg hover:bg-[#1a3a70] transition-all flex justify-center items-center gap-2 uppercase tracking-wider text-sm">
                    {loading ? 'Memproses...' : 'MASUK SISTEM'}
                </button>

            </form>

            {/* Footer */}
            <div className="text-center mt-12 space-y-2 border-t border-slate-100 pt-6">
                <p className="text-[10px] text-slate-400">sydhq dev © 2026</p>
                <div className="flex justify-center gap-4 text-[10px] text-slate-500 font-bold">
                    <a href="#">Bantuan IT</a>
                    <a href="#">Panduan Pengguna</a>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}