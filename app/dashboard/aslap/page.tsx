"use client"
import React, { useState } from 'react'
import {
  Package, Truck, CheckSquare, ClipboardList, Plus,
  Camera, FileText, CheckCircle, Clock, AlertTriangle, Upload
} from 'lucide-react'

interface ChecklistItem {
  id: number;
  task: string;
  done: boolean;
  time: string;
}

interface DeliveryItem {
  route: string;
  driver: string;
  qty: number;
  status: string;
  signed: boolean;
}

export default function OperasionalHariIni() {
  const [packingQty, setPackingQty] = useState('')
  const [packingTime, setPackingTime] = useState('06:00')
  const [docName, setDocName] = useState<string | null>(null)

  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: 1, task: 'Sanitasi Area Masak & Peralatan Dapur', done: true, time: '04:00' },
    { id: 2, task: 'Pemanasan Alat Masak Utama', done: true, time: '04:15' },
    { id: 3, task: 'Uji Retensi & Sampel Gizi Lolos', done: true, time: '05:30' },
    { id: 4, task: 'Masak Lauk Utama Selesai', done: true, time: '06:00' },
    { id: 5, task: 'Sanitasi Wadah Packing Box', done: false, time: '—' },
    { id: 6, task: 'Packing Box Tersegel Rapat', done: false, time: '—' },
  ])

  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([
    { route: 'Rute 1 — Wonorejo Barat', driver: 'Budi Santoso', qty: 950, status: 'Tiba di Lokasi', signed: true },
    { route: 'Rute 2 — Wonorejo Timur', driver: 'Edi Wibowo', qty: 1100, status: 'Sedang Kirim', signed: false },
    { route: 'Rute 3 — Wonorejo Utara', driver: 'Slamet Rahardjo', qty: 1164, status: 'Siap Berangkat', signed: false },
  ])

  const [packingLogs, setPackingLogs] = useState([
    { id: 'PKG-01', qty: 1200, time: '05:00', status: 'Selesai' },
    { id: 'PKG-02', qty: 1530, time: '06:00', status: 'Selesai' },
  ])

  const toggleChecklist = (id: number) => {
    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    setChecklist(
      checklist.map((item) => {
        if (item.id === id) {
          return { ...item, done: !item.done, time: !item.done ? timeStr : '—' }
        }
        return item
      })
    )
  }

  const handlePackingSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!packingQty) return

    const newLog = {
      id: `PKG-0${packingLogs.length + 1}`,
      qty: parseInt(packingQty),
      time: packingTime,
      status: 'Selesai',
    }

    setPackingLogs([newLog, ...packingLogs])
    setPackingQty('')
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDocName(e.target.files[0].name)
    }
  }

  return (
    <div className="space-y-6 bg-[#F8FAFC] min-h-screen text-slate-800 font-sans">
      
      {/* Banner / Header */}
      <div className="bg-white border border-gray-200 p-6 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-emerald-900 text-white text-[10px] font-bold rounded uppercase tracking-wider">
              Operasional Hari Ini
            </span>
            <span className="text-xs text-gray-500 font-medium">Aslap · Lembar Kerja</span>
          </div>
          <h1 className="text-xl font-bold text-emerald-950">Monitoring Lapangan, Packing & Rute</h1>
          <p className="text-gray-500 text-xs font-medium">
            Jalankan checklist produksi harian, rekam hasil packing porsi, dan pantau tanda tangan serah terima manifes armada.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Checklist & Packing Input */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Checklist Produksi */}
          <div className="bg-white border border-gray-200 p-5 rounded-lg space-y-4">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-gray-150">
              <CheckSquare size={16} className="text-emerald-950" /> Checklist Kerja Produksi
            </h2>
            <div className="space-y-2.5">
              {checklist.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3 text-xs font-semibold p-2 bg-slate-50 border border-gray-200 rounded">
                  <label className="flex items-start gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => toggleChecklist(item.id)}
                      className="mt-0.5 cursor-pointer"
                    />
                    <span className={item.done ? 'text-gray-400 line-through font-medium' : 'text-slate-800'}>
                      {item.task}
                    </span>
                  </label>
                  <span className="text-[10px] text-gray-400 font-bold whitespace-nowrap">
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Input Laporan Packing */}
          <div className="bg-white border border-gray-200 p-5 rounded-lg space-y-4">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-gray-150">
              <Package size={16} className="text-emerald-950" /> Input Log Hasil Packing
            </h2>
            
            <form onSubmit={handlePackingSubmit} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-gray-600">Jumlah Porsi (Box)</label>
                  <input
                    type="number"
                    required
                    value={packingQty}
                    onChange={(e) => setPackingQty(e.target.value)}
                    placeholder="Contoh: 500"
                    className="w-full p-2 border border-gray-200 rounded text-gray-755 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-600">Waktu Packing</label>
                  <input
                    type="text"
                    required
                    value={packingTime}
                    onChange={(e) => setPackingTime(e.target.value)}
                    placeholder="HH:MM"
                    className="w-full p-2 border border-gray-200 rounded text-gray-755 outline-none font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-emerald-900 hover:bg-emerald-950 text-white font-bold uppercase rounded border border-emerald-950 transition cursor-pointer"
              >
                Log Hasil Packing
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Armada Rute & Log Riwayat Packing */}
        <div className="lg:col-span-2 space-y-6">

          {/* Delivery & Documentation Verification */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Truck size={16} className="text-emerald-950" /> Pengiriman Armada & Serah Terima Manifes
              </h2>
            </div>
            <div className="divide-y divide-gray-250">
              {deliveries.map((del, i) => (
                <div key={i} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold">
                  <div>
                    <h4 className="font-bold text-slate-800">{del.route}</h4>
                    <p className="text-gray-500 font-medium mt-0.5">
                      Driver: {del.driver} · Muatan: <strong className="text-slate-800">{del.qty} Box</strong>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-2 py-0.5 text-[10px] font-bold border rounded ${
                      del.status === 'Tiba di Lokasi' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      {del.status}
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold border rounded ${
                      del.signed ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}>
                      {del.signed ? '✓ Ttd Penerima' : '⏳ Belum Ttd'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upload Manifes & Foto Lapangan */}
          <div className="bg-white border border-gray-200 p-5 rounded-lg space-y-4">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-gray-150">
              <Camera size={16} className="text-emerald-950" /> Upload Foto Bukti Pengantaran / TTD Manifes
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-gray-600">Pilih Dokumen / Foto Dokumentasi</label>
                <label className="flex flex-col items-center justify-center border border-dashed border-gray-300 rounded p-4 text-center cursor-pointer hover:bg-slate-50 transition">
                  <Upload size={18} className="text-gray-400 mb-1" />
                  <span className="text-[10px] text-gray-500 font-bold">
                    {docName ? docName : 'Pilih file dokumentasi rute (PNG/JPG)'}
                  </span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileUpload} 
                    className="hidden" 
                  />
                </label>
              </div>
              <div className="flex flex-col justify-end space-y-2">
                <p className="text-[10px] text-gray-400 font-medium">Upload foto serah terima makanan di sekolah penerima manfaat guna kelayakan dokumentasi audit porsi.</p>
                <button
                  type="button"
                  disabled={!docName}
                  onClick={() => { setDocName(null); alert('Dokumen berhasil dikirim!') }}
                  className={`py-2 px-3 font-bold rounded uppercase tracking-wider text-center transition ${
                    docName 
                      ? 'bg-emerald-900 hover:bg-emerald-950 text-white border border-emerald-950 cursor-pointer' 
                      : 'bg-gray-150 text-gray-400 border border-gray-200 cursor-not-allowed'
                  }`}
                >
                  Kirim Dokumentasi
                </button>
              </div>
            </div>
          </div>

          {/* Packing Logs Riwayat */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={16} className="text-emerald-950" /> Riwayat Log Packing Hari Ini
              </h2>
              <span className="text-[10px] font-bold text-slate-500">
                Total Terpacking: <strong className="text-emerald-900">{packingLogs.reduce((sum, item) => sum + item.qty, 0)} Box</strong>
              </span>
            </div>
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-gray-200">
                  <th className="px-4 py-2">ID Log</th>
                  <th className="px-4 py-2">Jumlah Porsi</th>
                  <th className="px-4 py-2">Waktu Log</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 font-semibold text-gray-700">
                {packingLogs.map((log, i) => (
                  <tr key={i} className="hover:bg-slate-50/40">
                    <td className="px-4 py-3 text-indigo-700 font-bold">{log.id}</td>
                    <td className="px-4 py-3 text-slate-800">{log.qty} Box</td>
                    <td className="px-4 py-3 text-slate-400 font-medium">Pukul {log.time}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 text-[9px] font-bold rounded border bg-emerald-50 text-emerald-800 border-emerald-200">
                        {log.status}
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
  )
}
