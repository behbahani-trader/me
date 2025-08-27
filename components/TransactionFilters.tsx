import React, { useState, useEffect, useMemo } from 'react';
import { TransactionType, Category } from '../types';
import { FilterIcon, CloseIcon } from './Icons';
import { useTheme } from '../App';

interface Filters {
    type: 'all' | TransactionType;
    category: string;
    startDate: string;
    endDate: string;
}

interface TransactionFiltersProps {
    filters: Filters;
    onFilterChange: React.Dispatch<React.SetStateAction<Filters>>;
    expenseCategories: Category[];
    incomeCategories: Category[];
}

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({ filters, onFilterChange, expenseCategories, incomeCategories }) => {
    const { cardClasses } = useTheme();
    const [isExpanded, setIsExpanded] = useState(true);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        onFilterChange(prev => ({ ...prev, [name]: value }));
    };
    
    // Reset category filter when type changes
    useEffect(() => {
        onFilterChange(prev => ({ ...prev, category: 'all' }));
    }, [filters.type, onFilterChange]);

    const handleResetFilters = () => {
        onFilterChange({
            type: 'all',
            category: 'all',
            startDate: '',
            endDate: '',
        });
    };

    const areFiltersActive = useMemo(() => {
        return filters.type !== 'all' || filters.category !== 'all' || filters.startDate !== '' || filters.endDate !== '';
    }, [filters]);

    const currentCategories = filters.type === TransactionType.INCOME ? incomeCategories : expenseCategories;

    return (
        <div className={`${cardClasses} rounded-xl`}>
            <div className="flex justify-between items-center p-4">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-2 font-bold text-lg text-gray-900 dark:text-text-primary"
                    aria-expanded={isExpanded}
                >
                    <FilterIcon />
                    <span>فیلترها</span>
                    <span className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </span>
                </button>
                <button
                    onClick={handleResetFilters}
                    disabled={!areFiltersActive}
                    className="flex items-center gap-2 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-3 rounded-lg transition-colors duration-300 text-sm disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:text-gray-600 dark:disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                    <CloseIcon />
                    <span>حذف فیلترها</span>
                </button>
            </div>

            {isExpanded && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Type Filter */}
                        <div>
                            <label htmlFor="type-filter" className="block text-sm font-medium text-gray-500 dark:text-text-secondary mb-1">نوع</label>
                            <select
                                id="type-filter"
                                name="type"
                                value={filters.type}
                                onChange={handleInputChange}
                                className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-text-primary rounded-md border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary transition"
                            >
                                <option value="all">همه</option>
                                <option value={TransactionType.INCOME}>درآمد</option>
                                <option value={TransactionType.EXPENSE}>هزینه</option>
                            </select>
                        </div>

                        {/* Category Filter */}
                        <div>
                            <label htmlFor="category-filter" className="block text-sm font-medium text-gray-500 dark:text-text-secondary mb-1">دسته‌بندی</label>
                            <select
                                id="category-filter"
                                name="category"
                                value={filters.category}
                                onChange={handleInputChange}
                                className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-text-primary rounded-md border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary transition"
                                disabled={filters.type === 'all'}
                            >
                                <option value="all">همه</option>
                                {currentCategories.map(cat => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Start Date Filter */}
                        <div>
                             <label htmlFor="start-date" className="block text-sm font-medium text-gray-500 dark:text-text-secondary mb-1">از تاریخ</label>
                             <input
                                type="date"
                                id="start-date"
                                name="startDate"
                                value={filters.startDate}
                                onChange={handleInputChange}
                                className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-text-primary rounded-md border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary transition"
                            />
                        </div>

                        {/* End Date Filter */}
                         <div>
                             <label htmlFor="end-date" className="block text-sm font-medium text-gray-500 dark:text-text-secondary mb-1">تا تاریخ</label>
                             <input
                                type="date"
                                id="end-date"
                                name="endDate"
                                value={filters.endDate}
                                onChange={handleInputChange}
                                className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-text-primary rounded-md border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary transition"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};