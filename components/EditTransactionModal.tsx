import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, Category } from '../types';
import { useTheme } from '../App';

interface EditTransactionModalProps {
    transaction: Transaction;
    onUpdate: (transaction: Transaction) => void;
    onClose: () => void;
    expenseCategories: Category[];
    incomeCategories: Category[];
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({ transaction, onUpdate, onClose, expenseCategories, incomeCategories }) => {
    const { cardClasses } = useTheme();
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState('');
    const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
    const [expenseCategory, setExpenseCategory] = useState<string>('');
    const [incomeCategory, setIncomeCategory] = useState<string>('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (transaction) {
            setDescription(transaction.description);
            setAmount(transaction.amount.toLocaleString('en-US'));
            setDate(transaction.date.split('T')[0]);
            setType(transaction.type);
            if (transaction.type === TransactionType.EXPENSE) {
                setExpenseCategory(transaction.expenseCategory || (expenseCategories.length > 0 ? expenseCategories[0].value : ''));
            } else if (transaction.type === TransactionType.INCOME) {
                setIncomeCategory(transaction.incomeCategory || (incomeCategories.length > 0 ? incomeCategories[0].value : ''));
            }
        }
    }, [transaction, expenseCategories, incomeCategories]);

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
            setError('لطفا یک دسته‌بندی برای هزینه انتخاب کنید.');
            return;
        }
         if (type === TransactionType.INCOME && !incomeCategory) {
            setError('لطفا یک دسته‌بندی برای درآمد انتخاب کنید.');
            return;
        }

        const updatedTransaction: Transaction = {
            ...transaction,
            description,
            amount: numAmount,
            date,
            type,
        };

        if (type === TransactionType.EXPENSE) {
            updatedTransaction.expenseCategory = expenseCategory;
            delete updatedTransaction.incomeCategory;
        } else if (type === TransactionType.INCOME){
            updatedTransaction.incomeCategory = incomeCategory;
            delete updatedTransaction.expenseCategory;
        }

        onUpdate(updatedTransaction);
    };
    
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 transition-opacity p-4"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className={`${cardClasses} rounded-xl p-6 w-full max-w-md transform transition-all`}
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-text-primary">ویرایش تراکنش</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-text-secondary mb-2">نوع تراکنش</label>
                        <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-200 dark:bg-gray-700 p-1">
                            <button
                                type="button"
                                onClick={() => setType(TransactionType.INCOME)}
                                className={`w-full py-2.5 rounded-md transition-colors text-sm font-bold ${type === TransactionType.INCOME ? 'bg-secondary text-white shadow-md' : 'text-gray-600 dark:text-text-secondary hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                            >
                                درآمد
                            </button>
                            <button
                                type="button"
                                onClick={() => setType(TransactionType.EXPENSE)}
                                className={`w-full py-2.5 rounded-md transition-colors text-sm font-bold ${type === TransactionType.EXPENSE ? 'bg-danger text-white shadow-md' : 'text-gray-600 dark:text-text-secondary hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                            >
                                هزینه
                            </button>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="edit-description" className="block text-sm font-medium text-gray-600 dark:text-text-secondary mb-1">توضیحات</label>
                        <input
                            type="text"
                            id="edit-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-text-primary rounded-md border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary transition py-2.5 px-3"
                        />
                    </div>
                    <div>
                        <label htmlFor="edit-amount" className="block text-sm font-medium text-gray-600 dark:text-text-secondary mb-1">مبلغ</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            id="edit-amount"
                            value={amount}
                            onChange={handleAmountChange}
                            className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-text-primary rounded-md border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary transition py-2.5 px-3"
                        />
                    </div>
                    <div>
                        <label htmlFor="edit-date" className="block text-sm font-medium text-gray-600 dark:text-text-secondary mb-1">تاریخ</label>
                        <input
                            type="date"
                            id="edit-date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-text-primary rounded-md border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary transition py-2.5 px-3"
                        />
                    </div>
                   
                    {type === TransactionType.EXPENSE && (
                        <div>
                            <label htmlFor="edit-expense-category" className="block text-sm font-medium text-gray-600 dark:text-text-secondary mb-1">دسته‌بندی هزینه</label>
                            <select
                                id="edit-expense-category"
                                value={expenseCategory}
                                onChange={(e) => setExpenseCategory(e.target.value)}
                                className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-text-primary rounded-md border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary transition py-2.5 px-3"
                                disabled={expenseCategories.length === 0}
                            >
                                {expenseCategories.map(cat => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    {type === TransactionType.INCOME && (
                        <div>
                            <label htmlFor="edit-income-category" className="block text-sm font-medium text-gray-600 dark:text-text-secondary mb-1">دسته‌بندی درآمد</label>
                            <select
                                id="edit-income-category"
                                value={incomeCategory}
                                onChange={(e) => setIncomeCategory(e.target.value)}
                                className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-text-primary rounded-md border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary transition py-2.5 px-3"
                                disabled={incomeCategories.length === 0}
                            >
                                {incomeCategories.map(cat => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}
                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4">
                         <button
                            type="button"
                            onClick={onClose}
                            className="w-full sm:w-auto bg-gray-600 hover:bg-gray-500 text-white font-bold py-2.5 px-4 rounded-lg transition-colors duration-300"
                        >
                            انصراف
                        </button>
                        <button
                            type="submit"
                            className="w-full sm:w-auto bg-primary hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg transition-colors duration-300"
                        >
                            ذخیره تغییرات
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};