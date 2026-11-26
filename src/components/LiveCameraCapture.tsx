'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Camera,
  RefreshCw,
  SwitchCamera,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Clock,
  X,
  ArrowLeft,
  ArrowRight,
  Lock
} from 'lucide-react'
import { loadCanvasImage, getJakartaNowParts } from '@/lib/timemarkWatermark'

export interface CapturedPhotoItem {
  id: string
  previewUrl: string
  img: HTMLImageElement
  capturedAt: string
}

interface LiveCameraCaptureProps {
  isOpen: boolean
  onClose: () => void
  photos: CapturedPhotoItem[]
  onCapturePhoto: (item: CapturedPhotoItem) => void
  onRemovePhoto: (id: string) => void
  onMovePhoto: (index: number, direction: -1 | 1) => void
  maxPhotos?: number
  gpsLocked: boolean
  gpsStatusMessage: string
  gpsAccuracyMeters: number | null
  onRefreshGps: () => void
  isRefreshingGps: boolean
  liveClockWithSeconds: string
  liveDateStr: string
  divisiLabel: string
  liveAddress: string
}

export default function LiveCameraCapture({
  isOpen,
  onClose,
  photos,
  onCapturePhoto,
  onRemovePhoto,
  onMovePhoto,
  maxPhotos = 6,
  gpsLocked,
  gpsStatusMessage,
  gpsAccuracyMeters,
  onRefreshGps,
  isRefreshingGps,
  liveClockWithSeconds,
  liveDateStr,
  divisiLabel,
  liveAddress
}: LiveCameraCaptureProps) {
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [cameraReady, setCameraReady] = useState<boolean>(false)
  const [cameraError, setCameraError] = useState<string>('')
  const [isCapturing, setIsCapturing] = useState<boolean>(false)
  const [shutterFlash, setShutterFlash] = useState<boolean>(false)
  const [retrySeed, setRetrySeed] = useState<number>(0)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const stopStreamTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop()
        } catch {}
      })
      streamRef.current = null
    }
    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null
      } catch {}
    }
    setCameraReady(false)
  }, [])

  // Start / switch / clean up WebRTC camera stream
  useEffect(() => {
    if (!isOpen) {
      stopStreamTracks()
      return
    }

    let cancelled = false

    const initCamera = async () => {
      stopStreamTracks()
      setCameraError('')
      setCameraReady(false)

      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getUserMedia !== 'function'
      ) {
        setCameraError(
          'Browser atau perangkat ini tidak mendukung akses kamera langsung (getUserMedia). Pastikan menggunakan browser modern melalui koneksi HTTPS atau perangkat berkamera.'
        )
        return
      }

      const attempts: MediaStreamConstraints[] = [
        {
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        },
        {
          video: { facingMode },
          audio: false
        },
        {
          video: true,
          audio: false
        }
      ]

      let acquiredStream: MediaStream | null = null
      let lastErr: any = null

      for (const constraints of attempts) {
        try {
          acquiredStream = await navigator.mediaDevices.getUserMedia(constraints)
          break
        } catch (err: any) {
          lastErr = err
          const errName = err?.name || ''
          // Do not retry weaker constraints on explicit permission denial or missing hardware
          if (
            errName === 'NotAllowedError' ||
            errName === 'PermissionDeniedError' ||
            errName === 'NotFoundError' ||
            errName === 'DevicesNotFoundError' ||
            errName === 'NotReadableError' ||
            errName === 'SecurityError'
          ) {
            break
          }
        }
      }

      if (cancelled) {
        if (acquiredStream) {
          acquiredStream.getTracks().forEach((t) => {
            try {
              t.stop()
            } catch {}
          })
        }
        return
      }

      if (!acquiredStream) {
        const errName = lastErr?.name || ''
        if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
          setCameraError(
            'Izin akses kamera ditolak oleh pengguna/browser. Klik ikon izin situs di address bar browser, aktifkan Kamera, lalu tekan "Coba Lagi".'
          )
        } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
          setCameraError(
            'Kamera tidak ditemukan pada perangkat ini. Pastikan HP/laptop memiliki kamera aktif yang terhubung.'
          )
        } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
          setCameraError(
            'Kamera sedang dipakai oleh aplikasi lain (Zoom/Meet/Kamera bawaan). Tutup aplikasi tersebut lalu tekan "Coba Lagi".'
          )
        } else if (errName === 'SecurityError') {
          setCameraError(
            'Akses kamera memerlukan koneksi HTTPS yang aman.'
          )
        } else {
          setCameraError(
            `Gagal membuka kamera (${lastErr?.message || 'Perangkat kamera tidak tersedia'}).`
          )
        }
        return
      }

      streamRef.current = acquiredStream
      const videoEl = videoRef.current
      if (videoEl) {
        videoEl.srcObject = acquiredStream
        try {
          await videoEl.play()
        } catch {}
        setCameraReady(true)
      }
    }

    initCamera()

    const handlePageHide = () => {
      stopStreamTracks()
    }
    window.addEventListener('pagehide', handlePageHide)

    return () => {
      cancelled = true
      window.removeEventListener('pagehide', handlePageHide)
      stopStreamTracks()
    }
  }, [isOpen, facingMode, retrySeed, stopStreamTracks])

  const handleCloseCamera = () => {
    stopStreamTracks()
    onClose()
  }

  const handleSwitchCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
  }

  const handleCaptureFrame = async () => {
    if (!gpsLocked) return
    if (photos.length >= maxPhotos) return
    const video = videoRef.current
    if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
      return
    }

    setIsCapturing(true)
    setShutterFlash(true)
    setTimeout(() => setShutterFlash(false), 180)

    try {
      const vw = video.videoWidth
      const vh = video.videoHeight
      const maxEdge = 1600
      const ratio = Math.min(1, maxEdge / Math.max(vw, vh))
      const targetW = Math.max(1, Math.round(vw * ratio))
      const targetH = Math.max(1, Math.round(vh * ratio))

      const captureCanvas = document.createElement('canvas')
      captureCanvas.width = targetW
      captureCanvas.height = targetH
      const ctx = captureCanvas.getContext('2d')
      if (!ctx) return

      if (facingMode === 'user') {
        ctx.translate(targetW, 0)
        ctx.scale(-1, 1)
      }
      ctx.drawImage(video, 0, 0, targetW, targetH)

      const dataUrl = captureCanvas.toDataURL('image/jpeg', 0.92)
      const img = await loadCanvasImage(dataUrl)
      const jakartaNow = getJakartaNowParts()

      onCapturePhoto({
        id: `cam-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        previewUrl: dataUrl,
        img,
        capturedAt: jakartaNow.timeWithSeconds
      })
    } finally {
      setIsCapturing(false)
    }
  }

  if (!isOpen) return null

  const canShoot = gpsLocked && cameraReady && !cameraError && photos.length < maxPhotos && !isCapturing

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Kamera Laporan Relawan Langsung"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col my-auto">
        {/* Top Modal Header */}
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-2 bg-slate-50">
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1.5 rounded-lg bg-blue-700 text-white shrink-0">
              <Camera size={16} />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 truncate">
                Kamera Laporan Langsung (Multi-Cekrek)
              </h3>
              <p className="text-[11px] text-slate-500 truncate">
                {divisiLabel} · Foto langsung tanpa galeri ({photos.length}/{maxPhotos})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCloseCamera}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer shrink-0"
          >
            <X size={15} />
            <span className="hidden sm:inline">Tutup</span>
          </button>
        </div>

        {/* Live Timestamp + GPS Lock Strip Above Viewfinder */}
        <div className="px-4 py-2.5 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="inline-flex items-center gap-2 font-mono font-bold text-slate-900 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
            <Lock size={12} className="text-blue-700 shrink-0" />
            <Clock size={12} className="text-slate-600 shrink-0" />
            <span>
              {liveClockWithSeconds} WIB · {liveDateStr}
            </span>
          </div>

          {gpsLocked ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-[11px]">
              <CheckCircle2 size={13} className="text-emerald-700 shrink-0" />
              <span>
                GPS Terkunci{gpsAccuracyMeters !== null ? ` • Akurasi ±${gpsAccuracyMeters}m` : ''}
              </span>
            </span>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-100 border border-rose-300 text-rose-900 font-bold text-[11px]">
                <AlertTriangle size={13} className="text-rose-700 shrink-0" />
                <span>GPS Belum Aktif / Izin Ditolak</span>
              </span>
              <button
                type="button"
                onClick={onRefreshGps}
                disabled={isRefreshingGps}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-700 hover:bg-rose-800 text-white text-[11px] font-bold cursor-pointer disabled:opacity-60"
              >
                <RefreshCw size={11} className={isRefreshingGps ? 'animate-spin' : ''} />
                <span>Aktifkan / Refresh GPS</span>
              </button>
            </div>
          )}
        </div>

        {/* Camera Viewfinder */}
        <div className="relative bg-slate-950 aspect-[4/3] sm:aspect-video w-full flex items-center justify-center overflow-hidden">
          {cameraError ? (
            <div className="p-6 text-center max-w-md space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-300 mx-auto flex items-center justify-center">
                <AlertTriangle size={24} />
              </div>
              <p className="text-sm font-bold text-white">Kamera Tidak Dapat Diakses</p>
              <p className="text-xs text-slate-300 leading-relaxed">{cameraError}</p>
              <button
                type="button"
                onClick={() => setRetrySeed((s) => s + 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
              >
                <RefreshCw size={14} />
                <span>Coba Buka Kamera Lagi</span>
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                onCanPlay={() => setCameraReady(true)}
                className={`w-full h-full object-cover ${
                  facingMode === 'user' ? 'scale-x-[-1]' : ''
                }`}
              />

              {!cameraReady && (
                <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center gap-2 text-white text-xs font-semibold">
                  <RefreshCw size={20} className="animate-spin text-blue-400" />
                  <span>Menghidupkan kamera {facingMode === 'environment' ? 'belakang' : 'depan'}...</span>
                </div>
              )}

              {/* Bottom Viewfinder Info Overlay */}
              <div className="absolute bottom-2 inset-x-2 flex items-end justify-between gap-2 pointer-events-none">
                <div className="bg-slate-900/75 backdrop-blur-xs text-white px-2.5 py-1.5 rounded-lg text-[10px] sm:text-[11px] max-w-[75%] border border-white/15">
                  <p className="font-bold flex items-center gap-1 truncate">
                    <MapPin size={11} className="text-amber-400 shrink-0" />
                    <span className="truncate">
                      {gpsLocked ? liveAddress : gpsStatusMessage || 'Menunggu lokasi GPS aktif...'}
                    </span>
                  </p>
                </div>
                <span className="bg-amber-400 text-slate-950 font-extrabold text-[11px] px-2.5 py-1 rounded-md shadow">
                  {photos.length}/{maxPhotos} FOTO
                </span>
              </div>

              {shutterFlash && (
                <div className="absolute inset-0 bg-white/85 pointer-events-none transition-opacity" />
              )}
            </>
          )}
        </div>

        {/* GPS Warning Banner inside Camera if GPS is not locked */}
        {!gpsLocked && (
          <div className="px-4 py-2.5 bg-rose-50 border-b border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-rose-900">
            <div className="flex items-start gap-2">
              <AlertTriangle size={15} className="text-rose-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Tombol Cekrek dinonaktifkan sampai GPS aktif.</p>
                <p className="text-[11px] text-rose-800">
                  {gpsStatusMessage} Nyalakan GPS / Layanan Lokasi pada HP lalu tekan &ldquo;Aktifkan / Refresh GPS&rdquo;.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onRefreshGps}
              disabled={isRefreshingGps}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold cursor-pointer disabled:opacity-60"
            >
              <RefreshCw size={12} className={isRefreshingGps ? 'animate-spin' : ''} />
              <span>Aktifkan / Refresh GPS</span>
            </button>
          </div>
        )}

        {/* Camera Controls Bar */}
        <div className="p-4 bg-white space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={handleSwitchCamera}
              disabled={Boolean(cameraError)}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 text-xs font-bold cursor-pointer"
            >
              <SwitchCamera size={16} />
              <span>
                Switch Kamera ({facingMode === 'environment' ? 'Belakang' : 'Depan'})
              </span>
            </button>

            <button
              type="button"
              onClick={handleCaptureFrame}
              disabled={!canShoot}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 disabled:text-slate-500 text-white text-sm font-extrabold shadow-sm transition active:scale-[0.99] cursor-pointer disabled:cursor-not-allowed"
            >
              <Camera size={19} />
              <span>
                {photos.length >= maxPhotos
                  ? `Batas Maksimal Tercapai (${photos.length}/${maxPhotos})`
                  : !gpsLocked
                    ? `Cekrek Foto (${photos.length}/${maxPhotos}) — Wajib GPS Aktif`
                    : `Cekrek Foto (${photos.length}/${maxPhotos})`}
              </span>
            </button>

            <button
              type="button"
              onClick={handleCloseCamera}
              disabled={photos.length === 0}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold cursor-pointer disabled:cursor-not-allowed"
            >
              <CheckCircle2 size={16} />
              <span>Selesai &amp; Susun Kolase ({photos.length})</span>
            </button>
          </div>

          {/* Captured Shots Strip */}
          {photos.length > 0 ? (
            <div className="space-y-1.5 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span>Hasil Jepretan Sesi Ini ({photos.length}/{maxPhotos})</span>
                <span className="text-slate-500 font-normal">
                  Hapus jika buram, atau geser urutan untuk mengatur posisi kolase
                </span>
              </div>
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {photos.map((shot, idx) => (
                  <div
                    key={shot.id}
                    className="relative w-24 shrink-0 rounded-lg overflow-hidden border border-slate-300 bg-slate-100"
                  >
                    <div className="aspect-square relative">
                      <img
                        src={shot.previewUrl}
                        alt={`Jepretan ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-slate-900/80 text-white text-[10px] font-bold">
                        #{idx + 1}
                      </span>
                    </div>
                    <div className="p-1 bg-white border-t border-slate-200 flex items-center justify-between gap-1">
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => onMovePhoto(idx, -1)}
                          disabled={idx === 0}
                          className="p-1 rounded hover:bg-slate-100 text-slate-700 disabled:opacity-30 cursor-pointer"
                          title="Geser kiri"
                        >
                          <ArrowLeft size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onMovePhoto(idx, 1)}
                          disabled={idx === photos.length - 1}
                          className="p-1 rounded hover:bg-slate-100 text-slate-700 disabled:opacity-30 cursor-pointer"
                          title="Geser kanan"
                        >
                          <ArrowRight size={11} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemovePhoto(shot.id)}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold cursor-pointer"
                        title="Hapus foto"
                      >
                        <Trash2 size={10} />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-2 px-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
              Arahkan kamera ke objek kegiatan dan tekan <strong>Cekrek Foto</strong> (ambil 1–6 foto berturut-turut dalam satu sesi tanpa menutup kamera).
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
