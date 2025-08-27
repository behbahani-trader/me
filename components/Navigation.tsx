import React from 'react';
import { HomeIcon, ArrowsRightLeftIcon, SparklesIcon, SettingsIcon } from './Icons';
import { useTheme } from '../App';

type Page = 'dashboard' | 'transactions' | 'analysis' | 'settings';

interface NavigationProps {
    activePage: Page;
    setActivePage: (page: Page) => void;
}

const navItems: { id: Page; label: string; icon: JSX.Element }[] = [
    { id: 'dashboard', label: 'داشبورد', icon: <HomeIcon /> },
    { id: 'transactions', label: 'تراکنش‌ها', icon: <ArrowsRightLeftIcon /> },
    { id: 'analysis', label: 'تحلیل هوش مصنوعی', icon: <SparklesIcon /> },
    { id: 'settings', label: 'تنظیمات', icon: <SettingsIcon /> },
];

export const Navigation: React.FC<NavigationProps> = ({ activePage, setActivePage }) => {
    const { cardClasses } = useTheme();

    return (
        <nav className={`${cardClasses} rounded-xl p-2 mb-8`}>
            <ul className="flex justify-around items-center gap-1 sm:gap-2">
                {navItems.map((item) => (
                    <li key={item.id} className="flex-1">
                        <button
                            onClick={() => setActivePage(item.id)}
                            className={`w-full flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 p-3 rounded-lg transition-colors duration-300 text-sm sm:text-base font-bold ${
                                activePage === item.id
                                    ? 'bg-primary text-white'
                                    : 'text-gray-500 dark:text-text-secondary hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-text-primary'
                            }`}
                            aria-current={activePage === item.id ? 'page' : undefined}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
};