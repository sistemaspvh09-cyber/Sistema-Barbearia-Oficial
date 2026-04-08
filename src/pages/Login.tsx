import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader2, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useBarbershopContext } from '../contexts/BarbershopContext';

const Login = () => {
  const { session } = useAuth();
  const { role, loading: contextLoading, needsBarbershopSetup } = useBarbershopContext();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  
  // States for UX feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (session) {
    if (contextLoading) {
      return (
        <div className="min-h-screen bg-surface flex items-center justify-center">
          <Loader2 className="animate-spin text-[#C8FF00]" size={32} />
        </div>
      );
    }

    if (role === 'client') {
      return <Navigate to="/app/historico" replace />;
    }

    if (needsBarbershopSetup) {
      return <Navigate to="/setup" replace />;
    }

    return <Navigate to={role === 'barbeiro' ? '/agenda' : '/dashboard'} replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }
      
      // If success, the AuthContext listener will automatically redirect because `session` state changes
    } catch (err: any) {
      setError(err.message || 'Falha ao autenticar.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw new Error(error.message);
      }

      setSuccessMsg('As instruções para redefinição foram enviadas para o seu e-mail.');
    } catch (err: any) {
      setError(err.message || 'Falha ao solicitar redefinição.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6 relative overflow-hidden">
      {/* Abstract Background Effects */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#C8FF00]/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary-container/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold tracking-tighter text-[#C8FF00] mb-2">BarberPro</h1>
          <p className="text-on-surface-variant font-medium text-sm tracking-widest uppercase">Master Admin</p>
        </div>

        <div className="glass-card rounded-[2rem] p-8 sm:p-10 border border-white/5 shadow-[0_30px_60px_rgba(0,0,0,0.6)] relative">
          
          {error && (
            <div className="mb-6 bg-error/10 border border-error/20 p-4 rounded-xl flex items-start gap-3">
              <AlertCircle className="text-error shrink-0 mt-0.5" size={18} />
              <p className="text-error text-xs font-bold leading-relaxed">{error}</p>
            </div>
          )}
          
          {successMsg && (
            <div className="mb-6 bg-[#C8FF00]/10 border border-[#C8FF00]/20 p-4 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="text-[#C8FF00] shrink-0 mt-0.5" size={18} />
              <p className="text-[#C8FF00] text-xs font-bold leading-relaxed">{successMsg}</p>
            </div>
          )}

          {!isForgotPassword ? (
            /* --- LOGIN FORM --- */
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Bem-vindo de volta!</h2>
                <p className="text-sm text-on-surface-variant">Acesse para gerenciar sua barbearia.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="admin@barberpro.com" 
                      className="w-full pl-12 pr-4 py-4 bg-surface-container-highest border border-white/5 rounded-xl focus:border-[#C8FF00] focus:ring-1 focus:ring-[#C8FF00] text-white transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Senha</label>
                    <button 
                      type="button" 
                      onClick={() => {
                        setIsForgotPassword(true);
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className="text-[10px] font-bold text-[#C8FF00] hover:underline uppercase tracking-wider"
                    >
                      Esqueceu as credenciais?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                    <input 
                      type="password" 
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••" 
                      className="w-full pl-12 pr-4 py-4 bg-surface-container-highest border border-white/5 rounded-xl focus:border-[#C8FF00] focus:ring-1 focus:ring-[#C8FF00] text-white transition-all outline-none tracking-widest"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#C8FF00] text-[#4f6700] py-4 rounded-xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(200,255,0,0.15)] hover:shadow-[0_0_30px_rgba(200,255,0,0.3)] disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    Entrar no Sistema
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* --- FORGOT PASSWORD FORM --- */
            <form onSubmit={handleResetPassword} className="space-y-6">
              <button 
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setError(null);
                  setSuccessMsg(null);
                }} 
                className="w-8 h-8 flex items-center justify-center bg-surface-container rounded-full hover:bg-white/10 transition-colors text-white mb-4"
              >
                <ArrowLeft size={16} />
              </button>
              
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Recuperar Acesso</h2>
                <p className="text-sm text-on-surface-variant">Enviaremos um link de recuperação para o e-mail atrelado à conta.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="admin@barberpro.com" 
                      className="w-full pl-12 pr-4 py-4 bg-surface-container-highest border border-white/5 rounded-xl focus:border-[#C8FF00] focus:ring-1 focus:ring-[#C8FF00] text-white transition-all outline-none"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#C8FF00] text-[#4f6700] py-4 rounded-xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(200,255,0,0.15)] hover:shadow-[0_0_30px_rgba(200,255,0,0.3)] disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Enviar Link Seguro'}
              </button>
            </form>
          )}

        </div>
        
        <p className="text-center text-[10px] text-on-surface-variant uppercase tracking-widest mt-8 font-bold">
          © 2026 BarberPro Systems. Protegido por SSL.
        </p>
      </div>
    </div>
  );
};

export default Login;
