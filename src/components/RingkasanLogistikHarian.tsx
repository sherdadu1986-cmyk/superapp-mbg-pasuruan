"use client"
import React, { useMemo } from 'react'
import { Truck, Box, Clock, CheckCircle2, Sparkles } from 'lucide-react'
import { calculateKpmPortion, getPosyanduBreakdown, type KelompokPenerimaManfaat } from '@/lib/data-helpers'

export interface RingkasanLogistikHarianProps {
  kpmList: KelompokPenerimaManfaat[]
  liburKpmIds: string[]
  distribusiSettings: Record<string, { rute: 'Kiri' | 'Kanan'; no_hp_pic: string }>
}

export function RingkasanLogistikHarian({
  kpmList,
  liburKpmIds,
  distribusiSettings
}: RingkasanLogistikHarianProps) {
  const {
    ruteKiriTotal,
    ruteKiriTitik,
    ruteKananTotal,
    ruteKananTitik,
    totalKecil,
    totalBesar,
    totalTendik,
    grandTotalPorsi,
    pctKiri,
    pctKanan
  } = useMemo(() => {
    let ruteKiriTotal = 0
    let ruteKiriTitik = 0

    let ruteKananTotal = 0
    let ruteKananTitik = 0

    let totalKecil = 0
    let totalBesar = 0
    let totalTendik = 0

    const totalKpm = kpmList.length

    kpmList.forEach((item, idx) => {
      const itemKey = item.id || item.kode || item.identitas_npsn_tmp || String(idx)
      const isLibur = liburKpmIds.includes(itemKey) || (Boolean(item.id) && liburKpmIds.includes(item.id!))

      if (isLibur) return

      const nama = String(item.nama || (item as any).nama_kelompok || '').toUpperCase()
      const jenis = String(item.kategori || (item as any).jenis || '').toUpperCase()
      const isPosyandu = nama.includes('POSYANDU') || jenis.includes('POSYANDU') || nama.includes('DUSUN')

      const savedSetting = distribusiSettings[itemKey]
      const defaultRute: 'Kiri' | 'Kanan' = idx < Math.ceil(totalKpm / 2) ? 'Kiri' : 'Kanan'
      const rute: 'Kiri' | 'Kanan' = savedSetting?.rute || defaultRute

      let total = 0
      let kecil = 0
      let besar = 0
      let tendik = 0

      if (isPosyandu) {
        const pos = getPosyanduBreakdown(item)
        total = pos.total
        kecil = pos.balita
        besar = pos.bumil + pos.busui
        tendik = 0
      } else {
        const breakdown = calculateKpmPortion(item)
        total = breakdown.total
        kecil = breakdown.porsiKecil
        besar = breakdown.siswaBesar
        tendik = breakdown.tendik
      }

      if (rute === 'Kiri') {
        ruteKiriTotal += total
        ruteKiriTitik += 1
      } else {
        ruteKananTotal += total
        ruteKananTitik += 1
      }

      totalKecil += kecil
      totalBesar += besar
      totalTendik += tendik
    })

    const grandTotalPorsi = ruteKiriTotal + ruteKananTotal
    const pctKiri = grandTotalPorsi > 0 ? Math.round((ruteKiriTotal / grandTotalPorsi) * 100) : 50
    const pctKanan = grandTotalPorsi > 0 ? 100 - pctKiri : 50

    return {
      ruteKiriTotal,
      ruteKiriTitik,
      ruteKananTotal,
      ruteKananTitik,
      totalKecil,
      totalBesar,
      totalTendik,
      grandTotalPorsi,
      pctKiri,
      pctKanan
    }
  }, [kpmList, liburKpmIds, distribusiSettings])

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-2xl p-5 space-y-4 hover:bg-white/80 hover:shadow-[0_12px_40px_0_rgba(31,38,135,0.12)] transition-all duration-300">
      {/* Header Container */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md border border-indigo-200">
            <Truck size={16} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-sm tracking-tight">
              Ringkasan Logistik & Muatan Armada
            </h2>
            <p className="text-[11px] text-slate-500">
              Beban rute armada & kebutuhan packing dapur real-time.
            </p>
          </div>
        </div>
        <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider flex items-center gap-1">
          <Sparkles size={11} /> Real-Time Sync
        </span>
      </div>

      {/* Bagian 1: Beban Muatan Armada Distribusi */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <span className="flex items-center gap-1.5 text-slate-900 font-bold">
            <Truck size={14} className="text-indigo-600" /> Beban Muatan Armada Distribusi
          </span>
          <span className="font-mono text-[11px] text-slate-500">
            {grandTotalPorsi.toLocaleString('id-ID')} Total Porsi
          </span>
        </div>

        {/* Grid 2 Kolom Rute Kiri vs Rute Kanan */}
        <div className="grid grid-cols-2 gap-3">
          {/* Kotak Rute Kiri */}
          <div className="bg-gradient-to-br from-indigo-50/70 to-blue-50/30 p-3 rounded-xl border border-indigo-200/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-bold text-indigo-900 uppercase tracking-wider">
                Rute Kiri (Armada Barat)
              </span>
              <div className="p-1 bg-indigo-600 text-white rounded-md">
                <Truck size={12} />
              </div>
            </div>
            <div className="text-lg font-black text-indigo-950 font-mono tracking-tight">
              {ruteKiriTotal.toLocaleString('id-ID')} <span className="text-[11px] font-semibold text-indigo-700">Porsi</span>
            </div>
            <p className="text-[10.5px] text-indigo-700 font-medium">
              📍 {ruteKiriTitik} Titik Singgah / KPM ({pctKiri}%)
            </p>
          </div>

          {/* Kotak Rute Kanan */}
          <div className="bg-gradient-to-br from-emerald-50/70 to-teal-50/30 p-3 rounded-xl border border-emerald-200/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-bold text-emerald-900 uppercase tracking-wider">
                Rute Kanan (Armada Timur)
              </span>
              <div className="p-1 bg-emerald-600 text-white rounded-md">
                <Truck size={12} />
              </div>
            </div>
            <div className="text-lg font-black text-emerald-950 font-mono tracking-tight">
              {ruteKananTotal.toLocaleString('id-ID')} <span className="text-[11px] font-semibold text-emerald-700">Porsi</span>
            </div>
            <p className="text-[10.5px] text-emerald-700 font-medium">
              📍 {ruteKananTitik} Titik Singgah / KPM ({pctKanan}%)
            </p>
          </div>
        </div>

        {/* Progress Bar Rasio Muatan Kiri vs Kanan */}
        <div className="space-y-1 pt-1">
          <div className="flex justify-between text-[10px] font-semibold text-slate-500">
            <span className="text-indigo-700 font-bold">Kiri: {pctKiri}%</span>
            <span className="text-slate-400">Rasio Muatan Armada</span>
            <span className="text-emerald-700 font-bold">Kanan: {pctKanan}%</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
            <div
              className="bg-indigo-600 h-full transition-all duration-300"
              style={{ width: `${pctKiri}%` }}
              title={`Rute Kiri: ${ruteKiriTotal} Porsi (${pctKiri}%)`}
            />
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: `${pctKanan}%` }}
              title={`Rute Kanan: ${ruteKananTotal} Porsi (${pctKanan}%)`}
            />
          </div>
        </div>
      </div>

      {/* Bagian 2: Kebutuhan Kemasan Dapur (Real-Time) */}
      <div className="space-y-2.5 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <span className="flex items-center gap-1.5 text-slate-900 font-bold">
            <Box size={14} className="text-amber-600" /> Kebutuhan Kemasan Dapur (Real-Time)
          </span>
          <span className="font-mono text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            {(totalKecil + totalBesar + totalTendik).toLocaleString('id-ID')} Total Wadah
          </span>
        </div>

        {/* 3 Badge Horizontal / Mini Cards */}
        <div className="grid grid-cols-3 gap-2">
          {/* Porsi Kecil (Kuning/Amber) */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-2.5 space-y-1 text-center">
            <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
              Porsi Kecil
            </span>
            <div className="text-base font-black text-amber-950 font-mono">
              {totalKecil.toLocaleString('id-ID')}
            </div>
            <span className="text-[9.5px] font-semibold text-amber-700 block">
              TK/PAUD/SD1-3/Balita
            </span>
          </div>

          {/* Porsi Besar (Biru) */}
          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-2.5 space-y-1 text-center">
            <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block">
              Porsi Besar
            </span>
            <div className="text-base font-black text-blue-950 font-mono">
              {totalBesar.toLocaleString('id-ID')}
            </div>
            <span className="text-[9.5px] font-semibold text-blue-700 block">
              SD4-6/SMP/Bumil/Busui
            </span>
          </div>

          {/* Porsi Tendik (Slate/Abu-abu) */}
          <div className="bg-slate-100/90 border border-slate-300 rounded-xl p-2.5 space-y-1 text-center">
            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
              Porsi Tendik
            </span>
            <div className="text-base font-black text-slate-900 font-mono">
              {totalTendik.toLocaleString('id-ID')}
            </div>
            <span className="text-[9.5px] font-semibold text-slate-600 block">
              Guru & Staf Sekolah
            </span>
          </div>
        </div>
      </div>

      {/* Bagian 3: Status Jam Operasional / Jadwal Keberangkatan */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2">
          <Clock size={15} className="text-emerald-600 shrink-0" />
          <div>
            <span className="text-[10px] font-semibold text-slate-500 block uppercase tracking-wider">
              Target Siap Distribusi
            </span>
            <span className="font-extrabold text-slate-900 font-mono">09.30 WIB</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="bg-emerald-50 text-emerald-800 text-[10.5px] font-bold px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 size={13} className="text-emerald-600" />
            <span>Siap Kirim</span>
          </span>
        </div>
      </div>
    </div>
  )
}

export default RingkasanLogistikHarian
