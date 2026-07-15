"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, ArrowRight, UserCheck, Lock, Delete, CheckCircle } from 'lucide-react'

interface UserAccount {
  name: string;
  role: string;
  initials: string;
  pin: string;
  roleSlug: string;
}

export default function LoginPage() {
  const router = useRouter()
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null)
  const [showPinModal, setShowPinModal] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)
  const [pinSuccess, setPinSuccess] = useState(false)

  const accounts: UserAccount[] = [
    { name: 'Ahmad Sayyidani Haqiqi, S.Pd.', role: 'Kepala SPPG',  initials: 'AH', pin: '111111', roleSlug: 'kepalasppg' },
    { name: 'Pos Keamanan Dapur',            role: 'Keamanan',      initials: 'KM', pin: '555555', roleSlug: 'keamanan'   },
  ]

  const handleSelectAccount = (acc: UserAccount) => {
    setSelectedUser(acc)
    setPinInput('')
    setPinError(false)
    setPinSuccess(false)
    setShowPinModal(true)
  }

  const handlePinDigit = (digit: string) => {
    if (pinInput.length >= 6 || pinSuccess) return
    const newPin = pinInput + digit
    setPinInput(newPin)
    setPinError(false)

    if (newPin.length === 6) {
      setTimeout(() => {
        if (newPin === selectedUser?.pin) {
          setPinSuccess(true)
          localStorage.setItem('sppg_user', JSON.stringify({
            name: selectedUser.name,
            role: selectedUser.role,
            initials: selectedUser.initials,
          }))
          setTimeout(() => {
            router.push(`/login/${selectedUser.roleSlug}`)
          }, 700)
        } else {
          setPinError(true)
          setPinInput('')
        }
      }, 200)
    }
  }

  const handleDeleteDigit = () => {
    if (pinSuccess) return
    setPinInput(prev => prev.slice(0, -1))
    setPinError(false)
  }

  const handleCloseModal = () => {
    setShowPinModal(false)
    setSelectedUser(null)
    setPinInput('')
    setPinError(false)
    setPinSuccess(false)
  }

  const pinDigits = ['1','2','3','4','5','6','7','8','9','','0','⌫']

  return (
    <>
      {/* ─── PIN Modal Overlay ─── */}
      {showPinModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 space-y-5 border border-gray-100">

            {/* Header */}
            <div className="text-center space-y-1">
              <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center font-extrabold text-lg mb-2 ${
                pinSuccess ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {pinSuccess ? <CheckCircle size={24} /> : selectedUser.initials}
              </div>
              <h3 className="text-sm font-extrabold text-gray-800">{selectedUser.name}</h3>
              <p className="text-xs text-gray-400 font-medium">{selectedUser.role}</p>
            </div>

            {/* PIN prompt */}
            <div className="text-center">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center justify-center gap-1.5 mb-4">
                <Lock size={11} />
                {pinSuccess ? 'PIN Benar — Mengalihkan...' : 'Masukkan PIN 6 Digit'}
              </p>

              {/* PIN Dots */}
              <div className="flex justify-center gap-3 mb-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full border-2 transition-all duration-150 ${
                      pinSuccess
                        ? 'bg-emerald-500 border-emerald-500'
                        : pinError
                          ? 'bg-red-400 border-red-400 animate-bounce'
                          : i < pinInput.length
                            ? 'bg-slate-800 border-slate-800'
                            : 'bg-transparent border-gray-300'
                    }`}
                  />
                ))}
              </div>
              {pinError && (
                <p className="text-[11px] text-red-500 font-bold mt-2">PIN salah. Coba lagi.</p>
              )}
            </div>

            {/* Numpad */}
            {!pinSuccess && (
              <div className="grid grid-cols-3 gap-2">
                {pinDigits.map((digit, idx) => {
                  if (digit === '') return <div key={idx} />
                  const isDelete = digit === '⌫'
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => isDelete ? handleDeleteDigit() : handlePinDigit(digit)}
                      className={`h-12 rounded-xl text-base font-bold transition-all duration-150 cursor-pointer select-none ${
                        isDelete
                          ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          : 'bg-gray-50 text-gray-800 hover:bg-emerald-50 hover:text-emerald-700 border border-gray-200 active:scale-95'
                      }`}
                    >
                      {isDelete ? <Delete size={18} className="mx-auto" /> : digit}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Cancel */}
            {!pinSuccess && (
              <button
                onClick={handleCloseModal}
                className="w-full text-center text-xs text-gray-400 hover:text-gray-600 font-semibold py-1 transition cursor-pointer"
              >
                Batal / Ganti Akun
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── Login Page ─── */}
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white text-3xl shadow border border-emerald-500">
            🍽️
          </div>
          <h2 className="text-2xl font-extrabold text-gray-800 tracking-tight">Dapur SPPG Pasuruan</h2>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Kecamatan Wonorejo · Sistem Manajemen Dapur</p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 border border-gray-200 sm:rounded-2xl sm:px-10 space-y-6 shadow-sm">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Pilih Akun Anda</h3>
              <p className="text-xs text-gray-400">Klik salah satu akun lalu masukkan PIN 6 digit untuk masuk.</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {accounts.map((acc) => {
                const isSelected = selectedUser?.role === acc.role
                return (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => handleSelectAccount(acc)}
                    className={`w-full flex items-center gap-4 p-3 rounded-xl border text-left transition duration-150 cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500'
                        : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/40 bg-white text-gray-700'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                      isSelected ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {acc.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{acc.name}</p>
                      <p className="text-xs text-gray-500 font-medium">{acc.role}</p>
                    </div>
                    {isSelected
                      ? <UserCheck size={16} className="text-emerald-600 flex-shrink-0" />
                      : <Lock size={14} className="text-gray-300 flex-shrink-0" />
                    }
                  </button>
                )
              })}
            </div>

            {/* Main CTA Button */}
            <button
              type="button"
              disabled={!selectedUser}
              onClick={() => selectedUser && handleSelectAccount(selectedUser)}
              className={`w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-bold uppercase tracking-wider transition duration-150 ${
                selectedUser
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 shadow-sm cursor-pointer'
                  : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
              }`}
            >
              Masuk Ke Aplikasi
              <ArrowRight size={16} />
            </button>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <Shield size={12} /> Sistem Keamanan PIN Aktif
              <button 
                type="button" 
                onClick={() => {
                  if (confirm('Apakah Anda yakin ingin mereset database (localStorage)?')) {
                    localStorage.clear();
                    localStorage.setItem('sppg_reset_done_v3', 'true');
                    alert('Database berhasil direset!');
                    window.location.reload();
                  }
                }}
                className="opacity-0 hover:opacity-20 transition ml-1 cursor-default text-[8px]"
                title="Reset Database"
              >
                ⚙️
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
