import { Transaction, Category, RecurringTransaction, Frequency, TransactionType } from '../types';

const FAKE_LATENCY = 300; // ms

const TRANSACTIONS_KEY = 'transactions';
const EXPENSE_CATEGORIES_KEY = 'expenseCategories';
const INCOME_CATEGORIES_KEY = 'incomeCategories';
const RECURRING_TRANSACTIONS_KEY = 'recurringTransactions';
const API_KEY = 'gemini_api_key';

const DEFAULT_EXPENSE_CATEGORIES: Category[] = [
  { value: 'food', label: 'غذا' },
  { value: 'transport', label: 'حمل و نقل' },
  { value: 'entertainment', label: 'سرگرمی' },
  { value: 'bills', label: 'قبوض' },
  { value: 'other', label: 'متفرقه' },
];

const DEFAULT_INCOME_CATEGORIES: Category[] = [
  { value: 'salary', label: 'حقوق' },
  { value: 'freelance', label: 'فریلنس' },
  { value: 'gift', label: 'هدیه' },
  { value: 'other', label: 'متفرقه' },
];

// Helper to simulate API call
const simulateRequest = <T>(data: T): Promise<T> => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(data);
        }, FAKE_LATENCY);
    });
};

const getFromStorage = <T>(key: string, defaultValue: T): T => {
    try {
        const localData = localStorage.getItem(key);
        return localData ? JSON.parse(localData) : defaultValue;
    } catch (error) {
        console.error(`Failed to parse ${key} from localStorage`, error);
        return defaultValue;
    }
};

const saveToStorage = <T>(key: string, data: T): void => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error(`Failed to save ${key} to localStorage`, error);
    }
};

// --- API Key Management (Synchronous) ---
export const getApiKey = (): string | null => {
    return localStorage.getItem(API_KEY);
};

export const saveApiKey = (key: string): void => {
    localStorage.setItem(API_KEY, key);
};

export const removeApiKey = (): void => {
    localStorage.removeItem(API_KEY);
};


// --- API Functions ---

export const getInitialData = async (): Promise<{
    transactions: Transaction[],
    expenseCategories: Category[],
    incomeCategories: Category[],
    recurringTransactions: RecurringTransaction[]
}> => {
    const transactions = getFromStorage<Transaction[]>(TRANSACTIONS_KEY, []);
    const expenseCategories = getFromStorage<Category[]>(EXPENSE_CATEGORIES_KEY, DEFAULT_EXPENSE_CATEGORIES);
    const incomeCategories = getFromStorage<Category[]>(INCOME_CATEGORIES_KEY, DEFAULT_INCOME_CATEGORIES);
    const recurringTransactions = getFromStorage<RecurringTransaction[]>(RECURRING_TRANSACTIONS_KEY, []);

    if (localStorage.getItem(EXPENSE_CATEGORIES_KEY) === null) {
        saveToStorage(EXPENSE_CATEGORIES_KEY, expenseCategories);
    }
    if (localStorage.getItem(INCOME_CATEGORIES_KEY) === null) {
        saveToStorage(INCOME_CATEGORIES_KEY, incomeCategories);
    }

    return simulateRequest({ transactions, expenseCategories, incomeCategories, recurringTransactions });
};

export const addTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
    const transactions = getFromStorage<Transaction[]>(TRANSACTIONS_KEY, []);
    const newTransaction: Transaction = {
        ...transaction,
        id: crypto.randomUUID(),
    };
    const updatedTransactions = [newTransaction, ...transactions];
    saveToStorage(TRANSACTIONS_KEY, updatedTransactions);
    return simulateRequest(newTransaction);
};

export const updateTransaction = async (updatedTransaction: Transaction): Promise<Transaction> => {
    let transactions = getFromStorage<Transaction[]>(TRANSACTIONS_KEY, []);
    transactions = transactions.map(t => t.id === updatedTransaction.id ? updatedTransaction : t);
    saveToStorage(TRANSACTIONS_KEY, transactions);
    return simulateRequest(updatedTransaction);
};

export const deleteTransaction = async (id: string): Promise<string> => {
    let transactions = getFromStorage<Transaction[]>(TRANSACTIONS_KEY, []);
    transactions = transactions.filter(t => t.id !== id);
    saveToStorage(TRANSACTIONS_KEY, transactions);
    return simulateRequest(id);
};

