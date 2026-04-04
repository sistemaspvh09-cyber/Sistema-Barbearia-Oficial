
import { 
  Plus, 
  Zap, 
  TrendingUp, 
  MoreVertical, 
  ArrowRight, 
  UserPlus, 
  CheckCircle 
} from 'lucide-react';

const Equipe = () => {
  return (
    <div className="pt-8 pb-12">
      {/* Hero / Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-4">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tighter text-on-surface mb-2">
            Minha Equipe <span className="text-primary/50 text-2xl ml-2 font-medium">(3/10)</span>
          </h2>
          <p className="text-on-surface-variant max-w-md">Gerencie os profissionais da sua barbearia, acompanhe faturamentos individuais e conecte contas para pagamentos instantâneos.</p>
        </div>
        <button onClick={() => alert('Módulo de convite de equipe em desenvolvimento.')} className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all neon-glow">
          <Plus size={20} className="font-bold" />
          Novo Barbeiro
        </button>
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Senior Barber */}
        <div className="glass-card rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4">
            <div className="flex items-center gap-1 bg-surface-container-highest px-3 py-1 rounded-full border border-primary/20">
              <Zap size={14} className="text-primary fill-primary" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">InfinitePay</span>
            </div>
          </div>
          
          <div className="flex items-start gap-4 mb-6 mt-8">
            <div className="relative">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDAeilDbZp3MORhVwAjsfUDgOc-64ZIbNRo4cSu_K1sUhHXUzMcHDS4zja4xh8F4yeuYHcPngXdsq3T46-4bidlZkVbg8qyFTXl2S-5VyxzuWKwe1S9_H7ob9nhXt1lkarAsvfl_-K_oYPjxJ3OfnBG0j-5B8hwRw8lH7n24hPJwssTmCtjuQRQvyDV4w_VrjD7bXuLmL5YMkEHz7vmD8eFlT-R7P6oTIOMrIqDAEo1QV23xpleTjNYvKwCz8o8AT5zOXiRYhjJ77ac" 
                alt="Bruno 'The King'" 
                className="w-20 h-20 rounded-2xl object-cover bg-surface-container group-hover:scale-105 transition-transform duration-500" 
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary border-4 border-surface-container-low rounded-full"></span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-on-surface">Bruno 'The King'</h3>
              <p className="text-sm text-on-surface-variant font-medium">Especialista em Degradê</p>
              <div className="mt-2 flex items-center gap-4">
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase font-bold">Comissão</p>
                  <p className="text-sm font-bold text-primary">60%</p>
                </div>
                <div className="w-[1px] h-6 bg-outline-variant/30"></div>
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase font-bold">Status</p>
                  <p className="text-sm font-bold text-white">Ativo</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-surface-container-low rounded-2xl p-4 flex justify-between items-center">
            <div>
              <p className="text-[10px] text-on-surface-variant uppercase font-bold mb-1">Faturamento Mês</p>
              <p className="text-2xl font-black text-white">R$ 8.420,00</p>
            </div>
            <TrendingUp size={28} className="text-on-surface-variant/30" />
          </div>
          
          <div className="mt-6 flex gap-3">
            <button className="flex-1 py-2 text-xs font-bold border border-outline-variant/30 rounded-lg hover:bg-white/5 transition-colors">Editar Perfil</button>
            <button className="px-3 py-2 text-on-surface-variant hover:text-white transition-colors">
              <MoreVertical size={20} />
            </button>
          </div>
        </div>

        {/* Card 2: Creative Barber */}
        <div className="glass-card rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4">
            <div className="flex items-center gap-1 bg-surface-container-highest px-3 py-1 rounded-full border border-primary/20">
              <Zap size={14} className="text-primary fill-primary" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">InfinitePay</span>
            </div>
          </div>
          
          <div className="flex items-start gap-4 mb-6 mt-8">
            <div className="relative">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC4hghKP5H_mbACBiUAMCnLZiTPTeP5M-7lYgxcQcdFVYrj4LO6mPCzmMs-ze-a3_G3WVqkEq3UI6Bb2owY68e65bU3Vn7lbBCslq-X1UCEqcsnrg4J9LmpRkK650U6jbNPcItbo0Np19PDS7sR6Rjpm5lXx1JhU-urO_lsVakBrJ0O8oB4UvwdqWq2Gk1bNjVK50SszCmQAyyO3XSBMKpTRBBQfOnz_s7MR29CN-pUTBNdwt0Meusc65cylwmrdR-Iw69pFYXKxCWK" 
                alt="Luana Souza" 
                className="w-20 h-20 rounded-2xl object-cover bg-surface-container group-hover:scale-105 transition-transform duration-500" 
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary border-4 border-surface-container-low rounded-full"></span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-on-surface">Luana Souza</h3>
              <p className="text-sm text-on-surface-variant font-medium">Design de Barba &amp; Visagismo</p>
              <div className="mt-2 flex items-center gap-4">
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase font-bold">Comissão</p>
                  <p className="text-sm font-bold text-primary">50%</p>
                </div>
                <div className="w-[1px] h-6 bg-outline-variant/30"></div>
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase font-bold">Status</p>
                  <p className="text-sm font-bold text-white">Ativo</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-surface-container-low rounded-2xl p-4 flex justify-between items-center">
            <div>
              <p className="text-[10px] text-on-surface-variant uppercase font-bold mb-1">Faturamento Mês</p>
              <p className="text-2xl font-black text-white">R$ 5.910,50</p>
            </div>
            <TrendingUp size={28} className="text-on-surface-variant/30" />
          </div>
          
          <div className="mt-6 flex gap-3">
            <button className="flex-1 py-2 text-xs font-bold border border-outline-variant/30 rounded-lg hover:bg-white/5 transition-colors">Editar Perfil</button>
            <button className="px-3 py-2 text-on-surface-variant hover:text-white transition-colors">
              <MoreVertical size={20} />
            </button>
          </div>
        </div>

        {/* Card 3: Junior (Disconnected) */}
        <div className="glass-card rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4">
            <div className="flex items-center gap-1 bg-surface-container-lowest px-3 py-1 rounded-full border border-white/5">
              <Zap size={14} className="text-on-surface-variant" />
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Pendente</span>
            </div>
          </div>
          
          <div className="flex items-start gap-4 mb-6 mt-8">
            <div className="relative">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAuJFf8XuutfSy_pvmVGJcvS4wlEJRsvgqkmUyUAD8Pkad52VKUzKhGbq1MBxH8PSziNTafCrFRdPNjK7blMDkzDgivhNkHYMkXpHF37dMEveFFzNoltDbdIi8e4Pm8x0G0q1aavpoufEwq0RHP_3s_CdgSkZk_E3qcS87wTWug0NoDXpRlr09yfKGMPYpxiXqkbusUL-ExNMw3bIo2g8G76NjT7IfnTT2EXcLLlTqtfdIyPYIBIs4Z__Wwlkk9BtgGXHyV4qH1sACl" 
                alt="Marcus V." 
                className="w-20 h-20 rounded-2xl object-cover bg-surface-container group-hover:scale-105 transition-transform duration-500" 
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary border-4 border-surface-container-low rounded-full"></span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-on-surface">Marcus V.</h3>
              <p className="text-sm text-on-surface-variant font-medium">Auxiliar &amp; Cortes Kids</p>
              <div className="mt-2 flex items-center gap-4">
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase font-bold">Comissão</p>
                  <p className="text-sm font-bold text-primary">40%</p>
                </div>
                <div className="w-[1px] h-6 bg-outline-variant/30"></div>
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase font-bold">Status</p>
                  <p className="text-sm font-bold text-white">Ativo</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-surface-container-low rounded-2xl p-4 flex justify-between items-center">
            <div>
              <p className="text-[10px] text-on-surface-variant uppercase font-bold mb-1">Faturamento Mês</p>
              <p className="text-2xl font-black text-white">R$ 2.150,00</p>
            </div>
            <ArrowRight size={28} className="text-on-surface-variant/30" />
          </div>
          
          <div className="mt-6 flex gap-3">
            <button onClick={() => alert('Edição de perfil em desenvolvimento.')} className="flex-1 py-2 text-xs font-bold border border-outline-variant/30 rounded-lg hover:bg-white/5 transition-colors">Editar Perfil</button>
            <button onClick={() => alert('Mais opções...')} className="px-3 py-2 text-on-surface-variant hover:text-white transition-colors">
              <MoreVertical size={20} />
            </button>
          </div>
        </div>

        {/* Empty Slot / Action Card */}
        <div className="border-2 border-dashed border-outline-variant/30 rounded-3xl p-6 flex flex-col items-center justify-center text-center group hover:border-primary/50 transition-colors cursor-pointer min-h-[300px]">
          <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <UserPlus size={28} className="text-on-surface-variant group-hover:text-primary" />
          </div>
          <h3 className="font-bold text-on-surface-variant group-hover:text-on-surface">Adicionar Profissional</h3>
          <p className="text-xs text-on-surface-variant mt-1">Vaga disponível na sua barbearia</p>
        </div>
      </div>

      {/* Performance Bento (Extra Context) */}
      <div className="mt-12 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 glass-card rounded-3xl p-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
            <h4 className="text-xl font-bold">Produtividade Semanal</h4>
            <select className="bg-surface-container border-none text-xs rounded-lg font-bold text-primary focus:ring-1 focus:ring-[#C8FF00] outline-none py-2 px-4">
              <option>Todos os Barbeiros</option>
              <option>Bruno 'The King'</option>
              <option>Luana Souza</option>
            </select>
          </div>
          
          {/* Mock Graph Representation */}
          <div className="h-48 flex items-end gap-2 px-2">
            {[40, 65, 55, 90, 75, 45, 30].map((height, i) => (
              <div 
                key={i} 
                className={`flex-1 rounded-t-xl transition-colors ${height === 90 ? 'bg-primary shadow-[0_-10px_20px_rgba(200,255,0,0.2)]' : 'bg-surface-container-highest hover:bg-primary/20'}`}
                style={{ height: `${height}%` }}
              ></div>
            ))}
          </div>
          <div className="flex justify-between mt-4 px-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">
            <span>Seg</span><span>Ter</span><span>Qua</span><span className="text-primary">Qui</span><span>Sex</span><span>Sáb</span><span>Dom</span>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-8 flex flex-col justify-between overflow-hidden relative">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
          <div>
            <h4 className="text-sm font-bold text-on-surface-variant uppercase mb-4">Total Pago Hoje</h4>
            <p className="text-4xl font-black text-primary">R$ 1.250</p>
          </div>
          <div className="mt-auto">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={16} className="text-primary" />
              <p className="text-xs font-medium">Split de pagamentos ativo</p>
            </div>
            <p className="text-[10px] text-on-surface-variant">Todas as comissões foram creditadas via InfinitePay.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Equipe;
