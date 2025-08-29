import React from 'react';
import { useTheme } from '../../App';
import { ThemeSettings } from '../../types';
import { SunIcon, MoonIcon, DocumentTextIcon, SparklesIcon } from '../Icons';

export const ThemeCustomizer: React.FC = () => {
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
