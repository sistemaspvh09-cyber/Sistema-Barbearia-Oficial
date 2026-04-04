import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, ArrowRight } from 'lucide-react';

const CustomerBooking = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState('25');
  const [selectedTime, setSelectedTime] = useState('');

  const dates = [
    { day: '23', weekday: 'SEG' },
    { day: '24', weekday: 'TER' },
    { day: '25', weekday: 'QUA' },
    { day: '26', weekday: 'QUI' },
    { day: '27', weekday: 'SEX' },
  ];

  const times = ['09:00', '10:00', '10:30', '14:00', '15:30', '16:00', '18:00'];

  return (
    <div className="flex flex-col h-full bg-[#0D0D0D]">
      <div className="p-6 flex-1">
        
        {/* Service Confirmation */}
        <div className="bg-surface-container rounded-2xl p-4 mb-8 border border-white/5 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-white">Corte Degradê</h3>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mt-1">Ricardo Silva • 45 Min</p>
          </div>
          <span className="text-sm font-black text-[#C8FF00]">R$ 45</span>
        </div>

        {/* Date Selection */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <CalendarIcon size={16} className="text-[#C8FF00]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Escolha a Data</h3>
          </div>
          <div className="flex justify-between gap-2 overflow-x-auto custom-scrollbar pb-2">
            {dates.map((date, i) => (
              <button 
                key={i}
                onClick={() => setSelectedDate(date.day)}
                className={`min-w-[60px] p-3 rounded-2xl flex flex-col items-center gap-1 transition-all border ${selectedDate === date.day ? 'bg-[#C8FF00] border-[#C8FF00] text-[#4f6700]' : 'bg-surface-container border-white/5 text-on-surface-variant hover:border-white/20'}`}
              >
                <span className={`text-[10px] font-bold ${selectedDate === date.day ? 'opacity-70' : ''}`}>{date.weekday}</span>
                <span className={`text-xl font-black ${selectedDate === date.day ? '' : 'text-white'}`}>{date.day}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Time Selection */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-[#C8FF00]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Horários em 25/Out</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {times.map((time, i) => (
              <button 
                key={i}
                onClick={() => setSelectedTime(time)}
                className={`py-3 rounded-xl text-sm font-bold transition-all border ${selectedTime === time ? 'bg-[#C8FF00] border-[#C8FF00] text-[#4f6700] neon-shadow' : 'bg-surface-container border-white/5 text-white hover:border-white/20'}`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 pt-0">
        <button 
          onClick={() => navigate('/app/checkout')}
          disabled={!selectedTime}
          className="w-full flex items-center justify-between bg-[#C8FF00] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#b3e600] text-[#4f6700] p-4 rounded-2xl font-black transition-all"
        >
          <span>Ir para Pagamento</span>
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default CustomerBooking;
