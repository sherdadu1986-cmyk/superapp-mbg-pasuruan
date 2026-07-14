"use client"
import React, { useState } from 'react'
import {
  Flame, Wheat, Fish, Droplets, Plus, CheckCircle,
  AlertTriangle, ShieldCheck, History, Edit, FileText
} from 'lucide-react'

interface MenuItem {
  name: string;
  qty: string;
  kalori: number;
  protein: number;
  karbo: number;
  lemak: number;
  safetyChecked: boolean;
}

interface SafetyLog {
  time: string;
  param: string;
  result: string;
  ok: boolean;
}

export default function MenuHariIni() {
  const [name, setName] = useState('')
  const [qty, setQty] = useState('100 gram')
  const [kalori, setKalori] = useState('')
  const [protein, setProtein] = useState('')
  const [karbo, setKarbo] = useState('')
  const [lemak, setLemak] = useState('')

  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    { name: 'Nasi Putih', qty: '200 gram', kalori: 175, protein: 3, karbo: 38, lemak: 0.2, safetyChecked: true },
    { name: 'Ayam Bakar Kecap', qty: '100 gram', kalori: 210, protein: 22, karbo: 8, lemak: 9, safetyChecked: true },
    { name: 'Sayur Bening Bayam', qty: '80 gram', kalori: 45, protein: 3, karbo: 7, lemak: 0.5, safetyChecked: true },
    { name: 'Susu UHT 200ml', qty: '1 Kotak', kalori: 120, protein: 6, karbo: 12, lemak: 4, safetyChecked: true },
  ])

  const [safetyLogs, setSafetyLogs] = useState<SafetyLog[]>([
    { time: '04:30', param: 'Suhu Chiller Bahan Baku', result: '4.2°C', ok: true },
    { time: '05:30', param: 'Uji Organoleptik Ayam Fillet', result: 'Segar / Lolos SOP', ok: true },
    { time: '06:00', param: 'Suhu Masak Internal Daging', result: '85°C', ok: true },
    { time: '06:45', param: 'Suhu Packing Box Makanan', result: '62.4°C', ok: true },
  ])

  const [newParam, setNewParam] = useState('')
  const [newResult, setNewResult] = useState('')
  const [newOk, setNewOk] = useState(true)

  const handleAddMenu = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !kalori || !protein || !karbo || !lemak) return

    const newItem: MenuItem = {
      name,
      qty,
      kalori: parseFloat(kalori),
      protein: parseFloat(protein),
      karbo: parseFloat(karbo),
      lemak: parseFloat(lemak),
      safetyChecked: true,
    }

    setMenuItems([...menuItems, newItem])
    setName('')
    setQty('100 gram')
    setKalori('')
    setProtein('')
    setKarbo('')
    setLemak('')
  }

  const handleAddSafety = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newParam || !newResult) return

    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    const newLog: SafetyLog = {
      time: timeStr,
      param: newParam,
      result: newResult,
      ok: newOk,
    }

    setSafetyLogs([...safetyLogs, newLog])
    setNewParam('')
    setNewResult('')
    setNewOk(true)
  }

  return (
    <div className="space-y-6 bg-[#F8FAFC] min-h-screen text-slate-800 font-sans">
      
      {/* Banner / Header */}
      <div className="bg-white border border-gray-200 p-6 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-emerald-900 text-white text-[10px] font-bold rounded uppercase tracking-wider">
              Menu Hari Ini
            </span>
            <span className="text-xs text-gray-500 font-medium">Ahli Gizi · Lembar Kerja</span>
          </div>
          <h1 className="text-xl font-bold text-emerald-950">Nutrisi & Pemeriksaan Keamanan Pangan</h1>
          <p className="text-gray-500 text-xs font-medium">
            Formulasi takaran menu harian, analisis makro-nutrien, dan log penjaminan mutu food safety.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Form Input Menu */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-gray-200 p-5 rounded-lg space-y-4">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-gray-150">
              <Plus size={16} className="text-emerald-950" /> Tambah Hidangan Menu
            </h2>
            
            <form onSubmit={handleAddMenu} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-gray-600">Nama Hidangan / Bahan</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Ayam Bakar Madu"
                  className="w-full p-2 border border-gray-200 rounded text-gray-755 outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-gray-600">Ukuran Porsi</label>
                  <input
                    type="text"
                    required
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    placeholder="Contoh: 100 gram"
                    className="w-full p-2 border border-gray-200 rounded text-gray-755 outline-none font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-600">Kalori (Kkal)</label>
                  <input
                    type="number"
                    required
                    value={kalori}
                    onChange={(e) => setKalori(e.target.value)}
                    placeholder="Kkal"
                    className="w-full p-2 border border-gray-200 rounded text-gray-755 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-gray-600">Protein (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                    placeholder="g"
                    className="w-full p-2 border border-gray-200 rounded text-gray-755 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-600">Karbohidrat (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={karbo}
                    onChange={(e) => setKarbo(e.target.value)}
                    placeholder="g"
                    className="w-full p-2 border border-gray-200 rounded text-gray-755 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-600">Lemak (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={lemak}
                    onChange={(e) => setLemak(e.target.value)}
                    placeholder="g"
                    className="w-full p-2 border border-gray-200 rounded text-gray-755 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-900 hover:bg-emerald-950 text-white font-bold uppercase rounded border border-emerald-950 transition cursor-pointer"
              >
                Simpan & Analisis Gizi
              </button>
            </form>
          </div>

          {/* Form Input Food Safety Check */}
          <div className="bg-white border border-gray-200 p-5 rounded-lg space-y-4">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-gray-150">
              <ShieldCheck size={16} className="text-emerald-950" /> Catat Uji Food Safety
            </h2>
            
            <form onSubmit={handleAddSafety} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-gray-600">Parameter Cek</label>
                <input
                  type="text"
                  required
                  value={newParam}
                  onChange={(e) => setNewParam(e.target.value)}
                  placeholder="Contoh: Uji Retensi Sampel Makan Siang"
                  className="w-full p-2 border border-gray-200 rounded text-gray-755 outline-none font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-600">Hasil Pemeriksaan</label>
                <input
                  type="text"
                  required
                  value={newResult}
                  onChange={(e) => setNewResult(e.target.value)}
                  placeholder="Contoh: Lolos Uji / Suhu 3.5°C"
                  className="w-full p-2 border border-gray-200 rounded text-gray-755 outline-none font-medium"
                />
              </div>

              <div className="flex items-center gap-4 py-1">
                <label className="text-gray-600">Kesimpulan:</label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    checked={newOk === true}
                    onChange={() => setNewOk(true)}
                    className="cursor-pointer"
                  />
                  <span>Sesuai SOP ✓</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-amber-700">
                  <input
                    type="radio"
                    checked={newOk === false}
                    onChange={() => setNewOk(false)}
                    className="cursor-pointer"
                  />
                  <span>Ada Masalah ⚠️</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-emerald-900 hover:bg-emerald-950 text-white font-bold uppercase rounded border border-emerald-950 transition cursor-pointer"
              >
                Log Hasil Uji
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Nutrition Table & Safety Log */}
        <div className="lg:col-span-2 space-y-6">

          {/* Nutrition Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Wheat size={16} className="text-emerald-950" /> Riwayat Nilai Gizi Menu Harian
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-left border-b border-gray-200">
                    <th className="px-4 py-2.5">Nama Hidangan</th>
                    <th className="px-4 py-2.5">Porsi</th>
                    <th className="px-4 py-2.5 text-right">Kalori</th>
                    <th className="px-4 py-2.5 text-right">Protein</th>
                    <th className="px-4 py-2.5 text-right">Karbo</th>
                    <th className="px-4 py-2.5 text-right">Lemak</th>
                    <th className="px-4 py-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 font-semibold text-gray-700">
                  {menuItems.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50/40">
                      <td className="px-4 py-3 font-bold text-slate-800">{item.name}</td>
                      <td className="px-4 py-3 text-slate-500 font-medium">{item.qty}</td>
                      <td className="px-4 py-3 text-right">{item.kalori} Kkal</td>
                      <td className="px-4 py-3 text-right text-emerald-800 font-bold">{item.protein}g</td>
                      <td className="px-4 py-3 text-right text-amber-700 font-bold">{item.karbo}g</td>
                      <td className="px-4 py-3 text-right text-indigo-800 font-bold">{item.lemak}g</td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 text-[9px] font-bold rounded border bg-emerald-50 text-emerald-800 border-emerald-200">
                          Lolos QC
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-emerald-50/50 font-extrabold text-emerald-950 border-t border-gray-200">
                    <td className="px-4 py-3">Total / Porsi Sajian</td>
                    <td className="px-4 py-3 text-slate-400">Porsi Standar</td>
                    <td className="px-4 py-3 text-right">{menuItems.reduce((s, i) => s + i.kalori, 0)} Kkal</td>
                    <td className="px-4 py-3 text-right">{menuItems.reduce((s, i) => s + i.protein, 0).toFixed(1)}g</td>
                    <td className="px-4 py-3 text-right">{menuItems.reduce((s, i) => s + i.karbo, 0).toFixed(1)}g</td>
                    <td className="px-4 py-3 text-right">{menuItems.reduce((s, i) => s + i.lemak, 0).toFixed(1)}g</td>
                    <td className="px-4 py-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Safety Log Checklist History */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-emerald-950" /> Log Penjaminan Mutu & Food Safety harian
              </h2>
            </div>
            <div className="divide-y divide-gray-150">
              {safetyLogs.map((log, i) => (
                <div key={i} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-semibold">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {log.ok 
                        ? <CheckCircle size={15} className="text-emerald-700" />
                        : <AlertTriangle size={15} className="text-amber-600" />
                      }
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{log.param}</h4>
                      <p className="text-gray-500 font-medium mt-0.5">Hasil Uji: <strong className="text-slate-800">{log.result}</strong></p>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold">
                    Pukul {log.time}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
