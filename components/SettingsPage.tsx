import React from 'react';
import { AIVoiceSettings } from '../types';
import { ApiKeySettings } from './settings/ApiKeySettings';
import { ThemeCustomizer } from './settings/ThemeCustomizer';
import { AIVoiceSettings as AIVoiceSettingsComponent } from './settings/AIVoiceSettings';
import { DataManagement } from './settings/DataManagement';
import { AccountActions } from './settings/AccountActions';

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
    aiVoiceSettings: AIVoiceSettings;
    onUpdateAiVoiceSettings: (settings: Partial<AIVoiceSettings>) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ 
    apiKey,
    onSaveApiKey,
    onRemoveApiKey,
    onManageIncomeCategories, 
    onManageExpenseCategories, 
    onManageRecurring, 
    onDownloadJson, 
    onUploadJson,
    onLogout,
    aiVoiceSettings,
    onUpdateAiVoiceSettings
}) => {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <ThemeCustomizer />
            <ApiKeySettings 
                apiKey={apiKey} 
                onSave={onSaveApiKey} 
                onRemove={onRemoveApiKey} 
            />
            <AIVoiceSettingsComponent
                settings={aiVoiceSettings}
                onUpdate={onUpdateAiVoiceSettings}
            />
            <DataManagement
                onManageIncomeCategories={onManageIncomeCategories}
                onManageExpenseCategories={onManageExpenseCategories}
                onManageRecurring={onManageRecurring}
                onDownloadJson={onDownloadJson}
                onUploadJson={onUploadJson}
            />
            <AccountActions onLogout={onLogout} />
        </div>
    );
};
