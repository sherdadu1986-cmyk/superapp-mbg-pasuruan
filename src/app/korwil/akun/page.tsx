"use client"
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
    Settings, LogOut, BarChart3, Camera, Users, ChevronLeft,
    CheckCircle2, Clock, Loader2, ShieldCheck, Pencil, X, Save
} from 'lucide-react'

export default function ManajemenAkunPage() {
    const router = useRouter()
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [approving, setApproving] = useState<string | null>(null)

    // Edit Modal State
    const [editUser, setEditUser] = useState<any>(null)
    const [editForm, setEditForm] = useState({ nama: '', email: '', password: '', nama_unit: '' })
    const [saving, setSaving] = useState(false)

    const fetchUsers = useCallback(async () => {
        setLoading(true)
        const { data } = await supabase
            .from('users_app')
            .select('*, daftar_sppg(nama_unit)')
            .order('created_at', { ascending: false })
        setUsers(data || [])
        setLoading(false)
    }, [])

    useEffect(() => { fetchUsers() }, [fetchUsers])

    // ACC / Approve
    const handleApproveUser = async (userId: string) => {
        setApproving(userId)
        const { error } = await supabase.from('users_app').update({ status: 'aktif' }).eq('id', userId)
        if (error) { alert('⚠️ Gagal mengaktifkan akun.') }
        else { alert('✅ Akun berhasil diaktifkan!'); fetchUsers() }
        setApproving(null)
    }

    // Open Edit Modal
    // Helper: resolve display name
    const getNamaAkun = (user: any) => user.nama || (user.email ? user.email.split('@')[0] : '-')
    const getUnitName = (user: any) => user.daftar_sppg?.nama_unit || (user.sppg_unit_id ? user.sppg_unit_id.substring(0, 8) + '...' : '-')

    const openEdit = (user: any) => {
        setEditUser(user)
        setEditForm({
            nama: getNamaAkun(user),
            email: user.email || '',
            password: user.password || '',
            nama_unit: getUnitName(user),
        })
    }

    // Save Edit
    const handleUpdateUser = async () => {
        if (!editUser) return
        setSaving(true)
        const { error } = await supabase
            .from('users_app')
            .update({
                nama: editForm.nama,
                email: editForm.email,
                password: editForm.password,
                nama_unit: editForm.nama_unit,
            })
            .eq('id', editUser.id)
        if (error) { alert('⚠️ Gagal menyimpan perubahan.') }
        else { alert('✅ Data berhasil diperbarui!'); setEditUser(null); fetchUsers() }
        setSaving(false)
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">

            {/* SIDEBAR */}
            <aside className="w-24 lg:w-72 bg-white/80 backdrop-blur-xl border-r border-slate-200 fixed h-full z-50 transition-all shadow-sm">
                <div className="p-8 border-b border-slate-200 flex items-center gap-4">
                    <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20 text-white">
                        <Settings size={24} />
                    </div>
                    <div className="hidden lg:block">
                        <h1 className="font-black tracking-tighter text-xl italic text-slate-900 uppercase leading-none">KORWIL</h1>
                        <p className="text-[9px] font-black text-slate-400 tracking-[0.3em] uppercase mt-1">Control Panel</p>
                    </div>
                </div>
                <nav className="p-6 space-y-3">
                    <button onClick={() => router.push('/korwil')} className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all text-slate-500 hover:bg-slate-100 hover:text-slate-800">
                        <BarChart3 size={20} /><span className="hidden lg:block font-bold text-xs uppercase tracking-widest">Monitoring</span>
                    </button>
                    <button onClick={() => router.push('/korwil')} className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all text-slate-500 hover:bg-slate-100 hover:text-slate-800">
                        <Camera size={20} /><span className="hidden lg:block font-bold text-xs uppercase tracking-widest">Galeri</span>
                    </button>
                    <button className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all bg-indigo-600 text-white shadow-xl shadow-indigo-600/10">
                        <Users size={20} /><span className="hidden lg:block font-bold text-xs uppercase tracking-widest">Akun Pengguna</span>
                    </button>
                </nav>
                <div className="absolute bottom-8 w-full px-6">
                    <button onClick={() => router.push('/')} className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-rose-500 hover:bg-rose-50 transition-all font-bold text-xs uppercase tracking-widest">
                        <LogOut size={20} /><span className="hidden lg:block">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* MAIN */}
            <main className="pl-24 lg:pl-72 p-6 transition-all">
                <div className="max-w-6xl mx-auto space-y-5">

                    {/* HEADER — compact */}
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <button onClick={() => router.push('/korwil')} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm">
                                    <ChevronLeft size={18} className="text-slate-500" />
                                </button>
                                <h2 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">Manajemen Akun</h2>
                            </div>
                            <div className="flex items-center gap-2 ml-12">
                                <span className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1 rounded-lg shadow-sm text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    <Users size={12} className="text-indigo-500" /> {users.length} Terdaftar
                                </span>
                                <span className="inline-flex items-center gap-1.5 bg-orange-50 border border-orange-200 px-3 py-1 rounded-lg text-[10px] font-black text-orange-600 uppercase tracking-widest">
                                    <Clock size={12} /> {users.filter(u => u.status === 'pending').length} Pending
                                </span>
                            </div>
                        </div>
                    </header>

                    {/* TABLE */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
                                <Loader2 size={18} className="animate-spin" />
                                <span className="text-xs font-bold uppercase tracking-widest">Memuat...</span>
                            </div>
                        ) : users.length === 0 ? (
                            <div className="text-center py-16">
                                <Users size={40} className="text-slate-200 mx-auto mb-3" />
                                <p className="text-sm font-bold text-slate-400">Belum ada akun terdaftar</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200">
                                            <th className="text-left px-3 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">No</th>
                                            <th className="text-left px-3 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Nama Akun</th>
                                            <th className="text-left px-3 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Email</th>
                                            <th className="text-left px-3 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Password</th>
                                            <th className="text-left px-3 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Unit SPPG</th>
                                            <th className="text-left px-3 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                                            <th className="text-left px-3 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((user, index) => (
                                            <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                                <td className="px-3 py-2 font-bold text-slate-400">{index + 1}</td>
                                                <td className="px-3 py-2 font-bold text-slate-800">{getNamaAkun(user)}</td>
                                                <td className="px-3 py-2 text-slate-600">{user.email || '-'}</td>
                                                <td className="px-3 py-2 text-slate-400 tracking-wider">••••••••</td>
                                                <td className="px-3 py-2 text-slate-500">{getUnitName(user)}</td>
                                                <td className="px-3 py-2">
                                                    {user.status === 'aktif' ? (
                                                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 rounded-full px-2.5 py-0.5 text-[11px] font-bold">
                                                            <CheckCircle2 size={11} /> Aktif
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 rounded-full px-2.5 py-0.5 text-[11px] font-bold">
                                                            <Clock size={11} /> Pending
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <div className="flex items-center gap-2">
                                                        {user.status === 'pending' && (
                                                            <button
                                                                onClick={() => handleApproveUser(user.id)}
                                                                disabled={approving === user.id}
                                                                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm"
                                                            >
                                                                {approving === user.id ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
                                                                ACC
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => openEdit(user)}
                                                            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm"
                                                        >
                                                            <Pencil size={12} /> Edit
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* ============================================ */}
            {/* EDIT MODAL                                   */}
            {/* ============================================ */}
            {editUser && (
                <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setEditUser(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg" onClick={e => e.stopPropagation()}>

                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                            <h3 className="text-lg font-black text-slate-900 italic tracking-tighter uppercase">Edit Akun</h3>
                            <button onClick={() => setEditUser(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-700">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Nama Akun</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                    value={editForm.nama}
                                    onChange={e => setEditForm({ ...editForm, nama: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Email</label>
                                <input
                                    type="email"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                    value={editForm.email}
                                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Password</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                    value={editForm.password}
                                    onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Unit SPPG</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                    value={editForm.nama_unit}
                                    onChange={e => setEditForm({ ...editForm, nama_unit: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
                            <button onClick={() => setEditUser(null)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-all">
                                Batal
                            </button>
                            <button
                                onClick={handleUpdateUser}
                                disabled={saving}
                                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                {saving ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
