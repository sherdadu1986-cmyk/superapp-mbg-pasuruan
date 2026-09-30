'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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

export default function SimpleFinancePage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State Transaksi
  const [selectedWalletId, setSelectedWalletId] = useState('');
  const [tipe, setTipe] = useState<'pengeluaran' | 'pemasukan'>('pengeluaran');
  const [nominal, setNominal] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form Tambah Dompet Baru
  const [namaDompetBaru, setNamaDompetBaru] = useState('');
  const [saldoAwalBaru, setSaldoAwalBaru] = useState('');

  // Edit Dompet State
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [editNama, setEditNama] = useState('');
  const [editSaldo, setEditSaldo] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Filter Riwayat Transaksi ('all' | 'selected')
  const [filterMode, setFilterMode] = useState<'all' | 'selected'>('all');

  // Format IDR Helper
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // 1. Ambil Data dari Supabase
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
      alert('Gagal load data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 2. Hitung Total Saldo Utama dari semua dompet
  const totalSaldoUtama = wallets.reduce((acc, w) => acc + Number(w.saldo_sekarang || 0), 0);

  // 3. Simpan Transaksi & Update Saldo Dompet
  const handleSimpanTransaksi = async (e: React.FormEvent) => {
    e.preventDefault();
    const angkaNominal = Number(nominal);
    if (!angkaNominal || angkaNominal <= 0) {
      alert('Masukkan nominal yang valid');
      return;
    }
    if (!selectedWalletId) {
      alert('Pilih dompet terlebih dahulu');
      return;
    }

    setSubmitting(true);
    try {
      const dompetTerkait = wallets.find((w) => w.id === selectedWalletId);
      if (!dompetTerkait) throw new Error('Dompet tidak ditemukan');

      // Hitung saldo baru
      const saldoBaru =
        tipe === 'pengeluaran'
          ? Number(dompetTerkait.saldo_sekarang) - angkaNominal
          : Number(dompetTerkait.saldo_sekarang) + angkaNominal;

      // a. Insert ke fin_transactions
      const { error: insErr } = await supabase.from('fin_transactions').insert([
        {
          wallet_id: selectedWalletId,
          tipe,
          nominal: angkaNominal,
          keterangan: keterangan || (tipe === 'pengeluaran' ? 'Pengeluaran' : 'Pemasukan'),
        },
      ]);
      if (insErr) throw insErr;

      // b. Update saldo di fin_wallets
      const { error: updErr } = await supabase
        .from('fin_wallets')
        .update({ saldo_sekarang: saldoBaru })
        .eq('id', selectedWalletId);
      if (updErr) throw updErr;

      // Reset form & Refresh data
      setNominal('');
      setKeterangan('');
      await loadData();
      alert(`Berhasil mencatat ${tipe}!`);
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Tambah Dompet Baru
  const handleTambahDompet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaDompetBaru.trim()) return;

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
      await loadData();
      alert('Dompet berhasil dibuat!');
    } catch (err: any) {
      alert('Gagal tambah dompet: ' + err.message);
    }
  };

  // 5. Buka Modal Edit Dompet
  const handleOpenEditModal = (w: Wallet, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingWallet(w);
    setEditNama(w.nama_akun);
    setEditSaldo(String(w.saldo_sekarang));
  };

  // 6. Simpan Edit Dompet
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
      alert('Gagal update dompet: ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  // 7. Hapus Dompet
  const handleHapusDompet = async (walletId: string) => {
    if (
      !window.confirm(
        'Yakin ingin menghapus dompet ini? Seluruh transaksi terkait akan ikut terhapus.'
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase.from('fin_wallets').delete().eq('id', walletId);
      if (error) throw error;

      alert('Dompet berhasil dihapus!');
      setEditingWallet(null);
      await loadData();
    } catch (err: any) {
      alert('Gagal hapus dompet: ' + err.message);
    }
  };

  // 8. Hapus Transaksi & Reversal Saldo Otomatis
  const handleHapusTransaksi = async (t: Transaction) => {
    const formattedNominal = formatRupiah(Number(t.nominal));
    if (
      !window.confirm(
        `Apakah Anda yakin ingin menghapus transaksi "${t.keterangan}" (${formattedNominal})?\nSaldo dompet akan disesuaikan kembali.`
      )
    ) {
      return;
    }

    try {
      const dompetTerkait = wallets.find((w) => w.id === t.wallet_id);
      if (dompetTerkait) {
        const saldoSekarang = Number(dompetTerkait.saldo_sekarang || 0);
        const nominalTx = Number(t.nominal || 0);

        // Pengeluaran dihapus -> Saldo dikembalikan (+). Pemasukan dihapus -> Saldo ditarik (-).
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

      alert('Transaksi berhasil dihapus & saldo dompet telah disesuaikan!');
      await loadData();
    } catch (err: any) {
      alert('Gagal hapus transaksi: ' + err.message);
    }
  };

  // Transaksi terfilter
  const filteredTransactions =
    filterMode === 'selected' && selectedWalletId
      ? transactions.filter((t) => t.wallet_id === selectedWalletId)
      : transactions;

  if (loading) {
    return <div className="p-8 text-center text-lg">Memuat data keuangan online...</div>;
  }

  const selectedWalletObject = wallets.find((w) => w.id === selectedWalletId);

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6 bg-slate-50 min-h-screen text-slate-800">
      {/* 1. KOTAK TOTAL SALDO UTAMA */}
      <div className="bg-indigo-600 text-white p-6 rounded-2xl shadow-lg">
        <p className="text-sm font-medium text-indigo-100">TOTAL SALDO UTAMA (SEMUA DOMPET)</p>
        <h1 className="text-4xl font-extrabold mt-1">{formatRupiah(totalSaldoUtama)}</h1>
        <p className="text-xs text-indigo-200 mt-2">{wallets.length} Dompet Aktif Terkoneksi</p>
      </div>

      {/* 2. DAFTAR DOMPET */}
      <div className="bg-white p-5 rounded-2xl shadow border border-slate-200 space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold">Dompet & Rekening Anda</h2>
          <span className="text-xs text-slate-500">Klik dompet untuk memilih</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {wallets.map((w) => (
            <div
              key={w.id}
              onClick={() => setSelectedWalletId(w.id)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition relative group ${
                selectedWalletId === w.id
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-900">{w.nama_akun}</span>
                <div className="flex items-center gap-1.5">
                  {selectedWalletId === w.id && (
                    <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-medium">
                      Dipilih
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => handleOpenEditModal(w, e)}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded border border-slate-300 font-medium transition"
                    title="Edit Dompet"
                  >
                    ✏️ Edit
                  </button>
                </div>
              </div>
              <p className="text-xl font-bold mt-2 text-slate-800">
                {formatRupiah(Number(w.saldo_sekarang))}
              </p>
            </div>
          ))}
        </div>

        {/* Form Tambah Dompet */}
        <form onSubmit={handleTambahDompet} className="pt-3 border-t flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Nama Dompet (cth: Kas Tunai / Mandiri)"
            value={namaDompetBaru}
            onChange={(e) => setNamaDompetBaru(e.target.value)}
            className="flex-1 min-w-[150px] p-2 border rounded-lg text-sm"
            required
          />
          <input
            type="number"
            placeholder="Saldo Awal"
            value={saldoAwalBaru}
            onChange={(e) => setSaldoAwalBaru(e.target.value)}
            className="w-32 p-2 border rounded-lg text-sm"
          />
          <button
            type="submit"
            className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            + Dompet
          </button>
        </form>
      </div>

      {/* 3. FORM INPUT TRANSAKSI (PEMASUKAN / PENGELUARAN) */}
      <div className="bg-white p-5 rounded-2xl shadow border border-slate-200 space-y-4">
        <h2 className="text-lg font-bold">Catat Transaksi</h2>

        {/* Toggle Tipe */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTipe('pengeluaran')}
            className={`flex-1 py-2 text-center rounded-xl font-semibold text-sm transition ${
              tipe === 'pengeluaran' ? 'bg-red-500 text-white shadow' : 'bg-slate-100 text-slate-600'
            }`}
          >
            📉 Pengeluaran
          </button>
          <button
            type="button"
            onClick={() => setTipe('pemasukan')}
            className={`flex-1 py-2 text-center rounded-xl font-semibold text-sm transition ${
              tipe === 'pemasukan'
                ? 'bg-emerald-500 text-white shadow'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            📈 Pemasukan
          </button>
        </div>

        <form onSubmit={handleSimpanTransaksi} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-500">PILIH DOMPET TUJUAN</label>
            <select
              value={selectedWalletId}
              onChange={(e) => setSelectedWalletId(e.target.value)}
              className="w-full mt-1 p-2 border rounded-lg bg-white"
              required
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.nama_akun} (Saldo: {formatRupiah(Number(w.saldo_sekarang))})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500">NOMINAL (RP)</label>
            <input
              type="number"
              placeholder="Contoh: 50000"
              value={nominal}
              onChange={(e) => setNominal(e.target.value)}
              className="w-full mt-1 p-3 border rounded-lg text-lg font-bold"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500">KETERANGAN</label>
            <input
              type="text"
              placeholder="Contoh: Makan Siang / Gaji"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              className="w-full mt-1 p-2 border rounded-lg"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-3 rounded-xl font-bold text-white transition ${
              tipe === 'pengeluaran'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {submitting
              ? 'Menyimpan...'
              : `Simpan ${tipe === 'pengeluaran' ? 'Pengeluaran' : 'Pemasukan'}`}
          </button>
        </form>
      </div>

      {/* 4. RIWAYAT TRANSAKSI */}
      <div className="bg-white p-5 rounded-2xl shadow border border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
          <h2 className="text-lg font-bold">Riwayat Transaksi</h2>

          {/* Filter Dompet */}
          <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-medium self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 rounded-md transition ${
                filterMode === 'all'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Transaksi
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('selected')}
              className={`px-3 py-1 rounded-md transition ${
                filterMode === 'selected'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dompet Terpilih {selectedWalletObject ? `(${selectedWalletObject.nama_akun})` : ''}
            </button>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">
            {filterMode === 'selected'
              ? 'Belum ada transaksi untuk dompet ini.'
              : 'Belum ada transaksi.'}
          </p>
        ) : (
          <div className="divide-y">
            {filteredTransactions.map((t) => {
              const dompet = wallets.find((w) => w.id === t.wallet_id);
              return (
                <div key={t.id} className="py-3 flex justify-between items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 truncate">{t.keterangan}</p>
                    <p className="text-xs text-slate-400">
                      {dompet?.nama_akun || 'Dompet Terhapus'} •{' '}
                      {new Date(t.created_at).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      ({new Date(t.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })})
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`font-bold text-base ${
                        t.tipe === 'pemasukan' ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    >
                      {t.tipe === 'pemasukan' ? '+' : '-'} {formatRupiah(Number(t.nominal))}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleHapusTransaksi(t)}
                      className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition"
                      title="Hapus Transaksi (Kembalikan Saldo)"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL EDIT DOMPET */}
      {editingWallet && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900">Edit / Sunting Dompet</h3>
              <button
                type="button"
                onClick={() => setEditingWallet(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSimpanEditDompet} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500">NAMA DOMPET / REKENING</label>
                <input
                  type="text"
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  className="w-full mt-1 p-2.5 border rounded-lg font-medium text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500">
                  SALDO SEKARANG (KOREKSI SALDO)
                </label>
                <input
                  type="number"
                  value={editSaldo}
                  onChange={(e) => setEditSaldo(e.target.value)}
                  className="w-full mt-1 p-2.5 border rounded-lg font-bold text-slate-900"
                  required
                />
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-semibold transition"
                >
                  {savingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleHapusDompet(editingWallet.id)}
                    className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-2 rounded-xl text-sm font-semibold transition"
                  >
                    🗑️ Hapus Dompet
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingWallet(null)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl text-sm font-semibold transition"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
