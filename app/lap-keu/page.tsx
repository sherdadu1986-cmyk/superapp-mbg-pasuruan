'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard, 
  Plus, 
  Trash2, 
  Bell, 
  Home, 
  Clock, 
  SlidersHorizontal,
  ChevronRight,
  Send,
  Download,
  Wallet as WalletIcon,
  Lock,
  ArrowLeft,
  Search,
  CheckCircle2,
  ShieldCheck,
  Edit3,
  X,
  TrendingUp,
  TrendingDown,
  User,
  LogOut,
  Check,
  Upload,
  Image as ImageIcon
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Wallet {
  id: string;
  nama_akun: string;
  saldo_sekarang: number;
  warna?: string;
  logo_url?: string;
}

interface Transaction {
  id: string;
  wallet_id: string;
  tipe: 'pemasukan' | 'pengeluaran';
  nominal: number;
  keterangan: string;
  created_at: string;
}

const COLOR_PALETTES = [
  { id: 'navy', label: 'Navy Blue', class: 'bg-gradient-to-tr from-slate-900 via-blue-950 to-slate-800' },
  { id: 'teal', label: 'Teal Emerald', class: 'bg-gradient-to-tr from-teal-900 via-emerald-950 to-slate-900' },
  { id: 'orange', label: 'Sunset Orange', class: 'bg-gradient-to-tr from-orange-600 via-amber-700 to-slate-900' },
  { id: 'purple', label: 'Royal Purple', class: 'bg-gradient-to-tr from-purple-900 via-indigo-950 to-slate-900' },
  { id: 'black', label: 'Obsidian Black', class: 'bg-gradient-to-tr from-zinc-900 via-neutral-900 to-black' },
];

