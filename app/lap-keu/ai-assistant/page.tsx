"use client"

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot,
  Send,
  Sparkles,
  User,
  RefreshCw,
  HelpCircle,
  TrendingUp,
  ShieldCheck,
  PiggyBank,
  Wallet
} from 'lucide-react'
import { FinoraStore, formatRupiah } from '@/lib/finora-store'

interface Message {
  id: string
  sender: 'user' | 'assistant'
  text: string
  timestamp: string
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-1',
      sender: 'assistant',
      text: 'Halo! Saya **Finora AI**, Financial Advisor pribadi Anda. Saya telah menganalisis seluruh data saldo, pengeluaran, dan budget Anda bulan **September 2026**.\n\nAda yang ingin Anda tanyakan tentang kesehatan keuangan Anda hari ini?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [summary, setSummary] = useState<any>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const s = FinoraStore.getSummary()
    setSummary(s)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || inputText
    if (!query.trim() || isLoading) return

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, userMsg])
    if (!textToSend) setInputText('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/fin-ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          context: summary
        })
      })

      const data = await res.json()
      if (data.success && data.reply) {
        const aiMsg: Message = {
          id: `a-${Date.now()}`,
          sender: 'assistant',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
        setMessages(prev => [...prev, aiMsg])
      } else {
        throw new Error(data.error || 'Response empty')
      }
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'Maaf, terjadi kendala saat menghubungkan ke sistem AI. Silakan coba kembali.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  const suggestionPills = [
    'Bulan ini uang saya paling banyak habis untuk apa?',
    'Berapa sisa budget & cash flow aktif September 2026?',
    'Apakah dana darurat saya sudah aman untuk 6 bulan?',
    'Berikan saran alokasi investasi sisa cash flow.'
  ]

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-12 flex flex-col h-[calc(100vh-6rem)]">
      {/* Header Banner */}
      <div className="flex items-center justify-between p-4 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
            <Bot size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-white text-base">Finora AI Financial Advisor</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                LIVE CONTEXT ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Model cerdas dengan pengetahuan penuh transaksi & portofolio riil Anda.
            </p>
          </div>
        </div>

        {summary && (
          <div className="hidden sm:flex items-center gap-3 text-xs bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-slate-400">Saldo:</span>
            <span className="font-bold text-emerald-400">{formatRupiah(summary.activeBalance)}</span>
          </div>
        )}
      </div>

      {/* Suggestion Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-shrink-0 scrollbar-none">
        {suggestionPills.map((pill, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSend(pill)}
            className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer hover:border-emerald-500/40"
          >
            <Sparkles size={12} className="text-emerald-400" />
            <span>{pill}</span>
          </button>
        ))}
      </div>

      {/* Chat Messages Feed Container */}
      <div className="flex-1 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-4 overflow-y-auto space-y-4 shadow-2xl backdrop-blur-xl scrollbar-thin">
        {messages.map((m) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.sender === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-bold flex items-center justify-center flex-shrink-0 text-xs shadow-md">
                🤖
              </div>
            )}

            <div
              className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/10 rounded-tr-none'
                  : 'bg-slate-950/90 border border-slate-800 text-slate-200 rounded-tl-none space-y-2'
              }`}
            >
              <div className="whitespace-pre-line font-sans">
                {m.text.split('\n').map((line, lIdx) => {
                  if (line.startsWith('- ') || line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. ')) {
                    return (
                      <div key={lIdx} className="py-0.5">
                        {line}
                      </div>
                    )
                  }
                  return <p key={lIdx}>{line}</p>
                })}
              </div>

              <div
                className={`text-[9px] mt-1 text-right ${
                  m.sender === 'user' ? 'text-slate-800 font-semibold' : 'text-slate-500'
                }`}
              >
                {m.timestamp}
              </div>
            </div>

            {m.sender === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-200 font-bold flex items-center justify-center flex-shrink-0 text-xs border border-slate-700">
                <User size={14} />
              </div>
            )}
          </motion.div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start items-center">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs animate-bounce">
              🤖
            </div>
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
              <RefreshCw size={14} className="animate-spin text-emerald-400" />
              <span>Finora AI sedang menganalisis data keuangan...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSend()
        }}
        className="flex items-center gap-2 flex-shrink-0"
      >
        <input
          type="text"
          placeholder="Tanyakan analisis keuangan, tips budget, atau sisa dana..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 shadow-xl"
        />
        <button
          type="submit"
          disabled={isLoading || !inputText.trim()}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition cursor-pointer flex items-center gap-1.5"
        >
          <Send size={15} />
          <span className="hidden sm:inline">Kirim</span>
        </button>
      </form>
    </div>
  )
}
