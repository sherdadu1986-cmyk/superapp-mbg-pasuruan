"use client"
import React, { useState, useEffect, useMemo } from 'react'
import { 
  Search, RotateCw, Plus, X, Check, Building2, Info, Eye, Edit, Trash2, 
  Bookmark, FileSpreadsheet, FileText, Printer, ChevronLeft, 
  ChevronRight, UserPlus, Upload, ShieldAlert
} from 'lucide-react'
import { 
  fetchKelompokPenerimaManfaatList, 
  saveKelompokPenerimaManfaat, 
  fetchBnbaList,
  saveBnbaItem,
  deleteBnbaItem,
  type KelompokPenerimaManfaat,
  type PenerimaManfaatBnba
} from '@/lib/data-helpers'

export interface DetailKpmItem {
  id: string
  no: number
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
}

// Initial Data Seed (Flat & Clean Schema)
const INITIAL_AUDIT_ITEMS: DetailKpmItem[] = [
  {
    id: 'kpm-1',
    no: 1,
    jenis: 'Ibu Menyusui',
    nama: 'POSYANDU WONOREJO',
    npsnReg: '11111111111111',
    kepemilikan: 'Negeri',
    kecamatan: 'WONOREJO',
    kelDesa: 'WONOREJO',
    alamat: 'Wonorejo Pasuruan',
    pria: 0,
    wanita: 67,
    guru: 0,
    tendik: 0,
    totalTarget: 67,
    rincianTerisi: 64,
    keteranganStatus: 'Kurang',
    keteranganMsg: '↓ Kurang 3 orang',
    pimpinan: 'IBU NURUL HAYATI',
    hp: '085784249845',
    email: 'posyandu.wonorejo1@gmail.com',
    status: 'Aktif'
  },
  {
    id: 'kpm-2',
    no: 2,
    jenis: 'Bayi Dibawah Lima Tahun',
    nama: 'POSYANDU WONOREJO',
    npsnReg: '00000000000000',
    kepemilikan: 'Negeri',
    kecamatan: 'WONOREJO',
    kelDesa: 'WONOREJO',
    alamat: 'Wonorejo Pasuruan',
    pria: 179,
    wanita: 129,
    guru: 0,
    tendik: 0,
    totalTarget: 308,
    rincianTerisi: 293,
    keteranganStatus: 'Kurang',
    keteranganMsg: '↓ Kurang 15 orang',
    pimpinan: 'IBU KHANIFAH',
    hp: '081234567890',
    email: 'posyandu.balita@wonorejo.id',
    status: 'Aktif'
  },
  {
    id: 'kpm-3',
    no: 3,
    jenis: 'Ibu Hamil',
    nama: 'POSYANDU WONOREJO',
    npsnReg: '09909090',
    kepemilikan: 'Negeri',
    kecamatan: 'WONOREJO',
    kelDesa: 'WONOREJO',
    alamat: 'Wonorejo Pasuruan',
    pria: 0,
    wanita: 32,
    guru: 0,
    tendik: 0,
    totalTarget: 32,
    rincianTerisi: 31,
    keteranganStatus: 'Kurang',
    keteranganMsg: '↓ Kurang 1 orang',
    pimpinan: 'IBU ROFI\'AH',
    hp: '081987654321',
    email: 'bumil.wonorejo@gmail.com',
    status: 'Aktif'
  },
  {
    id: 'kpm-4',
    no: 4,
    jenis: 'Madrasah Tsanawiyah',
    nama: 'MTSN 4 PASURUAN',
    npsnReg: '20582152',
    kepemilikan: 'Negeri',
    kecamatan: 'WONOREJO',
    kelDesa: 'WONOREJO',
    alamat: 'Alun-Alun Besaran',
    pria: 216,
    wanita: 172,
    guru: 0,
    tendik: 40,
    totalTarget: 428,
    rincianTerisi: 0,
    keteranganStatus: 'Belum ada detail',
    keteranganMsg: '⚠️ Belum ada detail',
    pimpinan: 'AKHMAD FAUZI, S.Ag, M.PdI',
    hp: '081333444555',
    email: 'mtsn4pasuruan@kemenag.go.id',
    status: 'Aktif'
  },
  {
    id: 'kpm-5',
    no: 5,
    jenis: 'SMP',
    nama: 'SMPN 2 WONOREJO',
    npsnReg: '20541400',
    kepemilikan: 'Negeri',
    kecamatan: 'WONOREJO',
    kelDesa: 'WONOREJO',
    alamat: 'Jl. Raya Wonorejo No. 12',
    pria: 139,
    wanita: 85,
    guru: 0,
    tendik: 20,
    totalTarget: 244,
    rincianTerisi: 0,
    keteranganStatus: 'Belum ada detail',
    keteranganMsg: '⚠️ Belum ada detail',
    pimpinan: 'BAPAK SUGENG',
    hp: '081233445566',
    email: 'smpn2wonorejo@kemdikbud.go.id',
    status: 'Aktif'
  },
  {
    id: 'kpm-6',
    no: 6,
    jenis: 'TK',
    nama: 'KB MELATI DESA WONOSARI',
    npsnReg: '69880987',
    kepemilikan: 'Swasta',
    kecamatan: 'WONOREJO',
    kelDesa: 'WONOSARI',
    alamat: 'Wonosari Wonorejo Pasuruan',
    pria: 4,
    wanita: 2,
    guru: 0,
    tendik: 3,
    totalTarget: 9,
    rincianTerisi: 9,
    keteranganStatus: 'Sesuai',
    keteranganMsg: '✓ Sesuai',
    pimpinan: 'Susi yusniasari',
    hp: '085233112233',
    email: 'kbmelati.wonosari@gmail.com',
    status: 'Aktif'
  },
  {
    id: 'kpm-7',
    no: 7,
    jenis: 'TK',
    nama: 'TK PKK IV DESA WONOSARI',
    npsnReg: '20552433',
    kepemilikan: 'Swasta',
    kecamatan: 'WONOREJO',
    kelDesa: 'WONOSARI',
    alamat: 'Wonosari Wonorejo Pasuruan',
    pria: 11,
    wanita: 14,
    guru: 0,
    tendik: 3,
    totalTarget: 28,
    rincianTerisi: 28,
    keteranganStatus: 'Sesuai',
    keteranganMsg: '✓ Sesuai',
    pimpinan: 'NUR AFIFAH, S.Pd',
    hp: '081399887766',
    email: 'tkpkk4wonosari@gmail.com',
    status: 'Aktif'
  }
]

export default function KelompokPenerimaManfaatPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [perPage, setPerPage] = useState(15)
  const [loading, setLoading] = useState(false)
  const [showAlert, setShowAlert] = useState(true)
  const [activeFilter, setActiveFilter] = useState<'Semua' | 'Belum ada detail' | 'Kurang' | 'Sesuai' | 'Lebih'>('Semua')

  // Dynamic KPM Data & Supabase List
  const [kpmItems, setKpmItems] = useState<DetailKpmItem[]>(INITIAL_AUDIT_ITEMS)
  const [supabaseKpm, setSupabaseKpm] = useState<KelompokPenerimaManfaat[]>([])
  const [allBnbaRecords, setAllBnbaRecords] = useState<PenerimaManfaatBnba[]>([])

  // Modal Form States
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState<DetailKpmItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Form Fields
  const [formNama, setFormNama] = useState('')
  const [formKategori, setFormKategori] = useState('SD')
  const [formSubKategori, setFormSubKategori] = useState('Balita')
  const [formIdentitas, setFormIdentitas] = useState('')
  const [formKepemilikan, setFormKepemilikan] = useState<'Negeri' | 'Swasta'>('Negeri')
  const [formKecamatan, setFormKecamatan] = useState('WONOREJO')
  const [formKelDesa, setFormKelDesa] = useState('WONOREJO')
  const [formAlamat, setFormAlamat] = useState('Wonorejo Pasuruan')
  const [formPria, setFormPria] = useState(100)
  const [formWanita, setFormWanita] = useState(100)
  const [formGuru, setFormGuru] = useState(10)
  const [formTendik, setFormTendik] = useState(5)
  const [formPimpinan, setFormPimpinan] = useState('')
  const [formHp, setFormHp] = useState('')
  const [formEmail, setFormEmail] = useState('')

  // Delete Confirmation State
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<DetailKpmItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // BNBA Drawer Modal States
  const [activeBnbaGroup, setActiveBnbaGroup] = useState<DetailKpmItem | null>(null)
  const [bnbaList, setBnbaList] = useState<PenerimaManfaatBnba[]>([])
  const [bnbaSearch, setBnbaSearch] = useState('')
  const [showAddBnbaModal, setShowAddBnbaModal] = useState(false)
  const [savingBnba, setSavingBnba] = useState(false)

  // BNBA Form Fields
  const [bnbaNisnNik, setBnbaNisnNik] = useState('')
  const [bnbaNama, setBnbaNama] = useState('')
  const [bnbaTglLahir, setBnbaTglLahir] = useState('15-05-2015')
  const [bnbaJk, setBnbaJk] = useState<'L' | 'P'>('L')
  const [bnbaOrtu, setBnbaOrtu] = useState('')
  const [bnbaPosisi, setBnbaPosisi] = useState<'Siswa' | 'Tendik' | 'Balita' | 'Bumil' | 'Busui'>('Siswa')
  const [bnbaKelas, setBnbaKelas] = useState('Kelas 4')

  const loadData = async () => {
    setLoading(true)
    const [kpmRes, bnbaRes] = await Promise.all([
      fetchKelompokPenerimaManfaatList(),
      fetchBnbaList()
    ])
    setSupabaseKpm(kpmRes)
    setAllBnbaRecords(bnbaRes)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRefresh = () => {
    setIsRefreshing(true)
    loadData()
    setTimeout(() => {
      setIsRefreshing(false)
    }, 600)
  }

  // Real-time calculated dataset combining Supabase & local state
  const fullDataList: DetailKpmItem[] = useMemo(() => {
    const customItems: DetailKpmItem[] = supabaseKpm.map((kpm, idx) => {
      const is3B = kpm.kategori === 'POSYANDU_3B' || kpm.kategori === 'POSYANDU 3B'
      const jenisLabel = is3B 
        ? (kpm.sub_kategori === 'Bumil' ? 'Ibu Hamil' : kpm.sub_kategori === 'Busui' ? 'Ibu Menyusui' : 'Bayi Dibawah Lima Tahun')
        : kpm.kategori

      const bnbaCount = allBnbaRecords.filter(b => b.kelompok_id === kpm.kode || b.kelompok_id === kpm.id).length
      const totalTarget = kpm.jumlah_penerima || 0

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

      return {
        id: kpm.kode || `sp-${idx}`,
        no: INITIAL_AUDIT_ITEMS.length + idx + 1,
        jenis: jenisLabel,
        nama: kpm.nama,
        npsnReg: kpm.identitas_npsn_tmp,
        kepemilikan: 'Negeri',
        kecamatan: 'WONOREJO',
        kelDesa: 'WONOREJO',
        alamat: kpm.wilayah,
        pria: Math.floor(totalTarget / 2),
        wanita: Math.ceil(totalTarget / 2),
        guru: 0,
        tendik: 0,
        totalTarget,
        rincianTerisi: bnbaCount,
        keteranganStatus: ketStatus,
        keteranganMsg: ketMsg,
        pimpinan: 'PENANGGUNG JAWAB KPM',
        hp: '081234567890',
        email: 'kpm.sppg@wonorejo.id',
        status: 'Aktif'
      }
    })

    const combinedMap = new Map<string, DetailKpmItem>()
    kpmItems.forEach(item => {
      // Recalculate BNBA count dynamically
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

      combinedMap.set(item.id, {
        ...item,
        rincianTerisi: rincianVal,
        keteranganStatus: ketStatus,
        keteranganMsg: ketMsg
      })
    })

    customItems.forEach(ci => {
      if (!combinedMap.has(ci.id) && !Array.from(combinedMap.values()).some(x => x.npsnReg === ci.npsnReg)) {
        combinedMap.set(ci.id, ci)
      }
    })

    return Array.from(combinedMap.values())
  }, [kpmItems, supabaseKpm, allBnbaRecords])

  // Real-time Aggregate KPI Calculations (No Dummy Hardcode)
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

  // Open Add Modal
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
    setFormPria(100)
    setFormWanita(100)
    setFormGuru(10)
    setFormTendik(5)
    setFormPimpinan('')
    setFormHp('')
    setFormEmail('')
    setShowAddModal(true)
  }

  // Edit Action
  const handleEditClick = (item: DetailKpmItem) => {
    setEditingItem(item)
    setFormNama(item.nama)
    setFormKategori(item.jenis.includes('Ibu') || item.jenis.includes('Bayi') ? 'POSYANDU 3B' : item.jenis)
    setFormSubKategori(item.jenis.includes('Hamil') ? 'Bumil' : item.jenis.includes('Menyusui') ? 'Busui' : 'Balita')
    setFormIdentitas(item.npsnReg)
    setFormKepemilikan(item.kepemilikan)
    setFormKecamatan(item.kecamatan)
    setFormKelDesa(item.kelDesa)
    setFormAlamat(item.alamat)
    setFormPria(item.pria)
    setFormWanita(item.wanita)
    setFormGuru(item.guru)
    setFormTendik(item.tendik)
    setFormPimpinan(item.pimpinan)
    setFormHp(item.hp)
    setFormEmail(item.email)
    setShowAddModal(true)
  }

  // Delete Action
  const handleDeleteClick = (item: DetailKpmItem) => {
    setDeleteConfirmItem(item)
  }

  const confirmDeleteGroup = () => {
    if (!deleteConfirmItem) return
    setIsDeleting(true)
    setKpmItems(prev => prev.filter(i => i.id !== deleteConfirmItem.id))
    setTimeout(() => {
      setIsDeleting(false)
      setDeleteConfirmItem(null)
    }, 400)
  }

  // Toggle Status Action
  const handleToggleStatus = (item: DetailKpmItem) => {
    const newStatus: 'Aktif' | 'Non-Aktif' = item.status === 'Aktif' ? 'Non-Aktif' : 'Aktif'
    setKpmItems(prev => prev.map(i => i.id === item.id ? { ...i, status: newStatus } : i))
  }

  // Save KPM Group
  const handleSaveKpm = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const is3B = formKategori === 'POSYANDU 3B' || formKategori === 'POSYANDU_3B'
    const totalPenerima = (Number(formPria) || 0) + (Number(formWanita) || 0) + (Number(formGuru) || 0) + (Number(formTendik) || 0)
    
    let identitasVal = formIdentitas.trim()
    if (!identitasVal) {
      identitasVal = is3B ? `REG-3B-${Math.floor(10000 + Math.random() * 90000)}` : `NPSN: ${Math.floor(10000000 + Math.random() * 90000000)}`
    }

    const fullWilayah = `JAWA TIMUR · PASURUAN · ${formKecamatan.trim()} · ${formKelDesa.trim()}`

    if (editingItem) {
      setKpmItems(prev => prev.map(item => item.id === editingItem.id ? {
        ...item,
        nama: formNama.trim(),
        jenis: is3B ? (formSubKategori === 'Bumil' ? 'Ibu Hamil' : formSubKategori === 'Busui' ? 'Ibu Menyusui' : 'Bayi Dibawah Lima Tahun') : formKategori,
        npsnReg: identitasVal,
        kepemilikan: formKepemilikan,
        kecamatan: formKecamatan,
        kelDesa: formKelDesa,
        alamat: formAlamat,
        pria: Number(formPria),
        wanita: Number(formWanita),
        guru: Number(formGuru),
        tendik: Number(formTendik),
        totalTarget: totalPenerima,
        pimpinan: formPimpinan.trim() || item.pimpinan,
        hp: formHp.trim() || item.hp,
        email: formEmail.trim() || item.email,
      } : item))
    } else {
      const randomCode = `K${Math.floor(1000000000 + Math.random() * 9000000000)}`
      const newItem: DetailKpmItem = {
        id: `kpm-new-${Date.now()}`,
        no: kpmItems.length + 1,
        jenis: is3B ? (formSubKategori === 'Bumil' ? 'Ibu Hamil' : formSubKategori === 'Busui' ? 'Ibu Menyusui' : 'Bayi Dibawah Lima Tahun') : formKategori,
        nama: formNama.trim(),
        npsnReg: identitasVal,
        kepemilikan: formKepemilikan,
        kecamatan: formKecamatan,
        kelDesa: formKelDesa,
        alamat: formAlamat,
        pria: Number(formPria),
        wanita: Number(formWanita),
        guru: Number(formGuru),
        tendik: Number(formTendik),
        totalTarget: totalPenerima,
        rincianTerisi: 0,
        keteranganStatus: 'Belum ada detail',
        keteranganMsg: '⚠️ Belum ada detail',
        pimpinan: formPimpinan.trim() || 'PENANGGUNG JAWAB',
        hp: formHp.trim() || '081234567890',
        email: formEmail.trim() || 'kpm.wonorejo@gmail.com',
        status: 'Aktif'
      }

      setKpmItems(prev => [newItem, ...prev])

      const newKpmSupabase: KelompokPenerimaManfaat = {
        nama: formNama.trim(),
        kategori: is3B ? 'POSYANDU_3B' : formKategori,
        sub_kategori: is3B ? formSubKategori : undefined,
        identitas_npsn_tmp: identitasVal,
        kode: randomCode,
        wilayah: fullWilayah,
        jumlah_penerima: totalPenerima,
        status: 'Aktif',
        created_at: new Date().toISOString()
      }
      await saveKelompokPenerimaManfaat(newKpmSupabase)
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
    const list = await fetchBnbaList(group.id)
    setBnbaList(list)

    const is3B = group.jenis.includes('Ibu') || group.jenis.includes('Bayi')
    setBnbaPosisi(is3B ? (group.jenis.includes('Hamil') ? 'Bumil' : group.jenis.includes('Menyusui') ? 'Busui' : 'Balita') : 'Siswa')
    setBnbaKelas(is3B ? '-' : 'Kelas 4')
  }

  const handleOpenAddBnbaModal = () => {
    setBnbaNisnNik(`${Math.floor(1000000000 + Math.random() * 9000000000)}`)
    setBnbaNama('')
    setBnbaTglLahir('12-08-2015')
    setBnbaJk('L')
    setBnbaOrtu('')
    setShowAddBnbaModal(true)
  }

  const handleSaveBnbaItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeBnbaGroup) return
    setSavingBnba(true)

    const newBnba: PenerimaManfaatBnba = {
      id: `bnba-${Date.now()}`,
      kelompok_id: activeBnbaGroup.id,
      nisn_nik: bnbaNisnNik.trim(),
      nama_lengkap: bnbaNama.trim().toUpperCase(),
      tanggal_lahir: bnbaTglLahir.trim(),
      jenis_kelamin: bnbaJk,
      nama_ortu: bnbaOrtu.trim().toUpperCase() || '-',
      posisi: bnbaPosisi,
      kelas: bnbaKelas,
      created_at: new Date().toISOString()
    }

    await saveBnbaItem(newBnba)
    const updatedList = await fetchBnbaList(activeBnbaGroup.id)
    setBnbaList(updatedList)
    setAllBnbaRecords(prev => [newBnba, ...prev.filter(b => b.id !== newBnba.id)])

    setSavingBnba(false)
    setShowAddBnbaModal(false)
  }

  const handleDeleteBnba = async (bnbaId: string) => {
    if (!activeBnbaGroup) return
    await deleteBnbaItem(bnbaId)
    const updatedList = await fetchBnbaList(activeBnbaGroup.id)
    setBnbaList(updatedList)
    setAllBnbaRecords(prev => prev.filter(b => b.id !== bnbaId))
  }

  const filteredBnbaList = useMemo(() => {
    const q = bnbaSearch.toLowerCase()
    return bnbaList.filter(item => 
      item.nama_lengkap.toLowerCase().includes(q) ||
      item.nisn_nik.toLowerCase().includes(q) ||
      item.nama_ortu.toLowerCase().includes(q) ||
      item.posisi.toLowerCase().includes(q)
    )
  }, [bnbaList, bnbaSearch])

  return (
    <div className="space-y-5 font-sans text-slate-800 pb-16">
      {/* 1. Header Atas Halaman (Flat BGN Style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Kelompok Penerima Manfaat
          </h1>
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

      {/* 2. 4 Kartu KPI Metrik (Flat Minimal Design - Border Gray Solid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 flex flex-col justify-between space-y-1 shadow-none">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            Total Kelompok Aktif
          </span>
          <div className="text-2xl font-bold text-slate-800 tracking-tight">
            {stats.totalAktif} <span className="text-xs font-normal text-slate-500">Kelompok</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 flex flex-col justify-between space-y-1 shadow-none">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            Total Target Penerima
          </span>
          <div className="text-2xl font-bold text-slate-800 tracking-tight">
            {stats.totalTarget.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-500">Jiwa</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 flex flex-col justify-between space-y-1 shadow-none">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            Total Rincian Terisi
          </span>
          <div className="text-2xl font-bold text-slate-800 tracking-tight">
            {stats.totalRincian.toLocaleString('id-ID')} <span className="text-xs font-semibold text-emerald-600">({stats.percentageTerisi}%)</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 flex flex-col justify-between space-y-1 shadow-none">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            Belum Dilengkapi
          </span>
          <div className="text-2xl font-bold text-slate-800 tracking-tight">
            {stats.totalBelumDetail} <span className="text-xs font-normal text-slate-500">Kelompok</span>
          </div>
        </div>
      </div>

      {/* 3. Alert Box Banner (Collapsible / Dismissible Flat Style) */}
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

      {/* 4. Filter Status Bar (Flat Gray Pill Buttons) + Export Toolbar */}
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
          <button title="Cetak Data" className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition cursor-pointer">
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
                    <td className="py-3 px-3 text-center font-bold text-slate-400">
                      {idx + 1}
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
                    Tidak ada data Kelompok Penerima Manfaat yang cocok.
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

      {/* Modal Form Tambah / Edit KPM */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-fadeIn my-auto max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-slate-800" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingItem ? 'Edit Kelompok Penerima Manfaat' : 'Form Tambah Kelompok Penerima Manfaat'}
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
                    placeholder="Contoh: SDN WONOREJO V"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs bg-white focus:ring-1 focus:ring-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis / Kategori *</label>
                  <select
                    value={formKategori}
                    onChange={(e) => setFormKategori(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-semibold bg-white"
                  >
                    <option value="KB">KB</option>
                    <option value="PAUD">PAUD</option>
                    <option value="TK">TK</option>
                    <option value="RA">RA</option>
                    <option value="SD">SD</option>
                    <option value="SMP">SMP</option>
                    <option value="SMA">SMA</option>
                    <option value="POSYANDU 3B">POSYANDU 3B</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(formKategori === 'POSYANDU 3B' || formKategori === 'POSYANDU_3B') ? (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Sub Kategori 3B *</label>
                    <select
                      value={formSubKategori}
                      onChange={(e) => setFormSubKategori(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-semibold bg-white"
                    >
                      <option value="Balita">Bayi Dibawah Lima Tahun (Balita)</option>
                      <option value="Bumil">Ibu Hamil (Bumil)</option>
                      <option value="Busui">Ibu Menyusui (Busui)</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">NPSN / Kode *</label>
                    <input
                      type="text"
                      value={formIdentitas}
                      onChange={(e) => setFormIdentitas(e.target.value)}
                      placeholder="20518921"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs bg-white"
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

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block font-semibold text-slate-800">Target Alokasi Penerima *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500">Pria</span>
                    <input
                      type="number"
                      min={0}
                      value={formPria}
                      onChange={(e) => setFormPria(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-bold bg-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Wanita</span>
                    <input
                      type="number"
                      min={0}
                      value={formWanita}
                      onChange={(e) => setFormWanita(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-bold bg-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Guru/Kader</span>
                    <input
                      type="number"
                      min={0}
                      value={formGuru}
                      onChange={(e) => setFormGuru(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-bold bg-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Tendik</span>
                    <input
                      type="number"
                      min={0}
                      value={formTendik}
                      onChange={(e) => setFormTendik(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-bold bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Pimpinan *</label>
                  <input
                    type="text"
                    required
                    value={formPimpinan}
                    onChange={(e) => setFormPimpinan(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">No. HP *</label>
                  <input
                    type="text"
                    required
                    value={formHp}
                    onChange={(e) => setFormHp(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
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
                  <span>{editingItem ? 'Simpan Perubahan' : 'Simpan ke Supabase'}</span>
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
                <p className="text-[11px] text-slate-500 font-mono">NPSN: {deleteConfirmItem.npsnReg}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button onClick={() => setDeleteConfirmItem(null)} className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-700">
                Batal
              </button>
              <button onClick={confirmDeleteGroup} disabled={isDeleting} className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold">
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
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

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={bnbaSearch}
                  onChange={(e) => setBnbaSearch(e.target.value)}
                  placeholder="Cari NIK / Nama..."
                  className="px-3 py-1.5 border border-slate-300 rounded-md text-xs bg-white"
                />
                <button onClick={handleOpenAddBnbaModal} className="px-3 py-1.5 bg-slate-900 text-white rounded-md text-xs font-semibold flex items-center gap-1">
                  <UserPlus size={13} /> + Tambah BNBA
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
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
                      filteredBnbaList.map((row, idx) => (
                        <tr key={row.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 text-center text-slate-500">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-mono font-semibold">{row.nisn_nik}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">{row.nama_lengkap}</td>
                          <td className="py-2.5 px-3 font-mono">{row.tanggal_lahir}</td>
                          <td className="py-2.5 px-3 text-center">{row.jenis_kelamin}</td>
                          <td className="py-2.5 px-3">{row.nama_ortu}</td>
                          <td className="py-2.5 px-3 text-center">{row.posisi}</td>
                          <td className="py-2.5 px-3 text-center font-mono">{row.kelas}</td>
                          <td className="py-2.5 px-3 text-center">
                            <button onClick={() => handleDeleteBnba(row.id)} className="p-1 text-slate-500 hover:text-rose-600">
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-400">Belum ada data BNBA.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add BNBA Form Modal */}
      {showAddBnbaModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Tambah Data BNBA</h3>
              <button onClick={() => setShowAddBnbaModal(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
            <form onSubmit={handleSaveBnbaItem} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">NIK / NISN *</label>
                <input type="text" required value={bnbaNisnNik} onChange={(e) => setBnbaNisnNik(e.target.value)} className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap *</label>
                <input type="text" required value={bnbaNama} onChange={(e) => setBnbaNama(e.target.value)} className="w-full px-3 py-1.5 border border-slate-300 rounded font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tgl Lahir *</label>
                  <input type="text" required value={bnbaTglLahir} onChange={(e) => setBnbaTglLahir(e.target.value)} className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Kelamin *</label>
                  <select value={bnbaJk} onChange={(e) => setBnbaJk(e.target.value as any)} className="w-full px-3 py-1.5 border border-slate-300 rounded font-semibold">
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
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
                  <select value={bnbaPosisi} onChange={(e) => setBnbaPosisi(e.target.value as any)} className="w-full px-3 py-1.5 border border-slate-300 rounded font-semibold">
                    <option value="Siswa">Siswa</option>
                    <option value="Tendik">Tendik</option>
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
                <button type="button" onClick={() => setShowAddBnbaModal(false)} className="px-3 py-1.5 bg-white border border-slate-300 rounded text-slate-700 font-semibold">Batal</button>
                <button type="submit" disabled={savingBnba} className="px-4 py-1.5 bg-slate-900 text-white rounded font-bold">{savingBnba ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
