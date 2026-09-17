'use client'
import { useState, useCallback, createContext, useContext, ReactNode } from 'react'
import { CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning'

export interface ToastOptions {
  type?: ToastType
  title: string
  message?: string
}

export interface ToastItem {
  id: number
  type: ToastType
  title: string
  message?: string
}

interface ToastContextType {
  toast: (typeOrOptions: ToastType | ToastOptions, title?: string, message?: string) => void
  showToast: (optionsOrTitle: ToastOptions | string, type?: ToastType, message?: string) => void
}

const ToastContext = createContext<ToastContextType>({
  toast: () => { },
  showToast: () => { }
})

export const useToast = () => useContext(ToastContext)

let toastId = 0
let globalShowToast: ((type: ToastType, title: string, message?: string) => void) | null = null

export function showToast(optionsOrTitle: ToastOptions | string, typeOrMessage?: ToastType | string, message?: string) {
  if (globalShowToast) {
    if (typeof optionsOrTitle === 'object') {
      globalShowToast(optionsOrTitle.type || 'success', optionsOrTitle.title, optionsOrTitle.message)
    } else if (typeOrMessage === 'success' || typeOrMessage === 'error' || typeOrMessage === 'warning') {
      globalShowToast(typeOrMessage, optionsOrTitle, message)
    } else {
      globalShowToast('success', optionsOrTitle, typeOrMessage)
    }
  }
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const addToast = useCallback((typeOrOptions: ToastType | ToastOptions, title?: string, message?: string) => {
    const id = ++toastId
    let finalType: ToastType = 'success'
    let finalTitle = ''
    let finalMessage: string | undefined = message

    if (typeof typeOrOptions === 'object') {
      finalType = typeOrOptions.type || 'success'
      finalTitle = typeOrOptions.title
      finalMessage = typeOrOptions.message
    } else if (typeOrOptions === 'success' || typeOrOptions === 'error' || typeOrOptions === 'warning') {
      finalType = typeOrOptions
      finalTitle = title || ''
      finalMessage = message
    } else {
      finalTitle = String(typeOrOptions)
    }

    setToasts(prev => [...prev, { id, type: finalType, title: finalTitle, message: finalMessage }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500)
  }, [])

  globalShowToast = (type: ToastType, title: string, message?: string) => {
    addToast(type, title, message)
  }

  const removeToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id))

  const handleShowToast = useCallback((optionsOrTitle: ToastOptions | string, typeOrMessage?: ToastType | string, message?: string) => {
    if (typeof optionsOrTitle === 'object') {
      addToast(optionsOrTitle.type || 'success', optionsOrTitle.title, optionsOrTitle.message)
    } else if (typeOrMessage === 'success' || typeOrMessage === 'error' || typeOrMessage === 'warning') {
      addToast(typeOrMessage, optionsOrTitle, message)
    } else {
      addToast('success', optionsOrTitle, typeOrMessage)
    }
  }, [addToast])

  const icons = {
    success: <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />,
    error: <XCircle size={20} className="text-rose-400 shrink-0 mt-0.5" />,
    warning: <AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" />,
  }

  const colors = {
    success: 'bg-emerald-950/80 backdrop-blur-md border border-emerald-500/40 text-emerald-200 shadow-[0_8px_32px_0_rgba(16,185,129,0.2)]',
    error: 'bg-rose-950/80 backdrop-blur-md border border-rose-500/40 text-rose-200 shadow-[0_8px_32px_0_rgba(244,63,94,0.2)]',
    warning: 'bg-amber-950/80 backdrop-blur-md border border-amber-500/40 text-amber-200 shadow-[0_8px_32px_0_rgba(245,158,11,0.2)]',
  }

  return (
    <ToastContext.Provider value={{ toast: addToast, showToast: handleShowToast }}>
      {children}
      {/* TOAST CONTAINER (Liquid Glassmorphism) */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none" style={{ maxWidth: 420 }}>
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-2xl px-4 py-3.5 flex items-start gap-3 transition-all duration-300 ${colors[t.type]}`}
            style={{ animation: 'toastSlideIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          >
            {icons[t.type]}
            <div className="flex-1 min-w-0 pr-1">
              <p className="text-xs font-extrabold tracking-tight leading-snug">{t.title}</p>
              {t.message && <p className="text-[11px] font-medium opacity-90 mt-0.5 leading-relaxed">{t.message}</p>}
            </div>
            <button onClick={() => removeToast(t.id)} className="opacity-60 hover:opacity-100 transition-opacity shrink-0 p-1 rounded-lg hover:bg-white/10">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes toastSlideIn {
          0% { opacity: 0; transform: translateX(50px) scale(0.9); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>
    </ToastContext.Provider>
  )
}
