import { useNavigate } from 'react-router-dom';
import { Scissors, Clock, Star, ChevronRight } from 'lucide-react';

const CustomerHome = () => {
  const navigate = useNavigate();

  const services = [
    { title: 'Corte Degradê', price: 'R$ 45,00', duration: '45 min' },
    { title: 'Corte + Barba', price: 'R$ 75,00', duration: '1h 20m' },
    { title: 'Barba à Navalha', price: 'R$ 35,00', duration: '30 min' },
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-white leading-tight">Escolha o seu<br /><span className="text-[#C8FF00]">Tratamento</span></h2>
        <p className="text-sm text-on-surface-variant mt-2">Os melhores barbeiros da cidade.</p>
      </div>

      <div className="space-y-4 mb-8">
        {services.map((service, index) => (
          <div key={index} className="bg-surface-container rounded-3xl p-5 border border-white/5 relative overflow-hidden group">
            <div className="flex justify-between items-center relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#C8FF00]/10 flex items-center justify-center text-[#C8FF00]">
                  <Scissors size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-white">{service.title}</h3>
                  <div className="flex items-center gap-3 mt-1 opacity-70">
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{service.price}</p>
                    <div className="w-1 h-1 rounded-full bg-white/20"></div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                      <Clock size={10} /> {service.duration}
                    </div>
                  </div>
                </div>
              </div>
              <button onClick={() => navigate('/app/agendar')} className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-white hover:bg-[#C8FF00] hover:text-[#4f6700] transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-6">
        <h3 className="font-bold text-white mb-4">Profissionais</h3>
        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
          {/* Barber 1 */}
          <div className="min-w-[120px] bg-surface-container rounded-2xl p-4 border border-white/5 flex flex-col items-center">
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDgm7LVdSPrMq23fFUWtKBBIGjY6jt6AoqAqGz735xh0-oo_7jSh_dL5kANxf1GoWyN9E8KUSOQpBkNrmkQjuVqlkLa7VltdMXLc_ekTuTHeOyO9khQt_4rHgaviMHetIJ6w0Qx4-uNCWH_mCxsWbfTmJdZP_wf20ZbrMG_9lk76Le79D-gkFBBfY4NtevWpPQ0z1O4G7ypjldK3WHSx4yA9zdIL-dBhkw3kPDO2pB8CnKc1AJs5tD4mHCXKqt2ErtKd2kFnuM5jlSV" alt="Ricardo" className="w-16 h-16 rounded-full object-cover mb-3 border-2 border-[#C8FF00]/30" />
            <h4 className="text-xs font-bold text-white">Ricardo</h4>
            <div className="flex items-center gap-1 mt-1 text-[#C8FF00]">
              <Star size={10} className="fill-[#C8FF00]" />
              <span className="text-[10px] font-bold">5.0</span>
            </div>
          </div>

          {/* Barber 2 */}
          <div className="min-w-[120px] bg-surface-container rounded-2xl p-4 border border-white/5 flex flex-col items-center">
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDF6ZfgcwFvIBOSO4rHUQImawy3kWZngBP65bgTzMsBSLrWO3yudPj4UkeKidccr8BHNNe83QG_7mgf1b_RSOaWl4IXlNh8RxquShwmj6jguacSzc3D3w9IkWG6wwhAfDk9PHmrMO1ZaDWZLWuXh0vpB37DHKNwEpbreUh9j4YGGbUZSs9nNo7oKUFQHtip82gJgHQCw7fRCXLgEM734AOBPq3VoilM2xRYXGIYbAqb7x_5a2t6-4Np-3ZBSVDcFhTrfAhfB5eGhf5h" alt="Gustavo" className="w-16 h-16 rounded-full object-cover mb-3" />
            <h4 className="text-xs font-bold text-white">Gustavo</h4>
            <div className="flex items-center gap-1 mt-1 text-[#C8FF00]">
              <Star size={10} className="fill-[#C8FF00]" />
              <span className="text-[10px] font-bold">4.8</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerHome;
