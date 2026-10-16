import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface KandunganGiziResponse {
  energi_kkal: number;
  protein_g: number;
  lemak_g: number;
  karbohidrat_g: number;
  kalsium_mg: number;
  zat_besi_mg: number;
}

interface ScanMenuResponse {
  nama_menu: string;
  deskripsi_komponen: string;
  kandungan_gizi: KandunganGiziResponse;
  kategori_porsi: string;
}

// Helper untuk membersihkan dan mengonversi nilai numerik murni
function parseNumericClean(val: any, fallback = 0): number {
  if (typeof val === 'number' && !isNaN(val)) return Math.round(val * 10) / 10;
  if (typeof val === 'string') {
    // Ambil angka dan titik desimal saja
    const cleaned = val.replace(/,/g, '.').replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? fallback : Math.round(num * 10) / 10;
  }
  return fallback;
}

export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Tidak ada gambar menu yang dikirim' },
        { status: 400 }
      );
    }

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    // Bersihkan header Base64 dan tentukan mimeType
    let mimeType = 'image/jpeg';
    if (imageBase64.includes('data:image/png')) mimeType = 'image/png';
    else if (imageBase64.includes('data:image/webp')) mimeType = 'image/webp';
    else if (imageBase64.includes('data:image/jpeg') || imageBase64.includes('data:image/jpg')) mimeType = 'image/jpeg';

    const cleanBase64 = imageBase64.includes(',')
      ? imageBase64.split(',')[1]
      : imageBase64;

    // Jika API Key tidak tersedia atau mode mock, berikan respons cerdas default BGN
    if (!apiKey) {
      console.warn('GEMINI_API_KEY belum disetel, mengembalikan respon estimasi menu BGN default');
      const fallbackResult: ScanMenuResponse = {
        nama_menu: 'Paket Nasi Timbel Ayam Goreng Lengkuas',
        deskripsi_komponen: 'Nasi putih, Ayam ungkep lengkuas, Tempe bacem, Sayur asem Jakarta, Sambal tomat segar, Pisang ambon',
        kandungan_gizi: {
          energi_kkal: 650,
          protein_g: 24.5,
          lemak_g: 18.2,
          karbohidrat_g: 85.0,
          kalsium_mg: 150,
          zat_besi_mg: 3.2
        },
        kategori_porsi: 'Standar SD/SMP'
      };

      return NextResponse.json({
        success: true,
        data: fallbackResult,
        notice: 'Menggunakan fallback simulasi menu BGN (GEMINI_API_KEY belum terkonfigurasi di server)'
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Daftar model prioritas untuk dicoba bertahap jika salah satu rate-limited / error
    const candidateModels = [
      'gemini-1.5-flash',
      'gemini-1.5-flash-latest',
      'gemini-2.0-flash',
      'gemini-2.5-flash',
      'gemini-1.5-flash-8b',
      'gemini-1.5-pro'
    ];

    const prompt = `
Kamu adalah Ahli Gizi Badan Gizi Nasional (BGN) dan Sistem AI Vision Analisis Menu Makanan Berstandar Indonesia.
Tugasmu adalah menganalisis foto makanan harian, poster menu, leaflet gizi, atau foto nampan makanan Program Makan Bergizi Gratis (MBG).

Lakukan ekstraksi dan analisis nutrisi secara akurat.
Kembalikan HANYA format JSON valid murni tanpa markdown formatting, tanpa tanda kutip tiga (\`\`\`json):
{
  "nama_menu": "Nama Paket/Menu Utama (contoh: Nasi Timbel Ayam Goreng Lengkuas)",
  "deskripsi_komponen": "Daftar lauk/sayur (contoh: Nasi putih, Ayam ungkep lengkuas, Tempe bacem, Sayur asem, Pisang)",
  "kandungan_gizi": {
    "energi_kkal": 650,
    "protein_g": 24.5,
    "lemak_g": 18.2,
    "karbohidrat_g": 85.0,
    "kalsium_mg": 150,
    "zat_besi_mg": 3.2
  },
  "kategori_porsi": "Standar SD/SMP"
}

ATURAN WAJIB:
1. Field pada "kandungan_gizi" (energi_kkal, protein_g, lemak_g, karbohidrat_g, kalsium_mg, zat_besi_mg) HARUS berupa angka numerik murni tanpa satuan teks apa pun (bukan "650 kkal", melainkan 650).
2. Jika pada foto tertera tabel nutrisi atau teks gizi resmi, gunakan angka tersebut. Jika tidak tertera teks angka, lakukan estimasi gizi profesional berdasarkan komponen makanan yang terlihat pada foto.
3. Kategori porsi sesuaikan dengan target: contoh "Standar SD/SMP", "Standar TK/PAUD", atau "Standar 3B (Balita/Bumil/Busui)".
4. Field "deskripsi_komponen" harus merinci komponen makanan yang teridentifikasi, dipisahkan dengan koma.
`;

    let lastError: any = null;
    let rawText = '';

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.2,
          }
        });

        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType,
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
      // Jika semua model gagal (misal rate limit atau quota), jangan buat user buntu
      console.warn('Semua model Gemini gagal, mengembalikan estimasi cerdas default BGN:', lastError?.message);
      const fallbackResult: ScanMenuResponse = {
        nama_menu: 'Menu Harian Sehat Bergizi BGN',
        deskripsi_komponen: 'Nasi putih pulen, Lauk hewani berprotein tinggi, Tahu/Tempe nabati, Sayur segar berserat, Buah segar',
        kandungan_gizi: {
          energi_kkal: 650,
          protein_g: 25.0,
          lemak_g: 18.0,
          karbohidrat_g: 82.5,
          kalsium_mg: 160,
          zat_besi_mg: 3.5
        },
        kategori_porsi: 'Standar SD/SMP'
      };

      return NextResponse.json({
        success: true,
        data: fallbackResult,
        warning: lastError?.message || 'Gagal memanggil API Gemini, menggunakan estimasi gizi standar BGN.'
      });
    }

    // Bersihkan karakter markdown jika model tetap memberikan backticks
    const cleanedJsonText = rawText
      .replace(/^```json/i, '')
      .replace(/^```/, '')
      .replace(/```$/, '')
      .trim();

    let parsedData: any;
    try {
      parsedData = JSON.parse(cleanedJsonText);
    } catch {
      // Coba temukan substring JSON di antara { dan }
      const match = cleanedJsonText.match(/\{[\s\S]*\}/);
      if (match) {
        parsedData = JSON.parse(match[0]);
      } else {
        throw new Error('Hasil AI tidak dapat diurai sebagai format JSON yang valid');
      }
    }

    // Sanitasi data numerik agar terjamin angka murni tanpa satuan
    const sanitizedGizi: KandunganGiziResponse = {
      energi_kkal: parseNumericClean(parsedData?.kandungan_gizi?.energi_kkal, 650),
      protein_g: parseNumericClean(parsedData?.kandungan_gizi?.protein_g, 24.5),
      lemak_g: parseNumericClean(parsedData?.kandungan_gizi?.lemak_g, 18.2),
      karbohidrat_g: parseNumericClean(parsedData?.kandungan_gizi?.karbohidrat_g, 85.0),
      kalsium_mg: parseNumericClean(parsedData?.kandungan_gizi?.kalsium_mg, 150),
      zat_besi_mg: parseNumericClean(parsedData?.kandungan_gizi?.zat_besi_mg, 3.2),
    };

    const finalResult: ScanMenuResponse = {
      nama_menu: String(parsedData?.nama_menu || 'Menu Harian Sehat Bergizi BGN').trim(),
      deskripsi_komponen: String(parsedData?.deskripsi_komponen || 'Nasi putih, Lauk protein hewani, Lauk nabati, Sayuran segar, Buah').trim(),
      kandungan_gizi: sanitizedGizi,
      kategori_porsi: String(parsedData?.kategori_porsi || 'Standar SD/SMP').trim(),
    };

    return NextResponse.json({
      success: true,
      data: finalResult,
    });
  } catch (error: any) {
    console.error('Error scanning menu with Gemini Vision:', error);
    return NextResponse.json(
      { error: error?.message || 'Gagal memindai menu dan tabel gizi dengan AI' },
      { status: 500 }
    );
  }
}
