import React, { useState } from 'react';
import { useFinance } from '../FinanceContext';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from '../firebase';
import { LogIn, Mail, Lock, Chrome, UserPlus, Wallet, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const LoginPage = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Left Side: Branding/Editorial (Recipe 11 style) */}
      <div className="hidden lg:flex lg:w-1/2 bg-black p-16 flex-col justify-between relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 text-white mb-12">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-black">
              <Wallet size={24} />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase">Meu Financeiro</span>
          </div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-7xl xl:text-8xl font-black text-white leading-[0.9] tracking-tighter"
          >
            DOMINE<br />SEU<br /><span className="text-slate-500">DINHEIRO.</span>
          </motion.h1>
        </div>

        <div className="relative z-10">
          <p className="text-slate-400 max-w-sm text-lg font-medium">
            A plataforma definitiva para quem busca clareza, controle e liberdade financeira. 
            Simples, elegante e poderosa.
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-slate-800 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 opacity-50" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-900 rounded-full blur-[100px] -translate-x-1/2 translate-y-1/2 opacity-50" />
      </div>

      {/* Right Side: Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md space-y-8"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center gap-4 mb-12">
            <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-white shadow-2xl">
              <Wallet size={32} />
            </div>
            <h2 className="text-2xl font-black tracking-tighter uppercase">Meu Financeiro</h2>
          </div>

          <div className="space-y-2">
            <h3 className="text-3xl font-black text-slate-800 tracking-tight">
              {isRegistering ? 'Crie sua conta' : 'Bem-vindo de volta'}
            </h3>
            <p className="text-slate-400 font-medium">
              {isRegistering 
                ? 'Junte-se a milhares de pessoas que já controlam suas finanças.' 
                : 'Acesse sua conta para gerenciar suas movimentações.'}
            </p>
          </div>

          <div className="space-y-4">
            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-4 border-2 border-slate-100 text-slate-700 rounded-2xl text-sm font-black flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-slate-50 disabled:opacity-50"
            >
              <Chrome size={20} /> Continuar com Google
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                <span className="bg-slate-50 px-4 text-slate-300">Ou use seu e-mail</span>
              </div>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-3">
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-black transition-colors" size={18} />
                  <input 
                    type="email" 
                    placeholder="E-mail" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-transparent rounded-2xl text-sm font-bold text-slate-800 placeholder:text-slate-300 focus:border-black focus:bg-white transition-all outline-none shadow-sm"
                  />
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-black transition-colors" size={18} />
                  <input 
                    type="password" 
                    placeholder="Senha" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-transparent rounded-2xl text-sm font-bold text-slate-800 placeholder:text-slate-300 focus:border-black focus:bg-white transition-all outline-none shadow-sm"
                  />
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-rose-50 rounded-xl border border-rose-100"
                >
                  <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest text-center">
                    {error}
                  </p>
                </motion.div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-black text-white rounded-2xl text-sm font-black shadow-2xl shadow-slate-200 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {isRegistering ? 'Criar Conta' : 'Entrar'}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="text-center pt-4">
            <button 
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-black transition-colors"
            >
              {isRegistering ? 'Já tem uma conta? Entre aqui' : 'Não tem conta? Crie uma agora'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
