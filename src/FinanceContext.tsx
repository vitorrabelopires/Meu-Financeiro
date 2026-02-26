import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Transaction, Account, Category, CreditCard, Tag, NotificationSettings, DEFAULT_ACCOUNTS, DEFAULT_CATEGORIES } from './types';
import { parseISO, isSameMonth, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FinanceContextType {
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
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('ff_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('ff_accounts');
    return saved ? JSON.parse(saved) : DEFAULT_ACCOUNTS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('ff_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [creditCards, setCreditCards] = useState<CreditCard[]>(() => {
    const saved = localStorage.getItem('ff_credit_cards');
    return saved ? JSON.parse(saved) : [];
  });

  const [tags, setTags] = useState<Tag[]>(() => {
    const saved = localStorage.getItem('ff_tags');
    return saved ? JSON.parse(saved) : [];
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem('ff_notifications');
    return saved ? JSON.parse(saved) : {
      cardDueReminders: true,
      transactionReminders: true,
      reminderTime: '09:00',
      daysBeforeDue: 2
    };
  });

  useEffect(() => {
    localStorage.setItem('ff_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('ff_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('ff_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('ff_credit_cards', JSON.stringify(creditCards));
  }, [creditCards]);

  useEffect(() => {
    localStorage.setItem('ff_tags', JSON.stringify(tags));
  }, [tags]);

  useEffect(() => {
    localStorage.setItem('ff_notifications', JSON.stringify(notificationSettings));
  }, [notificationSettings]);

  const addCategory = (c: Omit<Category, 'id'>) => {
    const newCategory = { ...c, id: Math.random().toString(36).substr(2, 9) };
    setCategories(prev => [...prev, newCategory]);
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

  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const newTransaction = { ...t, id: Math.random().toString(36).substr(2, 9) };
    setTransactions(prev => [newTransaction, ...prev]);

    // Update account balance
    setAccounts(prev => prev.map(acc => {
      if (acc.id === t.accountId) {
        return {
          ...acc,
          balance: t.type === 'income' ? acc.balance + t.amount : acc.balance - t.amount
        };
      }
      return acc;
    }));
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    const oldT = transactions.find(t => t.id === id);
    if (!oldT) return;

    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));

    // Update balance if critical fields changed
    if (updates.amount !== undefined || updates.type !== undefined || updates.accountId !== undefined) {
      const newAmount = updates.amount ?? oldT.amount;
      const newType = updates.type ?? oldT.type;
      const newAccountId = updates.accountId ?? oldT.accountId;

      setAccounts(prev => prev.map(acc => {
        let balance = acc.balance;
        
        // Revert old
        if (acc.id === oldT.accountId) {
          balance = oldT.type === 'income' ? balance - oldT.amount : balance + oldT.amount;
        }
        
        // Apply new
        if (acc.id === newAccountId) {
          balance = newType === 'income' ? balance + newAmount : balance - newAmount;
        }
        
        return { ...acc, balance };
      }));
    }
  };

  const deleteTransaction = (id: string) => {
    const t = transactions.find(tx => tx.id === id);
    if (!t) return;

    setTransactions(prev => prev.filter(tx => tx.id !== id));

    // Revert account balance
    setAccounts(prev => prev.map(acc => {
      if (acc.id === t.accountId) {
        return {
          ...acc,
          balance: t.type === 'income' ? acc.balance - t.amount : acc.balance + t.amount
        };
      }
      return acc;
    }));
  };

  const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);
  
  const { monthlyIncome, monthlyExpense, currentMonthName } = useMemo(() => {
    const now = new Date();
    const monthlyTransactions = transactions.filter(t => {
      try {
        const d = new Date(t.date);
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

  return (
    <FinanceContext.Provider value={{
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
