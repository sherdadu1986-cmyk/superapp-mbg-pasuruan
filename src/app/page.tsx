"use client"
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Lock, ArrowRight, UserPlus, User, Loader2 } from 'lucide-react'
import { useToast } from '@/components/toast'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)

    try {
      // ===== STEP 1: Cek apakah email terdaftar di users_app =====
      console.log('[LOGIN] Step 1 — Mencari email:', email.trim())
      const { data: userByEmail, error: emailErr } = await supabase
        .from('users_app')
        .select('*')
        .eq('email', email.trim())
        .maybeSingle()

      if (emailErr) {
        console.error('[LOGIN] Error query email:', emailErr.message, emailErr)
        toast('error', 'Kesalahan Database', emailErr.message)
        setLoading(false)
        return
      }

      if (!userByEmail) {
        console.warn('[LOGIN] Email tidak ditemukan di users_app:', email.trim())
        toast('error', 'Email Tidak Terdaftar', 'Akun dengan email ini belum pernah didaftarkan.')
        setLoading(false)
        return
      }

      // ===== STEP 2: Email ditemukan, cek password =====
      console.log('[LOGIN] Step 2 — Email ditemukan, cek password. Role:', userByEmail.role, 'Unit ID:', userByEmail.sppg_unit_id)
      if (userByEmail.password !== password.trim()) {
        console.warn('[LOGIN] Password tidak cocok untuk email:', email.trim())
        toast('error', 'Password Salah!', 'Password yang Anda masukkan tidak sesuai.')
        setLoading(false)
        return
      }

      // ===== STEP 3: Cek status role (pending / aktif) =====
      console.log('[LOGIN] Step 3 — Password cocok. Cek role:', userByEmail.role)
      if (userByEmail.role === 'pending') {
        console.warn('[LOGIN] Akun masih pending:', email.trim())
        toast('warning', 'Akun dalam verifikasi', 'Akun Anda sedang menunggu aktivasi oleh Admin.')
        setLoading(false)
        return
      }

      // ===== STEP 4: Untuk role SPPG, cek apakah data profil di daftar_sppg ada =====
      let unitId = userByEmail.sppg_unit_id

      if (userByEmail.role === 'sppg') {
        console.log('[LOGIN] Step 4 — Role SPPG, cek profil di daftar_sppg. Unit ID:', unitId)

        if (!unitId) {
          // User SPPG tapi tidak punya unit_id sama sekali — auto-create
          console.warn('[LOGIN] User SPPG tanpa sppg_unit_id, membuat profil baru...')
          const { data: newUnit, error: insertErr } = await supabase
            .from('daftar_sppg')
            .insert([{ nama_unit: email.trim().split('@')[0], kepala_unit: '-' }])
            .select()
            .single()

          if (insertErr || !newUnit) {
            console.error('[LOGIN] Gagal auto-create daftar_sppg:', insertErr?.message)
            toast('error', 'Data Profil Gagal Dibuat', 'Gagal membuat data profil SPPG otomatis. Hubungi Admin.')
            setLoading(false)
            return
          }

          // Update users_app dengan unit_id baru
          unitId = newUnit.id
          await supabase.from('users_app').update({ sppg_unit_id: unitId }).eq('id', userByEmail.id)
          console.log('[LOGIN] Auto-create profil berhasil. New Unit ID:', unitId)
        } else {
          // Cek apakah row di daftar_sppg benar-benar ada
          const { data: existingUnit, error: unitErr } = await supabase
            .from('daftar_sppg')
            .select('id')
            .eq('id', unitId)
            .maybeSingle()

          if (unitErr) {
            console.error('[LOGIN] Error cek daftar_sppg:', unitErr.message, unitErr)
          }

          if (!existingUnit) {
            // Row di daftar_sppg hilang / tidak ada — auto re-create via upsert
            console.warn('[LOGIN] Unit ID', unitId, 'tidak ditemukan di daftar_sppg. Auto-create (upsert)...')
            const { error: upsertErr } = await supabase
              .from('daftar_sppg')
              .upsert({ id: unitId, nama_unit: email.trim().split('@')[0], kepala_unit: '-' })

            if (upsertErr) {
              console.error('[LOGIN] Gagal upsert daftar_sppg:', upsertErr.message)
              toast('error', 'Data Profil Belum Terdaftar', 'Data profil SPPG Anda tidak ditemukan dan gagal dibuat ulang. Hubungi Admin IT.')
              setLoading(false)
              return
            }
            console.log('[LOGIN] Upsert profil berhasil untuk Unit ID:', unitId)
          } else {
            console.log('[LOGIN] Profil daftar_sppg ditemukan. OK.')
          }
        }
      }

      // ===== STEP 5: Login berhasil — simpan session & redirect =====
      console.log('[LOGIN] Step 5 — Login berhasil! Role:', userByEmail.role, 'Unit ID:', unitId)
      localStorage.clear()
      localStorage.setItem('user_role', userByEmail.role)
      localStorage.setItem('unit_id', unitId || '')

      if (userByEmail.role === 'it') {
        router.push('/it')
      } else if (userByEmail.role === 'korwil') {
        router.push('/korwil')
      } else if (userByEmail.role === 'sppg') {
        router.push(`/sppg/dashboard/${unitId}`)
      }
    } catch (err: any) {
      console.error('[LOGIN] Unexpected error:', err?.message || err)
      toast('error', 'Kesalahan Sistem', `Silakan coba beberapa saat lagi. (${err?.message || 'Unknown error'})`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row font-sans overflow-hidden">

      {/* ============================================ */}
      {/* LEFT PANEL: BRANDING — MESH GRADIENT        */}
      {/* ============================================ */}
      <div className="md:w-1/2 bg-gradient-to-br from-slate-900 via-indigo-900 to-blue-950 flex flex-col items-center justify-center p-12 text-center text-white relative overflow-hidden">

        {/* Decorative Glow Elements */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-15%] right-[-10%] w-[400px] h-[400px] bg-blue-500/15 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute top-[40%] left-[60%] w-[200px] h-[200px] bg-violet-400/10 rounded-full blur-[80px] pointer-events-none"></div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 space-y-8 max-w-lg"
        >
          {/* Clean Logo — No Background Box */}
          <div className="flex justify-center mb-2">
            <Image src="/logo.png" alt="Logo" width={120} height={120} className="object-contain drop-shadow-2xl" />
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
              Operasional{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-200">SPPG</span>
              <br />
              Kab. Pasuruan
            </h1>
            <p className="text-sm text-indigo-200/80 font-medium leading-relaxed max-w-sm mx-auto">
              Platform terintegrasi untuk pemantauan distribusi MBG wilayah Kabupaten Pasuruan.
            </p>
          </div>

          {/* Subtle Badge */}
          <div className="flex justify-center">
            <div className="px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-[10px] font-bold text-indigo-200 uppercase tracking-widest">
              Dev by sydhq • 2026
            </div>
          </div>
        </motion.div>
      </div>

      {/* ============================================ */}
      {/* RIGHT PANEL: LOGIN FORM                      */}
      {/* ============================================ */}
      <div className="md:w-1/2 flex flex-col items-center justify-center p-8 md:p-20 bg-white relative">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md space-y-8"
        >
          {/* Greeting */}
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-2">Sugeng Enjing 👋</h2>
            <p className="text-sm text-slate-500 font-medium">Wes ndang login o rek!</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email / Akun</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors duration-200" size={18} />
                <input required type="email" className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all duration-200" placeholder="admin@mbg.com" onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Kata Sandi</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors duration-200" size={18} />
                <input required type="password" className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all duration-200" placeholder="••••••••" onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>

            {/* WOW Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white uppercase tracking-widest bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg transition-all duration-200 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  Melbu Sistem <ArrowRight size={18} className="ml-2" />
                </>
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="pt-6 border-t border-slate-100 flex flex-col items-center gap-3 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Durung Ndue Akun?</p>
            <button onClick={() => router.push('/register')} className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-all duration-200 uppercase tracking-widest group">
              <UserPlus size={16} className="group-hover:scale-110 transition-transform" /> Daftar Akun Sek
            </button>
          </div>
        </motion.div>
      </div>

      {/* FLOATING HELPDESK BUTTON */}
      <a
        href="https://wa.me/6281330110828?text=Halo%20Mba%20Aisah,%20saya%20butuh%20bantuan%20terkait%20sistem%20SPPG."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 z-50 flex items-center gap-2 px-5 py-3 rounded-full font-medium text-white bg-emerald-500 shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 01-4.168-1.168l-.3-.178-3.1.921.921-3.1-.178-.3A8 8 0 1112 20z" /></svg>
        Lapor Mba Aisah
      </a>
    </div>
  )
}