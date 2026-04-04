import { Calendar, Scissors, Clock, MapPin } from 'lucide-react';

const CustomerHistory = () => {
  return (
    <div className="p-6 space-y-6">
      
      {/* Próximo Agendamento */}
      <div>
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Seu Próximo Horário</h2>
        
        <div className="bg-[#C8FF00] rounded-3xl p-5 relative overflow-hidden shadow-[0_0_30px_rgba(200,255,0,0.2)]">
          <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/20 blur-xl"></div>
          
          <div className="flex justify-between items-start relative z-10 mb-4">
            <div>
              <span className="px-2 py-1 bg-black/10 text-[#4f6700] rounded-md text-[10px] font-black uppercase tracking-widest mb-2 inline-block">Confirmado</span>
              <h3 className="font-black text-[#4f6700] text-xl">25 Out, Qua</h3>
              <p className="text-[#4f6700]/70 font-bold text-sm mt-1 flex items-center gap-1">
                <Clock size={14} /> 10:30
              </p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Calendar size={24} className="text-[#4f6700]" />
            </div>
          </div>
          
          <div className="bg-black/5 rounded-2xl p-4 border border-black/10 relative z-10">
            <h4 className="font-black text-[#4f6700]">Corte Degradê</h4>
            <p className="text-xs text-[#4f6700]/80 font-bold mt-1">com Ricardo S.</p>
          </div>
        </div>
      </div>

      {/* Histórico Recente */}
      <div>
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 mt-8">Histórico</h2>
        
        <div className="space-y-4">
          <div className="bg-surface-container rounded-2xl p-4 border border-white/5 opacity-70">
            <div className="flex justify-between">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-on-surface-variant">
                  <Scissors size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Corte + Barba</h4>
                  <p className="text-xs text-on-surface-variant mt-1">28 Set • Gustavo L.</p>
                </div>
              </div>
              <span className="text-xs font-bold text-on-surface-variant">R$ 75</span>
            </div>
          </div>

          <div className="bg-surface-container rounded-2xl p-4 border border-white/5 opacity-70">
            <div className="flex justify-between">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-on-surface-variant">
                  <Scissors size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Corte Kids</h4>
                  <p className="text-xs text-on-surface-variant mt-1">15 Ago • Vinícius J.</p>
                </div>
              </div>
              <span className="text-xs font-bold text-on-surface-variant">R$ 40</span>
            </div>
          </div>
        </div>
      </div>

      {/* Endereço */}
      <div className="pt-6 border-t border-white/5 mt-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-[#C8FF00]">
            <MapPin size={18} />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">BarberPro Matriz</h4>
            <p className="text-[11px] text-on-surface-variant">Av. Paulista, 1000 - SP</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default CustomerHistory;
