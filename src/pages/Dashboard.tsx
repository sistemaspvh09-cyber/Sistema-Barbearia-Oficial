
import { 
  TrendingUp, 
  CalendarCheck, 
  UserPlus, 
  Wallet, 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Hourglass, 
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const BarberDashboard = () => {
  return (
    <>
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Minhas Metas Hoje</h1>
        <p className="text-on-surface-variant">Foque no seu atendimento. Nós cuidamos do resto.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Cortes Feitos */}
        <div className="glass-card p-6 rounded-2xl neon-shadow transition-all group">
          <p className="text-on-surface-variant text-sm font-medium mb-1">Cortes Finalizados</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-extrabold">4</h3>
            <span className="text-on-surface-variant text-xs font-medium">de 8 metas</span>
          </div>
          <div className="w-full bg-[#C8FF00]/10 h-2 rounded-full mt-4 overflow-hidden">
            <div className="bg-[#C8FF00] h-full" style={{width: '50%'}}></div>
          </div>
        </div>

        {/* Comissão Estimada */}
        <div className="glass-card p-6 rounded-2xl transition-all group border-l-4 border-[#C8FF00] shadow-[0_0_30px_rgba(200,255,0,0.1)]">
          <p className="text-on-surface-variant text-sm font-medium mb-1">Comissão Acumulada (Hoje)</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-extrabold text-[#C8FF00]">R$ 145,00</h3>
          </div>
          <div className="mt-4 flex items-center gap-2 text-[11px] text-on-surface-variant">
            <TrendingUp size={14} />
            Pagamento em 05/Nov
          </div>
        </div>

        {/* Próximo Cliente */}
        <div className="glass-card p-6 rounded-2xl transition-all group bg-surface-container-high border border-white/5">
          <p className="text-on-surface-variant text-sm font-medium mb-1 text-white">Próximo Cliente (10:30)</p>
          <div className="flex items-center gap-4 mt-3">
             <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
               <UserPlus size={18} />
             </div>
             <div>
               <h3 className="text-sm font-bold text-white">Roberto Amaral</h3>
               <p className="text-xs text-on-surface-variant">Corte Degradê</p>
             </div>
          </div>
        </div>
      </div>
    </>
  );
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user?.user_metadata?.role === 'barbeiro') {
    return <BarberDashboard />;
  }

  return (
    <>
      {/* Header Section */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Bom dia, Ricardo</h1>
        <p className="text-on-surface-variant">Sua barbearia está operando com 85% de capacidade hoje.</p>
      </div>

      {/* KPI Cards Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {/* Faturamento */}
        <div className="glass-card p-6 rounded-2xl neon-shadow transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#C8FF00]/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-500"></div>
          <p className="text-on-surface-variant text-sm font-medium mb-1">Faturamento Total</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-extrabold">R$ 15.420,00</h3>
            <span className="text-primary-container text-xs font-bold">+12%</span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-[11px] text-on-surface-variant">
            <TrendingUp size={14} />
            vs. mês passado
          </div>
        </div>

        {/* Agendamentos */}
        <div className="glass-card p-6 rounded-2xl neon-shadow transition-all group">
          <p className="text-on-surface-variant text-sm font-medium mb-1">Agendamentos</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-extrabold">12</h3>
            <span className="text-on-surface-variant text-xs font-medium">hoje</span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-[11px] text-on-surface-variant">
            <CalendarCheck size={14} />
            4 horários livres
          </div>
        </div>

        {/* Novos Clientes */}
        <div className="glass-card p-6 rounded-2xl neon-shadow transition-all group">
          <p className="text-on-surface-variant text-sm font-medium mb-1">Novos Clientes</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-extrabold">8</h3>
            <span className="text-primary-container text-xs font-bold">+5%</span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-[11px] text-on-surface-variant">
            <UserPlus size={14} />
            na última semana
          </div>
        </div>

        {/* Ticket Médio */}
        <div className="glass-card p-6 rounded-2xl neon-shadow transition-all group">
          <p className="text-on-surface-variant text-sm font-medium mb-1">Ticket Médio</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-extrabold">R$ 95,00</h3>
            <span className="text-primary-container text-xs font-bold">+2%</span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-[11px] text-on-surface-variant">
            <Wallet size={14} />
            aumentando
          </div>
        </div>
      </div>

      {/* Charts & Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart Section */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-10 gap-4">
            <div>
              <h2 className="text-xl font-bold">Faturamento Diário</h2>
              <p className="text-on-surface-variant text-sm">Desempenho dos últimos 7 dias</p>
            </div>
            <select className="bg-surface-container border-none text-sm rounded-lg focus:ring-1 outline-none py-2 px-4 focus:ring-[#C8FF00] text-white">
              <option>Últimos 7 dias</option>
              <option>Mensal</option>
            </select>
          </div>

          {/* Mock Bar Chart */}
          <div className="h-64 flex items-end justify-between gap-2 sm:gap-4">
            <div className="flex-1 flex flex-col items-center gap-4 group">
              <div className="w-full bg-[#C8FF00]/10 rounded-t-lg h-[40%] transition-all group-hover:bg-[#C8FF00]"></div>
              <span className="text-[10px] text-on-surface-variant">SEG</span>
            </div>
            <div className="flex-1 flex flex-col items-center gap-4 group">
              <div className="w-full bg-[#C8FF00]/10 rounded-t-lg h-[65%] transition-all group-hover:bg-[#C8FF00]"></div>
              <span className="text-[10px] text-on-surface-variant">TER</span>
            </div>
            <div className="flex-1 flex flex-col items-center gap-4 group">
              <div className="w-full bg-[#C8FF00]/10 rounded-t-lg h-[85%] transition-all group-hover:bg-[#C8FF00]"></div>
              <span className="text-[10px] text-on-surface-variant">QUA</span>
            </div>
            <div className="flex-1 flex flex-col items-center gap-4 group">
              <div className="w-full bg-[#C8FF00]/10 rounded-t-lg h-[55%] transition-all group-hover:bg-[#C8FF00]"></div>
              <span className="text-[10px] text-on-surface-variant">QUI</span>
            </div>
            <div className="flex-1 flex flex-col items-center gap-4 group">
              <div className="w-full bg-[#C8FF00]/10 rounded-t-lg h-[95%] transition-all group-hover:bg-[#C8FF00]"></div>
              <span className="text-[10px] text-on-surface-variant">SEX</span>
            </div>
            <div className="flex-1 flex flex-col items-center gap-4 group">
              <div className="w-full bg-[#C8FF00] rounded-t-lg h-[100%]"></div>
              <span className="text-[10px] text-[#C8FF00] font-bold">SAB</span>
            </div>
            <div className="flex-1 flex flex-col items-center gap-4 group">
              <div className="w-full bg-[#C8FF00]/10 rounded-t-lg h-[30%] transition-all group-hover:bg-[#C8FF00]"></div>
              <span className="text-[10px] text-on-surface-variant">DOM</span>
            </div>
          </div>
        </div>

        {/* Ranking de Barbeiros */}
        <div className="glass-card rounded-2xl p-8">
          <h2 className="text-xl font-bold mb-6">Ranking de Barbeiros</h2>
          
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDgm7LVdSPrMq23fFUWtKBBIGjY6jt6AoqAqGz735xh0-oo_7jSh_dL5kANxf1GoWyN9E8KUSOQpBkNrmkQjuVqlkLa7VltdMXLc_ekTuTHeOyO9khQt_4rHgaviMHetIJ6w0Qx4-uNCWH_mCxsWbfTmJdZP_wf20ZbrMG_9lk76Le79D-gkFBBfY4NtevWpPQ0z1O4G7ypjldK3WHSx4yA9zdIL-dBhkw3kPDO2pB8CnKc1AJs5tD4mHCXKqt2ErtKd2kFnuM5jlSV" alt="Marco Tulio" className="w-12 h-12 rounded-xl object-cover" />
                <div className="absolute -top-2 -right-2 bg-[#C8FF00] text-[#4f6700] text-[10px] font-extrabold w-5 h-5 flex items-center justify-center rounded-full border-2 border-background">1</div>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold">Marco Tulio</h4>
                <p className="text-[11px] text-on-surface-variant">42 cortes • R$ 2.450</p>
              </div>
              <div className="text-right flex items-center gap-1 justify-end">
                <Star size={14} className="text-[#C8FF00] fill-[#C8FF00]" />
                <span className="text-xs font-bold">4.9</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDF6ZfgcwFvIBOSO4rHUQImawy3kWZngBP65bgTzMsBSLrWO3yudPj4UkeKidccr8BHNNe83QG_7mgf1b_RSOaWl4IXlNh8RxquShwmj6jguacSzc3D3w9IkWG6wwhAfDk9PHmrMO1ZaDWZLWuXh0vpB37DHKNwEpbreUh9j4YGGbUZSs9nNo7oKUFQHtip82gJgHQCw7fRCXLgEM734AOBPq3VoilM2xRYXGIYbAqb7x_5a2t6-4Np-3ZBSVDcFhTrfAhfB5eGhf5h" alt="Gustavo Lima" className="w-12 h-12 rounded-xl object-cover" />
                <div className="absolute -top-2 -right-2 bg-white/10 text-on-surface text-[10px] font-extrabold w-5 h-5 flex items-center justify-center rounded-full border-2 border-background">2</div>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold">Gustavo Lima</h4>
                <p className="text-[11px] text-on-surface-variant">38 cortes • R$ 2.120</p>
              </div>
              <div className="text-right flex items-center gap-1 justify-end">
                <Star size={14} className="text-[#C8FF00] fill-[#C8FF00]" />
                <span className="text-xs font-bold">4.8</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuA_TwmDRwuIcWVE_vU9zQ32rFG_3DkUbqqmZCID4It5KWsj0sDzyQ02UXvNRXeFruXXmMPX5RY3V9ZQMXdkHAQ7hmZ6-Ejyfftf4H1OpUxZdcwICsQXftT4mEXjLY6QdduPjPH47jce3XRsT8Zu_QKRpFtNeduYgJ6ahEiIQCDSvcYeVlSjSGx6jgT2HblIgckpVd1yPvkZKDVylrpVAt3o6vkJLxz4spdp1EODNmHIXhH2C8_ZFBlrwHO4DBMOvv8daTnJVJBXMHUb" alt="André Silva" className="w-12 h-12 rounded-xl object-cover" />
                <div className="absolute -top-2 -right-2 bg-white/10 text-on-surface text-[10px] font-extrabold w-5 h-5 flex items-center justify-center rounded-full border-2 border-background">3</div>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold">André Silva</h4>
                <p className="text-[11px] text-on-surface-variant">31 cortes • R$ 1.840</p>
              </div>
              <div className="text-right flex items-center gap-1 justify-end">
                <Star size={14} className="text-[#C8FF00] fill-[#C8FF00]" />
                <span className="text-xs font-bold">4.7</span>
              </div>
            </div>
          </div>

          <button onClick={() => navigate('/financeiro')} className="w-full mt-8 py-3 text-xs font-bold text-on-surface-variant hover:text-[#C8FF00] transition-colors border border-white/5 rounded-xl">
            Ver relatório detalhado
          </button>
        </div>
      </div>

      {/* Agenda de Hoje Timeline Section */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-extrabold tracking-tight">Agenda de Hoje</h2>
          <div className="flex gap-2">
            <button className="p-2 glass-card rounded-lg hover:bg-[#C8FF00]/10 hover:text-[#C8FF00] transition-all">
              <ChevronLeft size={16} />
            </button>
            <button className="p-2 glass-card rounded-lg hover:bg-[#C8FF00]/10 hover:text-[#C8FF00] transition-all">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="relative pl-8 space-y-6">
          {/* Timeline Vertical Line */}
          <div className="absolute left-3 top-2 bottom-2 w-[2px] bg-white/5"></div>

          {/* Timeline Item: Completed */}
          <div className="relative flex items-center gap-4 sm:gap-6">
            <div className="absolute -left-[23px] w-3 h-3 rounded-full bg-white/20 border-2 border-background"></div>
            <span className="text-sm font-bold text-on-surface-variant w-12 sm:w-16">09:00</span>
            <div className="flex-1 glass-card p-4 rounded-xl flex items-center justify-between opacity-60">
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex w-10 h-10 rounded-full bg-white/5 items-center justify-center">
                  <Check size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold">Carlos Eduardo</p>
                  <p className="text-[11px] text-on-surface-variant">Corte + Barba • Marco Tulio</p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 bg-white/5 rounded-full hidden sm:block">Finalizado</span>
            </div>
          </div>

          {/* Timeline Item: In Progress (Active) */}
          <div className="relative flex items-center gap-4 sm:gap-6">
            <div className="absolute -left-[23px] w-3 h-3 rounded-full bg-[#C8FF00] border-2 border-background shadow-[0_0_10px_rgba(200,255,0,0.5)]"></div>
            <span className="text-sm font-bold text-[#C8FF00] w-12 sm:w-16">10:30</span>
            <div className="flex-1 glass-card p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-[#C8FF00] neon-shadow">
              <div className="flex items-center gap-4">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAmE7tzyzCiqnejIGdd13vaM_qgIcW_L6A9Bdo1a4is48cN0IK8ubg1RVDBaGaO22xMIpMfRhLRSW8E1KfTSqj_AGviv9I5F9FirzAgHDyLslt8fFIsvFUe6lv0C9LHCRsErnzwwKRhh5NqliZdhS9PJzJQjjkXKa_EQgZt3OqfNTLdBMHx6KcUyTUpgQW7XrIERfdTeVlBx3nWf3CEfS7GyFFMneVCLxo9NPGeHFy3eTgHRae_Mw33FF_35n5NrsG69qlhDp4hOX6_" alt="Client" className="hidden sm:block w-12 h-12 rounded-xl object-cover" />
                <div>
                  <p className="text-base font-bold">Roberto Amaral</p>
                  <p className="text-xs text-on-surface-variant">Corte Degradê • Gustavo Lima</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-[#C8FF00]">Em Andamento</p>
                <p className="text-[10px] text-on-surface-variant hidden sm:block">Restam 15 min</p>
              </div>
            </div>
          </div>

          {/* Timeline Item: Upcoming */}
          <div className="relative flex items-center gap-4 sm:gap-6">
            <div className="absolute -left-[23px] w-3 h-3 rounded-full bg-white/20 border-2 border-background"></div>
            <span className="text-sm font-bold text-on-surface-variant w-12 sm:w-16">11:15</span>
            <div className="flex-1 glass-card p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex w-10 h-10 rounded-full bg-[#C8FF00]/5 items-center justify-center text-[#C8FF00]">
                  <Hourglass size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold">Felipe Machado</p>
                  <p className="text-[11px] text-on-surface-variant">Barba Terapia • Marco Tulio</p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 bg-[#C8FF00]/10 text-[#C8FF00] rounded-full hidden sm:block">Confirmado</span>
            </div>
          </div>

          {/* Timeline Item: Upcoming */}
          <div className="relative flex items-center gap-4 sm:gap-6">
            <div className="absolute -left-[23px] w-3 h-3 rounded-full bg-white/20 border-2 border-background"></div>
            <span className="text-sm font-bold text-on-surface-variant w-12 sm:w-16">13:00</span>
            <div className="flex-1 glass-card p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex w-10 h-10 rounded-full bg-white/5 items-center justify-center">
                  <Clock size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold">João Vitor</p>
                  <p className="text-[11px] text-on-surface-variant">Corte Kids • André Silva</p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 bg-white/5 rounded-full hidden sm:block">Aguardando</span>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default Dashboard;
