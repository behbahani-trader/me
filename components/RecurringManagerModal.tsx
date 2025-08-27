import React, { useState, useEffect } from 'react';
import { RecurringTransaction, Category, TransactionType, Frequency } from '../types';
import { TrashIcon, EditIcon, CloseIcon, CheckIcon, CalendarDaysIcon } from './Icons';
import { useTheme } from '../App';

interface RecurringManagerModalProps {
    recurringTransactions: RecurringTransaction[];
    expenseCategories: Category[];
    incomeCategories: Category[];
    onAdd: (item: Omit<RecurringTransaction, 'id' | 'lastAddedDate'>) => void;
    onUpdate: (item: RecurringTransaction) => void;
    onDelete: (id: string) => void;
    onClose: () => void;
}

const initialState = {
    description: '',
    amount: '',
    type: TransactionType.EXPENSE,
    expenseCategory: '',
    incomeCategory: '',
    frequency: Frequency.MONTHLY,
    startDate: new Date().toISOString().split('T')[0],
};

export const RecurringManagerModal: React.FC<RecurringManagerModalProps> = ({
    recurringTransactions, expenseCategories, incomeCategories, onAdd, onUpdate, onDelete, onClose
}) => {
    const { cardClasses } = useTheme();
    const [formState, setFormState] = useState(initialState);
    const [editingItem, setEditingItem] = useState<RecurringTransaction | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        setFormState(prevState => ({
            ...prevState,
            expenseCategory: expenseCategories.length > 0 ? expenseCategories[0].value : '',
            incomeCategory: incomeCategories.length > 0 ? incomeCategories[0].value : ''
        }));
    }, [expenseCategories, incomeCategories]);
    
    useEffect(() => {
        if (editingItem) {
            setFormState({
                description: editingItem.description,
                amount: editingItem.amount.toString(),
                type: editingItem.type,
                expenseCategory: editingItem.expenseCategory || '',
                incomeCategory: editingItem.incomeCategory || '',
                frequency: editingItem.frequency,
                startDate: editingItem.startDate
            });
        } else {
            setFormState(prevState => ({
                ...initialState,
                expenseCategory: expenseCategories.length > 0 ? expenseCategories[0].value : '',
                incomeCategory: incomeCategories.length > 0 ? incomeCategories[0].value : '',
                startDate: new Date().toISOString().split('T')[0]
            }));
        }
    }, [editingItem, expenseCategories, incomeCategories]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseFloat(formState.amount);

        if (!formState.description.trim() || !formState.amount.trim() || !formState.startDate) {
            setError('لطفاً تمام فیلدهای لازم را پر کنید.');
            return;
        }
        if (isNaN(numAmount) || numAmount <= 0) {
            setError('لطفاً یک مبلغ معتبر و مثبت وارد کنید.');
            return;
        }

        const data: Omit<RecurringTransaction, 'id' | 'lastAddedDate'> = {
            description: formState.description,
            amount: numAmount,
            type: formState.type,
            frequency: formState.frequency,
            startDate: formState.startDate,
            expenseCategory: formState.type === TransactionType.EXPENSE ? formState.expenseCategory : undefined,
            incomeCategory: formState.type === TransactionType.INCOME ? formState.incomeCategory : undefined,
        };

        if (editingItem) {
            onUpdate({ ...data, id: editingItem.id, lastAddedDate: editingItem.lastAddedDate });
        } else {
            onAdd(data);
        }
        setEditingItem(null);
        setError('');
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
    
    const inputClasses = "w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-text-primary rounded-md border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary transition p-2";
    const labelClasses = "block text-sm font-medium text-gray-600 dark:text-text-secondary mb-1";


    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className={`${cardClasses} rounded-xl p-6 w-full max-w-2xl transform transition-all`} onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-text-primary flex items-center gap-2">
                    <CalendarDaysIcon />
                    {editingItem ? 'ویرایش تراکنش تکراری' : 'مدیریت تراکنش‌های تکراری'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 bg-black/5 dark:bg-gray-800/50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={`${labelClasses} mb-2`}>نوع</label>
                            <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-200 dark:bg-gray-700 p-1">
                                <button type="button" onClick={() => setFormState(p => ({...p, type: TransactionType.INCOME}))} className={`w-full py-2 rounded-md transition text-sm font-bold ${formState.type === TransactionType.INCOME ? 'bg-secondary text-white' : 'text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'}`}>درآمد</button>
                                <button type="button" onClick={() => setFormState(p => ({...p, type: TransactionType.EXPENSE}))} className={`w-full py-2 rounded-md transition text-sm font-bold ${formState.type === TransactionType.EXPENSE ? 'bg-danger text-white' : 'text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'}`}>هزینه</button>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="description" className={labelClasses}>توضیحات</label>
                            <input type="text" id="description" name="description" value={formState.description} onChange={handleInputChange} className={inputClasses}/>
                        </div>
                        <div>
                             <label htmlFor="amount" className={labelClasses}>مبلغ</label>
                            <input type="number" id="amount" name="amount" value={formState.amount} onChange={handleInputChange} className={inputClasses}/>
                        </div>
                        {formState.type === TransactionType.EXPENSE ? (
                             <div>
                                <label htmlFor="expenseCategory" className={labelClasses}>دسته‌بندی هزینه</label>
                                <select id="expenseCategory" name="expenseCategory" value={formState.expenseCategory} onChange={handleInputChange} className={inputClasses}>
                                    {expenseCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                </select>
                            </div>
                        ) : (
                             <div>
                                <label htmlFor="incomeCategory" className={labelClasses}>دسته‌بندی درآمد</label>
                                <select id="incomeCategory" name="incomeCategory" value={formState.incomeCategory} onChange={handleInputChange} className={inputClasses}>
                                    {incomeCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                </select>
                            </div>
                        )}
                        <div>
                            <label htmlFor="startDate" className={labelClasses}>تاریخ شروع</label>
                            <input type="date" id="startDate" name="startDate" value={formState.startDate} onChange={handleInputChange} className={inputClasses}/>
                        </div>
                        <div>
                             <label htmlFor="frequency" className={labelClasses}>تکرار</label>
                            <select id="frequency" name="frequency" value={formState.frequency} onChange={handleInputChange} className={inputClasses}>
                                <option value={Frequency.MONTHLY}>ماهانه</option>
                            </select>
                        </div>
                    </div>
                     {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="flex justify-end gap-2 pt-2">
                        {editingItem && <button type="button" onClick={() => setEditingItem(null)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">لغو ویرایش</button>}
                        <button type="submit" className="bg-primary hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">{editingItem ? 'ذخیره تغییرات' : 'افزودن یادآور'}</button>
                    </div>
                </form>

                <h3 className="text-lg font-semibold mb-2 text-gray-500 dark:text-text-secondary">یادآورهای موجود</h3>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                    {recurringTransactions.length > 0 ? (
                        recurringTransactions.map(item => (
                            <div key={item.id} className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-text-primary">{item.description} - {item.amount.toLocaleString('fa-IR')}</p>
                                    <p className="text-sm text-gray-500 dark:text-text-secondary">
                                       هر ماه از تاریخ {new Date(item.startDate).toLocaleDateString('fa-IR')}
                                    </p>
                                </div>
                                <div>
                                    <button onClick={() => setEditingItem(item)} className="text-gray-500 hover:text-blue-500 p-2 rounded-full"><EditIcon /></button>
                                    <button onClick={() => onDelete(item.id)} className="text-gray-500 hover:text-red-500 p-2 rounded-full"><TrashIcon /></button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 dark:text-text-secondary text-center py-4">هیچ یادآور تکراری تعریف نشده است.</p>
                    )}
                </div>
                 <div className="flex justify-end pt-6">
                     <button type="button" onClick={onClose} className="w-full sm:w-auto bg-gray-600 hover:bg-gray-500 text-white font-bold py-2.5 px-4 rounded-lg">بستن</button>
                </div>
            </div>
        </div>
    );
};