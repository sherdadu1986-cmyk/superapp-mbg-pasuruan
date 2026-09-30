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

    // Bersihkan header data:image/...;base64,
    const cleanBase64 = imageBase64.includes(',') 
      ? imageBase64.split(',')[1] 
      : imageBase64;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
Kamu adalah sistem OCR dan ekstraktor nota belanja/kasir/restoran/warung profesional.
Analisis gambar nota/struk ini dengan sangat teliti (bisa berupa struk printer thermal, faktur, ataupun nota bon tulisan tangan/warung).

Ekstrak informasi ke dalam format JSON murni TANPA markdown formatting, TANPA tanda kutip tiga (\`\`\`json):
{
  "merchant": "Nama Toko / Restoran / Warung (misal: Sate Kambing, Warung Soto, Indomaret, dll. Jika tidak tertera, tulis 'Nota Transaksi')",
  "tanggal": "YYYY-MM-DD (gunakan tanggal hari ini jika tidak terbaca)",
  "total": 0,
  "items": [
    {
      "item_name": "Nama Makanan / Barang / Jasa",
      "qty": 1,
      "subtotal": 0
    }
  ]
}

Aturan Penting:
1. "total" dan "subtotal" harus bertipe angka bulat (integer/number) tanpa simbol Rp atau titik.
2. Jika ada rincian porsi/makanan (misal: Sate 10 tusuk, Soto Ayam, Es Teh), masukkan ke daftar "items".
3. Jika total akhir tertulis jelas di nota, pastikan field "total" sama dengan nominal tersebut.
4. HANYA kembalikan valid JSON murni.
`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: cleanBase64,
          mimeType: 'image/jpeg',
        },
      },
    ]);

    const rawText = result.response.text().trim();
    
    // Bersihkan karakter markdown jika model tetap memberikan backtick
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
    console.error('Error scanning receipt with Gemini:', error);
    return NextResponse.json(
      { error: error?.message || 'Gagal memproses nota belanja dengan AI' },
      { status: 500 }
    );
  }
}
