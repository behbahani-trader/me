import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Category } from '../types';
import { useTheme } from '../App';

interface ExpensePieChartProps {
    expensesByCategory: { [key: string]: number };
    expenseCategories: Category[];
}

const COLORS = ['#1e3a8a', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#3b82f6', '#ec4899'];

export const ExpensePieChart: React.FC<ExpensePieChartProps> = ({ expensesByCategory, expenseCategories }) => {
    const { cardClasses, settings } = useTheme();

    const data = useMemo(() => {
        return Object.entries(expensesByCategory).map(([key, value]) => ({
            name: expenseCategories.find(c => c.value === key)?.label || key,
            value: value,
        })).sort((a, b) => b.value - a.value);
    }, [expensesByCategory, expenseCategories]);

    const isDarkMode = settings.themeMode === 'dark';
    const textColor = isDarkMode ? '#9ca3af' : '#6b7280';
    const tooltipBg = isDarkMode ? '#1f2937' : '#ffffff';
    const tooltipBorder = isDarkMode ? '#4a5568' : '#e5e7eb';
    const legendColor = isDarkMode ? '#9ca3af' : '#4b5563';


    if (data.length === 0) {
        return (
            <div className={`${cardClasses} rounded-xl p-4 sm:p-6 h-[384px] flex flex-col justify-center items-center text-center`}>
                 <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-text-primary">هزینه‌ها بر اساس دسته‌بندی</h3>
                 <p className="text-gray-500 dark:text-text-secondary">هیچ هزینه‌ای در محدوده فیلتر شده وجود ندارد.</p>
            </div>
        );
    }
    
    return (
        <div className={`${cardClasses} rounded-xl p-4 sm:p-6`}>
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-text-primary">هزینه‌ها بر اساس دسته‌بندی</h3>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius="80%"
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                        contentStyle={{
                            backgroundColor: tooltipBg,
                            borderColor: tooltipBorder,
                            borderRadius: '0.5rem',
                        }}
                        formatter={(value: number, name: string) => [`${value.toLocaleString('fa-IR')} `, name]}
                        labelStyle={{ color: isDarkMode ? '#f9fafb' : '#111827' }}
                    />
                    <Legend
                         wrapperStyle={{ fontSize: '12px', direction: 'rtl', paddingTop: '16px' }}
                         iconSize={10}
                         formatter={(value) => <span style={{ color: legendColor }}>{value}</span>}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};