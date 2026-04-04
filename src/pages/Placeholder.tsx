
import { Construction } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const Placeholder = () => {
  const location = useLocation();

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <div className="w-24 h-24 rounded-full bg-[#C8FF00]/10 flex items-center justify-center text-[#C8FF00] mb-6">
        <Construction size={48} />
      </div>
      <h2 className="text-3xl font-extrabold text-white mb-2">Página em Construção</h2>
      <p className="text-on-surface-variant max-w-md">
        O módulo <span className="font-bold text-[#C8FF00]">{location.pathname}</span> está sendo integrado com a nova interface premium. Volte em breve!
      </p>
    </div>
  );
};

export default Placeholder;
