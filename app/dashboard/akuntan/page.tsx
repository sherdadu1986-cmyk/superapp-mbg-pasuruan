"use client"
import React, { useState } from 'react'
import {
  DollarSign, Receipt, ShoppingCart, Plus, CheckCircle,
  AlertCircle, History, Upload, FileText
} from 'lucide-react'

interface Transaction {
  id: string;
  category: string;
  desc: string;
  amount: number;
  date: string;
  status: string;
}

export default function KeuanganHariIni() {
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Bahan Baku')
  const [desc, setDesc] = useState('')
  const [receiptName, setReceiptName] = useState<string | null>(null)
  
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: 'TX-001', category: 'Bahan Baku', desc: 'Pembelian Beras C4 Pasuruan 120 Kg', amount: 1560000, date: 'Hari ini, 08:30', status: 'Lunas' },
    { id: 'TX-002', category: 'Operasional', desc: 'Isi Ulang Gas LPG 12 Kg (2 tabung)', amount: 440000, date: 'Hari ini, 09:15', status: 'Lunas' },
    { id: 'TX-003', category: 'SDM', desc: 'Uang Transport Relawan Pengantaran (3 orang)', amount: 150000, date: 'Hari ini, 10:00', status: 'Lunas' },
  ])

  const [poList, setPoList] = useState([
    { id: 'PO-2407-001', supplier: 'CV Beras Makmur', total: 3750000, status: 'Menunggu Pengiriman' },
    { id: 'PO-2407-002', supplier: 'PT Protein Nusantara', total: 5600000, status: 'Pending Approval Kepala' },
  ])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptName(e.target.files[0].name)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !desc) return

    const newTx: Transaction = {
      id: `TX-00${transactions.length + 1}`,
      category,
      desc,
      amount: parseFloat(amount),
      date: 'Baru saja',
      status: 'Lunas',
    }

    setTransactions([newTx, ...transactions])
    setAmount('')
    setDesc('')
    setReceiptName(null)
  }

  const IDR = (n: number) => 'Rp ' + n.toLocaleString('id-ID')

  return (
    <div className="space-y-6 bg-[#F8FAFC] min-h-screen text-slate-800 font-sans">
      
      {/* Banner / Header */}
      <div className="bg-white border border-gray-200 p-6 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-emerald-900 text-white text-[10px] font-bold rounded uppercase tracking-wider">
              Keuangan Hari Ini
            </span>
            <span className="text-xs text-gray-500 font-medium">Akuntan · Lembar Kerja</span>
          </div>
          <h1 className="text-xl font-bold text-emerald-950">Pencatatan Finansial & Pembayaran PO</h1>
          <p className="text-gray-500 text-xs font-medium">
            Kelola pengeluaran operasional harian, validasi invoice masuk, dan rekam riwayat kas keluar.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Form Input Pengeluaran */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-gray-200 p-5 rounded-lg space-y-4">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-gray-150">
              <Plus size={16} className="text-emerald-950" /> Catat Kas Keluar Baru
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-gray-600">Kategori Biaya</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded bg-white text-gray-700 outline-none"
                >
                  <option value="Bahan Baku">Bahan Baku & Logistik</option>
                  <option value="Operasional">Operasional & Listrik/Gas</option>
                  <option value="SDM">Transportasi & Relawan</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-gray-600">Nominal Pengeluaran (Rp)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-gray-400 font-bold">Rp</span>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Contoh: 1500000"
                    className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded text-gray-750 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-gray-600">Deskripsi / Peruntukan</label>
                <textarea
                  required
                  rows={3}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Deskripsikan barang/jasa yang dibayar..."
                  className="w-full p-2 border border-gray-200 rounded text-gray-750 outline-none resize-none font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-600">Upload Kuitansi / Bukti Bayar</label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded p-4 text-center cursor-pointer hover:bg-slate-50 transition">
                  <Upload size={18} className="text-gray-400 mb-1" />
                  <span className="text-[10px] text-gray-500 font-bold">
                    {receiptName ? receiptName : 'Pilih file kuitansi (PDF/PNG)'}
                  </span>
                  <input 
                    type="file" 
                    accept="image/*,application/pdf" 
                    onChange={handleFileUpload} 
                    className="hidden" 
                  />
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-900 hover:bg-emerald-950 text-white font-bold uppercase rounded border border-emerald-950 transition cursor-pointer"
              >
                Simpan Transaksi
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Invoices & Transactions History */}
        <div className="lg:col-span-2 space-y-6">

          {/* Pending Invoices & Active POs */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingCart size={16} className="text-emerald-950" /> Tagihan Pembelian (PO)
              </h2>
            </div>
            <div className="divide-y divide-gray-250">
              {poList.map((po, i) => (
                <div key={i} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <h3 className="font-bold text-slate-800">{po.id} — {po.supplier}</h3>
                    <p className="text-gray-500 font-medium mt-0.5">Total Tagihan: <strong className="text-slate-800">{IDR(po.total)}</strong></p>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold border rounded bg-slate-50 text-slate-500 border-gray-200 flex items-center">
                      {po.status}
                    </span>
                    <button className="px-2.5 py-1 bg-emerald-900 hover:bg-emerald-950 text-white font-bold rounded text-[10px] border border-emerald-950 cursor-pointer">
                      Bayar Sekarang
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transactions Log History */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <History size={16} className="text-emerald-950" /> Riwayat Transaksi Hari Ini
              </h2>
              <span className="text-[10px] font-bold text-slate-500">
                Total Pengeluaran: <strong className="text-emerald-900">{IDR(transactions.reduce((sum, item) => sum + item.amount, 0))}</strong>
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-left border-b border-gray-200">
                    <th className="px-4 py-2.5">ID</th>
                    <th className="px-4 py-2.5">Kategori</th>
                    <th className="px-4 py-2.5">Deskripsi</th>
                    <th className="px-4 py-2.5 text-right">Nominal</th>
                    <th className="px-4 py-2.5 text-center">Waktu</th>
                    <th className="px-4 py-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 font-semibold">
                  {transactions.map((tx, i) => (
                    <tr key={i} className="hover:bg-slate-50/40 text-gray-700">
                      <td className="px-4 py-3 text-indigo-700 font-bold">{tx.id}</td>
                      <td className="px-4 py-3 text-slate-500">{tx.category}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{tx.desc}</td>
                      <td className="px-4 py-3 text-right text-slate-800">{IDR(tx.amount)}</td>
                      <td className="px-4 py-3 text-center text-slate-400">{tx.date}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 text-[9px] font-bold rounded border bg-emerald-50 text-emerald-800 border-emerald-200">
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
