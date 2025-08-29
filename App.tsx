import React, { useState, useEffect, useMemo, useCallback, createContext, useContext } from 'react';
import { Transaction, TransactionType, Category, SortOptions, RecurringTransaction, Frequency, ThemeSettings, AIVoiceSettings } from './types';
import { Summary } from './components/Summary';
import { TransactionForm } from './components/TransactionForm';
import { TransactionList } from './components/TransactionList';
import { Analysis } from './components/Analysis';
import { MonthlyChart } from './components/MonthlyChart';
import { EditTransactionModal } from './components/EditTransactionModal';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { TransactionFilters } from './components/TransactionFilters';
import { Navigation } from './components/Navigation';
import { SettingsPage } from './components/SettingsPage';
import { ExpensePieChart } from './components/ExpensePieChart';
import { CategoryBreakdown } from './components/CategoryBreakdown';
import { RecurringManagerModal } from './components/RecurringManagerModal';
import { IncomeExpenseChart } from './components/IncomeExpenseChart';
import { LoginPage } from './components/LoginPage';
import * as api from './services/api';

// --- Theme Context ---
interface ThemeContextType {
    settings: ThemeSettings;
    updateSettings: (newSettings: Partial<ThemeSettings>) => void;
    cardClasses: string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within a ThemeProvider');
    return context;
};

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<ThemeSettings>(() => {
        try {
            const savedSettings = localStorage.getItem('themeSettings');
            if (savedSettings) {
                return JSON.parse(savedSettings);
            }
        } catch (error) {
            console.error("Failed to parse theme settings from localStorage", error);
        }
        return {
            themeMode: 'dark',
            fontSize: 'base',
            backgroundStyle: 'solid',
            glassmorphism: false,
        };
    });

    useEffect(() => {
        const root = document.documentElement;
        const body = document.body;

        // Theme mode
        root.classList.toggle('dark', settings.themeMode === 'dark');

        // Font size
        body.className = body.className.replace(/text-(sm|base|lg)/g, '').trim();
        body.classList.add(settings.fontSize === 'base' ? 'text-base' : `text-${settings.fontSize}`);

        // Background Style
        body.classList.remove('bg-gradient-main-light', 'dark:bg-gradient-main', 'bg-gray-100', 'dark:bg-background');
        if (settings.backgroundStyle === 'gradient') {
            body.classList.add('bg-gradient-main-light', 'dark:bg-gradient-main');
        } else {
            body.classList.add('bg-gray-100', 'dark:bg-background');
        }
        
        body.classList.add('transition-colors', 'duration-300');


        // Persist settings
        localStorage.setItem('themeSettings', JSON.stringify(settings));
    }, [settings]);

    const updateSettings = (newSettings: Partial<ThemeSettings>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    const cardClasses = useMemo(() => (
        settings.glassmorphism
            ? 'bg-white/60 dark:bg-card/60 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50'
            : 'bg-white dark:bg-card shadow-lg'
    ), [settings.glassmorphism]);

    const value = { settings, updateSettings, cardClasses };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};


// --- Main Application Component ---
interface MainAppProps {
    onLogout: () => void;
}
interface Filters {
    type: 'all' | TransactionType;
    category: string;
    startDate: string;
    endDate: string;
}
type Page = 'dashboard' | 'transactions' | 'analysis' | 'settings';

