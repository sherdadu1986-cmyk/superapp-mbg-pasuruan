"use client"
import React, { useState, useEffect } from 'react'
import { 
  Users, 
  School, 
  CookingPot, 
  UserCheck, 
  Bell, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Wallet,
  Receipt,
  FileCheck,
  Heart,
  Activity,
  Flame,
  Truck,
  Package,
  Layers,
  MapPin,
  ShieldCheck
} from 'lucide-react'

interface UserAccount {
  name: string;
  role: string;
  initials: string;
}

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('sppg_user')
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  const role = currentUser?.role || 'Kepala SPPG'
  const userName = currentUser?.name || 'Admin Dapur'

  // Render dynamic dashboard based on user role
  switch (role) {
    case 'Akuntan':
      return <AkuntanDashboard userName={userName} role={role} />
    case 'Ahli Gizi':
      return <AhliGiziDashboard userName={userName} role={role} />
    case 'Aslap':
      return <AslapDashboard userName={userName} role={role} />
    case 'Kepala SPPG':
    default:
      return <KepalaSPPGDashboard userName={userName} role={role} />
  }
}

// -------------------------------------------------------------
// 1. KEPALA SPPG / GENERAL MONITORING DASHBOARD
// -------------------------------------------------------------
function KepalaSPPGDashboard({ userName, role }: { userName: string; role: string }) {
  const menuItems = [
    { name: 'Nasi Putih', category: 'Karbohidrat' },
    { name: 'Ayam Kecap', category: 'Protein Utama' },
    { name: 'Tumis Wortel & Buncis', category: 'Serat & Vitamin' },
    { name: 'Pisang Mas', category: 'Buah Penutup' },
    { name: 'Susu Segar UHT', category: 'Pelengkap Gizi' }
  ]

  const notifications = [
    { type: 'warning', text: 'Stok Kritis: Beras tersisa 120 Kg (Batas aman: 500 Kg)' },
    { type: 'warning', text: 'Stok Kritis: Daging Ayam tersisa 15 Kg (Batas aman: 200 Kg)' },
    { type: 'warning', text: 'Stok Kritis: Susu UHT tersisa 50 Liter (Batas aman: 300 Liter)' },
    { type: 'info', text: 'Seluruh relawan Shift Pagi (46 Orang) telah melakukan presensi masuk' },
    { type: 'info', text: 'Rute 1 (Wonorejo Barat) telah berhasil tiba di sekolah tujuan' }
  ]

  return (
    <div className="space-y-6 text-gray-800">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sugeng Rawuh, {userName}! 👋</h1>
        <p className="text-gray-500 text-xs mt-1">Manajemen Dapur SPPG Pasuruan Wonorejo • Peran: {role}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Penerima Manfaat" value="3.214 anak" icon={<Users size={18} />} />
        <MetricCard label="Jumlah Sekolah" value="17 Sekolah" icon={<School size={18} />} />
        <MetricCard label="Porsi Diproduksi" value="3.214 Porsi" icon={<CookingPot size={18} />} />
        <MetricCard label="Relawan Hadir" value="46 / 48 Orang" icon={<UserCheck size={18} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-150 pb-2">🍱 Menu Hari Ini</h2>
            <div className="divide-y divide-gray-100">
              {menuItems.map((item, idx) => (
                <div key={idx} className="py-3 flex justify-between items-center text-sm font-medium">
                  <span>{item.name}</span>
                  <span className="text-xs text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded">{item.category}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-150 pb-2">⚙️ Progress Operasional</h2>
            <ProgressBar label="Progress Produksi" subLabel="Status: 85% - Tahap Packing" val={85} />
            <ProgressBar label="Progress Distribusi" subLabel="7 dari 10 Rute Selesai" val={70} />
          </div>
        </div>

        <div className="lg:col-span-1">
          <NotificationPanel notifications={notifications} />
        </div>
      </div>
    </div>
  )
}

// -------------------------------------------------------------
// 2. AKUNTAN / FINANCIAL FOCUS DASHBOARD
// -------------------------------------------------------------
function AkuntanDashboard({ userName, role }: { userName: string; role: string }) {
  const transactions = [
    { po: 'PO-2026-001', desc: 'Restock Beras C4 (500 Kg)', cost: 'Rp 6.500.000', status: 'Dalam Pengiriman', style: 'text-amber-600 bg-amber-50 border-amber-100' },
    { po: 'PO-2026-002', desc: 'Restock Daging Ayam (200 Kg)', cost: 'Rp 7.000.000', status: 'Menunggu Pembayaran', style: 'text-rose-600 bg-rose-50 border-rose-100' },
    { po: 'PO-2026-003', desc: 'Restock Susu Cair (300 Liter)', cost: 'Rp 4.500.000', status: 'Selesai Dibayar', style: 'text-emerald-600 bg-emerald-50 border-emerald-100' }
  ]

  const notifications = [
    { type: 'warning', text: 'Tagihan PO-2026-002 Daging Ayam (Rp 7.000.000) jatuh tempo dalam 2 hari' },
    { type: 'warning', text: 'Ambang batas kas operasional mendekati limit aman harian' },
    { type: 'info', text: 'Laporan arus kas belanja dapur bulan Juni telah di-approve Kepala SPPG' },
    { type: 'info', text: 'Dana hibah logistik termin ke-2 Kabupaten Pasuruan telah masuk' }
  ]

  return (
    <div className="space-y-6 text-gray-800">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sugeng Rawuh, {userName}! 👋</h1>
        <p className="text-gray-500 text-xs mt-1">Manajemen Dapur SPPG Pasuruan Wonorejo • Peran: {role}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Anggaran Masuk" value="Rp 45.000.000" icon={<Wallet size={18} />} />
        <MetricCard label="Dana Terpakai" value="Rp 18.000.000" icon={<TrendingUp size={18} />} />
        <MetricCard label="Tagihan Belum Bayar" value="3 Invoice" icon={<Receipt size={18} />} />
        <MetricCard label="PO Pengadaan Aktif" value="2 PO Aktif" icon={<FileCheck size={18} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-150 pb-2">💳 Pengadaan & Tagihan PO Gudang</h2>
            <div className="divide-y divide-gray-100">
              {transactions.map((item, idx) => (
                <div key={idx} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm font-semibold">
                  <div>
                    <h3 className="text-gray-800">{item.desc}</h3>
                    <p className="text-xs text-gray-400 font-medium mt-1">Nomor PO: {item.po} • Estimasi: {item.cost}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded text-xs font-bold border ${item.style}`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-150 pb-2">📊 Realisasi Pengeluaran Bulan Ini</h2>
            <ProgressBar label="Alokasi Dana Belanja Bahan Pokok" subLabel="Terpakai Rp 18.000.000 dari total pagu Rp 45.000.500" val={40} />
          </div>
        </div>

        <div className="lg:col-span-1">
          <NotificationPanel notifications={notifications} />
        </div>
      </div>
    </div>
  )
}

// -------------------------------------------------------------
// 3. AHLI GIZI / NUTRITION & QUALITY CONTROL DASHBOARD
// -------------------------------------------------------------
function AhliGiziDashboard({ userName, role }: { userName: string; role: string }) {
  const nutritionDetails = [
    { food: 'Nasi Putih', qty: '200 gram', details: 'Karbohidrat 50g, Energi 180 Kkal, Protein 3g' },
    { food: 'Ayam Kecap Fillet', qty: '100 gram', details: 'Protein 22g, Lemak 8g, Energi 160 Kkal' },
    { food: 'Tumis Wortel & Buncis', qty: '80 gram', details: 'Serat 4g, Vitamin A/C, Energi 50 Kkal' },
    { food: 'Pisang Mas', qty: '1 Buah', details: 'Energi 90 Kkal, Kalium 350mg, Vitamin B6' },
    { food: 'Susu Segar UHT', qty: '200 ml', details: 'Energi 200 Kkal, Kalsium 120mg, Protein 6g' }
  ]

  const notifications = [
    { type: 'info', text: 'Uji Retensi Sampel Porsi Hari Ini telah disimpan di Chiller (Suhu: 3.2°C)' },
    { type: 'info', text: 'Uji Organoleptik (Rasa, Aroma, Tekstur) makan siang dinyatakan lulus SOP' },
    { type: 'info', text: 'Suhu penerimaan daging ayam broiler di gudang basah stabil di 1.8°C' },
    { type: 'warning', text: 'Area cuci peralatan wastafel dapur memerlukan sanitasi tambahan sore ini' }
  ]

  return (
    <div className="space-y-6 text-gray-800">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sugeng Rawuh, {userName}! 👋</h1>
        <p className="text-gray-500 text-xs mt-1">Manajemen Dapur SPPG Pasuruan Wonorejo • Peran: {role}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Rata-rata Energi" value="680 Kkal / Porsi" icon={<Flame size={18} />} />
        <MetricCard label="Kandungan Protein" value="31 gram" icon={<Heart size={18} />} />
        <MetricCard label="Susu Distribusi" value="3.214 Kotak" icon={<Activity size={18} />} />
        <MetricCard label="Skor Higienitas" value="98%" icon={<ShieldCheck size={18} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-150 pb-2">🥗 Kandungan Nutrisi Menu Harian</h2>
            <div className="divide-y divide-gray-100">
              {nutritionDetails.map((item, idx) => (
                <div key={idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-sm font-medium">
                  <div>
                    <h3 className="text-gray-800 font-bold">{item.food}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{item.details}</p>
                  </div>
                  <span className="text-xs text-gray-400 bg-gray-50 border border-gray-200 px-2 py-1 rounded">
                    Takaran: {item.qty}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-150 pb-2">📊 Komposisi Makronutrisi Hari Ini</h2>
            <ProgressBar label="Karbohidrat (Target: 50-60%)" subLabel="Aktual: 55%" val={55} />
            <ProgressBar label="Protein (Target: 15-22%)" subLabel="Aktual: 20%" val={20} />
            <ProgressBar label="Lemak (Target: 20-30%)" subLabel="Aktual: 25%" val={25} />
          </div>
        </div>

        <div className="lg:col-span-1">
          <NotificationPanel notifications={notifications} />
        </div>
      </div>
    </div>
  )
}

// -------------------------------------------------------------
// 4. ASLAP / OPERATIONAL & LOGISTICS DASHBOARD
// -------------------------------------------------------------
function AslapDashboard({ userName, role }: { userName: string; role: string }) {
  const routes = [
    { route: 'Rute 1 - Wonorejo Barat', driver: 'Budi Santoso', stops: 'SDN 1 Wonorejo, SDN 3 Wonorejo', time: '07:15', status: 'Tiba', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    { route: 'Rute 2 - Wonorejo Timur', driver: 'Edi Wibowo', stops: 'SDN 2 Wonorejo, SMPN 1 Wonorejo', time: '07:30', status: 'Kirim', color: 'text-amber-600 bg-amber-50 border-amber-100' },
    { route: 'Rute 3 - Wonorejo Utara', driver: 'Slamet Rahardjo', stops: 'SDN Cobanblimbing 1, 2', time: '07:45', status: 'Siap', color: 'text-slate-500 bg-slate-50 border-slate-100' }
  ]

  const notifications = [
    { type: 'warning', text: 'Rute 3 bersiap loading muatan makanan ke armada pick-up' },
    { type: 'warning', text: '2 relawan tim packing belum presensi (Persiapan Shift Sore)' },
    { type: 'info', text: 'Suhu hotbox pengantaran Rute 2 stabil di angka 62°C (Aman & Sesuai SOP)' },
    { type: 'info', text: 'Pengiriman Rute 1 (450 Box) di SDN 1 Wonorejo sukses diterima Komite' }
  ]

  return (
    <div className="space-y-6 text-gray-800">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sugeng Rawuh, {userName}! 👋</h1>
        <p className="text-gray-500 text-xs mt-1">Manajemen Dapur SPPG Pasuruan Wonorejo • Peran: {role}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Porsi Ter-packing" value="2.730 / 3.214 Box" icon={<Package size={18} />} />
        <MetricCard label="Rute Terkirim" value="7 / 10 Selesai" icon={<Truck size={18} />} />
        <MetricCard label="Armada Aktif" value="3 Pick-up" icon={<Layers size={18} />} />
        <MetricCard label="Relawan Hadir" value="46 / 48 Orang" icon={<UserCheck size={18} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-150 pb-2">🚚 Pemantauan Armada Rute Distribusi</h2>
            <div className="divide-y divide-gray-100">
              {routes.map((item, idx) => (
                <div key={idx} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm font-semibold">
                  <div className="flex items-start gap-3">
                    <MapPin className="text-gray-400 mt-1" size={16} />
                    <div>
                      <h3 className="text-gray-800">{item.route}</h3>
                      <p className="text-xs text-gray-400 font-medium">Tujuan: {item.stops} • Driver: {item.driver}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded text-xs font-bold border ${item.color}`}>
                    {item.status === 'Tiba' ? 'Tiba di Lokasi' : item.status === 'Kirim' ? 'Sedang Dikirim' : 'Persiapan'} ({item.time})
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-150 pb-2">⚙️ Progress Dapur Lapangan</h2>
            <ProgressBar label="Sanitasi Dapur Awal" subLabel="Selesai 100%" val={100} />
            <ProgressBar label="Proses Memasak Utama" subLabel="Selesai 100%" val={100} />
            <ProgressBar label="Packing & Labeling Gizi" subLabel="Progress: 85% Selesai" val={85} />
            <ProgressBar label="Logistik Rute Log Pengiriman" subLabel="Progress: 70% Selesai" val={70} />
          </div>
        </div>

        <div className="lg:col-span-1">
          <NotificationPanel notifications={notifications} />
        </div>
      </div>
    </div>
  )
}

// -------------------------------------------------------------
// HELPER REUSABLE SUB-COMPONENTS
// -------------------------------------------------------------

function MetricCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 flex items-center justify-between">
      <div>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">{label}</span>
        <span className="text-2xl font-extrabold text-gray-800 mt-1 block">{value}</span>
      </div>
      <div className="p-3 bg-gray-50 text-gray-500 rounded-lg border border-gray-200">
        {icon}
      </div>
    </div>
  )
}

function ProgressBar({ label, subLabel, val }: { label: string; subLabel: string; val: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm font-semibold">
        <span>{label}</span>
        <span className="text-gray-500 font-normal">{subLabel}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-gray-400 rounded-full" style={{ width: `${val}%` }} />
      </div>
    </div>
  )
}

function NotificationPanel({ notifications }: { notifications: { type: string; text: string }[] }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4 h-full">
      <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-150 pb-2 flex items-center gap-2">
        <Bell size={16} className="text-gray-500" />
        Pusat Notifikasi
      </h2>
      
      <div className="space-y-3">
        {notifications.map((item, idx) => (
          <div 
            key={idx} 
            className={`p-3.5 rounded border text-xs font-semibold flex items-start gap-2.5 leading-relaxed ${
              item.type === 'warning' 
                ? 'bg-red-50/50 border-red-100 text-red-700' 
                : 'bg-gray-50 border-gray-200 text-gray-600'
            }`}
          >
            {item.type === 'warning' ? (
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5 text-red-500" />
            ) : (
              <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5 text-gray-400" />
            )}
            <span>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
