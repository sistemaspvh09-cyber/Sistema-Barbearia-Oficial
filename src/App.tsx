import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import CustomerLayout from './components/Layout/CustomerLayout';
import CustomerHome from './pages/Customer/CustomerHome';
import CustomerBooking from './pages/Customer/CustomerBooking';
import CustomerCheckout from './pages/Customer/CustomerCheckout';
import CustomerHistory from './pages/Customer/CustomerHistory';
import CustomerNotifications from './pages/Customer/CustomerNotifications';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Equipe from './pages/Equipe';
import Financeiro from './pages/Financeiro';
import Agenda from './pages/Agenda';
import Estoque from './pages/Estoque';
import Configuracoes from './pages/Configuracoes';
import PaymentResult from './pages/PaymentResult';
import Login from './pages/Login';
import ProtectedRoute from './components/Layout/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { BarbershopProvider, useBarbershopContext } from './contexts/BarbershopContext';
import { ModalProvider } from './contexts/ModalContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { NotificationToastProvider } from './contexts/NotificationToastContext';
import SetupBarbershop from './pages/SetupBarbershop';

const RootRedirect = () => {
  const { role, needsBarbershopSetup } = useBarbershopContext();

  if (needsBarbershopSetup) {
    return <Navigate to="/setup" replace />;
  }

  if (role === 'client') {
    return <Navigate to="/app" replace />;
  }

  if (role === 'barbeiro') {
    return <Navigate to="/agenda" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { role } = useBarbershopContext();

  if (role === 'barbeiro') {
    return <Navigate to="/agenda" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <BarbershopProvider>
        <NotificationProvider>
          <NotificationToastProvider>
            <ModalProvider>
              <BrowserRouter>
                <Routes>
                  {/* Área do Cliente B2C */}
                  <Route path="/app" element={<CustomerLayout />}>
                    <Route index element={<CustomerHome />} />
                    <Route path="agendar" element={<CustomerBooking />} />
                    <Route path="checkout" element={<CustomerCheckout />} />
                    <Route path="historico" element={<CustomerHistory />} />
                    <Route path="notificacoes" element={<CustomerNotifications />} />
                    <Route path="login" element={<Login />} />
                  </Route>

                  {/* InfinitePay payment callback — public, no auth required */}
                  <Route path="/payment-result" element={<PaymentResult />} />

                  {/* Login Admin/Barbeiro */}
                  <Route path="/login" element={<Login />} />

                  {/* Área Protegida (Admin + Barbeiro) */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/setup" element={<SetupBarbershop />} />
                    <Route path="/" element={<MainLayout />}>
                      <Route index element={<RootRedirect />} />
                      <Route path="dashboard" element={<Dashboard />} />
                      <Route path="agenda" element={<Agenda />} />
                      <Route path="clientes" element={<Clientes />} />
                      <Route path="equipe" element={<AdminRoute><Equipe /></AdminRoute>} />
                      <Route path="financeiro" element={<Financeiro />} />
                      <Route path="estoque" element={<AdminRoute><Estoque /></AdminRoute>} />
                      <Route path="configuracoes" element={<Configuracoes />} />
                      <Route path="fidelidade" element={<Navigate to="/clientes" replace />} />
                      <Route path="*" element={<RootRedirect />} />
                    </Route>
                  </Route>

                  {/* Fallback global */}
                  <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
              </BrowserRouter>
            </ModalProvider>
          </NotificationToastProvider>
        </NotificationProvider>
      </BarbershopProvider>
    </AuthProvider>
  );
}

export default App;