const MainApp: React.FC<MainAppProps> = ({ onLogout }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
    const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
    const [incomeCategories, setIncomeCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [apiKey, setApiKey] = useState<string | null>(null);

    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [isExpenseCategoryModalOpen, setIsExpenseCategoryModalOpen] = useState(false);
    const [isIncomeCategoryModalOpen, setIsIncomeCategoryModalOpen] = useState(false);
    const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
    
    const [filters, setFilters] = useState<Filters>({
        type: 'all',
        category: 'all',
        startDate: '',
        endDate: '',
    });
    
    const [activePage, setActivePage] = useState<Page>('dashboard');
    const [sortOptions, setSortOptions] = useState<SortOptions>({ key: 'date', direction: 'desc' });
    
    const [aiVoiceSettings, setAiVoiceSettings] = useState<AIVoiceSettings>(() => {
        try {
            const saved = localStorage.getItem('aiVoiceSettings');
            return saved ? JSON.parse(saved) : { voiceURI: null, rate: 1 };
        } catch {
            return { voiceURI: null, rate: 1 };
        }
    });

    useEffect(() => {
        localStorage.setItem('aiVoiceSettings', JSON.stringify(aiVoiceSettings));
    }, [aiVoiceSettings]);

    const updateAiVoiceSettings = (newSettings: Partial<AIVoiceSettings>) => {
        setAiVoiceSettings(prev => ({ ...prev, ...newSettings }));
    };


    const processRecurringTransactions = useCallback(async (
        currentTransactions: Transaction[],
        currentRecurring: RecurringTransaction[]
    ): Promise<{ finalTransactions: Transaction[], finalRecurring: RecurringTransaction[], newTransactionsCount: number }> => {
        
        const newTransactions: Transaction[] = [];
        const updatedRecurring: RecurringTransaction[] = JSON.parse(JSON.stringify(currentRecurring));

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const recurring of updatedRecurring) {
            let nextDueDate: Date;
            if (recurring.lastAddedDate) {
                nextDueDate = new Date(recurring.lastAddedDate);
                if (recurring.frequency === Frequency.MONTHLY) {
                    nextDueDate.setMonth(nextDueDate.getMonth() + 1);
                }
            } else {
                nextDueDate = new Date(recurring.startDate);
            }
            
            while (nextDueDate <= today) {
                const newTxDate = nextDueDate.toISOString().split('T')[0];
                const newTx: Transaction = {
                    id: crypto.randomUUID(),
                    description: recurring.description,
                    amount: recurring.amount,
                    type: recurring.type,
                    date: newTxDate,
                    expenseCategory: recurring.expenseCategory,
                    incomeCategory: recurring.incomeCategory,
                };
                
                newTransactions.push(newTx);
                recurring.lastAddedDate = newTxDate;
                
                if (recurring.frequency === Frequency.MONTHLY) {
                    nextDueDate.setMonth(nextDueDate.getMonth() + 1);
                } else {
                    break;
                }
            }
        }
        
        if (newTransactions.length > 0) {
            const allTransactions = [...newTransactions, ...currentTransactions]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            await api.saveProcessedRecurringData(allTransactions, updatedRecurring);
            
            return {
                finalTransactions: allTransactions,
                finalRecurring: updatedRecurring,
                newTransactionsCount: newTransactions.length
            };
        }
        
        return {
            finalTransactions: currentTransactions,
            finalRecurring: currentRecurring,
            newTransactionsCount: 0
        };

    }, []);

    useEffect(() => {
        const loadData = async () => {
            try {
                const initialData = await api.getInitialData();
                setApiKey(api.getApiKey());
                
                const { finalTransactions, finalRecurring, newTransactionsCount } = await processRecurringTransactions(
                    initialData.transactions,
                    initialData.recurringTransactions
                );

                setTransactions(finalTransactions);
                setExpenseCategories(initialData.expenseCategories);
                setIncomeCategories(initialData.incomeCategories);
                setRecurringTransactions(finalRecurring);

                if (newTransactionsCount > 0) {
                    alert(`${newTransactionsCount} تراکنش تکراری به صورت خودکار اضافه شد.`);
                }
            } catch (err) {
                console.error("Failed to load data from API", err);
                setError("خطا در بارگذاری اطلاعات از سرور. لطفاً صفحه را مجدداً بارگذاری کنید.");
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [processRecurringTransactions]);

    const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
        try {
            const newTransaction = await api.addTransaction(transaction);
            setTransactions(prev => [newTransaction, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } catch (err) {
            console.error("Failed to add transaction", err);
            alert("خطا در افزودن تراکنش.");
        }
    };
    
    const updateTransaction = async (updatedTransaction: Transaction) => {
        try {
            const returnedTransaction = await api.updateTransaction(updatedTransaction);
            setTransactions(prev =>
                prev.map(t => (t.id === returnedTransaction.id ? returnedTransaction : t))
            );
            setEditingTransaction(null);
        } catch (err) {
             console.error("Failed to update transaction", err);
            alert("خطا در ویرایش تراکنش.");
        }
    };

    const deleteTransaction = async (id: string) => {
        try {
            await api.deleteTransaction(id);
            setTransactions(prev => prev.filter(t => t.id !== id));
        } catch (err) {
             console.error("Failed to delete transaction", err);
            alert("خطا در حذف تراکنش.");
        }
    };
    
    const addExpenseCategory = async (label: string) => {
        try {
            const newCategory = await api.addExpenseCategory(label);
            setExpenseCategories(prev => [...prev, newCategory]);
        } catch (err) {
            console.error("Failed to add expense category", err);
            alert("خطا در افزودن دسته‌بندی هزینه.");
        }
    };
    
    const updateExpenseCategory = async (value: string, newLabel: string) => {
        try {
            const updatedCategory = await api.updateExpenseCategory(value, newLabel);
            setExpenseCategories(prev =>
                prev.map(c => (c.value === value ? updatedCategory : c))
            );
        } catch (err) {
            console.error("Failed to update expense category", err);
            alert("خطا در ویرایش دسته‌بندی هزینه.");
        }
    };

    const deleteExpenseCategory = async (value: string) => {
        try {
            await api.deleteExpenseCategory(value);
            setExpenseCategories(prev => prev.filter(c => c.value !== value));
            setTransactions(prev => 
                prev.map(t => {
                    if (t.expenseCategory === value) {
                        const { expenseCategory, ...rest } = t;
                        return rest as Transaction;
                    }
                    return t;
                })
            );
        } catch (err) {
            console.error("Failed to delete expense category", err);
            alert("خطا در حذف دسته‌بندی هزینه.");
        }
    };
    
    const addIncomeCategory = async (label: string) => {
        try {
            const newCategory = await api.addIncomeCategory(label);
            setIncomeCategories(prev => [...prev, newCategory]);
        } catch (err) {
            console.error("Failed to add income category", err);
            alert("خطا در افزودن دسته‌بندی درآمد.");
        }
    };
    
    const updateIncomeCategory = async (value: string, newLabel: string) => {
        try {
            const updatedCategory = await api.updateIncomeCategory(value, newLabel);
            setIncomeCategories(prev =>
                prev.map(c => (c.value === value ? updatedCategory : c))
            );
        } catch (err) {
            console.error("Failed to update income category", err);
            alert("خطا در ویرایش دسته‌بندی درآمد.");
        }
    };

    const deleteIncomeCategory = async (value: string) => {
        try {
            await api.deleteIncomeCategory(value);
            setIncomeCategories(prev => prev.filter(c => c.value !== value));
            setTransactions(prev => 
                prev.map(t => {
                    if (t.incomeCategory === value) {
                        const { incomeCategory, ...rest } = t;
                        return rest as Transaction;
                    }
                    return t;
                })
            );
        } catch (err) {
            console.error("Failed to delete income category", err);
            alert("خطا در حذف دسته‌بندی درآمد.");
        }
    };

    const addRecurringTransaction = async (item: Omit<RecurringTransaction, 'id' | 'lastAddedDate'>) => {
        try {
            const newItem = await api.addRecurringTransaction(item);
            setRecurringTransactions(prev => [...prev, newItem]);
        } catch (err) {
            console.error("Failed to add recurring transaction", err);
            alert("خطا در افزودن تراکنش تکراری.");
        }
    };

    const updateRecurringTransaction = async (item: RecurringTransaction) => {
        try {
            const updatedItem = await api.updateRecurringTransaction(item);
            setRecurringTransactions(prev => prev.map(r => r.id === item.id ? updatedItem : r));
        } catch (err) {
            console.error("Failed to update recurring transaction", err);
            alert("خطا در ویرایش تراکنش تکراری.");
        }
    };
    
    const deleteRecurringTransaction = async (id: string) => {
        try {
            await api.deleteRecurringTransaction(id);
            setRecurringTransactions(prev => prev.filter(r => r.id !== id));
        } catch (err) {
            console.error("Failed to delete recurring transaction", err);
            alert("خطا در حذف تراکنش تکراری.");
        }
    };

    const saveApiKeyHandler = (key: string) => {
        api.saveApiKey(key);
        setApiKey(key);
    };

    const removeApiKeyHandler = () => {
        api.removeApiKey();
        setApiKey(null);
    };

    const downloadJson = () => {
        const data = {
            transactions,
            expenseCategories,
            incomeCategories
        };
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
            JSON.stringify(data, null, 2)
        )}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = `financial_data_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    };

    const uploadJson = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const text = await file.text();
                try {
                    const data = JSON.parse(text);
                    if (data.transactions && data.expenseCategories && data.incomeCategories) {
                        if (window.confirm("آیا مطمئن هستید؟ با این کار تمام داده‌های فعلی شما بازنویسی خواهد شد.")) {
                             await api.replaceAllData(data);
                             setTransactions(data.transactions);
                             setExpenseCategories(data.expenseCategories);
                             setIncomeCategories(data.incomeCategories);
                             alert("داده‌ها با موفقیت بارگذاری شد.");
                        }
                    } else {
                        throw new Error("Invalid JSON structure");
                    }
                } catch (err) {
                    alert("خطا در بارگذاری فایل. لطفاً از یک فایل پشتیبان معتبر استفاده کنید.");
                    console.error("JSON upload error:", err);
                }
            }
        };
        input.click();
    };

    const filteredTransactions = useMemo(() => {
        let items = [...transactions];

        if (filters.type !== 'all') {
            items = items.filter(t => t.type === filters.type);
        }
        if (filters.category !== 'all' && filters.type !== 'all') {
            const key = filters.type === TransactionType.INCOME ? 'incomeCategory' : 'expenseCategory';
            items = items.filter(t => t[key] === filters.category);
        }
        if (filters.startDate) {
            items = items.filter(t => new Date(t.date) >= new Date(filters.startDate));
        }
        if (filters.endDate) {
            items = items.filter(t => new Date(t.date) <= new Date(filters.endDate));
        }
        
        return items.sort((a, b) => {
            const { key, direction } = sortOptions;
            const valA = a[key];
            const valB = b[key];
            
            let comparison = 0;
            if (valA > valB) {
                comparison = 1;
            } else if (valA < valB) {
                comparison = -1;
            }
            return direction === 'desc' ? comparison * -1 : comparison;
        });

    }, [transactions, filters, sortOptions]);

    const { totalIncome, totalExpense, balance, expensesByCategory, incomeByCategory } = useMemo(() => {
        return filteredTransactions.reduce(
            (acc, t) => {
                if (t.type === TransactionType.INCOME) {
                    acc.totalIncome += t.amount;
                    if(t.incomeCategory) {
                        acc.incomeByCategory[t.incomeCategory] = (acc.incomeByCategory[t.incomeCategory] || 0) + t.amount;
                    }
                } else {
                    acc.totalExpense += t.amount;
                    if(t.expenseCategory) {
                        acc.expensesByCategory[t.expenseCategory] = (acc.expensesByCategory[t.expenseCategory] || 0) + t.amount;
                    }
                }
                acc.balance = acc.totalIncome - acc.totalExpense;
                return acc;
            },
            { totalIncome: 0, totalExpense: 0, balance: 0, expensesByCategory: {} as {[key:string]: number}, incomeByCategory: {} as {[key:string]: number} }
        );
    }, [filteredTransactions]);

    if (isLoading) return <div className="flex justify-center items-center h-screen"><p className="text-gray-900 dark:text-text-primary">در حال بارگذاری...</p></div>;
    if (error) return <div className="flex justify-center items-center h-screen"><p className="text-red-500">{error}</p></div>;

    const renderPage = () => {
        switch (activePage) {
            case 'dashboard':
                return (
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 space-y-8">
                            <Summary totalIncome={totalIncome} totalExpense={totalExpense} balance={balance} />
                            <TransactionForm addTransaction={addTransaction} expenseCategories={expenseCategories} incomeCategories={incomeCategories} />
                        </div>
                        <div className="lg:col-span-2 space-y-8">
                             <IncomeExpenseChart transactions={filteredTransactions} />
                             <MonthlyChart transactions={filteredTransactions} />
                        </div>
                    </div>
                );
            case 'transactions':
                return (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <ExpensePieChart expensesByCategory={expensesByCategory} expenseCategories={expenseCategories} />
                            <CategoryBreakdown title="تفکیک هزینه‌ها" items={expensesByCategory} total={totalExpense} categories={expenseCategories} barColorClass="bg-danger" />
                            <CategoryBreakdown title="تفکیک درآمدها" items={incomeByCategory} total={totalIncome} categories={incomeCategories} barColorClass="bg-secondary" />
                        </div>
                        <TransactionFilters 
                            filters={filters}
                            onFilterChange={setFilters}
                            expenseCategories={expenseCategories}
                            incomeCategories={incomeCategories}
                        />
                        <TransactionList
                            transactions={filteredTransactions}
                            deleteTransaction={deleteTransaction}
                            onEditTransaction={(id) => setEditingTransaction(transactions.find(t => t.id === id) || null)}
                            expenseCategories={expenseCategories}
                            incomeCategories={incomeCategories}
                            sortOptions={sortOptions}
                            onSortChange={setSortOptions}
                        />
                    </div>
                );
            case 'analysis':
                return <Analysis apiKey={apiKey} transactions={transactions} addTransaction={addTransaction} expenseCategories={expenseCategories} incomeCategories={incomeCategories} aiVoiceSettings={aiVoiceSettings} />;
            case 'settings':
                return <SettingsPage
                    apiKey={apiKey}
                    onSaveApiKey={saveApiKeyHandler}
                    onRemoveApiKey={removeApiKeyHandler}
                    onManageIncomeCategories={() => setIsIncomeCategoryModalOpen(true)}
                    onManageExpenseCategories={() => setIsExpenseCategoryModalOpen(true)}
                    onManageRecurring={() => setIsRecurringModalOpen(true)}
                    onDownloadJson={downloadJson}
                    onUploadJson={uploadJson}
                    onLogout={onLogout}
                    aiVoiceSettings={aiVoiceSettings}
                    onUpdateAiVoiceSettings={updateAiVoiceSettings}
                />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen p-4 sm:p-8 text-gray-800 dark:text-text-primary">
            <div className="max-w-7xl mx-auto">
                <Navigation activePage={activePage} setActivePage={setActivePage} />

                <main>
                    {renderPage()}
                </main>

                {editingTransaction && (
                    <EditTransactionModal
                        transaction={editingTransaction}
                        onUpdate={updateTransaction}
                        onClose={() => setEditingTransaction(null)}
                        expenseCategories={expenseCategories}
                        incomeCategories={incomeCategories}
                    />
                )}

                {isExpenseCategoryModalOpen && (
                    <CategoryManagerModal
                        title="مدیریت دسته‌بندی‌های هزینه"
                        categories={expenseCategories}
                        onAddCategory={addExpenseCategory}
                        onDeleteCategory={deleteExpenseCategory}
                        onUpdateCategory={updateExpenseCategory}
                        onClose={() => setIsExpenseCategoryModalOpen(false)}
                    />
                )}
                 {isIncomeCategoryModalOpen && (
                    <CategoryManagerModal
                        title="مدیریت دسته‌بندی‌های درآمد"
                        categories={incomeCategories}
                        onAddCategory={addIncomeCategory}
                        onDeleteCategory={deleteIncomeCategory}
                        onUpdateCategory={updateIncomeCategory}
                        onClose={() => setIsIncomeCategoryModalOpen(false)}
                    />
                )}

                {isRecurringModalOpen && (
                    <RecurringManagerModal
                        recurringTransactions={recurringTransactions}
                        expenseCategories={expenseCategories}
                        incomeCategories={incomeCategories}
                        onAdd={addRecurringTransaction}
                        onUpdate={updateRecurringTransaction}
                        onDelete={deleteRecurringTransaction}
                        onClose={() => setIsRecurringModalOpen(false)}
                    />
                )}

            </div>
        </div>
    );
};

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
        return sessionStorage.getItem('isAuthenticated') === 'true';
    });

    const handleLogin = (username, password): boolean => {
        if (username === 'mohammad' && password === '318533') {
            sessionStorage.setItem('isAuthenticated', 'true');
            setIsAuthenticated(true);
            return true;
        }
        return false;
    };

    const handleLogout = () => {
        if (window.confirm("آیا برای خروج از حساب کاربری خود مطمئن هستید؟")) {
            sessionStorage.removeItem('isAuthenticated');
            setIsAuthenticated(false);
        }
    };

    return (
        <ThemeProvider>
            {isAuthenticated ? (
                <MainApp onLogout={handleLogout} />
            ) : (
                <LoginPage onLogin={handleLogin} />
            )}
        </ThemeProvider>
    );
};

export default App;
