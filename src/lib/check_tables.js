
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Basic env parser
function getEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
  });
  return env;
}

const env = getEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
  const tables = ['users_app', 'daftar_sppg', 'laporan_harian_final', 'master_sekolah_sppg', 'activity_logs', 'user_sessions'];
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
      if (error) {
        console.log(`Table ${table}: NOT FOUND or ACCESS DENIED (${error.message})`);
      } else {
        console.log(`Table ${table}: FOUND`);
      }
    } catch (e) {
      console.log(`Table ${table}: ERROR (${e.message})`);
    }
  }
}

listTables();
