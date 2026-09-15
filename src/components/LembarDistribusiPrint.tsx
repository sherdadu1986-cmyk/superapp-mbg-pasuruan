"use client"
import React, { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Printer, X, Building2, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { fetchKelompokPenerimaManfaatList, sortKpmList, calculateKpmPortion, type KelompokPenerimaManfaat } from '@/lib/data-helpers'

interface LembarDistribusiPrintProps {
  isOpen: boolean
  onClose: () => void
  initialKpmList?: KelompokPenerimaManfaat[]
  selectedDate?: string
  liburKpmIds?: string[]
}

export default function LembarDistribusiPrint({
  isOpen,
  onClose,
  initialKpmList,
  selectedDate,
  liburKpmIds
}: LembarDistribusiPrintProps) {
  const [mounted, setMounted] = useState(false)
  const [kpmData, setKpmData] = useState<KelompokPenerimaManfaat[]>([])

  useEffect(() => {
    setMounted(true)
  }, [])

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

  // Official Indonesian Date Formatting for Signature Block (e.g. "15 September 2026")
  const formattedDate = useMemo(() => {
    if (selectedDate) {
      const d = new Date(selectedDate)
      if (!isNaN(d.getTime())) {
        return new Intl.DateTimeFormat('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }).format(d)
      }
      return selectedDate
    }
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date())
  }, [selectedDate])

  // Real-time print time formatting (e.g. "04:30 WIB")
  const printTimeFormatted = useMemo(() => {
    const d = new Date()
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${hh}:${mm} WIB`
  }, [])

  // Buka rute cetak mandiri A4 presisi di tab baru
  const handleBukaLembarCetak = () => {
    let ids = liburKpmIds || []
    if (ids.length === 0 && typeof window !== 'undefined') {
      const todayDate = new Date().toISOString().split('T')[0]
      const saved = localStorage.getItem(`sppg_kpm_libur_${todayDate}`)
      if (saved) {
        try { ids = JSON.parse(saved) } catch {}
      }
    }
    const liburParam = ids.join(',')
    window.open(`/cetak/lembar-distribusi?libur=${encodeURIComponent(liburParam)}`, '_blank')
  }

  // Standalone Isolated Print Window Handler (Fallback Option)
  const handleCetakDokumenMandiri = () => {
    const printContent = document.getElementById('area-dokumen-a4-bgn')
    if (!printContent) {
      alert('Elemen dokumen tidak ditemukan')
      return
    }

    const printWindow = window.open('', '_blank', 'width=850,height=1100')
    if (!printWindow) {
      alert('Mohon izinkan pop-up peramban untuk mencetak.')
      return
    }

    // Ambil seluruh link stylesheet Tailwind/Next.js
    const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .map((el) => `<link rel="stylesheet" href="${(el as HTMLLinkElement).href}">`)
      .join('\n')

    // Ambil style tag internal
    const inlineStyles = Array.from(document.querySelectorAll('style'))
      .map((el) => el.innerHTML)
      .join('\n')

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="utf-8" />
          <title>Lembar Rekapitulasi Distribusi MBG - BGN</title>
          ${links}
          <style>
            ${inlineStyles}
            @page {
              size: A4 portrait;
              margin: 0 !important;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-sizing: border-box !important;
            }
            html, body {
              background: #ffffff !important;
              color: #0f172a !important;
              margin: 0 !important;
              padding: 0 !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif !important;
            }
            #area-dokumen-a4-bgn {
              width: 100% !important;
              max-width: none !important;
              padding: 10mm !important;
              margin: 0 !important;
              border: none !important;
              box-shadow: none !important;
            }
          </style>
        </head>
        <body>
          <div id="area-dokumen-a4-bgn">
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `

    printWindow.document.open()
    printWindow.document.write(htmlContent)
    printWindow.document.close()

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus()
        printWindow.print()
        printWindow.close()
      }, 300)
    }
  }

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

  if (!isOpen || !mounted) return null

  const modalJSX = (
    <div
      id="dokumen-cetak-tunggal"
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      {/* CSS Media Print Overhaul: Strip Modal Wrapper, Frames, Shadows & Scrollbars */}
      <style jsx global>{`
        @media print {
          /* Hilangkan scrollbar browser dan overflow */
          html, body {
            overflow: visible !important;
            height: auto !important;
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Hilangkan styling modal (border, rounded, shadow, max-h, scrollbar) */
          #dokumen-cetak-tunggal,
          .modal-container,
          [role="dialog"],
          .overflow-y-auto {
            position: static !important;
            overflow: visible !important;
            max-height: none !important;
            height: auto !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            transform: none !important;
          }

          /* Sembunyikan backdrop hitam modal, topbar, dan elemen non-cetak */
          .fixed.inset-0,
          .bg-black\/60,
          .backdrop-blur-xs,
          .backdrop-blur-sm,
          .no-print {
            display: none !important;
            background: transparent !important;
          }

          /* Area lembar kertas A4 sesungguhnya */
          #area-dokumen-a4-bgn,
          #lembar-cetak-a4 {
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            width: 100% !important;
            max-width: none !important;
            min-height: 297mm !important;
            height: auto !important;
            padding: 10mm !important;
            margin: 0 auto !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
            break-inside: avoid !important;
            break-after: avoid !important;
            background: #ffffff !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }

          @page {
            size: A4 portrait;
            margin: 0 !important;
          }
        }
      `}</style>

      {/* Modal Container (Screen View) */}
      <div className="bg-slate-100 rounded-2xl max-w-5xl w-full max-h-[96vh] flex flex-col overflow-hidden shadow-2xl border border-slate-300">
        
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
              onClick={handleBukaLembarCetak}
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
          
          {/* Pure A4 Document Paper Element (Standard 794x1123 px for 96 DPI A4) */}
          <div
            id="area-dokumen-a4-bgn"
            className="w-[794px] min-h-[1123px] bg-white p-10 flex flex-col justify-between text-slate-900 mx-auto"
            style={{ boxSizing: 'border-box' }}
          >
            {/* Top & Table Section Wrapper */}
            <div>
              {/* 1. Kop Surat Resmi Kedinasan BGN */}
              <div className="flex items-center justify-between gap-4 pb-1">
                <div className="flex items-center gap-4">
                  <img
                    src="/logo-bgn.png"
                    alt="Logo BGN"
                    crossOrigin="anonymous"
                    className="h-14 w-auto object-contain shrink-0"
                  />
                  <div>
                    <h3 className="font-bold text-[12pt] text-[#1e3a8a] leading-tight tracking-wide">
                      BADAN GIZI NASIONAL (BGN) REPUBLIK INDONESIA
                    </h3>
                    <h2 className="font-black text-[13.5pt] text-[#0f172a] leading-tight mt-0.5 tracking-tight">
                      SATUAN PELAYANAN PROGRAM GIZI (SPPG) WONOREJO - WONOREJO, PASURUAN
                    </h2>
                    <p className="font-semibold text-[9.5pt] text-[#475569] leading-tight mt-0.5 uppercase tracking-wider">
                      LEMBAR REKAPITULASI KEBUTUHAN PORSI DISTRIBUSI HARIAN MBG
                    </p>
                  </div>
                </div>

                {/* Box Tanggal Operasional Sisi Kanan */}
                <div className="bg-[#f8fafc] border border-slate-300 rounded-md p-2.5 text-right shrink-0 min-w-[170px]">
                  <div className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">TANGGAL OPERASIONAL</div>
                  <div className="font-black text-[#0f172a] text-[10.5pt] mt-0.5 leading-snug">
                    {fullDateFormatted}
                  </div>
                  <div className="text-[8.5pt] font-medium text-slate-500 mt-0.5">
                    Waktu Cetak: <span className="font-bold text-slate-700">{printTimeFormatted}</span>
                  </div>
                </div>
              </div>

              {/* Garis Pembatas Kop Ganda Elegan (Border Atas 2px, Border Bawah 1px) */}
              <div className="my-3 space-y-0.5">
                <div className="h-[2px] bg-[#0f172a]" />
                <div className="h-[1px] bg-slate-400" />
              </div>

              {/* 2. Ringkasan Informasi Singkat (Info Baris 4 Kolom) */}
              <div className="grid grid-cols-4 gap-2 bg-[#f8fafc] border border-[#e2e8f0] py-2 px-3 rounded-md text-[10.5px] mb-3">
                <div>
                  <span className="text-[8.5px] font-bold text-slate-400 uppercase block">UNIT LAYANAN</span>
                  <span className="font-extrabold text-[#0f172a]">SPPG Kiduldalem</span>
                </div>
                <div>
                  <span className="text-[8.5px] font-bold text-slate-400 uppercase block">WILAYAH</span>
                  <span className="font-extrabold text-[#0f172a]">Wonorejo, Pasuruan</span>
                </div>
                <div>
                  <span className="text-[8.5px] font-bold text-slate-400 uppercase block">TOTAL TITIK KPM</span>
                  <span className="font-black text-[#0f172a] font-mono">
                    {rows.length} Titik ({aktifCount} Aktif, {holidayKpmNames.length} Libur)
                  </span>
                </div>
                <div>
                  <span className="text-[8.5px] font-bold text-slate-400 uppercase block">STATUS OPERASIONAL</span>
                  <span className="font-black text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                    <span>Terverifikasi APPO</span>
                  </span>
                </div>
              </div>

              {/* 3. Tabel Rekapitulasi Porsi (25 KPM - Scale Fitted & Balanced for Full A4) */}
              <div className="border border-slate-300 rounded-md overflow-hidden">
                <table className="w-full text-left border-collapse text-[12px] leading-tight font-medium">
                  <thead>
                    <tr className="bg-[#0f172a] text-white text-[11px] font-bold uppercase tracking-wider">
                      <th className="py-2 px-3 text-center w-8 border-b border-slate-700">NO</th>
                      <th className="py-2 px-3 border-b border-slate-700">NAMA KPM / LEMBAGA</th>
                      <th className="py-2 px-3 text-right border-b border-slate-700 w-24">TOTAL PORSI</th>
                      <th className="py-2 px-3 text-right border-b border-slate-700 w-24">PORSI KECIL</th>
                      <th className="py-2 px-3 text-right border-b border-slate-700 w-24">PORSI BESAR</th>
                      <th className="py-2 px-3 text-right border-b border-slate-700 w-28">TENDIK/KADER</th>
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
                            <td className="py-2 px-3 text-center font-mono text-slate-500 text-[11px]">
                              {row.no}
                            </td>
                            <td className="py-2 px-3">
                              {row.isLibur ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-slate-400 line-through text-[12px]">{row.nama}</span>
                                  <span className="text-[8.5px] font-bold text-rose-700 bg-rose-100 border border-rose-300 px-1 py-0.2 rounded uppercase">
                                    [LIBUR - 0 PORSI]
                                  </span>
                                </div>
                              ) : (
                                <span className="font-extrabold text-[#0f172a] block text-[12px]">{row.nama}</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right font-black font-mono text-[12px]">
                              {row.isLibur ? (
                                <span className="text-slate-400 font-normal">0</span>
                              ) : (
                                <span className="text-[#0f172a] font-black">{row.total.toLocaleString('id-ID')}</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-[12px]">
                              {row.isLibur ? (
                                <span className="text-slate-300 font-normal">-</span>
                              ) : row.porsiKecil > 0 ? (
                                <span className="text-[#b45309] font-black">{row.porsiKecil.toLocaleString('id-ID')}</span>
                              ) : (
                                <span className="text-slate-300 font-normal">-</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-[12px]">
                              {row.isLibur ? (
                                <span className="text-slate-300 font-normal">-</span>
                              ) : row.porsiBesar > 0 ? (
                                <span className="text-[#1d4ed8] font-black">{row.porsiBesar.toLocaleString('id-ID')}</span>
                              ) : (
                                <span className="text-slate-300 font-normal">-</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-semibold text-[12px]">
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
                        <td colSpan={6} className="py-3 text-center text-slate-400 italic text-[11px]">
                          Belum ada data KPM terdaftar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-[#1e293b] text-white font-bold border-t-2 border-[#0f172a] text-[13px]">
                    <tr>
                      <td colSpan={2} className="py-2.5 px-3 font-black uppercase tracking-wider text-white">
                        TOTAL KESELURUHAN
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-white font-black text-[13.5px]">
                        {totals.grandTotal.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-amber-300 font-black text-[13.5px]">
                        {totals.grandKecil.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-blue-200 font-black text-[13.5px]">
                        {totals.grandBesar.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-200 font-bold text-[12.5px]">
                        {totals.grandTendik.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Bottom Footer Section (Catatan Libur & TTE Signatures) */}
            <div className="space-y-3 pt-2">
              {/* 4. Catatan Kaki Jika Ada Sekolah Libur */}
              {holidayKpmNames.length > 0 && (
                <div className="my-3 py-2 px-3 bg-[#fef2f2] border border-rose-200 rounded text-[11px] text-rose-950 font-medium leading-normal">
                  <strong className="font-bold text-rose-900 uppercase tracking-wider block mb-0.5">
                    Catatan KPM Libur Hari Ini ({holidayKpmNames.length} Lembaga):
                  </strong>
                  <span>
                    <strong>{holidayKpmNames.join(', ')}</strong> libur hari ini, alokasi porsi dialihkan/ditiadakan.
                  </span>
                </div>
              )}

              {/* 5. Kolom Tanda Tangan Resmi Kedinasan TTE E-Digital */}
              <div className="pt-3 border-t border-slate-300 grid grid-cols-2 gap-4 text-[11.5px] font-sans items-end break-inside-avoid print:break-inside-avoid">
                {/* Sisi Kiri: Mengetahui Petugas Logistik */}
                <div className="text-center space-y-0.5">
                  <p className="text-slate-600 font-medium text-[11px]">Mengetahui,</p>
                  <p className="font-bold text-[#0f172a]">Petugas Distribusi & Logistik</p>
                  <div className="h-16 flex items-end justify-center pb-1">
                    <span className="text-slate-400 font-mono text-[8.5px] italic">(Tanda Tangan & Nama Terang)</span>
                  </div>
                  <p className="font-bold text-[#0f172a] border-t border-slate-300 pt-0.5 inline-block min-w-[160px]">
                    (_________________________)
                  </p>
                </div>

                {/* Sisi Kanan Bawah: Kepala SPPG dengan Badge Stempel TTE Kedinasan */}
                <div className="text-center flex flex-col items-center justify-end space-y-0.5">
                  <div className="text-[#0f172a] text-[11.5px] leading-tight space-y-0.5">
                    <p className="font-medium text-slate-700">Ditetapkan di Pasuruan</p>
                    <p className="font-medium text-slate-700">
                      pada tanggal <span className="font-bold text-[#0f172a]">{formattedDate}</span>
                    </p>
                    <p className="font-bold text-[#0f172a] mt-0.5">Kepala SPPG,</p>
                  </div>

                  {/* Badge Stempel TTE Hijau Kedinasan BSrE */}
                  <div className="py-1 px-2.5 my-1.5 border border-emerald-600/60 bg-emerald-50/60 rounded shadow-2xs inline-flex flex-col items-start text-left">
                    <div className="flex items-center gap-1.5 text-emerald-800">
                      <svg className="w-4 h-4 fill-emerald-700 shrink-0" viewBox="0 0 24 24">
                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                      </svg>
                      <span className="text-[9.5px] font-bold tracking-wider uppercase">
                        Ditandatangani Secara Elektronik
                      </span>
                    </div>
                    <span className="text-[8.5px] text-slate-600 leading-tight">
                      Sertifikasi BSrE · Badan Gizi Nasional RI
                    </span>
                  </div>

                  <div className="text-[#0f172a] text-[11.5px] leading-tight pt-0.5">
                    <p className="font-bold text-[12px] underline underline-offset-2">
                      Ahmad Sayyidani Khaqiqi, S.Pd
                    </p>
                    <p className="font-semibold text-slate-700 text-[10.5px]">
                      Penata Layanan Operasional
                    </p>
                    <p className="font-mono text-slate-600 text-[9.5px] tracking-tight">
                      NIP. 200107182026211012
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modalJSX, document.body)
}

