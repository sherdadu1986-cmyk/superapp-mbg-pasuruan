"use client"
import React, { useState } from 'react'
import { Calculator, ShoppingBag } from 'lucide-react'

export default function KalkulatorBahanPage() {
  const [portions, setPortions] = useState(3214)

  const calcIngredients = (portionsCount: number) => {
    return [
      { name: 'Beras', amount: portionsCount * 0.12, unit: 'Kg' },
      { name: 'Daging Ayam', amount: portionsCount * 0.1, unit: 'Kg' },
      { name: 'Sayur Sop Campur', amount: portionsCount * 0.08, unit: 'Kg' },
      { name: 'Minyak Goreng', amount: portionsCount * 0.015, unit: 'Liter' },
      { name: 'Susu UHT', amount: portionsCount * 1.0, unit: 'Kotak' }
    ]
  }

  const ingredients = calcIngredients(portions)

  return (
    <div className="space-y-6">
      <div>
        <nav className="text-sm text-slate-500 mb-1">Operasional / Kalkulator Bahan</nav>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">🧮 Kalkulator Bahan</h1>
        <p className="text-slate-500 text-sm mt-1">Estimasi otomatis kebutuhan bahan mentah berdasarkan jumlah porsi target.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Calculator className="text-indigo-600" size={20} />
            Input Portions
          </h2>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Jumlah Porsi Target</label>
            <input 
              type="number" 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 text-lg outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150"
              value={portions}
              onChange={(e) => setPortions(Math.max(0, parseInt(e.target.value) || 0))}
            />
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <ShoppingBag className="text-emerald-600" size={20} />
              Kebutuhan Bahan Mentah
            </h2>
            <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
              Kebutuhan Untuk {portions.toLocaleString('id-ID')} Porsi
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {ingredients.map((item, index) => (
              <div key={index} className="p-4 px-6 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                <span className="font-semibold text-slate-700">{item.name}</span>
                <span className="font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg text-sm">
                  {item.amount.toLocaleString('id-ID', { maximumFractionDigits: 1 })} {item.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
