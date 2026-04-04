
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = () => {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Elegant loading state that covers the screen initially if the session check is slow
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-[#C8FF00] mb-4" size={40} />
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest animate-pulse">
          Autenticando sessão...
        </p>
      </div>
    );
  }

  if (!session) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated, render the child routes which should be our MainLayout usually
  return <Outlet />;
};

export default ProtectedRoute;
