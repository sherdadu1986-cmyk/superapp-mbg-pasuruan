"use client"
import React, { useState, useEffect, useMemo } from 'react'
import { Printer, X, ShieldCheck, Building2, Calendar, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { fetchKelompokPenerimaManfaatList, sortKpmList, type KelompokPenerimaManfaat } from '@/lib/data-helpers'

interface LembarDistribusiPrintProps {
  isOpen: boolean
  onClose: () => void
  initialKpmList?: KelompokPenerimaManfaat[]
  selectedDate?: string
  liburKpmIds?: string[]
}

function calculateKpmPortion(item: KelompokPenerimaManfaat) {
  const kat = (item.kategori || '').toUpperCase()
  const subKat = (item.sub_kategori || '').toUpperCase()
  const total = item.jumlah_penerima ?? ((item.target_pria ?? 0) + (item.target_wanita ?? 0))
  const guruTendik = (item.target_guru ?? 0) + (item.target_tendik ?? 0)

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
  selectedDate,
  liburKpmIds
}: LembarDistribusiPrintProps) {
  const [kpmData, setKpmData] = useState<KelompokPenerimaManfaat[]>([])

  // Dynamic Indonesian full date formatting (e.g. "Senin, 15 September 2026")
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

  // Real-time print time formatting (e.g. "04:30 WIB")
  const printTimeFormatted = useMemo(() => {
    const d = new Date()
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${hh}:${mm} WIB`
  }, [])

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

  // Aggregate breakdown per KPM & grand totals (excluding holiday KPMs)
  const { rows, totals, holidayKpmNames, aktifCount } = useMemo(() => {
    let grandTotal = 0
    let grandKecil = 0
    let grandBesar = 0
    let grandTendik = 0
    let active = 0
    const holidayNames: string[] = []

    const sortedData = sortKpmList(kpmData)

    const processed = sortedData.map((item, idx) => {
      const itemKey = item.id || item.kode || item.identitas_npsn_tmp || String(idx)
      const isLibur = liburKpmIds?.includes(itemKey) || (Boolean(item.id) && liburKpmIds?.includes(item.id!))

      if (isLibur) {
        holidayNames.push(item.nama)
        return {
          no: idx + 1,
          id: itemKey,
          nama: item.nama,
          kode: item.identitas_npsn_tmp || item.kode || item.id,
          kategori: item.kategori,
          total: 0,
          porsiKecil: 0,
          porsiBesar: 0,
          guruTendik: 0,
          isLibur: true
        }
      }

      active += 1
      const breakdown = calculateKpmPortion(item)
      grandTotal += breakdown.total
      grandKecil += breakdown.porsiKecil
      grandBesar += breakdown.porsiBesar
      grandTendik += breakdown.guruTendik

      return {
        no: idx + 1,
        id: itemKey,
        nama: item.nama,
        kode: item.identitas_npsn_tmp || item.kode || item.id,
        kategori: item.kategori,
        total: breakdown.total,
        porsiKecil: breakdown.porsiKecil,
        porsiBesar: breakdown.porsiBesar,
        guruTendik: breakdown.guruTendik,
        isLibur: false
      }
    })

    return {
      rows: processed,
      totals: {
        grandTotal,
        grandKecil,
        grandBesar,
        grandTendik
      },
      holidayKpmNames: holidayNames,
      aktifCount: active
    }
  }, [kpmData, liburKpmIds])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      {/* Dynamic CSS Print Styles for Exact A4 1-Page Layout */}
      <style jsx global>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm 10mm 8mm 10mm;
          }
          body {
            background: #ffffff !important;
            font-family: 'Arial', 'Helvetica', sans-serif !important;
            color: #0f172a !important;
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
            background: #ffffff !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Modal Container */}
      <div className="bg-slate-100 rounded-2xl max-w-4xl w-full max-h-[95vh] flex flex-col overflow-hidden shadow-2xl border border-slate-300">
        
        {/* Modal Top Bar (No Print) */}
        <div className="no-print bg-slate-900 text-white p-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-lg">
              <Printer size={20} />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base leading-tight">
                Pratinjau Lembar Rekapitulasi Resmi BGN
              </h2>
              <p className="text-xs text-slate-300">
                Dokumen rekapitulasi kebutuhan porsi distribusi harian MBG SPPG Pasuruan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Printer size={15} />
              <span>Cetak Dokumen (A4)</span>
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
          
          {/* Print Sheet Container (A4 Printable Box) */}
          <div
            id="print-lembar-distribusi"
            className="bg-white border border-slate-300 rounded-xl shadow-lg p-5 sm:p-6 w-full max-w-[210mm] text-[#0f172a] font-sans text-xs space-y-3.5"
          >
            {/* 1. Kop Surat Resmi Kedinasan BGN */}
            <div className="flex items-center justify-between gap-3 pb-2">
              <div className="flex items-center gap-3.5">
                <img
                  src="/logo-bgn.png"
                  alt="Logo BGN"
                  className="h-[55px] w-auto object-contain shrink-0"
                />
                <div>
                  <h3 className="font-bold text-[12pt] text-[#1e3a8a] leading-tight tracking-wide">
                    BADAN GIZI NASIONAL (BGN) REPUBLIK INDONESIA
                  </h3>
                  <h2 className="font-extrabold text-[13.5pt] text-[#0f172a] leading-tight mt-0.5 tracking-tight">
                    SATUAN PELAYANAN PROGRAM GIZI (SPPG) KIDULDALEM - WONOREJO, PASURUAN
                  </h2>
                  <p className="font-semibold text-[9.5pt] text-[#475569] leading-tight mt-0.5 uppercase tracking-wider">
                    LEMBAR REKAPITULASI KEBUTUHAN PORSI DISTRIBUSI HARIAN MBG
                  </p>
                </div>
              </div>

              {/* Box Tanggal Operasional Sisi Kanan */}
              <div className="bg-[#f8fafc] border border-slate-300 rounded-md p-2 text-right shrink-0 min-w-[170px]">
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">TANGGAL OPERASIONAL</div>
                <div className="font-black text-[#0f172a] text-[10.5pt] mt-0.5 leading-snug">
                  {fullDateFormatted}
                </div>
                <div className="text-[8.5pt] font-medium text-slate-500 mt-0.5">
                  Waktu Cetak: <span className="font-bold text-slate-700">{printTimeFormatted}</span>
                </div>
              </div>
            </div>

            {/* Garis Pembatas Kop Ganda Elegan */}
            <div className="space-y-0.5">
              <div className="h-[2px] bg-[#0f172a]" />
              <div className="h-[1px] bg-slate-400" />
            </div>

            {/* 2. Ringkasan Informasi Singkat (Info Baris 4 Kolom) */}
            <div className="grid grid-cols-4 gap-2 bg-[#f8fafc] border border-[#e2e8f0] p-2 rounded-md text-[10.5px]">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase block">UNIT LAYANAN</span>
                <span className="font-extrabold text-[#0f172a]">SPPG Kiduldalem</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase block">WILAYAH</span>
                <span className="font-extrabold text-[#0f172a]">Wonorejo, Pasuruan</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase block">TOTAL TITIK KPM</span>
                <span className="font-black text-[#0f172a] font-mono">
                  {rows.length} Titik ({aktifCount} Aktif, {holidayKpmNames.length} Libur)
                </span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase block">STATUS OPERASIONAL</span>
                <span className="font-black text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                  <span>Terverifikasi APPO</span>
                </span>
              </div>
            </div>

            {/* 3. Tabel Rekapitulasi Porsi (Kompak & High-Contrast for 1 A4 Page) */}
            <div className="border border-slate-300 rounded-md overflow-hidden">
              <table className="w-full text-left border-collapse text-[10.5px] leading-tight">
                <thead>
                  <tr className="bg-[#0f172a] text-white text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-1.5 px-2 text-center w-8 border-b border-slate-700">NO</th>
                    <th className="py-1.5 px-2 border-b border-slate-700">NAMA KPM / LEMBAGA</th>
                    <th className="py-1.5 px-2 text-right border-b border-slate-700 w-24">TOTAL PORSI</th>
                    <th className="py-1.5 px-2 text-right border-b border-slate-700 w-24">PORSI KECIL</th>
                    <th className="py-1.5 px-2 text-right border-b border-slate-700 w-24">PORSI BESAR</th>
                    <th className="py-1.5 px-2 text-right border-b border-slate-700 w-28">TENDIK/KADER</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-semibold text-[#0f172a]">
                  {rows.length > 0 ? (
                    rows.map((row, idx) => {
                      const isEven = idx % 2 === 0
                      return (
                        <tr
                          key={row.id}
                          className={
                            row.isLibur
                              ? 'bg-[#fef2f2] text-slate-400'
                              : isEven
                              ? 'bg-white hover:bg-slate-50'
                              : 'bg-[#f8fafc] hover:bg-slate-50'
                          }
                        >
                          <td className="py-1 px-2 text-center font-mono text-slate-500 text-[10px]">
                            {row.no}
                          </td>
                          <td className="py-1 px-2">
                            {row.isLibur ? (
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-400 line-through">{row.nama}</span>
                                <span className="text-[8.5px] font-bold text-rose-700 bg-rose-100 border border-rose-300 px-1 py-0.2 rounded uppercase">
                                  [LIBUR - 0 PORSI]
                                </span>
                              </div>
                            ) : (
                              <span className="font-extrabold text-[#0f172a] block">{row.nama}</span>
                            )}
                          </td>
                          <td className="py-1 px-2 text-right font-black font-mono">
                            {row.isLibur ? (
                              <span className="text-slate-400 font-normal">0</span>
                            ) : (
                              <span className="text-[#0f172a] font-black">{row.total.toLocaleString('id-ID')}</span>
                            )}
                          </td>
                          <td className="py-1 px-2 text-right font-mono font-bold">
                            {row.isLibur ? (
                              <span className="text-slate-300 font-normal">-</span>
                            ) : row.porsiKecil > 0 ? (
                              <span className="text-[#b45309] font-black">{row.porsiKecil.toLocaleString('id-ID')}</span>
                            ) : (
                              <span className="text-slate-300 font-normal">-</span>
                            )}
                          </td>
                          <td className="py-1 px-2 text-right font-mono font-bold">
                            {row.isLibur ? (
                              <span className="text-slate-300 font-normal">-</span>
                            ) : row.porsiBesar > 0 ? (
                              <span className="text-[#1d4ed8] font-black">{row.porsiBesar.toLocaleString('id-ID')}</span>
                            ) : (
                              <span className="text-slate-300 font-normal">-</span>
                            )}
                          </td>
                          <td className="py-1 px-2 text-right font-mono font-semibold">
                            {row.isLibur ? (
                              <span className="text-slate-300 font-normal">-</span>
                            ) : row.guruTendik > 0 ? (
                              <span className="text-slate-700 font-bold">{row.guruTendik.toLocaleString('id-ID')}</span>
                            ) : (
                              <span className="text-slate-300 font-normal">-</span>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-slate-400 italic">
                        Belum ada data KPM terdaftar.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-[#1e293b] text-white font-bold border-t-2 border-[#0f172a] text-[11px]">
                  <tr>
                    <td colSpan={2} className="py-1.5 px-2 font-black uppercase tracking-wider text-white">
                      TOTAL KESELURUHAN
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono text-white font-black text-[12px]">
                      {totals.grandTotal.toLocaleString('id-ID')}
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono text-amber-300 font-black text-[12px]">
                      {totals.grandKecil.toLocaleString('id-ID')}
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono text-blue-200 font-black text-[12px]">
                      {totals.grandBesar.toLocaleString('id-ID')}
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono text-slate-200 font-bold text-[11px]">
                      {totals.grandTendik.toLocaleString('id-ID')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* 4. Catatan Kaki Jika Ada Sekolah Libur */}
            {holidayKpmNames.length > 0 && (
              <div className="p-2 bg-[#fef2f2] border border-rose-200 rounded-md text-[9.5px] text-rose-950 font-medium leading-normal">
                <strong className="font-bold text-rose-900 uppercase tracking-wider block mb-0.5">
                  Catatan KPM Libur Hari Ini ({holidayKpmNames.length} Lembaga):
                </strong>
                <span>
                  <strong>{holidayKpmNames.join(', ')}</strong> libur hari ini, alokasi porsi dialihkan/ditiadakan.
                </span>
              </div>
            )}

            {/* 5. Kolom Tanda Tangan Resmi (Dual Signatures) */}
            <div className="pt-2 border-t border-slate-300 grid grid-cols-2 gap-8 text-[11px] font-sans">
              <div className="text-center space-y-1">
                <p className="text-slate-600 font-medium text-[10.5px]">Mengetahui,</p>
                <p className="font-bold text-[#0f172a]">Petugas Distribusi & Logistik</p>
                <div className="h-14 flex items-end justify-center pb-1">
                  <span className="text-slate-400 font-mono text-[9px] italic">(Tanda Tangan & Nama Terang)</span>
                </div>
                <p className="font-bold text-[#0f172a] border-t border-slate-300 pt-0.5 inline-block min-w-[160px]">
                  (_________________________)
                </p>
              </div>

              <div className="text-center space-y-1">
                <p className="text-slate-600 font-medium text-[10.5px]">
                  Pasuruan, {fullDateFormatted}
                </p>
                <p className="font-bold text-[#0f172a]">
                  Menyetujui,
                  <br />
                  Kepala SPPG Kiduldalem Wonorejo
                </p>
                <div className="h-10 flex items-center justify-center">
                  <span className="text-[8.5px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                    ✓ Terverifikasi Digital APPO
                  </span>
                </div>
                <p className="font-black text-[#0f172a] border-t border-slate-300 pt-0.5 inline-block">
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

