import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Transaction, Account, Category, CreditCard, Tag, NotificationSettings, DEFAULT_ACCOUNTS, DEFAULT_CATEGORIES } from './types';
import { parseISO, isSameMonth, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { auth, onAuthStateChanged } from './firebase';
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

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem('ff_notifications');
    return saved ? JSON.parse(saved) : {
      cardDueReminders: true,
      transactionReminders: true,
      reminderTime: '09:00',
      daysBeforeDue: 2
    };
  });

  // Load initial data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        const [tRes, aRes, cRes, ccRes, tagRes] = await Promise.all([
          fetch('/api/transactions'),
          fetch('/api/accounts'),
          fetch('/api/categories'),
          fetch('/api/credit-cards'),
          fetch('/api/tags')
        ]);

        if (tRes.ok) setTransactions(await tRes.json());
        if (aRes.ok) setAccounts(await aRes.json());
        if (cRes.ok) setCategories(await cRes.json());
        if (ccRes.ok) setCreditCards(await ccRes.json());
        if (tagRes.ok) setTags(await tagRes.json());
      } catch (error) {
        console.error("Failed to load data from API:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    localStorage.setItem('ff_notifications', JSON.stringify(notificationSettings));
  }, [notificationSettings]);

  const addCategory = async (c: Omit<Category, 'id'>) => {
    const newCategory = { ...c, id: Math.random().toString(36).substr(2, 9) };
    setCategories(prev => [...prev, newCategory]);
    await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCategory)
    });
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const addCreditCard = (c: Omit<CreditCard, 'id'>) => {
    const newCard = { ...c, id: Math.random().toString(36).substr(2, 9) };
    setCreditCards(prev => [...prev, newCard]);
  };

  const updateCreditCard = (id: string, updates: Partial<CreditCard>) => {
    setCreditCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteCreditCard = (id: string) => {
    setCreditCards(prev => prev.filter(c => c.id !== id));
  };

  const addTag = (t: Omit<Tag, 'id'>) => {
    const newTag = { ...t, id: Math.random().toString(36).substr(2, 9) };
    setTags(prev => [...prev, newTag]);
  };

  const updateTag = (id: string, updates: Partial<Tag>) => {
    setTags(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTag = (id: string) => {
    setTags(prev => prev.filter(t => t.id !== id));
  };

  const updateNotificationSettings = (updates: Partial<NotificationSettings>) => {
    setNotificationSettings(prev => ({ ...prev, ...updates }));
  };

  const importTransactions = (data: Transaction[]) => {
    setTransactions(prev => [...data, ...prev]);
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
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ balance: newBalance })
        });
        return { ...acc, balance: newBalance };
      }
      return acc;
    });
    setAccounts(updatedAccounts);

    // Save transaction to API
    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTransaction)
    });
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ balance })
          });
        }
        
        return { ...acc, balance };
      });
      setAccounts(updatedAccounts);
    }

    // Save update to API
    await fetch(`/api/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newT)
    });
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
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ balance: newBalance })
        });
        return { ...acc, balance: newBalance };
      }
      return acc;
    });
    setAccounts(updatedAccounts);

    // Delete from API
    await fetch(`/api/transactions/${id}`, {
      method: 'DELETE'
    });
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Carregando Dados...</p>
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
