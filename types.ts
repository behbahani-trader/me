export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  date: string;
  expenseCategory?: string;
  incomeCategory?: string;
}

export interface Category {
  value: string;
  label: string;
}

export interface SortOptions {
  key: 'date' | 'amount';
  direction: 'asc' | 'desc';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
}

export enum Frequency {
    MONTHLY = 'monthly',
}

export interface RecurringTransaction {
    id: string;
    description: string;
    amount: number;
    type: TransactionType;
    frequency: Frequency;
    startDate: string;
    lastAddedDate: string | null;
    expenseCategory?: string;
    incomeCategory?: string;
}

export interface ThemeSettings {
  themeMode: 'light' | 'dark';
  fontSize: 'sm' | 'base' | 'lg';
  backgroundStyle: 'solid' | 'gradient';
  glassmorphism: boolean;
}

export interface AIVoiceSettings {
  voiceURI: string | null;
  rate: number;
}
