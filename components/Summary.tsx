import React from 'react';
import { ArrowUpCircleIcon, ArrowDownCircleIcon, ScaleIcon } from './Icons';
import { useTheme } from '../App';

interface SummaryProps {
    totalIncome: number;
    totalExpense: number;
    balance: number;
}

const SummaryCard: React.FC<{ title: string; amount: number; icon: React.ReactNode; colorClass: string; }> = ({ title, amount, icon, colorClass }) => {
    const { cardClasses } = useTheme();
    return (
        <div className={`${cardClasses} rounded-xl p-3 sm:p-6 flex items-center space-x-4 transform hover:scale-105 transition-transform duration-300`}>
            <div className={`p-3 rounded-full ${colorClass}`}>
                {icon}
            </div>
            <div>
                <p className="text-gray-500 dark:text-text-secondary text-sm font-medium">{title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-text-primary">
                    {amount.toLocaleString('fa-IR')}
                </p>
            </div>
        </div>
    );
};

export const Summary: React.FC<SummaryProps> = ({ totalIncome, totalExpense, balance }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
            <SummaryCard
                title="درآمد کل"
                amount={totalIncome}
                icon={<ArrowUpCircleIcon />}
                colorClass="bg-emerald-500/20 text-emerald-500"
            />
            <SummaryCard
                title="هزینه کل"
                amount={totalExpense}
                icon={<ArrowDownCircleIcon />}
                colorClass="bg-red-500/20 text-red-500"
            />
            <SummaryCard
                title="موجودی"
                amount={balance}
                icon={<ScaleIcon />}
                colorClass={balance >= 0 ? "bg-blue-500/20 text-blue-500" : "bg-red-500/20 text-red-500"}
            />
        </div>
    );
};
