const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://kolgqqvurvbjbtuufnai.supabase.co'
const supabaseKey = 'sb_publishable_U0idj52nArjoczbEFXcXAw_gvfyGuzg'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
  const { data: sppg, error: err1 } = await supabase.from('daftar_sppg').select('*').limit(1)
  if (err1) console.error(err1)
  else console.log('SPPG Columns:', Object.keys(sppg[0] || {}))
  
  const { data: schools, error: err2 } = await supabase.from('daftar_sekolah').select('*').limit(1)
  if (err2) console.error(err2)
  else console.log('School Columns:', Object.keys(schools[0] || {}))
}

checkSchema()
