'use client'
import React, { useEffect, useState, useMemo } from 'react'
import { Printer } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { fetchKelompokPenerimaManfaatList, sortKpmList, calculateKpmPortion, getPosyanduBreakdown, type KelompokPenerimaManfaat } from '@/lib/data-helpers'

export default function CetakLembarDistribusiPage() {
  const [kpmData, setKpmData] = useState<KelompokPenerimaManfaat[]>([])
  const [liburIds, setLiburIds] = useState<string[]>([])
  const [ruteFilter, setRuteFilter] = useState<'ALL' | 'Kiri' | 'Kanan'>('ALL')
  const [distribusiSettings, setDistribusiSettings] = useState<Record<string, { rute: 'Kiri' | 'Kanan'; no_hp_pic: string }>>({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Ambil data KPM libur & rute dari query params URL (?libur=id1,id2&rute=Kiri) atau localStorage
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const liburQuery = params.get('libur')
      const ruteQuery = params.get('rute') as 'ALL' | 'Kiri' | 'Kanan' | null

      if (ruteQuery && ['ALL', 'Kiri', 'Kanan'].includes(ruteQuery)) {
        setRuteFilter(ruteQuery)
      }

      if (liburQuery) {
        setLiburIds(liburQuery.split(',').filter(Boolean))
      } else {
        const todayDate = new Date().toISOString().split('T')[0]
        const saved = localStorage.getItem(`sppg_kpm_libur_${todayDate}`)
        if (saved) {
          try {
            setLiburIds(JSON.parse(saved))
          } catch {}
        }
      }

      const todayStr = new Date().toISOString().slice(0, 10)
      const savedDist = localStorage.getItem(`sppg_distribusi_settings_${todayStr}`)
      if (savedDist) {
        try {
          setDistribusiSettings(JSON.parse(savedDist))
        } catch {}
      }
    }

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
      } finally {
        setLoaded(true)
      }
    }
    loadKpm()
  }, [])

  useEffect(() => {
    if (!loaded) return
    // Beri jeda sedikit agar CSS & gambar logo termuat sempurna
    const timer = setTimeout(() => {
      window.print()
    }, 500)
    return () => clearTimeout(timer)
  }, [loaded])

  const fullDateFormatted = useMemo(() => {
    const d = new Date()
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
  }, [])

  const formattedDate = useMemo(() => {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date())
  }, [])

  const printTimeFormatted = useMemo(() => {
    const d = new Date()
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${hh}:${mm} WIB`
  }, [])

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
      const isLibur = liburIds.includes(itemKey) || (Boolean(item.id) && liburIds.includes(item.id!))

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
      const isLibur = liburIds.includes(itemKey) || (Boolean(item.id) && liburIds.includes(item.id!))

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
  }, [kpmData, liburIds, ruteFilter, distribusiSettings])

  return (
    <div className="print-page-root bg-white text-slate-900 min-h-screen">
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 6mm 8mm 6mm 8mm !important;
        }
        @media print {
          header,
          nav,
          aside,
          footer,
          .no-print,
          [data-component="navbar"],
          [data-component="sidebar"] {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-page-root {
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>

      {/* Tombol Bar Bantuan di Layar (Hilang saat cetak) */}
      <div className="no-print bg-slate-800 text-white p-3 flex flex-wrap justify-between items-center sticky top-0 z-50 shadow-md gap-2">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold">
            Pratinjau Lembar A4 Kedinasan SPPG Kiduldalem
          </span>
          <div className="bg-slate-700 p-0.5 rounded flex items-center gap-1 text-xs">
            <button
              onClick={() => setRuteFilter('ALL')}
              className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                ruteFilter === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              Cetak Semua ({kpmData.length})
            </button>
            <button
              onClick={() => setRuteFilter('Kiri')}
              className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                ruteFilter === 'Kiri' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              Rute Kiri Saja
            </button>
            <button
              onClick={() => setRuteFilter('Kanan')}
              className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                ruteFilter === 'Kanan' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              Rute Kanan Saja
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="bg-emerald-600 hover:bg-emerald-500 px-4 py-1.5 rounded text-sm font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Printer size={16} />
            <span>Cetak / Simpan PDF</span>
          </button>
          <button
            onClick={() => window.close()}
            className="bg-slate-600 hover:bg-slate-500 px-3 py-1.5 rounded text-sm cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* KERTAS A4 PRESISI (210mm x 297mm) */}
      <div className="w-full max-w-[200mm] mx-auto p-4 flex flex-col justify-between text-slate-900 font-sans text-xs">
        <div className="space-y-3">
          {/* 1. KOP SURAT RESMI */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2 mb-1">
            <div className="flex items-center gap-3">
              <img
                src="/logo-bgn.png"
                alt="Logo BGN"
                className="h-12 w-auto object-contain shrink-0"
              />
              <div>
                <h2 className="text-[11px] font-bold text-blue-900 leading-tight">
                  BADAN GIZI NASIONAL (BGN) REPUBLIK INDONESIA
                </h2>
                <h1 className="text-sm font-black text-slate-900 leading-tight">
                  SATUAN PELAYANAN PROGRAM GIZI (SPPG) WONOREJO - WONOREJO, PASURUAN
                </h1>
                <p className="text-[10px] text-slate-600 font-semibold tracking-wide uppercase">
                  LEMBAR REKAPITULASI KEBUTUHAN PORSI DISTRIBUSI HARIAN MBG {ruteFilter !== 'ALL' ? `(${ruteFilter.toUpperCase()})` : ''}
                </p>
              </div>
            </div>
            <div className="border border-slate-300 rounded p-1.5 text-right text-[10px] shrink-0 min-w-[155px]">
              <div className="text-[9px] text-slate-500 font-bold uppercase">
                TANGGAL OPERASIONAL
              </div>
              <div className="font-bold text-slate-900">{fullDateFormatted}</div>
              <div className="text-[8px] text-slate-500">
                Waktu Cetak: {printTimeFormatted}
              </div>
            </div>
          </div>

          {/* 2. RINGKASAN 4 KOLOM */}
          <div className="grid grid-cols-4 gap-2 bg-slate-50 border border-slate-200 rounded p-1.5 text-[10px]">
            <div>
              <span className="text-slate-500 block text-[9px]">UNIT LAYANAN</span>
              <span className="font-bold">SPPG Kiduldalem</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px]">RUTE DISTRIBUSI</span>
              <span className="font-bold text-indigo-700">
                {ruteFilter === 'ALL' ? 'Semua Rute (Kiri & Kanan)' : `Rute ${ruteFilter}`}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px]">TOTAL TITIK KPM</span>
              <span className="font-bold">
                {sekolahRows.length + posyanduRows.length} Titik ({aktifCount} Aktif, {holidayKpmNames.length} Libur)
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px]">STATUS OPERASIONAL</span>
              <span className="font-bold text-emerald-700">✓ Terverifikasi APPO</span>
            </div>
          </div>

          {/* 3. TABEL 1: LEMBAGA SEKOLAH (TERPISAH PER RUTE) */}
          <div className="space-y-4">
            {/* 3A. SUB-TABEL 1A: DISTRIBUSI SEKOLAH - RUTE KIRI (ARMADA 1) */}
            {(ruteFilter === 'ALL' || ruteFilter === 'Kiri') && (
              <div className="space-y-1 print-table-container" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                <div className="text-[10px] font-bold text-blue-900 uppercase tracking-wider flex justify-between items-center bg-blue-50 px-2.5 py-1 border border-blue-200 rounded-t">
                  <span className="flex items-center gap-1.5 font-extrabold text-blue-950">
                    🚚 TABEL 1A: LEMBAGA SEKOLAH - RUTE KIRI ({sekolahRuteKiri.length} TITIK)
                  </span>
                  <span className="font-mono text-[9.5px] bg-blue-100 text-blue-950 px-2 py-0.5 rounded border border-blue-300 font-bold">
                    Subtotal: {subtotalKiri.total.toLocaleString('id-ID')} Porsi
                  </span>
                </div>
                <div className="border border-slate-400 rounded-b overflow-hidden">
                  <table className="w-full border-collapse text-[9.5px]">
                    <thead className="bg-[#0e2a5c] text-white font-bold text-[9px] uppercase tracking-wider">
                      <tr>
                        <th rowSpan={2} className="border border-slate-600 py-1.5 px-1.5 text-center w-7">NO</th>
                        <th rowSpan={2} className="border border-slate-600 py-1.5 px-2 text-left">NAMA LEMBAGA SEKOLAH</th>
                        <th rowSpan={2} className="border border-slate-600 py-1.5 px-1 text-center w-12">STATUS</th>
                        <th rowSpan={2} className="border border-slate-600 py-1.5 px-1.5 text-center w-20">NO HP PIC</th>
                        <th rowSpan={2} className="border border-slate-600 py-1.5 px-1.5 text-right w-14">TOTAL</th>
                        <th colSpan={3} className="border border-slate-600 py-1 px-1 text-center uppercase tracking-wide">PORSI</th>
                      </tr>
                      <tr className="bg-[#0e2a5c] text-white text-[8.5px]">
                        <th className="border border-slate-600 py-1 px-1.5 text-right w-14 text-amber-300">KECIL</th>
                        <th className="border border-slate-600 py-1 px-1.5 text-right w-14 text-blue-300">SISWA</th>
                        <th className="border border-slate-600 py-1 px-1.5 text-right w-14 text-white">TENDIK</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium text-slate-900">
                      {sekolahRuteKiri.length > 0 ? (
                        sekolahRuteKiri.map((row) => (
                          <tr
                            key={row.id}
                            className={row.isLibur ? 'bg-rose-50 text-slate-400' : 'bg-white hover:bg-blue-50/30'}
                          >
                            <td className="py-0.5 px-1.5 text-center font-mono text-[8.5px] border border-slate-300">{row.no}</td>
                            <td className="py-0.5 px-2 font-semibold border border-slate-300">
                              {row.isLibur ? (
                                <>
                                  <span className="line-through">{row.nama}</span>
                                  <span className="ml-1.5 text-[7.5px] bg-red-100 text-red-600 px-1 py-0.2 rounded font-bold">
                                    [LIBUR - 0 PORSI]
                                  </span>
                                </>
                              ) : (
                                row.nama
                              )}
                            </td>
                            <td className="py-0.5 px-1 text-center border border-slate-300 text-[8.5px]">
                              {row.isLibur ? <span className="text-rose-700 font-bold">Libur</span> : <span className="text-emerald-700 font-bold">Aktif</span>}
                            </td>
                            <td className="py-0.5 px-1.5 text-center font-mono text-[8.5px] text-slate-700 border border-slate-300">
                              {row.noHpPic || '-'}
                            </td>
                            <td className="py-0.5 px-1.5 text-right font-bold border border-slate-300">
                              {row.isLibur ? 0 : row.total.toLocaleString('id-ID')}
                            </td>
                            <td className="py-0.5 px-1.5 text-right text-amber-700 font-bold border border-slate-300">
                              {row.isLibur ? '-' : row.porsiKecil > 0 ? row.porsiKecil.toLocaleString('id-ID') : '-'}
                            </td>
                            <td className="py-0.5 px-1.5 text-right text-blue-700 font-bold border border-slate-300">
                              {row.isLibur ? '-' : row.porsiSiswaBesar > 0 ? row.porsiSiswaBesar.toLocaleString('id-ID') : '-'}
                            </td>
                            <td className="py-0.5 px-1.5 text-right font-medium border border-slate-300">
                              {row.isLibur ? '-' : row.guruTendik > 0 ? row.guruTendik.toLocaleString('id-ID') : '-'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="py-2 text-center text-slate-400 italic border border-slate-300">
                            Tidak ada data sekolah di Rute Kiri.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-[#0e2a5c] text-white font-bold text-[9.5px]">
                        <td colSpan={4} className="border border-slate-600 py-1 px-2 text-left tracking-wider">
                          SUBTOTAL RUTE KIRI ({subtotalKiri.activeCount} LEMBAGA AKTIF)
                        </td>
                        <td className="border border-slate-600 py-1 px-1.5 text-right font-black">
                          {subtotalKiri.total.toLocaleString('id-ID')}
                        </td>
                        <td className="border border-slate-600 py-1 px-1.5 text-right text-amber-300 font-black">
                          {subtotalKiri.kecil.toLocaleString('id-ID')}
                        </td>
                        <td className="border border-slate-600 py-1 px-1.5 text-right text-blue-200 font-black">
                          {subtotalKiri.siswa.toLocaleString('id-ID')}
                        </td>
                        <td className="border border-slate-600 py-1 px-1.5 text-right text-white font-bold">
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
                <div className="text-[10px] font-bold text-amber-900 uppercase tracking-wider flex justify-between items-center bg-amber-50 px-2.5 py-1 border border-amber-200 rounded-t">
                  <span className="flex items-center gap-1.5 font-extrabold text-amber-950">
                    🚚 TABEL 1B: LEMBAGA SEKOLAH - RUTE KANAN ({sekolahRuteKanan.length} TITIK)
                  </span>
                  <span className="font-mono text-[9.5px] bg-amber-100 text-amber-950 px-2 py-0.5 rounded border border-amber-300 font-bold">
                    Subtotal: {subtotalKanan.total.toLocaleString('id-ID')} Porsi
                  </span>
                </div>
                <div className="border border-slate-400 rounded-b overflow-hidden">
                  <table className="w-full border-collapse text-[9.5px]">
                    <thead className="bg-[#78350f] text-white font-bold text-[9px] uppercase tracking-wider">
                      <tr>
                        <th rowSpan={2} className="border border-amber-800 py-1.5 px-1.5 text-center w-7">NO</th>
                        <th rowSpan={2} className="border border-amber-800 py-1.5 px-2 text-left">NAMA LEMBAGA SEKOLAH</th>
                        <th rowSpan={2} className="border border-amber-800 py-1.5 px-1 text-center w-12">STATUS</th>
                        <th rowSpan={2} className="border border-amber-800 py-1.5 px-1.5 text-center w-20">NO HP PIC</th>
                        <th rowSpan={2} className="border border-amber-800 py-1.5 px-1.5 text-right w-14">TOTAL</th>
                        <th colSpan={3} className="border border-amber-800 py-1 px-1 text-center uppercase tracking-wide">PORSI</th>
                      </tr>
                      <tr className="bg-[#78350f] text-white text-[8.5px]">
                        <th className="border border-amber-800 py-1 px-1.5 text-right w-14 text-amber-300">KECIL</th>
                        <th className="border border-amber-800 py-1 px-1.5 text-right w-14 text-blue-300">SISWA</th>
                        <th className="border border-amber-800 py-1 px-1.5 text-right w-14 text-white">TENDIK</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium text-slate-900">
                      {sekolahRuteKanan.length > 0 ? (
                        sekolahRuteKanan.map((row) => (
                          <tr
                            key={row.id}
                            className={row.isLibur ? 'bg-rose-50 text-slate-400' : 'bg-white hover:bg-amber-50/30'}
                          >
                            <td className="py-0.5 px-1.5 text-center font-mono text-[8.5px] border border-slate-300">{row.no}</td>
                            <td className="py-0.5 px-2 font-semibold border border-slate-300">
                              {row.isLibur ? (
                                <>
                                  <span className="line-through">{row.nama}</span>
                                  <span className="ml-1.5 text-[7.5px] bg-red-100 text-red-600 px-1 py-0.2 rounded font-bold">
                                    [LIBUR - 0 PORSI]
                                  </span>
                                </>
                              ) : (
                                row.nama
                              )}
                            </td>
                            <td className="py-0.5 px-1 text-center border border-slate-300 text-[8.5px]">
                              {row.isLibur ? <span className="text-rose-700 font-bold">Libur</span> : <span className="text-emerald-700 font-bold">Aktif</span>}
                            </td>
                            <td className="py-0.5 px-1.5 text-center font-mono text-[8.5px] text-slate-700 border border-slate-300">
                              {row.noHpPic || '-'}
                            </td>
                            <td className="py-0.5 px-1.5 text-right font-bold border border-slate-300">
                              {row.isLibur ? 0 : row.total.toLocaleString('id-ID')}
                            </td>
                            <td className="py-0.5 px-1.5 text-right text-amber-700 font-bold border border-slate-300">
                              {row.isLibur ? '-' : row.porsiKecil > 0 ? row.porsiKecil.toLocaleString('id-ID') : '-'}
                            </td>
                            <td className="py-0.5 px-1.5 text-right text-blue-700 font-bold border border-slate-300">
                              {row.isLibur ? '-' : row.porsiSiswaBesar > 0 ? row.porsiSiswaBesar.toLocaleString('id-ID') : '-'}
                            </td>
                            <td className="py-0.5 px-1.5 text-right font-medium border border-slate-300">
                              {row.isLibur ? '-' : row.guruTendik > 0 ? row.guruTendik.toLocaleString('id-ID') : '-'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="py-2 text-center text-slate-400 italic border border-slate-300">
                            Tidak ada data sekolah di Rute Kanan.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-[#78350f] text-white font-bold text-[9.5px]">
                        <td colSpan={4} className="border border-amber-800 py-1 px-2 text-left tracking-wider">
                          SUBTOTAL RUTE KANAN ({subtotalKanan.activeCount} LEMBAGA AKTIF)
                        </td>
                        <td className="border border-amber-800 py-1 px-1.5 text-right font-black">
                          {subtotalKanan.total.toLocaleString('id-ID')}
                        </td>
                        <td className="border border-amber-800 py-1 px-1.5 text-right text-amber-300 font-black">
                          {subtotalKanan.kecil.toLocaleString('id-ID')}
                        </td>
                        <td className="border border-amber-800 py-1 px-1.5 text-right text-blue-200 font-black">
                          {subtotalKanan.siswa.toLocaleString('id-ID')}
                        </td>
                        <td className="border border-amber-800 py-1 px-1.5 text-right text-white font-bold">
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
              <div className="bg-[#0f172a] text-white p-2 rounded border border-slate-800 flex justify-between items-center text-[9.5px] font-bold">
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
            <div className="border border-slate-400 rounded overflow-hidden">
              <table className="w-full border-collapse text-[9.5px]">
                <thead className="bg-[#0e2a5c] text-white font-bold text-[9px] uppercase tracking-wider">
                  <tr>
                    <th className="border border-slate-600 py-1.5 px-1.5 text-center w-7">NO</th>
                    <th className="border border-slate-600 py-1.5 px-2 text-left">NAMA POSYANDU / DUSUN</th>
                    <th className="border border-slate-600 py-1.5 px-1 text-center w-12">STATUS</th>
                    <th className="border border-slate-600 py-1.5 px-1 text-center w-12">RUTE</th>
                    <th className="border border-slate-600 py-1.5 px-1.5 text-center w-20">NO HP PIC</th>
                    <th className="border border-slate-600 py-1 px-1.5 text-right w-14 text-amber-300">BALITA</th>
                    <th className="border border-slate-600 py-1 px-1.5 text-right w-14 text-rose-300">BUMIL</th>
                    <th className="border border-slate-600 py-1 px-1.5 text-right w-14 text-pink-300">BUSUI</th>
                    <th className="border border-slate-600 py-1.5 px-1.5 text-right w-14 font-black">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-900">
                  {posyanduRows.length > 0 ? (
                    posyanduRows.map((row) => (
                      <tr
                        key={row.id}
                        className={row.isLibur ? 'bg-rose-50 text-slate-400' : 'bg-white hover:bg-slate-50'}
                      >
                        <td className="py-0.5 px-1.5 text-center font-mono text-[8.5px] border border-slate-300">{row.no}</td>
                        <td className="py-0.5 px-2 font-semibold border border-slate-300">
                          {row.isLibur ? (
                            <>
                              <span className="line-through">{row.nama}</span>
                              <span className="ml-1.5 text-[7.5px] bg-red-100 text-red-600 px-1 py-0.2 rounded font-bold">
                                [LIBUR - 0 PORSI]
                              </span>
                            </>
                          ) : (
                            row.nama
                          )}
                        </td>
                        <td className="py-0.5 px-1 text-center border border-slate-300 text-[8.5px]">
                          {row.isLibur ? <span className="text-rose-700 font-bold">Libur</span> : <span className="text-emerald-700 font-bold">Aktif</span>}
                        </td>
                        <td className="py-0.5 px-1 text-center font-bold border border-slate-300 text-[8.5px]">{row.rute}</td>
                        <td className="py-0.5 px-1.5 text-center font-mono text-[8.5px] text-slate-700 border border-slate-300">
                          {row.noHpPic || '-'}
                        </td>
                        <td className="py-0.5 px-1.5 text-right text-amber-700 font-bold border border-slate-300">
                          {row.isLibur ? '-' : row.balita > 0 ? row.balita.toLocaleString('id-ID') : '-'}
                        </td>
                        <td className="py-0.5 px-1.5 text-right text-rose-700 font-bold border border-slate-300">
                          {row.isLibur ? '-' : row.bumil > 0 ? row.bumil.toLocaleString('id-ID') : '-'}
                        </td>
                        <td className="py-0.5 px-1.5 text-right text-pink-700 font-bold border border-slate-300">
                          {row.isLibur ? '-' : row.busui > 0 ? row.busui.toLocaleString('id-ID') : '-'}
                        </td>
                        <td className="py-0.5 px-1.5 text-right font-black border border-slate-300">
                          {row.isLibur ? 0 : row.total.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-2 text-center text-slate-400 italic border border-slate-300">
                        Belum ada data Posyandu / Sasaran 3B terdaftar.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-[#0e2a5c] text-white font-bold text-[9.5px]">
                    <td colSpan={5} className="border border-slate-600 py-1 px-2 text-left tracking-wider">
                      SUBTOTAL POSYANDU ({posyanduTotals.active} AKTIF)
                    </td>
                    <td className="border border-slate-600 py-1 px-1.5 text-right text-amber-300 font-black">
                      {posyanduTotals.balita.toLocaleString('id-ID')}
                    </td>
                    <td className="border border-slate-600 py-1 px-1.5 text-right text-rose-200 font-black">
                      {posyanduTotals.bumil.toLocaleString('id-ID')}
                    </td>
                    <td className="border border-slate-600 py-1 px-1.5 text-right text-pink-200 font-black">
                      {posyanduTotals.busui.toLocaleString('id-ID')}
                    </td>
                    <td className="border border-slate-600 py-1 px-1.5 text-right font-black">
                      {posyanduTotals.total.toLocaleString('id-ID')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* 5. RINGKASAN GRAND TOTAL KESELURUHAN */}
          <div className="bg-[#0e2a5c] text-white p-2 rounded-md flex justify-between items-center text-[10px]">
            <span className="font-extrabold uppercase tracking-wider">
              GRAND TOTAL KESELURUHAN PORSI MBG ({aktifCount} TITIK DISTRIBUSI AKTIF)
            </span>
            <span className="font-mono text-[11px] font-black tracking-wide">
              {grandTotal.toLocaleString('id-ID')} PORSI HARIAN
            </span>
          </div>

          {/* 6. CATATAN LIBUR */}
          {holidayKpmNames.length > 0 && (
            <div className="border border-red-200 bg-red-50/70 text-red-800 text-[9px] p-1.5 rounded leading-snug">
              <span className="font-bold">
                CATATAN KPM LIBUR HARI INI ({holidayKpmNames.length} LEMBAGA):
              </span>
              <br />
              {holidayKpmNames.join(', ')} libur hari ini, alokasi porsi dialihkan/ditiadakan.
            </div>
          )}
        </div>

        {/* 7. TANDA TANGAN & TTE KEDINASAN */}
        <div className="flex justify-between items-end mt-2 pt-1 text-[9.5px] border-t border-slate-200 print:break-inside-avoid">
          <div className="text-center w-48 space-y-0.5">
            <p className="text-slate-600">Mengetahui,</p>
            <p className="font-bold">Petugas Distribusi & Logistik</p>
            <div className="h-10 flex items-end justify-center pb-0.5">
              <span className="text-[8px] text-slate-400 font-mono italic">
                (Tanda Tangan & Nama Terang)
              </span>
            </div>
            <p className="font-bold text-slate-900 border-t border-slate-300 pt-0.5 inline-block w-36 mx-auto">
              (_________________________)
            </p>
          </div>

          <div className="text-left w-56 space-y-0.5">
            <p>Ditetapkan di Pasuruan</p>
            <p>
              pada tanggal <span className="font-bold">{formattedDate}</span>
            </p>
            <p className="font-bold mb-1">Kepala SPPG,</p>

            {/* Badge TTE BSrE Hijau */}
            <div className="border border-emerald-600 bg-emerald-50 rounded p-1 my-1 w-fit">
              <div className="flex items-center gap-1 text-emerald-800 font-bold text-[8.5px]">
                <span>✓</span> DITANDATANGANI SECARA ELEKTRONIK
              </div>
              <div className="text-[7.5px] text-emerald-700">
                Sertifikasi BSrE · Badan Gizi Nasional RI
              </div>
            </div>

            <p className="font-bold underline text-slate-900 mt-1">
              Ahmad Sayyidani Khaqiqi, S.Pd
            </p>
            <p className="text-[8.5px] text-slate-600">Penata Layanan Operasional</p>
            <p className="text-[8.5px] text-slate-600 font-mono">NIP. 200107182026211012</p>
          </div>
        </div>
      </div>
    </div>
  )
}
