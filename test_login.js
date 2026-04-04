import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const urlMatch = envFile.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const supabaseUrl = urlMatch ? urlMatch[1].trim() : '';
const supabaseKey = keyMatch ? keyMatch[1].trim() : '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLogin() {
  console.log("Tentando logar como barbeiro...");
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'barbeiro@barberpro.com',
    password: 'password123'
  });
  
  if (error) {
    console.error("ERRO LOGIN:", error.message);
  } else {
    console.log("LOGIN SUCESSO! User:", data.user.email, "Role:", data.user.user_metadata?.role);
  }
}
checkLogin();
