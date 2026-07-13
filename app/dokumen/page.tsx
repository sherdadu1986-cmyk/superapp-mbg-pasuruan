"use client"
import React from 'react'
import { Folder, FileText, Download } from 'lucide-react'

export default function DokumenPage() {
  const documents = [
    { title: 'SOP Higienitas & Sanitasi Dapur SPPG', version: 'V2.1', date: 'Maret 2026' },
    { title: 'SOP Keamanan Pangan & Uji Organoleptik', version: 'V1.4', date: 'Mei 2026' },
    { title: 'Panduan Rute Logistik & Distribusi Wonorejo', version: 'V3.0', date: 'Juli 2026' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">📁 Dokumen</h1>
        <p className="text-slate-500 text-sm mt-1">Arsip dokumen standar operasional, panduan, dan regulasi dapur SPPG.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Folder className="text-indigo-600" size={20} />
            Dokumen Kebijakan & Panduan SOP
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {documents.map((item, index) => (
            <div key={index} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl mt-1">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{item.title}</h3>
                  <p className="text-slate-500 text-xs mt-1">Versi: {item.version} • Terbit: {item.date}</p>
                </div>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-bold rounded-xl transition duration-150 w-fit">
                <Download size={16} />
                Buka Dokumen
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
