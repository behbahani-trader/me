import React, { useState, useEffect } from 'react';
import { Category } from '../types';
import { TrashIcon, EditIcon, CloseIcon, CheckIcon } from './Icons';
import { useTheme } from '../App';

interface CategoryManagerModalProps {
    title: string;
    categories: Category[];
    onAddCategory: (label: string) => void;
    onDeleteCategory: (value: string) => void;
    onUpdateCategory: (value: string, newLabel: string) => void;
    onClose: () => void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({ title, categories, onAddCategory, onDeleteCategory, onUpdateCategory, onClose }) => {
    const { cardClasses } = useTheme();
    const [newCategoryLabel, setNewCategoryLabel] = useState('');
    const [addError, setAddError] = useState('');
    const [editError, setEditError] = useState('');
    
    const [editingValue, setEditingValue] = useState<string | null>(null);
    const [editingLabel, setEditingLabel] = useState('');


    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedLabel = newCategoryLabel.trim();
        if (!trimmedLabel) {
            setAddError('نام دسته‌بندی نمی‌تواند خالی باشد.');
            return;
        }
        if (categories.some(c => c.label.toLowerCase() === trimmedLabel.toLowerCase())) {
            setAddError('این دسته‌بندی از قبل وجود دارد.');
            return;
        }
        
        onAddCategory(trimmedLabel);
        setNewCategoryLabel('');
        setAddError('');
    };
    
    const handleStartEdit = (category: Category) => {
        setEditingValue(category.value);
        setEditingLabel(category.label);
        setEditError('');
    };

    const handleCancelEdit = () => {
        setEditingValue(null);
        setEditingLabel('');
        setEditError('');
    };

    const handleUpdate = () => {
        const trimmedLabel = editingLabel.trim();
        if (!trimmedLabel) {
            setEditError('نام دسته‌بندی نمی‌تواند خالی باشد.');
            return;
        }
        // Check for duplicates, excluding the one being edited
        if (categories.some(c => c.value !== editingValue && c.label.toLowerCase() === trimmedLabel.toLowerCase())) {
            setEditError('این دسته‌بندی از قبل وجود دارد.');
            return;
        }
        if (editingValue) {
            onUpdateCategory(editingValue, trimmedLabel);
            handleCancelEdit();
        }
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
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-text-primary">{title}</h2>
                
                <form onSubmit={handleAddSubmit} className="space-y-4 mb-6">
                    <div>
                        <label htmlFor="new-category" className="block text-sm font-medium text-gray-600 dark:text-text-secondary mb-1">نام دسته‌بندی جدید</label>
                        <div className="flex gap-2">
                             <input
                                type="text"
                                id="new-category"
                                value={newCategoryLabel}
                                onChange={(e) => setNewCategoryLabel(e.target.value)}
                                placeholder="مثال: آموزش"
                                className="flex-grow bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-text-primary rounded-md border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary transition py-2.5 px-3"
                            />
                            <button
                                type="submit"
                                className="bg-primary hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg transition-colors duration-300 whitespace-nowrap"
                            >
                                افزودن
                            </button>
                        </div>
                    </div>
                    {addError && <p className="text-red-500 dark:text-red-400 text-sm">{addError}</p>}
                </form>

                <h3 className="text-lg font-semibold mb-2 text-gray-500 dark:text-text-secondary">دسته‌بندی‌های موجود</h3>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                    {categories.length > 0 ? (
                        categories.map(category => (
                             <div key={category.value} className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-3 rounded-lg min-h-[58px]">
                                {editingValue === category.value ? (
                                    <div className="flex-grow flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={editingLabel}
                                                onChange={(e) => setEditingLabel(e.target.value)}
                                                className="flex-grow bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-text-primary rounded-md border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary transition py-1 px-2"
                                                autoFocus
                                            />
                                            <button onClick={handleUpdate} className="text-emerald-500 hover:text-emerald-400 p-1.5 rounded-full bg-emerald-500/10" aria-label="ذخیره"><CheckIcon /></button>
                                            <button onClick={handleCancelEdit} className="text-gray-500 hover:text-gray-400 p-1.5 rounded-full bg-gray-600/20" aria-label="انصراف"><CloseIcon /></button>
                                        </div>
                                        {editError && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{editError}</p>}
                                    </div>
                                ) : (
                                    <>
                                        <span className="text-gray-900 dark:text-text-primary">{category.label}</span>
                                        <div className="flex items-center">
                                            <button 
                                                onClick={() => handleStartEdit(category)} 
                                                className="text-gray-500 hover:text-blue-500 transition-colors p-2 rounded-full"
                                                aria-label={`ویرایش دسته‌بندی ${category.label}`}
                                            >
                                                <EditIcon />
                                            </button>
                                            <button 
                                                onClick={() => onDeleteCategory(category.value)} 
                                                className="text-gray-500 hover:text-red-500 transition-colors p-2 rounded-full"
                                                aria-label={`حذف دسته‌بندی ${category.label}`}
                                            >
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 dark:text-text-secondary text-center py-4">هیچ دسته‌بندی تعریف نشده است.</p>
                    )}
                </div>

                <div className="flex justify-end pt-6">
                     <button
                        type="button"
                        onClick={onClose}
                        className="w-full sm:w-auto bg-gray-600 hover:bg-gray-500 text-white font-bold py-2.5 px-4 rounded-lg transition-colors duration-300"
                    >
                        بستن
                    </button>
                </div>
            </div>
        </div>
    );
};