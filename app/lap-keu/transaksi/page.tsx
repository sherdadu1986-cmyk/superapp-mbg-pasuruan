"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Receipt,
  PlusCircle,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Calendar,
  Wallet,
  Tag,
  X,
  FileText,
  CheckCircle2
} from 'lucide-react'
import { FinoraStore, FinTransaction, formatRupiah } from '@/lib/finora-store'

export default function TransaksiPage() {
  const [transactions, setTransactions] = useState<FinTransaction[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  
  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [selectedTxDetail, setSelectedTxDetail] = useState<FinTransaction | null>(null)

  // Form State
  const [txType, setTxType] = useState<'income' | 'expense'>('expense')
  const [txAmount, setTxAmount] = useState('')
  const [txCategory, setTxCategory] = useState('Kebutuhan Rumah Tangga')
  const [txAccount, setTxAccount] = useState('BCA Express')
  const [txMerchant, setTxMerchant] = useState('')
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0])
  const [txNotes, setTxNotes] = useState('')

  useEffect(() => {
    setTransactions(FinoraStore.getTransactions())
  }, [])

  const reloadData = () => {
    setTransactions(FinoraStore.getTransactions())
  }

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
      FinoraStore.deleteTransaction(id)
      reloadData()
    }
  }

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const numeric = parseInt(txAmount.replace(/\D/g, '')) || 0
    if (numeric <= 0) return

    FinoraStore.addTransaction({
      date: txDate,
      amount: numeric,
      type: txType,
      category: txCategory,
      account_name: txAccount,
      merchant: txMerchant || undefined,
      notes: txNotes || undefined,
      payment_method: 'QRIS'
    })

    reloadData()
    setShowModal(false)
    setTxAmount('')
    setTxMerchant('')
    setTxNotes('')
  }

  // Filtering Logic
  const filtered = transactions.filter(t => {
    const matchesSearch =
      (t.merchant || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.notes || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.account_name.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = typeFilter === 'all' || t.type === typeFilter
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter

    return matchesSearch && matchesType && matchesCategory
  })

  // Filtered Totals
  const totalIncomeFiltered = filtered
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0)

  const totalExpenseFiltered = filtered
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0)

  const categories = Array.from(new Set(transactions.map(t => t.category)))

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-widest">
              MANAGEMENT MODULAR
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Receipt className="text-emerald-400" />
            Riwayat Transaksi Keuangan
          </h1>
          <p className="text-xs text-slate-400">
            Kelola pemasukan dan pengeluaran secara terorganisir dengan catatan lengkap & detail item.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/25 transition active:scale-95 cursor-pointer self-start md:self-auto"
        >
          <PlusCircle size={18} />
          <span>+ Tambah Transaksi</span>
        </button>
      </div>

      {/* Summary Chips for Current Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Total Ditemukan</span>
            <span className="text-lg font-bold text-white">{filtered.length} Transaksi</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-800 text-slate-300">
            <FileText size={18} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Pemasukan (Tersaring)</span>
            <span className="text-lg font-bold text-teal-400">{formatRupiah(totalIncomeFiltered)}</span>
          </div>
          <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400">
            <ArrowUpRight size={18} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Pengeluaran (Tersaring)</span>
            <span className="text-lg font-bold text-rose-400">{formatRupiah(totalExpenseFiltered)}</span>
          </div>
          <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
            <ArrowDownRight size={18} />
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Cari merchant, catatan, pos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Type Tabs */}
          <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                typeFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setTypeFilter('income')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                typeFilter === 'income' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              💰 Pemasukan
            </button>
            <button
              onClick={() => setTypeFilter('expense')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                typeFilter === 'expense' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              💸 Pengeluaran
            </button>
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Semua Kategori</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions Data Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-4">Tanggal</th>
                <th className="px-5 py-4">Merchant / Deskripsi</th>
                <th className="px-5 py-4">Kategori Pos</th>
                <th className="px-5 py-4">Rekening</th>
                <th className="px-5 py-4 text-right">Nominal</th>
                <th className="px-5 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filtered.length > 0 ? (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-5 py-4 whitespace-nowrap text-slate-400 font-semibold flex items-center gap-2">
                      <Calendar size={14} className="text-slate-500" />
                      {t.date}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-white text-sm">
                        {t.merchant || t.category}
                      </div>
                      {t.notes && <div className="text-[11px] text-slate-400 mt-0.5">{t.notes}</div>}
                      {t.items && t.items.length > 0 && (
                        <button
                          onClick={() => setSelectedTxDetail(t)}
                          className="mt-1 text-[10px] font-bold text-emerald-400 hover:underline flex items-center gap-1"
                        >
                          📦 Lihat {t.items.length} Rincian Item Nota
                        </button>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700/80 text-slate-300 font-semibold text-[11px]">
                        {t.category}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-400 flex items-center gap-1.5">
                      <Wallet size={13} className="text-emerald-400" />
                      {t.account_name}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right font-extrabold text-sm">
                      <span className={t.type === 'income' ? 'text-teal-400' : 'text-rose-400'}>
                        {t.type === 'income' ? '+' : '-'} {formatRupiah(t.amount)}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-center">
                      <button
                        type="button"
                        onClick={() => handleDelete(t.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Hapus Transaksi"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    Tidak ada data transaksi yang cocok dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 relative"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <PlusCircle size={20} className="text-emerald-400" />
                  <h3 className="font-extrabold text-white text-base">Tambah Transaksi Keuangan</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-4 mt-4">
                {/* Type Selector */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setTxType('expense')
                      setTxCategory('Kebutuhan Rumah Tangga')
                    }}
                    className={`py-2 text-xs font-bold rounded-lg transition ${
                      txType === 'expense'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    💸 Pengeluaran
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTxType('income')
                      setTxCategory('Gaji Bulanan')
                    }}
                    className={`py-2 text-xs font-bold rounded-lg transition ${
                      txType === 'income'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    💰 Pemasukan
                  </button>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Nominal Transaksi (Rp)</label>
                  <input
                    type="text"
                    required
                    placeholder="Rp 0"
                    value={txAmount}
                    onChange={(e) => {
                      const num = parseInt(e.target.value.replace(/\D/g, '')) || 0
                      setTxAmount(formatRupiah(num))
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xl font-black text-emerald-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Account & Category Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Sumber / Akun Rekening</label>
                    <select
                      value={txAccount}
                      onChange={(e) => setTxAccount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="BCA Express">BCA Express</option>
                      <option value="Mandiri Utama">Mandiri Utama</option>
                      <option value="Dompet Tunai">Dompet Tunai</option>
                      <option value="GoPay / QRIS">GoPay / QRIS</option>
                      <option value="Bibit Reksadana">Bibit Reksadana</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Kategori Pos</label>
                    <select
                      value={txCategory}
                      onChange={(e) => setTxCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                      {txType === 'expense' ? (
                        <>
                          <option value="Kebutuhan Rumah Tangga">Kebutuhan Rumah Tangga</option>
                          <option value="Makanan & Kuliner">Makanan & Kuliner</option>
                          <option value="Transportasi">Transportasi</option>
                          <option value="Tagihan & Utilitas">Tagihan & Utilitas</option>
                          <option value="Rumah & Cicilan">Rumah & Cicilan</option>
                          <option value="Hiburan & Gaya Hidup">Hiburan & Gaya Hidup</option>
                          <option value="Investasi & Tabungan">Investasi & Tabungan</option>
                        </>
                      ) : (
                        <>
                          <option value="Gaji Bulanan">Gaji Bulanan</option>
                          <option value="Bonus Project AI">Bonus Project AI</option>
                          <option value="Freelance">Freelance</option>
                          <option value="Hasil Investasi">Hasil Investasi</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                {/* Date & Merchant Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tanggal</label>
                    <input
                      type="date"
                      value={txDate}
                      onChange={(e) => setTxDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Merchant / Tempat</label>
                    <input
                      type="text"
                      placeholder="Indomaret / Cafe / Klien"
                      value={txMerchant}
                      onChange={(e) => setTxMerchant(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Catatan Tambahan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Belanja bahan pokok bulanan..."
                    value={txNotes}
                    onChange={(e) => setTxNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 hover:scale-105 transition cursor-pointer"
                  >
                    ✓ Simpan Transaksi
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Itemized Detail Modal */}
      <AnimatePresence>
        {selectedTxDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-extrabold text-white text-base">Rincian Item Nota Belanja</h3>
                <button onClick={() => setSelectedTxDetail(null)} className="p-1 text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-xs text-slate-400">Merchant:</div>
                  <div className="font-bold text-white text-sm">{selectedTxDetail.merchant}</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Tanggal: {selectedTxDetail.date} · Akun: {selectedTxDetail.account_name}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Daftar Item:</span>
                  <div className="divide-y divide-slate-800 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                    {selectedTxDetail.items?.map((item, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-200">{item.item_name}</div>
                          {item.quantity && <div className="text-[10px] text-slate-500">Jumlah: {item.quantity}x</div>}
                        </div>
                        <div className="font-extrabold text-emerald-400">{formatRupiah(item.price)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-between items-center text-sm font-extrabold text-white border-t border-slate-800">
                  <span>Total Nota:</span>
                  <span className="text-emerald-400">{formatRupiah(selectedTxDetail.amount)}</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
