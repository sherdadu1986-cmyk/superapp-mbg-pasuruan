'use client'
import React, { useEffect, useState, useMemo } from 'react'
import { Printer } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { fetchKelompokPenerimaManfaatList, sortKpmList, calculateKpmPortion, type KelompokPenerimaManfaat } from '@/lib/data-helpers'

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

  const { rows, totals, holidayKpmNames, aktifCount } = useMemo(() => {
    let grandTotal = 0
    let grandKecil = 0
    let grandSiswaBesar = 0
    let grandTendik = 0
    let active = 0
    const holidayNames: string[] = []

    const sortedData = sortKpmList(kpmData)

    const processed: Array<{
      no: number
      id: string
      nama: string
      kode: string
      kategori: string
      rute: 'Kiri' | 'Kanan'
      noHpPic: string
      total: number
      porsiKecil: number
      porsiSiswaBesar: number
      guruTendik: number
      isLibur: boolean
    }> = []

    sortedData.forEach((item, idx) => {
      const itemKey = item.id || item.kode || item.identitas_npsn_tmp || String(idx)
      const isLibur = liburIds.includes(itemKey) || (Boolean(item.id) && liburIds.includes(item.id!))

      const saved = distribusiSettings[itemKey]
      const defaultRute: 'Kiri' | 'Kanan' = idx < Math.ceil(sortedData.length / 2) ? 'Kiri' : 'Kanan'
      const rute: 'Kiri' | 'Kanan' = saved?.rute || defaultRute
      const noHpPic = saved?.no_hp_pic !== undefined ? saved.no_hp_pic : (item.hp || item.pimpinan || '-')

      if (ruteFilter !== 'ALL' && rute !== ruteFilter) {
        return
      }

      if (isLibur) {
        holidayNames.push(item.nama)
        processed.push({
          no: processed.length + 1,
          id: itemKey,
          nama: item.nama,
          kode: item.identitas_npsn_tmp || item.kode || item.id || '',
          kategori: item.kategori,
          rute,
          noHpPic,
          total: 0,
          porsiKecil: 0,
          porsiSiswaBesar: 0,
          guruTendik: 0,
          isLibur: true
        })
        return
      }

      active += 1
      const breakdown = calculateKpmPortion(item)
      const t = breakdown.total
      const k = breakdown.porsiKecil
      const tend = breakdown.tendik
      const sb = breakdown.siswaBesar

      grandTotal += t
      grandKecil += k
      grandSiswaBesar += sb
      grandTendik += tend

      processed.push({
        no: processed.length + 1,
        id: itemKey,
        nama: item.nama,
        kode: item.identitas_npsn_tmp || item.kode || item.id || '',
        kategori: item.kategori,
        rute,
        noHpPic,
        total: t,
        porsiKecil: k,
        porsiSiswaBesar: sb,
        guruTendik: tend,
        isLibur: false
      })
    })

    return {
      rows: processed,
      totals: {
        grandTotal,
        grandKecil,
        grandSiswaBesar,
        grandTendik
      },
      holidayKpmNames: holidayNames,
      aktifCount: active
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
        <div>
          {/* 1. KOP SURAT RESMI */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2 mb-2">
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
          <div className="grid grid-cols-4 gap-2 bg-slate-50 border border-slate-200 rounded p-1.5 mb-2 text-[10px]">
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
                {rows.length} Titik ({aktifCount} Aktif, {holidayKpmNames.length} Libur)
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px]">STATUS OPERASIONAL</span>
              <span className="font-bold text-emerald-700">✓ Terverifikasi APPO</span>
            </div>
          </div>

          {/* 3. TABEL KPM (Padding Padat & Pas) */}
          <div className="border border-slate-400 rounded overflow-hidden">
            <table className="w-full border-collapse text-[9.5px]">
              <thead className="bg-[#0e2a5c] text-white font-bold text-[9px] uppercase tracking-wider">
                <tr>
                  <th rowSpan={2} className="border border-slate-600 py-1.5 px-1.5 text-center w-7">NO</th>
                  <th rowSpan={2} className="border border-slate-600 py-1.5 px-2 text-left">PENERIMA MANFAAT / SEKOLAH</th>
                  <th rowSpan={2} className="border border-slate-600 py-1.5 px-1.5 text-center w-14">RUTE</th>
                  <th rowSpan={2} className="border border-slate-600 py-1.5 px-1.5 text-center w-24">KONTAK PIC</th>
                  <th rowSpan={2} className="border border-slate-600 py-1.5 px-1.5 text-right w-16">TOTAL</th>
                  <th colSpan={3} className="border border-slate-600 py-1 px-1 text-center uppercase tracking-wide">PORSI</th>
                </tr>
                <tr className="bg-[#0e2a5c] text-white text-[8.5px]">
                  <th className="border border-slate-600 py-1 px-1.5 text-right w-14 text-amber-300">KECIL</th>
                  <th className="border border-slate-600 py-1 px-1.5 text-right w-14 text-blue-300">SISWA</th>
                  <th className="border border-slate-600 py-1 px-1.5 text-right w-14 text-white">TENDIK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium text-slate-900">
                {rows.length > 0 ? (
                  rows.map((row, idx) => (
                    <tr
                      key={row.id}
                      className={
                        row.isLibur
                          ? 'bg-rose-50 text-slate-400'
                          : idx % 2 === 1
                          ? 'bg-slate-50/70'
                          : 'bg-white'
                      }
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
                      <td className="py-0.5 px-1.5 text-center font-bold border border-slate-300">
                        <span className={`px-1 py-0.2 rounded text-[8px] border ${
                          row.rute === 'Kiri' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {row.rute}
                        </span>
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
                      Belum ada data KPM terdaftar untuk rute ini.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-[#0e2a5c] text-white font-bold text-[9.5px]">
                  <td colSpan={4} className="border border-slate-600 py-1 px-2 text-left tracking-wider">
                    TOTAL KESELURUHAN
                  </td>
                  <td className="border border-slate-600 py-1 px-1.5 text-right font-black">
                    {totals.grandTotal.toLocaleString('id-ID')}
                  </td>
                  <td className="border border-slate-600 py-1 px-1.5 text-right text-amber-300 font-black">
                    {totals.grandKecil.toLocaleString('id-ID')}
                  </td>
                  <td className="border border-slate-600 py-1 px-1.5 text-right text-blue-200 font-black">
                    {totals.grandSiswaBesar.toLocaleString('id-ID')}
                  </td>
                  <td className="border border-slate-600 py-1 px-1.5 text-right text-white font-bold">
                    {totals.grandTendik.toLocaleString('id-ID')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 4. CATATAN LIBUR */}
          {holidayKpmNames.length > 0 && (
            <div className="border border-red-200 bg-red-50/70 text-red-800 text-[9px] p-1.5 rounded mt-1.5 leading-snug">
              <span className="font-bold">
                CATATAN KPM LIBUR HARI INI ({holidayKpmNames.length} LEMBAGA):
              </span>
              <br />
              {holidayKpmNames.join(', ')} libur hari ini, alokasi porsi dialihkan/ditiadakan.
            </div>
          )}
        </div>

        {/* 5. TANDA TANGAN & TTE KEDINASAN */}
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
