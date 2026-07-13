"use client"
import React from 'react'
import { ShoppingCart, FileText } from 'lucide-react'

export default function PembelianPage() {
  const transactions = [
    { id: 'PO-2026-001', item: 'Pembelian Beras C4 (500 Kg)', cost: 'Rp 6.500.000', status: 'Dalam Pengiriman', date: '13 Juli 2026' },
    { id: 'PO-2026-002', item: 'Restock Ayam Broiler (200 Kg)', cost: 'Rp 7.000.000', status: 'Diproses', date: '14 Juli 2026' },
    { id: 'PO-2026-003', item: 'Restock Susu Cair (300 Liter)', cost: 'Rp 4.500.000', status: 'Selesai', date: '10 Juli 2026' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <nav className="text-sm text-slate-500 mb-1">Gudang / Pembelian</nav>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">🛒 Pembelian & Procurement</h1>
        <p className="text-slate-500 text-sm mt-1">Kelola pesanan pembelian (PO) dan pengadaan bahan baku dapur.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <ShoppingCart className="text-emerald-600" size={20} />
            Daftar Pembelian (PO) Aktif
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {transactions.map((item, index) => (
            <div key={index} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-slate-100 text-slate-600 rounded-xl mt-1">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{item.item}</h3>
                  <p className="text-slate-500 text-xs mt-1">Nomor PO: {item.id} • Tanggal: {item.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold text-slate-800">{item.cost}</span>
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold">
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
