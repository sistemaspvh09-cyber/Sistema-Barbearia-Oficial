
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, CircleDollarSign, Users, Menu } from 'lucide-react';
import { useModal } from '../../contexts/ModalContext';

const MobileBottomBar = () => {
  const { openModal } = useModal();
  
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-[#1A1919]/90 backdrop-blur-md flex justify-around items-center px-4 pb-6 pt-3 z-50 rounded-t-[24px] border-t border-[#C8FF00]/15 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      <NavLink
        to="/dashboard"
        className={({ isActive }) => 
          `flex flex-col items-center justify-center p-2 transition-colors ${isActive ? 'text-[#C8FF00]' : 'text-[#A0A0A0]'}`
        }
      >
        <LayoutDashboard size={24} />
        <span className="font-['Plus_Jakarta_Sans'] text-[10px] font-bold uppercase tracking-widest mt-1">Início</span>
      </NavLink>

      <NavLink
        to="/agenda"
        className={({ isActive }) => 
          `flex flex-col items-center justify-center p-2 transition-colors ${isActive ? 'text-[#C8FF00]' : 'text-[#A0A0A0]'}`
        }
      >
        <CalendarDays size={24} />
        <span className="font-['Plus_Jakarta_Sans'] text-[10px] font-bold uppercase tracking-widest mt-1">Agenda</span>
      </NavLink>

      <NavLink
        to="/financeiro"
        className={({ isActive }) => 
          `flex flex-col items-center justify-center p-3 rounded-2xl -mt-6 transition-all shadow-[0_0_20px_rgba(200,255,0,0.4)] ${
            isActive ? 'bg-[#C8FF00] text-[#4f6700]' : 'bg-[#1A1919] text-[#C8FF00] border border-[#C8FF00]'
          }`
        }
      >
        <CircleDollarSign size={28} />
        <span className="font-['Plus_Jakarta_Sans'] text-[10px] font-bold uppercase tracking-widest">Finanças</span>
      </NavLink>

      <NavLink
        to="/clientes"
        className={({ isActive }) => 
          `flex flex-col items-center justify-center p-2 transition-colors ${isActive ? 'text-[#C8FF00]' : 'text-[#A0A0A0]'}`
        }
      >
        <Users size={24} />
        <span className="font-['Plus_Jakarta_Sans'] text-[10px] font-bold uppercase tracking-widest mt-1">Clientes</span>
      </NavLink>

      <button 
        onClick={() => openModal('MENU_MOBILE')}
        className="flex flex-col items-center justify-center text-[#A0A0A0] hover:text-[#C8FF00] p-2 transition-colors"
      >
        <Menu size={24} />
        <span className="font-['Plus_Jakarta_Sans'] text-[10px] font-bold uppercase tracking-widest mt-1">Menu</span>
      </button>
    </nav>
  );
};

export default MobileBottomBar;
