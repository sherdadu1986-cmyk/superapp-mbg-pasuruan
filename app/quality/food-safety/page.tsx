"use client"
import React from 'react'
import { ShieldCheck, Heart } from 'lucide-react'

export default function FoodSafetyPage() {
  const regulations = [
    { title: 'Suhu Penyimpanan Bahan Basah (Daging/Sayur)', standard: 'Suhu freezer &lt; -5°C, chiller 0-4°C', status: 'Sesuai' },
    { title: 'Suhu Penyajian Makanan Jadi (Hot Holding)', standard: 'Suhu wadah hotbox &gt; 60°C', status: 'Sesuai' },
    { title: 'Higienitas Personil (Relawan Dapur)', standard: 'Masker, Celemek, Sarung Tangan, Penutup Kepala', status: 'Sesuai' },
    { title: 'Uji Retensi Sampel Makanan (24 Jam)', standard: 'Penyimpanan 1 sampel porsi di chiller untuk uji lab', status: 'Sesuai' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <nav className="text-sm text-slate-500 mb-1">Quality / Food Safety</nav>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">🛡 Food Safety & Higiene</h1>
        <p className="text-slate-500 text-sm mt-1">Pemantauan kepatuhan standar keamanan pangan dan uji sampel makanan.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="text-emerald-600" size={20} />
            Standar Keamanan Pangan (Food Safety)
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {regulations.map((item, index) => (
            <div key={index} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl mt-1">
                  <Heart size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{item.title}</h3>
                  <p className="text-slate-600 font-semibold text-sm mt-1">SOP: {item.standard}</p>
                </div>
              </div>
              <div>
                <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100">
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
