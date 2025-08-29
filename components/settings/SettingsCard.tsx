import React from 'react';
import { useTheme } from '../../App';

export const SettingsCard: React.FC<{ title: string; description: string; buttonText: string; icon: React.ReactNode; onButtonClick: () => void; }> = ({ title, description, buttonText, icon, onButtonClick }) => {
    const { cardClasses } = useTheme();
    return (
        <div className={`${cardClasses} rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}>
            <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-text-primary mb-1">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-text-secondary">{description}</p>
            </div>
            <button
                onClick={onButtonClick}
                className="flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold py-2.5 px-5 rounded-lg transition-colors duration-300 w-full sm:w-auto"
            >
                {icon}
                <span>{buttonText}</span>
            </button>
        </div>
    );
};
