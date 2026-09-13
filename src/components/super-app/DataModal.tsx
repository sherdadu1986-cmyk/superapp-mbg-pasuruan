"use client"
import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface DataModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  maxWidth?: string
}

export default function DataModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-lg',
}: DataModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-[60]"
          />

          {/* Modal panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`fixed inset-0 z-[70] flex items-center justify-center p-4`}
          >
            <div className={`bg-white rounded-2xl shadow-2xl border border-gray-200 w-full ${maxWidth} max-h-[90vh] flex flex-col`}>
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">{title}</h3>
                  {subtitle && (
                    <p className="text-[11px] text-gray-400 font-medium">{subtitle}</p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition duration-150 cursor-pointer text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