export default function MobileBankingFinance() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Navigation Tab State
  const [currentTab, setCurrentTab] = useState<'home' | 'history' | 'cards' | 'settings'>('home');
  
  // Filter & Search History
  const [historySearch, setHistorySearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  
  // Modal Transaksi & Form
  const [showTrxModal, setShowTrxModal] = useState(false);
  const [trxType, setTrxType] = useState<'pengeluaran' | 'pemasukan'>('pengeluaran');
  const [selectedWalletId, setSelectedWalletId] = useState('');
  const [nominal, setNominal] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [submittingTrx, setSubmittingTrx] = useState(false);

  // Modal Tambah Dompet
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletName, setWalletName] = useState('');
  const [walletBalance, setWalletBalance] = useState('');
  const [submittingWallet, setSubmittingWallet] = useState(false);

  // Modal Edit Dompet (dengan Logo & Warna)
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [editWalletName, setEditWalletName] = useState('');
  const [editWalletBalance, setEditWalletBalance] = useState('');
  const [editWalletColor, setEditWalletColor] = useState('navy');
  const [editWalletLogo, setEditWalletLogo] = useState('');
  const [submittingEditWallet, setSubmittingEditWallet] = useState(false);

  const loadData = async () => {
    try {
      const { data: wData } = await supabase
        .from('fin_wallets')
        .select('*')
        .order('created_at', { ascending: true });
      if (wData) {
        setWallets(wData);
        if (!selectedWalletId && wData.length > 0) setSelectedWalletId(wData[0].id);
      }

      const { data: tData } = await supabase
        .from('fin_transactions')
        .select('*')
        .order('created_at', { ascending: false });
      if (tData) setTransactions(tData);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalSaldo = wallets.reduce((acc, w) => acc + Number(w.saldo_sekarang || 0), 0);

  // Helper Gradien Kartu
  const getCardGradientClass = (colorKey?: string, idx: number = 0) => {
    const palette = COLOR_PALETTES.find((p) => p.id === colorKey);
    if (palette) return palette.class;
    return COLOR_PALETTES[idx % COLOR_PALETTES.length].class;
  };

  // Simpan Transaksi Baru
  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNominal = Number(nominal);
    if (!cleanNominal || !selectedWalletId) return;

    setSubmittingTrx(true);
    try {
      const currentWallet = wallets.find(w => w.id === selectedWalletId);
      if (!currentWallet) return;

      const newBalance = trxType === 'pengeluaran'
        ? Number(currentWallet.saldo_sekarang) - cleanNominal
        : Number(currentWallet.saldo_sekarang) + cleanNominal;

      await supabase.from('fin_transactions').insert([{
        wallet_id: selectedWalletId,
        tipe: trxType,
        nominal: cleanNominal,
        keterangan: keterangan || (trxType === 'pengeluaran' ? 'Pengeluaran' : 'Pemasukan')
      }]);

      await supabase.from('fin_wallets')
        .update({ saldo_sekarang: newBalance })
        .eq('id', selectedWalletId);

      setNominal('');
      setKeterangan('');
      setShowTrxModal(false);
      loadData();
    } finally {
      setSubmittingTrx(false);
    }
  };

  // Hapus Transaksi & Reversal Saldo
  const handleDeleteTransaction = async (trx: Transaction) => {
    if (!confirm(`Hapus transaksi "${trx.keterangan}"? Saldo akan dikembalikan secara otomatis.`)) return;
    const currentWallet = wallets.find(w => w.id === trx.wallet_id);
    if (currentWallet) {
      const restoredBalance = trx.tipe === 'pengeluaran'
        ? Number(currentWallet.saldo_sekarang) + Number(trx.nominal)
        : Number(currentWallet.saldo_sekarang) - Number(trx.nominal);

      await supabase.from('fin_wallets')
        .update({ saldo_sekarang: restoredBalance })
        .eq('id', trx.wallet_id);
    }
    await supabase.from('fin_transactions').delete().eq('id', trx.id);
    loadData();
  };

  // Tambah Dompet Baru
  const handleAddWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletName.trim()) return;

    setSubmittingWallet(true);
    try {
      await supabase.from('fin_wallets').insert([{
        nama_akun: walletName.trim(),
        saldo_sekarang: Number(walletBalance) || 0
      }]);
      setWalletName('');
      setWalletBalance('');
      setShowWalletModal(false);
      loadData();
    } finally {
      setSubmittingWallet(false);
    }
  };

  // Select File Logo PNG
  const handleLogoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'image/png') {
      alert('Hanya file format PNG transparan yang diperbolehkan!');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setEditWalletLogo(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Buka Modal Edit Kartu
  const handleOpenEditWallet = (w: Wallet) => {
    setEditingWallet(w);
    setEditWalletName(w.nama_akun);
    setEditWalletBalance(String(w.saldo_sekarang));
    setEditWalletColor(w.warna || 'navy');
    setEditWalletLogo(w.logo_url || '');
  };

  // Edit Dompet Simpan (Update Supabase)
  const handleUpdateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWallet || !editWalletName.trim()) return;

    setSubmittingEditWallet(true);
    try {
      const payload: any = {
        nama_akun: editWalletName.trim(),
        saldo_sekarang: Number(editWalletBalance) || 0,
        warna: editWalletColor,
        logo_url: editWalletLogo,
      };

      const { error } = await supabase
        .from('fin_wallets')
        .update(payload)
        .eq('id', editingWallet.id);

      if (error) {
        console.warn('Fallback update for core fields if custom columns missing in DB schema:', error.message);
        await supabase
          .from('fin_wallets')
          .update({
            nama_akun: editWalletName.trim(),
            saldo_sekarang: Number(editWalletBalance) || 0,
          })
          .eq('id', editingWallet.id);
      }

      setEditingWallet(null);
      await loadData();
    } catch (err: any) {
      alert('Gagal memperbarui dompet: ' + err.message);
    } finally {
      setSubmittingEditWallet(false);
    }
  };

  // Hapus Dompet
  const handleDeleteWallet = async (walletId: string) => {
    if (wallets.length <= 1) {
      alert('Anda harus menyisakan minimal 1 dompet/rekening aktif.');
      return;
    }
    if (!confirm('Yakin ingin menghapus dompet ini beserta seluruh riwayat transaksinya?')) return;

    await supabase.from('fin_wallets').delete().eq('id', walletId);
    if (selectedWalletId === walletId) {
      const remaining = wallets.filter(w => w.id !== walletId);
      if (remaining.length > 0) setSelectedWalletId(remaining[0].id);
    }
    setEditingWallet(null);
    loadData();
  };

  // Lock Session
  const handleLockSession = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('lap_keu_auth_token');
      window.location.reload();
    }
  };

  // Filter & Search Transaksi untuk History
  const filteredTransactions = transactions.filter(t => {
    const matchType =
      filterType === 'income' ? t.tipe === 'pemasukan' :
      filterType === 'expense' ? t.tipe === 'pengeluaran' : true;
    
    const matchSearch = t.keterangan.toLowerCase().includes(historySearch.toLowerCase());
    return matchType && matchSearch;
  });

  const totalIncome = filteredTransactions
    .filter(t => t.tipe === 'pemasukan')
    .reduce((sum, t) => sum + Number(t.nominal || 0), 0);

  const totalExpense = filteredTransactions
    .filter(t => t.tipe === 'pengeluaran')
    .reduce((sum, t) => sum + Number(t.nominal || 0), 0);

  return (
    <div className="min-h-screen bg-slate-900 flex justify-center py-0 sm:py-8 font-sans antialiased text-slate-800 w-full">
      {/* Container Layar HP Presisi */}
      <div className="w-full max-w-sm sm:max-w-md bg-white sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col min-h-screen sm:min-h-[844px] relative border border-slate-200/60">
        
        {/* 1. CURVED HEADER BIRU ROYAL */}
        <div className="bg-gradient-to-b from-[#1d4ed8] via-[#1e40af] to-[#1e3a8a] text-white px-6 pt-7 pb-12 rounded-b-[36px] shadow-md relative">
          
          {/* Baris System Navigation (SPPG BGN, Kunci, Bell) */}
          <div className="flex justify-between items-center mb-5">
            <Link
              href="/"
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1 backdrop-blur-sm transition"
              title="Kembali ke Dashboard BGN"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← SPPG BGN</span>
            </Link>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLockSession}
                className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1 backdrop-blur-sm transition"
                title="Kunci Dashboard (Logout PIN Sesi)"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Kunci</span>
              </button>

              <button 
                type="button"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center backdrop-blur-sm transition"
                title="Notifikasi"
              >
                <Bell className="w-4 h-4 text-white"/>
              </button>
            </div>
          </div>

          {/* Baris User Greeting */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center font-bold text-sm tracking-wider">
              SH
            </div>
            <div>
              <p className="text-xs text-blue-200 font-medium leading-tight">Selamat Datang 👋</p>
              <h4 className="text-sm font-semibold tracking-wide leading-tight">Sayyid Haq</h4>
            </div>
          </div>

          {/* Saldo Utama */}
          <div className="mb-6">
            <p className="text-xs text-blue-200/90 font-medium tracking-wide">Available Balance</p>
            <h1 className="text-3xl font-extrabold tracking-tight mt-0.5">
              Rp {totalSaldo.toLocaleString('id-ID')}
            </h1>
          </div>

          {/* 4 Tombol Aksi Kapsul Frosted Glass */}
          <div className="grid grid-cols-4 gap-2.5">
            <button 
              onClick={() => { setTrxType('pengeluaran'); setShowTrxModal(true); }}
              className="flex flex-col items-center justify-center bg-white/15 hover:bg-white/25 active:scale-95 transition-all backdrop-blur-md py-3 rounded-2xl border border-white/10 gap-1.5"
            >
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Send className="w-4 h-4 text-white"/>
              </div>
              <span className="text-[11px] font-medium text-white tracking-wide">Kirim</span>
            </button>

            <button 
              onClick={() => { setTrxType('pemasukan'); setShowTrxModal(true); }}
              className="flex flex-col items-center justify-center bg-white/15 hover:bg-white/25 active:scale-95 transition-all backdrop-blur-md py-3 rounded-2xl border border-white/10 gap-1.5"
            >
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Download className="w-4 h-4 text-white"/>
              </div>
              <span className="text-[11px] font-medium text-white tracking-wide">Terima</span>
            </button>

            <button 
              onClick={() => { setTrxType('pengeluaran'); setShowTrxModal(true); }}
              className="flex flex-col items-center justify-center bg-white/15 hover:bg-white/25 active:scale-95 transition-all backdrop-blur-md py-3 rounded-2xl border border-white/10 gap-1.5"
            >
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-white"/>
              </div>
              <span className="text-[11px] font-medium text-white tracking-wide">Bayar</span>
            </button>

            <button 
              onClick={() => setShowWalletModal(true)}
              className="flex flex-col items-center justify-center bg-white/15 hover:bg-white/25 active:scale-95 transition-all backdrop-blur-md py-3 rounded-2xl border border-white/10 gap-1.5"
            >
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Plus className="w-4 h-4 text-white"/>
              </div>
              <span className="text-[11px] font-medium text-white tracking-wide">+ Dompet</span>
            </button>
          </div>
        </div>

        {/* 2. LEMBAR KONTEN PUTIH BERSIH (LIGHT CANVAS) */}
        <div className="flex-1 bg-white px-5 pt-5 pb-24 space-y-5">
          
          {/* TAB 1: HOME (RINGKASAN & AKTIVITAS DINI) */}
          {currentTab === 'home' && (
            <>
              {/* Header Aktivitas Cepat */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-900 text-sm">Recent Transactions</h3>
                  <button 
                    onClick={() => setCurrentTab('history')}
                    className="text-xs text-blue-600 font-semibold hover:underline"
                  >
                    See all ({transactions.length})
                  </button>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => setFilterType('all')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${filterType === 'all' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                  >
                    All
                  </button>
                  <button 
                    onClick={() => setFilterType('income')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${filterType === 'income' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                  >
                    ● Income
                  </button>
                  <button 
                    onClick={() => setFilterType('expense')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${filterType === 'expense' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                  >
                    ● Expense
                  </button>
                </div>
              </div>

              {/* Daftar Transaksi Recent (Maks 5) */}
              <div className="space-y-2.5">
                <p className="text-[11px] font-bold text-slate-400 tracking-wider">HARI INI (TODAY)</p>
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-xs text-slate-400">Belum ada riwayat transaksi.</p>
                  </div>
                ) : (
                  filteredTransactions.slice(0, 5).map((trx) => {
                    const wallet = wallets.find(w => w.id === trx.wallet_id);
                    return (
                      <div 
                        key={trx.id} 
                        className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${trx.tipe === 'pemasukan' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                            {trx.tipe === 'pemasukan' ? <ArrowDownLeft className="w-5 h-5"/> : <ArrowUpRight className="w-5 h-5"/>}
                          </div>
                          <div>
                            <p className="font-semibold text-xs text-slate-900 leading-tight">{trx.keterangan}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {wallet?.nama_akun || 'Dompet'} • {new Date(trx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${trx.tipe === 'pemasukan' ? 'text-emerald-600' : 'text-slate-900'}`}>
                            {trx.tipe === 'pemasukan' ? '+' : '-'} Rp {Number(trx.nominal).toLocaleString('id-ID')}
                          </span>
                          <button 
                            onClick={() => handleDeleteTransaction(trx)}
                            className="text-slate-300 hover:text-red-500 transition p-1"
                            title="Hapus Transaksi"
                          >
                            <Trash2 className="w-3.5 h-3.5"/>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}

          {/* TAB 2: HISTORY (HALAMAN RIWAYAT LENGKAP & PENCARIAN) */}
          {currentTab === 'history' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-900 text-sm">Transaction History</h3>
                <span className="text-xs text-slate-400">{filteredTransactions.length} item</span>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Cari transaksi..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Filter Chips */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${filterType === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setFilterType('income')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${filterType === 'income' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  Pemasukan (+)
                </button>
                <button
                  onClick={() => setFilterType('expense')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${filterType === 'expense' ? 'bg-red-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  Pengeluaran (-)
                </button>
              </div>

              {/* Ringkasan Period Income vs Expense */}
              <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                <div className="bg-emerald-50/80 border border-emerald-100 p-2.5 rounded-xl">
                  <p className="text-[10px] text-emerald-600 font-bold uppercase">Total Pemasukan</p>
                  <p className="text-xs font-extrabold text-emerald-700 mt-0.5">+ Rp {totalIncome.toLocaleString('id-ID')}</p>
                </div>
                <div className="bg-red-50/80 border border-red-100 p-2.5 rounded-xl">
                  <p className="text-[10px] text-red-600 font-bold uppercase">Total Pengeluaran</p>
                  <p className="text-xs font-extrabold text-red-700 mt-0.5">- Rp {totalExpense.toLocaleString('id-ID')}</p>
                </div>
              </div>

              {/* Full Transaction List */}
              <div className="space-y-2.5">
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-xs text-slate-400">Tidak ada transaksi ditemukan.</p>
                  </div>
                ) : (
                  filteredTransactions.map((trx) => {
                    const wallet = wallets.find(w => w.id === trx.wallet_id);
                    return (
                      <div 
                        key={trx.id} 
                        className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${trx.tipe === 'pemasukan' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                            {trx.tipe === 'pemasukan' ? <ArrowDownLeft className="w-5 h-5"/> : <ArrowUpRight className="w-5 h-5"/>}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-xs text-slate-900 leading-tight truncate">{trx.keterangan}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {wallet?.nama_akun || 'Dompet'} • {new Date(trx.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} {new Date(trx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-xs font-bold ${trx.tipe === 'pemasukan' ? 'text-emerald-600' : 'text-slate-900'}`}>
                            {trx.tipe === 'pemasukan' ? '+' : '-'} Rp {Number(trx.nominal).toLocaleString('id-ID')}
                          </span>
                          <button 
                            onClick={() => handleDeleteTransaction(trx)}
                            className="text-slate-300 hover:text-red-500 transition p-1"
                            title="Hapus Transaksi (Reversal Saldo)"
                          >
                            <Trash2 className="w-3.5 h-3.5"/>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CARDS & WALLETS (MANAJEMEN KARTU/DOMPET CRUD) */}
          {currentTab === 'cards' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-900 text-sm">Your Cards & Accounts</h3>
                <button
                  onClick={() => setShowWalletModal(true)}
                  className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
                >
                  <Plus size={14} /> + Tambah Kartu
                </button>
              </div>

              {/* List Kartu Fisik Digital dengan Gradien Warna & Logo Custom */}
              <div className="space-y-4">
                {wallets.map((w, idx) => {
                  const gradientClass = getCardGradientClass(w.warna, idx);
                  return (
                    <div 
                      key={w.id}
                      className={`bg-gradient-to-tr ${gradientClass} text-white rounded-3xl p-5 shadow-lg relative overflow-hidden aspect-[1.7/1] flex flex-col justify-between`}
                    >
                      <div className="flex justify-between items-center relative z-10">
                        <span className="text-xs tracking-wider uppercase font-semibold text-blue-200">{w.nama_akun}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenEditWallet(w)}
                            className="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-[10px] font-bold backdrop-blur-md transition flex items-center gap-1 border border-white/20"
                            title="Edit Kartu & Logo"
                          >
                            <Edit3 size={11} /> Ubah
                          </button>
                          {wallets.length > 1 && (
                            <button
                              onClick={() => handleDeleteWallet(w.id)}
                              className="p-1 bg-red-500/30 hover:bg-red-500/50 rounded-lg text-red-200 transition border border-white/10"
                              title="Hapus Kartu"
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="my-auto relative z-10 flex justify-between items-center">
                        <p className="tracking-widest text-xs text-slate-300 font-mono">•••• •••• •••• {w.id.substring(0, 4).toUpperCase()}</p>
                        
                        {/* Custom PNG Logo atau Default FINORA */}
                        {w.logo_url ? (
                          <img src={w.logo_url} alt="Logo Bank" className="h-6 max-w-[80px] object-contain drop-shadow" />
                        ) : (
                          <span className="font-extrabold italic text-sm tracking-widest text-slate-200">FINORA</span>
                        )}
                      </div>

                      <div className="flex justify-between items-end relative z-10">
                        <div>
                          <p className="text-[10px] text-blue-200/80 uppercase">SALDO REKENING</p>
                          <p className="text-base font-bold text-white">Rp {Number(w.saldo_sekarang).toLocaleString('id-ID')}</p>
                        </div>
                        <span className="text-[10px] bg-white/20 px-2.5 py-0.5 rounded-full font-bold text-white tracking-wide border border-white/10">DEBIT</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: SETTINGS (PENGATURAN & STATUS) */}
          {currentTab === 'settings' && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Pengaturan Akun & Keamanan</h3>

              {/* Profile Card */}
              <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-base shadow-md">
                  SH
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Sayyid Haq</h4>
                  <p className="text-xs text-slate-500">Super Administrator</p>
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold mt-1">
                    <CheckCircle2 size={12} /> Online (Supabase Connected)
                  </span>
                </div>
              </div>

              {/* Account Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3.5 border border-slate-100 rounded-2xl shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Jumlah Dompet</p>
                  <p className="text-lg font-extrabold text-slate-900 mt-0.5">{wallets.length} Akun</p>
                </div>
                <div className="bg-white p-3.5 border border-slate-100 rounded-2xl shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Total Transaksi</p>
                  <p className="text-lg font-extrabold text-slate-900 mt-0.5">{transactions.length} Item</p>
                </div>
              </div>

              {/* Security PIN Status */}
              <div className="bg-indigo-50/80 border border-indigo-100 p-4 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                  <ShieldCheck size={16} className="text-indigo-600" />
                  <span>Proteksi Keamanan PIN Terpasang</span>
                </div>
                <p className="text-[11px] text-indigo-700 leading-relaxed">
                  Sesi ini dilindungi PIN 6-digit. Sesi akan otomatis berakhir begitu browser ditutup atau jika Anda menekan tombol Kunci.
                </p>
              </div>

              {/* Logout Lock Button */}
              <button
                type="button"
                onClick={handleLockSession}
                className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs border border-rose-200/80 rounded-2xl transition flex items-center justify-center gap-2"
              >
                <Lock size={15} />
                <span>🔒 Kunci Sesi Sekarang (Logout PIN)</span>
              </button>
            </div>
          )}

        </div>

        {/* 3. BOTTOM FLOATING NAVIGATION BAR (SINGLE SOURCE OF TRUTH) */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-xl rounded-full py-2.5 px-6 flex justify-between items-center z-40">
          {/* Home */}
          <button 
            onClick={() => setCurrentTab('home')} 
            className={`p-2 transition ${currentTab === 'home' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            title="Beranda"
          >
            <Home className="w-5 h-5"/>
          </button>
          
          {/* History */}
          <button 
            onClick={() => setCurrentTab('history')} 
            className={`p-2 transition ${currentTab === 'history' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            title="Riwayat Transaksi"
          >
            <Clock className="w-5 h-5"/>
          </button>

          {/* Tombol Plus Biru Menonjol di Tengah */}
          <button 
            onClick={() => { setTrxType('pengeluaran'); setShowTrxModal(true); }}
            className="w-11 h-11 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-full shadow-lg shadow-blue-500/40 flex items-center justify-center -mt-5 transition"
            title="Catat Transaksi Cepat"
          >
            <Plus className="w-6 h-6 stroke-[2.5]"/>
          </button>

          {/* Cards */}
          <button 
            onClick={() => setCurrentTab('cards')} 
            className={`p-2 transition ${currentTab === 'cards' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            title="Kartu & Rekening"
          >
            <CreditCard className="w-5 h-5"/>
          </button>

          {/* Settings */}
          <button 
            onClick={() => setCurrentTab('settings')} 
            className={`p-2 transition ${currentTab === 'settings' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            title="Pengaturan"
          >
            <SlidersHorizontal className="w-5 h-5"/>
          </button>
        </div>

        {/* MODAL 1: INPUT TRANSAKSI */}
        {showTrxModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white w-full max-w-sm rounded-t-[32px] sm:rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-900 text-base">Catat Transaksi</h3>
                <button onClick={() => setShowTrxModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">Tutup</button>
              </div>

              <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                <button 
                  onClick={() => setTrxType('pengeluaran')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${trxType === 'pengeluaran' ? 'bg-red-500 text-white' : 'text-slate-600'}`}
                >
                  Pengeluaran
                </button>
                <button 
                  onClick={() => setTrxType('pemasukan')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${trxType === 'pemasukan' ? 'bg-emerald-500 text-white' : 'text-slate-600'}`}
                >
                  Pemasukan
                </button>
              </div>

              <form onSubmit={handleSaveTransaction} className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500">DOMPET TUJUAN</label>
                  <select 
                    value={selectedWalletId} 
                    onChange={e => setSelectedWalletId(e.target.value)}
                    className="w-full mt-1 p-2.5 bg-slate-50 border rounded-xl text-xs font-medium"
                    required
                  >
                    {wallets.map(w => (
                      <option key={w.id} value={w.id}>{w.nama_akun} (Rp {Number(w.saldo_sekarang).toLocaleString('id-ID')})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-500">NOMINAL (RP)</label>
                  <input 
                    type="number" 
                    placeholder="Contoh: 50000"
                    value={nominal}
                    onChange={e => setNominal(e.target.value)}
                    className="w-full mt-1 p-2.5 bg-slate-50 border rounded-xl text-base font-bold"
                    required 
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-500">KETERANGAN</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Makan Siang / Gaji"
                    value={keterangan}
                    onChange={e => setKeterangan(e.target.value)}
                    className="w-full mt-1 p-2.5 bg-slate-50 border rounded-xl text-xs"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={submittingTrx}
                  className={`w-full py-3 rounded-xl font-bold text-white text-xs mt-2 transition ${trxType === 'pengeluaran' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                >
                  {submittingTrx ? 'Menyimpan...' : 'Simpan Transaksi'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: TAMBAH DOMPET BARU */}
        {showWalletModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white w-full max-w-sm rounded-t-[32px] sm:rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-900 text-base">Tambah Dompet / Bank</h3>
                <button onClick={() => setShowWalletModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">Tutup</button>
              </div>

              <form onSubmit={handleAddWallet} className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500">NAMA DOMPET / REKENING</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: BNI Utama, GoPay, Tunai"
                    value={walletName}
                    onChange={e => setWalletName(e.target.value)}
                    className="w-full mt-1 p-2.5 bg-slate-50 border rounded-xl text-xs"
                    required 
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-500">SALDO AWAL (RP)</label>
                  <input 
                    type="number" 
                    placeholder="0"
                    value={walletBalance}
                    onChange={e => setWalletBalance(e.target.value)}
                    className="w-full mt-1 p-2.5 bg-slate-50 border rounded-xl text-xs"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={submittingWallet}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs mt-2 transition"
                >
                  {submittingWallet ? 'Membuat...' : 'Simpan Dompet'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: EDIT KARTU / DOMPET (DENGAN UPLOAD LOGO PNG & PALETTE WARNA) */}
        {editingWallet && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white w-full max-w-sm rounded-t-[32px] sm:rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-slate-900 text-base">Edit Kartu & Logo Bank</h3>
                <button onClick={() => setEditingWallet(null)} className="text-slate-400 hover:text-slate-600 text-sm">Tutup</button>
              </div>

              <form onSubmit={handleUpdateWallet} className="space-y-4">
                {/* 1. Nama Dompet */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-500">NAMA DOMPET / BANK</label>
                  <input 
                    type="text" 
                    value={editWalletName}
                    onChange={e => setEditWalletName(e.target.value)}
                    className="w-full mt-1 p-2.5 bg-slate-50 border rounded-xl text-xs font-semibold text-slate-900"
                    required 
                  />
                </div>

                {/* 2. Upload Logo Bank (Wajib PNG) */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    LOGO BANK / DOMPET (WAJIB PNG TRANSPARAN)
                  </label>
                  <div className="flex items-center gap-3">
                    {/* Thumbnail Preview */}
                    <div className="w-12 h-12 rounded-xl border border-slate-200 flex items-center justify-center bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:8px_8px] bg-slate-100 shrink-0 overflow-hidden shadow-inner">
                      {editWalletLogo ? (
                        <img src={editWalletLogo} alt="Preview Logo" className="w-9 h-9 object-contain drop-shadow-sm" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-slate-400" />
                      )}
                    </div>

                    <div className="flex-1 space-y-1">
                      <input
                        type="file"
                        accept="image/png"
                        onChange={handleLogoFileSelect}
                        className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                      />
                      {editWalletLogo && (
                        <button
                          type="button"
                          onClick={() => setEditWalletLogo('')}
                          className="text-[10px] text-red-500 hover:underline font-semibold block"
                        >
                          Hapus Logo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Pilihan Tone Warna Kartu */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                    TONE WARNA GRADIEN KARTU
                  </label>
                  <div className="flex items-center justify-between gap-1.5 bg-slate-50 p-2 rounded-2xl border border-slate-200/80">
                    {COLOR_PALETTES.map((p) => {
                      const isSelected = editWalletColor === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setEditWalletColor(p.id)}
                          className={`w-9 h-9 rounded-full ${p.class} flex items-center justify-center transition-all ${
                            isSelected ? 'ring-2 ring-blue-600 ring-offset-2 scale-110 shadow-md' : 'opacity-80 hover:opacity-100'
                          }`}
                          title={p.label}
                        >
                          {isSelected && <Check className="w-4 h-4 text-white stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Saldo Sekarang */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-500">SALDO SEKARANG (KOREKSI SALDO)</label>
                  <input 
                    type="number" 
                    value={editWalletBalance}
                    onChange={e => setEditWalletBalance(e.target.value)}
                    className="w-full mt-1 p-2.5 bg-slate-50 border rounded-xl text-base font-bold text-slate-900"
                    required
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-2 pt-2">
                  <button 
                    type="submit" 
                    disabled={submittingEditWallet}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-blue-500/20"
                  >
                    {submittingEditWallet ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                  {wallets.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => handleDeleteWallet(editingWallet.id)}
                      className="py-3 px-4 bg-red-100 hover:bg-red-200 text-red-600 font-bold rounded-xl text-xs transition"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
