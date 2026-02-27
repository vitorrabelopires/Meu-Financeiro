import React, { useState, useMemo } from 'react';
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
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
import { formatCurrency, TransactionType, cn, DEFAULT_CATEGORIES, Transaction } from './types';
import { UserManager } from './components/UserManager';

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

const Dashboard = () => {
  const { totalBalance, monthlyIncome, monthlyExpense, currentMonthName, transactions, categories, creditCards, tags } = useFinance();

  const now = new Date();
  const monthlyTransactions = transactions.filter(t => {
    const d = parseISO(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

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

  const pieData = categories
    .filter(c => c.type === 'expense')
    .map(c => {
      const total = transactions
        .filter(t => t.category === c.name && t.type === 'expense')
        .reduce((acc, curr) => acc + curr.amount, 0);
      return { name: c.name, value: total, color: c.color };
    })
    .filter(d => d.value > 0);

  return (
    <div className="space-y-6 pb-24 lg:pb-0">
      {/* Header Summary */}
      <div className="bg-black text-white p-6 rounded-b-[2.5rem] shadow-2xl -mx-4 pt-12 lg:rounded-[3rem] lg:mx-0 lg:pt-10 lg:p-12 lg:shadow-black/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm font-medium">Saldo Total</p>
            <h2 className={cn(
              "text-3xl lg:text-5xl font-black mt-1 transition-colors duration-500 tracking-tight",
              totalBalance > 0 ? "text-emerald-400" : totalBalance < 0 ? "text-rose-400" : "text-white"
            )}>
              {formatCurrency(totalBalance)}
            </h2>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-[10px] lg:text-xs font-bold uppercase tracking-widest">{currentMonthName}</p>
            <div className="mt-2 hidden lg:flex gap-2 justify-end">
               <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-tighter">Premium</div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 lg:mt-12">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl lg:rounded-3xl p-4 lg:p-6 border border-white/5">
            <div className="flex items-center gap-2 text-slate-300 text-xs mb-1 lg:mb-2">
              <TrendingUp size={14} className="text-emerald-400" />
              <span>Receitas</span>
            </div>
            <p className="font-bold text-lg lg:text-2xl">{formatCurrency(monthlyIncome)}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl lg:rounded-3xl p-4 lg:p-6 border border-white/5">
            <div className="flex items-center gap-2 text-slate-300 text-xs mb-1 lg:mb-2">
              <TrendingDown size={14} className="text-rose-400" />
              <span>Despesas</span>
            </div>
            <p className="font-bold text-lg lg:text-2xl">{formatCurrency(monthlyExpense)}</p>
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
            <ResponsiveContainer width="100%" height="100%">
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
                <ResponsiveContainer width="100%" height="100%">
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
            onClick={() => {}} // This should ideally switch to History tab
            className="text-black text-xs font-bold flex items-center gap-1 hover:underline"
          >
            Ver tudo <ChevronRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {transactions.length === 0 ? (
            <div className="lg:col-span-2 bg-white p-12 rounded-[2.5rem] text-center card-shadow border border-slate-50">
              <p className="text-slate-400 text-sm font-medium">Nenhuma transação ainda.</p>
            </div>
          ) : (
            transactions.slice(0, 6).map((t) => {
              const categoryObj = categories.find(c => c.name === t.category);
              const card = creditCards.find(c => c.id === t.creditCardId);
              const transactionTags = tags.filter(tag => t.tags?.includes(tag.id));
              
              return (
                <div key={t.id} className="bg-white p-5 rounded-[2rem] flex items-center justify-between card-shadow border border-slate-50 group hover:translate-x-1 transition-all duration-300 hover:bg-slate-50">
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
                </div>
              );
            })
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
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.tags || []);
  const [creditCardId, setCreditCardId] = useState<string>(initialData?.creditCardId || '');
  const [date, setDate] = useState(initialData ? format(parseISO(initialData.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;

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
      amount: parseFloat(amount),
      description,
      type,
      category,
      accountId: initialData?.accountId || accounts[0]?.id || '1',
      date: transactionDate.toISOString(),
      tags: selectedTags,
      creditCardId: creditCardId || undefined
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
          "bg-white/95 backdrop-blur-xl w-full max-w-md rounded-[3rem] p-8 space-y-6 shadow-2xl border max-h-[90vh] overflow-y-auto transition-all duration-500",
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
          <div className="text-center py-4">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Valor</label>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl font-bold text-slate-400">R$</span>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className="text-5xl font-bold text-slate-800 bg-transparent border-none focus:ring-0 w-48 text-center outline-none"
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Descrição</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Aluguel, Supermercado..."
                className="w-full bg-slate-100/50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-black outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Categoria</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-100/50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-black outline-none appearance-none"
                >
                  {categories.filter(c => c.type === type).map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Data Vencimento</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-100/50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-black outline-none"
                />
              </div>
            </div>

            {type === 'expense' && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Cartão de Crédito (Opcional)</label>
                <select
                  value={creditCardId}
                  onChange={(e) => setCreditCardId(e.target.value)}
                  className="w-full bg-slate-100/50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-black outline-none appearance-none"
                >
                  <option value="">Nenhum cartão</option>
                  {creditCards.map(card => (
                    <option key={card.id} value={card.id}>{card.name} - {card.bank}</option>
                  ))}
                </select>
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

const CategoryManager = () => {
  const { categories, addCategory, updateCategory, deleteCategory } = useFinance();
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: '', icon: 'Wallet', color: '#000000', type: 'expense' as TransactionType });

  const availableIcons = [
    'Wallet', 'Banknote', 'Utensils', 'Car', 'Gamepad2', 'HeartPulse', 'DollarSign', 
    'TrendingUp', 'ShoppingBag', 'Coffee', 'Home', 'Briefcase', 'Gift', 'Plane', 
    'Music', 'Film', 'Smartphone', 'Laptop', 'Zap', 'Droplets', 'Shield', 'Star', 'Heart'
  ];
  const availableColors = ['#000000', '#ef4444', '#f59e0b', '#10b981', '#0ea5e9', '#8b5cf6', '#ec4899', '#64748b', '#1e293b', '#475569'];

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
                <button onClick={() => startEdit(cat)} className="p-2 text-slate-300 hover:text-black transition-colors">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => { if(confirm('Excluir esta categoria?')) deleteCategory(cat.id); }} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

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
              className="bg-white/90 backdrop-blur-xl w-full max-w-md rounded-[3rem] p-8 space-y-6 shadow-2xl border border-white/20"
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
                    className="w-full bg-slate-100/50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-black outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Cor</label>
                  <div className="flex flex-wrap gap-3">
                    {availableColors.map(color => (
                      <button
                        key={color}
                        onClick={() => setFormData({ ...formData, color })}
                        className={cn(
                          "w-8 h-8 rounded-full border-2 transition-all active:scale-75",
                          formData.color === color ? "border-black scale-110 shadow-lg" : "border-transparent"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Ícone</label>
                    <span className="text-[9px] text-slate-300 font-medium italic">Selecione ou digite um emoji</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1">
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
                        className="flex-1 bg-transparent border-none text-sm focus:ring-0 outline-none p-0"
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
  const { creditCards, addCreditCard, updateCreditCard, deleteCreditCard } = useFinance();
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: '', brand: 'Visa', bank: '', limit: 0, closingDay: 1, dueDay: 10, color: '#000000' });

  const availableColors = ['#000000', '#ef4444', '#f59e0b', '#10b981', '#0ea5e9', '#8b5cf6', '#ec4899', '#64748b'];
  const brands = ['Visa', 'Mastercard', 'Elo', 'American Express', 'Hipercard'];

  const handleSave = () => {
    if (!formData.name || !formData.bank) return;
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
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Vencimento</p>
                      <p className="text-sm font-bold text-slate-700">Dia {card.dueDay}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => { setIsEditing(card.id); setFormData(card); }} 
                    className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-black hover:bg-slate-100 transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => { if(confirm('Excluir este cartão?')) deleteCreditCard(card.id); }} 
                    className="p-2 bg-rose-50 text-rose-400 rounded-xl hover:text-rose-600 hover:bg-rose-100 transition-colors"
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
              className="bg-white/90 backdrop-blur-xl w-full max-w-md rounded-[3rem] p-8 space-y-6 shadow-2xl border border-white/20"
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
                    className="w-full bg-slate-100/50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-black outline-none transition-all" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Banco</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Nubank" 
                      value={formData.bank} 
                      onChange={e => setFormData({ ...formData, bank: e.target.value })} 
                      className="w-full bg-slate-100/50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-black outline-none transition-all" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Bandeira</label>
                    <select 
                      value={formData.brand} 
                      onChange={e => setFormData({ ...formData, brand: e.target.value })} 
                      className="w-full bg-slate-100/50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-black outline-none appearance-none transition-all"
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
                    className="w-full bg-slate-100/50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all" 
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
                      className="w-full bg-slate-100/50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-black outline-none transition-all" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Dia Vencimento</label>
                    <input 
                      type="number" 
                      min="1" max="31"
                      value={formData.dueDay} 
                      onChange={e => setFormData({ ...formData, dueDay: parseInt(e.target.value) || 1 })} 
                      className="w-full bg-slate-100/50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-black outline-none transition-all" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Cor do Cartão</label>
                  <div className="flex flex-wrap gap-3">
                    {availableColors.map(color => (
                      <button 
                        key={color} 
                        onClick={() => setFormData({ ...formData, color })} 
                        className={cn(
                          "w-8 h-8 rounded-full border-2 transition-all active:scale-75", 
                          formData.color === color ? "border-black scale-110 shadow-lg" : "border-transparent"
                        )} 
                        style={{ backgroundColor: color }} 
                      />
                    ))}
                  </div>
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

const TagManager = () => {
  const { tags, addTag, updateTag, deleteTag } = useFinance();
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: '', color: '#000000' });

  const availableColors = ['#000000', '#ef4444', '#f59e0b', '#10b981', '#0ea5e9', '#8b5cf6', '#ec4899', '#64748b'];

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
                >
                  <Edit2 size={12} />
                </button>
                <button 
                  onClick={() => { if(confirm('Excluir esta tag?')) deleteTag(tag.id); }} 
                  className="hover:text-black/50 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

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
              className="bg-white/90 backdrop-blur-xl w-full max-w-md rounded-[3rem] p-8 space-y-6 shadow-2xl border border-white/20"
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
                    className="w-full bg-slate-100/50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-black outline-none transition-all" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Cor da Tag</label>
                  <div className="flex flex-wrap gap-3">
                    {availableColors.map(color => (
                      <button 
                        key={color} 
                        onClick={() => setFormData({ ...formData, color })} 
                        className={cn(
                          "w-8 h-8 rounded-full border-2 transition-all active:scale-75", 
                          formData.color === color ? "border-black scale-110 shadow-lg" : "border-transparent"
                        )} 
                        style={{ backgroundColor: color }} 
                      />
                    ))}
                  </div>
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
  const { transactions, importTransactions, notificationSettings, updateNotificationSettings } = useFinance();

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
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        importTransactions(data);
        alert('Transações importadas com sucesso!');
      } catch (err) {
        alert('Erro ao importar arquivo.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-slate-800 font-semibold text-sm px-2">Backup e Dados</h3>
        <div className="grid grid-cols-2 gap-4">
          <button onClick={exportData} className="flex flex-col items-center justify-center p-6 bg-white rounded-3xl card-shadow gap-2 hover:bg-slate-50 transition-colors">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-black">
              <Download size={24} />
            </div>
            <span className="text-xs font-bold text-slate-600">Exportar</span>
          </button>
          <label className="flex flex-col items-center justify-center p-6 bg-white rounded-3xl card-shadow gap-2 hover:bg-slate-50 transition-colors cursor-pointer">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-black">
              <Upload size={24} />
            </div>
            <span className="text-xs font-bold text-slate-600">Importar</span>
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
                className="bg-slate-100 border-none rounded-lg px-3 py-1 text-xs font-bold outline-none focus:ring-1 focus:ring-black"
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
              className="w-full bg-slate-50 border-none rounded-xl p-3 text-xs focus:ring-2 focus:ring-black outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Fim</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-xl p-3 text-xs focus:ring-2 focus:ring-black outline-none"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Categoria</label>
          <select 
            value={selectedCategory} 
            onChange={e => setSelectedCategory(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl p-3 text-xs focus:ring-2 focus:ring-black outline-none appearance-none"
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
            className="w-full bg-slate-50 border-none rounded-xl p-3 text-xs focus:ring-2 focus:ring-black outline-none appearance-none"
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

  // Data for Tags
  const tagData = tags.map(tag => {
    const amount = transactions
      .filter(t => t.type === 'expense' && t.tags?.includes(tag.id))
      .reduce((acc, curr) => acc + curr.amount, 0);
    return { name: tag.name, amount, color: tag.color };
  }).filter(d => d.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  // Data for Categories (Sandwich/Donut Chart)
  const categoryData = categories
    .filter(c => c.type === 'expense')
    .map(c => {
      const amount = transactions
        .filter(t => t.type === 'expense' && t.category === c.name)
        .reduce((acc, curr) => acc + curr.amount, 0);
      return { name: c.name, value: amount, color: c.color };
    })
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);

  // Data for Credit Cards
  const cardData = creditCards.map(card => {
    const amount = transactions
      .filter(t => t.type === 'expense' && t.creditCardId === card.id)
      .reduce((acc, curr) => acc + curr.amount, 0);
    return { name: card.name, amount, color: card.color };
  }).filter(d => d.amount > 0)
    .sort((a, b) => b.amount - a.amount);

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
                <ResponsiveContainer width="100%" height="100%">
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
                <ResponsiveContainer width="100%" height="100%">
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
              <ResponsiveContainer width="100%" height="100%">
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

const HistoryTab = ({ onEdit }: { onEdit: (t: Transaction) => void }) => {
  const { transactions, categories, tags, creditCards, deleteTransaction } = useFinance();

  const sortedTransactions = [...transactions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="pt-12 pb-24 lg:pb-0 space-y-8">
      <div className="mb-8 px-2">
        <h2 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight">Histórico</h2>
        <p className="text-slate-400 text-sm mt-1 font-medium">Todas as suas movimentações</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sortedTransactions.length === 0 ? (
          <div className="lg:col-span-2 bg-white p-12 rounded-[3rem] text-center card-shadow border border-slate-50">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200 mb-4">
              <History size={32} />
            </div>
            <p className="text-slate-400 text-sm font-medium">Nenhuma transação encontrada.</p>
          </div>
        ) : (
          sortedTransactions.map((t) => {
            const categoryObj = categories.find(c => c.name === t.category);
            const card = creditCards.find(c => c.id === t.creditCardId);
            const transactionTags = tags.filter(tag => t.tags?.includes(tag.id));
            
            return (
              <div key={t.id} className="bg-white p-5 rounded-[2rem] flex items-center justify-between card-shadow border border-slate-50 group transition-all hover:bg-slate-50">
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
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => onEdit(t)}
                      className="p-2 text-slate-300 hover:text-black transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => { if(confirm('Excluir esta transação?')) deleteTransaction(t.id); }}
                      className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
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
        { id: 'cards', label: 'Cartões de Crédito', description: 'Cadastre e edite seus cartões', icon: CreditCardIcon, color: 'bg-slate-100 text-slate-600' },
        { id: 'reports', label: 'Relatórios', description: 'Exporte seus dados em PDF ou CSV', icon: History, color: 'bg-slate-100 text-slate-600' },
      ]
    },
    {
      title: 'Conta e Dados',
      items: [
        { id: 'users', label: 'Usuários', description: 'Gerencie os usuários do sistema', icon: User, color: 'bg-slate-100 text-slate-600' },
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
          {activeSubTab === 'users' && <UserManager />}
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
                    onClick={() => { if(confirm('Tem certeza que deseja apagar todos os dados?')) { localStorage.clear(); window.location.reload(); } }} 
                    className="w-full py-4 rounded-2xl bg-rose-50 text-rose-500 font-bold text-sm active:scale-95 transition-transform"
                  >
                    Limpar todos os dados
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

      <div className="p-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-100 rounded-full mb-3">
          <Settings size={20} className="text-slate-400" />
        </div>
        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Meu Financeiro v1.0</p>
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
        <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white shadow-xl shadow-black/10">
          <Wallet size={28} />
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

const AppContent = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAdding, setIsAdding] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

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
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} setIsAdding={setIsAdding} />

      <main className="flex-1 relative overflow-x-hidden">
        <div className="max-w-md mx-auto lg:max-w-4xl lg:px-8 lg:py-12 min-h-screen">
          <div className="px-4 lg:px-0">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'transactions' && <HistoryTab onEdit={handleEdit} />}
            {activeTab === 'charts' && <ChartsTab />}
            {activeTab === 'settings' && <SettingsTab />}
          </div>
        </div>

        {/* Bottom Navigation (Mobile Only) */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 backdrop-blur-xl border-t border-slate-100 px-8 py-4 flex items-center justify-between z-40">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={cn("flex flex-col items-center gap-1", activeTab === 'dashboard' ? "text-black" : "text-slate-400")}
          >
            <LayoutDashboard size={24} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Início</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('transactions')}
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
            onClick={() => setActiveTab('charts')}
            className={cn("flex flex-col items-center gap-1", activeTab === 'charts' ? "text-black" : "text-slate-400")}
          >
            <PieChart size={24} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Gráficos</span>
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
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
