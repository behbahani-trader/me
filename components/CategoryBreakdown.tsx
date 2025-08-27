import React from 'react';
import { Category } from '../types';
import { useTheme } from '../App';

interface CategoryBreakdownProps {
    title: string;
    items: { [key: string]: number };
    total: number;
    categories: Category[];
    barColorClass: string;
}

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({ title, items, total, categories, barColorClass }) => {
    const { cardClasses } = useTheme();

    if (total === 0 || Object.keys(items).length === 0) {
        return (
            <div className={`${cardClasses} rounded-xl p-4 sm:p-6`}>
                <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-text-primary">{title}</h3>
                <p className="text-gray-500 dark:text-text-secondary text-center py-4">داده‌ای برای نمایش وجود ندارد.</p>
            </div>
        );
    }

    const sortedCategoryValues = Object.entries(items)
        .sort(([, a], [, b]) => b - a)
        .map(([key]) => key);

    return (
        <div className={`${cardClasses} rounded-xl p-4 sm:p-6`}>
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-text-primary">{title}</h3>
            <div className="space-y-4">
                {sortedCategoryValues.map(categoryValue => {
                    const category = categories.find(c => c.value === categoryValue);
                    const amount = items[categoryValue];
                    const percentage = total > 0 ? (amount / total) * 100 : 0;
                    return (
                        <div key={categoryValue}>
                            <div className="flex justify-between items-center mb-1 text-sm">
                                <span className="font-medium text-gray-500 dark:text-text-secondary">{category?.label || categoryValue}</span>
                                <span className="font-semibold text-gray-900 dark:text-text-primary">{amount.toLocaleString('fa-IR')}</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5" title={`${percentage.toFixed(1)}%`}>
                                <div
                                    className={`${barColorClass} h-2.5 rounded-full transition-all duration-500`}
                                    style={{ width: `${percentage}%` }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};