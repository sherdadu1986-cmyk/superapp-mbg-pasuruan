import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function toFloat(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : Math.round(val * 100) / 100;
  if (typeof val === 'string') {
    const cleaned = val.replace(/,/g, '.').replace(/[^0-9.]/g, '');
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : Math.round(n * 100) / 100;
  }
  return 0;
}

function toInt(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : Math.round(val);
  if (typeof val === 'string') {
    let s = val.trim();
    if (/^\d{1,3}\.\d{3}$/.test(s)) s = s.replace(/\./g, '');
    else s = s.replace(/[^0-9]/g, '');
    const n = parseInt(s, 10);
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'Gambar tidak ditemukan' }, { status: 400 });
    }

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API Key Gemini belum disetel. Pastikan GEMINI_API_KEY atau GOOGLE_API_KEY ada di environment variables.' },
        { status: 500 }
      );
    }

    let mimeType = 'image/jpeg';
    if (imageBase64.includes('data:image/png')) mimeType = 'image/png';
    else if (imageBase64.includes('data:image/webp')) mimeType = 'image/webp';
    else if (imageBase64.includes('data:image/jpeg') || imageBase64.includes('data:image/jpg')) mimeType = 'image/jpeg';

    const cleanBase64 = imageBase64.includes(',')
      ? imageBase64.split(',')[1]
      : imageBase64;

    const genAI = new GoogleGenerativeAI(apiKey);

    // Prioritaskan model flash yang tersedia
    const candidateModels = [
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash',
      'gemini-2.0-flash',
      'gemini-2.5-flash',
      'gemini-1.5-flash-8b',
      'gemini-1.5-pro'
    ];

    const dynamicOcrPrompt = `
Kamu adalah sistem OCR presisi tinggi untuk poster menu harian SPPG Badan Gizi Nasional (BGN).
TUGAS UTAMA: BACA TEKS ASLI DARI GAMBAR YANG DIKIRIMKAN INI SECARA REAL-TIME. JANGAN PERNAH MENGARANG ATAU MEMAKAI DATA LAMA!

Cari dan ekstrak elemen berikut persis sesuai yang tertulis di gambar:
1. JUDUL: Teks banner menu/header poster.
2. JUMLAH_PENERIMA: Angka yang ada di dalam kotak/badge "JUMLAH PENERIMA" (hanya angka bulat).
3. MENU: Semua butir daftar makanan/lauk yang tertulis di memo/kertas putih "Menu :". Gabungkan dengan tanda koma.
4. TANGGAL: Tanggal yang tertulis di poster atau kotak tabel analisa gizi (konversikan ke format YYYY-MM-DD).
5. TABEL ANALISA GIZI:
   Ekstrak angka pada tabel untuk baris "Porsi Besar" dan "Porsi Kecil":
   - energi (kkal)
   - protein (gr)
   - lemak (gr)
   - karbohidrat (gr)
   - serat (gr)

Output WAJIB berupa JSON murni tanpa markdown triple backticks (\`\`\`json):
{
  "judul": "string",
  "jumlah_penerima": 0,
  "tanggal": "YYYY-MM-DD",
  "menu_items": "string gabungan lauk",
  "gizi": {
    "porsi_besar": {
      "energi": 0.0,
      "protein": 0.0,
      "lemak": 0.0,
      "karbohidrat": 0.0,
      "serat": 0.0
    },
    "porsi_kecil": {
      "energi": 0.0,
      "protein": 0.0,
      "lemak": 0.0,
      "karbohidrat": 0.0,
      "serat": 0.0
    }
  }
}
`;

    let resultText = '';
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json'
          }
        });
        const res = await model.generateContent([
          dynamicOcrPrompt,
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType,
            },
          },
        ]);
        resultText = res.response.text().trim();
        if (resultText) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} error:`, err?.message);
      }
    }

    if (!resultText) {
      throw new Error(lastError?.message || 'AI gagal mengekstrak teks dari gambar');
    }

    const cleanJson = resultText
      .replace(/^```json/i, '')
      .replace(/^```/, '')
      .replace(/```$/, '')
      .trim();

    let parsed: any;
    try {
      parsed = JSON.parse(cleanJson);
    } catch {
      const match = cleanJson.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error('Hasil AI tidak dapat diurai sebagai format JSON yang valid');
      }
    }

    // Normalisasi struktur agar ramah ke seluruh pemanggil tanpa mock data
    const pbRaw = parsed.gizi?.porsi_besar || parsed.analisa_gizi?.porsi_besar || {};
    const pkRaw = parsed.gizi?.porsi_kecil || parsed.analisa_gizi?.porsi_kecil || {};

    const porsiBesar = {
      energi: toFloat(pbRaw.energi ?? pbRaw.energi_kkal),
      energi_kkal: toFloat(pbRaw.energi_kkal ?? pbRaw.energi),
      protein: toFloat(pbRaw.protein ?? pbRaw.protein_gr),
      protein_gr: toFloat(pbRaw.protein_gr ?? pbRaw.protein),
      lemak: toFloat(pbRaw.lemak ?? pbRaw.lemak_gr),
      lemak_gr: toFloat(pbRaw.lemak_gr ?? pbRaw.lemak),
      karbohidrat: toFloat(pbRaw.karbohidrat ?? pbRaw.karbohidrat_gr),
      karbohidrat_gr: toFloat(pbRaw.karbohidrat_gr ?? pbRaw.karbohidrat),
      serat: toFloat(pbRaw.serat ?? pbRaw.serat_gr),
      serat_gr: toFloat(pbRaw.serat_gr ?? pbRaw.serat)
    };

    const porsiKecil = {
      energi: toFloat(pkRaw.energi ?? pkRaw.energi_kkal),
      energi_kkal: toFloat(pkRaw.energi_kkal ?? pkRaw.energi),
      protein: toFloat(pkRaw.protein ?? pkRaw.protein_gr),
      protein_gr: toFloat(pkRaw.protein_gr ?? pkRaw.protein),
      lemak: toFloat(pkRaw.lemak ?? pkRaw.lemak_gr),
      lemak_gr: toFloat(pkRaw.lemak_gr ?? pkRaw.lemak),
      karbohidrat: toFloat(pkRaw.karbohidrat ?? pkRaw.karbohidrat_gr),
      karbohidrat_gr: toFloat(pkRaw.karbohidrat_gr ?? pkRaw.karbohidrat),
      serat: toFloat(pkRaw.serat ?? pkRaw.serat_gr),
      serat_gr: toFloat(pkRaw.serat_gr ?? pkRaw.serat)
    };

    const rawTitle = parsed.judul || parsed.judul_poster || parsed.nama_menu || '';
    const rawPenerima = toInt(parsed.jumlah_penerima ?? parsed.target_porsi);
    const rawTanggal = parsed.tanggal || '';

    let itemsStr = '';
    let itemsArr: string[] = [];
    if (Array.isArray(parsed.menu_items)) {
      itemsArr = parsed.menu_items.map((i: any) => String(i).trim()).filter(Boolean);
      itemsStr = itemsArr.join(', ');
    } else if (typeof parsed.menu_items === 'string') {
      itemsStr = parsed.menu_items.trim();
      itemsArr = itemsStr.split(/,|\n/).map((s: string) => s.trim()).filter(Boolean);
    } else if (typeof parsed.deskripsi_komponen === 'string') {
      itemsStr = parsed.deskripsi_komponen.trim();
      itemsArr = itemsStr.split(/,|\n/).map((s: string) => s.trim()).filter(Boolean);
    }

    const normalizedData = {
      judul: rawTitle,
      nama_menu: rawTitle,
      judul_poster: rawTitle,
      jumlah_penerima: rawPenerima,
      target_porsi: rawPenerima,
      tanggal: rawTanggal,
      menu_items: itemsStr,
      menu_items_array: itemsArr,
      deskripsi_komponen: itemsStr,
      gizi: {
        porsi_besar: porsiBesar,
        porsi_kecil: porsiKecil
      },
      analisa_gizi: {
        porsi_besar: porsiBesar,
        porsi_kecil: porsiKecil
      }
    };

    return NextResponse.json({ success: true, data: normalizedData });
  } catch (error: any) {
    console.error('Scan Menu Error:', error);
    return NextResponse.json({ error: error.message || 'Gagal memproses gambar' }, { status: 500 });
  }
}
