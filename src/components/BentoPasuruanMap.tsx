"use client"
import React, { useState } from 'react'
import { MapPin, Info } from 'lucide-react'

// Bento Box Map Data Pasuruan
const mapData = [
    // Baris 1 (Utara)
    { id: 'gempol', name: 'Gempol', unit: 4, gridArea: 'col-start-1 col-span-2 row-start-1 row-span-1' },
    { id: 'beji', name: 'Beji', unit: 2, gridArea: 'col-start-3 col-span-1 row-start-1 row-span-1' },
    { id: 'bangil', name: 'Bangil', unit: 0, gridArea: 'col-start-4 col-span-2 row-start-1 row-span-1' },
    { id: 'kraton', name: 'Kraton', unit: 0, gridArea: 'col-start-6 col-span-1 row-start-1 row-span-1' },
    { id: 'rejoso', name: 'Rejoso', unit: 0, gridArea: 'col-start-7 col-span-2 row-start-1 row-span-1' },
    { id: 'lekok', name: 'Lekok', unit: 3, gridArea: 'col-start-9 col-span-1 row-start-1 row-span-1' },
    { id: 'nguling', name: 'Nguling', unit: 0, gridArea: 'col-start-10 col-span-1 row-start-1 row-span-2' }, // Timur Jauh

    // Baris 2
    { id: 'pandaan', name: 'Pandaan', unit: 0, gridArea: 'col-start-2 col-span-1 row-start-2 row-span-1' },
    { id: 'rembang', name: 'Rembang', unit: 1, gridArea: 'col-start-3 col-span-2 row-start-2 row-span-1' },
    { id: 'pohjentrek', name: 'Pohjentrek', unit: 0, gridArea: 'col-start-5 col-span-1 row-start-2 row-span-1' },
    { id: 'gondangwetan', name: 'Gondang Wetan', unit: 0, gridArea: 'col-start-6 col-span-2 row-start-2 row-span-1' },
    { id: 'grati', name: 'Grati', unit: 1, gridArea: 'col-start-8 col-span-2 row-start-2 row-span-2' },

    // Baris 3
    { id: 'prigen', name: 'Prigen', unit: 0, gridArea: 'col-start-1 col-span-2 row-start-3 row-span-2' }, // Barat Jauh (Besar)
    { id: 'sukorejo', name: 'Sukorejo', unit: 2, gridArea: 'col-start-3 col-span-1 row-start-3 row-span-1' },
    { id: 'wonorejo', name: 'Wonorejo', unit: 0, gridArea: 'col-start-4 col-span-1 row-start-3 row-span-1' },
    { id: 'kejayan', name: 'Kejayan', unit: 1, gridArea: 'col-start-5 col-span-2 row-start-3 row-span-2' }, // Tengah (Besar)
    { id: 'winongan', name: 'Winongan', unit: 0, gridArea: 'col-start-7 col-span-1 row-start-3 row-span-1' },

    // Baris 4
    { id: 'purwosari', name: 'Purwosari', unit: 3, gridArea: 'col-start-3 col-span-2 row-start-4 row-span-1' },
    { id: 'pasrepan', name: 'Pasrepan', unit: 0, gridArea: 'col-start-7 col-span-1 row-start-4 row-span-2' },
    { id: 'lumbang', name: 'Lumbang', unit: 0, gridArea: 'col-start-8 col-span-2 row-start-4 row-span-2' },

    // Baris 5 & 6 & 7 (Selatan/Pegunungan)
    { id: 'purwodadi', name: 'Purwodadi', unit: 0, gridArea: 'col-start-3 col-span-2 row-start-5 row-span-2' },
    { id: 'puspo', name: 'Puspo', unit: 1, gridArea: 'col-start-5 col-span-2 row-start-5 row-span-1' },
    { id: 'tutur', name: 'Tutur', unit: 0, gridArea: 'col-start-5 col-span-2 row-start-6 row-span-2' },
    { id: 'tosari', name: 'Tosari', unit: 0, gridArea: 'col-start-7 col-span-2 row-start-6 row-span-2' }, // Tenggara (Besar)
]

