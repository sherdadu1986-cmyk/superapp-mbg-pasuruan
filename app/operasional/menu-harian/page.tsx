"use client"
import React from 'react'
import { Utensils, Heart } from 'lucide-react'

export default function MenuHarianPage() {
  const menus = [
    { day: 'Senin', main: 'Nasi Putih, Ayam Teriyaki, Tumis Buncis', nutritionalValue: 'Kkal: 650, Protein: 28g, Kalsium: 150mg', milk: 'Susu UHT 200ml' },
    { day: 'Selasa', main: 'Nasi Kuning, Ayam Goreng Lengkuas, Sambal Goreng Kentang', nutritionalValue: 'Kkal: 680, Protein: 30g, Kalsium: 160mg', milk: 'Susu Putih 200ml' },
    { day: 'Rabu', main: 'Nasi Uduk, Empal Daging, Tumis Kacang Panjang', nutritionalValue: 'Kkal: 710, Protein: 32g, Kalsium: 170mg', milk: 'Susu Cokelat 200ml' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <nav className="text-sm text-slate-500 mb-1">Operasional / Menu Harian</nav>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">🍱 Menu Harian</h1>
        <p className="text-slate-500 text-sm mt-1">Daftar menu bergizi gratis dan informasi nutrisi harian untuk siswa.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Utensils className="text-emerald-600" size={20} />
            Daftar Siklus Menu Minggu Ini
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {menus.map((item, index) => (
            <div key={index} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors duration-200">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl mt-1">
                  <Heart size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{item.day}</h3>
                  <p className="text-slate-700 font-semibold mt-1">{item.main}</p>
                  <p className="text-slate-500 text-xs mt-1">{item.nutritionalValue}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-bold">
                🥛 {item.milk}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
