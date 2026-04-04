import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Plus } from 'lucide-react';
import { useModal } from '../contexts/ModalContext';

const locales = {
  'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const myEventsList = [
  {
    title: 'Corte Degradê - Marcos',
    start: new Date(new Date().setHours(9, 0, 0, 0)),
    end: new Date(new Date().setHours(9, 45, 0, 0)),
  },
  {
    title: 'Barba + Toalha - André',
    start: new Date(new Date().setHours(10, 30, 0, 0)),
    end: new Date(new Date().setHours(11, 30, 0, 0)),
  },
  {
    title: 'Combo VIP - João',
    start: new Date(new Date().setHours(14, 0, 0, 0)),
    end: new Date(new Date().setHours(15, 30, 0, 0)),
  }
];

const Agenda = () => {
  const { openModal } = useModal();

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] mt-6 relative">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Agenda Dinâmica</h1>
        </div>
      </div>

      <div className="flex-1 bg-surface-container rounded-3xl p-6 glass-border overflow-hidden custom-calendar-wrapper">
        <Calendar
          localizer={localizer}
          events={myEventsList}
          startAccessor="start"
          endAccessor="end"
          culture="pt-BR"
          messages={{
            next: "Próximo",
            previous: "Anterior",
            today: "Hoje",
            month: "Mês",
            week: "Semana",
            day: "Dia"
          }}
          style={{ height: '100%', color: '#fff' }}
        />
      </div>

      <button onClick={() => openModal('AGENDAMENTO')} className="fixed bottom-24 lg:bottom-10 right-6 lg:right-10 w-16 h-16 bg-[#C8FF00] text-[#4f6700] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(200,255,0,0.4)] transition-all hover:scale-110 active:scale-90 z-50">
        <Plus size={32} className="font-black" />
      </button>
    </div>
  );
};

export default Agenda;
