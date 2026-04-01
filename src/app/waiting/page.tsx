"use client"
import { motion } from 'framer-motion'
import { Clock, ArrowLeft, ShieldCheck, Mail } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function WaitingVerificationPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row font-sans overflow-hidden">
      {/* ============================================ */}
      {/* LEFT PANEL: BRANDING                         */}
      {/* ============================================ */}
      <div className="md:w-[40%] bg-gradient-to-br from-slate-900 via-indigo-900 to-[#0F2650] flex flex-col items-center justify-center p-12 text-center text-white relative overflow-hidden">
        {/* Decorative Glow Elements */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-15%] right-[-10%] w-[400px] h-[400px] bg-emerald-500/15 rounded-full blur-[100px] pointer-events-none"></div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 space-y-8 max-w-sm"
        >
          <div className="flex justify-center mb-2">
            <Image src="/logo.png" alt="Logo" width={100} height={100} className="object-contain drop-shadow-2xl" />
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
              MBG <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-200">Pasuruan</span>
            </h1>
            <p className="text-xs text-indigo-200/80 font-medium leading-relaxed mx-auto">
              Keselamatan dan Validitas Data adalah Prioritas Kami.
            </p>
          </div>
        </motion.div>
      </div>

      {/* ============================================ */}
      {/* RIGHT PANEL: WAITING STATES                  */}
      {/* ============================================ */}
      <div className="md:w-[60%] flex flex-col items-center justify-center p-8 md:p-24 bg-slate-50 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-lg bg-white rounded-[2rem] p-10 md:p-14 shadow-xl shadow-slate-200/50 border border-slate-100 text-center space-y-8"
        >
          {/* ICON ANIMATION */}
          <div className="relative w-28 h-28 mx-auto">
            <div className="absolute inset-0 bg-orange-100 rounded-full animate-ping opacity-50"></div>
            <div className="relative w-full h-full bg-orange-50 rounded-full flex items-center justify-center border border-orange-100 shadow-inner">
              <Clock size={48} className="text-orange-500" />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">Akun Sedang Diverifikasi</h2>
            <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
              Pendaftaran Anda telah kami terima dan saat ini sedang menunggu tinjauan dari Koordinator Wilayah atau Admin IT.
            </p>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-left space-y-4">
            <div className="flex items-start gap-4">
              <ShieldCheck size={20} className="text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-1">Kenapa Harus Menunggu?</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Kami memastikan bahwa hanya Unit SPPG resmi yang berhak mendistribusikan laporan ke server pusat pemerintahan.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Mail size={20} className="text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-1">Langkah Selanjutnya</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Silakan periksa kembali halaman ini secara berkala, atau hubungi <b>Pusat Bantuan</b> jika membutuhkan konfirmasi instan.</p>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={() => router.push('/')}
              className="flex items-center justify-center gap-2 w-full py-4 text-xs font-bold text-slate-600 uppercase tracking-widest hover:bg-slate-50 rounded-xl transition-all"
            >
              <ArrowLeft size={16} /> Kembali ke Halaman Login
            </button>
          </div>
        </motion.div>
      </div>

    </div>
  )
}
