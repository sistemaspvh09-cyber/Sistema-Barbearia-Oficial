
import { 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  Wallet, 
  Filter, 
  Download, 
  MoreVertical, 
  ShoppingCart, 
  BarChart, 
  ChevronRight, 
  ChevronLeft, 
  Plus 
} from 'lucide-react';

const Estoque = () => {
  return (
    <div className="pt-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">Controle de Estoque</h1>
          <p className="text-on-surface-variant font-medium">Gerencie seus suprimentos e produtos de revenda em tempo real.</p>
        </div>
        <button onClick={() => alert('Módulo de inserção de estoque em desenvolvimento.')} className="bg-[#C8FF00] text-[#4f6700] px-6 py-3 rounded-xl font-extrabold flex items-center gap-2 hover:scale-[1.02] transition-transform shadow-[0px_0px_20px_rgba(200,255,0,0.2)]">
          <Plus size={20} className="font-bold" />
          Novo Produto
        </button>
      </div>

      {/* Summary Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Products */}
        <div className="glass-card rounded-[1.5rem] p-6 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#C8FF00]/5 rounded-full blur-2xl group-hover:bg-[#C8FF00]/10 transition-colors"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-[#C8FF00]">
              <Package size={24} />
            </div>
          </div>
          <p className="text-on-surface-variant font-bold text-xs uppercase tracking-widest mb-1">Total de Produtos</p>
          <h3 className="text-4xl font-black text-white tracking-tighter">142</h3>
          <p className="mt-2 text-xs text-[#C8FF00] flex items-center gap-1 font-bold">
            <TrendingUp size={14} />
            +12% vs mês anterior
          </p>
        </div>

        {/* Low Stock Items */}
        <div className="glass-card rounded-[1.5rem] p-6 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-error/5 rounded-full blur-2xl group-hover:bg-error/10 transition-colors"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-error">
              <AlertTriangle size={24} />
            </div>
            <span className="bg-error/10 text-error px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Atenção</span>
          </div>
          <p className="text-on-surface-variant font-bold text-xs uppercase tracking-widest mb-1">Itens em Alerta</p>
          <h3 className="text-4xl font-black text-white tracking-tighter">08</h3>
          <p className="mt-2 text-xs text-on-surface-variant font-medium">Requer reposição imediata</p>
        </div>

        {/* Total Value */}
        <div className="glass-card rounded-[1.5rem] p-6 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-white">
              <Wallet size={24} />
            </div>
          </div>
          <p className="text-on-surface-variant font-bold text-xs uppercase tracking-widest mb-1">Valor em Estoque</p>
          <h3 className="text-4xl font-black text-white tracking-tighter">R$ 14.280</h3>
          <p className="mt-2 text-xs text-on-surface-variant font-medium">Custo total dos ativos</p>
        </div>
      </div>

      {/* Detailed Inventory Table */}
      <div className="glass-card rounded-[1.5rem] overflow-hidden mb-8">
        <div className="p-6 flex justify-between items-center border-b border-white/5">
          <h2 className="text-xl font-extrabold tracking-tight text-white">Catálogo Detalhado</h2>
          <div className="flex gap-2">
            <button className="p-2 text-on-surface-variant hover:text-white transition-colors">
              <Filter size={20} />
            </button>
            <button className="p-2 text-on-surface-variant hover:text-white transition-colors">
              <Download size={20} />
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-[#1A1919]/50">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Produto</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Marca / SKU</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Categoria</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-right">Preço Custo</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-right">Preço Venda</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-center">Quantidade</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {/* Row 1 */}
              <tr className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-surface-container-high overflow-hidden">
                      <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuD7gFdlxwRb4_gzh7ppv8fv4MoXeZdR_1iL4LPOmNXcgdxvHeVZ5876wyIZWtWaSrFUVwJ0SB7lFK3B3wnl-_JdpbTAlluE29E-Hl-p1BEhBRWIDQwifzuCiAf_hvkMFkHtcVR_sUOgxYxqqHAGGwZYWEXoqiJNpvmDRr8QfUk2e2OFFi4DRWjzHzmR5dVyj8umSc4odDiY6-6t6S9iYAZd_9l7uGCoR_1DvqWVTdXfm4S_czkMTurGaRRA_Zn5f_Pzj9LmgsDeWUqV" alt="Pomada" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-bold text-white group-hover:text-[#C8FF00] transition-colors">Pomada Matte Premium</p>
                      <p className="text-[10px] text-on-surface-variant">Frasco 150g</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-white">BarberPro Lab</p>
                  <p className="text-[10px] text-on-surface-variant font-mono">SKU-29831-BP</p>
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant text-[10px] font-bold rounded-full uppercase">Styling</span>
                </td>
                <td className="px-6 py-4 text-right text-sm font-mono text-white">R$ 45,90</td>
                <td className="px-6 py-4 text-right text-sm font-bold text-[#C8FF00] font-mono">R$ 89,00</td>
                <td className="px-6 py-4 text-center">
                  <span className="text-sm font-black text-white">42</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C8FF00]"></div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-white">Em Estoque</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <button className="p-2 text-on-surface-variant hover:text-white"><MoreVertical size={18} /></button>
                </td>
              </tr>
              
              {/* Row 2 */}
              <tr className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-surface-container-high overflow-hidden">
                      <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuB1aZvQUHIB6DF70_ckKZfK45r0RaxdMHAwj3jhvy_688eslkAIuDA6EO1PkYnp2JoqC7Q-EAPYLuusvywVjuExRQ-BU5khEe6WI_2yXVnKPtBNv63VE-vPmJ_pyt0zybj1r-r-ONgop4TpxGemHvYIVhIKuxjPPNB4hwrbT0tt_rhKgSU5Bp4F48oyJV9k7a8ZfyGEP2L-kMru6Itbrtt7mCniS7w6FBdSE_f0iPaWdNcIa1RiVuH1-JQjAKXOsdljRRwZ65IYFnsJ" alt="Óleo" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-bold text-white group-hover:text-[#C8FF00] transition-colors">Óleo de Barba Sândalo</p>
                      <p className="text-[10px] text-on-surface-variant">Frasco 30ml</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-white">Viking Grooming</p>
                  <p className="text-[10px] text-on-surface-variant font-mono">SKU-10292-VK</p>
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant text-[10px] font-bold rounded-full uppercase">Cuidado</span>
                </td>
                <td className="px-6 py-4 text-right text-sm font-mono text-white">R$ 22,00</td>
                <td className="px-6 py-4 text-right text-sm font-bold text-[#C8FF00] font-mono">R$ 55,00</td>
                <td className="px-6 py-4 text-center">
                  <span className="text-sm font-black text-error">04</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-error"></div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-error">Estoque Baixo</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <button className="p-2 text-on-surface-variant hover:text-white"><MoreVertical size={18} /></button>
                </td>
              </tr>
              
              {/* Row 3 */}
              <tr className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-surface-container-high overflow-hidden">
                      <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCk2EYc44wHE0Gowskt-RjBQ40y6c-d-3kd2ZweTESIBG3XaJ5uwHigmcRiils6r0T6uaA2Occ8FgSxmdExY9woyAxpRyTKzrAV0gmd8jumcgklnUler-AbzPK73XjonL4BPVpnKVppPy_pTpwCdapBXFSKuA1LrJbFtJ3h9Stjqd4m3GJaI8nCkAj2XxBnk76vshxv7wCGvX0oqczVIGembweai44JYar3KtMDv0oGRKkLDpTrO7GGcXRAJ6v0h0InXJUnS0ETgnHR" alt="Lâminas" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-bold text-white group-hover:text-[#C8FF00] transition-colors">Lâminas Platinum (100un)</p>
                      <p className="text-[10px] text-on-surface-variant">Caixa Descartável</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-white">Derby Pro</p>
                  <p className="text-[10px] text-on-surface-variant font-mono">SKU-55421-DB</p>
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant text-[10px] font-bold rounded-full uppercase">Uso Interno</span>
                </td>
                <td className="px-6 py-4 text-right text-sm font-mono text-white">R$ 115,00</td>
                <td className="px-6 py-4 text-right text-sm font-bold text-[#C8FF00] font-mono">R$ 0,00</td>
                <td className="px-6 py-4 text-center">
                  <span className="text-sm font-black text-white">15</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Esgotado</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <button className="p-2 text-on-surface-variant hover:text-white"><MoreVertical size={18} /></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="p-4 bg-surface-container-low/30 flex justify-between items-center border-t border-white/5">
          <p className="text-xs text-on-surface-variant">Mostrando <span className="font-bold text-white">3</span> de <span className="font-bold text-white">142</span> produtos</p>
          <div className="flex gap-1">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-on-surface-variant hover:border-[#C8FF00] hover:text-[#C8FF00] transition-all">
              <ChevronLeft size={16} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#C8FF00] text-[#4f6700] font-bold text-xs">1</button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-on-surface-variant hover:border-[#C8FF00] hover:text-[#C8FF00] transition-all text-xs font-bold">2</button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-on-surface-variant hover:border-[#C8FF00] hover:text-[#C8FF00] transition-all text-xs font-bold">3</button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-on-surface-variant hover:border-[#C8FF00] hover:text-[#C8FF00] transition-all">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Action Cards Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-[1.5rem] p-8 flex items-center gap-6 group cursor-pointer hover:bg-surface-container-high transition-colors">
          <div className="w-16 h-16 rounded-2xl bg-[#C8FF00]/10 flex items-center justify-center text-[#C8FF00] group-hover:scale-110 transition-transform duration-300">
            <ShoppingCart size={28} className="fill-[#C8FF00] text-[#C8FF00]" />
          </div>
          <div className="flex-1">
            <h4 className="text-xl font-extrabold tracking-tight mb-1 text-white">Reposição Rápida</h4>
            <p className="text-sm text-on-surface-variant font-medium">Gere uma lista de compras baseada nos itens com estoque crítico.</p>
          </div>
          <ChevronRight size={20} className="text-on-surface-variant group-hover:text-[#C8FF00] transition-colors" />
        </div>
        
        <div className="glass-card rounded-[1.5rem] p-8 flex items-center gap-6 group cursor-pointer hover:bg-surface-container-high transition-colors">
          <div className="w-16 h-16 rounded-2xl bg-surface-container-highest flex items-center justify-center text-[#C8FF00] group-hover:scale-110 transition-transform duration-300">
            <BarChart size={28} />
          </div>
          <div className="flex-1">
            <h4 className="text-xl font-extrabold tracking-tight mb-1 text-white">Relatórios de Giro</h4>
            <p className="text-sm text-on-surface-variant font-medium">Analise quais produtos vendem mais e otimize seu capital de giro.</p>
          </div>
          <ChevronRight size={20} className="text-on-surface-variant group-hover:text-[#C8FF00] transition-colors" />
        </div>
      </div>
    </div>
  );
};

export default Estoque;
