"use client"
import React, { useState, useEffect, useMemo } from 'react'
import { Printer, X, ShieldCheck, Building2, Package, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { fetchKelompokPenerimaManfaatList, sortKpmList, type KelompokPenerimaManfaat } from '@/lib/data-helpers'

interface LembarDistribusiPrintProps {
  isOpen: boolean
  onClose: () => void
  initialKpmList?: KelompokPenerimaManfaat[]
  selectedDate?: string
}

function calculateKpmPortion(item: KelompokPenerimaManfaat) {
  const kat = (item.kategori || '').toUpperCase()
  const subKat = (item.sub_kategori || '').toUpperCase()
  const total = item.jumlah_penerima || (item.target_pria || 0) + (item.target_wanita || 0) || 0
  const guruTendik = (item.target_guru || 0) + (item.target_tendik || 0)

  let porsiKecil = 0
  let porsiBesar = 0

  if (kat.includes('KB') || kat.includes('PAUD') || kat.includes('TK') || kat.includes('RA')) {
    const siswa = Math.max(0, total - guruTendik)
    porsiKecil = siswa
    porsiBesar = guruTendik
  } else if (kat.includes('SD') || kat.includes('MI')) {
    const siswa = Math.max(0, total - guruTendik)
    const porsiKecilSiswa = Math.round(siswa * 0.5)
    const porsiBesarSiswa = siswa - porsiKecilSiswa
    porsiKecil = porsiKecilSiswa
    porsiBesar = porsiBesarSiswa + guruTendik
  } else if (kat.includes('SMP') || kat.includes('MTS') || kat.includes('SMA') || kat.includes('SMK') || kat.includes('MA')) {
    porsiBesar = total
  } else if (kat.includes('POSYANDU') || kat.includes('3B')) {
    if (subKat.includes('BUMIL') || subKat.includes('BUSUI')) {
      porsiBesar = total
    } else {
      porsiKecil = total
    }
  } else {
    if (subKat.includes('BUMIL') || subKat.includes('BUSUI')) {
      porsiBesar = total
    } else {
      porsiKecil = total
    }
  }

  return {
    total,
    porsiKecil,
    porsiBesar,
    guruTendik
  }
}

export default function LembarDistribusiPrint({
  isOpen,
  onClose,
  initialKpmList,
  selectedDate
}: LembarDistribusiPrintProps) {
  const [kpmData, setKpmData] = useState<KelompokPenerimaManfaat[]>([])

  // Dynamic Indonesian full date formatting (e.g. "Senin, 14 September 2026")
  const fullDateFormatted = useMemo(() => {
    if (selectedDate) return selectedDate
    const d = new Date()
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
  }, [selectedDate])

  useEffect(() => {
    if (!isOpen) return

    if (initialKpmList && initialKpmList.length > 0) {
      setKpmData(initialKpmList)
    } else {
      const loadKpm = async () => {
        try {
          const { data, error } = await supabase
            .from('kelompok_penerima_manfaat')
            .select('*')
            .order('urutan', { ascending: true })

          if (error || !data || data.length === 0) {
            const fallback = await fetchKelompokPenerimaManfaatList()
            setKpmData(fallback)
          } else {
            setKpmData(data)
          }
        } catch {
          const fallback = await fetchKelompokPenerimaManfaatList()
          setKpmData(fallback)
        }
      }
      loadKpm()
    }
  }, [isOpen, initialKpmList])

  // Aggregate breakdown per KPM & grand totals
  const { rows, totals } = useMemo(() => {
    let grandTotal = 0
    let grandKecil = 0
    let grandBesar = 0
    let grandTendik = 0

    const sortedData = sortKpmList(kpmData)

    const processed = sortedData.map((item, idx) => {
      const breakdown = calculateKpmPortion(item)
      grandTotal += breakdown.total
      grandKecil += breakdown.porsiKecil
      grandBesar += breakdown.porsiBesar
      grandTendik += breakdown.guruTendik

      return {
        no: idx + 1,
        id: item.id || item.kode || String(idx),
        nama: item.nama,
        kode: item.identitas_npsn_tmp || item.kode || item.id,
        kategori: item.kategori,
        total: breakdown.total,
        porsiKecil: breakdown.porsiKecil,
        porsiBesar: breakdown.porsiBesar,
        guruTendik: breakdown.guruTendik
      }
    })

    return {
      rows: processed,
      totals: {
        grandTotal,
        grandKecil,
        grandBesar,
        grandTendik
      }
    }
  }, [kpmData])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      {/* Dynamic CSS Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body * {
            visibility: hidden !important;
          }
          #print-lembar-distribusi,
          #print-lembar-distribusi * {
            visibility: visible !important;
          }
          #print-lembar-distribusi {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Modal Container */}
      <div className="bg-slate-100 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-300">
        
        {/* Modal Top Bar (No Print) */}
        <div className="no-print bg-slate-900 text-white p-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-lg">
              <Printer size={20} />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base leading-tight">
                Pratinjau Lembar Distribusi Operasional MBG
              </h2>
              <p className="text-xs text-slate-300">
                Dokumen resmi kendali distribusi porsi bergizi SPPG Pasuruan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Printer size={15} />
              <span>Cetak Dokumen</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 flex justify-center">
          
          {/* Print Sheet Container */}
          <div
            id="print-lembar-distribusi"
            className="bg-white border border-slate-300 rounded-xl shadow-lg p-6 w-full max-w-[210mm] space-y-4 text-slate-900 font-sans"
          >
            {/* Header Dokumen Cetak Resmi */}
            <div className="bg-[#0f2e5a] text-white p-4 rounded-lg shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-[#0b2347]">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
                  BADAN GIZI NASIONAL · REPUBLIK INDONESIA
                </span>
                <h1 className="text-base sm:text-lg font-black tracking-tight uppercase mt-0.5 leading-snug">
                  REKAPITULASI KEBUTUHAN PORSI DISTRIBUSI HARIAN MBG
                </h1>
                <p className="text-xs font-semibold text-slate-200 mt-0.5 flex items-center gap-1.5">
                  <Building2 size={13} className="text-amber-400 shrink-0" />
                  <span>SPPG KIDULDALEM - WONOREJO, PASURUAN</span>
                </p>
              </div>

              <div className="bg-blue-950/80 border border-blue-800 p-2.5 rounded-md text-right text-xs font-mono shrink-0">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TANGGAL OPERASIONAL</div>
                <div className="font-extrabold text-amber-300 text-xs sm:text-sm mt-0.5 flex items-center justify-end gap-1">
                  <Calendar size={13} className="text-amber-400" />
                  <span>{fullDateFormatted}</span>
                </div>
                <div className="text-[11px] font-black text-white mt-1 pt-1 border-t border-blue-800/80">
                  TOTAL: {totals.grandTotal.toLocaleString('id-ID')} PORSI
                </div>
              </div>
            </div>

            {/* Sub-Header Metadata Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs font-medium">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">UNIT LAYANAN</span>
                <span className="font-bold text-slate-900">SPPG Kiduldalem</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">KECAMATAN / KABUPATEN</span>
                <span className="font-bold text-slate-900">Wonorejo, Pasuruan</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">TOTAL SASARAN KPM</span>
                <span className="font-extrabold text-slate-900 font-mono">{rows.length} Titik KPM</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">STATUS VERIFIKASI</span>
                <span className="font-extrabold text-emerald-700 flex items-center gap-1">
                  <ShieldCheck size={13} /> Terverifikasi APPO
                </span>
              </div>
            </div>

            {/* Tabel Ringkas Kendali Distribusi (Identik 100% dengan Beranda) */}
            <div className="border border-slate-300 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#0f2e5a] text-white text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-2 px-2.5 text-center w-8 border-b border-slate-700">NO</th>
                    <th className="py-2 px-2.5 border-b border-slate-700">NAMA KPM / LEMBAGA</th>
                    <th className="py-2 px-2.5 text-right border-b border-slate-700">TOTAL</th>
                    <th className="py-2 px-2.5 text-right border-b border-slate-700">KECIL</th>
                    <th className="py-2 px-2.5 text-right border-b border-slate-700">BESAR</th>
                    <th className="py-2 px-2.5 text-right border-b border-slate-700">TENDIK</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-semibold text-slate-900 bg-white">
                  {rows.length > 0 ? (
                    rows.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-1.5 px-2.5 text-center font-mono text-slate-500 text-[11px]">
                          {row.no}
                        </td>
                        <td className="py-1.5 px-2.5">
                          <span className="font-bold text-slate-900 block">{row.nama}</span>
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-bold text-slate-900 font-mono">
                          {row.total.toLocaleString('id-ID')}
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono font-bold text-amber-800">
                          {row.porsiKecil > 0 ? row.porsiKecil.toLocaleString('id-ID') : '-'}
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono font-bold text-indigo-950">
                          {row.porsiBesar > 0 ? row.porsiBesar.toLocaleString('id-ID') : '-'}
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono font-semibold text-slate-600">
                          {row.guruTendik > 0 ? row.guruTendik.toLocaleString('id-ID') : '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                        Belum ada data KPM terdaftar.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-800 text-xs">
                  <tr>
                    <td colSpan={2} className="py-2 px-2.5 font-extrabold uppercase tracking-wider text-slate-900 text-[11px]">
                      TOTAL KESELURUHAN
                    </td>
                    <td className="py-2 px-2.5 text-right font-mono text-slate-950 font-black text-sm">
                      {totals.grandTotal.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2 px-2.5 text-right font-mono text-amber-900 font-black text-sm">
                      {totals.grandKecil.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono text-indigo-950 font-black text-sm">
                      {totals.grandBesar.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2 px-2.5 text-right font-mono text-slate-800 font-extrabold">
                      {totals.grandTendik.toLocaleString('id-ID')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Signature & Electronic Authorization Block */}
            <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div className="border border-slate-300 rounded-lg p-3 bg-slate-50 space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                  <ShieldCheck size={15} className="text-emerald-600" />
                  <span>Pengesahan Elektronik (APPO BGN)</span>
                </div>
                <p className="text-[10px] text-slate-600 leading-tight">
                  Dokumen diterbitkan dan terverifikasi secara sah melalui Sistem Aplikasi Pelayanan Pengelolaan Operasional MBG.
                </p>
                <div className="text-[9px] font-mono text-slate-400 pt-0.5">
                  ID DOKUMEN: BGN-WONOREJO-{Date.now().toString(36).toUpperCase()}
                </div>
              </div>

              <div className="text-center space-y-1 text-xs sm:text-right sm:pr-4">
                <p className="text-slate-500 font-medium text-[11px]">
                  Pasuruan, {fullDateFormatted}
                </p>
                <p className="font-bold text-slate-800">
                  Kepala SPPG Pasuruan Wonorejo
                </p>
                <div className="h-12 flex items-center justify-center sm:justify-end">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-300">
                    ✓ Tanda Tangan Digital Terverifikasi
                  </span>
                </div>
                <p className="font-black text-slate-900 border-t border-slate-300 pt-1 inline-block">
                  AHMAD SAYYIDANI KHAQIQI, S.Pd.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