// ... Category functions (unchanged)
const addCategory = async (label: string, key: string): Promise<Category> => {
    const categories = getFromStorage<Category[]>(key, []);
    const newCategory: Category = {
        label,
        value: label.toLowerCase().replace(/\s+/g, '-') + '-' + crypto.randomUUID().slice(0, 4),
    };
    const updatedCategories = [...categories, newCategory];
    saveToStorage(key, updatedCategories);
    return simulateRequest(newCategory);
};

const updateCategory = async (value: string, newLabel: string, key: string): Promise<Category> => {
    let categories = getFromStorage<Category[]>(key, []);
    let updatedCategory: Category | undefined;
    categories = categories.map(c => {
        if (c.value === value) {
            updatedCategory = { ...c, label: newLabel };
            return updatedCategory;
        }
        return c;
    });
    saveToStorage(key, categories);
    if (!updatedCategory) throw new Error("Category not found");
    return simulateRequest(updatedCategory);
};

const deleteCategory = async (value: string, key: string, transactionKey: 'expenseCategory' | 'incomeCategory'): Promise<string> => {
    let categories = getFromStorage<Category[]>(key, []);
    categories = categories.filter(c => c.value !== value);
    saveToStorage(key, categories);

    let transactions = getFromStorage<Transaction[]>(TRANSACTIONS_KEY, []);
    transactions = transactions.map(t => {
        if (t[transactionKey] === value) {
            const { [transactionKey]: _, ...rest } = t;
            return rest as Transaction;
        }
        return t;
    });
    saveToStorage(TRANSACTIONS_KEY, transactions);

    return simulateRequest(value);
};


export const addExpenseCategory = (label: string) => addCategory(label, EXPENSE_CATEGORIES_KEY);
export const updateExpenseCategory = (value: string, newLabel: string) => updateCategory(value, newLabel, EXPENSE_CATEGORIES_KEY);
export const deleteExpenseCategory = (value: string) => deleteCategory(value, EXPENSE_CATEGORIES_KEY, 'expenseCategory');

export const addIncomeCategory = (label: string) => addCategory(label, INCOME_CATEGORIES_KEY);
export const updateIncomeCategory = (value: string, newLabel: string) => updateCategory(value, newLabel, INCOME_CATEGORIES_KEY);
export const deleteIncomeCategory = (value: string) => deleteCategory(value, INCOME_CATEGORIES_KEY, 'incomeCategory');

// --- Recurring Transactions API ---

export const addRecurringTransaction = async (recurring: Omit<RecurringTransaction, 'id' | 'lastAddedDate'>): Promise<RecurringTransaction> => {
    const recurringTransactions = getFromStorage<RecurringTransaction[]>(RECURRING_TRANSACTIONS_KEY, []);
    const newRecurring: RecurringTransaction = {
        ...recurring,
        id: crypto.randomUUID(),
        lastAddedDate: null,
    };
    const updated = [...recurringTransactions, newRecurring];
    saveToStorage(RECURRING_TRANSACTIONS_KEY, updated);
    return simulateRequest(newRecurring);
};

export const updateRecurringTransaction = async (updated: RecurringTransaction): Promise<RecurringTransaction> => {
    let recurring = getFromStorage<RecurringTransaction[]>(RECURRING_TRANSACTIONS_KEY, []);
    recurring = recurring.map(r => r.id === updated.id ? updated : r);
    saveToStorage(RECURRING_TRANSACTIONS_KEY, recurring);
    return simulateRequest(updated);
};

export const deleteRecurringTransaction = async (id: string): Promise<string> => {
    let recurring = getFromStorage<RecurringTransaction[]>(RECURRING_TRANSACTIONS_KEY, []);
    recurring = recurring.filter(r => r.id !== id);
    saveToStorage(RECURRING_TRANSACTIONS_KEY, recurring);
    return simulateRequest(id);
};

export const saveProcessedRecurringData = async (
    allTransactions: Transaction[],
    updatedRecurring: RecurringTransaction[]
): Promise<void> => {
    saveToStorage(TRANSACTIONS_KEY, allTransactions);
    saveToStorage(RECURRING_TRANSACTIONS_KEY, updatedRecurring);
    return simulateRequest(undefined);
};

export const replaceAllData = async (data: {
    transactions: Transaction[];
    expenseCategories: Category[];
    incomeCategories: Category[];
}): Promise<void> => {
    saveToStorage(TRANSACTIONS_KEY, data.transactions);
    saveToStorage(EXPENSE_CATEGORIES_KEY, data.expenseCategories);
    saveToStorage(INCOME_CATEGORIES_KEY, data.incomeCategories);
    // Note: This does not clear recurring transactions by design.
    return simulateRequest(undefined);
};