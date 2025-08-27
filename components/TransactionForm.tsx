import React, { useState } from 'react';
import { Transaction, TransactionType, Category } from '../types';
import { useTheme } from '../App';

interface TransactionFormProps {
    addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
    expenseCategories: Category[];
    incomeCategories: Category[];
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ addTransaction, expenseCategories, incomeCategories }) => {
    const { cardClasses } = useTheme();
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
    const [expenseCategory, setExpenseCategory] = useState<string>(expenseCategories.length > 0 ? expenseCategories[0].value : '');
    const [incomeCategory, setIncomeCategory] = useState<string>(incomeCategories.length > 0 ? incomeCategories[0].value : '');
    const [error, setError] = useState('');

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        const numericValue = rawValue.replace(/[^0-9]/g, ''); // Allow only digits

        if (numericValue) {
            setAmount(Number(numericValue).toLocaleString('en-US'));
        } else {
            setAmount('');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseFloat(amount.replace(/,/g, ''));

        if (!description.trim() || !amount.trim() || !date) {
            setError('لطفاً تمام فیلدها را پر کنید.');
            return;
        }
        if (isNaN(numAmount) || numAmount <= 0) {
            setError('لطفاً یک مبلغ معتبر و مثبت وارد کنید.');
            return;
        }
        if (type === TransactionType.EXPENSE && !expenseCategory) {
            setError('لطفا یک دسته‌بندی برای هزینه انتخاب کنید یا یک دسته‌بندی جدید تعریف کنید.');
            return;
        }
         if (type === TransactionType.INCOME && !incomeCategory) {
            setError('لطفا یک دسته‌بندی برای درآمد انتخاب کنید یا یک دسته‌بندی جدید تعریف کنید.');
            return;
        }

        const newTransaction: Omit<Transaction, 'id'> = {
            description,
            amount: numAmount,
            type,
            date,
        };

        if (type === TransactionType.EXPENSE) {
            newTransaction.expenseCategory = expenseCategory;
        } else if (type === TransactionType.INCOME) {
            newTransaction.incomeCategory = incomeCategory;
        }

        addTransaction(newTransaction);
        setDescription('');
        setAmount('');
        setDate(new Date().toISOString().split('T')[0]);
        setType(TransactionType.EXPENSE);
        setExpenseCategory(expenseCategories.length > 0 ? expenseCategories[0].value : '');
        setIncomeCategory(incomeCategories.length > 0 ? incomeCategories[0].value : '');
        setError('');
    };

    return (
        <div className={`${cardClasses} rounded-xl p-6`}>
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-text-primary">افزودن تراکنش جدید</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-text-secondary mb-2">نوع تراکنش</label>
                    <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-200 dark:bg-gray-700 p-1">
                        <button
                            type="button"
                            onClick={() => setType(TransactionType.INCOME)}
                            className={`w-full py-2.5 rounded-md transition-all duration-300 text-sm font-bold transform hover:scale-105 ${type === TransactionType.INCOME ? 'bg-secondary text-white shadow-md' : 'text-gray-600 dark:text-text-secondary hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                        >
                            درآمد
                        </button>
                        <button
                            type="button"
                            onClick={() => setType(TransactionType.EXPENSE)}
                            className={`w-full py-2.5 rounded-md transition-all duration-300 text-sm font-bold transform hover:scale-105 ${type === TransactionType.EXPENSE ? 'bg-danger text-white shadow-md' : 'text-gray-600 dark:text-text-secondary hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                        >
                            هزینه
                        </button>
                    </div>
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-600 dark:text-text-secondary mb-1">توضیحات</label>
                    <input
                        type="text"
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="مثال: خرید خواربار، حقوق"
                        className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-text-primary rounded-md border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary transition py-2.5 px-3"
                    />
                </div>
                <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-600 dark:text-text-secondary mb-1">مبلغ</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        id="amount"
                        value={amount}
                        onChange={handleAmountChange}
                        placeholder="0"
                        className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-text-primary rounded-md border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary transition py-2.5 px-3"
                    />
                </div>
                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-600 dark:text-text-secondary mb-1">تاریخ</label>
                    <input
                        type="date"
                        id="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-text-primary rounded-md border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary transition py-2.5 px-3"
                    />
                </div>
               
                {type === TransactionType.EXPENSE && (
                    <div>
                        <label htmlFor="expense-category" className="block text-sm font-medium text-gray-600 dark:text-text-secondary mb-1">دسته‌بندی هزینه</label>
                        <select
                            id="expense-category"
                            value={expenseCategory}
                            onChange={(e) => setExpenseCategory(e.target.value)}
                            className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-text-primary rounded-md border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary transition py-2.5 px-3"
                            disabled={expenseCategories.length === 0}
                        >
                            {expenseCategories.length === 0 ? (
                                <option>ابتدا یک دسته‌بندی هزینه تعریف کنید</option>
                            ) : (
                                expenseCategories.map(cat => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))
                            )}
                        </select>
                    </div>
                )}
                 {type === TransactionType.INCOME && (
                    <div>
                        <label htmlFor="income-category" className="block text-sm font-medium text-gray-600 dark:text-text-secondary mb-1">دسته‌بندی درآمد</label>
                        <select
                            id="income-category"
                            value={incomeCategory}
                            onChange={(e) => setIncomeCategory(e.target.value)}
                            className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-text-primary rounded-md border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary transition py-2.5 px-3"
                            disabled={incomeCategories.length === 0}
                        >
                            {incomeCategories.length === 0 ? (
                                <option>ابتدا یک دسته‌بندی درآمد تعریف کنید</option>
                            ) : (
                                incomeCategories.map(cat => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))
                            )}
                        </select>
                    </div>
                )}
                {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}
                <button
                    type="submit"
                    className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 transform hover:scale-105"
                >
                    افزودن تراکنش
                </button>
            </form>
        </div>
    );
};