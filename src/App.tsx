import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Plus, 
  Wallet, 
  History, 
  PieChart, 
  Settings,
  X,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Utensils,
  Car,
  Gamepad2,
  HeartPulse,
  DollarSign,
  Banknote,
  Trash2,
  Edit2,
  CreditCard as CreditCardIcon,
  Tag as TagIcon,
  User,
  Download,
  Upload,
  Search,
  MoreHorizontal,
  Bell,
  ShoppingBag,
  Coffee,
  Home,
  Briefcase,
  Gift,
  Plane,
  Music,
  Film,
  Smartphone,
  Laptop,
  Zap,
  Droplets,
  Shield,
  Star,
  Heart,
  LogOut,
  FileSpreadsheet,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { 
  AreaChart, 
  Area, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell
} from 'recharts';
import { FinanceProvider, useFinance } from './FinanceContext';
import { formatCurrency, TransactionType, cn, DEFAULT_CATEGORIES, Transaction, Category, CreditCard, Tag } from './types';
import { auth } from './firebase';
import { UserManager } from './components/UserManager';
import { LoginPage } from './components/LoginPage';

const ICON_MAP: Record<string, any> = {
  Wallet,
  Banknote,
  Utensils,
  Car,
  Gamepad2,
  HeartPulse,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Coffee,
  Home,
  Briefcase,
  Gift,
  Plane,
  Music,
  Film,
  Smartphone,
  Laptop,
  Zap,
  Droplets,
  Shield,
  Star,
  Heart
};

const CategoryIcon = ({ icon, size = 20, className = "" }: { icon: string, size?: number, className?: string }) => {
  const Icon = ICON_MAP[icon];
  if (Icon) {
    return <Icon size={size} className={className} />;
  }
  // If not in ICON_MAP, treat as emoji/text
  return <span className={cn("flex items-center justify-center leading-none select-none", className)} style={{ fontSize: `${size}px`, width: size, height: size }}>{icon}</span>;
};

