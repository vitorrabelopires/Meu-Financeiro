import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export type TransactionType = 'expense' | 'income';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  type: TransactionType;
  accountId: string;
  tags?: string[];
  creditCardId?: string;
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  color: string;
  icon: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
}

export interface CreditCard {
  id: string;
  name: string;
  brand: string;
  bank: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  color: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface NotificationSettings {
  cardDueReminders: boolean;
  transactionReminders: boolean;
  reminderTime: string;
  daysBeforeDue: number;
}

export const DEFAULT_ACCOUNTS: Account[] = [
  { id: '1', name: 'Carteira', balance: 0, color: '#000000', icon: 'Wallet' },
  { id: '2', name: 'Conta Corrente', balance: 0, color: '#333333', icon: 'Banknote' },
];

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'c1', name: 'Alimentação', icon: 'Utensils', color: '#f59e0b', type: 'expense' },
  { id: 'c2', name: 'Transporte', icon: 'Car', color: '#3b82f6', type: 'expense' },
  { id: 'c3', name: 'Lazer', icon: 'Gamepad2', color: '#8b5cf6', type: 'expense' },
  { id: 'c4', name: 'Saúde', icon: 'HeartPulse', color: '#ef4444', type: 'expense' },
  { id: 'c5', name: 'Salário', icon: 'DollarSign', color: '#10b981', type: 'income' },
  { id: 'c6', name: 'Investimentos', icon: 'TrendingUp', color: '#000000', type: 'income' },
];
