import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, Category, SortOptions } from '../types';
import { TrashIcon, ArrowUpIcon, ArrowDownIcon, SearchIcon, EditIcon, WalletIcon, CloseIcon } from './Icons';
import { useTheme } from '../App';


interface TransactionListProps {
    transactions: Transaction[];
    deleteTransaction: (id: string) => void;
    onEditTransaction: (id: string) => void;
    expenseCategories: Category[];
    incomeCategories: Category[];
    sortOptions: SortOptions;
    onSortChange: React.Dispatch<React.SetStateAction<SortOptions>>;
}

const TransactionItem: React.FC<{ transaction: Transaction; onDelete: (id: string) => void; onEdit: (id: string) => void; expenseCategories: Category[]; incomeCategories: Category[]; }> = ({ transaction, onDelete, onEdit, expenseCategories, incomeCategories }) => {
    const isIncome = transaction.type === TransactionType.INCOME;
    const amountColor = isIncome ? 'text-emerald-500' : 'text-red-500';
    const sign = isIncome ? '+' : '-';
    
    const categoryLabel = isIncome
        ? transaction.incomeCategory ? incomeCategories.find(c => c.value === transaction.incomeCategory)?.label : ''
        : transaction.expenseCategory ? expenseCategories.find(c => c.value === transaction.expenseCategory)?.label : '';


    return (
        <li className="flex items-center justify-between p-3 sm:p-4 bg-gray-100 dark:bg-gray-800 rounded-lg mb-3 transition-all duration-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 hover:scale-[1.02] gap-2">
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                <div className={`p-2 rounded-full flex-shrink-0 ${isIncome ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                    {isIncome ? <ArrowUpIcon className="text-emerald-500" /> : <ArrowDownIcon className="text-red-500" />}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-text-primary capitalize truncate text-sm sm:text-base" title={transaction.description}>
                        {transaction.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-text-secondary">
                        <span>{new Date(transaction.date).toLocaleDateString('fa-IR')}</span>
                        {categoryLabel && (
                            <>
                                <span>&bull;</span>
                                <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full text-xs">{categoryLabel}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
                <p className={`font-bold text-sm sm:text-base ${amountColor} whitespace-nowrap`}>
                    {sign} {transaction.amount.toLocaleString('fa-IR')}
                </p>
                <div className="flex">
                    <button onClick={() => onEdit(transaction.id)} className="text-gray-500 hover:text-blue-500 transition-colors p-2 rounded-full" title="ویرایش">
                        <EditIcon />
                    </button>
                    <button onClick={() => onDelete(transaction.id)} className="text-gray-500 hover:text-red-500 transition-colors p-2 rounded-full" title="حذف">
                        <TrashIcon />
                    </button>
                </div>
            </div>
        </li>
    );
};


export const TransactionList: React.FC<TransactionListProps> = ({ transactions, deleteTransaction, onEditTransaction, expenseCategories, incomeCategories, sortOptions, onSortChange }) => {
    const { cardClasses } = useTheme();
    const [searchTerm, setSearchTerm] = useState('');

    const searchedTransactions = useMemo(() => {
        if (!searchTerm.trim()) {
            return transactions;
        }
        const lowercasedFilter = searchTerm.toLowerCase().trim();
        return transactions.filter(t => {
             const categoryLabel = t.type === TransactionType.INCOME 
                ? t.incomeCategory ? incomeCategories.find(c => c.value === t.incomeCategory)?.label : ''
                : t.expenseCategory ? expenseCategories.find(c => c.value === t.expenseCategory)?.label : '';

            return (
                t.description.toLowerCase().includes(lowercasedFilter) ||
                (categoryLabel && categoryLabel.toLowerCase().includes(lowercasedFilter))
            );
        });
    }, [transactions, searchTerm, expenseCategories, incomeCategories]);

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const [key, direction] = e.target.value.split('-') as [SortOptions['key'], SortOptions['direction']];
        onSortChange({ key, direction });
    };

    return (
        <div className={`${cardClasses} rounded-xl p-4 sm:p-6`}>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                {transactions.length > 0 && (
                     <div className="relative w-full sm:w-72">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                           <SearchIcon />
                        </span>
                        <input
                            type="text"
                            placeholder="جستجو در توضیحات و دسته‌بندی‌ها..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-text-primary rounded-md border-gray-300 dark:border-gray-600 pl-10 pr-10 py-2 focus:ring-primary focus:border-primary transition"
                            aria-label="جستجوی تراکنش‌ها"
                        />
                         {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute inset-y-0 right-0 flex items-center pr-3"
                                aria-label="پاک کردن جستجو"
                            >
                                <CloseIcon />
                            </button>
                        )}
                    </div>
                )}
                 {transactions.length > 0 && (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <label htmlFor="sort-options" className="text-sm font-medium text-gray-500 dark:text-text-secondary whitespace-nowrap">
                            مرتب‌سازی بر اساس:
                        </label>
                        <select
                            id="sort-options"
                            value={`${sortOptions.key}-${sortOptions.direction}`}
                            onChange={handleSortChange}
                            className="w-full sm:w-auto bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-text-primary rounded-md border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary transition py-2 px-3 text-sm"
                        >
                            <option value="date-desc">تاریخ (جدیدترین)</option>
                            <option value="date-asc">تاریخ (قدیمی‌ترین)</option>
                            <option value="amount-desc">مبلغ (بیشترین)</option>
                            <option value="amount-asc">مبلغ (کمترین)</option>
                        </select>
                    </div>
                )}
            </div>

            {transactions.length > 0 ? (
                searchedTransactions.length > 0 ? (
                    <ul className="max-h-96 overflow-y-auto pl-2">
                       {searchedTransactions.map(t => (
                            <TransactionItem key={t.id} transaction={t} onDelete={deleteTransaction} onEdit={onEditTransaction} expenseCategories={expenseCategories} incomeCategories={incomeCategories}/>
                       ))}
                    </ul>
                ) : (
                    <div className="text-center py-10">
                        <p className="text-gray-500 dark:text-text-secondary">هیچ تراکنشی با این مشخصات یافت نشد.</p>
                        <p className="text-sm text-gray-600 dark:text-gray-500">فیلترها یا عبارت جستجوی خود را تغییر دهید.</p>
                    </div>
                )
            ) : (
                <div className="text-center py-12 flex flex-col items-center">
                    <WalletIcon />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-text-primary mt-4 mb-2">کیف پول شما خالی است</h3>
                    <p className="text-gray-500 dark:text-text-secondary max-w-xs mx-auto">برای شروع، اولین درآمد یا هزینه خود را با استفاده از فرم بالا اضافه کنید.</p>
                </div>
            )}
        </div>
    );
};