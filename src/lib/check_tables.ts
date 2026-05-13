
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
  // Supabase doesn't have a direct "list tables" in JS SDK for security reasons, 
  // but we can try to query common tables we know or use RPC if exists.
  // Alternatively, we can check the public schema via SQL if we have service role, 
  // but let's just test common names.
  const tables = ['users_app', 'daftar_sppg', 'laporan_harian_final', 'master_sekolah_sppg', 'activity_logs', 'user_sessions'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`Table ${table}: NOT FOUND or ACCESS DENIED (${error.message})`);
    } else {
      console.log(`Table ${table}: FOUND`);
    }
  }
}

listTables();
