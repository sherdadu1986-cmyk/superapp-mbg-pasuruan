import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // 1. Cek email
    const { data: userByEmail, error: emailErr } = await supabase
      .from('users_app')
      .select('*')
      .eq('email', email.trim())
      .maybeSingle()

    if (emailErr) {
      return NextResponse.json({ error: emailErr.message }, { status: 500 })
    }

    if (!userByEmail) {
      return NextResponse.json({ error: 'Email Tidak Terdaftar' }, { status: 401 })
    }

    // 2. Cek password
    if (userByEmail.password !== password.trim()) {
      return NextResponse.json({ error: 'Password Salah!' }, { status: 401 })
    }

    // 3. Cek role pending
    if (userByEmail.role === 'pending') {
      return NextResponse.json({ redirect: '/waiting' }, { status: 200 })
    }

    let unitId = userByEmail.sppg_unit_id

    // 4. Role SPPG auto-create unit logic
    if (userByEmail.role === 'sppg') {
      if (!unitId) {
        const { data: newUnit, error: insertErr } = await supabase
          .from('daftar_sppg')
          .insert([{ nama_unit: email.trim().split('@')[0], kepala_unit: '-' }])
          .select()
          .single()

        if (insertErr || !newUnit) {
          return NextResponse.json({ error: 'Gagal membuat profil SPPG otomatis' }, { status: 500 })
        }

        unitId = newUnit.id
        await supabase.from('users_app').update({ sppg_unit_id: unitId }).eq('id', userByEmail.id)
      } else {
        const { data: existingUnit } = await supabase
          .from('daftar_sppg')
          .select('id')
          .eq('id', unitId)
          .maybeSingle()

        if (!existingUnit) {
          const { error: upsertErr } = await supabase
            .from('daftar_sppg')
            .upsert({ id: unitId, nama_unit: email.trim().split('@')[0], kepala_unit: '-' })

          if (upsertErr) {
            return NextResponse.json({ error: 'Data Profil SPPG gagal dibuat ulang' }, { status: 500 })
          }
        }
      }
    }

    // 5. Set Cookie
    const sessionData = {
      role: userByEmail.role,
      unit_id: unitId || ''
    }

    const sessionString = Buffer.from(JSON.stringify(sessionData)).toString('base64')
    
    // Using await cookies() for Next.js 15+ compatibility
    const cookieStore = await cookies()
    cookieStore.set('mbg_session', sessionString, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    })

    return NextResponse.json({ 
      success: true, 
      role: userByEmail.role,
      unit_id: unitId || ''
    }, { status: 200 })

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