export default function BentoPasuruanMap() {
    const [selectedNode, setSelectedNode] = useState<string | null>(null)

    const selectedData = selectedNode ? mapData.find((d) => d.id === selectedNode) : null

    return (
        <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div className="w-full lg:w-[65%] space-y-6">
                <div
                    className="grid grid-cols-10 grid-rows-[7] auto-rows-[1fr] gap-2 p-6 bg-slate-900 rounded-2xl shadow-2xl h-[600px] w-full relative"
                    onClick={() => setSelectedNode(null)}
                >
                    {/* Items Grid Loop */}
                    {mapData.map((node) => {
                        const hasUnit = node.unit > 0
                        const isSelected = selectedNode === node.id

                        let baseStyle = `relative flex flex-col items-center justify-center p-2 rounded-xl border border-white/10 cursor-pointer transition-all duration-300 overflow-hidden group hover:scale-[1.03] hover:z-10 hover:shadow-xl ${node.gridArea} `

                        // Theme Colors
                        if (hasUnit) {
                            baseStyle += "bg-emerald-500 hover:bg-emerald-400 "
                        } else {
                            baseStyle += "bg-slate-700 hover:bg-slate-600 "
                        }

                        // Selection State Focus Outline
                        if (isSelected) {
                            baseStyle += hasUnit ? "ring-2 ring-emerald-300 ring-offset-2 ring-offset-slate-900 shadow-[0_0_20px_rgba(16,185,129,0.8)] z-20 scale-[1.03] " : "ring-2 ring-slate-400 ring-offset-2 ring-offset-slate-900 shadow-[0_0_20px_rgba(255,255,255,0.2)] z-20 scale-[1.03] "
                        }

                        return (
                            <div
                                key={node.id}
                                className={baseStyle}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedNode(node.id)
                                }}
                            >
                                {/* Text Label */}
                                <h4 className="text-white font-bold text-xs md:text-sm text-center leading-tight break-words z-10 drop-shadow-md relative w-full px-1">
                                    {node.name}
                                </h4>

                                {/* Unit Indicator Badge */}
                                <div className="mt-1 bg-black/20 px-2 py-0.5 rounded-full z-10 border border-white/10">
                                    <p className="text-[10px] md:text-xs text-white/90 font-medium">
                                        {node.unit} Unit
                                    </p>
                                </div>

                                {/* Background Accent Icon (optional decoration) */}
                                <div className="absolute -right-2 -bottom-2 opacity-10 blur-[1px] transform group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                                    <MapPin size={48} />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* DETAIL PANEL */}
            <div className="w-full lg:w-[35%] bg-white/60 backdrop-blur-2xl border border-white/60 shadow-xl rounded-3xl p-6 lg:p-8"
                style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.8), 0 20px 40px -10px rgba(0,0,0,0.1)' }}>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest mb-6 border-b border-slate-200/50 pb-4">
                    Detail Kecamatan
                </h3>

                {selectedData ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="flex items-start gap-4">
                            <div className={`p-4 rounded-2xl shadow-inner ${selectedData.unit > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                <MapPin size={28} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Nama Wilayah</p>
                                <h4 className="text-2xl font-black text-slate-800">{selectedData.name}</h4>
                            </div>
                        </div>

                        <div className="bg-white/50 rounded-2xl p-5 border border-white/50 shadow-sm space-y-4">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status SPPG</p>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${selectedData.unit > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                    <p className={`text-sm font-bold ${selectedData.unit > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                                        {selectedData.unit > 0 ? 'Tercover' : 'Belum Tercover'}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-200/50">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Unit Terdaftar</p>
                                <p className="text-3xl font-black text-slate-800">
                                    {selectedData.unit} <span className="text-base font-bold text-slate-400">Unit</span>
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center py-12 px-4 space-y-4 animate-in fade-in duration-500">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-2">
                            <MapPin size={24} className="text-slate-300" />
                        </div>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Belum Ada Pilihan</h4>
                        <p className="text-sm text-slate-500 font-medium">
                            Pilih salah satu grid area pada peta di samping untuk melihat detail statistik unit SPPG.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
