
import { 
  Wallet, 
  ReceiptText, 
  CircleDollarSign, 
  PiggyBank, 
  ShoppingBag,
  Send,
  TrendingUp,
  Scissors
} from 'lucide-react';
import { useModal } from '../contexts/ModalContext';
import { useAuth } from '../contexts/AuthContext';

const BarberFinanceiro = () => {
  const servicosDoMes = [
    { servico: 'Corte Fade', cliente: 'Afonso Silva', horario: 'Hoje, 09:30', total: 45.00, comissao: 50 },
    { servico: 'Corte + Barba', cliente: 'Guilherme R.', horario: 'Ontem, 16:00', total: 75.00, comissao: 50 },
    { servico: 'Barba Completa', cliente: 'Eduardo M.', horario: '02/Abr, 11:15', total: 35.00, comissao: 50 },
    { servico: 'Degradê + Sobrancelha', cliente: 'Thiago P.', horario: '01/Abr, 14:00', total: 60.00, comissao: 50 },
  ];

  const totalBruto = servicosDoMes.reduce((acc, s) => acc + s.total, 0);
  const totalComissao = servicosDoMes.reduce((acc, s) => acc + (s.total * s.comissao / 100), 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 pt-8 pb-12">
      <div className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-black text-white">Meu Financeiro</h1>
        <p className="text-sm text-on-surface-variant mt-1">Valores cobrados pelo salão nos seus atendimentos. O pagamento da comissão é feito conforme acordo com o responsável.</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container rounded-3xl p-6 glass-border flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-4 -top-8 w-32 h-32 bg-[#C8FF00]/10 rounded-full blur-[40px] group-hover:scale-150 transition-transform duration-700"></div>
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#C8FF00]/10 flex items-center justify-center text-[#C8FF00] mb-3">
              <ReceiptText size={20} />
            </div>
            <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">Total Cobrado (Mês)</p>
          </div>
          <div className="mt-3 relative z-10">
            <h3 className="text-2xl font-extrabold text-white tracking-tight">R$ {totalBruto.toFixed(2).replace('.', ',')}</h3>
            <p className="text-on-surface-variant text-[10px] font-bold mt-1">Valor que entrou no caixa do salão</p>
          </div>
        </div>

        <div className="bg-surface-container rounded-3xl p-6 glass-border flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-4 -top-8 w-32 h-32 bg-[#C8FF00]/10 rounded-full blur-[40px] group-hover:scale-150 transition-transform duration-700"></div>
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#C8FF00] flex items-center justify-center text-[#4f6700] mb-3 shadow-[0_0_20px_rgba(200,255,0,0.3)]">
              <CircleDollarSign size={20} />
            </div>
            <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">Sua Comissão (50%)</p>
          </div>
          <div className="mt-3 relative z-10">
            <h3 className="text-2xl font-extrabold text-white tracking-tight">R$ {totalComissao.toFixed(2).replace('.', ',')}</h3>
            <p className="text-[#C8FF00] text-[10px] font-bold mt-1 uppercase tracking-widest">A receber do responsável</p>
          </div>
        </div>

        <div className="bg-surface-container-low rounded-3xl p-6 border border-white/5 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-on-surface-variant mb-3">
              <Wallet size={20} />
            </div>
            <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">Outubro (Fechado)</p>
          </div>
          <div className="mt-3 opacity-60">
            <h3 className="text-2xl font-extrabold text-white tracking-tight">R$ 4.850,00</h3>
            <p className="text-white/50 text-[10px] font-bold mt-1 uppercase tracking-widest">Liquidado</p>
          </div>
        </div>
      </div>

      {/* Banner informativo */}
      <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
        <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-blue-400 text-xs font-black">i</span>
        </div>
        <p className="text-xs text-blue-200/80 leading-relaxed">
          Os valores abaixo são cobrados diretamente na conta do salão (via InfinitePay do responsável). O cálculo da sua comissão é exibido para sua transparência — entre em contato com o gestor para combinar a data de repasse.
        </p>
      </div>

      {/* Extrato Detalhado */}
      <div className="bg-surface-container rounded-3xl p-6 sm:p-8 border border-white/5">
        <h2 className="text-lg font-bold text-white mb-6">Extrato de Atendimentos</h2>
        
        <div className="space-y-3">
          {servicosDoMes.map((item, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl border border-white/5 hover:border-[#C8FF00]/10 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-on-surface-variant shrink-0">
                  <Scissors size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{item.servico}</h4>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">{item.cliente} • {item.horario}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-sm font-black text-white block">R$ {item.total.toFixed(2).replace('.', ',')}</span>
                <span className="text-[10px] text-[#C8FF00] font-bold uppercase">Sua parte: R$ {(item.total * item.comissao / 100).toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <span className="text-xs text-on-surface-variant">Total: <strong className="text-white">{servicosDoMes.length} atendimentos</strong></span>
          <div className="flex gap-4">
            <div className="text-right">
              <p className="text-[10px] text-on-surface-variant uppercase">Total Bruto Cobrado</p>
              <p className="text-sm font-black text-white">R$ {totalBruto.toFixed(2).replace('.', ',')}</p>
            </div>
            <div className="w-px bg-white/10"></div>
            <div className="text-right">
              <p className="text-[10px] text-[#C8FF00] uppercase">Comissão Devida</p>
              <p className="text-sm font-black text-[#C8FF00]">R$ {totalComissao.toFixed(2).replace('.', ',')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Financeiro = () => {
  const { openModal } = useModal();
  const { user } = useAuth();
  
  if (user?.user_metadata?.role === 'barbeiro') {
    return <BarberFinanceiro />;
  }

  return (
    <div className="space-y-8">
      {/* Bento Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface-container rounded-3xl p-6 glass-border flex flex-col justify-between group transition-all duration-300 hover:bg-surface-container-high">
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#C8FF00]/10 flex items-center justify-center text-[#C8FF00] mb-4">
              <Wallet size={20} />
            </div>
            <p className="text-on-surface-variant text-sm font-medium">Faturamento Total</p>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-white">R$ 42.580,00</h3>
            <p className="text-[#C8FF00] text-xs font-bold mt-1 flex items-center gap-1">
              <TrendingUp size={14} /> +12.5% vs mês anterior
            </p>
          </div>
        </div>

        <div className="bg-surface-container rounded-3xl p-6 glass-border flex flex-col justify-between group transition-all duration-300 hover:bg-surface-container-high">
          <div>
            <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center text-error mb-4">
              <ReceiptText size={20} />
            </div>
            <p className="text-on-surface-variant text-sm font-medium">Despesas Fixas</p>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-white">R$ 8.420,00</h3>
            <p className="text-on-surface-variant text-xs mt-1">Vencimento prox: 05/11</p>
          </div>
        </div>

        <div className="bg-surface-container rounded-3xl p-6 glass-border flex flex-col justify-between group transition-all duration-300 hover:bg-surface-container-high">
          <div>
            <div className="w-10 h-10 rounded-xl bg-primary-fixed-dim/10 flex items-center justify-center text-primary-fixed-dim mb-4">
              <CircleDollarSign size={20} />
            </div>
            <p className="text-on-surface-variant text-sm font-medium">Comissões Pagas</p>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-white">R$ 12.140,00</h3>
            <p className="text-on-surface-variant text-xs mt-1">4 barbeiros ativos</p>
          </div>
        </div>

        <div className="bg-primary-container rounded-3xl p-6 flex flex-col justify-between shadow-[0_0_40px_rgba(200,255,0,0.15)]">
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#4f6700]/10 flex items-center justify-center text-[#4f6700] mb-4">
              <PiggyBank size={20} />
            </div>
            <p className="text-on-primary-container text-sm font-bold">Lucro Líquido</p>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-[#4f6700]">R$ 22.020,00</h3>
            <p className="text-[#4f6700]/70 text-xs font-bold mt-1">Margem de 51.7%</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Revenue Chart (Asymmetric larger card) */}
        <div className="lg:col-span-2 bg-surface-container rounded-3xl p-8 glass-border">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-lg font-bold text-white">Faturamento Diário</h2>
              <p className="text-on-surface-variant text-sm">Últimos 14 dias</p>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-surface-container-high text-xs font-bold rounded-xl glass-border text-on-surface-variant hover:text-white transition-colors">Semanal</button>
              <button className="px-4 py-2 bg-[#C8FF00] text-[#4f6700] text-xs font-bold rounded-xl">Mensal</button>
            </div>
          </div>

          <div className="h-64 flex items-end justify-between gap-1 sm:gap-2 px-2 overflow-x-auto custom-scrollbar pb-2">
            {[40, 65, 45, 85, 95, 55, 40, 60, 75, 50, 65, 90, 30, 45].map((height, i) => (
              <div 
                key={i}
                className={`flex-1 min-w-[20px] sm:min-w-0 rounded-t-lg transition-all duration-300 cursor-pointer group relative ${height === 95 ? 'bg-[#C8FF00] shadow-[0_0_15px_rgba(200,255,0,0.3)]' : 'bg-surface-container-highest hover:bg-[#C8FF00]'}`}
                style={{ height: `${height}%` }}
              >
                {height === 95 ? (
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] text-[#C8FF00] font-bold z-10 w-max">R$3.2k</span>
                ) : (
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] bg-black p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 w-max">
                    R${(height * 0.03).toFixed(1)}k
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-surface-container rounded-3xl p-8 glass-border flex flex-col">
          <h2 className="text-lg font-bold text-white mb-6">Meios de Pagamento</h2>
          
          <div className="flex-1 flex flex-col justify-center gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#C8FF00]"></div>
                  <span className="text-sm font-medium text-white">Cartão (InfinitePay)</span>
                </div>
                <span className="text-sm font-bold">65%</span>
              </div>
              <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                <div className="bg-[#C8FF00] h-full" style={{ width: '65%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-outline"></div>
                  <span className="text-sm font-medium text-white">PIX</span>
                </div>
                <span className="text-sm font-bold">28%</span>
              </div>
              <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                <div className="bg-outline h-full" style={{ width: '28%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-surface-variant"></div>
                  <span className="text-sm font-medium text-white">Dinheiro</span>
                </div>
                <span className="text-sm font-bold">7%</span>
              </div>
              <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                <div className="bg-surface-variant h-full" style={{ width: '7%' }}></div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-surface-container-low rounded-2xl border border-outline-variant/20">
            <p className="text-[10px] text-outline uppercase tracking-widest font-bold mb-2 text-center">Taxas Médias InfinitePay</p>
            <div className="flex justify-between text-xs">
              <span className="text-[#C8FF00]">Crédito: 1.25%</span>
              <span className="text-on-surface-variant">Débito: 0.98%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions and Commissions Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Recent Transactions (List) */}
        <div className="xl:col-span-2 bg-surface-container rounded-3xl p-6 sm:p-8 glass-border">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-white">Transações Recentes</h2>
            <button className="text-xs font-bold text-[#C8FF00] uppercase tracking-wider hover:underline">Ver Extrato</button>
          </div>
          
          <div className="space-y-4">
            {/* Transaction Item 1 */}
            <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl group transition-all duration-300 hover:bg-surface-container-high border border-transparent hover:border-[#C8FF00]/10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden glass-border shrink-0">
                  <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDRHEMBJZDRmhQfhHBbtaRsRm_euI4rvp0LWwqZBP30jlUkLL0ApqLDXDFyPesWAipXFGD4bLOz9r3jUYw8XbpMeQpznPjcIwIeJJWt0LWZzrFb2aAblnNBJwBGN1uRf7bAbvFXuvD-RCxzRNR44FW0MBW8RgRJgkfiNpIJf8VLECWICNwqHtRELZeGbboiolzphadDS56PS-Ui7Yw7Hb3iHkH2Sklzqtt2DrCXfThXSlYmvyj288uinEm2Q0df_ranvMRZltYIqzYE" alt="Corte" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">Corte Fade + Barba</h4>
                  <p className="text-[10px] sm:text-xs text-on-surface-variant">Marcos Vinicius • 14:20</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-black text-white">R$ 85,00</div>
                <div className="hidden sm:flex items-center gap-1 justify-end mt-1">
                  <span className="w-2 h-2 rounded-full bg-[#C8FF00] animate-pulse"></span>
                  <span className="text-[10px] text-[#C8FF00] font-bold uppercase tracking-tighter">Liquidado</span>
                </div>
              </div>
            </div>

            {/* Transaction Item 2 */}
            <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl group transition-all duration-300 hover:bg-surface-container-high border border-transparent hover:border-[#C8FF00]/10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-surface-container-highest flex items-center justify-center shrink-0">
                  <ShoppingBag size={20} className="text-outline" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">Pomada Modeladora</h4>
                  <p className="text-[10px] sm:text-xs text-on-surface-variant">Ana Clara • 13:45</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-black text-white">R$ 45,00</div>
                <div className="hidden sm:flex items-center gap-1 justify-end mt-1">
                  <span className="w-2 h-2 rounded-full bg-outline"></span>
                  <span className="text-[10px] text-outline font-bold uppercase tracking-tighter">Pendente</span>
                </div>
              </div>
            </div>

            {/* Transaction Item 3 */}
            <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl group transition-all duration-300 hover:bg-surface-container-high border border-transparent hover:border-[#C8FF00]/10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden glass-border shrink-0">
                  <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCxgAwe8AkVb5VAC8rfLfXLMQwTz9Kxxs4T3We6l_SrI_dVpqGkxqgwHuCQBNwXAZiURro7Ufirrjs6iLqdhYpxHd6bjqmLYuRDwjBE-PwfSHCo79vNYMXyRgrShowxE_3RhPs1QcXyyXvzM5U-MvH5ojUfqq-NgOJ7Ot720y8aqv3rcZEERfKUDpQEOKE30CWJKRVV4MiPOT6ekEiN4udyqmNPl0czdra-1jThYHGcLdFHzPw8SUd6FPGZzs2iT_plwtc_4uJbpqt4" alt="Corte" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">Corte Tesoura</h4>
                  <p className="text-[10px] sm:text-xs text-on-surface-variant">Lucas Silva • 12:30</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-black text-white">R$ 70,00</div>
                <div className="hidden sm:flex items-center gap-1 justify-end mt-1">
                  <span className="w-2 h-2 rounded-full bg-[#C8FF00]"></span>
                  <span className="text-[10px] text-[#C8FF00] font-bold uppercase tracking-tighter">Liquidado</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pay Commissions (Action Card) */}
        <div className="bg-surface-container-high rounded-3xl p-6 sm:p-8 glass-border border-l-4 border-[#C8FF00] flex flex-col h-full mt-6 xl:mt-0">
          <h2 className="text-lg font-bold text-white mb-6">Pagar Comissões</h2>
          <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">Você possui <span className="text-white font-bold">3 pagamentos</span> pendentes nesta semana.</p>
          
          <div className="space-y-4 mb-8 flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-container-highest border border-outline-variant flex items-center justify-center text-[10px] font-black">RL</div>
                <span className="text-sm text-white font-medium">Ricardo L.</span>
              </div>
              <span className="text-sm font-bold text-[#C8FF00]">R$ 1.250,00</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-container-highest border border-outline-variant flex items-center justify-center text-[10px] font-black">JS</div>
                <span className="text-sm text-white font-medium">Jean S.</span>
              </div>
              <span className="text-sm font-bold text-[#C8FF00]">R$ 980,00</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-container-highest border border-outline-variant flex items-center justify-center text-[10px] font-black">AM</div>
                <span className="text-sm text-white font-medium">Andre M.</span>
              </div>
              <span className="text-sm font-bold text-[#C8FF00]">R$ 1.120,00</span>
            </div>
          </div>

          <div className="pt-6 border-t border-outline-variant/20 mt-auto">
            <div className="flex justify-between mb-4">
              <span className="text-sm text-on-surface-variant">Total Pendente</span>
              <span className="text-lg font-black text-white">R$ 3.350,00</span>
            </div>
            
            <button onClick={() => openModal('PDV')} className="w-full bg-[#C8FF00] text-[#4f6700] py-4 rounded-2xl font-black text-sm uppercase tracking-widest neon-glow-strong transition-all scale-100 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2">
              <Send size={18} />
              Pagar Agora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Financeiro;
