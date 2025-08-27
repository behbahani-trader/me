import React, { useState } from 'react';
import { CogIcon, DownloadIcon, UploadIcon, CalendarDaysIcon, KeyIcon, CheckIcon, TrashIcon, SunIcon, MoonIcon, SwatchIcon, DocumentTextIcon, SparklesIcon, LogoutIcon } from './Icons';
import { useTheme } from '../App';
import { ThemeSettings } from '../types';

interface SettingsPageProps {
    apiKey: string | null;
    onSaveApiKey: (key: string) => void;
    onRemoveApiKey: () => void;
    onManageIncomeCategories: () => void;
    onManageExpenseCategories: () => void;
    onManageRecurring: () => void;
    onDownloadJson: () => void;
    onUploadJson: () => void;
    onLogout: () => void;
}

const ApiKeySettingsCard: React.FC<{
    apiKey: string | null;
    onSave: (key: string) => void;
    onRemove: () => void;
}> = ({ apiKey, onSave, onRemove }) => {
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

const ThemeCustomizerCard: React.FC = () => {
    const { settings, updateSettings, cardClasses } = useTheme();

    const OptionButton = ({ label, value, settingKey, icon }: { label: string, value: string, settingKey: keyof ThemeSettings, icon: React.ReactNode }) => (
        <button
            onClick={() => updateSettings({ [settingKey]: value })}
            className={`flex-1 p-3 rounded-lg transition-colors text-sm font-semibold flex flex-col items-center gap-1 ${settings[settingKey] === value ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );

    const ToggleSwitch = ({ enabled, onChange, label, icon }: { enabled: boolean, onChange: (val: boolean) => void, label: string, icon: React.ReactNode }) => (
        <div className="flex items-center justify-between bg-gray-200 dark:bg-gray-700 p-3 rounded-lg">
            <div className="flex items-center gap-2">
                {icon}
                <span className="font-semibold text-sm">{label}</span>
            </div>
            <button
                onClick={() => onChange(!enabled)}
                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${enabled ? 'bg-primary' : 'bg-gray-400 dark:bg-gray-500'}`}
            >
                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </div>
    );
    
    return (
        <div className={`${cardClasses} rounded-xl p-6`}>
            <h3 className="text-lg font-bold text-gray-900 dark:text-text-primary mb-4">شخصی‌سازی ظاهر برنامه</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <h4 className="font-semibold text-gray-600 dark:text-text-secondary">تم</h4>
                    <div className="flex gap-2">
                        <OptionButton label="روشن" value="light" settingKey="themeMode" icon={<SunIcon />} />
                        <OptionButton label="تاریک" value="dark" settingKey="themeMode" icon={<MoonIcon />} />
                    </div>
                </div>
                 <div className="space-y-3">
                    <h4 className="font-semibold text-gray-600 dark:text-text-secondary">اندازه فونت</h4>
                    <div className="flex gap-2">
                        <OptionButton label="کوچک" value="sm" settingKey="fontSize" icon={<DocumentTextIcon className="h-4 w-4" />} />
                        <OptionButton label="متوسط" value="base" settingKey="fontSize" icon={<DocumentTextIcon className="h-5 w-5" />} />
                        <OptionButton label="بزرگ" value="lg" settingKey="fontSize" icon={<DocumentTextIcon className="h-6 w-6" />} />
                    </div>
                </div>
                <div className="space-y-3">
                    <h4 className="font-semibold text-gray-600 dark:text-text-secondary">سبک پس‌زمینه</h4>
                    <div className="flex gap-2">
                        <OptionButton label="ساده" value="solid" settingKey="backgroundStyle" icon={<div className="h-5 w-5 bg-gray-400 rounded-full" />} />
                        <OptionButton label="گرادینت" value="gradient" settingKey="backgroundStyle" icon={<div className="h-5 w-5 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full" />} />
                    </div>
                </div>
                 <div className="space-y-3">
                    <h4 className="font-semibold text-gray-600 dark:text-text-secondary">افکت‌ها</h4>
                    <ToggleSwitch 
                        enabled={settings.glassmorphism}
                        onChange={(value) => updateSettings({ glassmorphism: value })}
                        label="حالت شیشه‌ای"
                        icon={<SparklesIcon className="h-5 w-5" />}
                    />
                </div>
            </div>
        </div>
    );
};


const SettingsCard: React.FC<{ title: string; description: string; buttonText: string; icon: React.ReactNode; onButtonClick: () => void; }> = ({ title, description, buttonText, icon, onButtonClick }) => {
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

export const SettingsPage: React.FC<SettingsPageProps> = ({ 
    apiKey,
    onSaveApiKey,
    onRemoveApiKey,
    onManageIncomeCategories, 
    onManageExpenseCategories, 
    onManageRecurring, 
    onDownloadJson, 
    onUploadJson,
    onLogout
}) => {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <ThemeCustomizerCard />
            <ApiKeySettingsCard 
                apiKey={apiKey} 
                onSave={onSaveApiKey} 
                onRemove={onRemoveApiKey} 
            />
            <SettingsCard
                title="مدیریت دسته‌بندی‌های درآمد"
                description="دسته‌بندی‌های مربوط به منابع درآمد خود را اضافه، حذف یا ویرایش کنید."
                buttonText="مدیریت درآمدها"
                icon={<CogIcon />}
                onButtonClick={onManageIncomeCategories}
            />
            <SettingsCard
                title="مدیریت دسته‌بندی‌های هزینه"
                description="دسته‌بندی‌های مربوط به هزینه‌های خود را برای ردیابی بهتر مدیریت کنید."
                buttonText="مدیریت هزینه‌ها"
                icon={<CogIcon />}
                onButtonClick={onManageExpenseCategories}
            />
            <SettingsCard
                title="مدیریت تراکنش‌های تکراری"
                description="یادآورهایی برای پرداخت‌های منظم مانند اجاره یا حقوق تنظیم کنید."
                buttonText="مدیریت یادآورها"
                icon={<CalendarDaysIcon />}
                onButtonClick={onManageRecurring}
            />
            <SettingsCard
                title="خروجی داده‌ها"
                description="یک نسخه پشتیبان از تمام تراکنش‌ها و دسته‌بندی‌های خود در قالب فایل JSON دانلود کنید."
                buttonText="دانلود JSON"
                icon={<DownloadIcon />}
                onButtonClick={onDownloadJson}
            />
            <SettingsCard
                title="بارگذاری داده‌ها"
                description="داده‌های خود را از یک فایل پشتیبان JSON که قبلاً دانلود کرده‌اید، بازیابی کنید."
                buttonText="بارگذاری JSON"
                icon={<UploadIcon />}
                onButtonClick={onUploadJson}
            />
            <SettingsCard
                title="خروج از حساب"
                description="از حساب کاربری خود خارج شوید. برای ورود مجدد نیاز به نام کاربری و رمز عبور خواهید داشت."
                buttonText="خروج"
                icon={<LogoutIcon />}
                onButtonClick={onLogout}
            />
        </div>
    );
};