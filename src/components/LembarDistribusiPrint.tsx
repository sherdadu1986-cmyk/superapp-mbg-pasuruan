"use client"
import React, { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Printer, X, Building2, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { fetchKelompokPenerimaManfaatList, sortKpmList, calculateKpmPortion, getPosyanduBreakdown, type KelompokPenerimaManfaat } from '@/lib/data-helpers'

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
  const [ruteFilter, setRuteFilter] = useState<'ALL' | 'Kiri' | 'Kanan'>('ALL')
  const [distribusiSettings, setDistribusiSettings] = useState<Record<string, { rute: 'Kiri' | 'Kanan'; no_hp_pic: string }>>({})

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const todayStr = new Date().toISOString().slice(0, 10)
      const saved = localStorage.getItem(`sppg_distribusi_settings_${todayStr}`)
      if (saved) {
        try {
          setDistribusiSettings(JSON.parse(saved))
        } catch {}
      }
    }
  }, [isOpen])

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
  const handleBukaLembarCetak = (targetRute: 'ALL' | 'Kiri' | 'Kanan' = ruteFilter) => {
    let ids = liburKpmIds || []
    if (ids.length === 0 && typeof window !== 'undefined') {
      const todayDate = new Date().toISOString().split('T')[0]
      const saved = localStorage.getItem(`sppg_kpm_libur_${todayDate}`)
      if (saved) {
        try { ids = JSON.parse(saved) } catch {}
      }
    }
    const liburParam = ids.join(',')
    const url = `/cetak/lembar-distribusi?libur=${encodeURIComponent(liburParam)}&rute=${targetRute}`
    window.open(url, '_blank')
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

  // Fetch KPM list when opened
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

  // Aggregate breakdown per KPM & grand totals (separating Sekolah & Posyandu)
  const { sekolahRuteKiri, sekolahRuteKanan, subtotalKiri, subtotalKanan, sekolahRows, posyanduRows, sekolahTotals, posyanduTotals, grandTotal, holidayKpmNames, aktifCount } = useMemo(() => {
    const sortedData = sortKpmList(kpmData)

    const sekolahList: KelompokPenerimaManfaat[] = []
    const posyanduList: KelompokPenerimaManfaat[] = []

    sortedData.forEach(item => {
      const nama = String(item.nama || (item as any).nama_kelompok || '').toUpperCase()
      const jenis = String(item.kategori || (item as any).jenis || '').toUpperCase()
      if (nama.includes('POSYANDU') || jenis.includes('POSYANDU') || nama.includes('DUSUN')) {
        posyanduList.push(item)
      } else {
        sekolahList.push(item)
      }
    })

    const holidayNames: string[] = []

    // Process Sekolah List
    let sekolahTotal = 0
    let sekolahKecil = 0
    let sekolahSiswaBesar = 0
    let sekolahTendik = 0
    let sekolahActive = 0

    const sekolahRuteKiri: Array<{
      no: number
      id: string
      nama: string
      kode: string
      rute: 'Kiri'
      noHpPic: string
      total: number
      porsiKecil: number
      porsiSiswaBesar: number
      guruTendik: number
      isLibur: boolean
    }> = []

    const sekolahRuteKanan: Array<{
      no: number
      id: string
      nama: string
      kode: string
      rute: 'Kanan'
      noHpPic: string
      total: number
      porsiKecil: number
      porsiSiswaBesar: number
      guruTendik: number
      isLibur: boolean
    }> = []

    sekolahList.forEach((item, idx) => {
      const itemKey = item.id || item.kode || item.identitas_npsn_tmp || String(idx)
      const isLibur = Boolean(liburKpmIds?.includes(itemKey) || (Boolean(item.id) && liburKpmIds?.includes(item.id!)))

      const saved = distribusiSettings[itemKey]
      const nameUpper = String(item.nama || '').toUpperCase()
      const isKiri = 
        nameUpper.includes('KB PERTIWI') ||
        nameUpper.includes('RA USWATUN') ||
        nameUpper.includes('TK PGRI') ||
        nameUpper.includes('AL ALAWIYAH') ||
        nameUpper.includes('BUDI RAHAYU') ||
        nameUpper.includes('PAKIJANGAN') ||
        nameUpper.includes('WONOREJO 4') ||
        nameUpper.includes('MTSN 4')
      const isKanan = 
        nameUpper.includes('HARAPAN') ||
        nameUpper.includes('AL-FALAH') ||
        nameUpper.includes('MELATI') ||
        nameUpper.includes('DARUN') ||
        nameUpper.includes('PKK IV') ||
        nameUpper.includes('WONOREJO 5') ||
        nameUpper.includes('WONOSARI') ||
        nameUpper.includes('TAMANSARI') ||
        nameUpper.includes('KARANGMENGGAH') ||
        nameUpper.includes('SMPN 2')
      const itemRute = (item as any).rute
      const fallbackRute: 'Kiri' | 'Kanan' = isKiri ? 'Kiri' : isKanan ? 'Kanan' : (itemRute ? (String(itemRute).toLowerCase().includes('kanan') ? 'Kanan' : 'Kiri') : (idx < Math.ceil(sortedData.length / 2) ? 'Kiri' : 'Kanan'))
      const rute: 'Kiri' | 'Kanan' = saved?.rute || fallbackRute
      const noHpPic = saved?.no_hp_pic !== undefined ? saved.no_hp_pic : (item.hp || item.pimpinan || '-')

      if (ruteFilter !== 'ALL' && rute !== ruteFilter) return

      const breakdown = calculateKpmPortion(item)
      const t = isLibur ? 0 : breakdown.total
      const k = isLibur ? 0 : breakdown.porsiKecil
      const tend = isLibur ? 0 : breakdown.tendik
      const sb = isLibur ? 0 : breakdown.siswaBesar

      if (isLibur) {
        if (!holidayNames.includes(item.nama)) holidayNames.push(item.nama)
      } else {
        sekolahActive += 1
      }

      sekolahTotal += t
      sekolahKecil += k
      sekolahSiswaBesar += sb
      sekolahTendik += tend

      if (rute === 'Kiri') {
        sekolahRuteKiri.push({
          no: sekolahRuteKiri.length + 1,
          id: itemKey,
          nama: item.nama,
          kode: item.identitas_npsn_tmp || item.kode || item.id || '',
          rute: 'Kiri',
          noHpPic,
          total: t,
          porsiKecil: k,
          porsiSiswaBesar: sb,
          guruTendik: tend,
          isLibur
        })
      } else {
        sekolahRuteKanan.push({
          no: sekolahRuteKanan.length + 1,
          id: itemKey,
          nama: item.nama,
          kode: item.identitas_npsn_tmp || item.kode || item.id || '',
          rute: 'Kanan',
          noHpPic,
          total: t,
          porsiKecil: k,
          porsiSiswaBesar: sb,
          guruTendik: tend,
          isLibur
        })
      }
    })

    const subtotalKiri = {
      total: sekolahRuteKiri.reduce((acc, s) => acc + s.total, 0),
      kecil: sekolahRuteKiri.reduce((acc, s) => acc + s.porsiKecil, 0),
      siswa: sekolahRuteKiri.reduce((acc, s) => acc + s.porsiSiswaBesar, 0),
      tendik: sekolahRuteKiri.reduce((acc, s) => acc + s.guruTendik, 0),
      activeCount: sekolahRuteKiri.filter(s => !s.isLibur).length
    }

    const subtotalKanan = {
      total: sekolahRuteKanan.reduce((acc, s) => acc + s.total, 0),
      kecil: sekolahRuteKanan.reduce((acc, s) => acc + s.porsiKecil, 0),
      siswa: sekolahRuteKanan.reduce((acc, s) => acc + s.porsiSiswaBesar, 0),
      tendik: sekolahRuteKanan.reduce((acc, s) => acc + s.guruTendik, 0),
      activeCount: sekolahRuteKanan.filter(s => !s.isLibur).length
    }

    // Process Posyandu List
    let posyanduTotal = 0
    let posyanduBalita = 0
    let posyanduBumil = 0
    let posyanduBusui = 0
    let posyanduActive = 0

    const processedPosyandu: Array<{
      no: number
      id: string
      nama: string
      kode: string
      rute: 'Kiri' | 'Kanan'
      noHpPic: string
      balita: number
      bumil: number
      busui: number
      total: number
      isLibur: boolean
    }> = []

    posyanduList.forEach((item, idx) => {
      const itemKey = item.id || item.kode || item.identitas_npsn_tmp || String(idx)
      const isLibur = liburKpmIds?.includes(itemKey) || (Boolean(item.id) && liburKpmIds?.includes(item.id!))

      const saved = distribusiSettings[itemKey]
      const defaultRute: 'Kiri' | 'Kanan' = (sekolahList.length + idx) < Math.ceil(sortedData.length / 2) ? 'Kiri' : 'Kanan'
      const rute: 'Kiri' | 'Kanan' = saved?.rute || defaultRute
      const noHpPic = saved?.no_hp_pic !== undefined ? saved.no_hp_pic : (item.hp || item.pimpinan || '-')

      if (ruteFilter !== 'ALL' && rute !== ruteFilter) return

      if (isLibur) {
        if (!holidayNames.includes(item.nama)) holidayNames.push(item.nama)
        processedPosyandu.push({
          no: processedPosyandu.length + 1,
          id: itemKey,
          nama: item.nama,
          kode: item.identitas_npsn_tmp || item.kode || item.id || '',
          rute,
          noHpPic,
          balita: 0,
          bumil: 0,
          busui: 0,
          total: 0,
          isLibur: true
        })
        return
      }

      posyanduActive += 1
      const pos = getPosyanduBreakdown(item)
      posyanduTotal += pos.total
      posyanduBalita += pos.balita
      posyanduBumil += pos.bumil
      posyanduBusui += pos.busui

      processedPosyandu.push({
        no: processedPosyandu.length + 1,
        id: itemKey,
        nama: item.nama,
        kode: item.identitas_npsn_tmp || item.kode || item.id || '',
        rute,
        noHpPic,
        balita: pos.balita,
        bumil: pos.bumil,
        busui: pos.busui,
        total: pos.total,
        isLibur: false
      })
    })

    return {
      sekolahRuteKiri,
      sekolahRuteKanan,
      subtotalKiri,
      subtotalKanan,
      sekolahRows: [...sekolahRuteKiri, ...sekolahRuteKanan],
      posyanduRows: processedPosyandu,
      sekolahTotals: { total: sekolahTotal, kecil: sekolahKecil, siswaBesar: sekolahSiswaBesar, tendik: sekolahTendik, active: sekolahActive },
      posyanduTotals: { total: posyanduTotal, balita: posyanduBalita, bumil: posyanduBumil, busui: posyanduBusui, active: posyanduActive },
      grandTotal: sekolahTotal + posyanduTotal,
      holidayKpmNames: holidayNames,
      aktifCount: sekolahActive + posyanduActive
    }
  }, [kpmData, liburKpmIds, ruteFilter, distribusiSettings])

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

          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-slate-800 p-1 rounded-lg flex items-center gap-1 border border-slate-700">
              <button
                type="button"
                onClick={() => setRuteFilter('ALL')}
                className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer transition ${
                  ruteFilter === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                Semua Rute
              </button>
              <button
                type="button"
                onClick={() => setRuteFilter('Kiri')}
                className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer transition ${
                  ruteFilter === 'Kiri' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                Rute Kiri
              </button>
              <button
                type="button"
                onClick={() => setRuteFilter('Kanan')}
                className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer transition ${
                  ruteFilter === 'Kanan' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                Rute Kanan
              </button>
            </div>
            <button
              onClick={() => handleBukaLembarCetak(ruteFilter)}
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
            className="w-[794px] min-h-[1123px] bg-white p-8 flex flex-col justify-between text-slate-900 mx-auto"
            style={{ boxSizing: 'border-box' }}
          >
            {/* Top & Table Section Wrapper */}
            <div className="space-y-3">
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
                <div className="bg-[#f8fafc] border border-slate-300 rounded-md p-2 text-right shrink-0 min-w-[160px]">
                  <div className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">TANGGAL OPERASIONAL</div>
                  <div className="font-black text-[#0f172a] text-[10pt] mt-0.5 leading-snug">
                    {fullDateFormatted}
                  </div>
                  <div className="text-[8pt] font-medium text-slate-500 mt-0.5">
                    Waktu Cetak: <span className="font-bold text-slate-700">{printTimeFormatted}</span>
                  </div>
                </div>
              </div>

              {/* Garis Pembatas Kop Ganda Elegan */}
              <div className="my-2 space-y-0.5">
                <div className="h-[2px] bg-[#0f172a]" />
                <div className="h-[1px] bg-slate-400" />
              </div>

              {/* 2. Ringkasan Informasi Singkat (4 Kolom) */}
              <div className="grid grid-cols-4 gap-2 bg-[#f8fafc] border border-[#e2e8f0] py-1.5 px-3 rounded-md text-[10px]">
                <div>
                  <span className="text-[8px] font-bold text-slate-400 uppercase block">UNIT LAYANAN</span>
                  <span className="font-extrabold text-[#0f172a]">SPPG Kiduldalem</span>
                </div>
                <div>
                  <span className="text-[8px] font-bold text-slate-400 uppercase block">WILAYAH</span>
                  <span className="font-extrabold text-[#0f172a]">Wonorejo, Pasuruan</span>
                </div>
                <div>
                  <span className="text-[8px] font-bold text-slate-400 uppercase block">TOTAL TITIK KPM</span>
                  <span className="font-black text-[#0f172a] font-mono">
                    {sekolahRows.length + posyanduRows.length} Titik ({aktifCount} Aktif)
                  </span>
                </div>
                <div>
                  <span className="text-[8px] font-bold text-slate-400 uppercase block">STATUS OPERASIONAL</span>
                  <span className="font-black text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 size={11} className="text-emerald-600 shrink-0" />
                    <span>Terverifikasi APPO</span>
                  </span>
                </div>
              </div>

              {/* 3. TABEL 1: LEMBAGA SEKOLAH (TERPISAH PER RUTE) */}
              <div className="space-y-4">
                {/* 3A. SUB-TABEL 1A: DISTRIBUSI SEKOLAH - RUTE KIRI (ARMADA 1) */}
                {(ruteFilter === 'ALL' || ruteFilter === 'Kiri') && (
                  <div className="space-y-1 print-table-container" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                    <div className="text-[10px] font-bold text-blue-900 uppercase tracking-wider flex justify-between items-center bg-blue-50 px-2.5 py-1 border border-blue-200 rounded-t-md">
                      <span className="flex items-center gap-1.5 font-extrabold text-blue-950">
                        🚚 TABEL 1A: LEMBAGA SEKOLAH - RUTE KIRI ({sekolahRuteKiri.length} TITIK)
                      </span>
                      <span className="font-mono text-[9.5px] bg-blue-100 text-blue-950 px-2 py-0.5 rounded border border-blue-300 font-bold">
                        Subtotal: {subtotalKiri.total.toLocaleString('id-ID')} Porsi
                      </span>
                    </div>
                    <div className="border border-slate-400 rounded-b-md overflow-hidden">
                      <table className="w-full text-left border-collapse text-[10px] leading-tight font-medium">
                        <thead className="bg-[#0e2a5c] text-white text-center font-bold text-[9.5px] uppercase tracking-wider">
                          <tr>
                            <th rowSpan={2} className="border border-slate-600 py-1 px-1.5 text-center w-7">NO</th>
                            <th rowSpan={2} className="border border-slate-600 py-1 px-2 text-left">NAMA LEMBAGA SEKOLAH</th>
                            <th rowSpan={2} className="border border-slate-600 py-1 px-1 text-center w-12">STATUS</th>
                            <th rowSpan={2} className="border border-slate-600 py-1 px-1.5 text-center w-24">NO HP PIC</th>
                            <th rowSpan={2} className="border border-slate-600 py-1 px-1.5 text-right w-14">TOTAL</th>
                            <th colSpan={3} className="border border-slate-600 py-0.5 px-1 text-center uppercase tracking-wide">PORSI</th>
                          </tr>
                          <tr className="bg-[#0e2a5c] text-white text-[8.5px]">
                            <th className="border border-slate-600 py-0.5 px-1 text-right w-12 text-amber-300">KECIL</th>
                            <th className="border border-slate-600 py-0.5 px-1 text-right w-12 text-blue-300">SISWA</th>
                            <th className="border border-slate-600 py-0.5 px-1 text-right w-12 text-white">TENDIK</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 font-semibold text-[#0f172a]">
                          {sekolahRuteKiri.length > 0 ? (
                            sekolahRuteKiri.map((row) => (
                              <tr
                                key={row.id}
                                className={row.isLibur ? 'bg-[#fef2f2] text-slate-400' : 'bg-white hover:bg-blue-50/40'}
                              >
                                <td className="py-0.5 px-1.5 text-center font-mono text-[9px] border border-slate-300">{row.no}</td>
                                <td className="py-0.5 px-2 border border-slate-300">
                                  {row.isLibur ? (
                                    <span className="line-through text-slate-400">{row.nama} [LIBUR]</span>
                                  ) : (
                                    <span className="font-extrabold text-[#0f172a] block text-[10px]">{row.nama}</span>
                                  )}
                                </td>
                                <td className="py-0.5 px-1 text-center border border-slate-300 text-[8.5px]">
                                  {row.isLibur ? <span className="text-rose-700 font-bold">Libur</span> : <span className="text-emerald-700 font-bold">Aktif</span>}
                                </td>
                                <td className="py-0.5 px-1.5 text-center font-mono text-[9px] text-slate-700 border border-slate-300">
                                  {row.noHpPic || '-'}
                                </td>
                                <td className="py-0.5 px-1.5 text-right font-black font-mono text-[10px] border border-slate-300">
                                  {row.isLibur ? '0' : row.total.toLocaleString('id-ID')}
                                </td>
                                <td className="py-0.5 px-1 text-right font-mono text-amber-700 font-bold border border-slate-300">
                                  {row.isLibur ? '-' : row.porsiKecil > 0 ? row.porsiKecil.toLocaleString('id-ID') : '-'}
                                </td>
                                <td className="py-0.5 px-1 text-right font-mono text-blue-700 font-bold border border-slate-300">
                                  {row.isLibur ? '-' : row.porsiSiswaBesar > 0 ? row.porsiSiswaBesar.toLocaleString('id-ID') : '-'}
                                </td>
                                <td className="py-0.5 px-1 text-right font-mono text-slate-700 font-semibold border border-slate-300">
                                  {row.isLibur ? '-' : row.guruTendik > 0 ? row.guruTendik.toLocaleString('id-ID') : '-'}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={8} className="py-2 text-center text-slate-400 italic text-[10px] border border-slate-300">
                                Tidak ada data sekolah di Rute Kiri.
                              </td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot className="bg-[#0e2a5c] text-white font-bold border-t border-[#0f172a] text-[10px]">
                          <tr>
                            <td colSpan={4} className="border border-slate-600 py-1 px-2 text-left font-black uppercase tracking-wider text-white">
                              SUBTOTAL RUTE KIRI ({subtotalKiri.activeCount} LEMBAGA AKTIF)
                            </td>
                            <td className="border border-slate-600 py-1 px-1.5 text-right font-mono text-white font-black">
                              {subtotalKiri.total.toLocaleString('id-ID')}
                            </td>
                            <td className="border border-slate-600 py-1 px-1 text-right font-mono text-amber-300 font-black">
                              {subtotalKiri.kecil.toLocaleString('id-ID')}
                            </td>
                            <td className="border border-slate-600 py-1 px-1 text-right font-mono text-blue-200 font-black">
                              {subtotalKiri.siswa.toLocaleString('id-ID')}
                            </td>
                            <td className="border border-slate-600 py-1 px-1 text-right font-mono text-white font-bold">
                              {subtotalKiri.tendik.toLocaleString('id-ID')}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                {/* 3B. SUB-TABEL 1B: DISTRIBUSI SEKOLAH - RUTE KANAN (ARMADA 2) */}
                {(ruteFilter === 'ALL' || ruteFilter === 'Kanan') && (
                  <div className={`space-y-1 print-table-container ${ruteFilter === 'ALL' ? 'mt-4' : ''}`} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                    <div className="text-[10px] font-bold text-amber-900 uppercase tracking-wider flex justify-between items-center bg-amber-50 px-2.5 py-1 border border-amber-200 rounded-t-md">
                      <span className="flex items-center gap-1.5 font-extrabold text-amber-950">
                        🚚 TABEL 1B: LEMBAGA SEKOLAH - RUTE KANAN ({sekolahRuteKanan.length} TITIK)
                      </span>
                      <span className="font-mono text-[9.5px] bg-amber-100 text-amber-950 px-2 py-0.5 rounded border border-amber-300 font-bold">
                        Subtotal: {subtotalKanan.total.toLocaleString('id-ID')} Porsi
                      </span>
                    </div>
                    <div className="border border-slate-400 rounded-b-md overflow-hidden">
                      <table className="w-full text-left border-collapse text-[10px] leading-tight font-medium">
                        <thead className="bg-[#78350f] text-white text-center font-bold text-[9.5px] uppercase tracking-wider">
                          <tr>
                            <th rowSpan={2} className="border border-amber-800 py-1 px-1.5 text-center w-7">NO</th>
                            <th rowSpan={2} className="border border-amber-800 py-1 px-2 text-left">NAMA LEMBAGA SEKOLAH</th>
                            <th rowSpan={2} className="border border-amber-800 py-1 px-1 text-center w-12">STATUS</th>
                            <th rowSpan={2} className="border border-amber-800 py-1 px-1.5 text-center w-24">NO HP PIC</th>
                            <th rowSpan={2} className="border border-amber-800 py-1 px-1.5 text-right w-14">TOTAL</th>
                            <th colSpan={3} className="border border-amber-800 py-0.5 px-1 text-center uppercase tracking-wide">PORSI</th>
                          </tr>
                          <tr className="bg-[#78350f] text-white text-[8.5px]">
                            <th className="border border-amber-800 py-0.5 px-1 text-right w-12 text-amber-300">KECIL</th>
                            <th className="border border-amber-800 py-0.5 px-1 text-right w-12 text-blue-300">SISWA</th>
                            <th className="border border-amber-800 py-0.5 px-1 text-right w-12 text-white">TENDIK</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 font-semibold text-[#0f172a]">
                          {sekolahRuteKanan.length > 0 ? (
                            sekolahRuteKanan.map((row) => (
                              <tr
                                key={row.id}
                                className={row.isLibur ? 'bg-[#fef2f2] text-slate-400' : 'bg-white hover:bg-amber-50/40'}
                              >
                                <td className="py-0.5 px-1.5 text-center font-mono text-[9px] border border-slate-300">{row.no}</td>
                                <td className="py-0.5 px-2 border border-slate-300">
                                  {row.isLibur ? (
                                    <span className="line-through text-slate-400">{row.nama} [LIBUR]</span>
                                  ) : (
                                    <span className="font-extrabold text-[#0f172a] block text-[10px]">{row.nama}</span>
                                  )}
                                </td>
                                <td className="py-0.5 px-1 text-center border border-slate-300 text-[8.5px]">
                                  {row.isLibur ? <span className="text-rose-700 font-bold">Libur</span> : <span className="text-emerald-700 font-bold">Aktif</span>}
                                </td>
                                <td className="py-0.5 px-1.5 text-center font-mono text-[9px] text-slate-700 border border-slate-300">
                                  {row.noHpPic || '-'}
                                </td>
                                <td className="py-0.5 px-1.5 text-right font-black font-mono text-[10px] border border-slate-300">
                                  {row.isLibur ? '0' : row.total.toLocaleString('id-ID')}
                                </td>
                                <td className="py-0.5 px-1 text-right font-mono text-amber-700 font-bold border border-slate-300">
                                  {row.isLibur ? '-' : row.porsiKecil > 0 ? row.porsiKecil.toLocaleString('id-ID') : '-'}
                                </td>
                                <td className="py-0.5 px-1 text-right font-mono text-blue-700 font-bold border border-slate-300">
                                  {row.isLibur ? '-' : row.porsiSiswaBesar > 0 ? row.porsiSiswaBesar.toLocaleString('id-ID') : '-'}
                                </td>
                                <td className="py-0.5 px-1 text-right font-mono text-slate-700 font-semibold border border-slate-300">
                                  {row.isLibur ? '-' : row.guruTendik > 0 ? row.guruTendik.toLocaleString('id-ID') : '-'}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={8} className="py-2 text-center text-slate-400 italic text-[10px] border border-slate-300">
                                Tidak ada data sekolah di Rute Kanan.
                              </td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot className="bg-[#78350f] text-white font-bold border-t border-amber-900 text-[10px]">
                          <tr>
                            <td colSpan={4} className="border border-amber-800 py-1 px-2 text-left font-black uppercase tracking-wider text-white">
                              SUBTOTAL RUTE KANAN ({subtotalKanan.activeCount} LEMBAGA AKTIF)
                            </td>
                            <td className="border border-amber-800 py-1 px-1.5 text-right font-mono text-white font-black">
                              {subtotalKanan.total.toLocaleString('id-ID')}
                            </td>
                            <td className="border border-amber-800 py-1 px-1 text-right font-mono text-amber-300 font-black">
                              {subtotalKanan.kecil.toLocaleString('id-ID')}
                            </td>
                            <td className="border border-amber-800 py-1 px-1 text-right font-mono text-blue-200 font-black">
                              {subtotalKanan.siswa.toLocaleString('id-ID')}
                            </td>
                            <td className="border border-amber-800 py-1 px-1 text-right font-mono text-white font-bold">
                              {subtotalKanan.tendik.toLocaleString('id-ID')}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                {/* 3C. BARIS TOTAL KESELURUHAN SEKOLAH */}
                {ruteFilter === 'ALL' && (
                  <div className="bg-[#0f172a] text-white p-2 rounded-md border border-slate-800 flex justify-between items-center text-[9.5px] font-bold">
                    <span className="uppercase tracking-wider">
                      TOTAL KESELURUHAN SEKOLAH ({sekolahTotals.active} LEMBAGA AKTIF)
                    </span>
                    <span className="font-mono text-[10.5px] text-amber-300 font-black">
                      {sekolahTotals.total.toLocaleString('id-ID')} PORSI
                      <span className="text-slate-300 text-[8.5px] font-normal ml-2">
                        (Kecil: {sekolahTotals.kecil.toLocaleString('id-ID')} | Siswa: {sekolahTotals.siswaBesar.toLocaleString('id-ID')} | Tendik: {sekolahTotals.tendik.toLocaleString('id-ID')})
                      </span>
                    </span>
                  </div>
                )}
              </div>

              {/* 4. TABEL 2: POSYANDU / SASARAN 3B */}
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-pink-700 uppercase tracking-wider flex justify-between items-center">
                  <span>TABEL 2: POSYANDU / SASARAN 3B ({posyanduRows.length} Titik)</span>
                  <span className="font-mono text-slate-700">Subtotal: {posyanduTotals.total.toLocaleString('id-ID')} Porsi</span>
                </div>
                <div className="border border-slate-400 rounded-md overflow-hidden">
                  <table className="w-full text-left border-collapse text-[10px] leading-tight font-medium">
                    <thead className="bg-[#0e2a5c] text-white text-center font-bold text-[9.5px] uppercase tracking-wider">
                      <tr>
                        <th className="border border-slate-600 py-1 px-1.5 text-center w-7">NO</th>
                        <th className="border border-slate-600 py-1 px-2 text-left">NAMA POSYANDU / DUSUN</th>
                        <th className="border border-slate-600 py-1 px-1 text-center w-12">STATUS</th>
                        <th className="border border-slate-600 py-1 px-1 text-center w-12">RUTE</th>
                        <th className="border border-slate-600 py-1 px-1.5 text-center w-20">NO HP PIC</th>
                        <th className="border border-slate-600 py-1 px-1 text-right w-12 text-amber-300">BALITA</th>
                        <th className="border border-slate-600 py-1 px-1 text-right w-12 text-rose-300">BUMIL</th>
                        <th className="border border-slate-600 py-1 px-1 text-right w-12 text-pink-300">BUSUI</th>
                        <th className="border border-slate-600 py-1 px-1.5 text-right w-14 font-black">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-semibold text-[#0f172a]">
                      {posyanduRows.length > 0 ? (
                        posyanduRows.map((row) => (
                          <tr
                            key={row.id}
                            className={row.isLibur ? 'bg-[#fef2f2] text-slate-400' : 'bg-white hover:bg-slate-50'}
                          >
                            <td className="py-0.5 px-1.5 text-center font-mono text-[9px] border border-slate-300">{row.no}</td>
                            <td className="py-0.5 px-2 border border-slate-300">
                              {row.isLibur ? (
                                <span className="line-through text-slate-400">{row.nama} [LIBUR]</span>
                              ) : (
                                <span className="font-extrabold text-[#0f172a] block text-[10px]">{row.nama}</span>
                              )}
                            </td>
                            <td className="py-0.5 px-1 text-center border border-slate-300 text-[8.5px]">
                              {row.isLibur ? <span className="text-rose-700 font-bold">Libur</span> : <span className="text-emerald-700 font-bold">Aktif</span>}
                            </td>
                            <td className="py-0.5 px-1 text-center border border-slate-300 text-[8.5px] font-bold">
                              {row.rute}
                            </td>
                            <td className="py-0.5 px-1.5 text-center font-mono text-[9px] text-slate-700 border border-slate-300">
                              {row.noHpPic || '-'}
                            </td>
                            <td className="py-0.5 px-1 text-right font-mono text-amber-700 font-bold border border-slate-300">
                              {row.isLibur ? '-' : row.balita > 0 ? row.balita.toLocaleString('id-ID') : '-'}
                            </td>
                            <td className="py-0.5 px-1 text-right font-mono text-rose-700 font-bold border border-slate-300">
                              {row.isLibur ? '-' : row.bumil > 0 ? row.bumil.toLocaleString('id-ID') : '-'}
                            </td>
                            <td className="py-0.5 px-1 text-right font-mono text-pink-700 font-bold border border-slate-300">
                              {row.isLibur ? '-' : row.busui > 0 ? row.busui.toLocaleString('id-ID') : '-'}
                            </td>
                            <td className="py-0.5 px-1.5 text-right font-black font-mono text-[10px] border border-slate-300">
                              {row.isLibur ? '0' : row.total.toLocaleString('id-ID')}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={9} className="py-2 text-center text-slate-400 italic text-[10px] border border-slate-300">
                            Belum ada data Posyandu / Sasaran 3B terdaftar.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-[#0e2a5c] text-white font-bold border-t border-[#0f172a] text-[10px]">
                      <tr>
                        <td colSpan={5} className="border border-slate-600 py-1 px-2 text-left font-black uppercase tracking-wider text-white">
                          SUBTOTAL POSYANDU ({posyanduTotals.active} AKTIF)
                        </td>
                        <td className="border border-slate-600 py-1 px-1 text-right font-mono text-amber-300 font-black">
                          {posyanduTotals.balita.toLocaleString('id-ID')}
                        </td>
                        <td className="border border-slate-600 py-1 px-1 text-right font-mono text-rose-200 font-black">
                          {posyanduTotals.bumil.toLocaleString('id-ID')}
                        </td>
                        <td className="border border-slate-600 py-1 px-1 text-right font-mono text-pink-200 font-black">
                          {posyanduTotals.busui.toLocaleString('id-ID')}
                        </td>
                        <td className="border border-slate-600 py-1 px-1.5 text-right font-mono text-white font-black">
                          {posyanduTotals.total.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* 5. RINGKASAN GRAND TOTAL KESELURUHAN */}
              <div className="bg-[#0e2a5c] text-white p-2.5 rounded-md flex justify-between items-center text-[10.5px]">
                <span className="font-extrabold uppercase tracking-wider">
                  GRAND TOTAL KESELURUHAN PORSI MBG ({aktifCount} TITIK DISTRIBUSI AKTIF)
                </span>
                <span className="font-mono text-[11.5px] font-black tracking-wide">
                  {grandTotal.toLocaleString('id-ID')} PORSI HARIAN
                </span>
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

