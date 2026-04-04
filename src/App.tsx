
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import CustomerLayout from './components/Layout/CustomerLayout';
import CustomerHome from './pages/Customer/CustomerHome';
import CustomerBooking from './pages/Customer/CustomerBooking';
import CustomerCheckout from './pages/Customer/CustomerCheckout';
import CustomerHistory from './pages/Customer/CustomerHistory';
import CustomerNotifications from './pages/Customer/CustomerNotifications';
import Placeholder from './pages/Placeholder';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Equipe from './pages/Equipe';
import Financeiro from './pages/Financeiro';
import Agenda from './pages/Agenda';
import Estoque from './pages/Estoque';
import Configuracoes from './pages/Configuracoes';
import Login from './pages/Login';
import ProtectedRoute from './components/Layout/ProtectedRoute';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ModalProvider } from './contexts/ModalContext';
import { NotificationToastProvider } from './contexts/NotificationToastContext';

const RootRedirect = () => {
  const { user } = useAuth();
  if (user?.user_metadata?.role === 'barbeiro') {
    return <Navigate to="/agenda" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (user?.user_metadata?.role === 'barbeiro') {
    return <Navigate to="/agenda" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <NotificationToastProvider>
        <ModalProvider>
          <BrowserRouter>
            <Routes>
              {/* Customer Public Area (B2C) */}
              <Route path="/app" element={<CustomerLayout />}>
                <Route index element={<CustomerHome />} />
                <Route path="agendar" element={<CustomerBooking />} />
                <Route path="checkout" element={<CustomerCheckout />} />
                <Route path="historico" element={<CustomerHistory />} />
                <Route path="notificacoes" element={<CustomerNotifications />} />
                <Route path="login" element={<Login />} />
              </Route>

              {/* Admin Public Routes */}
              <Route path="/login" element={<Login />} />
              
              {/* Protected Area */}
              <Route element={<ProtectedRoute />}>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<RootRedirect />} />
                
                {/* Main Modules */}
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="agenda" element={<Agenda />} />
                <Route path="clientes" element={<Clientes />} />
                
                <Route path="equipe" element={<AdminRoute><Equipe /></AdminRoute>} />
                <Route path="financeiro" element={<Financeiro />} />
                <Route path="estoque" element={<AdminRoute><Estoque /></AdminRoute>} />
                
                <Route path="fidelidade" element={<Placeholder />} />
                <Route path="configuracoes" element={<Configuracoes />} />
                
                {/* Fallback under protected layout */}
                <Route path="*" element={<RootRedirect />} />
              </Route>
            </Route>
            
            {/* Global Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          </BrowserRouter>
        </ModalProvider>
      </NotificationToastProvider>
    </AuthProvider>
  );
}

export default App;