const Dashboard = ({ onViewAll }: { onViewAll: () => void }) => {
  const { user, totalBalance, transactions, categories, creditCards, tags } = useFinance();

  const [selectedMonth, setSelectedMonth] = useState<'current' | 'next'>('current');
  const now = useMemo(() => new Date(), []);

  const viewingDate = useMemo(() => {
    if (selectedMonth === 'current') return now;
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }, [selectedMonth, now]);

  const viewingMonthName = useMemo(() => {
    const raw = format(viewingDate, 'MMMM yyyy', { locale: ptBR });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [viewingDate]);

  const monthlyTransactions = useMemo(() => {
    return transactions.filter(t => {
      try {
        const d = parseISO(t.date);
        return d.getMonth() === viewingDate.getMonth() && d.getFullYear() === viewingDate.getFullYear();
      } catch (e) {
        return false;
      }
    });
  }, [transactions, viewingDate]);

  const sortedMonthlyTransactions = useMemo(() => {
    return [...monthlyTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [monthlyTransactions]);

  const { displayedIncome, displayedExpense } = useMemo(() => {
    const income = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, curr) => acc + curr.amount, 0);
    const expense = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, curr) => acc + curr.amount, 0);
    return { displayedIncome: income, displayedExpense: expense };
  }, [monthlyTransactions]);

  const chartData = useMemo(() => {
    const grouped = monthlyTransactions.reduce((acc: Record<string, number>, t) => {
      const day = format(parseISO(t.date), 'dd/MM');
      acc[day] = (acc[day] || 0) + (t.type === 'income' ? t.amount : -t.amount);
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => {
        const [dayA, monthA] = a.name.split('/').map(Number);
        const [dayB, monthB] = b.name.split('/').map(Number);
        if (monthA !== monthB) return monthA - monthB;
        return dayA - dayB;
      });
  }, [monthlyTransactions]);

  const pieData = useMemo(() => {
    return categories
      .filter(c => c.type === 'expense')
      .map(c => {
        const total = monthlyTransactions
          .filter(t => t.category === c.name && t.type === 'expense')
          .reduce((acc, curr) => acc + curr.amount, 0);
        return { name: c.name, value: total, color: c.color };
      })
      .filter(d => d.value > 0);
  }, [categories, monthlyTransactions]);

  return (
    <div className="space-y-6 pb-24 lg:pb-0">
      {/* Header Summary */}
      <div className="bg-black text-white p-6 rounded-b-[2.5rem] shadow-2xl -mx-4 pt-12 lg:rounded-[3rem] lg:mx-0 lg:pt-10 lg:p-12 lg:shadow-black/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-slate-400 text-sm font-medium">Saldo Total</p>
            <h2 className={cn(
              "text-3xl lg:text-5xl font-black mt-1 transition-colors duration-500 tracking-tight",
              totalBalance > 0 ? "text-emerald-400" : totalBalance < 0 ? "text-rose-400" : "text-white"
            )}>
              {formatCurrency(totalBalance)}
            </h2>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Saldo do Mês:</span>
              <span className={cn(
                "text-xs font-black",
                (displayedIncome - displayedExpense) >= 0 ? "text-emerald-400" : "text-rose-400"
              )}>
                {formatCurrency(displayedIncome - displayedExpense)}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-2">
            <div className="flex bg-white/10 p-1 rounded-xl border border-white/5 space-x-1 self-start sm:self-auto">
              <button
                onClick={() => setSelectedMonth('current')}
                className={cn(
                  "px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all duration-300",
                  selectedMonth === 'current'
                    ? "bg-white text-black shadow-md shadow-white/10"
                    : "text-slate-400 hover:text-white"
                )}
              >
                Mês Vigente
              </button>
              <button
                onClick={() => setSelectedMonth('next')}
                className={cn(
                  "px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all duration-300",
                  selectedMonth === 'next'
                    ? "bg-white text-black shadow-md shadow-white/10"
                    : "text-slate-400 hover:text-white"
                )}
              >
                Próximo Mês
              </button>
            </div>
            <p className="text-slate-400 text-[10px] lg:text-xs font-bold uppercase tracking-widest">{viewingMonthName}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 lg:mt-12">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl lg:rounded-3xl p-4 lg:p-6 border border-white/5">
            <div className="flex items-center gap-2 text-slate-300 text-xs mb-1 lg:mb-2">
              <TrendingUp size={14} className="text-emerald-400" />
              <span>Receitas</span>
            </div>
            <p className="font-bold text-lg lg:text-2xl">{formatCurrency(displayedIncome)}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl lg:rounded-3xl p-4 lg:p-6 border border-white/5">
            <div className="flex items-center gap-2 text-slate-300 text-xs mb-1 lg:mb-2">
              <TrendingDown size={14} className="text-rose-400" />
              <span>Despesas</span>
            </div>
            <p className="font-bold text-lg lg:text-2xl">{formatCurrency(displayedExpense)}</p>
          </div>
          {/* Desktop only stats */}
          <div className="hidden lg:block bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/5">
            <div className="flex items-center gap-2 text-slate-300 text-xs mb-2">
              <PieChart size={14} className="text-indigo-400" />
              <span>Categorias</span>
            </div>
            <p className="font-bold text-2xl">{categories.length}</p>
          </div>
          <div className="hidden lg:block bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/5">
            <div className="flex items-center gap-2 text-slate-300 text-xs mb-2">
              <History size={14} className="text-amber-400" />
              <span>Transações</span>
            </div>
            <p className="font-bold text-2xl">{transactions.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 lg:p-8 rounded-3xl card-shadow border border-slate-50">
          <h3 className="text-slate-800 font-bold mb-6 text-sm uppercase tracking-wider">Fluxo de Caixa</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000000" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#000000" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fill: '#94a3b8'}} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => [formatCurrency(value), 'Valor']}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#000000" 
                  fillOpacity={1} 
                  fill="url(#colorAmt)" 
                  strokeWidth={4}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Categories */}
        {pieData.length > 0 && (
          <div className="bg-white p-6 lg:p-8 rounded-3xl card-shadow border border-slate-50">
            <h3 className="text-slate-800 font-bold mb-6 text-sm uppercase tracking-wider">Gastos por Categoria</h3>
            <div className="flex flex-col items-center">
              <div className="h-48 w-48">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <RePieChart>
                    <Pie
                      data={pieData}
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                  </RePieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full space-y-3 mt-6">
                {pieData.slice(0, 5).map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-600 font-medium">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-800">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-slate-800 font-bold text-sm uppercase tracking-wider">Transações Recentes</h3>
          <button 
            onClick={onViewAll}
            className="text-black text-xs font-bold flex items-center gap-1 hover:underline"
          >
            Ver tudo <ChevronRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sortedMonthlyTransactions.length === 0 ? (
            <div className="lg:col-span-2 bg-white p-12 rounded-[2.5rem] text-center card-shadow border border-slate-50">
              <p className="text-slate-400 text-sm font-medium">
                {selectedMonth === 'current' 
                  ? "Nenhuma transação registrada no mês atual." 
                  : "Nenhum lançamento previsto para o próximo mês."}
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {sortedMonthlyTransactions.slice(0, 6).map((t) => {
                const categoryObj = categories.find(c => c.name === t.category);
                const card = creditCards.find(c => c.id === t.creditCardId);
                const transactionTags = tags.filter(tag => t.tags?.includes(tag.id));
                
                return (
                  <motion.div 
                    key={t.id}
                    layout
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16 }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    className="bg-white p-5 rounded-[2rem] flex items-center justify-between card-shadow border border-slate-50 group hover:translate-x-1 duration-300 hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-black/5 transition-transform group-hover:scale-110"
                        style={{ backgroundColor: categoryObj?.color || '#94a3b8' }}
                      >
                        <CategoryIcon icon={categoryObj?.icon || 'Wallet'} size={22} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-800 text-sm">{t.description}</p>
                          {card && (
                            <span className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-tighter">
                              {card.name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{format(parseISO(t.date), 'dd MMM', { locale: ptBR })}</p>
                          {transactionTags.length > 0 && (
                            <div className="flex gap-1">
                              {transactionTags.map(tag => (
                                <div key={tag.id} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tag.color }} title={tag.name} />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className={cn(
                      "font-black text-base",
                      t.type === 'income' ? "text-emerald-500" : "text-rose-500"
                    )}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </p>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};

const TransactionForm = ({ onClose, initialData }: { onClose: () => void, initialData?: Transaction }) => {
  const { addTransaction, updateTransaction, accounts, categories, tags, creditCards } = useFinance();
  const [type, setType] = useState<TransactionType>(initialData?.type || 'expense');
  const [amount, setAmount] = useState(initialData?.amount.toString() || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState(initialData?.category || categories.filter(c => c.type === 'expense')[0]?.name || '');
  const [selectedAccountId, setSelectedAccountId] = useState(initialData?.accountId || accounts[0]?.id || '1');
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.tags || []);
  const [creditCardId, setCreditCardId] = useState<string>(initialData?.creditCardId || '');
  const [date, setDate] = useState(initialData ? format(parseISO(initialData.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
  const [installments, setInstallments] = useState(initialData?.installments?.toString() || '1');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Por favor, insira um valor válido maior que zero.');
      return;
    }

    if (!description) {
      setError('A descrição é obrigatória.');
      return;
    }

    if (type === 'expense' && !creditCardId) {
      setError('O cartão de crédito é obrigatório para despesas.');
      return;
    }

    const [year, month, day] = date.split('-').map(Number);
    const transactionDate = new Date(year, month - 1, day);
    
    if (initialData) {
      const originalDate = new Date(initialData.date);
      transactionDate.setHours(originalDate.getHours(), originalDate.getMinutes(), originalDate.getSeconds());
    } else {
      const now = new Date();
      transactionDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
    }

    const data = {
      amount: parseFloat(amount.replace(',', '.')) || 0,
      description,
      type,
      category,
      accountId: selectedAccountId,
      date: transactionDate.toISOString(),
      tags: selectedTags,
      creditCardId: type === 'expense' ? creditCardId : null,
      installments: parseInt(installments) || 1
    };

    if (initialData) {
      updateTransaction(initialData.id, data);
    } else {
      addTransaction(data);
    }
    onClose();
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-end sm:items-center justify-center p-4"
    >
      <motion.div 
        initial={{ y: 100, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 100, scale: 0.95 }}
        className={cn(
          "bg-white/95 backdrop-blur-xl w-full max-w-md rounded-[3rem] p-8 pb-12 space-y-6 shadow-2xl border max-h-[90vh] overflow-y-auto custom-scrollbar transition-all duration-500",
          initialData ? "border-amber-200 ring-8 ring-amber-50/50" : "border-white/20"
        )}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-800">{initialData ? 'Editar Transação' : 'Nova Transação'}</h2>
              {initialData && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-600 text-[10px] font-bold rounded-full uppercase tracking-tighter animate-pulse">
                  Modo Edição
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">{initialData ? 'Altere os detalhes da sua movimentação' : 'Registre seus gastos ou ganhos'}</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-black transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type Selector */}
          <div className="flex p-1.5 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                setCategory(categories.filter(c => c.type === 'expense')[0]?.name || '');
              }}
              className={cn(
                "flex-1 py-3 rounded-xl text-xs font-bold transition-all",
                type === 'expense' ? "bg-white text-rose-500 shadow-sm" : "text-slate-500"
              )}
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                setCategory(categories.filter(c => c.type === 'income')[0]?.name || '');
              }}
              className={cn(
                "flex-1 py-3 rounded-xl text-xs font-bold transition-all",
                type === 'income' ? "bg-white text-emerald-500 shadow-sm" : "text-slate-500"
              )}
            >
              Receita
            </button>
          </div>

          {/* Amount Input */}
          <div className="text-center py-4 space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">
              {parseInt(installments) > 1 ? 'Valor da Parcela' : 'Valor'}
            </label>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl font-bold text-slate-400">R$</span>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^\d*([.,]\d{0,2})?$/.test(val)) {
                    setAmount(val);
                    setError(null);
                  }
                }}
                placeholder="0,00"
                className={cn(
                  "text-5xl font-bold bg-transparent border-none focus:ring-0 w-full max-w-[280px] text-center outline-none transition-colors",
                  error && amount === '' ? "text-rose-300" : "text-slate-800"
                )}
                autoFocus
              />
            </div>
            {error && (
              <p className="text-[10px] text-rose-500 font-bold uppercase tracking-tighter animate-bounce">
                {error}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Descrição</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Aluguel, Supermercado..."
                className="w-full bg-slate-100/50 border-none rounded-2xl p-4 text-base focus:ring-2 focus:ring-black outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Categoria</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-100/50 border-none rounded-2xl p-4 text-base focus:ring-2 focus:ring-black outline-none appearance-none"
                >
                  {categories.filter(c => c.type === type).map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Conta</label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full bg-slate-100/50 border-none rounded-2xl p-4 text-base focus:ring-2 focus:ring-black outline-none appearance-none"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Data Vencimento</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-100/50 border-none rounded-2xl p-4 text-base focus:ring-2 focus:ring-black outline-none"
              />
            </div>

            {type === 'expense' && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Cartão de Crédito</label>
                <select
                  value={creditCardId}
                  onChange={(e) => {
                    setCreditCardId(e.target.value);
                    if (e.target.value) setError(null);
                  }}
                  className={cn(
                    "w-full bg-slate-100/50 border-none rounded-2xl p-4 text-base focus:ring-2 focus:ring-black outline-none appearance-none",
                    error && !creditCardId ? "ring-2 ring-rose-300" : ""
                  )}
                >
                  <option value="">Selecione um cartão</option>
                  {creditCards.map(card => (
                    <option key={card.id} value={card.id}>{card.name} - {card.bank}</option>
                  ))}
                </select>
                {creditCardId && (
                  <p className="text-[9px] text-amber-500 font-bold uppercase tracking-tighter px-1 mt-1">
                    ⚠️ Esta despesa será registrada na fatura do cartão e não afetará o saldo da conta bancária.
                  </p>
                )}
              </div>
            )}

            {!initialData && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Número de Parcelas</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={installments}
                    onChange={(e) => setInstallments(e.target.value)}
                    className="w-24 bg-slate-100/50 border-none rounded-2xl p-4 text-base focus:ring-2 focus:ring-black outline-none"
                  />
                  <span className="text-xs text-slate-400 font-medium">
                    {parseInt(installments) > 1 
                      ? `Total: ${formatCurrency((parseFloat(amount.replace(',', '.')) || 0) * parseInt(installments))}` 
                      : 'Pagamento único'}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Tags</label>
              <div className="flex flex-wrap gap-2">
                {tags.length === 0 ? (
                  <p className="text-[10px] text-slate-300 italic px-1">Nenhuma tag criada</p>
                ) : (
                  tags.map(tag => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border",
                        selectedTags.includes(tag.id) 
                          ? "bg-black text-white border-black" 
                          : "bg-transparent text-slate-400 border-slate-200"
                      )}
                    >
                      {tag.name}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-5 bg-black text-white rounded-[1.5rem] font-bold text-base shadow-xl active:scale-95 transition-all mt-4"
          >
            {initialData ? 'Salvar Alterações' : 'Salvar Transação'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

const ImportManager = () => {
  const { 
    transactions, 
    deleteImport,
    importTransactions,
    accounts,
    categories,
    creditCards,
    tags
  } = useFinance();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{ success: number, errors: number, details: string[] } | null>(null);

  const imports = useMemo(() => {
    const groups: Record<string, { id: string, date: string, count: number, total: number }> = {};
    
    transactions.forEach(t => {
      if (t.importId) {
        if (!groups[t.importId]) {
          groups[t.importId] = {
            id: t.importId,
            date: t.importDate || t.date,
            count: 0,
            total: 0
          };
        }
        groups[t.importId].count++;
        groups[t.importId].total += t.amount;
      }
    });

    return Object.values(groups).sort((a, b) => {
      try {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } catch (e) {
        return 0;
      }
    });
  }, [transactions]);

  const handleDelete = async (importId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta importação? Todas as transações vinculadas serão removidas e o saldo das contas será recalculado.')) {
      await deleteImport(importId);
    }
  };

  const downloadExcelTemplate = () => {
    const templateData = [
      {
        'Data (AAAA-MM-DD)': format(new Date(), 'yyyy-MM-dd'),
        'Descrição': 'Exemplo de Transação',
        'Valor': 100.50,
        'Categoria': categories[0]?.name || 'Alimentação',
        'Tipo (expense/income)': 'expense',
        'Conta': accounts[0]?.name || 'Carteira',
        'Tags (separadas por vírgula)': 'tag1, tag2',
        'Cartão (Opcional)': creditCards[0]?.name || '',
        'Parcelas': 1
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "modelo_importacao_transacoes.xlsx");
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportProgress(0);
    setImportResults(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        if (data.length === 0) {
          setImportResults({ success: 0, errors: 1, details: ['Arquivo vazio ou sem dados válidos.'] });
          return;
        }

        const allMappedTransactions: Transaction[] = [];
        let errors = 0;
        const errorDetails: string[] = [];

        const totalRows = data.length;
        for (let i = 0; i < totalRows; i++) {
          const row = data[i];
          try {
            const type = row['Tipo (expense/income)'] === 'income' ? 'income' : 'expense';
            const account = accounts.find(a => a.name.toLowerCase() === (row['Conta'] || '').toString().toLowerCase()) || accounts[0];
            const categoryName = row['Categoria'] || (type === 'income' ? 'Salário' : 'Alimentação');
            const card = creditCards.find(c => c.name.toLowerCase() === (row['Cartão (Opcional)'] || '').toString().toLowerCase());
            const tagNames = (row['Tags (separadas por vírgula)'] || '').toString().split(',').map((s: string) => s.trim()).filter(Boolean);
            const tagIds = tagNames.map((name: string) => {
              const foundTag = tags.find(t => t.name.toLowerCase() === name.toLowerCase());
              return foundTag ? foundTag.id : null;
            }).filter(Boolean) as string[];

            const rawAmount = (row['Valor'] || '0').toString();
            const parsedAmount = parseFloat(rawAmount.replace(/\./g, '').replace(',', '.'));
            const amount = isNaN(parsedAmount) ? 0 : parsedAmount;

            const installments = parseInt(row['Parcelas']) || 1;
            const installmentId = installments > 1 ? Math.random().toString(36).substr(2, 9) : undefined;
            const baseDate = row['Data (AAAA-MM-DD)'] ? new Date(row['Data (AAAA-MM-DD)']).toISOString() : new Date().toISOString();

            for (let j = 0; j < installments; j++) {
              const date = j === 0 ? baseDate : addMonths(parseISO(baseDate), j).toISOString();
              allMappedTransactions.push({
                id: Math.random().toString(36).substr(2, 9),
                description: row['Descrição'] || 'Sem descrição',
                amount,
                date,
                category: categoryName,
                type: type,
                accountId: account.id,
                tags: tagIds,
                creditCardId: card?.id,
                installmentId,
                installmentIndex: installments > 1 ? j + 1 : undefined,
                installments: installments > 1 ? installments : undefined
              });
            }
          } catch (err) {
            errors++;
            errorDetails.push(`Linha ${i + 2}: Erro ao processar dados.`);
          }
          
          setImportProgress(Math.round(((i + 1) / totalRows) * 100));
          if (totalRows > 10) await new Promise(r => setTimeout(r, 10));
        }

        if (allMappedTransactions.length > 0) {
          await importTransactions(allMappedTransactions);
        }

        setImportResults({
          success: allMappedTransactions.length,
          errors,
          details: errorDetails
        });
      } catch (err) {
        setImportResults({ success: 0, errors: 1, details: ['Erro crítico ao ler o arquivo.'] });
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl card-shadow space-y-4">
        <h3 className="text-slate-800 font-semibold text-sm">Nova Importação</h3>
        <div className="grid grid-cols-2 gap-4">
          <button onClick={downloadExcelTemplate} className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-3xl gap-2 hover:bg-slate-100 transition-colors border border-slate-100">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
              <FileText size={24} />
            </div>
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Baixar Modelo</span>
          </button>
          <label className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-3xl gap-2 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-100">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
              <FileSpreadsheet size={24} />
            </div>
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Importar Excel</span>
            <input type="file" accept=".xlsx, .xls" onChange={handleExcelImport} className="hidden" />
          </label>
        </div>
        <p className="text-[10px] text-slate-400 font-medium text-center">
          * Use o modelo para garantir que as colunas estejam corretas.
        </p>
      </div>

      <div className="bg-white p-6 rounded-3xl card-shadow space-y-4">
        <h3 className="text-slate-800 font-semibold text-sm">Histórico de Importações</h3>
        <p className="text-slate-400 text-xs font-medium">Visualize e gerencie os lotes importados.</p>
      </div>

      <div className="space-y-4">
        {imports.length === 0 ? (
          <div className="bg-white p-12 rounded-[3rem] text-center card-shadow border border-slate-50">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200 mb-4">
              <FileSpreadsheet size={32} />
            </div>
            <p className="text-slate-400 text-sm font-medium">Nenhuma importação encontrada.</p>
            <p className="text-[10px] text-slate-300 mt-2">Importações feitas antes desta atualização não podem ser gerenciadas individualmente.</p>
          </div>
        ) : (
          imports.map((imp) => (
            <div key={imp.id} className="bg-white p-6 rounded-[2rem] card-shadow border border-slate-50 flex items-center justify-between group animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
                  <FileSpreadsheet size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-800">Lote #{imp.id}</p>
                    <span className="text-[8px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-tighter">
                      Importado
                    </span>
                  </div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">
                    {format(parseISO(imp.date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[9px] bg-slate-50 text-slate-500 px-2 py-1 rounded-lg font-bold border border-slate-100">
                      {imp.count} transações
                    </span>
                    <span className="text-[9px] bg-slate-50 text-slate-500 px-2 py-1 rounded-lg font-bold border border-slate-100">
                      Total: {formatCurrency(imp.total)}
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setConfirmDelete(imp.id)}
                className="w-10 h-10 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center lg:opacity-0 lg:group-hover:opacity-100 transition-all active:scale-90"
                title="Excluir Importação"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>

      <AnimatePresence>
        {confirmDelete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-6"
            >
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                <Trash2 size={32} />
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-800">Excluir Importação</h4>
                <p className="text-sm text-slate-400 mt-2">Tem certeza que deseja excluir este lote de importação? Todas as transações deste lote serão removidas.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-colors">Cancelar</button>
                <button 
                  onClick={() => { deleteImport(confirmDelete); setConfirmDelete(null); }}
                  className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-rose-200 hover:bg-rose-600 transition-colors"
                >Excluir</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {isImporting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">Importando Dados</h3>
                  {!importResults && <Loader2 className="animate-spin text-emerald-500" size={24} />}
                </div>

                {!importResults ? (
                  <div className="space-y-4">
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-emerald-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${importProgress}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Processando arquivo...</span>
                      <span className="text-xs font-black text-emerald-600">{importProgress}%</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                        <div className="flex items-center gap-2 text-emerald-600 mb-1">
                          <CheckCircle size={16} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Sucesso</span>
                        </div>
                        <p className="text-2xl font-black text-emerald-700">{importResults.success}</p>
                      </div>
                      <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100">
                        <div className="flex items-center gap-2 text-rose-600 mb-1">
                          <AlertCircle size={16} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Erros</span>
                        </div>
                        <p className="text-2xl font-black text-rose-700">{importResults.errors}</p>
                      </div>
                    </div>

                    {importResults.details.length > 0 && (
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 max-h-40 overflow-y-auto custom-scrollbar">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Detalhes</p>
                        <ul className="space-y-1">
                          {importResults.details.map((detail, idx) => (
                            <li key={idx} className="text-[10px] text-slate-500 font-medium leading-relaxed">• {detail}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <button 
                      onClick={() => setIsImporting(false)}
                      className="w-full py-4 bg-black text-white rounded-2xl font-bold text-sm shadow-xl shadow-black/10 active:scale-95 transition-all"
                    >
                      Concluir
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CategoryManager = () => {
  const { categories, addCategory, updateCategory, deleteCategory } = useFinance();
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', icon: 'Wallet', color: '#000000', type: 'expense' as TransactionType });

  const availableIcons = [
    'Wallet', 'Banknote', 'Utensils', 'Car', 'Gamepad2', 'HeartPulse', 'DollarSign', 
    'TrendingUp', 'ShoppingBag', 'Coffee', 'Home', 'Briefcase', 'Gift', 'Plane', 
    'Music', 'Film', 'Smartphone', 'Laptop', 'Zap', 'Droplets', 'Shield', 'Star', 'Heart'
  ];
  const commonEmojis = ['💰', '🍕', '🚗', '🏠', '🎁', '✈️', '🎮', '🏥', '🛒', '💡', '📚', '🍿', '🏋️', '🐶', '👔'];

  const handleSave = () => {
    if (!formData.name) return;
    if (isEditing) {
      updateCategory(isEditing, formData);
    } else {
      addCategory(formData);
    }
    setIsEditing(null);
    setIsAdding(false);
    setFormData({ name: '', icon: 'Wallet', color: '#000000', type: 'expense' });
  };

  const startEdit = (cat: any) => {
    setIsEditing(cat.id);
    setFormData({ name: cat.name, icon: cat.icon, color: cat.color, type: cat.type });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-slate-800 font-bold text-lg">Categorias</h3>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-black text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-transform"
        >
          <Plus size={16} /> Nova
        </button>
      </div>

      <div className="grid gap-3">
        {categories.map(cat => {
          return (
            <div key={cat.id} className="bg-white p-4 rounded-[2rem] flex items-center justify-between card-shadow border border-slate-50 group transition-all hover:translate-x-1">
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110"
                  style={{ backgroundColor: cat.color }}
                >
                  <CategoryIcon icon={cat.icon} size={22} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{cat.name}</p>
                  <p className={cn(
                    "text-[9px] font-bold uppercase tracking-widest",
                    cat.type === 'expense' ? "text-rose-400" : "text-emerald-400"
                  )}>
                    {cat.type === 'expense' ? 'Despesa' : 'Receita'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => startEdit(cat)} className="p-2 text-slate-300 hover:text-black transition-colors" title="Editar Categoria">
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => setConfirmDelete(cat.id)} 
                  className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                  title="Excluir Categoria"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {confirmDelete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-6"
            >
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                <Trash2 size={32} />
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-800">Excluir Categoria</h4>
                <p className="text-sm text-slate-400 mt-2">Tem certeza que deseja excluir esta categoria? Transações associadas poderão ficar sem categoria.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-colors">Cancelar</button>
                <button 
                  onClick={() => { deleteCategory(confirmDelete); setConfirmDelete(null); }}
                  className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-rose-200 hover:bg-rose-600 transition-colors"
                >Excluir</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(isAdding || isEditing) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: 100, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 100, scale: 0.95 }}
              className="bg-white/90 backdrop-blur-xl w-full max-w-md rounded-[3rem] p-8 pb-12 space-y-6 shadow-2xl border border-white/20 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xl font-bold text-slate-800">{isEditing ? 'Editar Categoria' : 'Nova Categoria'}</h4>
                  <p className="text-xs text-slate-400">Configure sua categoria personalizada</p>
                </div>
                <button 
                  onClick={() => { setIsAdding(false); setIsEditing(null); }} 
                  className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-black transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Tipo de Categoria</label>
                  <div className="flex p-1.5 bg-slate-100 rounded-2xl">
                    <button
                      onClick={() => setFormData({ ...formData, type: 'expense' })}
                      className={cn(
                        "flex-1 py-3 rounded-xl text-xs font-bold transition-all",
                        formData.type === 'expense' ? "bg-white text-rose-500 shadow-sm" : "text-slate-500"
                      )}
                    >
                      Despesa
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, type: 'income' })}
                      className={cn(
                        "flex-1 py-3 rounded-xl text-xs font-bold transition-all",
                        formData.type === 'income' ? "bg-white text-emerald-500 shadow-sm" : "text-slate-500"
                      )}
                    >
                      Receita
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Nome da Categoria</label>
                  <input
                    type="text"
                    placeholder="Ex: Alimentação, Salário..."
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-100/50 border-none rounded-2xl p-4 text-base focus:ring-2 focus:ring-black outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Cor</label>
                  <input 
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full h-14 bg-slate-100/50 border-none rounded-2xl p-1 focus:ring-2 focus:ring-black outline-none cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Ícone</label>
                    <span className="text-[9px] text-slate-300 font-medium italic">Selecione ou digite um emoji</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto custom-scrollbar p-1">
                      {availableIcons.map(iconName => (
                        <button
                          key={iconName}
                          type="button"
                          onClick={() => setFormData({ ...formData, icon: iconName })}
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-75",
                            formData.icon === iconName ? "bg-black text-white shadow-lg" : "bg-slate-100/50 text-slate-400"
                          )}
                        >
                          <CategoryIcon icon={iconName} size={18} />
                        </button>
                      ))}
                      {commonEmojis.map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setFormData({ ...formData, icon: emoji })}
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-75 text-xl",
                            formData.icon === emoji ? "bg-black shadow-lg" : "bg-slate-100/50"
                          )}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 bg-slate-100/50 p-3 rounded-2xl">
                      <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white text-xl">
                        <CategoryIcon icon={formData.icon} size={20} />
                      </div>
                      <input 
                        type="text"
                        placeholder="Cole um emoji aqui..."
                        value={availableIcons.includes(formData.icon) ? "" : formData.icon}
                        onChange={(e) => setFormData({ ...formData, icon: e.target.value || 'Wallet' })}
                        className="flex-1 bg-transparent border-none text-base focus:ring-0 outline-none p-0"
                        maxLength={2}
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSave}
                  className="w-full py-5 bg-black text-white rounded-[1.5rem] font-bold text-base shadow-xl active:scale-95 transition-all"
                >
                  {isEditing ? 'Salvar Alterações' : 'Criar Categoria'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CreditCardManager = () => {
  const { creditCards, addCreditCard, updateCreditCard, deleteCreditCard, accounts, transactions } = useFinance();
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', brand: 'Visa', bank: '', limit: 0, closingDay: 1, dueDay: 10, color: '#000000' });

  const brands = ['Visa', 'Mastercard', 'Elo', 'American Express', 'Hipercard'];

  const handleSave = () => {
    if (!formData.name || !formData.bank) {
      alert("Por favor, preencha o nome e o banco do cartão.");
      return;
    }
    if (isEditing) {
      updateCreditCard(isEditing, formData);
    } else {
      addCreditCard(formData);
    }
    setIsEditing(null);
    setIsAdding(false);
    setFormData({ name: '', brand: 'Visa', bank: '', limit: 0, closingDay: 1, dueDay: 10, color: '#000000' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-slate-800 font-bold text-lg">Meus Cartões</h3>
        <button 
          onClick={() => setIsAdding(true)} 
          className="bg-black text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-transform"
        >
          <Plus size={16} /> Novo
        </button>
      </div>

      <div className="grid gap-4">
        {creditCards.length === 0 ? (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-8 text-center">
            <CreditCardIcon size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-slate-400 text-xs font-medium">Nenhum cartão cadastrado</p>
          </div>
        ) : (
          creditCards.map(card => (
            <div 
              key={card.id} 
              className="relative overflow-hidden bg-white p-6 rounded-[2rem] card-shadow border border-slate-100 group transition-all hover:translate-y-[-2px]"
            >
              <div className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: card.color }} />
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{card.brand}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{card.bank}</span>
                  </div>
                  <p className="text-lg font-bold text-slate-800">{card.name}</p>
                  <div className="flex items-center gap-4 pt-2">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Limite</p>
                      <p className="text-sm font-bold text-slate-700">{formatCurrency(card.limit)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Fatura</p>
                      <p className="text-sm font-bold text-rose-500">
                        {formatCurrency(transactions.filter(t => t.creditCardId === card.id).reduce((acc, t) => acc + t.amount, 0))}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Vencimento</p>
                      <p className="text-sm font-bold text-slate-700">Dia {card.dueDay}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => { setIsEditing(card.id); setFormData(card); }} 
                    className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-black hover:bg-slate-100 transition-colors"
                    title="Editar Cartão"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => setConfirmDelete(card.id)} 
                    className="p-2 bg-rose-50 text-rose-400 rounded-xl hover:text-rose-600 hover:bg-rose-100 transition-colors"
                    title="Excluir Cartão"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <AnimatePresence>
        {confirmDelete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-6"
            >
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                <Trash2 size={32} />
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-800">Excluir Cartão</h4>
                <p className="text-sm text-slate-400 mt-2">Tem certeza que deseja excluir este cartão? Todas as transações vinculadas a ele serão afetadas.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-colors">Cancelar</button>
                <button 
                  onClick={() => { deleteCreditCard(confirmDelete); setConfirmDelete(null); }}
                  className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-rose-200 hover:bg-rose-600 transition-colors"
                >Excluir</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(isAdding || isEditing) && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: 100, scale: 0.95 }} 
              animate={{ y: 0, scale: 1 }} 
              exit={{ y: 100, scale: 0.95 }} 
              className="bg-white/90 backdrop-blur-xl w-full max-w-md rounded-[3rem] p-8 pb-12 space-y-6 shadow-2xl border border-white/20 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xl font-bold text-slate-800">{isEditing ? 'Editar Cartão' : 'Novo Cartão'}</h4>
                  <p className="text-xs text-slate-400">Preencha os dados do seu cartão</p>
                </div>
                <button 
                  onClick={() => { setIsAdding(false); setIsEditing(null); }} 
                  className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-black transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Descrição / Nome</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Cartão Principal" 
                    value={formData.name} 
                    onChange={e => setFormData({ ...formData, name: e.target.value })} 
                    className="w-full bg-slate-100/50 border-none rounded-2xl p-4 text-base focus:ring-2 focus:ring-black outline-none transition-all" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Banco</label>
                    <select 
                      value={formData.bank} 
                      onChange={e => setFormData({ ...formData, bank: e.target.value })} 
                      className="w-full bg-slate-100/50 border-none rounded-2xl p-4 text-base focus:ring-2 focus:ring-black outline-none appearance-none transition-all"
                    >
                      <option value="">Selecione o banco</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.name}>{acc.name}</option>
                      ))}
                    </select>
                    {accounts.length === 0 && (
                      <p className="text-[9px] text-rose-500 font-bold uppercase tracking-tighter px-1 mt-1">
                        ⚠️ Crie uma conta bancária primeiro.
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Bandeira</label>
                    <select 
                      value={formData.brand} 
                      onChange={e => setFormData({ ...formData, brand: e.target.value })} 
                      className="w-full bg-slate-100/50 border-none rounded-2xl p-4 text-base focus:ring-2 focus:ring-black outline-none appearance-none transition-all"
                    >
                      {brands.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Limite Total</label>
                  <input 
                    type="number" 
                    placeholder="0,00" 
                    value={formData.limit || ''} 
                    onChange={e => setFormData({ ...formData, limit: parseFloat(e.target.value) || 0 })} 
                    className="w-full bg-slate-100/50 border-none rounded-2xl p-4 text-base font-bold focus:ring-2 focus:ring-black outline-none transition-all" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Dia Fechamento</label>
                    <input 
                      type="number" 
                      min="1" max="31"
                      value={formData.closingDay} 
                      onChange={e => setFormData({ ...formData, closingDay: parseInt(e.target.value) || 1 })} 
                      className="w-full bg-slate-100/50 border-none rounded-2xl p-4 text-base focus:ring-2 focus:ring-black outline-none transition-all" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Dia Vencimento</label>
                    <input 
                      type="number" 
                      min="1" max="31"
                      value={formData.dueDay} 
                      onChange={e => setFormData({ ...formData, dueDay: parseInt(e.target.value) || 1 })} 
                      className="w-full bg-slate-100/50 border-none rounded-2xl p-4 text-base focus:ring-2 focus:ring-black outline-none transition-all" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Cor do Cartão</label>
                  <input 
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full h-14 bg-slate-100/50 border-none rounded-2xl p-1 focus:ring-2 focus:ring-black outline-none cursor-pointer"
                  />
                </div>
              </div>

              <button 
                onClick={handleSave} 
                className="w-full py-5 bg-black text-white rounded-[1.5rem] font-bold text-base shadow-xl active:scale-95 transition-all"
              >
                {isEditing ? 'Salvar Alterações' : 'Cadastrar Cartão'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AccountManager = () => {
  const { accounts, addAccount, updateAccount, deleteAccount } = useFinance();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', balance: 0, color: '#000000', icon: 'Wallet' });

  const handleSave = () => {
    if (!formData.name) return;
    if (editingId) {
      updateAccount(editingId, formData);
    } else {
      addAccount(formData);
    }
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: '', balance: 0, color: '#000000', icon: 'Wallet' });
  };

  const startEdit = (acc: any) => {
    setEditingId(acc.id);
    setFormData({ name: acc.name, balance: acc.balance, color: acc.color, icon: acc.icon });
    setIsAdding(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-slate-800 font-bold text-sm">Minhas Contas</h3>
        <button 
          onClick={() => setIsAdding(true)}
          className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {accounts.map(acc => (
          <div key={acc.id} className="bg-white p-5 rounded-[2rem] flex items-center justify-between card-shadow border border-slate-50">
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm"
                style={{ backgroundColor: acc.color }}
              >
                <CategoryIcon icon={acc.icon} size={22} />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">{acc.name}</p>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{formatCurrency(acc.balance)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => startEdit(acc)}
                className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:text-black transition-colors"
                title="Editar Conta"
              >
                <Edit2 size={18} />
              </button>
              <button 
                onClick={() => setConfirmDelete(acc.id)}
                className="w-10 h-10 bg-rose-50 text-rose-400 rounded-xl flex items-center justify-center hover:text-rose-600 transition-colors"
                title="Excluir Conta"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {confirmDelete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-6"
            >
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                <Trash2 size={32} />
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-800">Excluir Conta</h4>
                <p className="text-sm text-slate-400 mt-2">Tem certeza que deseja excluir esta conta? O saldo total será recalculado.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-colors">Cancelar</button>
                <button 
                  onClick={() => { deleteAccount(confirmDelete); setConfirmDelete(null); }}
                  className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-rose-200 hover:bg-rose-600 transition-colors"
                >Excluir</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-slate-900/40 backdrop-blur-md flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: 100, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 100, scale: 0.95 }}
              className="bg-white/95 backdrop-blur-xl w-full max-w-md rounded-[3rem] p-8 pb-12 space-y-6 shadow-2xl border border-white/20 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{editingId ? 'Editar Conta' : 'Nova Conta'}</h2>
                  <p className="text-xs text-slate-400">Configure os detalhes da sua conta bancária</p>
                </div>
                <button 
                  onClick={() => { setIsAdding(false); setEditingId(null); }} 
                  className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-black transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Nome da Conta</label>
                  <input 
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Nubank, Itaú, Carteira..."
                    className="w-full bg-slate-100/50 border-none rounded-2xl p-4 text-base focus:ring-2 focus:ring-black outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Saldo Inicial</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={formData.balance}
                    onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-100/50 border-none rounded-2xl p-4 text-base focus:ring-2 focus:ring-black outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Cor</label>
                    <input 
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-full h-14 bg-slate-100/50 border-none rounded-2xl p-1 focus:ring-2 focus:ring-black outline-none cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Ícone</label>
                    <select 
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      className="w-full h-14 bg-slate-100/50 border-none rounded-2xl p-4 text-base focus:ring-2 focus:ring-black outline-none appearance-none"
                    >
                      <option value="Wallet">Carteira</option>
                      <option value="Banknote">Banco</option>
                      <option value="TrendingUp">Investimento</option>
                      <option value="Briefcase">Trabalho</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSave}
                className="w-full py-5 bg-black text-white rounded-[1.5rem] font-bold text-base shadow-xl active:scale-95 transition-all"
              >
                {editingId ? 'Salvar Alterações' : 'Criar Conta'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TagManager = () => {
  const { tags, addTag, updateTag, deleteTag } = useFinance();
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', color: '#000000' });

  const handleSave = () => {
    if (!formData.name) return;
    if (isEditing) {
      updateTag(isEditing, formData);
    } else {
      addTag(formData);
    }
    setIsEditing(null);
    setIsAdding(false);
    setFormData({ name: '', color: '#000000' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-slate-800 font-bold text-lg">Tags</h3>
        <button 
          onClick={() => setIsAdding(true)} 
          className="bg-black text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-transform"
        >
          <Plus size={16} /> Nova
        </button>
      </div>

      <div className="flex flex-wrap gap-3 px-2">
        {tags.length === 0 ? (
          <div className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-8 text-center">
            <TagIcon size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-slate-400 text-xs font-medium">Nenhuma tag cadastrada</p>
          </div>
        ) : (
          tags.map(tag => (
            <div 
              key={tag.id} 
              className="flex items-center gap-3 px-4 py-2 rounded-full text-white text-xs font-bold shadow-sm transition-transform hover:scale-105" 
              style={{ backgroundColor: tag.color }}
            >
              <span>{tag.name}</span>
              <div className="flex items-center gap-1 border-l border-white/20 pl-2 ml-1">
                <button 
                  onClick={() => { setIsEditing(tag.id); setFormData(tag); }} 
                  className="hover:text-black/50 transition-colors"
                  title="Editar Tag"
                >
                  <Edit2 size={12} />
                </button>
                <button 
                  onClick={() => setConfirmDelete(tag.id)} 
                  className="hover:text-black/50 transition-colors"
                  title="Excluir Tag"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <AnimatePresence>
        {confirmDelete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-6"
            >
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                <Trash2 size={32} />
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-800">Excluir Tag</h4>
                <p className="text-sm text-slate-400 mt-2">Tem certeza que deseja excluir esta tag? Ela será removida de todas as transações.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-colors">Cancelar</button>
                <button 
                  onClick={() => { deleteTag(confirmDelete); setConfirmDelete(null); }}
                  className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-rose-200 hover:bg-rose-600 transition-colors"
                >Excluir</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(isAdding || isEditing) && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: 100, scale: 0.95 }} 
              animate={{ y: 0, scale: 1 }} 
              exit={{ y: 100, scale: 0.95 }} 
              className="bg-white/90 backdrop-blur-xl w-full max-w-md rounded-[3rem] p-8 pb-12 space-y-6 shadow-2xl border border-white/20 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xl font-bold text-slate-800">{isEditing ? 'Editar Tag' : 'Nova Tag'}</h4>
                  <p className="text-xs text-slate-400">Crie etiquetas para organizar suas transações</p>
                </div>
                <button 
                  onClick={() => { setIsAdding(false); setIsEditing(null); }} 
                  className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-black transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Nome da Tag</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Viagem, Presente..." 
                    value={formData.name} 
                    onChange={e => setFormData({ ...formData, name: e.target.value })} 
                    className="w-full bg-slate-100/50 border-none rounded-2xl p-4 text-base focus:ring-2 focus:ring-black outline-none transition-all" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Cor da Tag</label>
                  <input 
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full h-14 bg-slate-100/50 border-none rounded-2xl p-1 focus:ring-2 focus:ring-black outline-none cursor-pointer"
                  />
                </div>
              </div>

              <button 
                onClick={handleSave} 
                className="w-full py-5 bg-black text-white rounded-[1.5rem] font-bold text-base shadow-xl active:scale-95 transition-all"
              >
                {isEditing ? 'Salvar Alterações' : 'Criar Tag'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MoreOptions = () => {
  const { 
    transactions, 
    notificationSettings, 
    updateNotificationSettings
  } = useFinance();

  const exportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(transactions));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "transacoes_meu_financeiro.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    // This function is no longer needed here as it's moved to ImportManager
    // But keeping it for JSON backup if needed, though the request was to move "Importação em lote"
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-slate-800 font-semibold text-sm px-2">Backup e Dados (JSON)</h3>
        <div className="grid grid-cols-2 gap-4">
          <button onClick={exportData} className="flex flex-col items-center justify-center p-6 bg-white rounded-3xl card-shadow gap-2 hover:bg-slate-50 transition-colors">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-black">
              <Download size={24} />
            </div>
            <span className="text-xs font-bold text-slate-600">Exportar JSON</span>
          </button>
          <label className="flex flex-col items-center justify-center p-6 bg-white rounded-3xl card-shadow gap-2 hover:bg-slate-50 transition-colors cursor-pointer">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-black">
              <Upload size={24} />
            </div>
            <span className="text-xs font-bold text-slate-600">Importar JSON</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-slate-800 font-semibold text-sm px-2">Notificações e Lembretes</h3>
        <div className="bg-white rounded-[2rem] card-shadow overflow-hidden divide-y divide-slate-50">
          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                <Bell size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Vencimento de Fatura</p>
                <p className="text-[10px] text-slate-400 font-medium">Lembrar antes do vencimento</p>
              </div>
            </div>
            <button 
              onClick={() => updateNotificationSettings({ cardDueReminders: !notificationSettings.cardDueReminders })}
              className={cn(
                "w-12 h-6 rounded-full relative transition-colors",
                notificationSettings.cardDueReminders ? "bg-black" : "bg-slate-200"
              )}
            >
              <div className={cn(
                "w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-all",
                notificationSettings.cardDueReminders ? "right-0.5" : "left-0.5"
              )} />
            </button>
          </div>

          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                <History size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Lembrete de Transações</p>
                <p className="text-[10px] text-slate-400 font-medium">Notificar para registrar gastos</p>
              </div>
            </div>
            <button 
              onClick={() => updateNotificationSettings({ transactionReminders: !notificationSettings.transactionReminders })}
              className={cn(
                "w-12 h-6 rounded-full relative transition-colors",
                notificationSettings.transactionReminders ? "bg-black" : "bg-slate-200"
              )}
            >
              <div className={cn(
                "w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-all",
                notificationSettings.transactionReminders ? "right-0.5" : "left-0.5"
              )} />
            </button>
          </div>

          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-600">Antecedência (dias)</p>
              <div className="flex items-center gap-3 bg-slate-100 p-1 rounded-lg">
                {[1, 2, 3, 5].map(d => (
                  <button 
                    key={d}
                    onClick={() => updateNotificationSettings({ daysBeforeDue: d })}
                    className={cn(
                      "w-8 py-1 rounded-md text-[10px] font-bold transition-all",
                      notificationSettings.daysBeforeDue === d ? "bg-white text-black shadow-sm" : "text-slate-400"
                    )}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-600">Horário do Lembrete</p>
              <input 
                type="time" 
                value={notificationSettings.reminderTime}
                onChange={(e) => updateNotificationSettings({ reminderTime: e.target.value })}
                className="bg-slate-100 border-none rounded-lg px-3 py-1 text-base font-bold outline-none focus:ring-1 focus:ring-black"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReportGenerator = () => {
  const { transactions, categories, tags, creditCards } = useFinance();
  const [startDate, setStartDate] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [showReport, setShowReport] = useState(false);

  const filteredTransactions = transactions.filter(t => {
    const tDate = format(parseISO(t.date), 'yyyy-MM-dd');
    const dateMatch = tDate >= startDate && tDate <= endDate;
    const categoryMatch = selectedCategory === 'all' || t.category === selectedCategory;
    const typeMatch = selectedType === 'all' || t.type === selectedType;
    const tagMatch = selectedTag === 'all' || t.tags?.includes(selectedTag);
    return dateMatch && categoryMatch && typeMatch && tagMatch;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalPeriod = filteredTransactions.reduce((acc, curr) => 
    curr.type === 'income' ? acc + curr.amount : acc - curr.amount, 0
  );

  const exportCSV = () => {
    const headers = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor'];
    const rows = filteredTransactions.map(t => [
      format(parseISO(t.date), 'dd/MM/yyyy'),
      t.description,
      t.category,
      t.type === 'income' ? 'Receita' : 'Despesa',
      t.amount.toFixed(2)
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_${startDate}_a_${endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    // For PDF in a browser environment without heavy libraries, 
    // we use window.print() on a specifically formatted hidden element or a new window
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const total = filteredTransactions.reduce((acc, curr) => 
      curr.type === 'income' ? acc + curr.amount : acc - curr.amount, 0
    );

    printWindow.document.write(`
      <html>
        <head>
          <title>Relatório Financeiro</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            h1 { text-align: center; margin-bottom: 10px; }
            .meta { text-align: center; color: #666; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #eee; padding: 12px; text-align: left; }
            th { bg-color: #f9f9f9; }
            .amount { text-align: right; }
            .income { color: #10b981; }
            .expense { color: #ef4444; }
            .footer { margin-top: 30px; text-align: right; font-weight: bold; font-size: 1.2em; }
          </style>
        </head>
        <body>
          <h1>Meu Financeiro - Relatório</h1>
          <div class="meta">Período: ${format(new Date(startDate), 'dd/MM/yyyy')} até ${format(new Date(endDate), 'dd/MM/yyyy')}</div>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th class="amount">Valor</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTransactions.map(t => `
                <tr>
                  <td>${format(parseISO(t.date), 'dd/MM/yyyy')}</td>
                  <td>${t.description}</td>
                  <td>${t.category}</td>
                  <td class="amount ${t.type}">${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">Saldo do Período: ${formatCurrency(total)}</div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl card-shadow space-y-4">
        <h3 className="text-slate-800 font-semibold text-sm">Filtros do Relatório</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Início</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-xl p-3 text-base focus:ring-2 focus:ring-black outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Fim</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-xl p-3 text-base focus:ring-2 focus:ring-black outline-none"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Categoria</label>
          <select 
            value={selectedCategory} 
            onChange={e => setSelectedCategory(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl p-3 text-base focus:ring-2 focus:ring-black outline-none appearance-none"
          >
            <option value="all">Todas as Categorias</option>
            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Tag</label>
          <select 
            value={selectedTag} 
            onChange={e => setSelectedTag(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl p-3 text-base focus:ring-2 focus:ring-black outline-none appearance-none"
          >
            <option value="all">Todas as Tags</option>
            {tags.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Tipo</label>
          <div className="flex p-1 bg-slate-100 rounded-xl">
            <button 
              onClick={() => setSelectedType('all')}
              className={cn("flex-1 py-2 rounded-lg text-[10px] font-bold transition-all", selectedType === 'all' ? "bg-white text-black shadow-sm" : "text-slate-500")}
            >Todos</button>
            <button 
              onClick={() => setSelectedType('income')}
              className={cn("flex-1 py-2 rounded-lg text-[10px] font-bold transition-all", selectedType === 'income' ? "bg-white text-emerald-500 shadow-sm" : "text-slate-500")}
            >Receitas</button>
            <button 
              onClick={() => setSelectedType('expense')}
              className={cn("flex-1 py-2 rounded-lg text-[10px] font-bold transition-all", selectedType === 'expense' ? "bg-white text-rose-500 shadow-sm" : "text-slate-500")}
            >Despesas</button>
          </div>
        </div>

        <button 
          onClick={() => setShowReport(true)}
          className="w-full py-4 bg-black text-white rounded-2xl font-bold text-sm shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <PieChart size={18} /> Gerar Relatório na Tela
        </button>
      </div>

      {showReport && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between px-2">
            <h3 className="text-slate-800 font-bold text-sm uppercase tracking-wider">Extrato do Período</h3>
            <button 
              onClick={() => setShowReport(false)}
              className="text-[10px] font-bold text-rose-500 uppercase tracking-widest"
            >
              Fechar
            </button>
          </div>

          <div className="bg-white rounded-[2rem] card-shadow overflow-hidden border border-slate-50">
            <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saldo do Período</p>
                <p className={cn("text-xl font-black mt-1", totalPeriod >= 0 ? "text-emerald-500" : "text-rose-500")}>
                  {formatCurrency(totalPeriod)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Movimentações</p>
                <p className="text-xl font-black text-slate-800 mt-1">{filteredTransactions.length}</p>
              </div>
            </div>

            <div className="divide-y divide-slate-50">
              {filteredTransactions.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-slate-400 text-xs font-medium">Nenhuma transação no período selecionado.</p>
                </div>
              ) : (
                filteredTransactions.map(t => {
                  const categoryObj = categories.find(c => c.name === t.category);
                  
                  return (
                    <div key={t.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                          style={{ backgroundColor: categoryObj?.color || '#94a3b8' }}
                        >
                          <CategoryIcon icon={categoryObj?.icon || 'Wallet'} size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-xs">{t.description}</p>
                          <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">
                            {format(parseISO(t.date), "dd/MM/yyyy")} • {t.category}
                          </p>
                        </div>
                      </div>
                      <p className={cn(
                        "font-bold text-sm",
                        t.type === 'income' ? "text-emerald-500" : "text-rose-500"
                      )}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </motion.div>
      )}

      <div className="bg-white p-6 rounded-3xl card-shadow space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-slate-800 font-semibold text-sm">Resumo</h3>
          <span className="text-[10px] font-bold text-slate-400">{filteredTransactions.length} transações</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={exportPDF}
            className="flex items-center justify-center gap-2 py-3 bg-black text-white rounded-xl text-xs font-bold shadow-lg active:scale-95 transition-transform"
          >
            <Download size={14} /> PDF
          </button>
          <button 
            onClick={exportCSV}
            className="flex items-center justify-center gap-2 py-3 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold active:scale-95 transition-transform"
          >
            <Upload size={14} className="rotate-180" /> CSV
          </button>
        </div>
      </div>
    </div>
  );
};

const ChartsTab = () => {
  const { transactions, tags, categories, creditCards } = useFinance();

  const now = useMemo(() => new Date(), []);
  const monthlyTransactions = useMemo(() => {
    return transactions.filter(t => {
      try {
        const d = parseISO(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      } catch (e) {
        return false;
      }
    });
  }, [transactions, now]);

  // Data for Tags
  const tagData = useMemo(() => {
    return tags.map(tag => {
      const amount = monthlyTransactions
        .filter(t => t.type === 'expense' && t.tags?.includes(tag.id))
        .reduce((acc, curr) => acc + curr.amount, 0);
      return { name: tag.name, amount, color: tag.color };
    }).filter(d => d.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [tags, monthlyTransactions]);

  // Data for Categories (Sandwich/Donut Chart)
  const categoryData = useMemo(() => {
    return categories
      .filter(c => c.type === 'expense')
      .map(c => {
        const amount = monthlyTransactions
          .filter(t => t.type === 'expense' && t.category === c.name)
          .reduce((acc, curr) => acc + curr.amount, 0);
        return { name: c.name, value: amount, color: c.color };
      })
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [categories, monthlyTransactions]);

  // Data for Credit Cards
  const cardData = useMemo(() => {
    return creditCards.map(card => {
      const amount = monthlyTransactions
        .filter(t => t.type === 'expense' && t.creditCardId === card.id)
        .reduce((acc, curr) => acc + curr.amount, 0);
      return { name: card.name, amount, color: card.color };
    }).filter(d => d.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [creditCards, monthlyTransactions]);

  return (
    <div className="pt-12 pb-24 lg:pb-0 space-y-10">
      <div className="mb-8 px-2">
        <h2 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight">Gráficos</h2>
        <p className="text-slate-400 text-sm mt-1 font-medium">Análise detalhada dos seus gastos</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gastos por Categoria (Sandwich/Donut Chart) */}
        <div className="bg-white p-8 rounded-[3rem] card-shadow space-y-8 border border-slate-50">
          <div className="flex items-center justify-between px-2">
            <div>
              <h3 className="text-slate-800 font-bold text-xl">Gastos por Categoria</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Distribuição Mensal</p>
            </div>
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
              <PieChart size={24} />
            </div>
          </div>

          {categoryData.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                <PieChart size={32} />
              </div>
              <p className="text-slate-400 text-sm font-medium">Nenhum gasto por categoria.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-8">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <RePieChart>
                    <Pie
                      data={categoryData}
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '12px 16px' }}
                      formatter={(value: number) => [formatCurrency(value), 'Gasto']}
                    />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full">
                {categoryData.slice(0, 6).map((item, i) => (
                  <div key={i} className="flex flex-col p-4 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[10px] font-bold text-slate-500 uppercase truncate">{item.name}</span>
                    </div>
                    <span className="text-sm font-black text-slate-900">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Gastos por Tags (Bar Chart) */}
        <div className="bg-white p-8 rounded-[3rem] card-shadow space-y-8 border border-slate-50">
          <div className="flex items-center justify-between px-2">
            <div>
              <h3 className="text-slate-800 font-bold text-xl">Gastos por Tags</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Etiquetas e Projetos</p>
            </div>
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
              <TagIcon size={24} />
            </div>
          </div>

          {tagData.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                <TagIcon size={32} />
              </div>
              <p className="text-slate-400 text-sm font-medium">Nenhum dado de tag para exibir.</p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={tagData} layout="vertical" margin={{ left: 0, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 11, fill: '#64748b', fontWeight: 700}}
                      width={80}
                    />
                    <Tooltip 
                      cursor={{fill: 'transparent'}}
                      contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '12px 16px' }}
                      formatter={(value: number) => [formatCurrency(value), 'Gasto']}
                    />
                    <Bar dataKey="amount" radius={[0, 10, 10, 0]} barSize={24}>
                      {tagData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {tagData.slice(0, 4).map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                      <span className="text-sm font-bold text-slate-700">{item.name}</span>
                    </div>
                    <span className="text-sm font-black text-slate-900">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gastos por Cartões (Bar Chart) */}
      <div className="bg-white p-8 rounded-[3rem] card-shadow space-y-8 border border-slate-50">
        <div className="flex items-center justify-between px-2">
          <div>
            <h3 className="text-slate-800 font-bold text-xl">Gastos por Cartões</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Uso de Crédito</p>
          </div>
          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
            <CreditCardIcon size={24} />
          </div>
        </div>

        {cardData.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
              <CreditCardIcon size={32} />
            </div>
            <p className="text-slate-400 text-sm font-medium">Nenhum gasto em cartões.</p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={cardData} layout="vertical" margin={{ left: 0, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 11, fill: '#64748b', fontWeight: 700}}
                    width={80}
                  />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '12px 16px' }}
                    formatter={(value: number) => [formatCurrency(value), 'Gasto']}
                  />
                  <Bar dataKey="amount" radius={[0, 10, 10, 0]} barSize={24}>
                    {cardData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {cardData.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-bold text-slate-700">{item.name}</span>
                  </div>
                  <span className="text-sm font-black text-slate-900">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const TransactionCard = ({ 
  t, 
  categories, 
  creditCards, 
  tags, 
  onEdit, 
  onDelete 
}: { 
  t: Transaction; 
  categories: Category[]; 
  creditCards: CreditCard[]; 
  tags: Tag[]; 
  onEdit: (t: Transaction) => void; 
  onDelete: (id: string) => void; 
  key?: React.Key;
}) => {
  const categoryObj = categories.find(c => c.name === t.category);
  const card = creditCards.find(c => c.id === t.creditCardId);
  const transactionTags = tags.filter(tag => t.tags?.includes(tag.id));
  
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className="bg-white p-5 rounded-[2rem] flex items-center justify-between card-shadow border border-slate-50 group hover:bg-slate-50"
    >
      <div className="flex items-center gap-4">
        <div 
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm"
          style={{ backgroundColor: categoryObj?.color || '#94a3b8' }}
        >
          <CategoryIcon icon={categoryObj?.icon || 'Wallet'} size={22} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-bold text-slate-800 text-sm">{t.description}</p>
            {card && (
              <span className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-tighter">
                {card.name}
              </span>
            )}
            {t.installmentId && (
              <span className="text-[8px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-tighter">
                {t.installmentIndex}/{t.installments}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1 mt-1">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              {format(parseISO(t.date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
            </p>
            {transactionTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {transactionTags.map(tag => (
                  <span key={tag.id} className="text-[8px] px-1.5 py-0.5 rounded-md text-white font-bold" style={{ backgroundColor: tag.color }}>
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <p className={cn(
          "font-black text-base",
          t.type === 'income' ? "text-emerald-500" : "text-rose-500"
        )}>
          {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
        </p>
        <div className="flex items-center gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => onEdit(t)}
            className="p-3 text-slate-300 hover:text-black transition-colors"
            title="Editar Transação"
          >
            <Edit2 size={18} />
          </button>
          <button 
            onClick={() => onDelete(t.id)}
            className="p-3 text-slate-300 hover:text-rose-500 transition-colors"
            title="Excluir Transação"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const HistoryTab = ({ onEdit }: { onEdit: (t: Transaction) => void }) => {
  const { transactions, categories, tags, creditCards, deleteTransaction } = useFinance();
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});

  const now = useMemo(() => new Date(), []);

  const nextMonthDate = useMemo(() => {
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }, [now]);

  const nextMonthLabel = useMemo(() => {
    const raw = format(nextMonthDate, 'MMMM yyyy', { locale: ptBR });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [nextMonthDate]);

  const futureMonthTransactions = useMemo(() => {
    return transactions.filter(t => {
      try {
        const d = parseISO(t.date);
        const isNext = d.getMonth() === nextMonthDate.getMonth() && d.getFullYear() === nextMonthDate.getFullYear();
        const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase());
        return isNext && matchesSearch;
      } catch {
        return false;
      }
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchQuery, nextMonthDate]);

  const currentMonthTransactions = useMemo(() => {
    return transactions.filter(t => {
      try {
        const d = parseISO(t.date);
        const isCurrent = d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase());
        return isCurrent && matchesSearch;
      } catch {
        return false;
      }
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchQuery, now]);

  const previousMonthsGroups = useMemo(() => {
    const prev = transactions.filter(t => {
      try {
        const d = parseISO(t.date);
        const isCurrent = d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        const isNext = d.getMonth() === nextMonthDate.getMonth() && d.getFullYear() === nextMonthDate.getFullYear();
        const isBefore = d.getTime() < now.getTime() && !isCurrent && !isNext;
        const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase());
        return isBefore && matchesSearch;
      } catch {
        return false;
      }
    });

    const groups: Record<string, { 
      monthKey: string; 
      label: string; 
      transactions: Transaction[]; 
      income: number; 
      expense: number; 
    }> = {};

    prev.forEach(t => {
      try {
        const d = parseISO(t.date);
        const sortKey = format(d, 'yyyy-MM');
        const labelRaw = format(d, 'MMMM yyyy', { locale: ptBR });
        const label = labelRaw.charAt(0).toUpperCase() + labelRaw.slice(1);

        if (!groups[sortKey]) {
          groups[sortKey] = {
            monthKey: sortKey,
            label,
            transactions: [],
            income: 0,
            expense: 0
          };
        }

        groups[sortKey].transactions.push(t);
        if (t.type === 'income') {
          groups[sortKey].income += t.amount;
        } else {
          groups[sortKey].expense += t.amount;
        }
      } catch (e) {
        console.error(e);
      }
    });

    Object.values(groups).forEach(g => {
      g.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });

    return Object.values(groups).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [transactions, searchQuery, now, nextMonthDate]);

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths(prev => ({
      ...prev,
      [monthKey]: !prev[monthKey]
    }));
  };

  return (
    <div className="pt-12 pb-24 lg:pb-0 space-y-8">
      <div className="mb-8 px-2 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight">Histórico</h2>
          <p className="text-slate-400 text-sm mt-1 font-medium">Todas as suas movimentações</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Buscar por descrição..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-slate-800 placeholder:text-slate-400 card-shadow focus:ring-2 focus:ring-black outline-none transition-all"
          />
        </div>
      </div>

      {/* Seção 0: Mês Futuro (Próximo Mês) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-indigo-600 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            Mês Futuro ({nextMonthLabel})
          </h3>
          {futureMonthTransactions.length > 0 && (
            <span className="text-xs bg-indigo-50 text-indigo-600 font-bold px-3 py-1 rounded-full">
              {futureMonthTransactions.length} {futureMonthTransactions.length === 1 ? 'lançamento' : 'lançamentos'}
            </span>
          )}
        </div>

        {futureMonthTransactions.length === 0 ? (
          <div className="bg-slate-50/50 p-6 rounded-[2rem] text-center border border-dashed border-slate-200">
            <p className="text-slate-400 text-xs font-medium">Nenhum lançamento previsto para o próximo mês.</p>
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] border border-slate-50 card-shadow overflow-hidden transition-all duration-300">
            <button
              onClick={() => toggleMonth('next_month')}
              className="w-full p-6 flex flex-col sm:flex-row sm:items-center justify-between text-left hover:bg-slate-50/55 transition-colors gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Calendar size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm lg:text-base">Planejado para {nextMonthLabel}</h4>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Clique para ver os valores e parcelas programados para o próximo mês
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 self-end sm:self-auto">
                <div className="flex items-center gap-4 text-xs font-bold text-right">
                  {(() => {
                    const inc = futureMonthTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
                    const exp = futureMonthTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
                    return (
                      <>
                        {inc > 0 && (
                          <div className="text-emerald-600">
                            <span className="text-[8px] uppercase text-slate-400 font-bold tracking-wider block">Prev. Receitas</span>
                            +{formatCurrency(inc)}
                          </div>
                        )}
                        {exp > 0 && (
                          <div className="text-rose-600">
                            <span className="text-[8px] uppercase text-slate-400 font-bold tracking-wider block">Prev. Despesas</span>
                            -{formatCurrency(exp)}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                <div className={cn(
                  "p-2 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 transition-transform duration-300",
                  expandedMonths['next_month'] ? "rotate-90" : ""
                )}>
                  <ChevronRight size={16} />
                </div>
              </div>
            </button>

            <AnimatePresence initial={false}>
              {expandedMonths['next_month'] && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="border-t border-slate-50 bg-indigo-50/5"
                >
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <AnimatePresence>
                        {futureMonthTransactions.map((t) => (
                          <TransactionCard
                            key={t.id}
                            t={t}
                            categories={categories}
                            creditCards={creditCards}
                            tags={tags}
                            onEdit={onEdit}
                            onDelete={setConfirmDelete}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Seção 1: Mês Atual */}
      <div className="space-y-4">
        <h3 className="text-slate-800 font-bold text-sm uppercase tracking-wider px-2">
          Mês Atual ({format(now, 'MMMM yyyy', { locale: ptBR }).charAt(0).toUpperCase() + format(now, 'MMMM yyyy', { locale: ptBR }).slice(1)})
        </h3>
        
        {currentMonthTransactions.length === 0 ? (
          <div className="bg-white p-12 rounded-[3rem] text-center card-shadow border border-slate-50">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200 mb-4">
              <History size={32} />
            </div>
            <p className="text-slate-400 text-sm font-medium">Nenhuma transação encontrada no mês atual.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AnimatePresence>
              {currentMonthTransactions.map((t) => (
                <TransactionCard
                  key={t.id}
                  t={t}
                  categories={categories}
                  creditCards={creditCards}
                  tags={tags}
                  onEdit={onEdit}
                  onDelete={setConfirmDelete}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Seção 2: Meses Anteriores */}
      {previousMonthsGroups.length > 0 && (
        <div className="space-y-4 pt-4">
          <h3 className="text-slate-800 font-bold text-sm uppercase tracking-wider px-2">
            Meses Anteriores
          </h3>
          <div className="space-y-4">
            {previousMonthsGroups.map((group) => {
              const isExpanded = !!expandedMonths[group.monthKey];
              return (
                <div key={group.monthKey} className="bg-white rounded-[2rem] border border-slate-50 card-shadow overflow-hidden transition-all duration-300">
                  <button
                    onClick={() => toggleMonth(group.monthKey)}
                    className="w-full p-6 flex flex-col sm:flex-row sm:items-center justify-between text-left hover:bg-slate-50/55 transition-colors gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                        <History size={18} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm lg:text-base">{group.label}</h4>
                        <p className="text-slate-400 text-xs mt-0.5">
                          {group.transactions.length} {group.transactions.length === 1 ? 'transação' : 'transações'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 self-end sm:self-auto">
                      <div className="flex items-center gap-4 text-xs font-bold text-right">
                        {group.income > 0 && (
                          <div className="text-emerald-600">
                            <span className="text-[8px] uppercase text-slate-400 font-bold tracking-wider block">Receitas</span>
                            +{formatCurrency(group.income)}
                          </div>
                        )}
                        {group.expense > 0 && (
                          <div className="text-rose-600">
                            <span className="text-[8px] uppercase text-slate-400 font-bold tracking-wider block">Despesas</span>
                            -{formatCurrency(group.expense)}
                          </div>
                        )}
                      </div>
                      
                      <div className={cn(
                        "p-2 bg-slate-50 border border-slate-100 rounded-full text-slate-500 transition-transform duration-300",
                        isExpanded ? "rotate-90" : ""
                      )}>
                        <ChevronRight size={16} />
                      </div>
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="border-t border-slate-50 bg-slate-50/30"
                      >
                        <div className="p-6 space-y-4">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <AnimatePresence>
                              {group.transactions.map((t) => (
                                <TransactionCard
                                  key={t.id}
                                  t={t}
                                  categories={categories}
                                  creditCards={creditCards}
                                  tags={tags}
                                  onEdit={onEdit}
                                  onDelete={setConfirmDelete}
                                />
                              ))}
                            </AnimatePresence>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {previousMonthsGroups.length === 0 && searchQuery && currentMonthTransactions.length === 0 && (
        <div className="bg-white p-12 rounded-[3.5rem] text-center card-shadow border border-slate-50">
          <p className="text-slate-400 text-sm font-medium">Nenhuma transação encontrada de períodos anteriores.</p>
        </div>
      )}

      <AnimatePresence>
        {confirmDelete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-6"
            >
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                <Trash2 size={32} />
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-800">Confirmar Exclusão</h4>
                <p className="text-sm text-slate-400 mt-2">Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    deleteTransaction(confirmDelete);
                    setConfirmDelete(null);
                  }}
                  className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-rose-200 hover:bg-rose-600 transition-colors"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SettingsTab = () => {
  const [activeSubTab, setActiveSubTab] = useState<string | null>(null);
  
  const menuGroups = [
    {
      title: 'Personalização',
      items: [
        { id: 'dashboard', label: 'Dashboard', description: 'Configure sua tela inicial', icon: LayoutDashboard, color: 'bg-slate-100 text-slate-600' },
        { id: 'categories', label: 'Categorias', description: 'Gerencie suas categorias de gastos', icon: PieChart, color: 'bg-slate-100 text-slate-600' },
        { id: 'tags', label: 'Tags', description: 'Organize com etiquetas coloridas', icon: TagIcon, color: 'bg-slate-100 text-slate-600' },
      ]
    },
    {
      title: 'Financeiro',
      items: [
        { id: 'accounts', label: 'Contas Bancárias', description: 'Gerencie suas contas e saldos', icon: Wallet, color: 'bg-slate-100 text-slate-600' },
        { id: 'cards', label: 'Cartões de Crédito', description: 'Cadastre e edite seus cartões', icon: CreditCardIcon, color: 'bg-slate-100 text-slate-600' },
        { id: 'reports', label: 'Relatórios', description: 'Exporte seus dados em PDF ou CSV', icon: History, color: 'bg-slate-100 text-slate-600' },
      ]
    },
    {
      title: 'Conta e Dados',
      items: [
        { id: 'users', label: 'Usuários', description: 'Gerencie os usuários do sistema', icon: User, color: 'bg-slate-100 text-slate-600' },
        { id: 'imports', label: 'Importações', description: 'Gerencie planilhas importadas', icon: FileSpreadsheet, color: 'bg-slate-100 text-slate-600' },
        { id: 'more', label: 'Dados e Sistema', description: 'Importar, exportar ou resetar', icon: MoreHorizontal, color: 'bg-slate-100 text-slate-600' },
      ]
    }
  ];

  if (activeSubTab) {
    const activeTabInfo = menuGroups.flatMap(g => g.items).find(i => i.id === activeSubTab);
    const Icon = activeTabInfo?.icon || Settings;

    return (
      <motion.div 
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="pt-12 pb-24 space-y-6"
      >
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => setActiveSubTab(null)}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center card-shadow text-slate-400 active:scale-90 transition-transform"
          >
            <ChevronRight size={20} className="rotate-180" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{activeTabInfo?.label}</h2>
            <p className="text-xs text-slate-400">{activeTabInfo?.description}</p>
          </div>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          {activeSubTab === 'dashboard' && (
            <div className="bg-white p-6 rounded-3xl card-shadow space-y-4">
              <h3 className="text-slate-800 font-semibold text-sm">Configurações do Dashboard</h3>
              <p className="text-slate-400 text-xs">Personalize a exibição da sua tela inicial.</p>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <span className="text-sm text-slate-600 font-medium">Exibir saldo total</span>
                <button className="w-12 h-6 bg-black rounded-full relative transition-colors">
                  <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm" />
                </button>
              </div>
            </div>
          )}

          {activeSubTab === 'categories' && <CategoryManager />}
          {activeSubTab === 'accounts' && <AccountManager />}
          {activeSubTab === 'users' && <UserManager />}
          {activeSubTab === 'imports' && <ImportManager />}
          {activeSubTab === 'cards' && <CreditCardManager />}
          {activeSubTab === 'reports' && <ReportGenerator />}
          {activeSubTab === 'tags' && <TagManager />}
          {activeSubTab === 'more' && (
            <div className="space-y-8">
              <MoreOptions />
              <div className="bg-white p-6 rounded-3xl card-shadow space-y-4">
                <h3 className="text-slate-800 font-semibold text-sm">Sistema</h3>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Versão</span>
                  <span className="font-bold text-slate-800">1.0.0</span>
                </div>
                <div className="pt-4 border-t border-slate-50">
                  <button 
                    onClick={() => auth.signOut()} 
                    className="w-full py-4 rounded-2xl bg-slate-50 text-slate-400 font-bold text-sm active:scale-95 transition-transform"
                  >
                    Sair da Conta
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="pt-12 pb-24 lg:pb-0 space-y-8">
      <div className="mb-8">
        <h2 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight">Ajustes</h2>
        <p className="text-slate-400 text-sm mt-1 font-medium">Personalize sua experiência financeira</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {menuGroups.map((group, idx) => (
          <div key={idx} className="space-y-3">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-2">
              {group.title}
            </h3>
            <div className="bg-white rounded-[2rem] card-shadow overflow-hidden">
              {group.items.map((item, itemIdx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSubTab(item.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors group",
                      itemIdx !== group.items.length - 1 && "border-bottom border-slate-50"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-active:scale-90", item.color)}>
                        <Icon size={22} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-slate-800">{item.label}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{item.description}</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-black transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="p-8 text-center space-y-6">
        <button 
          onClick={() => auth.signOut()}
          className="lg:hidden w-full py-4 bg-rose-50 text-rose-500 rounded-2xl text-sm font-black flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <LogOut size={18} /> Sair da Conta
        </button>

        <div>
          <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-100 rounded-full mb-3">
            <Settings size={20} className="text-slate-400" />
          </div>
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Meu Financeiro v1.0</p>
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ activeTab, setActiveTab, setIsAdding }: { activeTab: string, setActiveTab: (tab: string) => void, setIsAdding: (val: boolean) => void }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
    { id: 'transactions', label: 'Histórico', icon: History },
    { id: 'charts', label: 'Gráficos', icon: PieChart },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-slate-100 h-screen sticky top-0 p-8">
      <div className="flex items-center gap-3 mb-12 px-2">
        <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white shadow-xl shadow-black/10 overflow-hidden">
          <img src="https://i.imgur.com/pYENenK.png" alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
        <div>
          <h1 className="font-black text-xl tracking-tight text-slate-900">Meu Financeiro</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Controle Total</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-sm transition-all duration-300 group",
              activeTab === item.id 
                ? "bg-black text-white shadow-2xl shadow-black/20 translate-x-1" 
                : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
            )}
          >
            <item.icon size={22} className={cn("transition-transform duration-300", activeTab === item.id ? "scale-110" : "group-hover:scale-110")} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="mt-auto pt-8 border-t border-slate-50">
        <button 
          onClick={() => auth.signOut()}
          className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-sm text-rose-500 hover:bg-rose-50 transition-all group"
        >
          <LogOut size={22} className="group-hover:scale-110 transition-transform" />
          Sair da Conta
        </button>
      </div>

      <div className="mt-auto space-y-4">
        <button
          onClick={() => setIsAdding(true)}
          className="w-full bg-black text-white py-5 rounded-2xl font-bold text-sm shadow-2xl shadow-black/20 active:scale-95 transition-all flex items-center justify-center gap-3 hover:bg-slate-800"
        >
          <Plus size={22} /> Nova Transação
        </button>
        
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <TrendingUp size={16} />
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Dica do Dia</p>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">Mantenha suas categorias organizadas para relatórios mais precisos.</p>
        </div>
      </div>
    </aside>
  );
};

const Toast = () => {
  const { successMessage, setSuccessMessage } = useFinance();

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, setSuccessMessage]);

  return (
    <AnimatePresence>
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-xs"
        >
          <div className="bg-emerald-500 text-white p-4 rounded-3xl shadow-2xl flex items-center gap-3 border border-emerald-400">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <CheckCircle size={18} />
            </div>
            <p className="text-xs font-black uppercase tracking-wider">{successMessage}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const AppContent = () => {
  const { user, successMessage } = useFinance();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tabKeys, setTabKeys] = useState<Record<string, number>>({
    dashboard: 0,
    transactions: 0,
    charts: 0,
    settings: 0
  });
  const [isAdding, setIsAdding] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  if (!user) {
    return <LoginPage />;
  }

  const handleTabChange = (tab: string) => {
    if (activeTab === tab) {
      setTabKeys(prev => ({ ...prev, [tab]: prev[tab] + 1 }));
    } else {
      setActiveTab(tab);
    }
  };

  const handleEdit = (t: Transaction) => {
    setEditingTransaction(t);
    setIsAdding(true);
  };

  const handleCloseForm = () => {
    setIsAdding(false);
    setEditingTransaction(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} setIsAdding={setIsAdding} />

      <main className="flex-1 relative overflow-x-hidden">
        <div className="max-w-md mx-auto lg:max-w-4xl lg:px-8 lg:py-12 min-h-screen">
          <div className="px-4 lg:px-0">
            {activeTab === 'dashboard' && <div key={tabKeys.dashboard}><Dashboard onViewAll={() => handleTabChange('transactions')} /></div>}
            {activeTab === 'transactions' && <div key={tabKeys.transactions}><HistoryTab onEdit={handleEdit} /></div>}
            {activeTab === 'charts' && <div key={tabKeys.charts}><ChartsTab /></div>}
            {activeTab === 'settings' && <div key={tabKeys.settings}><SettingsTab /></div>}
          </div>
        </div>

        {/* Bottom Navigation (Mobile Only) */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 backdrop-blur-xl border-t border-slate-100 px-8 py-4 flex items-center justify-between z-40">
          <button 
            onClick={() => handleTabChange('dashboard')}
            className={cn("flex flex-col items-center gap-1", activeTab === 'dashboard' ? "text-black" : "text-slate-400")}
          >
            <LayoutDashboard size={24} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Início</span>
          </button>
          
          <button 
            onClick={() => handleTabChange('transactions')}
            className={cn("flex flex-col items-center gap-1", activeTab === 'transactions' ? "text-black" : "text-slate-400")}
          >
            <History size={24} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Histórico</span>
          </button>

          <div className="relative -top-8">
            <button 
              onClick={() => setIsAdding(true)}
              className="w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-xl shadow-slate-200 active:scale-90 transition-transform"
            >
              <Plus size={32} />
            </button>
          </div>

          <button 
            onClick={() => handleTabChange('charts')}
            className={cn("flex flex-col items-center gap-1", activeTab === 'charts' ? "text-black" : "text-slate-400")}
          >
            <PieChart size={24} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Gráficos</span>
          </button>

          <button 
            onClick={() => handleTabChange('settings')}
            className={cn("flex flex-col items-center gap-1", activeTab === 'settings' ? "text-black" : "text-slate-400")}
          >
            <Settings size={24} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Ajustes</span>
          </button>
        </nav>
      </main>

      <AnimatePresence>
        {isAdding && (
          <TransactionForm 
            onClose={handleCloseForm} 
            initialData={editingTransaction || undefined} 
          />
        )}
      </AnimatePresence>

      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <AppContent />
    </FinanceProvider>
  );
}
