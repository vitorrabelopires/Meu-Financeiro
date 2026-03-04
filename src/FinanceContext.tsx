import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Transaction, Account, Category, CreditCard, Tag, NotificationSettings, DEFAULT_ACCOUNTS, DEFAULT_CATEGORIES } from './types';
import { parseISO, isSameMonth, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { auth, onAuthStateChanged } from './firebase';
import { Settings } from 'lucide-react';
import { User } from 'firebase/auth';

interface FinanceContextType {
  user: User | null;
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  creditCards: CreditCard[];
  tags: Tag[];
  notificationSettings: NotificationSettings;
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (c: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  addCreditCard: (c: Omit<CreditCard, 'id'>) => void;
  updateCreditCard: (id: string, updates: Partial<CreditCard>) => void;
  deleteCreditCard: (id: string) => void;
  addTag: (t: Omit<Tag, 'id'>) => void;
  updateTag: (id: string, updates: Partial<Tag>) => void;
  deleteTag: (id: string) => void;
  addAccount: (a: Omit<Account, 'id'>) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  updateNotificationSettings: (updates: Partial<NotificationSettings>) => void;
  importTransactions: (data: Transaction[]) => void;
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  currentMonthName: string;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>(DEFAULT_ACCOUNTS);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    cardDueReminders: true,
    transactionReminders: true,
    reminderTime: '09:00',
    daysBeforeDue: 2
  });

  // Load initial data from API
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const headers = {
          'x-user-id': user.uid,
          'x-is-admin': user.email?.toLowerCase() === 'admin@meufinanceiro.com' ? 'true' : 'false'
        };

        const [tRes, aRes, cRes, ccRes, tagRes, nRes] = await Promise.all([
          fetch('/api/transactions', { headers }),
          fetch('/api/accounts', { headers }),
          fetch('/api/categories', { headers }),
          fetch('/api/credit-cards', { headers }),
          fetch('/api/tags', { headers }),
          fetch('/api/notifications', { headers })
        ]);

        if (tRes.ok) setTransactions(await tRes.json());
        if (aRes.ok) setAccounts(await aRes.json());
        if (cRes.ok) setCategories(await cRes.json());
        if (ccRes.ok) setCreditCards(await ccRes.json());
        if (tagRes.ok) setTags(await tagRes.json());
        if (nRes.ok) setNotificationSettings(await nRes.json());
        setError(null);
      } catch (error: any) {
        console.error("Failed to load data from API:", error);
        setError("Não foi possível carregar seus dados. Verifique sua conexão ou as configurações do banco de dados.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const addCategory = async (c: Omit<Category, 'id'>) => {
    const newCategory = { ...c, id: Math.random().toString(36).substr(2, 9) };
    setCategories(prev => [...prev, newCategory]);
    try {
      await fetch('/api/categories', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user?.uid || '',
          'x-is-admin': user?.email?.toLowerCase() === 'admin@meufinanceiro.com' ? 'true' : 'false'
        },
        body: JSON.stringify(newCategory)
      });
    } catch (err) {
      console.error("Error adding category:", err);
    }
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    try {
      await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user?.uid || '',
          'x-is-admin': user?.email?.toLowerCase() === 'admin@meufinanceiro.com' ? 'true' : 'false'
        },
        body: JSON.stringify(updates)
      });
    } catch (err) {
      console.error("Error updating category:", err);
    }
  };

  const deleteCategory = async (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    try {
      await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: { 
          'x-user-id': user?.uid || '',
          'x-is-admin': user?.email?.toLowerCase() === 'admin@meufinanceiro.com' ? 'true' : 'false'
        }
      });
    } catch (err) {
      console.error("Error deleting category:", err);
    }
  };

  const addCreditCard = async (c: Omit<CreditCard, 'id'>) => {
    const newCard = { ...c, id: Math.random().toString(36).substr(2, 9) };
    setCreditCards(prev => [...prev, newCard]);
    try {
      await fetch('/api/credit-cards', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user?.uid || '',
          'x-is-admin': user?.email?.toLowerCase() === 'admin@meufinanceiro.com' ? 'true' : 'false'
        },
        body: JSON.stringify(newCard)
      });
    } catch (err) {
      console.error("Error adding credit card:", err);
    }
  };

  const updateCreditCard = async (id: string, updates: Partial<CreditCard>) => {
    setCreditCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    try {
      await fetch(`/api/credit-cards/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user?.uid || '',
          'x-is-admin': user?.email?.toLowerCase() === 'admin@meufinanceiro.com' ? 'true' : 'false'
        },
        body: JSON.stringify(updates)
      });
    } catch (err) {
      console.error("Error updating credit card:", err);
    }
  };

  const deleteCreditCard = async (id: string) => {
    setCreditCards(prev => prev.filter(c => c.id !== id));
    try {
      await fetch(`/api/credit-cards/${id}`, {
        method: 'DELETE',
        headers: { 
          'x-user-id': user?.uid || '',
          'x-is-admin': user?.email?.toLowerCase() === 'admin@meufinanceiro.com' ? 'true' : 'false'
        }
      });
    } catch (err) {
      console.error("Error deleting credit card:", err);
    }
  };

  const addTag = async (t: Omit<Tag, 'id'>) => {
    const newTag = { ...t, id: Math.random().toString(36).substr(2, 9) };
    setTags(prev => [...prev, newTag]);
    try {
      await fetch('/api/tags', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user?.uid || '',
          'x-is-admin': user?.email?.toLowerCase() === 'admin@meufinanceiro.com' ? 'true' : 'false'
        },
        body: JSON.stringify(newTag)
      });
    } catch (err) {
      console.error("Error adding tag:", err);
    }
  };

  const updateTag = async (id: string, updates: Partial<Tag>) => {
    setTags(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    try {
      await fetch(`/api/tags/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user?.uid || '',
          'x-is-admin': user?.email?.toLowerCase() === 'admin@meufinanceiro.com' ? 'true' : 'false'
        },
        body: JSON.stringify(updates)
      });
    } catch (err) {
      console.error("Error updating tag:", err);
    }
  };

  const deleteTag = async (id: string) => {
    setTags(prev => prev.filter(t => t.id !== id));
    try {
      await fetch(`/api/tags/${id}`, {
        method: 'DELETE',
        headers: { 
          'x-user-id': user?.uid || '',
          'x-is-admin': user?.email?.toLowerCase() === 'admin@meufinanceiro.com' ? 'true' : 'false'
        }
      });
    } catch (err) {
      console.error("Error deleting tag:", err);
    }
  };

  const addAccount = async (a: Omit<Account, 'id'>) => {
    const newAccount = { ...a, id: Math.random().toString(36).substr(2, 9) };
    setAccounts(prev => [...prev, newAccount]);
    try {
      await fetch('/api/accounts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user?.uid || '',
          'x-is-admin': user?.email?.toLowerCase() === 'admin@meufinanceiro.com' ? 'true' : 'false'
        },
        body: JSON.stringify(newAccount)
      });
    } catch (err) {
      console.error("Error adding account:", err);
    }
  };

  const updateAccount = async (id: string, updates: Partial<Account>) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    try {
      await fetch(`/api/accounts/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user?.uid || '',
          'x-is-admin': user?.email?.toLowerCase() === 'admin@meufinanceiro.com' ? 'true' : 'false'
        },
        body: JSON.stringify(updates)
      });
    } catch (err) {
      console.error("Error updating account:", err);
    }
  };

  const deleteAccount = async (id: string) => {
    if (accounts.length <= 1) {
      alert("Você deve ter pelo menos uma conta.");
      return;
    }
    setAccounts(prev => prev.filter(a => a.id !== id));
    try {
      await fetch(`/api/accounts/${id}`, {
        method: 'DELETE',
        headers: { 
          'x-user-id': user?.uid || '',
          'x-is-admin': user?.email?.toLowerCase() === 'admin@meufinanceiro.com' ? 'true' : 'false'
        }
      });
    } catch (err) {
      console.error("Error deleting account:", err);
    }
  };

  const updateNotificationSettings = async (updates: Partial<NotificationSettings>) => {
    const newSettings = { ...notificationSettings, ...updates };
    setNotificationSettings(newSettings);
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user?.uid || '',
          'x-is-admin': user?.email?.toLowerCase() === 'admin@meufinanceiro.com' ? 'true' : 'false'
        },
        body: JSON.stringify(newSettings)
      });
    } catch (err) {
      console.error("Error updating notification settings:", err);
    }
  };

  const importTransactions = async (data: Transaction[]) => {
    setTransactions(prev => [...data, ...prev]);
    // Save all imported transactions to API
    try {
      for (const t of data) {
        await fetch('/api/transactions', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-id': user?.uid || '',
            'x-is-admin': user?.email?.toLowerCase() === 'admin@meufinanceiro.com' ? 'true' : 'false'
          },
          body: JSON.stringify(t)
        });
      }
    } catch (err) {
      console.error("Error importing transactions:", err);
    }
  };

  const addTransaction = async (t: Omit<Transaction, 'id'>) => {
    const newTransaction = { ...t, id: Math.random().toString(36).substr(2, 9) };
    setTransactions(prev => [newTransaction, ...prev]);

    // Update account balance locally
    const updatedAccounts = accounts.map(acc => {
      if (acc.id === t.accountId) {
        const newBalance = t.type === 'income' ? acc.balance + t.amount : acc.balance - t.amount;
        // Sync balance to API
        fetch(`/api/accounts/${acc.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-id': user?.uid || '',
            'x-is-admin': user?.email?.toLowerCase() === 'admin@meufinanceiro.com' ? 'true' : 'false'
          },
          body: JSON.stringify({ balance: newBalance })
        }).catch(err => console.error("Error syncing account balance:", err));
        return { ...acc, balance: newBalance };
      }
      return acc;
    });
    setAccounts(updatedAccounts);

    // Save transaction to API
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user?.uid || '',
          'x-is-admin': user?.email?.toLowerCase() === 'admin@meufinanceiro.com' ? 'true' : 'false'
        },
        body: JSON.stringify(newTransaction)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || 'Falha na comunicação com o servidor');
      }
    } catch (err: any) {
      console.error("Error saving transaction:", err);
      alert(`⚠️ Erro ao salvar transação: ${err.message}. Verifique se o banco de dados está configurado na Vercel.`);
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    const oldT = transactions.find(t => t.id === id);
    if (!oldT) return;

    const newT = { ...oldT, ...updates };
    setTransactions(prev => prev.map(t => t.id === id ? newT : t));

    // Update balance if critical fields changed
    if (updates.amount !== undefined || updates.type !== undefined || updates.accountId !== undefined) {
      const newAmount = updates.amount ?? oldT.amount;
      const newType = updates.type ?? oldT.type;
      const newAccountId = updates.accountId ?? oldT.accountId;

      const updatedAccounts = accounts.map(acc => {
        let balance = acc.balance;
        let changed = false;
        
        // Revert old
        if (acc.id === oldT.accountId) {
          balance = oldT.type === 'income' ? balance - oldT.amount : balance + oldT.amount;
          changed = true;
        }
        
        // Apply new
        if (acc.id === newAccountId) {
          balance = newType === 'income' ? balance + newAmount : balance - newAmount;
          changed = true;
        }
        
        if (changed) {
          fetch(`/api/accounts/${acc.id}`, {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'x-user-id': user?.uid || '',
              'x-is-admin': user?.email?.toLowerCase() === 'admin@meufinanceiro.com' ? 'true' : 'false'
            },
            body: JSON.stringify({ balance })
          }).catch(err => console.error("Error syncing account balance:", err));
        }
        
        return { ...acc, balance };
      });
      setAccounts(updatedAccounts);
    }

    // Save update to API
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user?.uid || '',
          'x-is-admin': user?.email?.toLowerCase() === 'admin@meufinanceiro.com' ? 'true' : 'false'
        },
        body: JSON.stringify(newT)
      });
      if (!response.ok) throw new Error('Failed to update transaction');
    } catch (err) {
      console.error("Error updating transaction:", err);
    }
  };

  const deleteTransaction = async (id: string) => {
    const t = transactions.find(tx => tx.id === id);
    if (!t) return;

    setTransactions(prev => prev.filter(tx => tx.id !== id));

    // Revert account balance
    const updatedAccounts = accounts.map(acc => {
      if (acc.id === t.accountId) {
        const newBalance = t.type === 'income' ? acc.balance - t.amount : acc.balance + t.amount;
        fetch(`/api/accounts/${acc.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-id': user?.uid || '',
            'x-is-admin': user?.email?.toLowerCase() === 'admin@meufinanceiro.com' ? 'true' : 'false'
          },
          body: JSON.stringify({ balance: newBalance })
        }).catch(err => console.error("Error syncing account balance:", err));
        return { ...acc, balance: newBalance };
      }
      return acc;
    });
    setAccounts(updatedAccounts);

    // Delete from API
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
        headers: { 
          'x-user-id': user?.uid || '',
          'x-is-admin': user?.email?.toLowerCase() === 'admin@meufinanceiro.com' ? 'true' : 'false'
        }
      });
      if (!response.ok) throw new Error('Failed to delete transaction');
    } catch (err) {
      console.error("Error deleting transaction:", err);
    }
  };

  const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);
  
  const { monthlyIncome, monthlyExpense, currentMonthName } = useMemo(() => {
    const now = new Date();
    const monthlyTransactions = transactions.filter(t => {
      try {
        const d = parseISO(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      } catch (e) {
        return false;
      }
    });

    const income = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const expense = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const monthName = format(now, 'MMMM yyyy', { locale: ptBR });

    return { 
      monthlyIncome: income, 
      monthlyExpense: expense,
      currentMonthName: monthName.charAt(0).toUpperCase() + monthName.slice(1)
    };
  }, [transactions]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Carregando Dados...</p>
        </div>
      </div>
    );
  }

  if (error && user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-[2.5rem] card-shadow border border-rose-100 text-center space-y-6">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
            <Settings size={32} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-slate-800">Erro de Conexão</h3>
            <p className="text-sm text-slate-400 font-medium">{error}</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-black text-white rounded-2xl text-sm font-black shadow-xl active:scale-95 transition-all"
          >
            Tentar Novamente
          </button>
          <button 
            onClick={() => auth.signOut()}
            className="w-full py-4 bg-slate-50 text-slate-400 rounded-2xl text-sm font-black active:scale-95 transition-all"
          >
            Sair da Conta
          </button>
        </div>
      </div>
    );
  }

  return (
    <FinanceContext.Provider value={{
      user,
      transactions,
      accounts,
      categories,
      creditCards,
      tags,
      notificationSettings,
      addTransaction,
      deleteTransaction,
      addCategory,
      updateCategory,
      deleteCategory,
      addCreditCard,
      updateCreditCard,
      deleteCreditCard,
      addTag,
      updateTag,
      deleteTag,
      addAccount,
      updateAccount,
      deleteAccount,
      updateNotificationSettings,
      importTransactions,
      updateTransaction,
      totalBalance,
      monthlyIncome,
      monthlyExpense,
      currentMonthName
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used within FinanceProvider');
  return context;
};
