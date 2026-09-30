import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const { message, context } = await req.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY

    const systemPrompt = `Anda adalah Finora AI - Senior Financial Advisor & AI Wealth Planner profesional.
Tugas Anda adalah memberikan jawaban ringkas, sangat spesifik, berbasis data riil keuangan pengguna berikut:

Context Keuangan Pengguna Saat Ini (Bulan Aktif September 2026):
- Saldo Aktif Kas & Bank: ${context?.activeBalance || 'Rp 33.750.000'}
- Pemasukan Bulan Ini: ${context?.totalIncomeMonth || 'Rp 23.500.000'}
- Pengeluaran Bulan Ini: ${context?.totalExpenseMonth || 'Rp 7.450.000'}
- Sisa Cash Flow: ${context?.remainingCashFlow || 'Rp 16.050.000'} (Rasio Belanja: ${context?.spendingPercentage || 31}%)
- Total Utang Berjalan: ${context?.totalDebts || 'Rp 4.200.000'}
- Portofolio Investasi: ${context?.investmentTotal || 'Rp 45.000.000'}
- Dana Darurat: ${context?.emergencyTotal || 'Rp 25.000.000'}
- Dana Pensiun DPLK: ${context?.pensionTotal || 'Rp 38.500.000'}
- Total Net Worth: ${context?.netWorth || 'Rp 104.250.000'}

Panduan Respon:
1. Gunakan bahasa Indonesia profesional, ramah, dan solutif.
2. Gunakan angka riil dari context di atas ketika menjelaskan.
3. Berikan saran alokasi keuangan dengan rumus 50/30/20 atau strategi penyehatan cash flow jika ditanya.
4. Gunakan format markdown bersih dengan poin-poin tebal (bullet points).`

    if (apiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [
                    { text: systemPrompt },
                    { text: `Pertanyaan Pengguna: "${message}"` }
                  ]
                }
              ],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1000
              }
            })
          }
        )

        if (response.ok) {
          const resData = await response.json()
          const reply = resData.candidates?.[0]?.content?.parts?.[0]?.text
          if (reply) {
            return NextResponse.json({ success: true, reply })
          }
        }
      } catch (err) {
        console.warn('Gemini Chat API fallback triggered:', err)
      }
    }

    // Heuristic AI Financial Assistant Fallback Engine
    const lowerMsg = message.toLowerCase()
    let reply = ''

    if (lowerMsg.includes('paling banyak habis') || lowerMsg.includes('terbesar') || lowerMsg.includes('pengeluaran')) {
      reply = `**Analisis Pos Pengeluaran Terbesar September 2026:**\n\n` +
        `1. **Rumah & Cicilan:** Rp 3.200.000 *(42.9% dari total pengeluaran)* - Cicilan KPR BTN.\n` +
        `2. **Investasi & DCA:** Rp 2.000.000 *(26.8% dari total pengeluaran)* - Reksadana Bibit.\n` +
        `3. **Kebutuhan Rumah Tangga:** Rp 1.450.000 *(19.4%)* - Belanja bulanan Indomaret & Alfamart.\n` +
        `4. **Tagihan Utilitas:** Rp 850.000 *(11.4%)* - Listrik & Internet.\n\n` +
        `💡 *Tips Finora:* Cash flow Anda bulan ini sangat sehat (rasio belanja **31.7%**). Anda masih memiliki sisa dana sebesar **Rp 16.050.000** yang dapat diputar ke instrumen investasi tambahan.`
    } else if (lowerMsg.includes('budget') || lowerMsg.includes('sisa')) {
      reply = `**Status Budget & Sisa Dana Anda:**\n\n` +
        `- **Pemasukan Bulan Ini:** Rp 23.500.000\n` +
        `- **Pengeluaran Bulan Ini:** Rp 7.450.000\n` +
        `- **Sisa Cash Flow Aktif:** **Rp 16.050.000** *(68.3% dana belum terpakai)*\n\n` +
        `⚠️ **Pos Perhatian:** Kebutuhan Rumah Tangga sudah terpakai Rp 1.450.000 dari budget Rp 3.500.000 (41%). Seluruh pos budget lainnya dalam status hijau (aman).`
    } else if (lowerMsg.includes('darurat') || lowerMsg.includes('emergency')) {
      reply = `**Status Dana Darurat Anda:**\n\n` +
        `- **Saldo Dana Darurat Saat Ini:** Rp 25.000.000\n` +
        `- **Rata-rata Pengeluaran Bulanan:** Rp 7.500.000\n` +
        `- **Cakupan:** **3.3 Bulan Pengeluaran** *(Standard ideal 6 bulan = Rp 45.000.000)*\n\n` +
        `🎯 *Rekomendasi:* Sisihkan **Rp 3.000.000** dari sisa cash flow bulan ini ke Kas Dana Darurat untuk mempercepat pemenuhan target 6 bulan.`
    } else {
      reply = `**Ringkasan Keuangan Finora OS (September 2026):**\n\n` +
        `- **Saldo Kas & Bank:** Rp 33.750.000\n` +
        `- **Total Assets (termasuk Investasi & Pensiun):** Rp 108.450.000\n` +
        `- **Total Utang:** Rp 4.200.000 *(Cicilan Laptop Workstation)*\n` +
        `- **Net Worth Bersih:** **Rp 104.250.000**\n\n` +
        `Performa keuangan Anda bulan ini berada pada kondisi **Sangat Baik (A+)**. Ada hal spesifik mengenai budget, investasi, atau cicilan yang ingin Anda konsultasikan?`
    }

    return NextResponse.json({ success: true, reply })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Chat error' }, { status: 500 })
  }
}
