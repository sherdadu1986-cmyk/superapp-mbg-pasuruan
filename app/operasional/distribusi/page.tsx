"use client"
import React from 'react'
import { Truck, CheckCircle2, Navigation } from 'lucide-react'

export default function DistribusiPage() {
  const routes = [
    { id: 1, route: 'Rute 1 - Wonorejo Barat (SDN 1 Wonorejo, SDN 3 Wonorejo)', driver: 'Budi Santoso', status: 'Telah Tiba', time: '07:15', color: 'text-emerald-600 bg-emerald-50' },
    { id: 2, route: 'Rute 2 - Wonorejo Timur (SDN 2 Wonorejo, SMPN 1 Wonorejo)', driver: 'Edi Wibowo', status: 'Dalam Perjalanan', time: '07:30', color: 'text-amber-600 bg-amber-50' },
    { id: 3, route: 'Rute 3 - Wonorejo Utara (SDN Cobanblimbing 1, 2)', driver: 'Slamet Rahardjo', status: 'Persiapan', time: '07:45', color: 'text-slate-500 bg-slate-50' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <nav className="text-sm text-slate-500 mb-1">Operasional / Distribusi</nav>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">🚚 Rute Distribusi</h1>
        <p className="text-slate-500 text-sm mt-1">Pemantauan armada pengiriman dan logistik makanan ke sekolah-sekolah tujuan.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Truck className="text-emerald-600" size={20} />
            Pengiriman Hari Ini
          </h2>
          <span className="text-xs font-bold text-slate-500 uppercase bg-slate-100 px-3 py-1 rounded-full">
            7/10 Selesai
          </span>
        </div>
        <div className="divide-y divide-slate-100">
          {routes.map((item) => (
            <div key={item.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl mt-1">
                  <Navigation size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{item.route}</h3>
                  <p className="text-slate-600 font-medium text-sm mt-1">Pengemudi: {item.driver}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${item.color}`}>
                  {item.status} ({item.time})
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
