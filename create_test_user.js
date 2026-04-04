import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Lê o arquivo .env.local
const envFile = fs.readFileSync('.env.local', 'utf-8');
const urlMatch = envFile.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const supabaseUrl = urlMatch ? urlMatch[1].trim() : '';
const supabaseAnonKey = keyMatch ? keyMatch[1].trim() : '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestUser() {
  console.log("Criando usuário de teste...");
  const { data, error } = await supabase.auth.signUp({
    email: 'teste@barberpro.com',
    password: 'password123',
  });
  
  if (error) {
    if (error.message.includes("User already registered")) {
        console.log("O usuário teste@barberpro.com já existe no banco de dados.");
    } else {
        console.error("Erro ao criar usuário:", error.message);
    }
  } else {
    console.log("Usuário de teste criado/verificado com sucesso!");
  }
}

createTestUser();
