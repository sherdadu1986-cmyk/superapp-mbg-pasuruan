'use client'
import { useState, useCallback, createContext, useContext, ReactNode } from 'react'
import { CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning'

interface Toast {
    id: number
    type: ToastType
    title: string
    message?: string
}

interface ToastContextType {
    toast: (type: ToastType, title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextType>({ toast: () => { } })

export const useToast = () => useContext(ToastContext)

let toastId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const addToast = useCallback((type: ToastType, title: string, message?: string) => {
        const id = ++toastId
        setToasts(prev => [...prev, { id, type, title, message }])
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
    }, [])

    const removeToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id))

    const icons = {
        success: <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />,
        error: <XCircle size={18} className="text-red-500 shrink-0" />,
        warning: <AlertTriangle size={18} className="text-amber-500 shrink-0" />,
    }

    const colors = {
        success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        error: 'bg-red-50 border-red-200 text-red-800',
        warning: 'bg-amber-50 border-amber-200 text-amber-800',
    }

    return (
        <ToastContext.Provider value={{ toast: addToast }}>
            {children}
            {/* TOAST CONTAINER */}
            <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none" style={{ maxWidth: 380 }}>
                {toasts.map(t => (
                    <div
                        key={t.id}
                        className={`pointer-events-auto border rounded-xl px-4 py-3 shadow-lg flex items-start gap-3 ${colors[t.type]}`}
                        style={{ animation: 'toastSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                    >
                        {icons[t.type]}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold">{t.title}</p>
                            {t.message && <p className="text-xs opacity-70 mt-0.5">{t.message}</p>}
                        </div>
                        <button onClick={() => removeToast(t.id)} className="opacity-40 hover:opacity-100 transition-opacity shrink-0">
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
            <style>{`
        @keyframes toastSlideIn {
          0% { opacity: 0; transform: translateX(40px) scale(0.95); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>
        </ToastContext.Provider>
    )
}
