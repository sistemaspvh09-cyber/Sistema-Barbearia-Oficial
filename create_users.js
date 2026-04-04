import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Lê o arquivo .env.local
const envFile = fs.readFileSync('.env.local', 'utf-8');
const urlMatch = envFile.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/);
const serviceRoleMatch = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

const supabaseUrl = urlMatch ? urlMatch[1].trim() : '';
// We use the anon key for sign up, or service_role if available. Usually anon key is enough to sign up if email conf is disabled.
const supabaseKey = serviceRoleMatch ? serviceRoleMatch[1].trim() : keyMatch[1].trim();

const supabase = createClient(supabaseUrl, supabaseKey);

async function createProfiles() {
  console.log("Iniciando rotina de criação de contas com PAPEL (RBAC)...");
  
  const contas = [
    { email: 'admin@barberpro.com', role: 'admin' },
    { email: 'barbeiro@barberpro.com', role: 'barbeiro' }
  ];

  for (const conta of contas) {
    const { data, error } = await supabase.auth.signUp({
      email: conta.email,
      password: 'password123',
      options: {
        data: {
          role: conta.role
        }
      }
    });

    if (error) {
       if (error.message.includes("already registered")) {
           console.log(`[!] Usuário ${conta.email} já existe. Atualizando Metadados...`);
           // If they exist, we should update their metadata
           // Note: Update user metadata requires signing in, or using service_role key to update admin.
           // Since we want this script to be bulletproof, we will sign in and update.
           const { data: { user }, error: loginErr } = await supabase.auth.signInWithPassword({
               email: conta.email,
               password: 'password123'
           });
           
           if (!loginErr) {
               await supabase.auth.updateUser({
                   data: { role: conta.role }
               });
               console.log(`[OK] Metadados de ${conta.email} atualizados para role: ${conta.role}`);
               await supabase.auth.signOut();
           } else {
               console.error(`Erro ao logar com ${conta.email} para atualizar:`, loginErr.message);
           }
       } else {
           console.error(`[X] Erro ao criar ${conta.email}:`, error.message);
       }
    } else {
       console.log(`[OK] Criado: ${conta.email} | Role: ${conta.role}`);
    }
  }

  console.log("Finalizado!");
}

createProfiles();
