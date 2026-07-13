"use client"
import { useRouter } from 'next/navigation'
import {
    Settings, BarChart3, Camera, Users, LogOut, Map, MapPin, ArrowLeft
} from 'lucide-react'
import InteractivePinMap from '@/components/InteractivePinMap'

export default function MonitoringWilayahPage() {
    const router = useRouter()

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 text-slate-800 font-sans selection:bg-indigo-500/20 relative overflow-hidden">

            {/* DECORATIVE BLOBS */}
            <div className="fixed top-[-100px] left-[-100px] w-[500px] h-[500px] bg-indigo-400/15 rounded-full blur-3xl pointer-events-none z-0" />
            <div className="fixed bottom-[-80px] left-[-60px] w-[400px] h-[400px] bg-emerald-400/15 rounded-full blur-3xl pointer-events-none z-0" />
            <div className="fixed top-[-120px] right-[-120px] w-[350px] h-[350px] bg-blue-200/10 rounded-full blur-[100px] pointer-events-none z-0" />

            {/* SIDEBAR — GLASSMORPHISM */}
            <aside className="w-24 lg:w-72 bg-white/40 backdrop-blur-xl border-r border-white/50 fixed h-full z-50 transition-all" style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.6), inset 0 -1px 1px rgba(255,255,255,0.3), 0 10px 40px -10px rgba(0,0,0,0.08)' }}>
                <div className="p-8 border-b border-white/20 flex items-center gap-4">
                    <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20 text-white">
                        <Settings size={24} />
                    </div>
                    <div className="hidden lg:block">
                        <h1 className="font-black tracking-tighter text-xl italic text-slate-900 uppercase leading-none">KORWIL</h1>
                        <p className="text-[9px] font-black text-slate-400 tracking-[0.3em] uppercase mt-1">Control Panel</p>
                    </div>
                </div>

                <nav className="p-6 space-y-3">
                    <button
                        onClick={() => router.push('/korwil')}
                        className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 text-slate-500 hover:bg-white/50 hover:text-slate-800"
                    >
                        <BarChart3 size={20} />
                        <span className="hidden lg:block font-bold text-xs uppercase tracking-widest">Monitoring</span>
                    </button>
                    <button
                        className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 bg-indigo-600 text-white shadow-xl shadow-indigo-600/10"
                    >
                        <Map size={20} />
                        <span className="hidden lg:block font-bold text-xs uppercase tracking-widest">Peta Wilayah</span>
                    </button>
                    <button
                        onClick={() => router.push('/korwil')}
                        className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 text-slate-500 hover:bg-white/50 hover:text-slate-800"
                    >
                        <Camera size={20} />
                        <span className="hidden lg:block font-bold text-xs uppercase tracking-widest">Galeri</span>
                    </button>
                    <button
                        onClick={() => router.push('/korwil/akun')}
                        className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 text-slate-500 hover:bg-white/50 hover:text-slate-800"
                    >
                        <Users size={20} />
                        <span className="hidden lg:block font-bold text-xs uppercase tracking-widest">Akun Pengguna</span>
                    </button>
                </nav>

                <div className="absolute bottom-8 w-full px-6">
                    <button onClick={async () => { await fetch('/api/logout', { method: 'POST' }); localStorage.clear(); router.push('/') }} className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-rose-500 hover:bg-rose-50 transition-all font-bold text-xs uppercase tracking-widest">
                        <LogOut size={20} />
                        <span className="hidden lg:block">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="pl-24 lg:pl-72 p-6 transition-all">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* HEADER */}
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <button
                                onClick={() => router.push('/korwil')}
                                className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors mb-3 text-[10px] font-black uppercase tracking-widest"
                            >
                                <ArrowLeft size={14} /> Kembali ke Dashboard
                            </button>
                            <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">
                                Peta Persebaran Unit SPPG
                            </h2>
                            <div className="flex items-center gap-3 mt-3">
                                <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/50 shadow-sm">
                                    <MapPin size={14} className="text-indigo-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Kabupaten Pasuruan</span>
                                </div>
                                <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/50 shadow-sm">
                                    <Map size={14} className="text-emerald-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">24 Kecamatan</span>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* MAP CARD — GLASSMORPHISM */}
                    <div
                        className="bg-white/40 backdrop-blur-xl border border-white/50 shadow-xl rounded-2xl p-6"
                        style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.6), inset 0 -1px 1px rgba(255,255,255,0.3), 0 20px 60px -15px rgba(0,0,0,0.1)' }}
                    >
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2.5 bg-indigo-50 rounded-xl">
                                <Map size={20} className="text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Heatmap Wilayah</h3>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Hover kecamatan untuk melihat detail</p>
                            </div>
                        </div>

                        <InteractivePinMap />
                    </div>

                    {/* BOTTOM INFO */}
                    <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-xl p-4 flex items-start gap-3" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)' }}>
                        <div className="p-2 bg-amber-50 rounded-lg shrink-0 mt-0.5">
                            <MapPin size={16} className="text-amber-500" />
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                            <span className="font-black">Catatan:</span> Data persebaran unit SPPG pada peta ini menggunakan <span className="font-bold text-slate-700">dummy data</span> untuk keperluan demo.
                            Integrasi dengan data real dari Supabase dapat dilakukan pada tahap selanjutnya.
                        </p>
                    </div>

                </div>
            </main>
        </div>
    )
}
