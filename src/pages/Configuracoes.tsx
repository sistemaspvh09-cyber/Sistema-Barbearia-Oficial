import { 
  Settings, 
  Store, 
  Paintbrush, 
  BellRing, 
  ShieldCheck, 
  CreditCard,
  Smartphone,
  Save,
  Globe,
  Clock,
  CalendarDays,
  SmartphoneNfc,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';

const Configuracoes = () => {
  const { user } = useAuth();
  const isBarber = user?.user_metadata?.role === 'barbeiro';
  
  const [infiniteKey, setInfiniteKey] = useState('');
  const [isInfiniteSaved, setIsInfiniteSaved] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);

  useEffect(() => {
    if (window.location.search.includes('google_auth=success')) {
      setIsGoogleConnected(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleSaveInfinite = () => {
    if (infiniteKey.length > 5) {
      setIsInfiniteSaved(true);
      setTimeout(() => setIsInfiniteSaved(false), 3000);
    }
  };

  const handleConnectGoogle = () => {
    if (isGoogleConnected) {
      setIsGoogleConnected(false);
      return;
    }
    const baseUrl = window.location.origin + window.location.pathname;
    const redirectUrl = encodeURIComponent(baseUrl + "?google_auth=success");
    // Redireciona para o Google Chooser real
    window.location.href = `https://accounts.google.com/AccountChooser?continue=${redirectUrl}`;
  };

  if (isBarber) {
    return (
      <div className="pt-8 pb-12 animate-in fade-in duration-300">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">Sua Conta</h1>
            <p className="text-on-surface-variant font-medium">Configure suas integrações e recebimentos pessoais.</p>
          </div>
          <button className="bg-[#C8FF00] text-[#4f6700] px-6 py-3 rounded-xl font-extrabold flex items-center gap-2 hover:scale-[1.02] transition-transform shadow-[0px_0px_20px_rgba(200,255,0,0.2)]">
            <Save size={20} className="font-bold" />
            Salvar Alterações
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Nav */}
          <div className="w-full lg:w-64 space-y-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 bg-[#C8FF00]/10 text-[#C8FF00] rounded-xl font-bold transition-all border border-[#C8FF00]/20 text-left">
              <SmartphoneNfc size={20} />
              <span>Integrações API</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-[#A0A0A0] hover:text-white hover:bg-white/5 rounded-xl transition-all text-left">
              <BellRing size={20} />
              <span>Notificações</span>
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 space-y-8">
            
            {/* InfinitePay Integration */}
            <div className="glass-card rounded-[1.5rem] p-8 border border-[#C8FF00]/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#C8FF00]/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
              
              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-3">
                <SmartphoneNfc className="text-[#C8FF00]" size={28} />
                Recebimento Direto (InfinitePay)
              </h2>
              <p className="text-sm text-on-surface-variant mb-6 max-w-2xl">
                Conecte a sua própria chave da InfinitePay. Ao fazer isso, o valor cobrado do cliente no sistema "Tap to Pay" cairá 100% na sua conta bancária. Acertos de comissão com o salão deverão ser acordados separadamente.
              </p>

              <div className="bg-surface-container-lowest p-6 rounded-2xl border border-white/5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3 block">Chave de Produção (API Key)</label>
                <div className="flex flex-col sm:flex-row gap-4">
                  <input 
                    type="password" 
                    value={infiniteKey}
                    onChange={(e) => setInfiniteKey(e.target.value)}
                    placeholder="sk_live_..." 
                    className="flex-1 px-4 py-3 bg-surface-container border border-white/10 rounded-xl focus:outline-none focus:border-[#C8FF00] text-white transition-colors" 
                  />
                  <button 
                    onClick={handleSaveInfinite}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    {isInfiniteSaved ? <CheckCircle2 className="text-[#C8FF00]" size={20} /> : 'Conectar Chave'}
                  </button>
                </div>
                {isInfiniteSaved && (
                  <p className="text-xs text-[#C8FF00] font-bold mt-3">Chave sincronizada com sucesso para recebimentos!</p>
                )}
              </div>
            </div>

            {/* Google Calendar Integration */}
            <div className="glass-card rounded-[1.5rem] p-8 border border-white/5">
              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-3">
                <CalendarDays className="text-white" size={28} />
                Google Agenda
              </h2>
              <p className="text-sm text-on-surface-variant mb-6 max-w-2xl">
                Sincronize seus agendamentos diretamente com o calendário do seu celular. Toda vez que um cliente marcar horário com você, aparecerá na sua agenda do Google automaticamente.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-surface-container border border-white/5 rounded-2xl">
                <div className="flex items-center gap-4 mb-4 sm:mb-0">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center p-2">
                    {/* SVG do Google Logo */}
                    <svg viewBox="0 0 48 48" className="w-full h-full"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path></svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Status de Sincronização</h4>
                    {isGoogleConnected ? (
                      <p className="text-xs text-[#C8FF00] font-bold">Conectado (barbeiro@gmail.com)</p>
                    ) : (
                      <p className="text-xs text-on-surface-variant">Não conectado</p>
                    )}
                  </div>
                </div>
                
                <button 
                  onClick={handleConnectGoogle}
                  className={`px-6 py-3 font-bold rounded-xl transition-colors w-full sm:w-auto ${isGoogleConnected ? 'bg-surface-container-highest text-white hover:bg-error/20 hover:text-error' : 'bg-white text-black hover:bg-gray-200'}`}
                >
                  {isGoogleConnected ? 'Desconectar' : 'Conectar Google'}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // --- REGRAS DO ADMIN ---
  return (
    <div className="pt-8 pb-12 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">Configurações</h1>
          <p className="text-on-surface-variant font-medium">Ajuste as preferências gerais, equipe e personalização da sua barbearia.</p>
        </div>
        <button className="bg-[#C8FF00] text-[#4f6700] px-6 py-3 rounded-xl font-extrabold flex items-center gap-2 hover:scale-[1.02] transition-transform shadow-[0px_0px_20px_rgba(200,255,0,0.2)]">
          <Save size={20} className="font-bold" />
          Salvar Alterações
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Nav */}
        <div className="w-full lg:w-64 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-[#C8FF00]/10 text-[#C8FF00] rounded-xl font-bold transition-all border border-[#C8FF00]/20 text-left">
            <Store size={20} />
            <span>Perfil da Loja</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-[#A0A0A0] hover:text-white hover:bg-white/5 rounded-xl transition-all text-left">
            <Paintbrush size={20} />
            <span>Personalização visual</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-[#A0A0A0] hover:text-white hover:bg-white/5 rounded-xl transition-all text-left">
            <Clock size={20} />
            <span>Horário de Funcionamento</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-[#A0A0A0] hover:text-white hover:bg-white/5 rounded-xl transition-all text-left">
            <CreditCard size={20} />
            <span>Gestão de Pagamentos</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-[#A0A0A0] hover:text-white hover:bg-white/5 rounded-xl transition-all text-left">
            <BellRing size={20} />
            <span>Notificações</span>
          </button>
          <div className="my-4 border-t border-white/5"></div>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-[#A0A0A0] hover:text-white hover:bg-white/5 rounded-xl transition-all text-left">
            <ShieldCheck size={20} />
            <span>Segurança e Acessos</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-[#A0A0A0] hover:text-white hover:bg-white/5 rounded-xl transition-all text-left">
            <Smartphone size={20} />
            <span>App do Cliente</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-8">
          {/* Section: Loja */}
          <div className="glass-card rounded-[1.5rem] p-8 border border-white/5">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Store className="text-[#C8FF00]" size={24} />
              Informações do Estabelecimento
            </h2>

            <div className="flex flex-col sm:flex-row gap-8 mb-8">
              <div className="flex flex-col items-center gap-4">
                <div className="w-32 h-32 rounded-2xl bg-surface-container-highest border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-[#C8FF00] hover:bg-[#C8FF00]/5 transition-all group overflow-hidden relative">
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <Settings size={24} className="text-white mb-2" />
                    <span className="text-xs text-white font-bold">Alterar</span>
                  </div>
                  <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuD7gFdlxwRb4_gzh7ppv8fv4MoXeZdR_1iL4LPOmNXcgdxvHeVZ5876wyIZWtWaSrFUVwJ0SB7lFK3B3wnl-_JdpbTAlluE29E-Hl-p1BEhBRWIDQwifzuCiAf_hvkMFkHtcVR_sUOgxYxqqHAGGwZYWEXoqiJNpvmDRr8QfUk2e2OFFi4DRWjzHzmR5dVyj8umSc4odDiY6-6t6S9iYAZd_9l7uGCoR_1DvqWVTdXfm4S_czkMTurGaRRA_Zn5f_Pzj9LmgsDeWUqV" alt="Logo" className="w-full h-full object-cover opacity-50 blur-sm" />
                  {/* Placeholder for Logo */}
                  <span className="absolute text-3xl font-black text-[#C8FF00]">BP</span>
                </div>
                <button className="text-xs font-bold text-[#C8FF00] hover:underline">Remover Logotipo</button>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Nome da Barbearia</label>
                  <input type="text" defaultValue="BarberPro Master" className="w-full px-4 py-3 bg-surface-container-lowest border border-white/10 rounded-xl focus:outline-none focus:border-[#C8FF00] text-white transition-colors" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">CNPJ / Documento</label>
                  <input type="text" defaultValue="12.345.678/0001-90" className="w-full px-4 py-3 bg-surface-container-lowest border border-white/10 rounded-xl focus:outline-none focus:border-[#C8FF00] text-white transition-colors" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Telefone Comercial</label>
                  <input type="text" defaultValue="(11) 99999-9999" className="w-full px-4 py-3 bg-surface-container-lowest border border-white/10 rounded-xl focus:outline-none focus:border-[#C8FF00] text-white transition-colors" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">E-mail de Contato</label>
                  <input type="email" defaultValue="contato@barberpro.com.br" className="w-full px-4 py-3 bg-surface-container-lowest border border-white/10 rounded-xl focus:outline-none focus:border-[#C8FF00] text-white transition-colors" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Descrição / Bio curta</label>
              <textarea rows={3} className="w-full px-4 py-3 bg-surface-container-lowest border border-white/10 rounded-xl focus:outline-none focus:border-[#C8FF00] text-white transition-colors resize-none" defaultValue="A barbearia número um na região, focada em entregar mais do que visual, mas uma experiência de bem-estar."></textarea>
              <p className="text-[10px] text-on-surface-variant text-right">0/150 caracteres para o perfil do cliente.</p>
            </div>
          </div>

          {/* Section: Endereço */}
          <div className="glass-card rounded-[1.5rem] p-8 border border-white/5">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Globe className="text-[#C8FF00]" size={24} />
              Localização
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Endereço (Rua/Av e Número)</label>
                <input type="text" defaultValue="Av. Paulista, 1500" className="w-full px-4 py-3 bg-surface-container-lowest border border-white/10 rounded-xl focus:outline-none focus:border-[#C8FF00] text-white transition-colors" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">CEP</label>
                <input type="text" defaultValue="01310-100" className="w-full px-4 py-3 bg-surface-container-lowest border border-white/10 rounded-xl focus:outline-none focus:border-[#C8FF00] text-white transition-colors" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Bairro</label>
                <input type="text" defaultValue="Bela Vista" className="w-full px-4 py-3 bg-surface-container-lowest border border-white/10 rounded-xl focus:outline-none focus:border-[#C8FF00] text-white transition-colors" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Cidade</label>
                <input type="text" defaultValue="São Paulo" className="w-full px-4 py-3 bg-surface-container-lowest border border-white/10 rounded-xl focus:outline-none focus:border-[#C8FF00] text-white transition-colors" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Estado</label>
                <select className="w-full px-4 py-3 bg-surface-container-lowest border border-white/10 rounded-xl focus:outline-none focus:border-[#C8FF00] text-white transition-colors appearance-none cursor-pointer">
                  <option value="SP">São Paulo (SP)</option>
                  <option value="RJ">Rio de Janeiro (RJ)</option>
                  <option value="MG">Minas Gerais (MG)</option>
                </select>
              </div>
            </div>
            
            <div className="p-4 bg-[#C8FF00]/5 border border-[#C8FF00]/20 rounded-xl flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-[#C8FF00]">Localização Ativa no App Cliente</h4>
                <p className="text-xs text-on-surface-variant mt-1">Os clientes poderão usar o Google Maps diretamente do App.</p>
              </div>
              <div className="w-12 h-6 bg-[#C8FF00] rounded-full p-1 cursor-pointer flex justify-end">
                <div className="w-4 h-4 bg-[#0D0D0D] rounded-full shadow-md"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Configuracoes;
