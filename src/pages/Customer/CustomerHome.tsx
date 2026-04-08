import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Scissors, Star } from 'lucide-react';
import { usePublicBarbershop } from '../../hooks/usePublicBarbershop';
import { formatCurrency, getInitials } from '../../lib/format';
import { supabase } from '../../lib/supabase';

const CustomerHome = () => {
  const navigate = useNavigate();
  const { barbershop, services, barbers, loading, error } = usePublicBarbershop();
  const [barberNames, setBarberNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!barbers.length) {
      setBarberNames({});
      return;
    }

    supabase
      .from('User')
      .select('id, name')
      .in('id', barbers.map((barber) => barber.userId))
      .then(({ data }) => {
        setBarberNames(Object.fromEntries(((data ?? []) as { id: string; name: string }[]).map((entry) => [entry.id, entry.name])));
      });
  }, [barbers]);

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-black leading-tight text-white">
          {barbershop?.name ?? 'BarberPro'}
        </h2>
        <p className="mt-2 text-sm text-on-surface-variant">
          Escolha um serviço real do catálogo e siga para o agendamento.
        </p>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-white/5 bg-surface-container p-6 text-center text-on-surface-variant">
          Carregando serviços...
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-white/5 bg-surface-container p-6 text-center">
          <p className="text-lg font-bold text-white">Nao foi possivel carregar a barbearia</p>
          <p className="mt-2 text-sm text-on-surface-variant">{error}</p>
        </div>
      ) : services.length === 0 ? (
        <div className="rounded-3xl border border-white/5 bg-surface-container p-6 text-center">
          <p className="text-lg font-bold text-white">Nenhum serviço disponível</p>
          <p className="mt-2 text-sm text-on-surface-variant">Cadastre serviços ativos para liberar o agendamento online.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {services.map((service) => (
            <div key={service.id} className="rounded-3xl border border-white/5 bg-surface-container p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C8FF00]/10 text-[#C8FF00]">
                    <Scissors size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{service.name}</h3>
                    <div className="mt-1 flex items-center gap-3 opacity-70">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{formatCurrency(service.price)}</p>
                      <div className="h-1 w-1 rounded-full bg-white/20" />
                      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                        <Clock size={10} /> {service.duration} min
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/app/agendar?service=${service.id}`)}
                  className="rounded-full bg-surface-container-highest px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#C8FF00] hover:text-[#4f6700]"
                >
                  Agendar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mb-6 mt-8">
        <h3 className="mb-4 font-bold text-white">Profissionais</h3>
        {barbers.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-surface-container p-4 text-sm text-on-surface-variant">
            A equipe ficará visível assim que os perfis de barbeiro forem vinculados.
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
            {barbers.map((barber) => {
              const name = barberNames[barber.userId] ?? 'Profissional';
              return (
                <button
                  key={barber.id}
                  onClick={() => navigate(`/app/agendar?barber=${barber.id}`)}
                  className="min-w-[140px] rounded-2xl border border-white/5 bg-surface-container p-4 text-left"
                  >
                  <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#C8FF00]/30 bg-[#C8FF00]/10 text-lg font-black text-[#C8FF00]">
                    {getInitials(name)}
                  </div>
                  <h4 className="text-xs font-bold text-white">{name}</h4>
                  <p className="mt-1 text-[10px] uppercase tracking-widest text-on-surface-variant">{barber.specialty ?? 'Barbeiro'}</p>
                  <div className="mt-2 flex items-center gap-1 text-[#C8FF00]">
                    <Star size={10} className="fill-[#C8FF00]" />
                    <span className="text-[10px] font-bold">Perfil ativo</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerHome;
