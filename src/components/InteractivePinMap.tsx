"use client"
import React, { useState } from 'react';
import { Building2, MapPin, LayoutDashboard } from 'lucide-react';

type KecamatanData = {
    id: string;
    name: string;
    unit: number;
    top: string;
    left: string;
};

const mapData: KecamatanData[] = [
    // Utara
    { id: 'gempol', name: 'Gempol', unit: 5, top: '15%', left: '19%' },
    { id: 'beji', name: 'Beji', unit: 5, top: '14%', left: '31%' },
    { id: 'bangil', name: 'Bangil', unit: 8, top: '11%', left: '43%' },
    { id: 'kraton', name: 'Kraton', unit: 4, top: '19%', left: '52%' },
    { id: 'rejoso', name: 'Rejoso', unit: 1, top: '35%', left: '71%' },
    { id: 'lekok', name: 'Lekok', unit: 3, top: '31%', left: '83%' },
    { id: 'nguling', name: 'Nguling', unit: 1, top: '40%', left: '92%' },
    // Tengah
    { id: 'pandaan', name: 'Pandaan', unit: 8, top: '27%', left: '24%' },
    { id: 'rembang', name: 'Rembang', unit: 4, top: '26%', left: '40%' },
    { id: 'pohjentrek', name: 'Pohjentrek', unit: 3, top: '29%', left: '56%' },
    { id: 'gondangwetan', name: 'Gondang Wetan', unit: 2, top: '37%', left: '63%' },
    { id: 'grati', name: 'Grati', unit: 5, top: '47%', left: '82%' },
    { id: 'prigen', name: 'Prigen', unit: 5, top: '41%', left: '14%' },
    { id: 'sukorejo', name: 'Sukorejo', unit: 5, top: '36%', left: '29%' },
    { id: 'wonorejo', name: 'Wonorejo', unit: 4, top: '41%', left: '40%' },
    { id: 'kejayan', name: 'Kejayan', unit: 4, top: '46%', left: '50%' },
    { id: 'winongan', name: 'Winongan', unit: 1, top: '48%', left: '69%' },
    // Selatan
    { id: 'purwosari', name: 'Purwosari', unit: 6, top: '52%', left: '30%' },
    { id: 'pasrepan', name: 'Pasrepan', unit: 0, top: '59%', left: '59%' }, // Kosong
    { id: 'lumbang', name: 'Lumbang', unit: 1, top: '67%', left: '79%' },
    { id: 'purwodadi', name: 'Purwodadi', unit: 6, top: '67%', left: '34%' },
    { id: 'puspo', name: 'Puspo', unit: 0, top: '71%', left: '54%' }, // Kosong
    { id: 'tutur', name: 'Tutur', unit: 3, top: '86%', left: '45%' },
    { id: 'tosari', name: 'Tosari', unit: 1, top: '86%', left: '61%' },
];

const InteractivePinMap = () => {
    const [selectedKecamatan, setSelectedKecamatan] = useState<KecamatanData | null>(null);

    return (
        <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div className="w-full lg:w-[65%] space-y-6">
                <div
                    className="relative w-full max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center p-6 md:p-10"
                    onClick={() => setSelectedKecamatan(null)}
                >
                    {/* Subtle grid background */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

                    <div className="relative w-full h-auto">
                        <img
                            src="/peta.png"
                            alt="Map"
                            className="w-full h-auto object-contain opacity-60 grayscale invert brightness-75 contrast-125 drop-shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all duration-500"
                        />

                        {/* Area Pin Overlay */}
                        <div className="absolute inset-0">
                            {mapData.map((item) => (
                                <div
                                    key={item.id}
                                    className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer z-10 hover:z-50"
                                    style={{ top: item.top, left: item.left }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedKecamatan(item);
                                    }}
                                >
                                    {/* Visual Pin */}
                                    <div className="relative flex items-center justify-center">
                                        {item.unit > 0 ? (
                                            <div className="relative bg-slate-900/80 p-1 rounded-lg border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.5)] z-20 group-hover:scale-110 group-hover:bg-slate-900 transition-all flex items-center justify-center">
                                                <div className="absolute w-8 h-8 bg-emerald-500/40 rounded-lg animate-ping opacity-75"></div>
                                                <Building2 className="w-4 h-4 text-emerald-400 relative z-10" />
                                            </div>
                                        ) : (
                                            <div className="relative bg-slate-800/40 p-1 rounded-md border border-slate-700/50 z-10 group-hover:scale-110 group-hover:bg-slate-800 transition-all flex items-center justify-center">
                                                <Building2 className="w-3 h-3 text-slate-500/70" />
                                            </div>
                                        )}
                                    </div>
                                    {/* Label Nama */}
                                    <div className="mt-1 px-3 py-1 bg-slate-900/90 text-slate-200 border border-slate-700 backdrop-blur-md rounded-lg shadow-xl text-[10px] md:text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none relative z-20">
                                        {item.name}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Kolom Kanan: Detail */}
            <div className="w-full lg:w-[35%] bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-2xl h-full flex flex-col justify-center">
                <h3 className="text-lg font-bold text-white mb-6 tracking-wide uppercase border-b border-slate-800 pb-4 flex items-center gap-2">
                    <LayoutDashboard className="w-5 h-5 text-indigo-400" /> Detail Kecamatan
                </h3>
                {selectedKecamatan ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Nama Wilayah */}
                        <div>
                            <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">
                                Nama Wilayah
                            </h4>
                            <div className="flex items-center space-x-3 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                                <div className="p-2 bg-emerald-900/30 rounded-lg text-emerald-400">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <span className="text-xl font-extrabold text-white">
                                    {selectedKecamatan.name}
                                </span>
                            </div>
                        </div>
                        {/* Status SPPG */}
                        <div>
                            <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">
                                Status SPPG
                            </h4>
                            <div className="flex items-center space-x-2">
                                <div className={`w-3 h-3 rounded-full ${selectedKecamatan.unit > 0 ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-slate-600'}`}></div>
                                <span className={`font-semibold ${selectedKecamatan.unit > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                                    {selectedKecamatan.unit > 0 ? 'Tercover' : 'Belum Ada Unit'}
                                </span>
                            </div>
                        </div>
                        {/* Total Unit */}
                        <div>
                            <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">
                                Total Unit SPPG
                            </h4>
                            <div className="flex items-baseline space-x-2">
                                <span className="text-4xl font-black text-white">
                                    {selectedKecamatan.unit}
                                </span>
                                <span className="text-slate-400 font-medium">Unit</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col h-full justify-center space-y-6 animate-in fade-in duration-500">
                        <div>
                            <h4 className="text-emerald-400 font-bold tracking-widest text-sm mb-1 uppercase">Kabupaten Pasuruan</h4>
                            <h2 className="text-2xl font-black text-white leading-tight">DATA SEBARAN SPPG<br />PER KECAMATAN</h2>
                        </div>

                        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 space-y-4">
                            <div className="flex justify-between items-center border-b border-slate-700 pb-4">
                                <span className="text-slate-300 font-medium">TOTAL SPPG</span>
                                <span className="text-4xl font-black text-white">86</span>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                                    <span className="text-sm text-slate-400">Sudah Operasional</span>
                                </div>
                                <span className="text-xl font-bold text-emerald-400">66</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 bg-slate-500 rounded-full"></div>
                                    <span className="text-sm text-slate-400">Belum Operasional</span>
                                </div>
                                <span className="text-xl font-bold text-slate-300">20</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InteractivePinMap;
