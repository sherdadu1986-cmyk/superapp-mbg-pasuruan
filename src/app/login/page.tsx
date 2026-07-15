"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, ArrowRight, UserCheck } from 'lucide-react'

interface UserAccount {
  name: string;
  role: string;
  initials: string;
}

export default function LoginPage() {
  const router = useRouter()
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null)

  const accounts: UserAccount[] = [
    { name: 'Ahmad Sayyidani Haqiqi, S.Pd.', role: 'Kepala SPPG', initials: 'AH' },
    { name: 'Pos Keamanan Dapur',            role: 'Keamanan',    initials: 'KM' }
  ]

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    localStorage.setItem('sppg_user', JSON.stringify(selectedUser))
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <div className="mx-auto h-12 w-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white text-2xl shadow-sm border border-emerald-500">
          🍽️
        </div>
        <h2 className="text-2xl font-extrabold text-gray-800 tracking-tight">Dapur SPPG Pasuruan</h2>
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Kecamatan Wonorejo</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 border border-gray-200 sm:rounded-lg sm:px-10 space-y-6">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Pilih Akun Simulasi</h3>
            <p className="text-xs text-gray-400">Silakan pilih salah satu peran di bawah ini untuk mengakses sistem dapur.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="grid grid-cols-1 gap-3">
              {accounts.map((acc) => {
                const isSelected = selectedUser?.role === acc.role
                return (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => setSelectedUser(acc)}
                    className={`w-full flex items-center gap-4 p-3 rounded-lg border text-left transition duration-150 cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 ring-1 ring-emerald-500'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 bg-white text-gray-700'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      isSelected ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {acc.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{acc.name}</p>
                      <p className="text-xs text-gray-500 font-medium">{acc.role}</p>
                    </div>
                    {isSelected && (
                      <UserCheck size={16} className="text-emerald-600 flex-shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>

            <button
              type="submit"
              disabled={!selectedUser}
              className={`w-full flex justify-center items-center gap-2 py-3 px-4 rounded-lg text-sm font-bold uppercase tracking-wider transition duration-150 cursor-pointer ${
                selectedUser
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 shadow-sm'
                  : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
              }`}
            >
              Masuk Ke Dashboard
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <Shield size={12} /> Keamanan Sistem Terjamin
          </div>
        </div>
      </div>
    </div>
  )
}
