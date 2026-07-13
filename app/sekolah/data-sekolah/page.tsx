"use client"
import React from 'react'
import { GraduationCap, MapPin } from 'lucide-react'

export default function DataSekolahPage() {
  const schools = [
    { name: 'SDN 1 Wonorejo', portions: 450, location: 'Wonorejo Barat', contact: 'Bp. Mulyono (Kepsek)' },
    { name: 'SDN 2 Wonorejo', portions: 380, location: 'Wonorejo Timur', contact: 'Ibu Endang (Wakasek)' },
    { name: 'SMPN 1 Wonorejo', portions: 820, location: 'Wonorejo Tengah', contact: 'Bp. Supriyanto (Sarpras)' },
    { name: 'SDN Cobanblimbing 1', portions: 250, location: 'Cobanblimbing', contact: 'Ibu Retno (Komite)' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <nav className="text-sm text-slate-500 mb-1">Sekolah / Data Sekolah</nav>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">🏫 Data Sekolah Penerima</h1>
        <p className="text-slate-500 text-sm mt-1">Daftar sekolah penerima manfaat program Makanan Bergizi Gratis (MBG) Wonorejo.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <GraduationCap className="text-indigo-600" size={20} />
            Daftar Sekolah & Target Porsi
          </h2>
          <span className="text-xs font-bold text-slate-500 uppercase bg-slate-100 px-3 py-1 rounded-full">
            17 Sekolah Terdaftar
          </span>
        </div>
        <div className="divide-y divide-slate-100">
          {schools.map((item, index) => (
            <div key={index} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl mt-1">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{item.name}</h3>
                  <p className="text-slate-600 font-semibold text-sm mt-1">Wilayah: {item.location} • Kontak: {item.contact}</p>
                </div>
              </div>
              <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-center md:text-right">
                <span className="block text-xs font-bold uppercase tracking-wider text-indigo-400">Porsi Harian</span>
                <span className="text-lg font-extrabold">{item.portions} Box</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
