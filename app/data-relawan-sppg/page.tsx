"use client"
import React, { useState, useEffect, useMemo, useRef } from 'react'
import { 
  Users, Plus, Download, Upload, Search, Edit3, Trash2, X, Phone, Mail, 
  Building2, ShieldCheck, UserCheck, CheckCircle2, Clock, AlertCircle, Filter, 
  FileSpreadsheet, FileText, Check, AlertTriangle
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { 
  fetchRelawanSppgList, saveRelawanSppg, deleteRelawanSppg, bulkSaveRelawanSppg,
  type RelawanSppg, INITIAL_RELAWAN_DATA 
} from '@/lib/data-helpers'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const DIVISI_OPTIONS = ['Administrasi', 'Dapur', 'Distribusi', 'QC', 'Logistik']
const STATUS_OPTIONS: Array<'Aktif' | 'Cuti' | 'Non-Aktif'> = ['Aktif', 'Cuti', 'Non-Aktif']
const PENDIDIKAN_OPTIONS = ['SMA/SMK', 'D3', 'S1', 'S2', 'Lainnya']

function formatDateIndo(dateStr?: string): string {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
  } catch {
    return dateStr
  }
}

// Clean header name for smart fuzzy matching
function cleanHeader(str: any): string {
  return String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

// Clean text / identity numbers to prevent scientific notation & leading quote issues
function cleanTextStr(val: any): string {
  if (val === null || val === undefined) return ''
  let s = String(val).trim()
  if (s.startsWith("'")) s = s.slice(1)
  if (s.endsWith("'")) s = s.slice(0, -1)
  return s
}

// Smart date parser: handles Excel serial numbers, DD/MM/YYYY, YYYY-MM-DD, etc.
function normalizeDateStr(val: any): string {
  if (val === null || val === undefined || val === '') return ''
  
  // If numeric (Excel serial date number like 44195)
  if (typeof val === 'number' || !isNaN(Number(val))) {
    const num = Number(val)
    if (num > 30000 && num < 60000 && (XLSX as any)?.SSF?.parse_date_code) {
      const dObj = (XLSX as any).SSF.parse_date_code(num)
      if (dObj) {
        const y = dObj.y
        const m = String(dObj.m).padStart(2, '0')
        const d = String(dObj.d).padStart(2, '0')
        return `${y}-${m}-${d}`
      }
    }
  }

  const s = String(val).trim()
  if (!s) return ''

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s

  // DD/MM/YYYY or DD-MM-YYYY
  const dmYMatch = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/)
  if (dmYMatch) {
    const d = String(dmYMatch[1]).padStart(2, '0')
    const m = String(dmYMatch[2]).padStart(2, '0')
    const y = dmYMatch[3]
    return `${y}-${m}-${d}`
  }

  // Fallback JS Date parsing
  try {
    const parsed = new Date(s)
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0]
    }
  } catch {}

  return s
}

interface ImportPreviewItem extends Partial<RelawanSppg> {
  _rowIdx: number
  _isValid: boolean
  _warningMsg?: string
}

