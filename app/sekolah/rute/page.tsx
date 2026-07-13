"use client"
import React from 'react'
import { Navigation, Compass } from 'lucide-react'

export default function RutePage() {
  const routes = [
    { name: 'Rute Wonorejo Barat (Rute 1)', distance: '8.4 Km', duration: '20 Menit', stops: 'SDN 1 Wonorejo, SDN 3 Wonorejo, MI Wonorejo' },
    { name: 'Rute Wonorejo Timur (Rute 2)', distance: '12.1 Km', duration: '35 Menit', stops: 'SDN 2 Wonorejo, SMPN 1 Wonorejo, MTs Wonorejo' },
    { name: 'Rute Wonorejo Utara (Rute 3)', distance: '14.5 Km', duration: '40 Menit', stops: 'SDN Cobanblimbing 1, SDN Cobanblimbing 2' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <nav className="text-sm text-slate-500 mb-1">Sekolah / Rute</nav>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">🗺 Rute Pengiriman</h1>
        <p className="text-slate-500 text-sm mt-1">Pemetaan rute logistik distribusi makanan bergizi gratis.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Compass className="text-indigo-600" size={20} />
            Daftar Rute Logistik
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {routes.map((item, index) => (
            <div key={index} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl mt-1">
                  <Navigation size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{item.name}</h3>
                  <p className="text-slate-600 font-semibold text-sm mt-1">Sekolah: {item.stops}</p>
                </div>
              </div>
              <div className="flex gap-4 text-sm font-bold text-slate-700">
                <span className="bg-slate-100 px-3 py-1.5 rounded-lg">📍 {item.distance}</span>
                <span className="bg-slate-100 px-3 py-1.5 rounded-lg">⏱ {item.duration}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
