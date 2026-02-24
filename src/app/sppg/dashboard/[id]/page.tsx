"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getLocalToday } from '@/lib/date'
import { useParams, useRouter } from 'next/navigation'
import { useToast } from '@/components/toast'
import {
  LayoutDashboard, LogOut, Menu, Utensils,
  CheckCircle2, School, Trash2, Plus, Edit3, ClipboardList, Users,
  ChevronLeft, Calendar as CalendarIcon, AlertCircle, FileText
} from 'lucide-react'

export default function DashboardSPPGPage() {
  const { id } = useParams()
  const router = useRouter()
  const { toast } = useToast()

  // UI State
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'sekolah' | 'riwayat'>('sekolah')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Data State
  const [selectedUnit, setSelectedUnit] = useState<any>(null)
  const [listSekolah, setListSekolah] = useState<any[]>([])
  const [riwayat, setRiwayat] = useState<any[]>([])
  const [totalPM, setTotalPM] = useState(0)
  const [laporanHariIni, setLaporanHariIni] = useState<any>(null)

  // Tanggal Hari Ini (WIB)
  const todayISO = getLocalToday()
  const todayFormatted = new Date(todayISO + 'T12:00:00').toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  // Form Tambah Sekolah
  const [newSekolah, setNewSekolah] = useState({ nama: '', jenjang: 'SD/MI', porsi_siswa: 0, porsi_siswa_1_3: 0, porsi_siswa_4_6: 0, porsi_guru: 0, porsi_tendik: 0, porsi_kader: 0 })
  const isSD = newSekolah.jenjang === 'SD/MI'
  const totalPorsiNew = isSD
    ? newSekolah.porsi_siswa_1_3 + newSekolah.porsi_siswa_4_6 + newSekolah.porsi_guru + newSekolah.porsi_tendik + newSekolah.porsi_kader
    : newSekolah.porsi_siswa + newSekolah.porsi_guru + newSekolah.porsi_tendik + newSekolah.porsi_kader
  const KATEGORI_PM = ["PAUD/KB", "TK/RA", "SD/MI", "SMP/MTS", "SMA/SMK", "SANTRI", "BALITA", "BUMIL", "BUSUI"]

  const loadData = async () => {
    setLoading(true)
    try {
      const { data: unit } = await supabase.from('daftar_sppg').select('*').eq('id', id).single()
      const { data: sekolah } = await supabase.from('daftar_sekolah').select('*').eq('sppg_id', id).order('id', { ascending: true })
      const { data: laporan } = await supabase.from('laporan_harian_final').select('*').eq('unit_id', id).order('tanggal_ops', { ascending: false })

      // Cek Laporan Hari Ini
      const checkToday = laporan?.find(l => l.tanggal_ops === todayISO)

      if (unit) setSelectedUnit(unit)
      if (checkToday) setLaporanHariIni(checkToday)
      if (sekolah) {
        setListSekolah(sekolah)
        const total = sekolah.reduce((acc, curr) => acc + (Number(curr.target_porsi) || 0), 0)
        setTotalPM(total)
      }
      if (laporan) setRiwayat(laporan)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (id) loadData() }, [id])

  const handleAddSekolah = async () => {
    if (!newSekolah.nama || totalPorsiNew <= 0) return toast('warning', 'Lengkapi Data', 'Nama & minimal 1 porsi harus diisi.')
    const computedPorsiSiswa = isSD ? newSekolah.porsi_siswa_1_3 + newSekolah.porsi_siswa_4_6 : newSekolah.porsi_siswa
    await supabase.from('daftar_sekolah').insert([{
      sppg_id: id, nama_sekolah: newSekolah.nama, jenjang: newSekolah.jenjang,
      porsi_siswa: computedPorsiSiswa,
      porsi_siswa_1_3: isSD ? newSekolah.porsi_siswa_1_3 : 0,
      porsi_siswa_4_6: isSD ? newSekolah.porsi_siswa_4_6 : 0,
      porsi_guru: newSekolah.porsi_guru,
      porsi_tendik: newSekolah.porsi_tendik, porsi_kader: newSekolah.porsi_kader,
      target_porsi: totalPorsiNew
    }])
    setNewSekolah({ nama: '', jenjang: 'SD/MI', porsi_siswa: 0, porsi_siswa_1_3: 0, porsi_siswa_4_6: 0, porsi_guru: 0, porsi_tendik: 0, porsi_kader: 0 });
    loadData();
  }

  const handleDeleteSekolah = async (sid: string) => {
    if (confirm("Hapus sekolah?")) { await supabase.from('daftar_sekolah').delete().eq('id', sid); loadData(); }
  }

  if (loading && !selectedUnit) return <div className="min-h-screen flex items-center justify-center font-black text-slate-400 animate-pulse uppercase tracking-widest text-xs">Syncing Data SPPG...</div>

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800 transition-all duration-300">

      {/* SIDEBAR — SLIM & CLEAN */}
      <aside className={`bg-white border-r border-slate-200 flex flex-col fixed h-full z-50 transition-all duration-300 ${sidebarOpen ? 'w-60' : 'w-[70px]'}`}>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className={`flex items-center gap-2.5 overflow-hidden ${sidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
            <img src="/logo.png" className="w-7 h-7 shrink-0" />
            <span className="text-sm font-bold text-slate-800 whitespace-nowrap tracking-tight">SPPG Pasuruan</span>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
            {sidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1 mt-2">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 transition-all">
            <LayoutDashboard size={18} className="shrink-0" />
            <span className={sidebarOpen ? 'block' : 'hidden'}>Dashboard</span>
          </button>
        </nav>
        <div className="p-3 border-t border-slate-100">
          <button onClick={() => { localStorage.clear(); router.push('/') }} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-all">
            <LogOut size={18} className="shrink-0" />
            <span className={sidebarOpen ? 'block' : 'hidden'}>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className={`flex-1 min-h-screen transition-all duration-300 ${sidebarOpen ? 'pl-60' : 'pl-[70px]'}`}>

        {/* GREETING HEADER */}
        <header className="bg-white border-b border-slate-200 px-6 lg:px-8 py-4 flex justify-between items-center sticky top-0 z-40">
          <div>
            <h1 className="text-lg font-bold text-slate-800">Halo, {selectedUnit?.nama_unit} 👋</h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Dashboard Operasional SPPG</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{todayFormatted}</p>
              <p className="text-xs font-bold text-slate-600 mt-0.5">PJ: {selectedUnit?.kepala_unit}</p>
            </div>
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-500/20">
              {selectedUnit?.kepala_unit?.charAt(0)}
            </div>
          </div>
        </header>

        <div className="p-5 lg:p-8 space-y-5 max-w-6xl mx-auto">

          {/* HERO STATUS CARD */}
          {laporanHariIni ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                  <CheckCircle2 size={24} className="text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Laporan hari ini sudah terkirim ✅</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Menu: <span className="font-semibold text-slate-600">{laporanHariIni.menu_makanan}</span></p>
                </div>
              </div>
              <button
                onClick={() => router.push(`/sppg/dashboard/${id}/input?edit=${laporanHariIni.id}`)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all flex items-center gap-2"
              >
                <Edit3 size={14} /> Edit Laporan
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-8 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                  <AlertCircle size={24} className="text-amber-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Belum ada laporan untuk hari ini</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Silakan isi laporan distribusi untuk {todayFormatted}</p>
                </div>
              </div>
              <button
                onClick={() => router.push(`/sppg/dashboard/${id}/input`)}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 hover:-translate-y-0.5 transition-all flex items-center gap-2"
              >
                <ClipboardList size={18} /> Isi Laporan Sekarang
              </button>
            </div>
          )}

          {/* SUMMARY STATS GRID */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Total Penerima</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{totalPM.toLocaleString()}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">porsi terdaftar</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Titik Layanan</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{listSekolah.length}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">sekolah aktif</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Menu Hari Ini</p>
              <p className="text-sm font-bold text-slate-800 mt-1 truncate">{laporanHariIni?.menu_makanan || '—'}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{laporanHariIni ? 'terkirim' : 'belum input'}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Laporan Masuk</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{riwayat.length}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">total riwayat</p>
            </div>
          </div>

          {/* TABS */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex border-b border-slate-100">
              <button onClick={() => setActiveTab('sekolah')} className={`flex-1 py-3 text-xs font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === 'sekolah' ? 'text-indigo-700 bg-indigo-50/50 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
                <School size={15} /> Titik Layanan
              </button>
              <button onClick={() => setActiveTab('riwayat')} className={`flex-1 py-3 text-xs font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === 'riwayat' ? 'text-indigo-700 bg-indigo-50/50 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
                <FileText size={15} /> Riwayat Laporan
              </button>
            </div>

            <div className="p-4">
              {activeTab === 'sekolah' ? (
                <div className="space-y-4">
                  {/* COMPACT ADD FORM */}
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Jenjang</label>
                        <select className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all" value={newSekolah.jenjang} onChange={e => setNewSekolah({ ...newSekolah, jenjang: e.target.value })}>{KATEGORI_PM.map(k => <option key={k} value={k}>{k}</option>)}</select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Nama Sekolah</label>
                        <input className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all" placeholder="SDN Kota..." value={newSekolah.nama} onChange={e => setNewSekolah({ ...newSekolah, nama: e.target.value })} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {isSD ? (
                        <>
                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Siswa 1-3</label>
                            <input type="number" min="0" className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" placeholder="0" value={newSekolah.porsi_siswa_1_3 || ''} onChange={e => setNewSekolah({ ...newSekolah, porsi_siswa_1_3: parseInt(e.target.value) || 0 })} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Siswa 4-6</label>
                            <input type="number" min="0" className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" placeholder="0" value={newSekolah.porsi_siswa_4_6 || ''} onChange={e => setNewSekolah({ ...newSekolah, porsi_siswa_4_6: parseInt(e.target.value) || 0 })} />
                          </div>
                        </>
                      ) : (
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Porsi Siswa</label>
                          <input type="number" min="0" className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" placeholder="0" value={newSekolah.porsi_siswa || ''} onChange={e => setNewSekolah({ ...newSekolah, porsi_siswa: parseInt(e.target.value) || 0 })} />
                        </div>
                      )}
                      {[
                        { label: 'Guru', key: 'porsi_guru' as const },
                        { label: 'Tendik', key: 'porsi_tendik' as const },
                        { label: 'Kader', key: 'porsi_kader' as const },
                      ].map(item => (
                        <div key={item.key} className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{item.label}</label>
                          <input type="number" min="0" className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" placeholder="0" value={newSekolah[item.key] || ''} onChange={e => setNewSekolah({ ...newSekolah, [item.key]: parseInt(e.target.value) || 0 })} />
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 pt-1">
                      <div className="flex-1 bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-2 flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-indigo-600 uppercase">Total</span>
                        <span className="text-lg font-bold text-indigo-700">{totalPorsiNew.toLocaleString()}</span>
                      </div>
                      <button onClick={handleAddSekolah} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all shadow-sm flex items-center gap-2 whitespace-nowrap">
                        <Plus size={15} /> Simpan
                      </button>
                    </div>
                  </div>

                  {/* COMPACT TABLE */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="text-left py-2 px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">No</th>
                          <th className="text-left py-2 px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Nama Sekolah</th>
                          <th className="text-left py-2 px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Jenjang</th>
                          <th className="text-right py-2 px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Target</th>
                          <th className="text-right py-2 px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Detail</th>
                          <th className="py-2 px-3 w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {listSekolah.map((s, index) => (
                          <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                            <td className="py-2 px-3 text-sm text-slate-400 font-medium">{index + 1}</td>
                            <td className="py-2 px-3 text-sm font-semibold text-slate-700">{s.nama_sekolah}</td>
                            <td className="py-2 px-3"><span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{s.jenjang}</span></td>
                            <td className="py-2 px-3 text-sm font-bold text-slate-800 text-right">{s.target_porsi}</td>
                            <td className="py-2 px-3 text-[10px] text-slate-400 text-right">{s.jenjang === 'SD/MI' ? `1-3: ${s.porsi_siswa_1_3 ?? 0} | 4-6: ${s.porsi_siswa_4_6 ?? 0}` : `Siswa: ${s.porsi_siswa ?? 0}`} | G:{s.porsi_guru ?? 0} T:{s.porsi_tendik ?? 0} K:{s.porsi_kader ?? 0}</td>
                            <td className="py-2 px-3">
                              <button onClick={() => handleDeleteSekolah(s.id)} className="p-1 text-slate-200 hover:text-red-500 rounded transition-all opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {listSekolah.length === 0 && <div className="py-12 text-center text-xs text-slate-300 font-medium">Belum ada titik layanan terdaftar</div>}
                  </div>
                </div>
              ) : (
                <div className="space-y-0">
                  {riwayat.map(l => (
                    <div key={l.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-50 text-indigo-500 rounded-lg flex items-center justify-center shrink-0">
                          <Utensils size={14} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-700">{l.menu_makanan}</p>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                            {new Date(l.tanggal_ops + 'T12:00:00').toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {l.tanggal_ops === todayISO && (
                          <button onClick={() => router.push(`/sppg/dashboard/${id}/input?edit=${l.id}`)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-700 rounded-md text-[10px] font-semibold transition-all opacity-0 group-hover:opacity-100">
                            <Edit3 size={12} /> Edit
                          </button>
                        )}
                        <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">Terkirim</span>
                      </div>
                    </div>
                  ))}
                  {riwayat.length === 0 && (
                    <div className="py-16 text-center text-xs text-slate-300 font-medium">Belum ada riwayat laporan</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}