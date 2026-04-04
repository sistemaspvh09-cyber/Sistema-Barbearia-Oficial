import React from 'react';
import { 
  UserPlus, 
  Users, 
  Star, 
  CalendarDays, 
  Wallet, 
  Filter, 
  Download, 
  Eye, 
  MessageCircle, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import { useModal } from '../contexts/ModalContext';

const Clientes = () => {
  const { openModal } = useModal();

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold tracking-tighter text-white">Gestão de Clientes</h1>
          <p className="text-on-surface-variant font-medium">Controle sua base fiel de clientes e métricas de engajamento.</p>
        </div>
        <button onClick={() => openModal('NOVO_CLIENTE')} className="flex items-center gap-2 bg-[#C8FF00] text-[#4f6700] px-6 py-3 rounded-2xl font-extrabold hover:scale-[1.05] shadow-[0px_0px_20px_rgba(200,255,0,0.2)] hover:shadow-[0px_0px_25px_rgba(200,255,0,0.35)] transition-all duration-300">
          <UserPlus size={20} className="font-bold" />
          Novo Cliente
        </button>
      </div>

      {/* Dashboard Insights (Bento) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-125 transition-transform duration-500">
            <Users size={120} />
          </div>
          <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-2">Total de Clientes</p>
          <h3 className="text-3xl font-black text-white">1.284</h3>
          <div className="mt-4 flex items-center gap-2 text-[#C8FF00] text-xs font-bold">
            <TrendingUpIcon className="text-sm" />
            <span>+12% este mês</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-125 transition-transform duration-500">
            <Star size={120} />
          </div>
          <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-2">Clientes VIP</p>
          <h3 className="text-3xl font-black text-white">142</h3>
          <div className="mt-4 flex items-center gap-2 text-on-surface-variant text-xs font-medium">
            <span>11% da base total</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-125 transition-transform duration-500">
            <CalendarDays size={120} />
          </div>
          <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-2">Retenção Mensal</p>
          <h3 className="text-3xl font-black text-white">78%</h3>
          <div className="mt-4 flex items-center gap-2 text-error text-xs font-bold">
            <TrendingDownIcon className="text-sm" />
            <span>-3% vs out</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-125 transition-transform duration-500">
            <Wallet size={120} />
          </div>
          <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-2">LTV Médio</p>
          <h3 className="text-3xl font-black text-white">R$ 420</h3>
          <div className="mt-4 flex items-center gap-2 text-[#C8FF00] text-xs font-bold">
            <span>Ticket médio saudável</span>
          </div>
        </div>
      </div>

      {/* Filters & Table Section */}
      <div className="glass-card rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-4 sm:p-6 border-b border-white/5 flex flex-wrap gap-4 items-center justify-between bg-[rgba(26,25,25,0.5)]">
          <div className="flex flex-wrap items-center gap-2">
            <button className="px-4 sm:px-5 py-2 rounded-xl bg-[#C8FF00] text-[#4f6700] text-sm font-bold shadow-lg">Todos</button>
            <button className="px-4 sm:px-5 py-2 rounded-xl hover:bg-white/5 text-on-surface-variant text-sm font-medium transition-colors">Ativos</button>
            <button className="px-4 sm:px-5 py-2 rounded-xl hover:bg-white/5 text-on-surface-variant text-sm font-medium transition-colors">Inativos</button>
            <button className="px-4 sm:px-5 py-2 rounded-xl hover:bg-white/5 text-on-surface-variant text-sm font-medium transition-colors">VIP</button>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/5 transition-colors">
              <Filter size={18} />
              <span className="hidden sm:inline">Mais Filtros</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/5 transition-colors">
              <Download size={18} />
              <span className="hidden sm:inline">Exportar</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[rgba(32,31,31,0.3)]">
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-on-surface-variant border-b border-white/5">Cliente</th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-on-surface-variant border-b border-white/5">Visitas</th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-on-surface-variant border-b border-white/5">Total Gasto</th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-on-surface-variant border-b border-white/5">Última Visita</th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-on-surface-variant border-b border-white/5">Status</th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-on-surface-variant border-b border-white/5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                { 
                  name: 'Ricardo Oliveira', 
                  phone: '(11) 98822-1234', 
                  visits: '24', 
                  spent: 'R$ 1.840,00', 
                  lastVisit: '12 Nov, 2023', 
                  status: 'VIP Member', 
                  img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC0bHDsNtUOtAPa4EyA5_xnHvRZq7JwOToB8K6zAHFbXVtjwyWMXaznLSn2hPkNG0j0Bugy4PcSmyJgo4e_rJie4Q3DQs3yRAWJKflKH4xTUZ8GEDOz7RrJsVY6dNEUjY6lfAP6CYq25u0NGqZ-NAhhoPy4eExWW7XanM6x9qI4xFUYjd9VLgZtMd5T-Pz-suDuRvmtEjEOxTighWnxFIOx3AYW1ko-wPaC2naaIXBcUHegN84mfZGHkrhANCOfUxl9kiksw04Rb0AR' 
                },
                { 
                  name: 'Gustavo Santos', 
                  phone: '(11) 97711-5566', 
                  visits: '8', 
                  spent: 'R$ 620,00', 
                  lastVisit: '28 Out, 2023', 
                  status: 'Ativo', 
                  img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCdJKsymErxRg4CbV8mtxNy2RiGk0s4Sb9xS7nvVIhqfRujdfMGDSa6LBnIu8ARVitjgf4M_hn6eYbn55iUVBp9SBSTuHzeN4Ug4lpCWb72q9RC9fv6ajpNVF5Hgm8JimJ5rxORGoXxjMUixf47gR_1rN4AszQTJaMXoTDI4r257NG1MP_YC68-bLXgmsDGwsE9CflZvmuBhrsPZ3aw414sAevDuwUUzxNNhtFXDQnbOI9JXD16Pl2dv5QTgi52NY0sOwGJIxEdyH4-' 
                },
                { 
                  name: 'Felipe Mendes', 
                  phone: '(11) 94433-8899', 
                  visits: '32', 
                  spent: 'R$ 2.450,00', 
                  lastVisit: '15 Nov, 2023', 
                  status: 'VIP Member', 
                  img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAPgcKgGSxok23Q5FQR8pHQATLERHklL7DX6vSy1w8Vbm2bxnLT2prWm5gFeHv_BjXEtXQ9ubE5qasmjewVFG7f2xZvss8JGzFJ0os5OyjGBfGEPeRF7GP-EdVw29mjdM2apWile5bzwPS-tbgCbL3OcgzMIgmJliqvUKE9LnOJAwHYF2NyB4NTPNob_h7YmUbcQ_RUbo8L8Ek4b8dQUN44o8HUBnwKjpOwCvuv4dqorFwiMrFMShNApDcSdmIyiBnjZm8ix7nTU1No' 
                },
                { 
                  name: 'Marcos Valente', 
                  phone: '(11) 92211-3322', 
                  visits: '2', 
                  spent: 'R$ 180,00', 
                  lastVisit: '05 Ago, 2023', 
                  status: 'Inativo', 
                  img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAbIAD2CM8gb2LCD3n_dqac6anJvB5t7AVcBzP9i3v7PzQ8TUAoGXGqTqNzTK66fE9X0Uf6HXj3MWmRTr3XeG_CmMhBKPBdZNWbmmlS8pRHAQr7w4mh4BOr765wuYxEunaAdLeqhHo4apLzBmZbqRyk9ccOVoBziryL7754JicBQNWlgVqFwGL7u-YBbzzSwxu1Gio_7z9O4en5Page3Vb1mVdf0izAUD-a4yxULoRXDUHxfDGgpbdqSsArn42CzXZHDrEGxsYqogcQ' 
                }
              ].map((client, index) => (
                <tr key={index} className={`hover:bg-white/[0.02] transition-colors group ${client.status === 'Inativo' ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl overflow-hidden bg-[rgba(26,25,25,0.7)] shadow-inner ${client.status === 'Inativo' ? 'grayscale' : ''}`}>
                        <img src={client.img} alt={client.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-white font-bold group-hover:text-[#C8FF00] transition-colors">{client.name}</p>
                        <p className="text-sm text-on-surface-variant">{client.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-white font-medium">{client.visits} visitas</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-white font-black tracking-tight">{client.spent}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-on-surface-variant text-sm">{client.lastVisit}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                      client.status === 'VIP Member' ? 'bg-[#C8FF00]/10 text-[#C8FF00]' :
                      client.status === 'Inativo' ? 'bg-error/10 text-error' :
                      'bg-white/5 text-on-surface-variant'
                    }`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-2 rounded-xl bg-surface-container hover:bg-surface-bright text-on-surface transition-all" title="Ver Perfil">
                        <Eye size={18} />
                      </button>
                      <button className="p-2 rounded-xl bg-surface-container hover:bg-surface-bright text-[#C8FF00] transition-all" title="Mensagem">
                        <MessageCircle size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-6 border-t border-white/5 flex items-center justify-between bg-[rgba(26,25,25,0.3)]">
          <p className="text-on-surface-variant text-sm font-medium">Mostrando <span className="text-white">4</span> de <span className="text-white">1.284</span> clientes</p>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl border border-white/5 flex items-center justify-center hover:bg-white/5 disabled:opacity-30" disabled>
              <ChevronLeft size={18} />
            </button>
            <button className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#C8FF00] text-[#4f6700] font-bold flex items-center justify-center">1</button>
            <button className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl border border-white/5 flex items-center justify-center hover:bg-white/5">2</button>
            <button className="hidden sm:flex w-10 h-10 rounded-xl border border-white/5 items-center justify-center hover:bg-white/5">3</button>
            <button className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl border border-white/5 flex items-center justify-center hover:bg-white/5">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// Mini components for the icons that weren't imported from lucide
// Using a slightly different styling as inline components to avoid errors
function TrendingUpIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

function TrendingDownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
      <polyline points="16 17 22 17 22 11" />
    </svg>
  );
}

export default Clientes;
