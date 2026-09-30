"use client"

import React, { useState, useEffect } from 'react'
import { Receipt, Search, Filter, Trash2, ArrowUpRight, ArrowDownRight, ArrowRightLeft } from 'lucide-react'
import {
  OlloStore,
  OlloWallet,
  OlloTransaction,
  formatRupiahFull
} from '@/lib/ollo-store'

export default function OlloTransaksiPage() {
  const [transactions, setTransactions] = useState<OlloTransaction[]>([])
  const [wallets, setWallets] = useState<OlloWallet[]>([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income' | 'transfer'>('all')
  const [walletFilter, setWalletFilter] = useState('all')

  const loadData = () => {
    setTransactions(OlloStore.getTransactions())
    setWallets(OlloStore.getWallets())
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
      OlloStore.deleteTransaction(id)
      loadData()
    }
  }

  // Filter
  const filtered = transactions.filter(t => {
    const matchesSearch =
      (t.note || '').toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase()) ||
      (t.merchant || '').toLowerCase().includes(search.toLowerCase())

    const matchesType = typeFilter === 'all' || t.type === typeFilter
    const matchesWallet = walletFilter === 'all' || t.wallet_id === walletFilter || t.to_wallet_id === walletFilter

    return matchesSearch && matchesType && matchesWallet
  })

  // Group by date
  const todayStr = new Date().toISOString().split('T')[0]
  const grouped: Record<string, OlloTransaction[]> = {}
  filtered.forEach(t => {
    let dateLabel = t.date
    if (t.date === todayStr) dateLabel = 'Hari Ini'
    else if (t.date === '2026-09-29') dateLabel = 'Kemarin'

    if (!grouped[dateLabel]) grouped[dateLabel] = []
    grouped[dateLabel].push(t)
  })

  return (
    <div className="space-y-5 pb-12 max-w-2xl mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Receipt className="text-emerald-600" size={22} />
          Riwayat Transaksi Keuangan
        </h1>
        <p className="text-xs text-slate-500">
          Daftar seluruh transaksi pemasukan, pengeluaran, dan transfer antar dompet.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="p-3 bg-white rounded-2xl border border-slate-200/80 space-y-2.5 shadow-2xs">
        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari transaksi, toko, catatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-xl font-bold">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition ${
                typeFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setTypeFilter('expense')}
              className={`px-2.5 py-1 rounded-lg transition ${
                typeFilter === 'expense' ? 'bg-white text-rose-600 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Keluar
            </button>
            <button
              onClick={() => setTypeFilter('income')}
              className={`px-2.5 py-1 rounded-lg transition ${
                typeFilter === 'income' ? 'bg-white text-emerald-600 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Masuk
            </button>
            <button
              onClick={() => setTypeFilter('transfer')}
              className={`px-2.5 py-1 rounded-lg transition ${
                typeFilter === 'transfer' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Transfer
            </button>
          </div>

          <select
            value={walletFilter}
            onChange={(e) => setWalletFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700"
          >
            <option value="all">Semua Dompet</option>
            {wallets.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grouped Transactions List */}
      <div className="space-y-3">
        {Object.keys(grouped).length > 0 ? (
          Object.entries(grouped).map(([dateLabel, items]) => (
            <div key={dateLabel} className="space-y-1.5">
              <div className="text-[11px] font-bold text-slate-400 px-1">
                {dateLabel} ({items.length})
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden shadow-2xs">
                {items.map((t) => {
                  const isIncome = t.type === 'income'
                  const isTransfer = t.type === 'transfer'
                  const walletName = wallets.find(w => w.id === t.wallet_id)?.name || 'Dompet'

                  return (
                    <div key={t.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition group">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center text-base shrink-0">
                          {t.category.split(' ')[0] || '💳'}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900">{t.note || t.category}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span>{t.time || '12:00'}</span>
                            <span>·</span>
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">{walletName}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-right">
                        <span className={`font-extrabold text-xs ${
                          isIncome ? 'text-emerald-600' : isTransfer ? 'text-blue-600' : 'text-slate-900'
                        }`}>
                          {isIncome ? '+' : isTransfer ? '↔' : '-'} {formatRupiahFull(t.amount)}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleDelete(t.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 bg-white border border-slate-200/80 rounded-2xl text-center space-y-2">
            <div className="text-2xl">🍃</div>
            <div className="font-bold text-xs text-slate-800">Tidak ada transaksi ditemukan</div>
            <p className="text-[11px] text-slate-400">Coba ubah kata kunci atau filter pencarian.</p>
          </div>
        )}
      </div>
    </div>
  )
}
