import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Transaction, TransactionType } from '../types';
import { useTheme } from '../App';

interface MonthlyChartProps {
    transactions: Transaction[];
}

const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
};

export const MonthlyChart: React.FC<MonthlyChartProps> = ({ transactions }) => {
    const { cardClasses, settings } = useTheme();

    const chartData = useMemo(() => {
        const monthlyData: { [key: string]: { income: number; expense: number; year: number; month: number } } = {};

        transactions.forEach(t => {
            const date = new Date(t.date);
            const year = date.getFullYear();
            const month = date.getMonth(); // 0-indexed
            const monthKey = `${year}-${month}`; 

            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { income: 0, expense: 0, year, month };
            }

            if (t.type === TransactionType.INCOME) {
                monthlyData[monthKey].income += t.amount;
            } else {
                monthlyData[monthKey].expense += t.amount;
            }
        });

        return Object.keys(monthlyData)
            .sort((a, b) => {
                const [yearA, monthA] = a.split('-').map(Number);
                const [yearB, monthB] = b.split('-').map(Number);
                if (yearA !== yearB) return yearA - yearB;
                return monthA - monthB;
            })
            .map(key => {
                const { year, month, income, expense } = monthlyData[key];
                const daysInMonth = getDaysInMonth(year, month);
                const date = new Date(year, month);
                const monthName = date.toLocaleDateString('fa-IR', { year: 'numeric', month: 'short' });
                
                return {
                    name: monthName,
                    'میانگین درآمد روزانه': daysInMonth > 0 ? income / daysInMonth : 0,
                    'میانگین هزینه روزانه': daysInMonth > 0 ? expense / daysInMonth : 0,
                };
            });
    }, [transactions]);

    const isDarkMode = settings.themeMode === 'dark';
    const textColor = isDarkMode ? '#9ca3af' : '#6b7280';
    const tooltipBg = isDarkMode ? '#1f2937' : '#ffffff';
    const tooltipBorder = isDarkMode ? '#4a5568' : '#e5e7eb';

    return (
        <div className={`${cardClasses} rounded-xl p-6`}>
            <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-text-primary">نمودار میانگین درآمد و هزینه روزانه (در هر ماه)</h2>
            {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} />
                        <XAxis dataKey="name" stroke={textColor} tick={{ fill: textColor }} />
                        <YAxis stroke={textColor} tick={{ fill: textColor }} tickFormatter={(value) => new Intl.NumberFormat('fa-IR').format(value as number)} />
                        <Tooltip
                            cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                            contentStyle={{
                                backgroundColor: tooltipBg,
                                borderColor: tooltipBorder,
                                borderRadius: '0.5rem',
                            }}
                            labelStyle={{ color: isDarkMode ? '#f9fafb' : '#111827' }}
                            formatter={(value: number) => [new Intl.NumberFormat('fa-IR').format(value), undefined]}
                        />
                        <Legend wrapperStyle={{ color: isDarkMode ? '#f9fafb' : '#111827' }} />
                        <Bar dataKey="میانگین درآمد روزانه" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="میانگین هزینه روزانه" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="text-center h-[300px] flex flex-col justify-center items-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-text-primary mb-2">نمودار شما در انتظار اولین تراکنش است!</h3>
                    <p className="text-gray-500 dark:text-text-secondary">برای مشاهده تحلیل تصویری درآمد و هزینه‌های خود،</p>
                    <p className="text-sm text-gray-600 dark:text-gray-500 mt-1">لطفاً اولین تراکنش خود را ثبت کنید.</p>
                </div>
            )}
        </div>
    );
};