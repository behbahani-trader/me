import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Transaction, TransactionType } from '../types';
import { TrendingUpIcon } from './Icons';
import { useTheme } from '../App';

interface IncomeExpenseChartProps {
    transactions: Transaction[];
}

export const IncomeExpenseChart: React.FC<IncomeExpenseChartProps> = ({ transactions }) => {
    const { cardClasses, settings } = useTheme();

    const chartData = useMemo(() => {
        const months = [];
        const today = new Date();

        for (let i = 5; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const year = date.getFullYear();
            const month = date.getMonth();
            
            const monthName = date.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long' });
            
            months.push({
                name: monthName,
                key: `${year}-${month.toString().padStart(2, '0')}`,
                income: 0,
                expense: 0,
            });
        }

        const monthMap = new Map(months.map(m => [m.key, m]));
        
        const startDate = new Date(today.getFullYear(), today.getMonth() - 5, 1);
        startDate.setHours(0,0,0,0);

        transactions.forEach(t => {
            const transactionDate = new Date(t.date);
            if (transactionDate >= startDate) {
                const year = transactionDate.getFullYear();
                const month = transactionDate.getMonth();
                const key = `${year}-${month.toString().padStart(2, '0')}`;
                
                const monthData = monthMap.get(key);
                if (monthData) {
                    if (t.type === TransactionType.INCOME) {
                        monthData.income += t.amount;
                    } else {
                        monthData.expense += t.amount;
                    }
                }
            }
        });

        return months.map(m => ({
            name: m.name,
            'درآمد': m.income,
            'هزینه': m.expense,
        }));
    }, [transactions]);
    
    const isDarkMode = settings.themeMode === 'dark';
    const textColor = isDarkMode ? '#9ca3af' : '#6b7280';
    const tooltipBg = isDarkMode ? '#1f2937' : '#ffffff';
    const tooltipBorder = isDarkMode ? '#4a5568' : '#e5e7eb';


    return (
        <div className={`${cardClasses} rounded-xl p-6`}>
            <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-text-primary">درآمد در مقابل هزینه (۶ ماه اخیر)</h2>
            {chartData.some(d => d['درآمد'] > 0 || d['هزینه'] > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} />
                        <XAxis dataKey="name" stroke={textColor} tick={{ fill: textColor, fontSize: 12 }} />
                        <YAxis stroke={textColor} tick={{ fill: textColor }} tickFormatter={(value) => new Intl.NumberFormat('fa-IR').format(value as number)} />
                        <Tooltip
                            cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                            contentStyle={{
                                backgroundColor: tooltipBg,
                                borderColor: tooltipBorder,
                                borderRadius: '0.5rem',
                            }}
                            labelStyle={{ color: isDarkMode ? '#f9fafb' : '#111827' }}
                            formatter={(value: number, name: string) => [new Intl.NumberFormat('fa-IR').format(value), name]}
                        />
                        <Legend wrapperStyle={{ color: isDarkMode ? '#f9fafb' : '#111827' }} />
                        <Bar dataKey="درآمد" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="هزینه" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="text-center h-[300px] flex flex-col justify-center items-center">
                    <TrendingUpIcon />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-text-primary mt-4 mb-2">داده کافی برای نمایش نمودار وجود ندارد.</h3>
                    <p className="text-gray-500 dark:text-text-secondary">برای مشاهده این نمودار، لطفاً تراکنش‌هایی در ۶ ماه اخیر ثبت کنید.</p>
                </div>
            )}
        </div>
    );
};