import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'Tidak ada gambar nota yang dikirim' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY belum disetel di Vercel Environment Variables' },
        { status: 500 }
      );
    }

    // Bersihkan header Base64
    const cleanBase64 = imageBase64.includes(',') 
      ? imageBase64.split(',')[1] 
      : imageBase64;

    const genAI = new GoogleGenerativeAI(apiKey);

    // Daftar model prioritas untuk dicoba bertahap jika salah satu 404
    const candidateModels = [
      'gemini-1.5-flash-latest',
      'gemini-2.0-flash',
      'gemini-1.5-flash-8b',
      'gemini-1.5-pro',
      'gemini-2.5-flash',
      'gemini-1.5-flash'
    ];

    const prompt = `
Kamu adalah sistem OCR pembaca nota/struk belanja, restoran, warung makan, atau struk kasir profesional.
Tugasmu adalah menganalisis foto nota (baik struk cetak printer maupun nota bon tulisan tangan).

Kembalikan HANYA format JSON valid murni tanpa markdown formatting, tanpa tanda kutip tiga (\`\`\`json):
{
  "merchant": "Nama Warung / Restoran / Toko (contoh: Sate & Soto, Rumah Makan, dsb. Jika tidak ada nama, tulis 'Warung Makan')",
  "tanggal": "YYYY-MM-DD",
  "total": 0,
  "items": [
    {
      "item_name": "Nama Item / Makanan / Minuman",
      "qty": 1,
      "subtotal": 0
    }
  ]
}

Aturan:
1. Pastikan "total" dan "subtotal" hanya berupa angka murni (integer/number) tanpa simbol Rp, koma, atau titik.
2. Jika ada menu yang tertera (misal: Sate, Soto, Es Teh, Nasi), catat ke array items beserta harganya.
3. Nilai total harus mencerminkan total bayar yang tertulis di nota.
`;

    let lastError: any = null;
    let rawText = '';

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: cleanBase64,
              mimeType: 'image/jpeg',
            },
          },
        ]);
        rawText = result.response.text().trim();
        if (rawText) break; // Berhasil membaca!
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} gagal: ${err?.message}, mencoba model berikutnya...`);
      }
    }

    if (!rawText) {
      throw new Error(lastError?.message || 'Gagal memproses nota belanja dengan model Gemini yang tersedia');
    }

    // Bersihkan karakter markdown jika model tetap memberikan backticks
    const cleanedJsonText = rawText
      .replace(/^```json/i, '')
      .replace(/^```/, '')
      .replace(/```$/, '')
      .trim();

    const parsedData = JSON.parse(cleanedJsonText);

    return NextResponse.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error('Error scanning receipt:', error);
    return NextResponse.json(
      { error: error?.message || 'Gagal memproses nota belanja dengan AI' },
      { status: 500 }
    );
  }
}
