"use client"
import React, { useState, useEffect, useMemo } from 'react'
import { Printer, X, Calendar, Award, Building2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { fetchKelompokPenerimaManfaatList, type KelompokPenerimaManfaat } from '@/lib/data-helpers'

interface LembarDistribusiPrintProps {
  isOpen: boolean
  onClose: () => void
  initialKpmList?: KelompokPenerimaManfaat[]
  selectedDate?: string
}

export default function LembarDistribusiPrint({
  isOpen,
  onClose,
  initialKpmList,
  selectedDate
}: LembarDistribusiPrintProps) {
  const [kpmData, setKpmData] = useState<KelompokPenerimaManfaat[]>([])

  // Current Date formatting
  const todayFormatted = useMemo(() => {
    if (selectedDate) return selectedDate
    const d = new Date()
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
  }, [selectedDate])

  const [displayDate, setDisplayDate] = useState(todayFormatted)

  useEffect(() => {
    setDisplayDate(todayFormatted)
  }, [todayFormatted])

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

  // Split KPM into Education (Sekolah/Lembaga) vs Posyandu 3B
  const { schoolRows, posyanduRows, totals } = useMemo(() => {
    const schools: Array<{
      id: string
      no: number
      nama: string
      kode: string
      porsiKecil: number
      porsiBesarSiswa: number
      porsiBesarTendik: number
      total: number
      keterangan: string
    }> = []

    const posyandus: Array<{
      id: string
      no: number
      nama: string
      balita: number
      bumil: number
      busui: number
      total: number
    }> = []

    let totalPorsiKecilSekolah = 0
    let totalPorsiBesarSiswaSekolah = 0
    let totalPorsiBesarTendikSekolah = 0
    let totalKeseluruhanSekolah = 0

    let totalBalitaPosyandu = 0
    let totalBumilPosyandu = 0
    let totalBusuiPosyandu = 0
    let totalKeseluruhanPosyandu = 0

    kpmData.forEach((item) => {
      const kat = (item.kategori || '').toUpperCase()
      const sub = (item.sub_kategori || '')
      const isPosyandu = kat.includes('POSYANDU') || kat.includes('3B') || kat.includes('KOMUNITAS')

      if (isPosyandu) {
        let balita = 0
        let bumil = 0
        let busui = 0

        if (sub === 'Balita' || sub.toLowerCase().includes('balita')) {
          balita = item.jumlah_penerima || (item.target_pria || 0) + (item.target_wanita || 0) || 100
        } else if (sub === 'Bumil' || sub.toLowerCase().includes('bumil') || sub.toLowerCase().includes('hamil')) {
          bumil = item.jumlah_penerima || (item.target_pria || 0) + (item.target_wanita || 0) || 30
        } else if (sub === 'Busui' || sub.toLowerCase().includes('busui') || sub.toLowerCase().includes('menyusui')) {
          busui = item.jumlah_penerima || (item.target_pria || 0) + (item.target_wanita || 0) || 30
        } else {
          const tot = item.jumlah_penerima || (item.target_pria || 0) + (item.target_wanita || 0) + (item.target_guru || 0) || 100
          balita = Math.round(tot * 0.6)
          bumil = Math.round(tot * 0.2)
          busui = tot - balita - bumil
        }

        const totalPosy = balita + bumil + busui
        posyandus.push({
          id: item.id || item.kode,
          no: posyandus.length + 1,
          nama: item.nama,
          balita,
          bumil,
          busui,
          total: totalPosy
        })

        totalBalitaPosyandu += balita
        totalBumilPosyandu += bumil
        totalBusuiPosyandu += busui
        totalKeseluruhanPosyandu += totalPosy
      } else {
        let porsiKecil = 0
        let porsiBesarSiswa = 0
        const porsiBesarTendik = (item.target_guru || 0) + (item.target_tendik || 0)

        let sd13LakiVal: number | undefined
        let sd13PeremVal: number | undefined
        let sd46LakiVal: number | undefined
        let sd46PeremVal: number | undefined

        if (sub && typeof sub === 'string' && sub.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(sub)
            sd13LakiVal = parsed.sd13Laki
            sd13PeremVal = parsed.sd13Perem
            sd46LakiVal = parsed.sd46Laki
            sd46PeremVal = parsed.sd46Perem
          } catch {}
        }

        const isPaudTkKb = kat.includes('KB') || kat.includes('PAUD') || kat.includes('TK') || kat.includes('RA')
        const isSd = kat.includes('SD') || kat.includes('MI')
        const isSmpSma = kat.includes('SMP') || kat.includes('MTS') || kat.includes('SMA') || kat.includes('SMK') || kat.includes('MA')

        if (isPaudTkKb) {
          porsiKecil = item.jumlah_penerima ? (item.jumlah_penerima - porsiBesarTendik) : ((item.target_pria || 0) + (item.target_wanita || 0))
          porsiBesarSiswa = 0
        } else if (isSd) {
          if (sd13LakiVal !== undefined && sd13PeremVal !== undefined && sd46LakiVal !== undefined && sd46PeremVal !== undefined) {
            porsiKecil = sd13LakiVal + sd13PeremVal
            porsiBesarSiswa = sd46LakiVal + sd46PeremVal
          } else {
            const siswaTotal = (item.target_pria || 0) + (item.target_wanita || 0) || (item.jumlah_penerima - porsiBesarTendik)
            porsiKecil = Math.floor(siswaTotal / 2)
            porsiBesarSiswa = Math.ceil(siswaTotal / 2)
          }
        } else if (isSmpSma) {
          porsiKecil = 0
          porsiBesarSiswa = (item.target_pria || 0) + (item.target_wanita || 0) || (item.jumlah_penerima - porsiBesarTendik)
        } else {
          porsiKecil = 0
          porsiBesarSiswa = (item.target_pria || 0) + (item.target_wanita || 0)
        }

        const totalItem = porsiKecil + porsiBesarSiswa + porsiBesarTendik

        schools.push({
          id: item.id || item.kode,
          no: schools.length + 1,
          nama: item.nama,
          kode: item.identitas_npsn_tmp || item.kode,
          porsiKecil,
          porsiBesarSiswa,
          porsiBesarTendik,
          total: totalItem,
          keterangan: item.status === 'Aktif' ? 'Siap Distribusi' : 'Non-Aktif'
        })

        totalPorsiKecilSekolah += porsiKecil
        totalPorsiBesarSiswaSekolah += porsiBesarSiswa
        totalPorsiBesarTendikSekolah += porsiBesarTendik
        totalKeseluruhanSekolah += totalItem
      }
    })

    const rekapPorsiKecil = totalPorsiKecilSekolah + totalBalitaPosyandu
    const rekapPorsiBesar = totalPorsiBesarSiswaSekolah + totalBumilPosyandu + totalBusuiPosyandu
    const rekapGuruTendik = totalPorsiBesarTendikSekolah
    const grandTotalPorsi = rekapPorsiKecil + rekapPorsiBesar + rekapGuruTendik

    return {
      schoolRows: schools,
      posyanduRows: posyandus,
      totals: {
        sekolahPorsiKecil: totalPorsiKecilSekolah,
        sekolahPorsiBesarSiswa: totalPorsiBesarSiswaSekolah,
        sekolahPorsiBesarTendik: totalPorsiBesarTendikSekolah,
        sekolahTotal: totalKeseluruhanSekolah,
        posyanduBalita: totalBalitaPosyandu,
        posyanduBumil: totalBumilPosyandu,
        posyanduBusui: totalBusuiPosyandu,
        posyanduTotal: totalKeseluruhanPosyandu,
        rekapPorsiKecil,
        rekapPorsiBesar,
        rekapGuruTendik,
        grandTotalPorsi
      }
    }
  }, [kpmData])

  const handleTriggerPrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-start overflow-y-auto p-2 sm:p-6 print:p-0 print:bg-white print:static print:inset-auto">
      
      {/* ─── MODAL TOOLBAR (HIDDEN IN PRINT) ─── */}
      <div className="no-print w-full max-w-7xl bg-slate-900 text-white rounded-t-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-lg border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-600 rounded-lg text-white">
            <Printer size={18} />
          </div>
          <div>
            <h2 className="font-bold text-sm text-white tracking-tight">
              Cetak Lembar Kendali Distribusi BGN
            </h2>
            <p className="text-[11px] text-slate-400">
              Pratinjau Dokumen Resmi Satuan Pelayanan Pemenuhan Gizi (SPPG) Pasuruan
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-xs">
            <Calendar size={14} className="text-slate-400" />
            <input
              type="text"
              value={displayDate}
              onChange={(e) => setDisplayDate(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none w-48 text-xs"
              placeholder="Hari, Tanggal"
            />
          </div>

          <button
            onClick={handleTriggerPrint}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-md"
          >
            <Printer size={15} />
            <span>Print / Cetak Dokumen</span>
          </button>

          <button
            onClick={onClose}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-lg transition cursor-pointer flex items-center gap-1"
          >
            <X size={16} />
            <span>Tutup</span>
          </button>
        </div>
      </div>

      {/* ─── OFFICIAL BGN DISTRIBUTION PRINT DOCUMENT CONTAINER ─── */}
      <div className="w-full max-w-7xl bg-white text-slate-900 rounded-b-xl shadow-2xl p-4 sm:p-8 print:p-2 print:shadow-none print:w-full print:max-w-none print:rounded-none print:m-0">
        
        {/* CSS @media print layout tweaks */}
        <style jsx global>{`
          @media print {
            body {
              background: #ffffff !important;
              color: #000000 !important;
              font-family: Arial, Helvetica, sans-serif !important;
            }
            .no-print {
              display: none !important;
            }
            @page {
              size: A4 landscape;
              margin: 6mm 8mm 6mm 8mm;
            }
            html, body {
              width: 100%;
              height: auto;
              overflow: visible !important;
            }
          }
        `}</style>

        {/* ─── 1. HEADER RESMI SPPG ─── */}
        <div className="border-b-2 border-slate-900 pb-3 mb-4 flex flex-col md:flex-row items-stretch justify-between gap-4">
          
          {/* Header Kiri: Logo & Identitas SPPG */}
          <div className="flex items-center gap-3.5">
            {/* Logo BGN / Emblem */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 bg-slate-900 text-amber-400 rounded-xl p-2 flex flex-col items-center justify-center text-center shadow-xs border border-slate-800">
              <span className="font-extrabold text-[10px] tracking-tighter text-white">SPPG</span>
              <Award size={22} className="text-amber-400 my-0.5" />
              <span className="font-bold text-[8px] text-amber-300 uppercase tracking-widest">PASURUAN</span>
            </div>

            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight leading-tight">
                BADAN GIZI NASIONAL
              </h1>
              <h2 className="text-xs sm:text-sm font-extrabold text-blue-900 uppercase tracking-wide">
                SATUAN PELAYANAN PEMENUHAN GIZI (SPPG)
              </h2>
              <p className="text-[11px] font-bold text-slate-800">
                YAYASAN AINUL YAKIN AL KASITOLAH
              </p>
              <p className="text-[10px] text-slate-600 font-medium leading-snug">
                Jl. Rahayu No. 6 RT.001 RW.008 Kiduldalem, Wonorejo, Pasuruan
              </p>
            </div>
          </div>

          {/* Header Kanan: Kotak Hari/Tanggal & Total Keseluruhan Porsi */}
          <div className="flex items-center gap-3 self-end md:self-auto">
            {/* Box Hari / Tanggal */}
            <div className="border-2 border-slate-800 rounded-lg p-2 bg-slate-50 min-w-[170px] text-center">
              <span className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">
                HARI / TANGGAL
              </span>
              <span className="block font-bold text-xs text-slate-900 pt-0.5 font-mono">
                {displayDate}
              </span>
            </div>

            {/* Box Total Keseluruhan Porsi */}
            <div className="border-2 border-blue-950 rounded-lg p-2 bg-blue-950 text-white min-w-[180px] text-center shadow-xs">
              <span className="block text-[9px] font-extrabold text-amber-400 uppercase tracking-widest">
                TOTAL KESELURUHAN
              </span>
              <span className="block font-black text-lg text-white font-mono leading-none pt-1">
                {totals.grandTotalPorsi.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-300">Porsi</span>
              </span>
            </div>
          </div>
        </div>

        {/* TITLE DOKUMEN */}
        <div className="text-center mb-3">
          <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wide underline decoration-2 underline-offset-4">
            LEMBAR KENDALI DISTRIBUSI OPERASIONAL HARIAN
          </h2>
        </div>

        {/* ─── 2. LAYOUT 2 KOLOM (GRID) ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

          {/* ─── KOLOM KIRI (7/12): TABEL DISTRIBUSI UTAMA (SEKOLAH) ─── */}
          <div className="lg:col-span-7 space-y-2">
            <div className="flex items-center justify-between bg-blue-950 text-white px-3 py-1.5 rounded-t-md">
              <h3 className="font-extrabold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <Building2 size={13} className="text-amber-400" />
                <span>A. DISTRIBUSI UTAMA (JALUR PENDIDIKAN / SEKOLAH)</span>
              </h3>
              <span className="text-[10px] font-mono font-semibold text-slate-300">
                {schoolRows.length} Lembaga
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-slate-800 text-[10px]">
                <thead>
                  <tr className="bg-blue-950 text-white font-bold uppercase text-[9px] tracking-wider divide-x divide-blue-900">
                    <th className="py-2 px-1.5 text-center w-6 border border-slate-800" rowSpan={2}>NO</th>
                    <th className="py-2 px-2 min-w-[140px] border border-slate-800" rowSpan={2}>PENERIMA MANFAAT / SEKOLAH</th>
                    <th className="py-2 px-1.5 text-right w-12 border border-slate-800" rowSpan={2}>TOTAL</th>
                    <th className="py-2 px-1.5 text-right w-14 border border-slate-800" rowSpan={2}>PORSI KECIL</th>
                    <th className="py-1 px-1.5 text-center border border-slate-800" colSpan={2}>
                      PORSI BESAR
                    </th>
                    <th className="py-2 px-1.5 text-center w-12 border border-slate-800" rowSpan={2}>BERANGKAT</th>
                    <th className="py-2 px-2 min-w-[80px] border border-slate-800" rowSpan={2}>KETERANGAN</th>
                  </tr>
                  <tr className="bg-blue-900 text-white font-bold uppercase text-[8px] tracking-wider text-center divide-x divide-blue-800">
                    <th className="py-1 px-1 w-12 border border-slate-800">SISWA</th>
                    <th className="py-1 px-1 w-12 border border-slate-800">TENDIK</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 font-medium text-slate-900">
                  {schoolRows.length > 0 ? (
                    schoolRows.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50 transition">
                        <td className="py-1.5 px-1.5 text-center font-bold text-slate-700 border border-slate-300">
                          {row.no}
                        </td>
                        <td className="py-1.5 px-2 font-bold border border-slate-300">
                          <span className="block text-slate-900">{row.nama}</span>
                          <span className="block text-[8px] font-mono text-slate-500 font-normal">[{row.kode}]</span>
                        </td>
                        <td className="py-1.5 px-1.5 text-right font-mono font-bold text-slate-900 border border-slate-300">
                          {row.total}
                        </td>
                        <td className="py-1.5 px-1.5 text-right font-mono text-slate-700 border border-slate-300 bg-slate-50/50">
                          {row.porsiKecil > 0 ? row.porsiKecil : '-'}
                        </td>
                        <td className="py-1.5 px-1.5 text-right font-mono text-slate-700 border border-slate-300">
                          {row.porsiBesarSiswa > 0 ? row.porsiBesarSiswa : '-'}
                        </td>
                        <td className="py-1.5 px-1.5 text-right font-mono text-slate-700 border border-slate-300 bg-slate-50/50">
                          {row.porsiBesarTendik > 0 ? row.porsiBesarTendik : '-'}
                        </td>
                        <td className="py-1.5 px-1.5 text-center border border-slate-300">
                          <div className="w-4 h-4 border border-slate-600 rounded-xs mx-auto bg-white" />
                        </td>
                        <td className="py-1.5 px-2 text-[9px] text-slate-600 border border-slate-300">
                          {row.keterangan}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-4 text-center text-slate-400 italic">
                        Belum ada data KPM sekolah.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-black text-slate-900 text-[10px] border-t-2 border-slate-900">
                    <td colSpan={2} className="py-2 px-2 text-right border border-slate-800">
                      TOTAL AKUMULASI SEKOLAH:
                    </td>
                    <td className="py-2 px-1.5 text-right font-mono border border-slate-800 text-blue-900">
                      {totals.sekolahTotal}
                    </td>
                    <td className="py-2 px-1.5 text-right font-mono border border-slate-800">
                      {totals.sekolahPorsiKecil}
                    </td>
                    <td className="py-2 px-1.5 text-right font-mono border border-slate-800">
                      {totals.sekolahPorsiBesarSiswa}
                    </td>
                    <td className="py-2 px-1.5 text-right font-mono border border-slate-800">
                      {totals.sekolahPorsiBesarTendik}
                    </td>
                    <td colSpan={2} className="border border-slate-800"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* ─── KOLOM KANAN (5/12): POSYANDU 3B + REKAP + CATATAN + TTD ─── */}
          <div className="lg:col-span-5 space-y-4">

            {/* TABEL POSYANDU 3B */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between bg-blue-950 text-white px-3 py-1.5 rounded-t-md">
                <h3 className="font-extrabold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <Award size={13} className="text-amber-400" />
                  <span>B. RINCIAN SASARAN POSYANDU 3B</span>
                </h3>
                <span className="text-[10px] font-mono font-semibold text-slate-300">
                  {posyanduRows.length} Posyandu
                </span>
              </div>

              <table className="w-full text-left border-collapse border border-slate-800 text-[10px]">
                <thead>
                  <tr className="bg-blue-950 text-white font-bold uppercase text-[9px] tracking-wider text-center divide-x divide-blue-900">
                    <th className="py-1.5 px-1.5 w-6 border border-slate-800">NO</th>
                    <th className="py-1.5 px-2 text-left border border-slate-800">NAMA POSYANDU</th>
                    <th className="py-1.5 px-1.5 w-12 border border-slate-800">BALITA</th>
                    <th className="py-1.5 px-1.5 w-12 border border-slate-800">BUMIL</th>
                    <th className="py-1.5 px-1.5 w-12 border border-slate-800">BUSUI</th>
                    <th className="py-1.5 px-1.5 w-14 border border-slate-800 text-right">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 font-medium text-slate-900">
                  {posyanduRows.length > 0 ? (
                    posyanduRows.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50">
                        <td className="py-1.5 px-1.5 text-center font-bold text-slate-700 border border-slate-300">
                          {row.no}
                        </td>
                        <td className="py-1.5 px-2 font-bold border border-slate-300">
                          {row.nama}
                        </td>
                        <td className="py-1.5 px-1.5 text-center font-mono border border-slate-300">
                          {row.balita}
                        </td>
                        <td className="py-1.5 px-1.5 text-center font-mono border border-slate-300">
                          {row.bumil}
                        </td>
                        <td className="py-1.5 px-1.5 text-center font-mono border border-slate-300">
                          {row.busui}
                        </td>
                        <td className="py-1.5 px-1.5 text-right font-mono font-bold text-blue-950 border border-slate-300">
                          {row.total}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-3 text-center text-slate-400 italic">
                        Belum ada data KPM Posyandu 3B.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-black text-slate-900 text-[10px] border-t-2 border-slate-900">
                    <td colSpan={2} className="py-1.5 px-2 text-right border border-slate-800">
                      TOTAL POSYANDU 3B:
                    </td>
                    <td className="py-1.5 px-1.5 text-center font-mono border border-slate-800">
                      {totals.posyanduBalita}
                    </td>
                    <td className="py-1.5 px-1.5 text-center font-mono border border-slate-800">
                      {totals.posyanduBumil}
                    </td>
                    <td className="py-1.5 px-1.5 text-center font-mono border border-slate-800">
                      {totals.posyanduBusui}
                    </td>
                    <td className="py-1.5 px-1.5 text-right font-mono border border-slate-800 text-blue-950">
                      {totals.posyanduTotal}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* TABEL TENGAH: BOX REKAP PORSI */}
            <div className="border-2 border-slate-900 rounded-md overflow-hidden bg-white shadow-xs">
              <div className="bg-blue-950 text-white px-3 py-1 text-center font-black text-[11px] uppercase tracking-wider border-b border-slate-900">
                REKAP PORSI DISTRIBUSI TOTAL
              </div>
              <div className="grid grid-cols-3 divide-x-2 divide-slate-900 text-center">
                
                {/* Stat 1: Porsi Kecil */}
                <div className="p-2 bg-slate-50">
                  <span className="block text-[9px] font-extrabold text-slate-600 uppercase">
                    PORSI KECIL
                  </span>
                  <span className="block text-[8px] text-slate-500 font-medium">
                    (Balita, PAUD/TK, SD 1-3)
                  </span>
                  <span className="block text-base sm:text-lg font-black text-slate-900 font-mono mt-1">
                    {totals.rekapPorsiKecil.toLocaleString('id-ID')}
                  </span>
                </div>

                {/* Stat 2: Porsi Besar */}
                <div className="p-2 bg-slate-50">
                  <span className="block text-[9px] font-extrabold text-slate-600 uppercase">
                    PORSI BESAR
                  </span>
                  <span className="block text-[8px] text-slate-500 font-medium">
                    (SD 4-6, SMP, Bumil/Busui)
                  </span>
                  <span className="block text-base sm:text-lg font-black text-slate-900 font-mono mt-1">
                    {totals.rekapPorsiBesar.toLocaleString('id-ID')}
                  </span>
                </div>

                {/* Stat 3: Guru / Tendik / Kader */}
                <div className="p-2 bg-slate-50">
                  <span className="block text-[9px] font-extrabold text-slate-600 uppercase">
                    GURU / TENDIK
                  </span>
                  <span className="block text-[8px] text-slate-500 font-medium">
                    (Tenaga Pendidik & Kader)
                  </span>
                  <span className="block text-base sm:text-lg font-black text-slate-900 font-mono mt-1">
                    {totals.rekapGuruTendik.toLocaleString('id-ID')}
                  </span>
                </div>

              </div>
            </div>

            {/* KOTAK CATATAN OPERASIONAL */}
            <div className="border border-slate-800 rounded-md p-2.5 bg-slate-50 text-[9.5px] leading-relaxed text-slate-800 space-y-1">
              <h4 className="font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-0.5">
                CATATAN OPERASIONAL:
              </h4>
              <ul className="list-disc pl-4 space-y-0.5 font-semibold">
                <li>PASTIKAN JUMLAH PORSI SESUAI DENGAN DATA TARGET KPM.</li>
                <li>KOORDINASIKAN DENGAN BAIK ANTARA ASLAP DAN PENGAWAS KEUANGAN (PK).</li>
                <li>BERI TANDA CENTANG {`{V}`} PADA KOLOM BERANGKAT SAAT MAKANAN DIANGKUT.</li>
                <li>SEGERA SAMPAIKAN JIKA ADA KENDALA DI LAPANGAN KEPADA PK.</li>
              </ul>
            </div>

            {/* KOTAK TANDA TANGAN (SIGNATURES) */}
            <div className="space-y-3 pt-1">
              {/* Asisten Lapangan Signature Box */}
              <div className="border border-slate-800 rounded-md p-2 text-center bg-white">
                <span className="block text-[9px] font-extrabold text-slate-800 uppercase tracking-wide">
                  ASISTEN LAPANGAN (ASLAP)
                </span>
                <div className="h-10 my-1 flex items-end justify-center">
                  <span className="text-[10px] text-slate-400 italic">( Tanda Tangan & Nama Terang )</span>
                </div>
                <span className="block text-[10px] font-bold text-slate-900 font-mono">
                  ( ................................................................ )
                </span>
              </div>

              {/* Driver & Helper Signatures */}
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="border border-slate-800 rounded-md p-1.5 bg-white">
                  <span className="block text-[8.5px] font-extrabold text-slate-800 uppercase">
                    DRIVER / HELPER 1
                  </span>
                  <div className="h-8 my-1 flex items-end justify-center">
                    <span className="text-[9px] text-slate-400 italic">TTD</span>
                  </div>
                  <span className="block text-[9px] font-bold text-slate-900 font-mono">
                    ( .................................... )
                  </span>
                </div>

                <div className="border border-slate-800 rounded-md p-1.5 bg-white">
                  <span className="block text-[8.5px] font-extrabold text-slate-800 uppercase">
                    DRIVER / HELPER 2
                  </span>
                  <div className="h-8 my-1 flex items-end justify-center">
                    <span className="text-[9px] text-slate-400 italic">TTD</span>
                  </div>
                  <span className="block text-[9px] font-bold text-slate-900 font-mono">
                    ( .................................... )
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  )
}
