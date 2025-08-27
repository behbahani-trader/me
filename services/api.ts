import { Transaction, Category, RecurringTransaction } from '../types';

const API_BASE = '/api';

const jsonRequest = (method: string, path: string, body?: unknown) => {
  return fetch(`${API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
};

const handle = async <T>(res: Response): Promise<T> => {
  if (!res.ok) throw new Error('API error');
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
};

export const getInitialData = async (): Promise<{
  transactions: Transaction[];
  expenseCategories: Category[];
  incomeCategories: Category[];
  recurringTransactions: RecurringTransaction[];
}> => {
  const res = await fetch(`${API_BASE}/data`);
  return handle(res);
};

export const addTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
  const res = await jsonRequest('POST', '/transactions', transaction);
  return handle(res);
};

export const updateTransaction = async (updatedTransaction: Transaction): Promise<Transaction> => {
  const res = await jsonRequest('PUT', `/transactions/${updatedTransaction.id}`, updatedTransaction);
  return handle(res);
};

export const deleteTransaction = async (id: string): Promise<string> => {
  const res = await jsonRequest('DELETE', `/transactions/${id}`);
  await handle(res);
  return id;
};

const addCategory = async (label: string, path: string): Promise<Category> => {
  const res = await jsonRequest('POST', path, { label });
  return handle(res);
};

const updateCategory = async (value: string, label: string, path: string): Promise<Category> => {
  const res = await jsonRequest('PUT', `${path}/${value}`, { label });
  return handle(res);
};

const deleteCategory = async (value: string, path: string, field: 'expenseCategory' | 'incomeCategory'): Promise<string> => {
  const res = await jsonRequest('DELETE', `${path}/${value}`);
  await handle(res);
  return value;
};

export const addExpenseCategory = (label: string) => addCategory(label, '/expense-categories');
export const updateExpenseCategory = (value: string, label: string) => updateCategory(value, label, '/expense-categories');
export const deleteExpenseCategory = (value: string) => deleteCategory(value, '/expense-categories', 'expenseCategory');

export const addIncomeCategory = (label: string) => addCategory(label, '/income-categories');
export const updateIncomeCategory = (value: string, label: string) => updateCategory(value, label, '/income-categories');
export const deleteIncomeCategory = (value: string) => deleteCategory(value, '/income-categories', 'incomeCategory');

export const addRecurringTransaction = async (recurring: Omit<RecurringTransaction, 'id' | 'lastAddedDate'>): Promise<RecurringTransaction> => {
  const res = await jsonRequest('POST', '/recurring', recurring);
  return handle(res);
};

export const updateRecurringTransaction = async (updated: RecurringTransaction): Promise<RecurringTransaction> => {
  const res = await jsonRequest('PUT', `/recurring/${updated.id}`, updated);
  return handle(res);
};

export const deleteRecurringTransaction = async (id: string): Promise<string> => {
  const res = await jsonRequest('DELETE', `/recurring/${id}`);
  await handle(res);
  return id;
};

export const saveProcessedRecurringData = async (
  allTransactions: Transaction[],
  updatedRecurring: RecurringTransaction[]
): Promise<void> => {
  const res = await jsonRequest('POST', '/recurring/process', {
    transactions: allTransactions,
    recurringTransactions: updatedRecurring
  });
  await handle(res);
};

export const replaceAllData = async (data: {
  transactions: Transaction[];
  expenseCategories: Category[];
  incomeCategories: Category[];
}): Promise<void> => {
  const res = await jsonRequest('POST', '/replace-data', data);
  await handle(res);
};

export const getApiKey = async (): Promise<string | null> => {
  const res = await fetch(`${API_BASE}/apikey`);
  const data = await handle<{ apiKey: string | null }>(res);
  return data.apiKey;
};

export const saveApiKey = async (key: string): Promise<void> => {
  const res = await jsonRequest('POST', '/apikey', { key });
  await handle(res);
};

export const removeApiKey = async (): Promise<void> => {
  const res = await jsonRequest('DELETE', '/apikey');
  await handle(res);
};

