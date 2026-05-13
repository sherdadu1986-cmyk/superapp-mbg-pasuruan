import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl ?? '', supabaseKey ?? '')

async function checkSchema() {
  const { data: sppg, error: err1 } = await supabase.from('daftar_sppg').select('*').limit(1)
  console.log('SPPG Sample:', sppg)
  
  const { data: schools, error: err2 } = await supabase.from('daftar_sekolah').select('*').limit(1)
  console.log('School Sample:', schools)
}

checkSchema()
