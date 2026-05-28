import React, { useState, useRef } from 'react';
import { useFinance } from '../FinanceContext';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from '../firebase';
import { 
  sendPasswordResetEmail,
  updatePassword
} from 'firebase/auth';
import { LogIn, Mail, Lock, Chrome, UserPlus, Wallet, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const LoginPage = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password) {
      passwordRef.current?.focus();
      setError('Por favor, insira uma senha.');
      return;
    }

    setLoading(true);
    
    // Auto-append domain for usernames
    let finalEmail = email;
    if (!email.includes('@')) {
      finalEmail = `${email}@meufinanceiro.com`;
    }

    if (!validateEmail(finalEmail)) {
      setError('Por favor, insira um endereço de e-mail válido.');
      setLoading(false);
      return;
    }

    // Determine the password to use. If it's the admin user and they entered "admin" or "Itaintme01",
    // we map it to "Itaintme01" to satisfy the new requirement.
    const isAdminUser = finalEmail.toLowerCase() === 'admin@meufinanceiro.com';
    const isNewAdminPassword = isAdminUser && (password === 'admin' || password === 'Itaintme01');
    const finalPassword = isNewAdminPassword ? 'Itaintme01' : password;

    // Firebase requires at least 6 characters for passwords
    if (finalPassword.length < 6) {
      setError('A senha é muito curta. Ela deve ter pelo menos 6 caracteres para sua segurança.');
      setLoading(false);
      passwordRef.current?.focus();
      return;
    }

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, finalEmail, finalPassword);
      } else {
        try {
          await signInWithEmailAndPassword(auth, finalEmail, finalPassword);
        } catch (err: any) {
          // If login failed with the new admin password, try common old fallback passwords and migrate if possible
          if (isNewAdminPassword && (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential')) {
            const fallbackPasswords = ['adminadmin', 'admin123', 'admin123456', '123456', 'meufinanceiro', 'meufinanceiro123', 'admin'];
            let loggedInUser = null;

            for (const fallbackPass of fallbackPasswords) {
              try {
                const userCredential = await signInWithEmailAndPassword(auth, finalEmail, fallbackPass);
                loggedInUser = userCredential.user;
                break; // Successfully authenticated with a previous password!
              } catch (fallbackErr) {
                // Continue trying remaining passwords
              }
            }

            if (loggedInUser) {
              // Migrate password to the new one: 'Itaintme01'
              try {
                await updatePassword(loggedInUser, 'Itaintme01');
                console.log("Successfully migrated admin password to Itaintme01");
              } catch (updateErr) {
                console.error("Failed to automatically migrate admin password:", updateErr);
              }
              setLoading(false);
              return;
            }
          }

          // If user doesn't exist and it's one of the requested users, try to create it
          const allowedUsers = ['admin', 'victor.r', 'vinicius.r', 'nagela.a'];
          const username = email.split('@')[0];
          
          if ((err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') && allowedUsers.includes(username)) {
            try {
              await createUserWithEmailAndPassword(auth, finalEmail, finalPassword);
            } catch (signupErr: any) {
              if (signupErr.code === 'auth/email-already-in-use') {
                // Since this email is already registered, the original 'invalid-credential' 
                // block indicates an incorrect password was entered for an existing user.
                const wrongPasswordErr = new Error('Wrong password');
                (wrongPasswordErr as any).code = 'auth/wrong-password';
                throw wrongPasswordErr;
              } else {
                throw signupErr;
              }
            }
          } else {
            throw err;
          }
        }
      }
    } catch (err: any) {
      console.error("Auth error code:", err.code);
      let msg = 'Ocorreu um erro inesperado. Tente novamente.';
      
      switch (err.code) {
        case 'auth/wrong-password':
          msg = 'Senha incorreta. Se você for o Administrador Master, lembre-se que também pode entrar instantaneamente usando o botão "Entrar com o Google" com seu e-mail cadastrado (vitorrabelopires@gmail.com).';
          passwordRef.current?.focus();
          break;
        case 'auth/user-not-found':
          msg = 'Usuário não encontrado. Verifique o e-mail digitado ou crie uma nova conta.';
          break;
        case 'auth/email-already-in-use':
          msg = 'Este e-mail já está cadastrado. Tente fazer login em vez de criar uma conta.';
          break;
        case 'auth/invalid-email':
          msg = 'O formato do e-mail é inválido. Certifique-se de que digitou corretamente.';
          break;
        case 'auth/weak-password':
          msg = 'A senha escolhida é muito fraca. Tente misturar letras e números.';
          passwordRef.current?.focus();
          break;
        case 'auth/network-request-failed':
          msg = 'Erro de conexão. Verifique sua internet.';
          break;
        case 'auth/too-many-requests':
          msg = 'Muitas tentativas malsucedidas. Sua conta foi temporariamente bloqueada por segurança. Dica: Administradores podem contornar este bloqueio entrando imediatamente com o botão "Entrar com o Google"!';
          break;
        case 'auth/invalid-credential':
          msg = 'Credenciais inválidas. Se você for o Administrador Master, lembre-se que também pode entrar instantaneamente usando o botão "Entrar com o Google" com seu e-mail cadastrado (vitorrabelopires@gmail.com).';
          break;
      }
      setError(msg);
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

  const handleForgotPassword = async () => {
    setError(null);
    setSuccess(null);
    
    if (!email) {
      setError('Por favor, insira seu e-mail ou nome de usuário no campo correspondente para redefinição.');
      return;
    }

    let finalEmail = email;
    if (!email.includes('@')) {
      finalEmail = `${email}@meufinanceiro.com`;
    }

    const domain = finalEmail.split('@')[1];
    if (domain === 'meufinanceiro.com') {
      setError('Contas @meufinanceiro.com são credenciais administrativas internas. Se for Administrador Master, você também pode logar via Google @gmail com plenos poderes.');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, finalEmail);
      setSuccess('Instruções de redefinição de senha enviadas com sucesso para o seu e-mail!');
    } catch (err: any) {
      console.error("Erro no reset de senha:", err);
      if (err.code === 'auth/user-not-found') {
        setError('O e-mail digitado não foi encontrado no sistema.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Formato de e-mail inválido.');
      } else {
        setError('Houve um erro ao solicitar a redefinição de senha.');
      }
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
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-black overflow-hidden">
              <img src="https://i.imgur.com/pYENenK.png" alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
            <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-white shadow-2xl overflow-hidden">
              <img src="https://i.imgur.com/pYENenK.png" alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
                    type="text" 
                    placeholder="E-mail ou Usuário" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-transparent rounded-2xl text-base font-bold text-slate-800 placeholder:text-slate-300 focus:border-black focus:bg-white transition-all outline-none shadow-sm"
                  />
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-black transition-colors" size={18} />
                  <input 
                    type="password" 
                    placeholder="Senha" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    ref={passwordRef}
                    required={!isRegistering} // password only required for login or direct signup
                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-transparent rounded-2xl text-base font-bold text-slate-800 placeholder:text-slate-300 focus:border-black focus:bg-white transition-all outline-none shadow-sm"
                  />
                </div>
              </div>

              {!isRegistering && (
                <div className="text-right">
                  <button 
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[10px] font-black text-slate-400 hover:text-black transition-colors uppercase tracking-widest"
                  >
                    Esqueceu sua senha?
                  </button>
                </div>
              )}

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

              {success && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-emerald-50 rounded-xl border border-emerald-100"
                >
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest text-center">
                    {success}
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
