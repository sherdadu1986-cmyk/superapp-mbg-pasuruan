const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://kolgqqvurvbjbtuufnai.supabase.co'
const supabaseKey = 'sb_publishable_U0idj52nArjoczbEFXcXAw_gvfyGuzg'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkGempeng() {
  const { data: unit } = await supabase.from('daftar_sppg').select('id, nama_unit').ilike('nama_unit', '%GEMPENG%').single()
  if (!unit) {
    console.log('Unit Gempeng not found')
    return
  }
  console.log('Unit Gempeng ID:', unit.id)
  
  const { data: schools } = await supabase.from('daftar_sekolah').select('nama_sekolah, target_porsi').eq('sppg_id', unit.id)
  console.log('Schools for Gempeng:', schools)
  console.log('Total Target Porsi:', schools.reduce((acc, curr) => acc + (curr.target_porsi || 0), 0))
}

checkGempeng()
