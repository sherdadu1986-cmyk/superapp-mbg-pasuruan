"use client"
import React from 'react'
import { Briefcase, Phone, MapPin } from 'lucide-react'

export default function SupplierPage() {
  const suppliers = [
    { name: 'Koperasi Tani Wonorejo', category: 'Penyedia Beras & Sayuran', phone: '0812-3456-7890', address: 'Jl. Raya Wonorejo No. 45, Pasuruan' },
    { name: 'CV Daging Segar Barokah', category: 'Penyedia Ayam & Daging Sapi', phone: '0812-9876-5432', address: 'Kec. Purwosari, Pasuruan' },
    { name: 'KUD Susu Pasuruan', category: 'Penyedia Susu Segar', phone: '0857-1111-2222', address: 'Jl. Pahlawan No. 12, Pasuruan' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <nav className="text-sm text-slate-500 mb-1">Gudang / Supplier</nav>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">🏢 Daftar Supplier</h1>
        <p className="text-slate-500 text-sm mt-1">Daftar rekanan penyedia bahan pangan yang bermitra dengan Dapur SPPG.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Briefcase className="text-indigo-600" size={20} />
            Mitra Supplier Terdaftar
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {suppliers.map((item, index) => (
            <div key={index} className="p-6 space-y-3 hover:bg-slate-50/50 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <h3 className="font-bold text-slate-800 text-lg">{item.name}</h3>
                <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full w-fit">
                  {item.category}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600 font-medium">
                <span className="flex items-center gap-1.5">
                  <Phone size={14} className="text-slate-400" />
                  {item.phone}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-slate-400" />
                  {item.address}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