export default function DataRelawanSppgPage() {
  const [loading, setLoading] = useState(true)
  const [relawanList, setRelawanList] = useState<RelawanSppg[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [divisiFilter, setDivisiFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  // File Input Ref for Import
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<RelawanSppg | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [formSubmitting, setFormSubmitting] = useState(false)

  // Import Preview Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importPreviewItems, setImportPreviewItems] = useState<ImportPreviewItem[]>([])
  const [importing, setImporting] = useState(false)

  // Form State
  const [formData, setFormData] = useState<Partial<RelawanSppg>>({
    nama_lengkap: '',
    nik: '',
    divisi: 'Dapur',
    email: '',
    tempat_lahir: 'Pasuruan',
    tanggal_lahir: '1995-01-01',
    status: 'Aktif',
    no_hp: '',
    pendidikan_terakhir: 'SMA/SMK',
    mulai_bekerja: new Date().toISOString().split('T')[0],
    alamat: '',
    no_bpjstk: '',
    no_rekening_bni: ''
  })

  // Load Data
  const loadRelawanData = async () => {
    setLoading(true)
    try {
      const data = await fetchRelawanSppgList()
      setRelawanList(data)
    } catch (err) {
      console.error('Error loading relawan data:', err)
      setRelawanList(INITIAL_RELAWAN_DATA)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRelawanData()

    // Realtime Supabase Subscription
    const channel = supabase
      .channel('schema-db-changes-relawan')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'relawan_sppg' },
        () => {
          console.log('Realtime update detected on relawan_sppg')
          loadRelawanData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // 1. Download Template Excel
  const handleDownloadTemplate = () => {
    const templateHeaders = [
      'NO',
      'NAMA LENGKAP',
      'DIVISI',
      'NIK',
      'EMAIL',
      'TEMPAT LAHIR',
      'TANGGAL LAHIR (YYYY-MM-DD)',
      'STATUS',
      'NO HP',
      'PENDIDIKAN TERAKHIR',
      'MULAI BEKERJA (YYYY-MM-DD)',
      'ALAMAT',
      'NO BPJSTK',
      'NO REKENING BNI'
    ]

    const sampleRow = [
      1,
      'Ahmad Sayyidani Khaqiqi, S.Pd.',
      'Administrasi',
      '3514121508960001',
      'sayyidani.kh@sppg-bgn.go.id',
      'Pasuruan',
      '1996-08-15',
      'Aktif',
      '081234567890',
      'S1',
      '2025-01-02',
      'Jl. Raya Kiduldalem No. 45, Wonorejo, Pasuruan',
      '24018892019',
      '0891234567'
    ]

    const wsData = [templateHeaders, sampleRow]
    const ws = XLSX.utils.aoa_to_sheet(wsData)

    // Auto column width
    const colWidths = templateHeaders.map(h => ({ wch: Math.max(h.length + 4, 16) }))
    ws['!cols'] = colWidths

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Template Relawan')
    XLSX.writeFile(wb, 'Template_Data_Relawan_SPPG.xlsx')
  }

  // 2. Export Excel Data Riil
  const handleExportExcel = () => {
    if (filteredList.length === 0) {
      alert('Tidak ada data relawan yang dapat diekspor!')
      return
    }

    const exportHeaders = [
      'NO',
      'NAMA LENGKAP',
      'DIVISI',
      'NIK',
      'EMAIL',
      'TEMPAT LAHIR',
      'TANGGAL LAHIR',
      'STATUS',
      'NO HP',
      'PENDIDIKAN TERAKHIR',
      'MULAI BEKERJA',
      'ALAMAT',
      'NO BPJSTK',
      'NO REKENING BNI'
    ]

    const dataRows = filteredList.map((item, idx) => [
      idx + 1,
      item.nama_lengkap || '',
      item.divisi || 'Dapur',
      item.nik || '',
      item.email || '',
      item.tempat_lahir || '',
      item.tanggal_lahir || '',
      item.status || 'Aktif',
      item.no_hp || '',
      item.pendidikan_terakhir || '',
      item.mulai_bekerja || '',
      item.alamat || '',
      item.no_bpjstk || '',
      item.no_rekening_bni || ''
    ])

    const wsData = [exportHeaders, ...dataRows]
    const ws = XLSX.utils.aoa_to_sheet(wsData)

    const colWidths = exportHeaders.map(h => ({ wch: Math.max(h.length + 4, 16) }))
    ws['!cols'] = colWidths

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Data Relawan')

    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '')
    XLSX.writeFile(wb, `Data_Relawan_SPPG_${dateStr}.xlsx`)
  }

  // 3. Import Excel Cerdas (Smart Column Matcher & Parser)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array', cellDates: false })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false })

        if (!rows || rows.length < 2) {
          alert('File Excel kosong atau tidak memiliki baris data!')
          return
        }

        // Detect Header Row
        let headerRowIdx = 0
        for (let i = 0; i < Math.min(5, rows.length); i++) {
          const rowStr = (rows[i] || []).map(c => cleanHeader(c)).join(' ')
          if (rowStr.includes('nama') || rowStr.includes('nik')) {
            headerRowIdx = i
            break
          }
        }

        const headers = rows[headerRowIdx] || []
        const colMap: Record<number, keyof RelawanSppg> = {}

        headers.forEach((h, idx) => {
          const norm = cleanHeader(h)
          if (norm.includes('nama')) {
            colMap[idx] = 'nama_lengkap'
          } else if (norm.includes('divisi') || norm.includes('bagian') || norm.includes('jabatan') || norm.includes('unit')) {
            colMap[idx] = 'divisi'
          } else if (norm.includes('nik') || norm.includes('ktp')) {
            colMap[idx] = 'nik'
          } else if (norm.includes('email') || norm.includes('mail')) {
            colMap[idx] = 'email'
          } else if (norm.includes('tempatlahir') || norm.includes('tmplahir') || norm.includes('kotalahir')) {
            colMap[idx] = 'tempat_lahir'
          } else if (norm.includes('tanggallahir') || norm.includes('tgllahir') || norm.includes('birthdate')) {
            colMap[idx] = 'tanggal_lahir'
          } else if (norm.includes('status')) {
            colMap[idx] = 'status'
          } else if (norm.includes('hp') || norm.includes('telepon') || norm.includes('wa') || norm.includes('phone')) {
            colMap[idx] = 'no_hp'
          } else if (norm.includes('pendidikan') || norm.includes('lulusan')) {
            colMap[idx] = 'pendidikan_terakhir'
          } else if (norm.includes('mulaibekerja') || norm.includes('tglmasuk') || norm.includes('tglbekerja') || norm.includes('mulai')) {
            colMap[idx] = 'mulai_bekerja'
          } else if (norm.includes('alamat') || norm.includes('domisili')) {
            colMap[idx] = 'alamat'
          } else if (norm.includes('bpjs') || norm.includes('bpjstk')) {
            colMap[idx] = 'no_bpjstk'
          } else if (norm.includes('rekening') || norm.includes('bni') || norm.includes('rek')) {
            colMap[idx] = 'no_rekening_bni'
          }
        })

        // Parse Data Rows
        const parsedItems: ImportPreviewItem[] = []
        for (let i = headerRowIdx + 1; i < rows.length; i++) {
          const row = rows[i]
          if (!row || row.length === 0 || row.every(cell => !cell || String(cell).trim() === '')) {
            continue
          }

          const item: Partial<RelawanSppg> = {
            status: 'Aktif',
            divisi: 'Dapur',
            pendidikan_terakhir: 'SMA/SMK'
          }

          row.forEach((cellVal, colIdx) => {
            const field = colMap[colIdx]
            if (field) {
              if (field === 'tanggal_lahir' || field === 'mulai_bekerja') {
                item[field] = normalizeDateStr(cellVal)
              } else if (field === 'nik' || field === 'no_hp' || field === 'no_bpjstk' || field === 'no_rekening_bni') {
                item[field] = cleanTextStr(cellVal)
              } else if (field === 'status') {
                const s = cleanTextStr(cellVal).toLowerCase()
                if (s.includes('cuti')) item.status = 'Cuti'
                else if (s.includes('non') || s.includes('tidak')) item.status = 'Non-Aktif'
                else item.status = 'Aktif'
              } else if (field === 'divisi') {
                const d = cleanTextStr(cellVal).toLowerCase()
                if (d.includes('admin')) item.divisi = 'Administrasi'
                else if (d.includes('distribusi') || d.includes('kurir')) item.divisi = 'Distribusi'
                else if (d.includes('qc') || d.includes('gizi')) item.divisi = 'QC'
                else if (d.includes('logistik') || d.includes('gudang')) item.divisi = 'Logistik'
                else item.divisi = 'Dapur'
              } else {
                item[field] = cleanTextStr(cellVal) as any
              }
            }
          })

          const hasName = Boolean(item.nama_lengkap && item.nama_lengkap.trim())
          const hasNik = Boolean(item.nik && item.nik.trim())
          const isValid = hasName && hasNik

          let warningMsg = ''
          if (!hasName && !hasNik) warningMsg = 'Nama & NIK Kosong'
          else if (!hasName) warningMsg = 'Nama Lengkap Kosong'
          else if (!hasNik) warningMsg = 'NIK Kosong'

          parsedItems.push({
            ...item,
            _rowIdx: i + 1,
            _isValid: isValid,
            _warningMsg: warningMsg
          })
        }

        if (parsedItems.length === 0) {
          alert('Tidak ditemukan baris data relawan yang dapat diproses dari file Excel!')
          return
        }

        setImportPreviewItems(parsedItems)
        setIsImportModalOpen(true)
      } catch (err: any) {
        alert(`Gagal membaca file Excel: ${err?.message || 'Format tidak valid'}`)
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }
    reader.readAsArrayBuffer(file)
  }

  // Confirm Import & Save to Database
  const handleConfirmImport = async () => {
    const validItems = importPreviewItems.filter(item => item._isValid)
    if (validItems.length === 0) {
      alert('Tidak ada baris data valid untuk disimpan!')
      return
    }

    setImporting(true)
    try {
      const cleanPayload: Partial<RelawanSppg>[] = validItems.map(item => {
        const { _rowIdx, _isValid, _warningMsg, ...rest } = item
        return rest
      })

      await bulkSaveRelawanSppg(cleanPayload)
      await loadRelawanData()
      setIsImportModalOpen(false)
      alert(`Berhasil mengimpor ${validItems.length} data relawan ke database!`)
    } catch (err: any) {
      alert(`Gagal menyimpan data import: ${err?.message || 'Error server'}`)
    } finally {
      setImporting(false)
    }
  }

  // Open Modal for New Entry
  const handleOpenAddModal = () => {
    setEditingItem(null)
    setFormData({
      nama_lengkap: '',
      nik: '',
      divisi: 'Dapur',
      email: '',
      tempat_lahir: 'Pasuruan',
      tanggal_lahir: '1995-01-01',
      status: 'Aktif',
      no_hp: '',
      pendidikan_terakhir: 'SMA/SMK',
      mulai_bekerja: new Date().toISOString().split('T')[0],
      alamat: '',
      no_bpjstk: '',
      no_rekening_bni: ''
    })
    setIsModalOpen(true)
  }

  // Open Modal for Edit
  const handleOpenEditModal = (item: RelawanSppg) => {
    setEditingItem(item)
    setFormData({ ...item })
    setIsModalOpen(true)
  }

  // Submit Save/Update Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nama_lengkap || !formData.nik) {
      alert('Harap isi Nama Lengkap dan NIK!')
      return
    }

    setFormSubmitting(true)
    try {
      const saved = await saveRelawanSppg({
        ...formData,
        id: editingItem ? editingItem.id : undefined
      })

      if (editingItem) {
        setRelawanList(prev => prev.map(r => r.id === saved.id ? saved : r))
      } else {
        setRelawanList(prev => [saved, ...prev])
      }

      setIsModalOpen(false)
    } catch (err: any) {
      alert(`Gagal menyimpan data relawan: ${err?.message || 'Error server'}`)
    } finally {
      setFormSubmitting(false)
    }
  }

  // Delete Action
  const handleDeleteItem = async (id: string) => {
    try {
      await deleteRelawanSppg(id)
      setRelawanList(prev => prev.filter(r => r.id !== id))
      setDeleteConfirmId(null)
    } catch (err: any) {
      alert(`Gagal menghapus data: ${err?.message || 'Error server'}`)
    }
  }

  // Filtered List
  const filteredList = useMemo(() => {
    return relawanList.filter(item => {
      const matchSearch = 
        (item.nama_lengkap || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.nik || '').includes(searchTerm) ||
        (item.divisi || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.no_hp || '').includes(searchTerm) ||
        (item.email || '').toLowerCase().includes(searchTerm.toLowerCase())

      const matchDivisi = divisiFilter === 'ALL' || item.divisi === divisiFilter
      const matchStatus = statusFilter === 'ALL' || item.status === statusFilter

      return matchSearch && matchDivisi && matchStatus
    })
  }, [relawanList, searchTerm, divisiFilter, statusFilter])

  // Statistics
  const stats = useMemo(() => {
    const total = relawanList.length
    const aktif = relawanList.filter(r => r.status === 'Aktif').length
    const cuti = relawanList.filter(r => r.status === 'Cuti').length
    const dapur = relawanList.filter(r => r.divisi === 'Dapur').length
    const distribusi = relawanList.filter(r => r.divisi === 'Distribusi').length
    return { total, aktif, cuti, dapur, distribusi }
  }, [relawanList])

  // Badge Divisi Styling
  const getDivisiBadge = (divisi: string) => {
    switch (divisi) {
      case 'Dapur':
        return 'bg-amber-100 text-amber-900 border-amber-300'
      case 'Distribusi':
        return 'bg-blue-100 text-blue-900 border-blue-300'
      case 'QC':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300'
      case 'Logistik':
        return 'bg-purple-100 text-purple-900 border-purple-300'
      case 'Administrasi':
        return 'bg-indigo-100 text-indigo-900 border-indigo-300'
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300'
    }
  }

  // Badge Status Styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Aktif':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300'
      case 'Cuti':
        return 'bg-amber-50 text-amber-700 border-amber-300'
      default:
        return 'bg-rose-50 text-rose-700 border-rose-300'
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Hidden File Input for Excel Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />

      {/* Header Halaman */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-blue-200">
              SDM & OPERASIONAL BGN
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <Building2 size={13} className="text-blue-600" />
              SPPG Kiduldalem Wonorejo
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Data Relawan SPPG Kiduldalem
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Manajemen data personil, operasional, dan kepesertaan relawan BGN SPPG Pasuruan.
          </p>
        </div>

        {/* 4 Header Toolbar Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 1. Download Template */}
          <button
            onClick={handleDownloadTemplate}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition flex items-center gap-1.5 cursor-pointer"
            title="Unduh File Template .xlsx"
          >
            <Download size={15} className="text-slate-600" />
            <span>Download Template</span>
          </button>

          {/* 2. Import Excel */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Upload Data Relawan (.xlsx / .csv)"
          >
            <Upload size={15} />
            <span>Import Excel</span>
          </button>

          {/* 3. Ekspor Excel */}
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Download Data Relawan Spreadsheet"
          >
            <FileSpreadsheet size={15} />
            <span>Ekspor Excel</span>
          </button>

          {/* 4. + Tambah Relawan */}
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus size={16} />
            <span>+ Tambah Relawan</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Relawan</div>
          <div className="text-2xl font-black text-slate-900 mt-0.5 font-mono">{stats.total}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Personil Terdaftar</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Status Aktif</div>
          <div className="text-2xl font-black text-emerald-700 mt-0.5 font-mono">{stats.aktif}</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Siap Bertugas</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Divisi Dapur</div>
          <div className="text-2xl font-black text-amber-700 mt-0.5 font-mono">{stats.dapur}</div>
          <div className="text-[11px] text-amber-600 mt-0.5">Tim Pengolahan</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Divisi Distribusi</div>
          <div className="text-2xl font-black text-blue-700 mt-0.5 font-mono">{stats.distribusi}</div>
          <div className="text-[11px] text-blue-600 mt-0.5">Kurir & Rute MBG</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Status Cuti</div>
          <div className="text-2xl font-black text-purple-700 mt-0.5 font-mono">{stats.cuti}</div>
          <div className="text-[11px] text-purple-600 mt-0.5">Izin / Non-Aktif</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan Nama, NIK, Divisi, atau No HP..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-600">
            <Filter size={14} className="text-slate-400" />
            <span className="font-semibold text-slate-500 text-[11px]">Divisi:</span>
            <select
              value={divisiFilter}
              onChange={e => setDivisiFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Divisi</option>
              {DIVISI_OPTIONS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-600">
            <span className="font-semibold text-slate-500 text-[11px]">Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table Relawan SPPG (Full Responsive Scrollable Container) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[1200px]">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-3.5 text-center w-12 border-b border-slate-800">NO</th>
                <th className="py-3 px-3.5 border-b border-slate-800 min-w-[180px]">NAMA LENGKAP</th>
                <th className="py-3 px-3.5 border-b border-slate-800 min-w-[120px]">DIVISI</th>
                <th className="py-3 px-3.5 border-b border-slate-800 font-mono">NIK</th>
                <th className="py-3 px-3.5 border-b border-slate-800">EMAIL</th>
                <th className="py-3 px-3.5 border-b border-slate-800">TEMPAT LAHIR</th>
                <th className="py-3 px-3.5 border-b border-slate-800">TANGGAL LAHIR</th>
                <th className="py-3 px-3.5 border-b border-slate-800 text-center">STATUS</th>
                <th className="py-3 px-3.5 border-b border-slate-800">NO HP (WA)</th>
                <th className="py-3 px-3.5 border-b border-slate-800 text-center">PENDIDIKAN</th>
                <th className="py-3 px-3.5 border-b border-slate-800">MULAI BEKERJA</th>
                <th className="py-3 px-3.5 border-b border-slate-800 min-w-[200px]">ALAMAT DOMISILI</th>
                <th className="py-3 px-3.5 border-b border-slate-800 font-mono">NO BPJSTK</th>
                <th className="py-3 px-3.5 border-b border-slate-800 font-mono">REKENING BNI</th>
                <th className="py-3 px-3.5 border-b border-slate-800 text-center w-24">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={15} className="py-12 text-center text-slate-400 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>Memuat data relawan SPPG...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredList.length > 0 ? (
                filteredList.map((item, idx) => {
                  const cleanPhone = (item.no_hp || '').replace(/[^0-9]/g, '')
                  const waUrl = cleanPhone.startsWith('0') 
                    ? `https://wa.me/62${cleanPhone.slice(1)}` 
                    : `https://wa.me/${cleanPhone}`

                  return (
                    <tr key={item.id || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3.5 text-center font-mono text-slate-400 text-[11px] font-bold">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="font-bold text-slate-900 block text-xs">
                          {item.nama_lengkap}
                        </span>
                      </td>
                      <td className="py-3 px-3.5">
                        <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-md border ${getDivisiBadge(item.divisi)}`}>
                          {item.divisi || 'Umum'}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 font-mono text-slate-800 text-[11px]">
                        {item.nik || '-'}
                      </td>
                      <td className="py-3 px-3.5 text-slate-600 text-[11px]">
                        {item.email || '-'}
                      </td>
                      <td className="py-3 px-3.5 text-slate-700">
                        {item.tempat_lahir || '-'}
                      </td>
                      <td className="py-3 px-3.5 text-slate-700 whitespace-nowrap">
                        {formatDateIndo(item.tanggal_lahir)}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-extrabold rounded border ${getStatusBadge(item.status)}`}>
                          {item.status || 'Aktif'}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        {item.no_hp ? (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-700 hover:text-emerald-800 font-bold font-mono text-[11px] flex items-center gap-1 underline underline-offset-2"
                            title="Buka Chat WhatsApp"
                          >
                            <Phone size={12} className="text-emerald-600" />
                            <span>{item.no_hp}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 font-mono">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-center font-bold text-slate-800">
                        {item.pendidikan_terakhir || '-'}
                      </td>
                      <td className="py-3 px-3.5 text-slate-700 whitespace-nowrap">
                        {formatDateIndo(item.mulai_bekerja)}
                      </td>
                      <td className="py-3 px-3.5 text-slate-700 max-w-xs truncate" title={item.alamat}>
                        {item.alamat || '-'}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-slate-800 text-[11px]">
                        {item.no_bpjstk || '-'}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-slate-900 font-bold text-[11px]">
                        {item.no_rekening_bni || '-'}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded transition cursor-pointer"
                            title="Edit Data Relawan"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(item.id)}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition cursor-pointer"
                            title="Hapus Data Relawan"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={15} className="py-12 text-center text-slate-400 font-medium">
                    Tidak ada data relawan yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Preview Import Excel */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="bg-amber-900 text-white p-4 px-6 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-600 text-white rounded-lg">
                  <Upload size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    Pratinjau Import Data Relawan (Smart Parser)
                  </h3>
                  <p className="text-xs text-amber-200">
                    Periksa kelengkapan data sebelum disimpan secara permanen ke database Supabase.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 text-amber-300 hover:text-white rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body Info Stats */}
            <div className="p-4 px-6 bg-amber-50/50 border-b border-amber-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4">
                <span className="font-bold text-slate-700">
                  Total Terdeteksi: <strong className="text-slate-900 font-mono text-sm">{importPreviewItems.length}</strong> Baris
                </span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 size={15} />
                  Valid: <strong className="font-mono text-sm">{importPreviewItems.filter(i => i._isValid).length}</strong>
                </span>
                {importPreviewItems.some(i => !i._isValid) && (
                  <span className="font-bold text-rose-600 flex items-center gap-1">
                    <AlertTriangle size={15} />
                    Peringatan: <strong className="font-mono text-sm">{importPreviewItems.filter(i => !i._isValid).length}</strong>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 italic">
                * Baris dengan status peringatan (tanpa Nama/NIK) akan dilewati secara otomatis.
              </p>
            </div>

            {/* Modal Table Preview */}
            <div className="flex-1 overflow-y-auto p-4 px-6">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-800 text-white text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-2 px-2.5 text-center w-10">NO</th>
                    <th className="py-2 px-2.5">STATUS DATA</th>
                    <th className="py-2 px-2.5">NAMA LENGKAP</th>
                    <th className="py-2 px-2.5 font-mono">NIK</th>
                    <th className="py-2 px-2.5">DIVISI</th>
                    <th className="py-2 px-2.5">NO HP</th>
                    <th className="py-2 px-2.5">TANGGAL LAHIR</th>
                    <th className="py-2 px-2.5">MULAI BEKERJA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {importPreviewItems.map((item, idx) => (
                    <tr key={idx} className={item._isValid ? 'hover:bg-slate-50' : 'bg-rose-50/60'}>
                      <td className="py-2 px-2.5 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-2.5">
                        {item._isValid ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-300 inline-flex items-center gap-1">
                            <Check size={12} /> Valid
                          </span>
                        ) : (
                          <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded border border-rose-300 inline-flex items-center gap-1">
                            <AlertCircle size={12} /> {item._warningMsg}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2.5 font-bold text-slate-900">{item.nama_lengkap || '-'}</td>
                      <td className="py-2 px-2.5 font-mono">{item.nik || '-'}</td>
                      <td className="py-2 px-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getDivisiBadge(item.divisi || '')}`}>
                          {item.divisi || 'Dapur'}
                        </span>
                      </td>
                      <td className="py-2 px-2.5 font-mono">{item.no_hp || '-'}</td>
                      <td className="py-2 px-2.5">{item.tanggal_lahir || '-'}</td>
                      <td className="py-2 px-2.5">{item.mulai_bekerja || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="p-4 px-6 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-white transition cursor-pointer text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={importing || importPreviewItems.filter(i => i._isValid).length === 0}
                onClick={handleConfirmImport}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-lg transition shadow-2xs cursor-pointer text-xs flex items-center gap-1.5"
              >
                {importing && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <span>Konfirmasi & Simpan ke Database ({importPreviewItems.filter(i => i._isValid).length} Baris)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Form Tambah / Edit Data Relawan */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 px-6 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600 text-white rounded-lg">
                  <UserCheck size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    {editingItem ? 'Edit Data Relawan SPPG' : 'Tambah Relawan SPPG Baru'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Lengkapi formulir registrasi personil operasional SPPG Kiduldalem
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSubmitForm} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nama Lengkap */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Nama Lengkap <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nama_lengkap || ''}
                    onChange={e => setFormData({ ...formData, nama_lengkap: e.target.value })}
                    placeholder="Contoh: Ahmad Sayyidani Khaqiqi, S.Pd."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* NIK */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    NIK (16 Digit) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    value={formData.nik || ''}
                    onChange={e => setFormData({ ...formData, nik: e.target.value })}
                    placeholder="Contoh: 3514121508960001"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* Divisi */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Divisi Penugasan</label>
                  <select
                    value={formData.divisi || 'Dapur'}
                    onChange={e => setFormData({ ...formData, divisi: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {DIVISI_OPTIONS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Status Keaktifan</label>
                  <select
                    value={formData.status || 'Aktif'}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Tempat Lahir */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Tempat Lahir</label>
                  <input
                    type="text"
                    value={formData.tempat_lahir || ''}
                    onChange={e => setFormData({ ...formData, tempat_lahir: e.target.value })}
                    placeholder="Contoh: Pasuruan"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* Tanggal Lahir */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={formData.tanggal_lahir || ''}
                    onChange={e => setFormData({ ...formData, tanggal_lahir: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Alamat Email</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Contoh: nama@gmail.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* No HP */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">No HP / WhatsApp</label>
                  <input
                    type="text"
                    value={formData.no_hp || ''}
                    onChange={e => setFormData({ ...formData, no_hp: e.target.value })}
                    placeholder="Contoh: 081234567890"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* Pendidikan Terakhir */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Pendidikan Terakhir</label>
                  <select
                    value={formData.pendidikan_terakhir || 'SMA/SMK'}
                    onChange={e => setFormData({ ...formData, pendidikan_terakhir: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {PENDIDIKAN_OPTIONS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* Mulai Bekerja */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Tanggal Mulai Bekerja</label>
                  <input
                    type="date"
                    value={formData.mulai_bekerja || ''}
                    onChange={e => setFormData({ ...formData, mulai_bekerja: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* BPJSTK */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Nomor BPJSTK</label>
                  <input
                    type="text"
                    value={formData.no_bpjstk || ''}
                    onChange={e => setFormData({ ...formData, no_bpjstk: e.target.value })}
                    placeholder="Contoh: 24018892019"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* Rekening BNI */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Nomor Rekening BNI</label>
                  <input
                    type="text"
                    value={formData.no_rekening_bni || ''}
                    onChange={e => setFormData({ ...formData, no_rekening_bni: e.target.value })}
                    placeholder="Contoh: 0891234567"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Alamat */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">Alamat Domisili Lengkap</label>
                <textarea
                  rows={2}
                  value={formData.alamat || ''}
                  onChange={e => setFormData({ ...formData, alamat: e.target.value })}
                  placeholder="Contoh: Jl. Raya Kiduldalem No. 45, Wonorejo, Pasuruan"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-600 text-white font-bold rounded-lg transition shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  {formSubmitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{editingItem ? 'Simpan Perubahan' : 'Tambah Relawan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Konfirmasi Hapus Data</h3>
              <p className="text-xs text-slate-500 mt-1">
                Apakah Anda yakin ingin menghapus data relawan ini? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition cursor-pointer text-xs"
              >
                Batal
              </button>
              <button
                onClick={() => handleDeleteItem(deleteConfirmId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition shadow-2xs cursor-pointer text-xs"
              >
                Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
