
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import MobileBottomBar from './MobileBottomBar';
import MobileDrawer from './MobileDrawer';
import PDVModal from '../Modals/PDVModal';
import AgendamentoModal from '../Modals/AgendamentoModal';
import NovoClienteModal from '../Modals/NovoClienteModal';

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      <Sidebar />
      <TopBar />
      
      {/* Main Content Area */}
      {/* 
        Spacing metrics: 
        lg:ml-72 (Sidebar width) 
        pt-20 lg:pt-28 (TopBar height offset + padding)
        pb-28 lg:pb-8 (MobileBottomBar offset)
      */}
      <main className="lg:ml-72 pt-20 lg:pt-28 pb-28 lg:pb-12 px-4 lg:px-8 max-w-[1600px] mx-auto min-h-screen relative">
        <Outlet />
      </main>

      <MobileBottomBar />
      <MobileDrawer />
      <PDVModal />
      <AgendamentoModal />
      <NovoClienteModal />
    </div>
  );
};


export default MainLayout;
