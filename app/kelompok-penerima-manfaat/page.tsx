"use client"
import React, { useState, useEffect, useMemo } from 'react'
import { 
  Search, RotateCw, Plus, X, Check, Building2, Info, Eye, Edit, Trash2, 
  Bookmark, FileSpreadsheet, FileText, Printer, ChevronLeft, 
  ChevronRight, UserPlus, ShieldAlert, HeartHandshake, FileDown, Upload,
  ChevronUp, ChevronDown
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase'
import { 
  fetchKelompokPenerimaManfaatList, 
  saveKelompokPenerimaManfaat, 
  deleteKelompokPenerimaManfaat,
  fetchBnbaList,
  saveBnbaItem,
  saveBnbaBulk,
  deleteBnbaItem,
  type KelompokPenerimaManfaat,
  type PenerimaManfaatBnba
} from '@/lib/data-helpers'
import LembarDistribusiPrint from '@/components/LembarDistribusiPrint'

export interface DetailKpmItem {
  id: string
  no: number
  urutan?: number
  jenis: string
  nama: string
  npsnReg: string
  kepemilikan: 'Negeri' | 'Swasta'
  kecamatan: string
  kelDesa: string
  alamat: string
  pria: number
  wanita: number
  guru: number
  tendik: number
  totalTarget: number
  rincianTerisi: number
  keteranganStatus: 'Belum ada detail' | 'Kurang' | 'Sesuai' | 'Lebih'
  keteranganMsg: string
  pimpinan: string
  hp: string
  email: string
  status: 'Aktif' | 'Non-Aktif'
  sd13Laki?: number
  sd13Perem?: number
  sd46Laki?: number
  sd46Perem?: number
  subKategoriRaw?: string
}

export default function KelompokPenerimaManfaatPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isRealtimeActive, setIsRealtimeActive] = useState(false)
  const [perPage, setPerPage] = useState(15)
  const [loading, setLoading] = useState(true)
  const [showAlert, setShowAlert] = useState(true)
  const [activeFilter, setActiveFilter] = useState<'Semua' | 'Belum ada detail' | 'Kurang' | 'Sesuai' | 'Lebih'>('Semua')
  const [showPrintModal, setShowPrintModal] = useState(false)

  // Toast Notification
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  // Pure Dynamic Supabase State
  const [kpmItems, setKpmItems] = useState<DetailKpmItem[]>([])
  const [allBnbaRecords, setAllBnbaRecords] = useState<PenerimaManfaatBnba[]>([])

  // Modal Form States
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState<DetailKpmItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Common Form Fields
  const [formNama, setFormNama] = useState('')
  const [formKategori, setFormKategori] = useState('SD')
  const [formSubKategori, setFormSubKategori] = useState('Balita')
  const [formIdentitas, setFormIdentitas] = useState('')
  const [formKepemilikan, setFormKepemilikan] = useState<'Negeri' | 'Swasta'>('Negeri')
  const [formKecamatan, setFormKecamatan] = useState('WONOREJO')
  const [formKelDesa, setFormKelDesa] = useState('WONOREJO')
  const [formAlamat, setFormAlamat] = useState('Wonorejo Pasuruan')
  const [formPimpinan, setFormPimpinan] = useState('')
  const [formHp, setFormHp] = useState('')
  const [formEmail, setFormEmail] = useState('')

  // 1. Standard School Allocation Form Fields
  const [formPria, setFormPria] = useState(100)
  const [formWanita, setFormWanita] = useState(100)
  const [formGuru, setFormGuru] = useState(10)
  const [formTendik, setFormTendik] = useState(5)

  // 2. SD / MI Specific Allocation Fields (Classes 1-3 vs 4-6)
  const [formSdSiswaLaki13, setFormSdSiswaLaki13] = useState(50)
  const [formSdSiswaPerem13, setFormSdSiswaPerem13] = useState(50)
  const [formSdSiswaLaki46, setFormSdSiswaLaki46] = useState(50)
  const [formSdSiswaPerem46, setFormSdSiswaPerem46] = useState(50)

  // 3. Posyandu 3B Allocation Form Fields
  const [formBalitaLaki, setFormBalitaLaki] = useState(30)
  const [formBalitaPerem, setFormBalitaPerem] = useState(30)
  const [formBumil, setFormBumil] = useState(15)
  const [formBusui, setFormBusui] = useState(15)
  const [formKaderPosyandu, setFormKaderPosyandu] = useState(5)

  // Delete Confirmation State
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<DetailKpmItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // BNBA Drawer Modal States
  const [activeBnbaGroup, setActiveBnbaGroup] = useState<DetailKpmItem | null>(null)
  const [bnbaList, setBnbaList] = useState<PenerimaManfaatBnba[]>([])
  const [bnbaSearch, setBnbaSearch] = useState('')
  const [showAddBnbaModal, setShowAddBnbaModal] = useState(false)
  const [editingBnbaItem, setEditingBnbaItem] = useState<PenerimaManfaatBnba | null>(null)
  const [savingBnba, setSavingBnba] = useState(false)

  // BNBA Multi-Select & Bulk Delete States
  const [selectedBnbaIds, setSelectedBnbaIds] = useState<string[]>([])
  const [showBulkDeleteConfirmModal, setShowBulkDeleteConfirmModal] = useState(false)
  const [bulkDeleteType, setBulkDeleteType] = useState<'selected' | 'all' | null>(null)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  // BNBA Excel Import States
  const [importPreviewData, setImportPreviewData] = useState<PenerimaManfaatBnba[]>([])
  const [showImportConfirmModal, setShowImportConfirmModal] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  // BNBA Form Fields
  const [bnbaNisnNik, setBnbaNisnNik] = useState('')
  const [bnbaNama, setBnbaNama] = useState('')
  const [bnbaTglLahir, setBnbaTglLahir] = useState('15-05-2015')
  const [bnbaJk, setBnbaJk] = useState<'L' | 'P'>('L')
  const [bnbaOrtu, setBnbaOrtu] = useState('')
  const [bnbaPosisi, setBnbaPosisi] = useState<'Siswa' | 'Tendik' | 'Balita' | 'Bumil' | 'Busui'>('Siswa')
  const [bnbaKelas, setBnbaKelas] = useState('Kelas 4')

  // Helper check for Posyandu 3B Category
  const isPosyanduCategory = useMemo(() => {
    const k = (formKategori || '').toUpperCase()
    return k.includes('POSYANDU') || k.includes('3B') || k.includes('KOMUNITAS')
  }, [formKategori])

  // Helper check for SD / MI Category
  const isSdCategory = useMemo(() => {
    const k = (formKategori || '').toUpperCase()
    return k === 'SD' || k === 'MI' || k.includes('SD') || k.includes('MI')
  }, [formKategori])

  // Calculated target total based on category selection
  const calculatedTotalTarget = useMemo(() => {
    if (isPosyanduCategory) {
      return (Number(formBalitaLaki) || 0) + 
             (Number(formBalitaPerem) || 0) + 
             (Number(formBumil) || 0) + 
             (Number(formBusui) || 0) + 
             (Number(formKaderPosyandu) || 0)
    }
    if (isSdCategory) {
      return (Number(formSdSiswaLaki13) || 0) +
             (Number(formSdSiswaPerem13) || 0) +
             (Number(formSdSiswaLaki46) || 0) +
             (Number(formSdSiswaPerem46) || 0) +
             (Number(formGuru) || 0) +
             (Number(formTendik) || 0)
    }
    return (Number(formPria) || 0) + 
           (Number(formWanita) || 0) + 
           (Number(formGuru) || 0) + 
           (Number(formTendik) || 0)
  }, [isPosyanduCategory, isSdCategory, formBalitaLaki, formBalitaPerem, formBumil, formBusui, formKaderPosyandu, formSdSiswaLaki13, formSdSiswaPerem13, formSdSiswaLaki46, formSdSiswaPerem46, formPria, formWanita, formGuru, formTendik])

  // Portion sizing calculation for operational standards
  const portionSummary = useMemo(() => {
    if (isPosyanduCategory) {
      const kecil = (Number(formBalitaLaki) || 0) + (Number(formBalitaPerem) || 0)
      const besar = (Number(formBumil) || 0) + (Number(formBusui) || 0) + (Number(formKaderPosyandu) || 0)
      return { kecil, besar, label: `Porsi Kecil: ${kecil} porsi (Balita) | Porsi Besar: ${besar} porsi (Bumil, Busui, Kader)` }
    }
    if (isSdCategory) {
      const kecil = (Number(formSdSiswaLaki13) || 0) + (Number(formSdSiswaPerem13) || 0)
      const besar = (Number(formSdSiswaLaki46) || 0) + (Number(formSdSiswaPerem46) || 0) + (Number(formGuru) || 0) + (Number(formTendik) || 0)
      return { kecil, besar, label: `Porsi Kecil: ${kecil} porsi (Kelas 1-3) | Porsi Besar: ${besar} porsi (Kelas 4-6 + Guru/Tendik)` }
    }
    const k = (formKategori || '').toUpperCase()
    const isPaudTk = k.includes('KB') || k.includes('PAUD') || k.includes('TK') || k.includes('RA')
    if (isPaudTk) {
      const kecil = (Number(formPria) || 0) + (Number(formWanita) || 0)
      const besar = (Number(formGuru) || 0) + (Number(formTendik) || 0)
      return { kecil, besar, label: `Porsi Kecil: ${kecil} porsi (Siswa PAUD/TK) | Porsi Besar: ${besar} porsi (Guru/Tendik)` }
    } else {
      const besar = (Number(formPria) || 0) + (Number(formWanita) || 0) + (Number(formGuru) || 0) + (Number(formTendik) || 0)
      return { kecil: 0, besar, label: `Porsi Kecil: 0 porsi | Porsi Besar: ${besar} porsi (Siswa + Guru/Tendik)` }
    }
  }, [isPosyanduCategory, isSdCategory, formKategori, formBalitaLaki, formBalitaPerem, formBumil, formBusui, formKaderPosyandu, formSdSiswaLaki13, formSdSiswaPerem13, formSdSiswaLaki46, formSdSiswaPerem46, formPria, formWanita, formGuru, formTendik])

  // Load Data Purely from Supabase Database
  const loadData = async () => {
    setLoading(true)
    try {
      const [supabaseRes, bnbaRes] = await Promise.all([
        supabase.from('kelompok_penerima_manfaat').select('*').order('urutan', { ascending: true }),
        fetchBnbaList()
      ])

      let data = supabaseRes.data
      if (!data || data.length === 0) {
        data = await fetchKelompokPenerimaManfaatList()
      }

      setAllBnbaRecords(bnbaRes || [])

      // Map Supabase rows to DetailKpmItem format
      const mappedItems: DetailKpmItem[] = (data || []).map((kpm: any, idx: number) => {
        const is3B = kpm.kategori === 'POSYANDU_3B' || kpm.kategori === 'POSYANDU 3B' || kpm.kategori === 'POSYANDU' || kpm.kategori === '3B (balita,busui,bumil)'
        let jenisLabel = kpm.kategori
        if (is3B) {
          jenisLabel = kpm.sub_kategori === 'Bumil' 
            ? 'Ibu Hamil' 
            : kpm.sub_kategori === 'Busui' 
            ? 'Ibu Menyusui' 
            : '3B (balita,busui,bumil)'
        } else if (kpm.kategori === 'SMP' || kpm.kategori === 'SMP/MTS' || kpm.kategori === 'SMP_MTS' || kpm.kategori === 'SMP / MTs') {
          jenisLabel = 'SMP / MTs'
        }

        const bnbaCount = (bnbaRes || []).filter(b => b.kelompok_id === kpm.kode || b.kelompok_id === kpm.id).length
        const totalTarget = kpm.jumlah_penerima || (kpm.target_pria || 0) + (kpm.target_wanita || 0) + (kpm.target_guru || 0) + (kpm.target_tendik || 0) || 100

        let ketStatus: 'Belum ada detail' | 'Kurang' | 'Sesuai' | 'Lebih' = 'Sesuai'
        let ketMsg = '✓ Sesuai'

        if (bnbaCount === 0) {
          ketStatus = 'Belum ada detail'
          ketMsg = '⚠️ Belum ada detail'
        } else if (bnbaCount < totalTarget) {
          ketStatus = 'Kurang'
          ketMsg = `↓ Kurang ${totalTarget - bnbaCount} orang`
        } else if (bnbaCount > totalTarget) {
          ketStatus = 'Lebih'
          ketMsg = `↑ Lebih ${bnbaCount - totalTarget} orang`
        }

        let sd13LakiVal: number | undefined = undefined
        let sd13PeremVal: number | undefined = undefined
        let sd46LakiVal: number | undefined = undefined
        let sd46PeremVal: number | undefined = undefined

        if (kpm.sub_kategori && typeof kpm.sub_kategori === 'string' && kpm.sub_kategori.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(kpm.sub_kategori)
            sd13LakiVal = parsed.sd13Laki
            sd13PeremVal = parsed.sd13Perem
            sd46LakiVal = parsed.sd46Laki
            sd46PeremVal = parsed.sd46Perem
          } catch {}
        }

        return {
          id: kpm.id || kpm.kode || `kpm-${idx + 1}`,
          no: idx + 1,
          urutan: kpm.urutan ?? (idx + 1),
          jenis: jenisLabel,
          nama: kpm.nama,
          npsnReg: kpm.identitas_npsn_tmp || kpm.kode,
          kepemilikan: (kpm.kepemilikan as 'Negeri' | 'Swasta') || 'Negeri',
          kecamatan: kpm.kecamatan || 'WONOREJO',
          kelDesa: kpm.kel_desa || 'WONOREJO',
          alamat: kpm.alamat || kpm.wilayah || 'Wonorejo Pasuruan',
          pria: kpm.target_pria || Math.floor(totalTarget / 2),
          wanita: kpm.target_wanita || Math.ceil(totalTarget / 2),
          guru: kpm.target_guru || 0,
          tendik: kpm.target_tendik || 0,
          totalTarget,
          rincianTerisi: bnbaCount,
          keteranganStatus: ketStatus,
          keteranganMsg: ketMsg,
          pimpinan: kpm.pimpinan || '-',
          hp: kpm.hp || '-',
          email: kpm.email || '-',
          status: (kpm.status as 'Aktif' | 'Non-Aktif') || 'Aktif',
          sd13Laki: sd13LakiVal,
          sd13Perem: sd13PeremVal,
          sd46Laki: sd46LakiVal,
          sd46Perem: sd46PeremVal,
          subKategoriRaw: kpm.sub_kategori
        }
      })

      setKpmItems(mappedItems)
    } catch (err) {
      console.error('Error fetching Supabase KPM data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()

    // Supabase Realtime Subscription Channel for Instant Sync across Local & Vercel
    const channel = supabase
      .channel('schema-db-changes-kpm')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'kelompok_penerima_manfaat' },
        () => {
          console.log('Realtime change detected in kelompok_penerima_manfaat, re-fetching KPM list...')
          loadData()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'penerima_manfaat_bnba' },
        () => {
          console.log('Realtime change detected in penerima_manfaat_bnba, re-fetching KPM list...')
          loadData()
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsRealtimeActive(true)
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsRealtimeActive(false)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const triggerToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3500)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await loadData()
    } finally {
      setTimeout(() => {
        setIsRefreshing(false)
      }, 400)
    }
  }

  // Real-time calculated dataset based purely on state & BNBA store
  const fullDataList: DetailKpmItem[] = useMemo(() => {
    return kpmItems.map((item, idx) => {
      const bnbaCount = allBnbaRecords.filter(b => b.kelompok_id === item.id || b.kelompok_id === item.npsnReg).length
      const rincianVal = bnbaCount > 0 ? bnbaCount : item.rincianTerisi

      let ketStatus = item.keteranganStatus
      let ketMsg = item.keteranganMsg

      if (rincianVal === 0) {
        ketStatus = 'Belum ada detail'
        ketMsg = '⚠️ Belum ada detail'
      } else if (rincianVal < item.totalTarget) {
        ketStatus = 'Kurang'
        ketMsg = `↓ Kurang ${item.totalTarget - rincianVal} orang`
      } else if (rincianVal === item.totalTarget) {
        ketStatus = 'Sesuai'
        ketMsg = '✓ Sesuai'
      } else {
        ketStatus = 'Lebih'
        ketMsg = `↑ Lebih ${rincianVal - item.totalTarget} orang`
      }

      return {
        ...item,
        no: idx + 1,
        rincianTerisi: rincianVal,
        keteranganStatus: ketStatus,
        keteranganMsg: ketMsg
      }
    })
  }, [kpmItems, allBnbaRecords])

  // Aggregate KPI Calculations
  const stats = useMemo(() => {
    const totalAktif = fullDataList.filter(i => i.status === 'Aktif').length
    const totalTarget = fullDataList.filter(i => i.status === 'Aktif').reduce((acc, curr) => acc + curr.totalTarget, 0)
    const totalRincian = fullDataList.filter(i => i.status === 'Aktif').reduce((acc, curr) => acc + curr.rincianTerisi, 0)
    const totalBelumDetail = fullDataList.filter(i => i.status === 'Aktif' && (i.keteranganStatus === 'Belum ada detail' || i.rincianTerisi < i.totalTarget)).length
    const totalKurang = fullDataList.filter(i => i.status === 'Aktif' && i.keteranganStatus === 'Kurang').length
    const totalSesuai = fullDataList.filter(i => i.status === 'Aktif' && i.keteranganStatus === 'Sesuai').length
    const totalLebih = fullDataList.filter(i => i.status === 'Aktif' && i.keteranganStatus === 'Lebih').length
    const percentageTerisi = totalTarget > 0 ? Math.round((totalRincian / totalTarget) * 100) : 0

    return {
      totalAktif,
      totalTarget,
      totalRincian,
      totalBelumDetail,
      totalKurang,
      totalSesuai,
      totalLebih,
      percentageTerisi
    }
  }, [fullDataList])

  // Filtered dataset for table
  const filteredRows = useMemo(() => {
    return fullDataList.filter((item) => {
      const q = searchQuery.toLowerCase()
      const matchSearch = 
        item.nama.toLowerCase().includes(q) ||
        item.npsnReg.toLowerCase().includes(q) ||
        item.jenis.toLowerCase().includes(q) ||
        item.pimpinan.toLowerCase().includes(q) ||
        item.alamat.toLowerCase().includes(q)

      if (!matchSearch) return false

      if (activeFilter === 'Belum ada detail') return item.keteranganStatus === 'Belum ada detail' || item.rincianTerisi === 0
      if (activeFilter === 'Kurang') return item.keteranganStatus === 'Kurang'
      if (activeFilter === 'Sesuai') return item.keteranganStatus === 'Sesuai'
      if (activeFilter === 'Lebih') return item.keteranganStatus === 'Lebih'
      return true
    })
  }, [fullDataList, searchQuery, activeFilter])

  // Reorder row position handler (Swaps urutan property & updates Supabase)
  const [isReordering, setIsReordering] = useState(false)

  const handleMoveRow = async (currentIndex: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= filteredRows.length) return

    const itemA = filteredRows[currentIndex]
    const itemB = filteredRows[targetIndex]

    const indexInKpmA = kpmItems.findIndex(i => i.id === itemA.id)
    const indexInKpmB = kpmItems.findIndex(i => i.id === itemB.id)

    if (indexInKpmA === -1 || indexInKpmB === -1) return

    setIsReordering(true)

    let urutanA = itemA.urutan ?? (indexInKpmA + 1)
    let urutanB = itemB.urutan ?? (indexInKpmB + 1)

    if (urutanA === urutanB) {
      urutanA = indexInKpmA + 1
      urutanB = indexInKpmB + 1
    }

    const newUrutanA = urutanB
    const newUrutanB = urutanA

    // Optimistically update local state for instant UI response
    const updatedKpmItems = [...kpmItems]
    updatedKpmItems[indexInKpmA] = { ...itemA, urutan: newUrutanA }
    updatedKpmItems[indexInKpmB] = { ...itemB, urutan: newUrutanB }

    updatedKpmItems.sort((a, b) => (a.urutan ?? 0) - (b.urutan ?? 0))
    setKpmItems(updatedKpmItems)

    const buildUpdateQuery = (item: DetailKpmItem, targetUrutan: number) => {
      const targetId = item.id
      let query = supabase.from('kelompok_penerima_manfaat').update({ urutan: targetUrutan })
      if (targetId.length > 20 && targetId.includes('-') && !targetId.startsWith('kpm-') && !targetId.startsWith('K')) {
        return query.eq('id', targetId)
      } else {
        return query.eq('kode', item.npsnReg || item.id)
      }
    }

    try {
      const [resA, resB] = await Promise.all([
        buildUpdateQuery(itemA, newUrutanA),
        buildUpdateQuery(itemB, newUrutanB)
      ])

      if (resA.error || resB.error) {
        console.error('Error updating urutan in Supabase:', resA.error || resB.error)
        triggerToast('Gagal memperbarui urutan di Supabase')
        await loadData()
      } else {
        triggerToast('Urutan baris KPM berhasil diubah')
      }
    } catch (err) {
      console.error('Exception updating urutan:', err)
      triggerToast('Terjadi kesalahan saat memindahkan baris')
      await loadData()
    } finally {
      setIsReordering(false)
    }
  }

  // Open Add Modal with Default Reset Values
  const handleOpenAddModal = () => {
    setEditingItem(null)
    setFormNama('')
    setFormKategori('SD')
    setFormSubKategori('Balita')
    setFormIdentitas('')
    setFormKepemilikan('Negeri')
    setFormKecamatan('WONOREJO')
    setFormKelDesa('WONOREJO')
    setFormAlamat('Wonorejo Pasuruan')
    setFormPimpinan('')
    setFormHp('')
    setFormEmail('')

    // Reset Standard School Allocation
    setFormPria(100)
    setFormWanita(100)
    setFormGuru(10)
    setFormTendik(5)

    // Reset SD Specific Allocation
    setFormSdSiswaLaki13(50)
    setFormSdSiswaPerem13(50)
    setFormSdSiswaLaki46(50)
    setFormSdSiswaPerem46(50)

    // Reset Posyandu 3B Allocation
    setFormBalitaLaki(30)
    setFormBalitaPerem(30)
    setFormBumil(15)
    setFormBusui(15)
    setFormKaderPosyandu(5)

    setShowAddModal(true)
  }

  // Edit Action
  const handleEditClick = (item: DetailKpmItem) => {
    setEditingItem(item)
    setFormNama(item.nama)
    const is3BGroup = item.jenis.includes('Ibu') || item.jenis.includes('Bayi') || item.jenis.includes('3B') || item.jenis.includes('POSYANDU')
    const isSdGroup = item.jenis.toUpperCase().includes('SD') || item.jenis.toUpperCase().includes('MI')
    const isSmpGroup = item.jenis.toUpperCase().includes('SMP') || item.jenis.toUpperCase().includes('MTS')
    setFormKategori(is3BGroup ? 'POSYANDU 3B' : (isSdGroup ? 'SD' : isSmpGroup ? 'SMP' : item.jenis))
    setFormSubKategori(item.jenis.includes('Hamil') ? 'Bumil' : item.jenis.includes('Menyusui') ? 'Busui' : 'Balita')
    setFormIdentitas(item.npsnReg)
    setFormKepemilikan(item.kepemilikan)
    setFormKecamatan(item.kecamatan)
    setFormKelDesa(item.kelDesa)
    setFormAlamat(item.alamat)
    setFormPimpinan(item.pimpinan && item.pimpinan !== '-' ? item.pimpinan : '')
    setFormHp(item.hp && item.hp !== '-' ? item.hp : '')
    setFormEmail(item.email && item.email !== '-' ? item.email : '')

    if (is3BGroup) {
      setFormBalitaLaki(item.pria || Math.floor(item.totalTarget * 0.3))
      setFormBalitaPerem(Math.floor(item.totalTarget * 0.3))
      setFormBumil(Math.floor(item.totalTarget * 0.2))
      setFormBusui(Math.floor(item.totalTarget * 0.15))
      setFormKaderPosyandu(item.guru || 5)
    } else if (isSdGroup) {
      setFormSdSiswaLaki13(item.sd13Laki ?? Math.floor(item.pria / 2))
      setFormSdSiswaPerem13(item.sd13Perem ?? Math.floor(item.wanita / 2))
      setFormSdSiswaLaki46(item.sd46Laki ?? Math.ceil(item.pria / 2))
      setFormSdSiswaPerem46(item.sd46Perem ?? Math.ceil(item.wanita / 2))
      setFormGuru(item.guru)
      setFormTendik(item.tendik)
    } else {
      setFormPria(item.pria)
      setFormWanita(item.wanita)
      setFormGuru(item.guru)
      setFormTendik(item.tendik)
    }

    setShowAddModal(true)
  }

  // Delete Click
  const handleDeleteClick = (item: DetailKpmItem) => {
    setDeleteConfirmItem(item)
  }

  // Delete Handler with Direct Supabase Query & Try-Catch-Finally
  const confirmDeleteGroup = async () => {
    if (!deleteConfirmItem) return
    const targetItem = deleteConfirmItem

    console.log('Menghapus item:', targetItem)

    setIsDeleting(true)
    try {
      let query = supabase.from('kelompok_penerima_manfaat').delete()

      const targetId = targetItem.id
      const targetKode = targetItem.npsnReg || targetItem.id

      if (targetId && targetId.length > 20 && targetId.includes('-') && !targetId.startsWith('kpm-') && !targetId.startsWith('K')) {
        query = query.eq('id', targetId)
      } else if (targetKode) {
        query = query.eq('kode', targetKode)
      } else {
        query = query.eq('id', targetId)
      }

      const { error } = await query

      if (error) {
        console.error("Gagal delete Supabase:", error.message)
        alert("Gagal menghapus dari Supabase: " + error.message)
        return
      }

      await deleteKelompokPenerimaManfaat(targetKode)

      // Optimistic Update
      setKpmItems(prev => prev.filter(k => k.id !== targetItem.id && k.npsnReg !== targetItem.npsnReg))

      triggerToast(`Kelompok "${targetItem.nama}" berhasil dihapus.`)
    } catch (err: any) {
      console.error("Exception delete Supabase:", err)
      alert("Gagal menghapus: " + (err.message || 'Error server'))
    } finally {
      setIsDeleting(false)
      setDeleteConfirmItem(null)
    }
  }

  // Toggle Status Action
  const handleToggleStatus = (item: DetailKpmItem) => {
    const newStatus: 'Aktif' | 'Non-Aktif' = item.status === 'Aktif' ? 'Non-Aktif' : 'Aktif'
    setKpmItems(prev => prev.map(i => i.id === item.id ? { ...i, status: newStatus } : i))
    triggerToast(`Status kelompok "${item.nama}" diubah menjadi ${newStatus}.`)
  }

  // Save KPM Group with Conditional Mapping & JSON persistence
  const handleSaveKpm = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const is3B = isPosyanduCategory
    const isSd = isSdCategory
    const totalPenerima = calculatedTotalTarget

    let identitasVal = formIdentitas.trim()
    if (!identitasVal) {
      identitasVal = is3B ? `REG-3B-${Math.floor(10000 + Math.random() * 90000)}` : `NPSN: ${Math.floor(10000000 + Math.random() * 90000000)}`
    }

    const fullWilayah = `JAWA TIMUR · PASURUAN · ${formKecamatan.trim()} · ${formKelDesa.trim()}`

    // Mapping fields depending on Posyandu vs SD vs Standard School
    let targetPriaVal = Number(formPria) || 0
    let targetWanitaVal = Number(formWanita) || 0
    let targetGuruVal = Number(formGuru) || 0
    let targetTendikVal = Number(formTendik) || 0

    let subKatSummary: string | undefined = undefined

    if (is3B) {
      targetPriaVal = Number(formBalitaLaki) || 0
      targetWanitaVal = (Number(formBalitaPerem) || 0) + (Number(formBumil) || 0) + (Number(formBusui) || 0)
      targetGuruVal = Number(formKaderPosyandu) || 0
      targetTendikVal = 0
      subKatSummary = JSON.stringify({
        balitaLaki: formBalitaLaki,
        balitaPerem: formBalitaPerem,
        bumil: formBumil,
        busui: formBusui,
        kader: formKaderPosyandu,
        porsiKecil: portionSummary.kecil,
        porsiBesar: portionSummary.besar,
        subKat: formSubKategori
      })
    } else if (isSd) {
      targetPriaVal = (Number(formSdSiswaLaki13) || 0) + (Number(formSdSiswaLaki46) || 0)
      targetWanitaVal = (Number(formSdSiswaPerem13) || 0) + (Number(formSdSiswaPerem46) || 0)
      targetGuruVal = Number(formGuru) || 0
      targetTendikVal = Number(formTendik) || 0
      subKatSummary = JSON.stringify({
        sd13Laki: formSdSiswaLaki13,
        sd13Perem: formSdSiswaPerem13,
        sd46Laki: formSdSiswaLaki46,
        sd46Perem: formSdSiswaPerem46,
        porsiKecil: portionSummary.kecil,
        porsiBesar: portionSummary.besar
      })
    } else {
      subKatSummary = JSON.stringify({
        porsiKecil: portionSummary.kecil,
        porsiBesar: portionSummary.besar
      })
    }

    if (editingItem) {
      const updatedPimpinan = formPimpinan.trim() || '-'
      const updatedHp = formHp.trim() || '-'
      const updatedEmail = formEmail.trim() || '-'

      const updatePayload: any = {
        nama: formNama.trim(),
        kategori: is3B ? 'POSYANDU_3B' : formKategori,
        sub_kategori: subKatSummary,
        identitas_npsn_tmp: identitasVal,
        wilayah: fullWilayah,
        kepemilikan: formKepemilikan,
        kecamatan: formKecamatan.trim(),
        kel_desa: formKelDesa.trim(),
        alamat: formAlamat.trim(),
        target_pria: targetPriaVal,
        target_wanita: targetWanitaVal,
        target_guru: targetGuruVal,
        target_tendik: targetTendikVal,
        jumlah_penerima: totalPenerima,
        pimpinan: updatedPimpinan !== '-' ? updatedPimpinan : null,
        hp: updatedHp !== '-' ? updatedHp : null,
        email: updatedEmail !== '-' ? updatedEmail : null,
        updated_at: new Date().toISOString()
      }

      console.log('Sending KPM Update Payload to Supabase:', updatePayload)

      let query = supabase.from('kelompok_penerima_manfaat').update(updatePayload)

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (editingItem.id && uuidRegex.test(editingItem.id)) {
        query = query.eq('id', editingItem.id)
      } else if (editingItem.npsnReg) {
        query = query.or(`kode.eq.${editingItem.npsnReg},identitas_npsn_tmp.eq.${editingItem.npsnReg}`)
      } else {
        query = query.eq('id', editingItem.id)
      }

      const { error: updateErr } = await query

      if (updateErr) {
        console.error('Gagal update KPM di Supabase:', updateErr.message)
        alert('Gagal meng-update data KPM di Supabase: ' + updateErr.message)
        setSaving(false)
        return
      }

      await loadData()
      triggerToast(`Perubahan data "${formNama}" berhasil disimpan ke Supabase!`)
    } else {
      const randomCode = `K${Math.floor(1000000000 + Math.random() * 9000000000)}`
      const newPimpinan = formPimpinan.trim() || '-'
      const newHp = formHp.trim() || '-'
      const newEmail = formEmail.trim() || '-'

      const newKpmSupabase: KelompokPenerimaManfaat = {
        nama: formNama.trim(),
        kategori: is3B ? 'POSYANDU_3B' : formKategori,
        sub_kategori: subKatSummary,
        identitas_npsn_tmp: identitasVal,
        kode: randomCode,
        wilayah: fullWilayah,
        kepemilikan: formKepemilikan,
        kecamatan: formKecamatan.trim(),
        kel_desa: formKelDesa.trim(),
        alamat: formAlamat.trim(),
        target_pria: targetPriaVal,
        target_wanita: targetWanitaVal,
        target_guru: targetGuruVal,
        target_tendik: targetTendikVal,
        jumlah_penerima: totalPenerima,
        pimpinan: newPimpinan !== '-' ? newPimpinan : undefined,
        hp: newHp !== '-' ? newHp : undefined,
        email: newEmail !== '-' ? newEmail : undefined,
        status: 'Aktif',
        created_at: new Date().toISOString()
      }

      const { data: insertedKpm, error: insertErr } = await supabase
        .from('kelompok_penerima_manfaat')
        .insert(newKpmSupabase)
        .select()
        .single()

      if (insertErr) {
        console.error('Gagal tambah KPM baru ke Supabase:', insertErr.message)
        alert('Gagal menambah KPM ke Supabase: ' + insertErr.message)
        setSaving(false)
        return
      }

      await saveKelompokPenerimaManfaat(newKpmSupabase)
      await loadData()
      triggerToast(`Kelompok baru "${formNama}" berhasil ditambahkan ke Supabase!`)
    }

    setSaving(false)
    setSaveSuccess(true)
    setTimeout(() => {
      setSaveSuccess(false)
      setShowAddModal(false)
    }, 800)
  }

  // Open BNBA Modal Drawer
  const handleOpenBnbaModal = async (group: DetailKpmItem) => {
    setActiveBnbaGroup(group)
    setSelectedBnbaIds([])
    const list = await fetchBnbaList(group.id)
    setBnbaList(list)

    const is3B = group.jenis.includes('Ibu') || group.jenis.includes('Bayi')
    setBnbaPosisi(is3B ? (group.jenis.includes('Hamil') ? 'Bumil' : group.jenis.includes('Menyusui') ? 'Busui' : 'Balita') : 'Siswa')
    setBnbaKelas(is3B ? '-' : 'Kelas 4')
  }

  // Logika Pengurutan Hierarkis (Students first by Class 1-6 & Alphabetical, then Tendik at bottom)
  const sortBNBA = (a: PenerimaManfaatBnba, b: PenerimaManfaatBnba) => {
    const posA = (a.posisi || '').toLowerCase()
    const posB = (b.posisi || '').toLowerCase()
    const isATendik = posA.includes('tendik') || posA.includes('guru')
    const isBTendik = posB.includes('tendik') || posB.includes('guru')
    const isAStudent = isATendik ? 1 : 0
    const isBStudent = isBTendik ? 1 : 0

    if (isAStudent !== isBStudent) return isAStudent - isBStudent

    if (isAStudent === 0) {
      const extractClassNum = (k?: string) => {
        const match = (k || '').match(/\d+/)
        return match ? parseInt(match[0], 10) : (parseInt(k || '') || 99)
      }
      const classA = extractClassNum(a.kelas)
      const classB = extractClassNum(b.kelas)
      if (classA !== classB) return classA - classB
    }
    return (a.nama_lengkap || '').localeCompare(b.nama_lengkap || '')
  }

  const handleOpenAddBnbaModal = () => {
    setEditingBnbaItem(null)
    setBnbaNisnNik(`${Math.floor(1000000000 + Math.random() * 9000000000)}`)
    setBnbaNama('')
    setBnbaTglLahir('2015-05-15')
    setBnbaJk('L')
    setBnbaOrtu('')
    if (activeBnbaGroup) {
      const is3B = activeBnbaGroup.jenis.includes('Ibu') || activeBnbaGroup.jenis.includes('Bayi') || activeBnbaGroup.jenis.includes('3B')
      setBnbaPosisi(is3B ? (activeBnbaGroup.jenis.includes('Hamil') ? 'Bumil' : activeBnbaGroup.jenis.includes('Menyusui') ? 'Busui' : 'Balita') : 'Siswa')
      setBnbaKelas(is3B ? '-' : 'Kelas 4')
    }
    setShowAddBnbaModal(true)
  }

  const handleOpenEditBnbaModal = (item: PenerimaManfaatBnba) => {
    setEditingBnbaItem(item)
    setBnbaNisnNik(item.nisn_nik || '')
    setBnbaNama(item.nama_lengkap || '')
    setBnbaTglLahir(normalizeBirthDate(item.tanggal_lahir))
    setBnbaJk(item.jenis_kelamin || 'L')
    setBnbaOrtu(item.nama_ortu === '-' ? '' : (item.nama_ortu || ''))
    setBnbaPosisi(item.posisi || 'Siswa')
    setBnbaKelas(item.kelas || '-')
    setShowAddBnbaModal(true)
  }

  const handleSaveBnbaItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeBnbaGroup) return
    setSavingBnba(true)

    try {
      const activeKelompokUuid = await resolveSupabaseKelompokUuid(activeBnbaGroup)

      let sanitizedDate = normalizeBirthDate(bnbaTglLahir)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(sanitizedDate)) {
        sanitizedDate = '2015-01-01'
      }

      const payload = {
        kelompok_id: activeKelompokUuid,
        nisn_nik: bnbaNisnNik.trim(),
        nama_lengkap: bnbaNama.trim().toUpperCase(),
        tanggal_lahir: sanitizedDate,
        jenis_kelamin: parseJk(bnbaJk),
        nama_ortu: bnbaOrtu.trim().toUpperCase() || '-',
        posisi: parsePosisi(bnbaPosisi),
        kelas: bnbaKelas
      }

      if (editingBnbaItem) {
        const { data, error } = await supabase
          .from('penerima_manfaat_bnba')
          .update(payload)
          .eq('id', editingBnbaItem.id)
          .select()
          .single()

        if (error) {
          console.error('Error updating BNBA in Supabase:', error)
          alert('Gagal meng-update BNBA: ' + error.message)
          return
        }

        const updatedBnba: PenerimaManfaatBnba = {
          ...editingBnbaItem,
          ...payload,
          id: data?.id || editingBnbaItem.id
        }

        await saveBnbaItem(updatedBnba)
        const updatedList = await fetchBnbaList(activeBnbaGroup.id)
        setBnbaList(updatedList)
        setAllBnbaRecords(prev => prev.map(b => b.id === updatedBnba.id ? updatedBnba : b))

        setShowAddBnbaModal(false)
        setEditingBnbaItem(null)
        triggerToast(`Penerima BNBA "${bnbaNama}" berhasil diperbarui.`)
      } else {
        const { data, error } = await supabase
          .from('penerima_manfaat_bnba')
          .insert(payload)
          .select()
          .single()

        if (error) {
          console.error('Error inserting single BNBA to Supabase:', error)
          alert('Gagal menyimpan BNBA: ' + error.message)
          return
        }

        const newBnba: PenerimaManfaatBnba = {
          id: data?.id || `bnba-${Date.now()}`,
          kelompok_id: activeBnbaGroup.id,
          nisn_nik: payload.nisn_nik,
          nama_lengkap: payload.nama_lengkap,
          tanggal_lahir: payload.tanggal_lahir,
          jenis_kelamin: payload.jenis_kelamin,
          nama_ortu: payload.nama_ortu,
          posisi: payload.posisi,
          kelas: payload.kelas,
          created_at: data?.created_at || new Date().toISOString()
        }

        await saveBnbaItem(newBnba)
        const updatedList = await fetchBnbaList(activeBnbaGroup.id)
        const finalList = updatedList.length > 0 ? updatedList : [newBnba, ...bnbaList]
        setBnbaList(finalList)
        setAllBnbaRecords(prev => [newBnba, ...prev.filter(b => b.id !== newBnba.id)])

        // Update count on active group
        setActiveBnbaGroup(prev => prev ? { ...prev, rincianTerisi: finalList.length } : null)

        setShowAddBnbaModal(false)
        triggerToast(`Penerima BNBA "${bnbaNama}" berhasil ditambahkan.`)
      }
    } catch (err: any) {
      console.error('Exception saving BNBA item:', err)
      alert('Gagal menyimpan data BNBA: ' + (err.message || 'Terjadi kesalahan'))
    } finally {
      setSavingBnba(false)
    }
  }

  const handleDeleteBnba = async (bnbaId: string) => {
    if (!activeBnbaGroup) return
    await deleteBnbaItem(bnbaId)
    const updatedList = await fetchBnbaList(activeBnbaGroup.id)
    setBnbaList(updatedList)
    setAllBnbaRecords(prev => prev.filter(b => b.id !== bnbaId))
    setSelectedBnbaIds(prev => prev.filter(id => id !== bnbaId))
    triggerToast('Data perorangan BNBA berhasil dihapus.')
  }

  // Bulk / Mass Delete BNBA Records (Selected or Clear All)
  const handleExecuteBulkDelete = async () => {
    if (!activeBnbaGroup || !bulkDeleteType) return
    setIsBulkDeleting(true)

    try {
      const activeKelompokUuid = await resolveSupabaseKelompokUuid(activeBnbaGroup)

      if (bulkDeleteType === 'selected') {
        if (selectedBnbaIds.length === 0) return

        const { error } = await supabase
          .from('penerima_manfaat_bnba')
          .delete()
          .in('id', selectedBnbaIds)

        if (error) {
          console.error('Error bulk deleting BNBA in Supabase:', error)
          alert('Gagal menghapus data terpilih: ' + error.message)
          return
        }

        for (const id of selectedBnbaIds) {
          await deleteBnbaItem(id)
        }

        const updatedList = await fetchBnbaList(activeBnbaGroup.id)
        const finalList = updatedList.filter(b => !selectedBnbaIds.includes(b.id))
        setBnbaList(finalList)
        setAllBnbaRecords(prev => prev.filter(b => !selectedBnbaIds.includes(b.id)))

        const newCount = finalList.length
        setActiveBnbaGroup(prev => prev ? { ...prev, rincianTerisi: newCount } : null)
        setKpmItems(prev => prev.map(k => (k.id === activeBnbaGroup.id || k.npsnReg === activeBnbaGroup.id || k.id === activeKelompokUuid) ? { ...k, rincianTerisi: newCount } : k))

        triggerToast(`Berhasil menghapus ${selectedBnbaIds.length} data BNBA terpilih.`)
        setSelectedBnbaIds([])
      } else if (bulkDeleteType === 'all') {
        if (bnbaList.length === 0) return

        const { error } = await supabase
          .from('penerima_manfaat_bnba')
          .delete()
          .or(`kelompok_id.eq.${activeKelompokUuid},kelompok_id.eq.${activeBnbaGroup.id},kelompok_id.eq.${activeBnbaGroup.npsnReg}`)

        if (error) {
          console.error('Error clearing all BNBA in Supabase:', error)
          alert('Gagal mengosongkan data BNBA: ' + error.message)
          return
        }

        for (const item of bnbaList) {
          await deleteBnbaItem(item.id)
        }

        setBnbaList([])
        setAllBnbaRecords(prev => prev.filter(b => b.kelompok_id !== activeBnbaGroup.id && b.kelompok_id !== activeKelompokUuid && b.kelompok_id !== activeBnbaGroup.npsnReg))

        setActiveBnbaGroup(prev => prev ? { ...prev, rincianTerisi: 0 } : null)
        setKpmItems(prev => prev.map(k => (k.id === activeBnbaGroup.id || k.npsnReg === activeBnbaGroup.id || k.id === activeKelompokUuid) ? { ...k, rincianTerisi: 0 } : k))

        triggerToast(`Seluruh data BNBA kelompok "${activeBnbaGroup.nama}" berhasil dikosongkan.`)
        setSelectedBnbaIds([])
      }
    } catch (err: any) {
      console.error('Exception bulk deleting BNBA:', err)
      alert('Terjadi kesalahan saat menghapus data BNBA: ' + (err.message || 'Error server'))
    } finally {
      setIsBulkDeleting(false)
      setShowBulkDeleteConfirmModal(false)
      setBulkDeleteType(null)
    }
  }

  // ─── BNBA Excel Import & Template Download Helpers ───
  const normalizeBirthDate = (val: any): string => {
    if (val === null || val === undefined || val === '') {
      return '2015-01-01'
    }

    // 1. Handle Excel serial date number
    if (typeof val === 'number') {
      try {
        if (XLSX?.SSF?.parse_date_code) {
          const dateObj = XLSX.SSF.parse_date_code(val)
          if (dateObj && dateObj.y && dateObj.m && dateObj.d) {
            const yyyy = String(dateObj.y).padStart(4, '0')
            const mm = String(dateObj.m).padStart(2, '0')
            const dd = String(dateObj.d).padStart(2, '0')
            return `${yyyy}-${mm}-${dd}`
          }
        }
        const jsDate = new Date(Math.round((val - 25569) * 86400 * 1000))
        if (!isNaN(jsDate.getTime())) {
          return jsDate.toISOString().split('T')[0]
        }
      } catch {}
    }

    let str = String(val).trim()
    // Clean up inner whitespace (e.g., "24 -04 - 1996" -> "24-04-1996", "2022- 08 -18" -> "2022-08-18")
    str = str.replace(/\s+/g, '')

    // Check if YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return str
    }

    // Handle DD/MM/YYYY, DD-MM-YYYY, D/M/YY, etc.
    const parts = str.split(/[-/.]/)
    if (parts.length === 3) {
      let p1 = parts[0]
      let p2 = parts[1]
      let p3 = parts[2]

      // Case: YYYY-M-D or YYYY/M/D
      if (p1.length === 4) {
        const y = p1
        const m = p2.padStart(2, '0')
        const d = p3.padStart(2, '0')
        return `${y}-${m}-${d}`
      }

      // Case: DD-MM-YYYY or D/M/YY (e.g. 5/9/81, 9/2/23, 24-04-1996)
      let d = p1.padStart(2, '0')
      let m = p2.padStart(2, '0')
      let y = p3

      if (y.length === 2) {
        const yy = parseInt(y, 10)
        if (!isNaN(yy)) {
          y = yy <= 30 ? `20${y.padStart(2, '0')}` : `19${y.padStart(2, '0')}`
        }
      }

      if (y.length === 4) {
        return `${y}-${m}-${d}`
      }
    }

    try {
      const d = new Date(str)
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0]
      }
    } catch {}

    return str || '2015-01-01'
  }

  const parsePosisi = (val: any): 'Siswa' | 'Tendik' | 'Balita' | 'Bumil' | 'Busui' => {
    const s = String(val || '').trim().toLowerCase()
    if (s.includes('guru') || s.includes('tendik')) return 'Tendik'
    if (s.includes('balita') || s.includes('bayi')) return 'Balita'
    if (s.includes('bumil') || s.includes('hamil')) return 'Bumil'
    if (s.includes('busui') || s.includes('menyusui')) return 'Busui'
    return 'Siswa'
  }

  const parseJk = (val: any): 'L' | 'P' => {
    const s = String(val || '').trim().toUpperCase()
    if (s.startsWith('L') || s.includes('PRIA') || s.includes('LAKI')) return 'L'
    if (s.startsWith('P') || s.includes('PEREMPUAN') || s.includes('WANITA')) return 'P'
    return 'L'
  }

  // Download BNBA Excel Template
  const handleDownloadTemplate = () => {
    if (!activeBnbaGroup) return
    const groupName = activeBnbaGroup.nama.replace(/[^a-zA-Z0-9_-]/g, '_')

    const headers = [
      'NIK / NISN',
      'Nama Lengkap',
      'Tanggal Lahir (YYYY-MM-DD)',
      'Jenis Kelamin (Laki-laki / Perempuan)',
      'Nama Ortu / Wali',
      'Posisi (Siswa / Guru / Tendik / Balita / Bumil / Busui)',
      'Kelas / Sasaran'
    ]

    const dummyData = [
      [
        '3514011508150001',
        'AHMAD FADILAH',
        '2015-08-15',
        'Laki-laki',
        'BUDI SANTOSO',
        'Siswa',
        'Kelas 4'
      ],
      [
        '3514015210160002',
        'SITI AMINAH',
        '2016-10-22',
        'Perempuan',
        'AHMAD RIFAI',
        'Siswa',
        'Kelas 3'
      ]
    ]

    const wsData = [headers, ...dummyData]
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    ws['!cols'] = [
      { wch: 20 },
      { wch: 25 },
      { wch: 25 },
      { wch: 35 },
      { wch: 25 },
      { wch: 45 },
      { wch: 18 }
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Template BNBA')

    XLSX.writeFile(wb, `Template_BNBA_${groupName}.xlsx`)
    triggerToast(`Template Excel BNBA "${groupName}" berhasil diunduh.`)
  }

  // Ekspor Data BNBA Terurut (Siswa Kelas 1-6 dulu, Tendik di paling bawah) ke Excel
  const handleExportBnbaExcel = () => {
    if (!activeBnbaGroup) return
    const groupName = activeBnbaGroup.nama.replace(/[^a-zA-Z0-9_-]/g, '_')
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '') // YYYYMMDD

    const sortedRows = [...bnbaList].sort(sortBNBA)

    const headers = [
      'NO',
      'NIK / NISN',
      'NAMA PENERIMA',
      'TANGGAL LAHIR',
      'JK',
      'NAMA ORTU',
      'POSISI',
      'KELAS'
    ]

    const dataRows = sortedRows.map((item, idx) => [
      idx + 1,
      item.nisn_nik,
      item.nama_lengkap,
      item.tanggal_lahir,
      item.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan',
      item.nama_ortu,
      item.posisi,
      item.kelas
    ])

    const wsData = [headers, ...dataRows]
    const ws = XLSX.utils.aoa_to_sheet(wsData)

    ws['!cols'] = [
      { wch: 6 },
      { wch: 22 },
      { wch: 30 },
      { wch: 16 },
      { wch: 14 },
      { wch: 25 },
      { wch: 14 },
      { wch: 14 }
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'BNBA')

    const fileName = `BNBA_${groupName}_${dateStr}.xlsx`
    XLSX.writeFile(wb, fileName)
    triggerToast(`Ekspor Excel BNBA "${fileName}" berhasil diunduh.`)
  }

  // Handle File Input Change for Excel / CSV Import
  const handleFileImportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeBnbaGroup) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false })

        if (!rows || rows.length < 2) {
          alert('File Excel kosong atau tidak memiliki baris data.')
          return
        }

        const dataRows = rows.slice(1)
        const parsedItems: PenerimaManfaatBnba[] = []

        dataRows.forEach((row, idx) => {
          const nisnNik = String(row[0] || '').trim()
          const namaLengkap = String(row[1] || '').trim().toUpperCase()
          if (!nisnNik || !namaLengkap) return

          const tglLahir = normalizeBirthDate(row[2])
          const jk = parseJk(row[3])
          const ortu = String(row[4] || '-').trim().toUpperCase()
          const posisi = parsePosisi(row[5])
          const kelas = String(row[6] || '-').trim()

          parsedItems.push({
            id: `bnba-imp-${Date.now()}-${idx}`,
            kelompok_id: activeBnbaGroup.id,
            nisn_nik: nisnNik,
            nama_lengkap: namaLengkap,
            tanggal_lahir: tglLahir,
            jenis_kelamin: jk,
            nama_ortu: ortu,
            posisi: posisi,
            kelas: kelas,
            created_at: new Date().toISOString()
          })
        })

        if (parsedItems.length === 0) {
          alert('Tidak ditemukan data valid dalam file Excel (pastikan NIK/NISN & Nama Lengkap terisi).')
          return
        }

        setImportPreviewData(parsedItems)
        setShowImportConfirmModal(true)
      } catch (err: any) {
        console.error('Error parsing Excel file:', err)
        alert('Gagal membaca file Excel/CSV: ' + (err.message || 'Format file tidak sesuai'))
      } finally {
        e.target.value = ''
      }
    }
    reader.readAsBinaryString(file)
  }

  // Helper to resolve or create valid UUID for kelompok_id in Supabase
  const resolveSupabaseKelompokUuid = async (group: DetailKpmItem): Promise<string> => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (group.id && uuidRegex.test(group.id)) {
      return group.id
    }

    try {
      const { data } = await supabase
        .from('kelompok_penerima_manfaat')
        .select('id')
        .or(`kode.eq.${group.npsnReg},identitas_npsn_tmp.eq.${group.npsnReg},nama.eq.${group.nama}`)
        .limit(1)
        .maybeSingle()

      if (data?.id && uuidRegex.test(data.id)) {
        return data.id
      }
    } catch (e) {
      console.warn('Could not resolve KPM UUID:', e)
    }

    try {
      const randomCode = `K${Math.floor(1000000000 + Math.random() * 9000000000)}`
      const is3B = group.jenis.includes('POSYANDU') || group.jenis.includes('Ibu') || group.jenis.includes('Bayi')
      const { data: newKpm } = await supabase
        .from('kelompok_penerima_manfaat')
        .insert({
          nama: group.nama,
          kategori: is3B ? 'POSYANDU_3B' : 'SD',
          identitas_npsn_tmp: group.npsnReg || 'NPSN-TMP',
          kode: group.npsnReg && group.npsnReg.startsWith('K') ? group.npsnReg : randomCode,
          wilayah: `JAWA TIMUR · PASURUAN · ${group.kecamatan} · ${group.kelDesa}`,
          jumlah_penerima: group.totalTarget || 10,
          status: 'Aktif'
        })
        .select('id')
        .single()

      if (newKpm?.id) return newKpm.id
    } catch (err) {
      console.error('Error creating fallback KPM:', err)
    }

    return group.id
  }

  // Execute Bulk Import to Supabase & Update local state
  const confirmExecuteImport = async () => {
    if (!activeBnbaGroup || importPreviewData.length === 0) return
    setIsImporting(true)

    try {
      const activeKelompokUuid = await resolveSupabaseKelompokUuid(activeBnbaGroup)

      const payload = importPreviewData.map(item => {
        let sanitizedDate: string | null = normalizeBirthDate(item.tanggal_lahir)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(sanitizedDate || '')) {
          sanitizedDate = '2015-01-01'
        }

        const rowPayload: any = {
          kelompok_id: activeKelompokUuid,
          nisn_nik: String(item.nisn_nik || '').trim(),
          nama_lengkap: String(item.nama_lengkap || '').trim().toUpperCase(),
          tanggal_lahir: sanitizedDate,
          jenis_kelamin: parseJk(item.jenis_kelamin),
          nama_ortu: String(item.nama_ortu || '-').trim().toUpperCase(),
          posisi: parsePosisi(item.posisi),
          kelas: String(item.kelas || '-').trim()
        }

        if (item.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id)) {
          rowPayload.id = item.id
        }

        return rowPayload
      })

      console.log('Sending BNBA Bulk Import Payload to Supabase:', payload)

      const { data, error } = await supabase
        .from('penerima_manfaat_bnba')
        .insert(payload)
        .select()

      if (error) {
        console.error("Gagal Import BNBA:", error)
        alert("Gagal mengimpor data: " + error.message)
        return
      }

      console.log('BNBA Bulk Import Success from Supabase:', data)

      const localItems: PenerimaManfaatBnba[] = (data || []).map((d: any, idx: number) => ({
        id: d.id || `bnba-imp-${Date.now()}-${idx}`,
        kelompok_id: activeBnbaGroup.id,
        nisn_nik: d.nisn_nik,
        nama_lengkap: d.nama_lengkap,
        tanggal_lahir: d.tanggal_lahir,
        jenis_kelamin: d.jenis_kelamin,
        nama_ortu: d.nama_ortu,
        posisi: d.posisi,
        kelas: d.kelas,
        created_at: d.created_at || new Date().toISOString()
      }))

      await saveBnbaBulk(localItems.length > 0 ? localItems : importPreviewData)

      const updatedList = await fetchBnbaList(activeBnbaGroup.id)
      const finalList = updatedList.length > 0 ? updatedList : (data || [])
      setBnbaList(finalList)

      setAllBnbaRecords(prev => [
        ...finalList,
        ...prev.filter(b => b.kelompok_id !== activeBnbaGroup.id && b.kelompok_id !== activeKelompokUuid)
      ])

      const updatedCount = finalList.length
      setKpmItems(prev => prev.map(k => {
        if (k.id === activeBnbaGroup.id || k.npsnReg === activeBnbaGroup.id || k.id === activeKelompokUuid) {
          const totalTarget = k.totalTarget
          let ketStatus: 'Belum ada detail' | 'Kurang' | 'Sesuai' | 'Lebih' = 'Sesuai'
          let ketMsg = '✓ Sesuai'
          if (updatedCount === 0) {
            ketStatus = 'Belum ada detail'
            ketMsg = '⚠️ Belum ada detail'
          } else if (updatedCount < totalTarget) {
            ketStatus = 'Kurang'
            ketMsg = `↓ Kurang ${totalTarget - updatedCount} orang`
          } else if (updatedCount > totalTarget) {
            ketStatus = 'Lebih'
            ketMsg = `↑ Lebih ${updatedCount - totalTarget} orang`
          }
          return {
            ...k,
            rincianTerisi: updatedCount,
            keteranganStatus: ketStatus,
            keteranganMsg: ketMsg
          }
        }
        return k
      }))

      setActiveBnbaGroup(prev => prev ? { ...prev, rincianTerisi: updatedCount } : null)

      triggerToast(`Berhasil mengimpor ${payload.length} data BNBA ke Supabase!`)
      setShowImportConfirmModal(false)
      setImportPreviewData([])
    } catch (err: any) {
      console.error('Exception importing BNBA:', err)
      alert('Gagal mengimpor data: ' + (err.message || 'Terjadi kesalahan sistem'))
    } finally {
      setIsImporting(false)
    }
  }

  const filteredBnbaList = useMemo(() => {
    const q = bnbaSearch.toLowerCase()
    const list = bnbaList.filter(item => 
      (item.nama_lengkap || '').toLowerCase().includes(q) ||
      (item.nisn_nik || '').toLowerCase().includes(q) ||
      (item.nama_ortu || '').toLowerCase().includes(q) ||
      (item.posisi || '').toLowerCase().includes(q)
    )
    return list.sort(sortBNBA)
  }, [bnbaList, bnbaSearch])

  return (
    <div className="space-y-5 font-sans text-slate-800 pb-16 relative">
      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <Check size={16} className="text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. Header Atas Halaman (Flat BGN Style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Kelompok Penerima Manfaat
            </h1>
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
              isRealtimeActive 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isRealtimeActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span>{isRealtimeActive ? '● Sinkron Realtime' : '○ Menghubungkan'}</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Master Data & Registrasi BGN Kelompok Penerima Manfaat Terintegrasi Supabase.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-60">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari NPSN, nama, atau wilayah..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-800 shadow-2xs"
            />
          </div>

          <button
            onClick={handleRefresh}
            title="Muat ulang data"
            className="p-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg transition shadow-2xs cursor-pointer flex items-center justify-center"
          >
            <RotateCw size={14} className={isRefreshing || loading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={handleOpenAddModal}
            className="bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg px-3.5 py-1.5 text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} />
            <span>+ Tambah Kelompok</span>
          </button>
        </div>
      </div>

      {/* 2. 4 Kartu KPI Metrik (Flat Minimal Design) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4 flex flex-col justify-between space-y-1 shadow-none">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            Total Kelompok Aktif
          </span>
          <div className="text-2xl font-bold text-slate-800 tracking-tight">
            {stats.totalAktif} <span className="text-xs font-normal text-slate-500">Kelompok</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4 flex flex-col justify-between space-y-1 shadow-none">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            Total Target Penerima
          </span>
          <div className="text-2xl font-bold text-slate-800 tracking-tight">
            {stats.totalTarget.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-500">Jiwa</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4 flex flex-col justify-between space-y-1 shadow-none">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            Total Rincian Terisi
          </span>
          <div className="text-2xl font-bold text-slate-800 tracking-tight">
            {stats.totalRincian.toLocaleString('id-ID')} <span className="text-xs font-semibold text-emerald-600">({stats.percentageTerisi}%)</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4 flex flex-col justify-between space-y-1 shadow-none">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            Belum Dilengkapi
          </span>
          <div className="text-2xl font-bold text-slate-800 tracking-tight">
            {stats.totalBelumDetail} <span className="text-xs font-normal text-slate-500">Kelompok</span>
          </div>
        </div>
      </div>

      {/* 3. Alert Box Banner */}
      {showAlert && (
        <div className="bg-slate-50 border border-slate-200 text-slate-600 text-xs p-3 rounded-lg flex items-center justify-between gap-3 transition animate-fadeIn">
          <div className="flex items-center gap-2">
            <Info size={15} className="text-slate-500 shrink-0" />
            <span>
              Formulir kelompok ini digunakan sebagai acuan operasional MBG harian BGN. Pastikan data NPSN dan rincian BNBA telah valid.
            </span>
          </div>
          <button
            onClick={() => setShowAlert(false)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded transition cursor-pointer shrink-0"
            title="Tutup pengumuman"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 4. Filter Status Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-lg shadow-none">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveFilter('Semua')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'Semua'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>Semua</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeFilter === 'Semua' ? 'bg-white text-slate-900' : 'bg-slate-800 text-white'
            }`}>
              {stats.totalAktif}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('Belum ada detail')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'Belum ada detail'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>Belum ada detail</span>
            <span className="text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded-full font-bold">
              {stats.totalBelumDetail}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('Kurang')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'Kurang'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>Kurang</span>
            <span className="text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded-full font-bold">
              {stats.totalKurang}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('Sesuai')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'Sesuai'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>Sesuai</span>
            <span className="text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded-full font-bold">
              {stats.totalSesuai}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('Lebih')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'Lebih'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>Lebih</span>
            <span className="text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded-full font-bold">
              {stats.totalLebih}
            </span>
          </button>
        </div>

        {/* Export Toolbar */}
        <div className="flex items-center gap-1 self-end sm:self-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <button title="Tampilan" className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md transition cursor-pointer">
            <Eye size={15} />
          </button>
          <button title="Ekspor Excel" className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition cursor-pointer">
            <FileSpreadsheet size={15} />
          </button>
          <button title="Ekspor PDF" className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition cursor-pointer">
            <FileText size={15} />
          </button>
          <button 
            title="Cetak Lembar Kendali Distribusi BGN" 
            onClick={() => setShowPrintModal(true)}
            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition cursor-pointer flex items-center gap-1"
          >
            <Printer size={15} />
          </button>
        </div>
      </div>

      {/* 5. Tabel Data Flat & Compact */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-none overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px] whitespace-nowrap">
                <th className="py-3 px-3 text-center w-10">#</th>
                <th className="py-3 px-3 text-center min-w-[170px]">AKSI</th>
                <th className="py-3 px-3 min-w-[130px]">JENIS KELOMPOK</th>
                <th className="py-3 px-3 min-w-[220px]">NAMA KELOMPOK</th>
                <th className="py-3 px-3 text-center min-w-[120px]">STATUS KEPEMILIKAN</th>
                <th className="py-3 px-3 min-w-[110px]">KECAMATAN</th>
                <th className="py-3 px-3 min-w-[110px]">KEL/DESA</th>
                <th className="py-3 px-3 min-w-[180px]">ALAMAT</th>
                <th className="py-3 px-3 text-right min-w-[100px]">JUMLAH PRIA</th>
                <th className="py-3 px-3 text-right min-w-[110px]">JUMLAH WANITA</th>
                <th className="py-3 px-3 text-right min-w-[140px]">JUMLAH GURU/KADER</th>
                <th className="py-3 px-3 text-right min-w-[110px]">JUMLAH TENDIK</th>
                <th className="py-3 px-3 text-right min-w-[130px]">TOTAL / RINCIAN</th>
                <th className="py-3 px-3 text-center min-w-[150px]">KETERANGAN</th>
                <th className="py-3 px-3 min-w-[200px]">NAMA PIMPINAN/KETUA/PENGHUBUNG</th>
                <th className="py-3 px-3 min-w-[120px]">NO. HP/TELEPON</th>
                <th className="py-3 px-3 min-w-[160px]">EMAIL</th>
                <th className="py-3 px-3 text-center min-w-[90px]">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
              {filteredRows.length > 0 ? (
                filteredRows.slice(0, perPage).map((row, idx) => (
                  <tr key={row.id} className={`hover:bg-slate-50 transition duration-150 whitespace-nowrap ${row.status === 'Non-Aktif' ? 'opacity-60 bg-slate-50' : ''}`}>
                    <td className="py-2.5 px-2 text-center font-bold text-slate-700">
                      <div className="flex items-center justify-center gap-1">
                        <div className="flex flex-col items-center justify-center -my-1">
                          <button
                            type="button"
                            onClick={() => handleMoveRow(idx, 'up')}
                            disabled={idx === 0 || isReordering}
                            title="Pindah urutan ke atas (▲)"
                            className="p-0.5 text-slate-400 hover:text-slate-900 disabled:opacity-20 disabled:hover:text-slate-400 cursor-pointer disabled:cursor-not-allowed transition hover:bg-slate-200 rounded"
                          >
                            <ChevronUp size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveRow(idx, 'down')}
                            disabled={idx === filteredRows.length - 1 || isReordering}
                            title="Pindah urutan ke bawah (▼)"
                            className="p-0.5 text-slate-400 hover:text-slate-900 disabled:opacity-20 disabled:hover:text-slate-400 cursor-pointer disabled:cursor-not-allowed transition hover:bg-slate-200 rounded"
                          >
                            <ChevronDown size={13} />
                          </button>
                        </div>
                        <span className="w-5 text-center text-xs text-slate-800 font-mono font-bold">
                          {idx + 1}
                        </span>
                      </div>
                    </td>

                    {/* Flat Minimal Action Bar */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 justify-center">
                        <button
                          onClick={() => handleOpenBnbaModal(row)}
                          className="bg-slate-800 hover:bg-slate-900 text-white text-xs px-3 py-1 rounded-md font-medium transition cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <Eye size={12} />
                          <span>Rincian</span>
                        </button>
                        <button
                          onClick={() => handleEditClick(row)}
                          title="Edit Data"
                          className="p-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-md transition cursor-pointer"
                        >
                          <Edit size={13} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(row)}
                          title={row.status === 'Aktif' ? 'Arsip / Nonaktifkan' : 'Aktifkan Kembali'}
                          className="p-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-md transition cursor-pointer"
                        >
                          <Bookmark size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(row)}
                          title="Hapus Data"
                          className="p-1.5 border border-slate-200 hover:bg-rose-50 text-rose-600 rounded-md transition cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {row.jenis}
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 block">{row.nama}</span>
                      <span className="font-mono text-[10px] text-slate-500 block">[{row.npsnReg}]</span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {row.kepemilikan}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-medium text-slate-700">
                      {row.kecamatan}
                    </td>

                    <td className="py-3 px-3 text-slate-700">
                      {row.kelDesa}
                    </td>

                    <td className="py-3 px-3 text-slate-600">
                      {row.alamat}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-700">
                      {row.pria} Orang
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-700">
                      {row.wanita} Orang
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-700">
                      {row.guru} Orang
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-700">
                      {row.tendik} Orang
                    </td>

                    <td className="py-3 px-3 text-right font-mono">
                      <span className="font-bold text-slate-900">{row.totalTarget}</span>
                      <span className="text-slate-400 mx-1">/</span>
                      <span className={row.rincianTerisi < row.totalTarget ? 'text-amber-700 font-semibold' : 'text-emerald-700 font-bold'}>
                        {row.rincianTerisi}
                      </span>
                    </td>

                    {/* Keterangan Status Badge */}
                    <td className="py-3 px-3 text-center">
                      {row.keteranganStatus === 'Belum ada detail' && (
                        <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-semibold inline-block">
                          {row.keteranganMsg}
                        </span>
                      )}
                      {row.keteranganStatus === 'Kurang' && (
                        <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-semibold inline-block">
                          {row.keteranganMsg}
                        </span>
                      )}
                      {row.keteranganStatus === 'Sesuai' && (
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-semibold inline-block">
                          {row.keteranganMsg}
                        </span>
                      )}
                      {row.keteranganStatus === 'Lebih' && (
                        <span className="bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded text-[10px] font-semibold inline-block">
                          {row.keteranganMsg}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {row.pimpinan}
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-700">
                      {row.hp}
                    </td>

                    <td className="py-3 px-3 text-slate-500 font-mono text-[10px]">
                      {row.email}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        row.status === 'Aktif' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={18} className="py-10 text-center text-slate-400 font-medium">
                    {loading ? 'Memuat data dari database Supabase...' : 'Tidak ada data Kelompok Penerima Manfaat yang cocok.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="p-3 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
          <div>
            Menampilkan 1-{Math.min(filteredRows.length, perPage)} dari {filteredRows.length} data kelompok
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 mr-3">
              <label className="text-xs text-slate-500">Tampilkan:</label>
              <select
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                className="px-2 py-1 border border-slate-300 rounded-md text-xs font-medium bg-white"
              >
                <option value={15}>15 baris</option>
                <option value={25}>25 baris</option>
                <option value={50}>50 baris</option>
              </select>
            </div>

            <button disabled className="px-3 py-1 bg-slate-50 border border-slate-200 rounded text-slate-400 text-xs flex items-center gap-1 cursor-not-allowed">
              <ChevronLeft size={13} /> Sebelumnya
            </button>
            <span className="px-3 py-1 bg-slate-900 text-white font-bold text-xs rounded">1</span>
            <button className="px-3 py-1 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-50 transition text-xs flex items-center gap-1 cursor-pointer">
              Berikutnya <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Form Tambah / Edit KPM with DYNAMIC CONDITIONAL INPUTS */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-fadeIn my-auto max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                {isPosyanduCategory ? (
                  <HeartHandshake size={18} className="text-slate-800" />
                ) : (
                  <Building2 size={18} className="text-slate-800" />
                )}
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingItem 
                    ? (isPosyanduCategory ? 'Edit Kelompok Posyandu 3B' : 'Edit Kelompok Sekolah') 
                    : (isPosyanduCategory ? 'Form Tambah Kelompok Posyandu 3B' : 'Form Tambah Kelompok Sekolah')}
                </h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {saveSuccess && (
              <div className="m-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <Check size={16} className="text-emerald-600" />
                <span>{editingItem ? 'Data Kelompok Berhasil Diperbarui!' : 'Kelompok Baru Berhasil Disimpan ke Supabase!'}</span>
              </div>
            )}

            <form onSubmit={handleSaveKpm} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Kelompok / Lembaga *</label>
                  <input
                    type="text"
                    required
                    value={formNama}
                    onChange={(e) => setFormNama(e.target.value)}
                    placeholder={isPosyanduCategory ? "Contoh: POSYANDU MAWAR 3B" : "Contoh: SDN WONOREJO V"}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs bg-white focus:ring-1 focus:ring-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis / Kategori *</label>
                  <select
                    value={formKategori}
                    onChange={(e) => setFormKategori(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-semibold bg-white"
                  >
                    <option value="KB">KB (Kelompok Bermain)</option>
                    <option value="PAUD">PAUD</option>
                    <option value="TK">TK</option>
                    <option value="RA">RA</option>
                    <option value="SD">SD / MI</option>
                    <option value="SMP">SMP / MTs</option>
                    <option value="SMA">SMA / SMK / MA</option>
                    <option value="POSYANDU 3B">3B (balita,busui,bumil)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {isPosyanduCategory ? (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Kode Posyandu / No. Registrasi (TMP) *
                    </label>
                    <input
                      type="text"
                      value={formIdentitas}
                      onChange={(e) => setFormIdentitas(e.target.value)}
                      placeholder="Contoh: REG-3B-001 atau TMP-POSYANDU"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs bg-white font-mono"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Kode Kelompok (NPSN / NSM) *
                    </label>
                    <input
                      type="text"
                      value={formIdentitas}
                      onChange={(e) => setFormIdentitas(e.target.value)}
                      placeholder="Contoh: 20518921"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs bg-white font-mono"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kepemilikan *</label>
                  <select
                    value={formKepemilikan}
                    onChange={(e) => setFormKepemilikan(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-semibold bg-white"
                  >
                    <option value="Negeri">Negeri</option>
                    <option value="Swasta">Swasta</option>
                  </select>
                </div>
              </div>

              {/* Wilayah & Alamat */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block font-semibold text-slate-800">Wilayah & Alamat *</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500">Kecamatan</span>
                    <input
                      type="text"
                      required
                      value={formKecamatan}
                      onChange={(e) => setFormKecamatan(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Kel/Desa</span>
                    <input
                      type="text"
                      required
                      value={formKelDesa}
                      onChange={(e) => setFormKelDesa(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white"
                    />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500">Alamat Lengkap</span>
                  <input
                    type="text"
                    required
                    value={formAlamat}
                    onChange={(e) => setFormAlamat(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white"
                  />
                </div>
              </div>

              {/* ─── DYNAMIC CONDITIONAL TARGET ALLOCATION SECTION ─── */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-slate-800">
                    {isPosyanduCategory 
                      ? 'Target Alokasi Sasaran Posyandu 3B *' 
                      : (isSdCategory ? 'Target Alokasi Penerima SD / MI (Standarisasi Porsi) *' : 'Target Alokasi Penerima Sekolah *')}
                  </label>
                  <span className="text-[11px] font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    Total: {calculatedTotalTarget} Sasaran
                  </span>
                </div>

                {/* CONDITIONAL BRANCH A: SD / MI SPECIFIC ALLOCATION */}
                {isSdCategory ? (
                  <div className="space-y-3 animate-fadeIn bg-slate-50/80 p-3 rounded-lg border border-slate-200">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-800">Siswa Kelas 1 - 3</span>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-semibold border border-emerald-200">
                          Porsi Kecil
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] font-semibold text-slate-600">Siswa Laki-laki (Kelas 1-3)</span>
                          <input
                            type="number"
                            min={0}
                            value={formSdSiswaLaki13}
                            onChange={(e) => setFormSdSiswaLaki13(e.target.value === '' ? 0 : Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-bold bg-white text-slate-900"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-slate-600">Siswa Perempuan (Kelas 1-3)</span>
                          <input
                            type="number"
                            min={0}
                            value={formSdSiswaPerem13}
                            onChange={(e) => setFormSdSiswaPerem13(e.target.value === '' ? 0 : Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-bold bg-white text-slate-900"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-800">Siswa Kelas 4 - 6</span>
                        <span className="bg-sky-100 text-sky-800 text-[10px] px-2 py-0.5 rounded font-semibold border border-sky-200">
                          Porsi Besar
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] font-semibold text-slate-600">Siswa Laki-laki (Kelas 4-6)</span>
                          <input
                            type="number"
                            min={0}
                            value={formSdSiswaLaki46}
                            onChange={(e) => setFormSdSiswaLaki46(e.target.value === '' ? 0 : Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-bold bg-white text-slate-900"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-slate-600">Siswa Perempuan (Kelas 4-6)</span>
                          <input
                            type="number"
                            min={0}
                            value={formSdSiswaPerem46}
                            onChange={(e) => setFormSdSiswaPerem46(e.target.value === '' ? 0 : Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-bold bg-white text-slate-900"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                      <span className="text-[11px] font-bold text-slate-800 block">Tenaga Pendidik & Pendukung</span>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] font-semibold text-slate-600">Guru</span>
                          <input
                            type="number"
                            min={0}
                            value={formGuru}
                            onChange={(e) => setFormGuru(e.target.value === '' ? 0 : Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-bold bg-white text-slate-900"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-slate-600">Tendik</span>
                          <input
                            type="number"
                            min={0}
                            value={formTendik}
                            onChange={(e) => setFormTendik(e.target.value === '' ? 0 : Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-bold bg-white text-slate-900"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : isPosyanduCategory ? (
                  /* CONDITIONAL BRANCH B: POSYANDU / KOMUNITAS 3B */
                  <div className="space-y-2.5 animate-fadeIn bg-slate-50/80 p-3 rounded-lg border border-slate-200">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <span className="text-[10px] font-semibold text-slate-600">Balita Laki-laki</span>
                        <input
                          type="number"
                          min={0}
                          value={formBalitaLaki}
                          onChange={(e) => setFormBalitaLaki(e.target.value === '' ? 0 : Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-bold bg-white text-slate-900"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-slate-600">Balita Perempuan</span>
                        <input
                          type="number"
                          min={0}
                          value={formBalitaPerem}
                          onChange={(e) => setFormBalitaPerem(e.target.value === '' ? 0 : Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-bold bg-white text-slate-900"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-slate-600">Ibu Hamil (Bumil)</span>
                        <input
                          type="number"
                          min={0}
                          value={formBumil}
                          onChange={(e) => setFormBumil(e.target.value === '' ? 0 : Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-bold bg-white text-slate-900"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-slate-600">Ibu Menyusui (Busui)</span>
                        <input
                          type="number"
                          min={0}
                          value={formBusui}
                          onChange={(e) => setFormBusui(e.target.value === '' ? 0 : Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-bold bg-white text-slate-900"
                        />
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-medium text-slate-500">Pendamping: Kader Posyandu (Opsional)</span>
                      <input
                        type="number"
                        min={0}
                        value={formKaderPosyandu}
                        onChange={(e) => setFormKaderPosyandu(e.target.value === '' ? 0 : Number(e.target.value))}
                        className="w-full sm:w-1/2 px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-semibold bg-white text-slate-800"
                      />
                    </div>
                  </div>
                ) : (
                  /* CONDITIONAL BRANCH C: OTHER SCHOOL CATEGORIES */
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 animate-fadeIn bg-slate-50/80 p-3 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-600">Siswa Laki-laki</span>
                      <input
                        type="number"
                        min={0}
                        value={formPria}
                        onChange={(e) => setFormPria(e.target.value === '' ? 0 : Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-bold bg-white text-slate-900"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-600">Siswa Perempuan</span>
                      <input
                        type="number"
                        min={0}
                        value={formWanita}
                        onChange={(e) => setFormWanita(e.target.value === '' ? 0 : Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-bold bg-white text-slate-900"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-600">Guru / Kader</span>
                      <input
                        type="number"
                        min={0}
                        value={formGuru}
                        onChange={(e) => setFormGuru(e.target.value === '' ? 0 : Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-bold bg-white text-slate-900"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-600">Tendik</span>
                      <input
                        type="number"
                        min={0}
                        value={formTendik}
                        onChange={(e) => setFormTendik(e.target.value === '' ? 0 : Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-bold bg-white text-slate-900"
                      />
                    </div>
                  </div>
                )}

                {/* Summary Helper Badge / Ringkasan Porsi */}
                <div className="bg-slate-100 p-2.5 rounded-md border border-slate-200 text-[11px] font-medium text-slate-700 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Info size={14} className="text-slate-500 shrink-0" />
                    <span>
                      <strong className="text-slate-900 font-bold">Ringkasan Porsi:</strong> {portionSummary.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Kontak & Pimpinan (Dynamic Labels based on Category) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isPosyanduCategory ? 'Nama Bidan Desa / Ketua Kader Posyandu *' : 'Nama Pimpinan / Kepala Sekolah *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formPimpinan}
                    onChange={(e) => setFormPimpinan(e.target.value)}
                    placeholder={isPosyanduCategory ? "Contoh: Bidan Nurul / Ibu Bidan Siti" : "Contoh: SUBANDI, S.Pd"}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">No. HP / Telepon *</label>
                  <input
                    type="text"
                    required
                    value={formHp}
                    onChange={(e) => setFormHp(e.target.value)}
                    placeholder="081234567890"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email (Opsional)</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="email@lembaga.id"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-1.5 bg-white border border-slate-300 rounded-md font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-bold shadow-2xs transition flex items-center gap-1.5"
                >
                  {saving ? <RotateCw size={14} className="animate-spin" /> : <Plus size={14} />}
                  <span>{saving ? 'Menyimpan...' : 'Simpan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Danger Delete Confirmation Dialog */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 animate-fadeIn">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
              <ShieldAlert size={20} className="text-slate-800" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Konfirmasi Hapus Kelompok</h3>
                <p className="text-[11px] text-slate-500">Tindakan menghapus data master.</p>
              </div>
            </div>

            <div className="p-5 space-y-3 text-xs text-slate-700">
              <p>Apakah Anda yakin ingin menghapus kelompok ini?</p>
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <p className="font-bold text-slate-900">{deleteConfirmItem.nama}</p>
                <p className="text-[11px] text-slate-500 font-mono">NPSN/REG: {deleteConfirmItem.npsnReg}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button 
                onClick={() => setDeleteConfirmItem(null)} 
                disabled={isDeleting}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Batal
              </button>
              <button 
                onClick={confirmDeleteGroup} 
                disabled={isDeleting} 
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? <RotateCw size={13} className="animate-spin" /> : <Trash2 size={13} />}
                <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BNBA Modal Drawer */}
      {activeBnbaGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-2 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-200 animate-fadeIn h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <span>Rincian BNBA</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-700">{activeBnbaGroup.nama}</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Daftar penerima manfaat By Name By Address terverifikasi.</p>
              </div>
              <button onClick={() => setActiveBnbaGroup(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>

            <div className="p-3 border-b border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs font-semibold text-slate-700">
                Terisi: <strong className="text-slate-900">{bnbaList.length}</strong> / Target: <strong className="text-slate-900">{activeBnbaGroup.totalTarget}</strong>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={bnbaSearch}
                  onChange={(e) => setBnbaSearch(e.target.value)}
                  placeholder="Cari NIK / Nama..."
                  className="px-3 py-1.5 border border-slate-300 rounded-md text-xs bg-white"
                />

                {/* Hidden File Input for Excel Import */}
                <input
                  type="file"
                  id="bnba-excel-input"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileImportChange}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  title="Unduh Template Excel BNBA"
                  className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                >
                  <FileDown size={14} className="text-slate-600" />
                  <span>Download Template</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportBnbaExcel}
                  title="Ekspor Data BNBA ke File Excel (.xlsx)"
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                >
                  <FileSpreadsheet size={14} className="text-white" />
                  <span>Ekspor Excel</span>
                </button>

                <label
                  htmlFor="bnba-excel-input"
                  title="Import Data dari File Excel/CSV"
                  className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                >
                  <Upload size={14} className="text-slate-600" />
                  <span>Import Excel</span>
                </label>

                {/* Dynamic Bulk Action Buttons */}
                {selectedBnbaIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setBulkDeleteType('selected')
                      setShowBulkDeleteConfirmModal(true)
                    }}
                    title="Hapus baris BNBA yang dipilih"
                    className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs animate-fadeIn"
                  >
                    <Trash2 size={14} />
                    <span>Hapus Terpilih ({selectedBnbaIds.length})</span>
                  </button>
                )}

                {bnbaList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setBulkDeleteType('all')
                      setShowBulkDeleteConfirmModal(true)
                    }}
                    title="Kosongkan seluruh data BNBA kelompok ini"
                    className="px-2.5 py-1.5 bg-white border border-rose-300 hover:bg-rose-50 text-rose-700 rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                  >
                    <Trash2 size={14} className="text-rose-600" />
                    <span>Hapus Semua</span>
                  </button>
                )}

                <button 
                  onClick={handleOpenAddBnbaModal} 
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                >
                  <UserPlus size={13} /> + Tambah BNBA
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                      <th className="py-2.5 px-3 text-center w-10">
                        <input
                          type="checkbox"
                          checked={filteredBnbaList.length > 0 && selectedBnbaIds.length === filteredBnbaList.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBnbaIds(filteredBnbaList.map(item => item.id))
                            } else {
                              setSelectedBnbaIds([])
                            }
                          }}
                          className="rounded border-slate-300 text-slate-900 focus:ring-slate-800 cursor-pointer"
                          title="Pilih Semua Data BNBA"
                        />
                      </th>
                      <th className="py-2.5 px-3 text-center">NO</th>
                      <th className="py-2.5 px-3">NIK / NISN</th>
                      <th className="py-2.5 px-3">NAMA PENERIMA</th>
                      <th className="py-2.5 px-3">TANGGAL LAHIR</th>
                      <th className="py-2.5 px-3 text-center">JK</th>
                      <th className="py-2.5 px-3">NAMA ORTU</th>
                      <th className="py-2.5 px-3 text-center">POSISI</th>
                      <th className="py-2.5 px-3 text-center">KELAS</th>
                      <th className="py-2.5 px-3 text-center">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredBnbaList.length > 0 ? (
                      filteredBnbaList.map((row, idx) => {
                        const isSelected = selectedBnbaIds.includes(row.id)
                        return (
                          <tr key={row.id} className={`hover:bg-slate-50 transition ${isSelected ? 'bg-amber-50/60' : ''}`}>
                            <td className="py-2.5 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedBnbaIds(prev => [...prev, row.id])
                                  } else {
                                    setSelectedBnbaIds(prev => prev.filter(id => id !== row.id))
                                  }
                                }}
                                className="rounded border-slate-300 text-slate-900 focus:ring-slate-800 cursor-pointer"
                              />
                            </td>
                            <td className="py-2.5 px-3 text-center text-slate-500">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-mono font-semibold">{row.nisn_nik}</td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">{row.nama_lengkap}</td>
                            <td className="py-2.5 px-3 font-mono">{row.tanggal_lahir}</td>
                            <td className="py-2.5 px-3 text-center">{row.jenis_kelamin}</td>
                            <td className="py-2.5 px-3">{row.nama_ortu}</td>
                            <td className="py-2.5 px-3 text-center">{row.posisi}</td>
                            <td className="py-2.5 px-3 text-center font-mono">{row.kelas}</td>
                            <td className="py-2.5 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button 
                                  onClick={() => handleOpenEditBnbaModal(row)} 
                                  title="Edit Data BNBA"
                                  className="p-1 text-slate-500 hover:text-amber-600 transition cursor-pointer"
                                >
                                  <Edit size={13} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteBnba(row.id)} 
                                  title="Hapus Data BNBA"
                                  className="p-1 text-slate-500 hover:text-rose-600 transition cursor-pointer"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-slate-400">Belum ada data BNBA.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Bulk Delete (Selected / Clear All) */}
      {showBulkDeleteConfirmModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-fadeIn">
            <div className="p-4 border-b border-slate-200 bg-rose-50 flex items-center gap-3">
              <ShieldAlert size={22} className="text-rose-600 shrink-0" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {bulkDeleteType === 'all' ? 'Peringatan: Kosongkan Seluruh Data BNBA' : 'Konfirmasi Hapus Terpilih'}
                </h3>
                <p className="text-[11px] text-slate-500">Tindakan ini menghapus data secara permanen di database.</p>
              </div>
            </div>

            <div className="p-5 space-y-3 text-xs text-slate-700">
              {bulkDeleteType === 'selected' ? (
                <p className="leading-relaxed">
                  Apakah Anda yakin ingin menghapus <strong className="text-rose-600 font-bold">{selectedBnbaIds.length}</strong> data BNBA yang dipilih dari kelompok <strong className="text-slate-900">{activeBnbaGroup?.nama}</strong>?
                </p>
              ) : (
                <p className="leading-relaxed text-rose-700 bg-rose-50 p-3 rounded-lg border border-rose-200">
                  <strong>PERINGATAN KERAS!</strong> Anda akan menghapus <strong className="font-bold text-rose-900">seluruh {bnbaList.length} data BNBA</strong> untuk kelompok <strong className="font-bold text-slate-900">{activeBnbaGroup?.nama}</strong>. Tindakan ini tidak dapat dibatalkan!
                </p>
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => { setShowBulkDeleteConfirmModal(false); setBulkDeleteType(null); }}
                disabled={isBulkDeleting}
                className="px-3.5 py-1.5 bg-white border border-slate-300 rounded-md font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteBulkDelete}
                disabled={isBulkDeleting}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md font-bold text-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isBulkDeleting ? <RotateCw size={13} className="animate-spin" /> : <Trash2 size={13} />}
                <span>{isBulkDeleting ? 'Menghapus...' : bulkDeleteType === 'all' ? 'Ya, Kosongkan Semua' : `Hapus ${selectedBnbaIds.length} Data`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit BNBA Form Modal */}
      {showAddBnbaModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingBnbaItem ? 'Edit Data BNBA' : 'Tambah Data BNBA'}
              </h3>
              <button onClick={() => { setShowAddBnbaModal(false); setEditingBnbaItem(null); }} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
            <form onSubmit={handleSaveBnbaItem} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">NIK / NISN *</label>
                <input type="text" required value={bnbaNisnNik} onChange={(e) => setBnbaNisnNik(e.target.value)} className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Penerima *</label>
                <input type="text" required value={bnbaNama} onChange={(e) => setBnbaNama(e.target.value)} className="w-full px-3 py-1.5 border border-slate-300 rounded font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Lahir *</label>
                  <input type="date" required value={bnbaTglLahir} onChange={(e) => setBnbaTglLahir(e.target.value)} className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono bg-white" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Kelamin (JK) *</label>
                  <select value={bnbaJk} onChange={(e) => setBnbaJk(e.target.value as any)} className="w-full px-3 py-1.5 border border-slate-300 rounded font-semibold bg-white">
                    <option value="L">L - Laki-laki</option>
                    <option value="P">P - Perempuan</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Ortu / Wali</label>
                <input type="text" value={bnbaOrtu} onChange={(e) => setBnbaOrtu(e.target.value)} className="w-full px-3 py-1.5 border border-slate-300 rounded" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Posisi *</label>
                  <select value={bnbaPosisi} onChange={(e) => setBnbaPosisi(e.target.value as any)} className="w-full px-3 py-1.5 border border-slate-300 rounded font-semibold bg-white">
                    <option value="Siswa">Siswa</option>
                    <option value="Tendik">Tendik / Guru</option>
                    <option value="Balita">Balita</option>
                    <option value="Bumil">Bumil</option>
                    <option value="Busui">Busui</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kelas</label>
                  <input type="text" value={bnbaKelas} onChange={(e) => setBnbaKelas(e.target.value)} className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono" />
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button type="button" onClick={() => { setShowAddBnbaModal(false); setEditingBnbaItem(null); }} className="px-3 py-1.5 bg-white border border-slate-300 rounded text-slate-700 font-semibold cursor-pointer">Batal</button>
                <button type="submit" disabled={savingBnba} className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold cursor-pointer flex items-center gap-1.5">
                  {savingBnba && <RotateCw size={13} className="animate-spin" />}
                  <span>{savingBnba ? 'Menyimpan...' : editingBnbaItem ? 'Simpan Perubahan' : 'Simpan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Preview & Confirmation Modal */}
      {showImportConfirmModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 animate-fadeIn my-auto max-h-[90vh] flex flex-col text-xs">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={18} className="text-slate-800" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Konfirmasi Import Data BNBA</h3>
                  <p className="text-[11px] text-slate-500">Ditemukan <strong className="text-slate-900">{importPreviewData.length}</strong> baris data BNBA yang terverifikasi valid.</p>
                </div>
              </div>
              <button onClick={() => { setShowImportConfirmModal(false); setImportPreviewData([]); }} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-3 bg-slate-50">
              <p className="text-slate-600 font-medium">
                Data yang akan diimpor ke kelompok <strong className="text-slate-900">{activeBnbaGroup?.nama}</strong>:
              </p>

              {/* Scrollable Container with max-h-[380px] and sticky top-0 header */}
              <div className="max-h-[380px] overflow-y-auto overflow-x-auto border border-slate-200 rounded-lg scrollbar-thin">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase z-10 shadow-2xs">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-10">#</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">NIK / NISN</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">NAMA LENGKAP</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">TGL LAHIR</th>
                      <th className="py-2.5 px-3 text-center whitespace-nowrap">JK</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">ORTU / WALI</th>
                      <th className="py-2.5 px-3 text-center whitespace-nowrap">POSISI</th>
                      <th className="py-2.5 px-3 text-center whitespace-nowrap">KELAS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white font-medium">
                    {importPreviewData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="py-2 px-3 text-slate-400 text-center font-bold">{idx + 1}</td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-800">{row.nisn_nik}</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{row.nama_lengkap}</td>
                        <td className="py-2 px-3 font-mono text-slate-800 font-semibold">{row.tanggal_lahir}</td>
                        <td className="py-2 px-3 text-center font-bold text-slate-800">
                          {row.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                        </td>
                        <td className="py-2 px-3 text-slate-700">{row.nama_ortu}</td>
                        <td className="py-2 px-3 text-center font-semibold text-slate-700">{row.posisi}</td>
                        <td className="py-2 px-3 text-center font-mono text-slate-700">{row.kelas}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => { setShowImportConfirmModal(false); setImportPreviewData([]); }}
                disabled={isImporting}
                className="px-4 py-1.5 bg-white border border-slate-300 rounded-md font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmExecuteImport}
                disabled={isImporting}
                className="px-5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-bold transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isImporting ? <RotateCw size={14} className="animate-spin" /> : <Upload size={14} />}
                <span>{isImporting ? 'Mengimpor Data...' : `Ya, Impor ${importPreviewData.length} Data`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official BGN Distribution Control Sheet Print Modal */}
      <LembarDistribusiPrint
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
      />
    </div>
  )
}
