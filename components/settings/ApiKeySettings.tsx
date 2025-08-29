import React, { useState } from 'react';
import { useTheme } from '../../App';
import { KeyIcon, CheckIcon, TrashIcon } from '../Icons';

interface ApiKeySettingsProps {
    apiKey: string | null;
    onSave: (key: string) => void;
    onRemove: () => void;
}

export const ApiKeySettings: React.FC<ApiKeySettingsProps> = ({ apiKey, onSave, onRemove }) => {
    const { cardClasses } = useTheme();
    const [keyInput, setKeyInput] = useState('');
    const [isSaved, setIsSaved] = useState(false);
    const hasApiKey = !!apiKey;

    const handleSave = () => {
        if (keyInput.trim()) {
            onSave(keyInput.trim());
            setKeyInput('');
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
        }
    };
    
    const handleRemove = () => {
        if (window.confirm("آیا از حذف کلید API مطمئن هستید؟")) {
            onRemove();
        }
    };

    return (
        <div className={`${cardClasses} rounded-xl p-6`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-text-primary">کلید API هوش مصنوعی</h3>
                        {hasApiKey ? (
                            <span className="flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-400 font-bold px-2 py-1 rounded-full">
                                <CheckIcon />
                                تنظیم شده
                            </span>
                        ) : (
                             <span className="flex items-center gap-1 text-xs bg-red-500/20 text-red-400 font-bold px-2 py-1 rounded-full">
                                تنظیم نشده
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-text-secondary">برای استفاده از بخش تحلیل هوش مصنوعی، کلید API گوگل Gemini خود را وارد کنید. این کلید فقط در مرورگر شما ذخیره می‌شود.</p>
                </div>
                {hasApiKey && (
                     <button
                        onClick={handleRemove}
                        className="flex items-center justify-center gap-2 bg-danger hover:bg-red-600 text-white font-bold py-2.5 px-5 rounded-lg transition-colors duration-300 w-full sm:w-auto"
                    >
                        <TrashIcon />
                        <span>حذف کلید</span>
                    </button>
                )}
            </div>
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <input
                    type="password"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="کلید API خود را اینجا وارد کنید..."
                    className="flex-grow bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-text-primary rounded-md border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary transition py-2.5 px-3"
                    aria-label="ورودی کلید API"
                />
                <button
                    onClick={handleSave}
                    disabled={!keyInput.trim()}
                    className="flex items-center justify-center gap-2 bg-primary hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-lg transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {isSaved ? <CheckIcon /> : <KeyIcon />}
                    <span>{isSaved ? 'ذخیره شد!' : 'ذخیره کلید'}</span>
                </button>
            </div>
        </div>
    );
};
