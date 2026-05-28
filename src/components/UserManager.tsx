import React, { useState } from 'react';
import { useFinance } from '../FinanceContext';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from '../firebase';
import { 
  updatePassword, 
  reauthenticateWithCredential, 
  EmailAuthProvider 
} from 'firebase/auth';
import { User, LogIn, LogOut, Mail, Lock, Chrome, UserPlus, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../types';

export const UserManager = () => {
  const { user } = useFinance();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // States for Password Change
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState<string | null>(null);
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);

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

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err: any) {
      console.error("Logout error", err);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeError(null);
    setPasswordChangeSuccess(null);

    const currentUser = auth.currentUser;
    const isAdmin = currentUser?.email?.toLowerCase() === 'admin@meufinanceiro.com';

    let finalCurrentPassword = currentPassword;
    let finalNewPassword = newPassword;
    let finalConfirmPassword = confirmPassword;

    // Map "admin" / "Itaintme01" to "Itaintme01", but also support "adminadmin" for backward compatibility
    if (isAdmin && (currentPassword === 'admin' || currentPassword === 'Itaintme01')) {
      finalCurrentPassword = 'Itaintme01';
    } else if (isAdmin && currentPassword === 'adminadmin') {
      finalCurrentPassword = 'adminadmin';
    }

    if (isAdmin && (newPassword === 'admin' || newPassword === 'Itaintme01')) {
      finalNewPassword = 'Itaintme01';
    }
    if (isAdmin && (confirmPassword === 'admin' || confirmPassword === 'Itaintme01')) {
      finalConfirmPassword = 'Itaintme01';
    }

    if (finalNewPassword !== finalConfirmPassword) {
      setPasswordChangeError('As novas senhas não coincidem.');
      return;
    }

    if (finalNewPassword.length < 6) {
      setPasswordChangeError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      if (currentUser && currentUser.email) {
        // Reauthenticate first (Firebase security requirement for sensitive account changes)
        try {
          const credential = EmailAuthProvider.credential(currentUser.email, finalCurrentPassword);
          await reauthenticateWithCredential(currentUser, credential);
        } catch (authErr) {
          // If the mapped 'Itaintme01' failed, try 'adminadmin' fallback as well for compatibility
          if (isAdmin && finalCurrentPassword === 'Itaintme01') {
            try {
              const fallbackCred = EmailAuthProvider.credential(currentUser.email, 'adminadmin');
              await reauthenticateWithCredential(currentUser, fallbackCred);
            } catch (fbErr) {
              throw authErr; // throw original
            }
          } else {
            throw authErr;
          }
        }
        
        // Update password
        await updatePassword(currentUser, finalNewPassword);
        setPasswordChangeSuccess('Senha alterada com sucesso!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setShowPasswordChange(false), 2000);
      } else {
        setPasswordChangeError('Usuário não autenticado ou inválido.');
      }
    } catch (err: any) {
      console.error("Erro ao alterar senha:", err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setPasswordChangeError('A senha atual fornecida está incorreta.');
      } else {
        setPasswordChangeError(err.message || 'Ocorreu um erro ao alterar a senha.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div className="bg-white p-8 rounded-[2.5rem] card-shadow space-y-8 border border-slate-50">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt={user.displayName || 'User'} 
                className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 border-4 border-white shadow-lg">
                <User size={48} />
              </div>
            )}
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full shadow-sm" />
          </div>
          
          <div>
            <h3 className="text-xl font-black text-slate-800">{user.displayName || 'Usuário'}</h3>
            <p className="text-sm text-slate-400 font-medium">{user.email}</p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-50 space-y-3">
          <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status da Conta</span>
            <span className="text-xs font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">Ativa</span>
          </div>

          <button 
            type="button"
            onClick={() => {
              setShowPasswordChange(!showPasswordChange);
              setPasswordChangeError(null);
              setPasswordChangeSuccess(null);
            }}
            className="w-full py-4 px-6 bg-slate-50 text-slate-700 rounded-2xl text-sm font-black flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-slate-100"
          >
            <Lock size={18} /> {showPasswordChange ? 'Ocultar Alterar Senha' : 'Alterar Senha Admin / Conta'}
          </button>

          <AnimatePresence>
            {showPasswordChange && (
              <motion.form 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handlePasswordChange}
                className="space-y-4 pt-4 border-t border-slate-50 overflow-hidden"
              >
                <div className="space-y-3">
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="password" 
                      placeholder="Senha Atual" 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-base font-bold text-slate-800 placeholder:text-slate-300 focus:ring-2 focus:ring-black outline-none transition-all shadow-sm"
                    />
                  </div>

                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="password" 
                      placeholder="Nova Senha" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-base font-bold text-slate-800 placeholder:text-slate-300 focus:ring-2 focus:ring-black outline-none transition-all shadow-sm"
                    />
                  </div>

                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="password" 
                      placeholder="Confirmar Nova Senha" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-base font-bold text-slate-800 placeholder:text-slate-300 focus:ring-2 focus:ring-black outline-none transition-all shadow-sm"
                    />
                  </div>
                </div>

                {passwordChangeSuccess && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest text-center">
                      {passwordChangeSuccess}
                    </p>
                  </div>
                )}

                {passwordChangeError && (
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest text-center">
                      {passwordChangeError}
                    </p>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-black text-white rounded-2xl text-sm font-black shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Confirmar Alteração'
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
          
          <button 
            type="button"
            onClick={handleLogout}
            className="w-full py-4 px-6 bg-rose-50 text-rose-500 rounded-2xl text-sm font-black flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-rose-100"
          >
            <LogOut size={18} /> Sair da Conta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-[2.5rem] card-shadow space-y-8 border border-slate-50">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-black text-slate-800">
          {isRegistering ? 'Criar Conta' : 'Bem-vindo de volta'}
        </h3>
        <p className="text-sm text-slate-400 font-medium">
          {isRegistering ? 'Comece sua jornada financeira hoje' : 'Acesse seus dados financeiros com segurança'}
        </p>
      </div>

      <form onSubmit={handleEmailAuth} className="space-y-4">
        <div className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="email" 
              placeholder="E-mail" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-base font-bold text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-black transition-all"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="password" 
              placeholder="Senha" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-base font-bold text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-black transition-all"
            />
          </div>
        </div>

        {error && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[10px] font-bold text-rose-500 uppercase tracking-widest text-center"
          >
            {error}
          </motion.p>
        )}

        <button 
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-black text-white rounded-2xl text-sm font-black shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              {isRegistering ? <UserPlus size={18} /> : <LogIn size={18} />}
              {isRegistering ? 'Criar Minha Conta' : 'Entrar no Sistema'}
            </>
          )}
        </button>
      </form>

      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-100" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
          <span className="bg-white px-4 text-slate-300">Ou continue com</span>
        </div>
      </div>

      <button 
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full py-4 border-2 border-slate-100 text-slate-600 rounded-2xl text-sm font-black flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-slate-50"
      >
        <Chrome size={18} /> Google
      </button>

      <div className="text-center">
        <button 
          onClick={() => setIsRegistering(!isRegistering)}
          className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-black transition-colors"
        >
          {isRegistering ? 'Já tem uma conta? Entre aqui' : 'Não tem conta? Crie uma agora'}
        </button>
      </div>
    </div>
  );
};
