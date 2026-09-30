'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Bell,
  Send,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Home,
  Clock,
  Settings,
  Trash2,
  Edit3,
  X,
  Wallet as WalletIcon,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ChevronRight,
  User,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Wallet {
  id: string;
  nama_akun: string;
  saldo_sekarang: number;
}

interface Transaction {
  id: string;
  wallet_id: string;
  tipe: 'pemasukan' | 'pengeluaran';
  nominal: number;
  keterangan: string;
  created_at: string;
}

export default function MobileBankingFinancePage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Tab: 'home' | 'cards'
  const [activeTab, setActiveTab] = useState<'home' | 'cards'>('home');

  // Modal State Transaksi Cepat
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState('');
  const [tipe, setTipe] = useState<'pengeluaran' | 'pemasukan'>('pengeluaran');
  const [nominal, setNominal] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [submittingTx, setSubmittingTx] = useState(false);

  // Modal State Edit Dompet
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [editNama, setEditNama] = useState('');
  const [editSaldo, setEditSaldo] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Modal State Tambah Dompet
  const [isAddWalletModalOpen, setIsAddWalletModalOpen] = useState(false);
  const [namaDompetBaru, setNamaDompetBaru] = useState('');
  const [saldoAwalBaru, setSaldoAwalBaru] = useState('');
  const [submittingWallet, setSubmittingWallet] = useState(false);

  // Filter Transactions: 'all' | 'pemasukan' | 'pengeluaran'
  const [txFilter, setTxFilter] = useState<'all' | 'pemasukan' | 'pengeluaran'>('all');

  // Format IDR Helper
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // 1. Load Data Supabase
  const loadData = async () => {
    try {
      setLoading(true);
      const { data: wData, error: wErr } = await supabase
        .from('fin_wallets')
        .select('*')
        .order('created_at', { ascending: true });

      if (wErr) throw wErr;
      const loadedWallets = wData || [];
      setWallets(loadedWallets);

      if (loadedWallets.length > 0) {
        if (!selectedWalletId || !loadedWallets.some((w) => w.id === selectedWalletId)) {
          setSelectedWalletId(loadedWallets[0].id);
        }
      } else {
        setSelectedWalletId('');
      }

      const { data: tData, error: tErr } = await supabase
        .from('fin_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (tErr) throw tErr;
      setTransactions(tData || []);
    } catch (err: any) {
      alert('Gagal memuat data keuangan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 2. Total Saldo Utama
  const totalSaldoUtama = wallets.reduce((acc, w) => acc + Number(w.saldo_sekarang || 0), 0);

  // 3. Simpan Transaksi
  const handleSimpanTransaksi = async (e: React.FormEvent) => {
    e.preventDefault();
    const angkaNominal = Number(nominal);
    if (!angkaNominal || angkaNominal <= 0) {
      alert('Masukkan nominal transaksi yang valid');
      return;
    }
    if (!selectedWalletId) {
      alert('Silakan pilih dompet sumber/tujuan');
      return;
    }

    setSubmittingTx(true);
    try {
      const dompetTerkait = wallets.find((w) => w.id === selectedWalletId);
      if (!dompetTerkait) throw new Error('Dompet tidak ditemukan');

      const saldoBaru =
        tipe === 'pengeluaran'
          ? Number(dompetTerkait.saldo_sekarang) - angkaNominal
          : Number(dompetTerkait.saldo_sekarang) + angkaNominal;

      const { error: insErr } = await supabase.from('fin_transactions').insert([
        {
          wallet_id: selectedWalletId,
          tipe,
          nominal: angkaNominal,
          keterangan: keterangan || (tipe === 'pengeluaran' ? 'Pengeluaran' : 'Pemasukan'),
        },
      ]);
      if (insErr) throw insErr;

      const { error: updErr } = await supabase
        .from('fin_wallets')
        .update({ saldo_sekarang: saldoBaru })
        .eq('id', selectedWalletId);
      if (updErr) throw updErr;

      setNominal('');
      setKeterangan('');
      setIsTxModalOpen(false);
      await loadData();
      alert(`Berhasil mencatat ${tipe}!`);
    } catch (err: any) {
      alert('Error saat menyimpan transaksi: ' + err.message);
    } finally {
      setSubmittingTx(false);
    }
  };

  // 4. Tambah Dompet Baru
  const handleTambahDompet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaDompetBaru.trim()) return;

    setSubmittingWallet(true);
    try {
      const { error } = await supabase.from('fin_wallets').insert([
        {
          nama_akun: namaDompetBaru.trim(),
          saldo_sekarang: Number(saldoAwalBaru) || 0,
        },
      ]);
      if (error) throw error;

      setNamaDompetBaru('');
      setSaldoAwalBaru('');
      setIsAddWalletModalOpen(false);
      await loadData();
      alert('Dompet berhasil dibuat!');
    } catch (err: any) {
      alert('Gagal menambah dompet: ' + err.message);
    } finally {
      setSubmittingWallet(false);
    }
  };

  // 5. Simpan Edit Dompet
  const handleSimpanEditDompet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWallet) return;

    setSavingEdit(true);
    try {
      const { error } = await supabase
        .from('fin_wallets')
        .update({
          nama_akun: editNama.trim(),
          saldo_sekarang: Number(editSaldo) || 0,
        })
        .eq('id', editingWallet.id);

      if (error) throw error;
      alert('Perubahan dompet berhasil disimpan!');
      setEditingWallet(null);
      await loadData();
    } catch (err: any) {
      alert('Gagal memperbarui dompet: ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  // 6. Hapus Dompet
  const handleHapusDompet = async (walletId: string) => {
    if (!window.confirm('Yakin ingin menghapus dompet ini? Seluruh riwayat transaksi terkait akan terhapus.')) {
      return;
    }

    try {
      const { error } = await supabase.from('fin_wallets').delete().eq('id', walletId);
      if (error) throw error;

      alert('Dompet berhasil dihapus!');
      setEditingWallet(null);
      await loadData();
    } catch (err: any) {
      alert('Gagal menghapus dompet: ' + err.message);
    }
  };

  // 7. Hapus Transaksi & Reversal Saldo Otomatis
  const handleHapusTransaksi = async (t: Transaction) => {
    if (
      !window.confirm(
        `Hapus transaksi "${t.keterangan}" (${formatRupiah(Number(t.nominal))})?\nSaldo dompet akan disesuaikan kembali.`
      )
    ) {
      return;
    }

    try {
      const dompetTerkait = wallets.find((w) => w.id === t.wallet_id);
      if (dompetTerkait) {
        const saldoSekarang = Number(dompetTerkait.saldo_sekarang || 0);
        const nominalTx = Number(t.nominal || 0);
        const saldoBaru =
          t.tipe === 'pengeluaran' ? saldoSekarang + nominalTx : saldoSekarang - nominalTx;

        const { error: updErr } = await supabase
          .from('fin_wallets')
          .update({ saldo_sekarang: saldoBaru })
          .eq('id', t.wallet_id);

        if (updErr) throw updErr;
      }

      const { error: delErr } = await supabase.from('fin_transactions').delete().eq('id', t.id);
      if (delErr) throw delErr;

      alert('Transaksi berhasil dihapus & saldo telah dikembalikan!');
      await loadData();
    } catch (err: any) {
      alert('Gagal hapus transaksi: ' + err.message);
    }
  };

  // Filter Transaksi
  const filteredTransactions = transactions.filter((t) => {
    if (txFilter === 'pemasukan') return t.tipe === 'pemasukan';
    if (txFilter === 'pengeluaran') return t.tipe === 'pengeluaran';
    return true;
  });

  // Grouping Transaksi Hari Ini vs Sebelumnya
  const isToday = (dateString: string) => {
    const today = new Date();
    const d = new Date(dateString);
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  const todayTx = filteredTransactions.filter((t) => isToday(t.created_at));
  const earlierTx = filteredTransactions.filter((t) => !isToday(t.created_at));

  if (loading) {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-300">Memuat Royal Financial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-900 text-slate-800 dark:text-slate-100 shadow-2xl overflow-hidden relative pb-28 font-sans selection:bg-blue-500 selection:text-white">
      {/* 1. ROYAL BLUE CURVED HEADER */}
      <div className="bg-gradient-to-b from-blue-700 via-blue-800 to-indigo-900 text-white pt-8 pb-14 px-6 relative overflow-hidden">
        {/* Decorative Glass Glows */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-400/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-20 -left-12 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none"></div>

        {/* Top User Bar */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white font-bold text-sm shadow-inner">
              SH
            </div>
            <div>
              <p className="text-[11px] text-blue-200 font-medium leading-none">Selamat Datang 👋</p>
              <h2 className="text-sm font-semibold text-white mt-1 leading-none">Sayyid Haq</h2>
            </div>
          </div>
          <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition active:scale-95">
            <Bell size={18} />
          </button>
        </div>

        {/* Available Balance Card */}
        <div className="mt-6 relative z-10">
          <p className="text-xs font-medium text-blue-200 tracking-wide uppercase">Total Saldo Utama</p>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1 text-white">
            {formatRupiah(totalSaldoUtama)}
          </h1>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-2 py-0.5 rounded-full font-medium">
              <Sparkles size={12} /> {wallets.length} Dompet Connected
            </span>
          </div>
        </div>

        {/* Quick Action Capsules */}
        <div className="grid grid-cols-4 gap-2.5 mt-6 relative z-10">
          {/* Transfer */}
          <button
            onClick={() => alert('Fitur Transfer Antar-Rekening siap digunakan.')}
            className="bg-white/15 backdrop-blur-md p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 hover:bg-white/25 active:scale-95 transition-all text-xs font-medium text-white border border-white/10 group shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition">
              <Send size={16} />
            </div>
            <span className="text-[11px]">Kirim</span>
          </button>

          {/* Pemasukan */}
          <button
            onClick={() => {
              setTipe('pemasukan');
              setIsTxModalOpen(true);
            }}
            className="bg-white/15 backdrop-blur-md p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 hover:bg-white/25 active:scale-95 transition-all text-xs font-medium text-white border border-white/10 group shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/30 flex items-center justify-center text-emerald-300 group-hover:bg-emerald-500/40 transition">
              <ArrowDownLeft size={16} />
            </div>
            <span className="text-[11px]">Terima</span>
          </button>

          {/* Pengeluaran */}
          <button
            onClick={() => {
              setTipe('pengeluaran');
              setIsTxModalOpen(true);
            }}
            className="bg-white/15 backdrop-blur-md p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 hover:bg-white/25 active:scale-95 transition-all text-xs font-medium text-white border border-white/10 group shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-red-500/30 flex items-center justify-center text-red-300 group-hover:bg-red-500/40 transition">
              <ArrowUpRight size={16} />
            </div>
            <span className="text-[11px]">Bayar</span>
          </button>

          {/* + Dompet */}
          <button
            onClick={() => setIsAddWalletModalOpen(true)}
            className="bg-white/15 backdrop-blur-md p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 hover:bg-white/25 active:scale-95 transition-all text-xs font-medium text-white border border-white/10 group shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition">
              <Plus size={16} />
            </div>
            <span className="text-[11px]">+ Dompet</span>
          </button>
        </div>
      </div>

      {/* 2. CURVED WHITE SHEET CANVAS */}
      <div className="bg-slate-50 dark:bg-slate-900 rounded-t-[32px] -mt-6 pt-6 px-5 min-h-[520px] space-y-5 relative z-10 shadow-inner">
        {/* Tab Switcher: Home vs Your Cards */}
        <div className="flex bg-slate-200/80 dark:bg-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition ${
              activeTab === 'home'
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Aktivitas Transaksi
          </button>
          <button
            onClick={() => setActiveTab('cards')}
            className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition ${
              activeTab === 'cards'
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Kartu & Dompet ({wallets.length})
          </button>
        </div>

        {/* TAB 1: HOME (TRANSACTIONS) */}
        {activeTab === 'home' && (
          <div className="space-y-4">
            {/* Header & Filter Pills */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Recent Transactions</h3>
              <div className="flex gap-1 bg-slate-200/60 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setTxFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                    txFilter === 'all'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setTxFilter('pemasukan')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                    txFilter === 'pemasukan'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  Income
                </button>
                <button
                  onClick={() => setTxFilter('pengeluaran')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                    txFilter === 'pengeluaran'
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  Expense
                </button>
              </div>
            </div>

            {/* List Grouped Transactions */}
            {filteredTransactions.length === 0 ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500 space-y-2">
                <Clock size={36} className="mx-auto opacity-40" />
                <p className="text-xs font-medium">Belum ada aktivitas transaksi.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* TODAY SECTION */}
                {todayTx.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase px-1">
                      Hari Ini (Today)
                    </p>
                    <div className="space-y-2">
                      {todayTx.map((t) => {
                        const dompet = wallets.find((w) => w.id === t.wallet_id);
                        return (
                          <div
                            key={t.id}
                            className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 flex items-center justify-between transition hover:shadow-md"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                                  t.tipe === 'pemasukan'
                                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                                    : 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400'
                                }`}
                              >
                                {t.tipe === 'pemasukan' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {t.keterangan}
                                </h4>
                                <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5">
                                  {dompet?.nama_akun || 'Dompet'} •{' '}
                                  {new Date(t.created_at).toLocaleTimeString('id-ID', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`font-extrabold text-xs ${
                                  t.tipe === 'pemasukan'
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-slate-900 dark:text-white'
                                }`}
                              >
                                {t.tipe === 'pemasukan' ? '+' : '-'}
                                {formatRupiah(Number(t.nominal))}
                              </span>
                              <button
                                onClick={() => handleHapusTransaksi(t)}
                                className="text-slate-300 hover:text-red-500 p-1 rounded-lg transition"
                                title="Hapus Transaksi"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* EARLIER SECTION */}
                {earlierTx.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase px-1">
                      Kemarin / Sebelumnya
                    </p>
                    <div className="space-y-2">
                      {earlierTx.map((t) => {
                        const dompet = wallets.find((w) => w.id === t.wallet_id);
                        return (
                          <div
                            key={t.id}
                            className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 flex items-center justify-between transition hover:shadow-md"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                                  t.tipe === 'pemasukan'
                                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                                    : 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400'
                                }`}
                              >
                                {t.tipe === 'pemasukan' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {t.keterangan}
                                </h4>
                                <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5">
                                  {dompet?.nama_akun || 'Dompet'} •{' '}
                                  {new Date(t.created_at).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                  })}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`font-extrabold text-xs ${
                                  t.tipe === 'pemasukan'
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-slate-900 dark:text-white'
                                }`}
                              >
                                {t.tipe === 'pemasukan' ? '+' : '-'}
                                {formatRupiah(Number(t.nominal))}
                              </span>
                              <button
                                onClick={() => handleHapusTransaksi(t)}
                                className="text-slate-300 hover:text-red-500 p-1 rounded-lg transition"
                                title="Hapus Transaksi"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: YOUR CARDS (KELOLA DOMPET) */}
        {activeTab === 'cards' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Kartu & Dompet Aktif</h3>
              <button
                onClick={() => setIsAddWalletModalOpen(true)}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <Plus size={14} /> Tambah Dompet
              </button>
            </div>

            {/* List Digital Physical Cards */}
            <div className="space-y-4">
              {wallets.map((w, idx) => (
                <div
                  key={w.id}
                  onClick={() => setSelectedWalletId(w.id)}
                  className={`bg-gradient-to-br ${
                    idx % 2 === 0
                      ? 'from-slate-900 via-indigo-950 to-blue-900'
                      : 'from-blue-900 via-indigo-900 to-slate-900'
                  } text-white rounded-3xl p-5 shadow-xl relative overflow-hidden aspect-[1.7/1] flex flex-col justify-between cursor-pointer border-2 transition ${
                    selectedWalletId === w.id ? 'border-blue-400 ring-2 ring-blue-400/30' : 'border-transparent'
                  }`}
                >
                  {/* Decorative Card Background Graphic */}
                  <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">
                        DOMPET / REKENING
                      </span>
                      <h4 className="text-lg font-extrabold text-white mt-0.5">{w.nama_akun}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedWalletId === w.id && (
                        <span className="text-[9px] bg-blue-500 text-white px-2 py-0.5 rounded-full font-bold uppercase">
                          Dipilih
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingWallet(w);
                          setEditNama(w.nama_akun);
                          setEditSaldo(String(w.saldo_sekarang));
                        }}
                        className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition backdrop-blur-md"
                        title="Edit Dompet"
                      >
                        <Edit3 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* EMV Chip Simulation */}
                  <div className="relative z-10 my-1">
                    <div className="w-9 h-7 rounded-md bg-gradient-to-tr from-amber-300 via-amber-200 to-yellow-500 border border-amber-400/60 shadow-sm flex items-center justify-center">
                      <div className="w-full h-full border border-amber-600/30 rounded flex flex-col justify-around p-0.5">
                        <div className="h-0.5 bg-amber-700/30 w-full"></div>
                        <div className="h-0.5 bg-amber-700/30 w-full"></div>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10">
                    <p className="text-[11px] text-blue-200 font-mono tracking-widest">
                      •••• •••• •••• {w.id.substring(0, 4).toUpperCase()}
                    </p>
                    <div className="flex justify-between items-end mt-2">
                      <div>
                        <p className="text-[9px] text-blue-300 uppercase font-medium">Saldo Dompet</p>
                        <p className="text-xl font-extrabold text-white">
                          {formatRupiah(Number(w.saldo_sekarang))}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-white/70 italic">Royal Financial</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. BOTTOM FLOATING NAVIGATION BAR */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-40 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xl px-6 py-2 rounded-full flex justify-between items-center">
        <button
          onClick={() => setActiveTab('home')}
          className={`p-2 rounded-full transition ${
            activeTab === 'home' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600'
          }`}
          title="Beranda"
        >
          <Home size={22} />
        </button>

        <button
          onClick={() => setActiveTab('cards')}
          className={`p-2 rounded-full transition ${
            activeTab === 'cards' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600'
          }`}
          title="Kartu & Dompet"
        >
          <CreditCard size={22} />
        </button>

        {/* Center Floating Plus Button */}
        <button
          onClick={() => {
            setTipe('pengeluaran');
            setIsTxModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white p-3.5 rounded-full shadow-lg shadow-blue-500/40 transition-all -mt-7 border-4 border-slate-50 dark:border-slate-900"
          title="Catat Transaksi Cepat"
        >
          <Plus size={22} />
        </button>

        <button
          onClick={() => setIsAddWalletModalOpen(true)}
          className="p-2 rounded-full text-slate-400 hover:text-slate-600 transition"
          title="+ Dompet"
        >
          <WalletIcon size={22} />
        </button>

        <button
          onClick={() => alert('Fitur Pengaturan Keuangan.')}
          className="p-2 rounded-full text-slate-400 hover:text-slate-600 transition"
          title="Pengaturan"
        >
          <Settings size={22} />
        </button>
      </div>

      {/* MODAL 1: CATAT TRANSAKSI */}
      {isTxModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-800 rounded-t-[32px] sm:rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex justify-between items-center border-b dark:border-slate-700 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Catat Transaksi Baru
              </h3>
              <button
                onClick={() => setIsTxModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Toggle Tipe */}
            <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setTipe('pengeluaran')}
                className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition ${
                  tipe === 'pengeluaran'
                    ? 'bg-red-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                📉 Pengeluaran
              </button>
              <button
                type="button"
                onClick={() => setTipe('pemasukan')}
                className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition ${
                  tipe === 'pemasukan'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                📈 Pemasukan
              </button>
            </div>

            <form onSubmit={handleSimpanTransaksi} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                  PILIH DOMPET TUJUAN
                </label>
                <select
                  value={selectedWalletId}
                  onChange={(e) => setSelectedWalletId(e.target.value)}
                  className="w-full mt-1 p-3 border dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.nama_akun} ({formatRupiah(Number(w.saldo_sekarang))})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                  NOMINAL (RP)
                </label>
                <input
                  type="number"
                  placeholder="Contoh: 50000"
                  value={nominal}
                  onChange={(e) => setNominal(e.target.value)}
                  className="w-full mt-1 p-3 border dark:border-slate-700 rounded-2xl text-lg font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                  KETERANGAN
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Makan Siang / Pembayaran Listrik"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  className="w-full mt-1 p-3 border dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submittingTx}
                className={`w-full py-3.5 rounded-2xl font-bold text-xs text-white transition shadow-lg ${
                  tipe === 'pengeluaran'
                    ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30'
                }`}
              >
                {submittingTx
                  ? 'Menyimpan...'
                  : `Simpan ${tipe === 'pengeluaran' ? 'Pengeluaran' : 'Pemasukan'}`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT DOMPET */}
      {editingWallet && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-in zoom-in duration-150">
            <div className="flex justify-between items-center border-b dark:border-slate-700 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Edit / Sunting Dompet
              </h3>
              <button
                onClick={() => setEditingWallet(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSimpanEditDompet} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                  NAMA DOMPET / REKENING
                </label>
                <input
                  type="text"
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  className="w-full mt-1 p-3 border dark:border-slate-700 rounded-2xl font-semibold text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-900"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                  SALDO SEKARANG (KOREKSI SALDO)
                </label>
                <input
                  type="number"
                  value={editSaldo}
                  onChange={(e) => setEditSaldo(e.target.value)}
                  className="w-full mt-1 p-3 border dark:border-slate-700 rounded-2xl font-bold text-base text-slate-900 dark:text-white bg-white dark:bg-slate-900"
                  required
                />
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-bold text-xs shadow-lg shadow-blue-500/30 transition"
                >
                  {savingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleHapusDompet(editingWallet.id)}
                    className="flex-1 bg-red-100 dark:bg-red-950 hover:bg-red-200 text-red-600 dark:text-red-400 py-2.5 rounded-2xl text-xs font-bold transition"
                  >
                    🗑️ Hapus Dompet
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingWallet(null)}
                    className="flex-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 py-2.5 rounded-2xl text-xs font-bold transition"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: TAMBAH DOMPET BARU */}
      {isAddWalletModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-in zoom-in duration-150">
            <div className="flex justify-between items-center border-b dark:border-slate-700 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Tambah Dompet / Bank Baru
              </h3>
              <button
                onClick={() => setIsAddWalletModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleTambahDompet} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                  NAMA DOMPET (CTH: BNI UTAMA / GOPAY)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: BCA Tabungan"
                  value={namaDompetBaru}
                  onChange={(e) => setNamaDompetBaru(e.target.value)}
                  className="w-full mt-1 p-3 border dark:border-slate-700 rounded-2xl font-semibold text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-900"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                  SALDO AWAL (RP)
                </label>
                <input
                  type="number"
                  placeholder="Contoh: 1000000"
                  value={saldoAwalBaru}
                  onChange={(e) => setSaldoAwalBaru(e.target.value)}
                  className="w-full mt-1 p-3 border dark:border-slate-700 rounded-2xl font-bold text-base text-slate-900 dark:text-white bg-white dark:bg-slate-900"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submittingWallet}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-bold text-xs shadow-lg shadow-blue-500/30 transition"
                >
                  {submittingWallet ? 'Membuat...' : '+ Buat Dompet'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddWalletModalOpen(false)}
                  className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 px-4 py-3 rounded-2xl text-xs font-bold transition"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
