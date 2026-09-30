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

  // Form State
  const [selectedWalletId, setSelectedWalletId] = useState('');
  const [tipe, setTipe] = useState<'pengeluaran' | 'pemasukan'>('pengeluaran');
  const [nominal, setNominal] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form Tambah Dompet Baru
  const [namaDompetBaru, setNamaDompetBaru] = useState('');
  const [saldoAwalBaru, setSaldoAwalBaru] = useState('');

  // 1. Ambil Data dari Supabase
  const loadData = async () => {
    try {
      setLoading(true);
      const { data: wData, error: wErr } = await supabase
        .from('fin_wallets')
        .select('*')
        .order('created_at', { ascending: true });

      if (wErr) throw wErr;
      setWallets(wData || []);
      if (wData && wData.length > 0 && !selectedWalletId) {
        setSelectedWalletId(wData[0].id);
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
    if (!namaDompetBaru) return;

    try {
      const { error } = await supabase.from('fin_wallets').insert([
        {
          nama_akun: namaDompetBaru,
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

  if (loading) {
    return <div className="p-8 text-center text-lg">Memuat data keuangan online...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6 bg-slate-50 min-h-screen text-slate-800">
      {/* 1. KOTAK TOTAL SALDO UTAMA */}
      <div className="bg-indigo-600 text-white p-6 rounded-2xl shadow-lg">
        <p className="text-sm font-medium text-indigo-100">TOTAL SALDO UTAMA (SEMUA DOMPET)</p>
        <h1 className="text-4xl font-extrabold mt-1">
          Rp {totalSaldoUtama.toLocaleString('id-ID')}
        </h1>
        <p className="text-xs text-indigo-200 mt-2">{wallets.length} Dompet Aktif Terkoneksi</p>
      </div>

      {/* 2. DAFTAR DOMPET */}
      <div className="bg-white p-5 rounded-2xl shadow border border-slate-200 space-y-3">
        <h2 className="text-lg font-bold">Dompet & Rekening Anda</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {wallets.map((w) => (
            <div
              key={w.id}
              onClick={() => setSelectedWalletId(w.id)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                selectedWalletId === w.id
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-900">{w.nama_akun}</span>
                {selectedWalletId === w.id && (
                  <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                    Dipilih
                  </span>
                )}
              </div>
              <p className="text-xl font-bold mt-2 text-slate-800">
                Rp {Number(w.saldo_sekarang).toLocaleString('id-ID')}
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
          <button type="submit" className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium">
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
              tipe === 'pengeluaran' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            📉 Pengeluaran
          </button>
          <button
            type="button"
            onClick={() => setTipe('pemasukan')}
            className={`flex-1 py-2 text-center rounded-xl font-semibold text-sm transition ${
              tipe === 'pemasukan' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'
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
                  {w.nama_akun} (Saldo: Rp {Number(w.saldo_sekarang).toLocaleString('id-ID')})
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
              tipe === 'pengeluaran' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {submitting ? 'Menyimpan...' : `Simpan ${tipe === 'pengeluaran' ? 'Pengeluaran' : 'Pemasukan'}`}
          </button>
        </form>
      </div>

      {/* 4. RIWAYAT TRANSAKSI */}
      <div className="bg-white p-5 rounded-2xl shadow border border-slate-200 space-y-3">
        <h2 className="text-lg font-bold">Riwayat Transaksi Terakhir</h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-slate-400">Belum ada transaksi.</p>
        ) : (
          <div className="divide-y">
            {transactions.map((t) => {
              const dompet = wallets.find((w) => w.id === t.wallet_id);
              return (
                <div key={t.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-slate-800">{t.keterangan}</p>
                    <p className="text-xs text-slate-400">
                      {dompet?.nama_akun || 'Dompet'} • {new Date(t.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span
                    className={`font-bold text-base ${
                      t.tipe === 'pemasukan' ? 'text-emerald-600' : 'text-red-500'
                    }`}
                  >
                    {t.tipe === 'pemasukan' ? '+' : '-'} Rp {Number(t.nominal).toLocaleString('id-ID')}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
