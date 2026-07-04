import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://egztijjfrbtnczoqqnsl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnenRpampmcmJ0bmN6b3FxbnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxODExNDcsImV4cCI6MjA5ODc1NzE0N30.3Ll5figXxgdXqNwcd5GpRd1j2JzGl8Gzy-baMfISqDo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSupabase() {
  console.log("Checking Supabase connection...");
  
  // 1. Check if 'users' table exists and is queryable
  const { data: users, error: userError } = await supabase.from('users').select('*').limit(1);
  if (userError) {
    console.error("❌ Failed to query 'users' table:", userError);
    return;
  }
  console.log("✅ 'users' table is queryable!");

  // 2. Check if 'doctors' table exists
  const { data: doctors, error: doctorError } = await supabase.from('doctors').select('*').limit(1);
  if (doctorError) {
    console.error("❌ Failed to query 'doctors' table:", doctorError);
    return;
  }
  console.log("✅ 'doctors' table is queryable!");
  
  console.log("🚀 Supabase looks perfectly configured!");
}

checkSupabase();
