import React, { useState, useEffect } from 'react';
import { useTheme } from '../../App';
import { AIVoiceSettings as AIVoiceSettingsType } from '../../types';
import { SpeakerWaveIcon } from '../Icons';

interface AIVoiceSettingsProps {
    settings: AIVoiceSettingsType;
    onUpdate: (settings: Partial<AIVoiceSettingsType>) => void;
}

export const AIVoiceSettings: React.FC<AIVoiceSettingsProps> = ({ settings, onUpdate }) => {
    const { cardClasses } = useTheme();
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

    useEffect(() => {
        const populateVoiceList = () => {
            if (!('speechSynthesis' in window)) return;
            const persianVoices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('fa'));
            
            if (persianVoices.length === 0) {
                setVoices([]);
                if (settings.voiceURI) {
                    onUpdate({ voiceURI: null });
                }
                return;
            }
            
            setVoices(persianVoices);

            const isCurrentVoiceValid = persianVoices.some(v => v.voiceURI === settings.voiceURI);
            if (!settings.voiceURI || !isCurrentVoiceValid) {
                onUpdate({ voiceURI: persianVoices[0].voiceURI });
            }
        };

        populateVoiceList();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = populateVoiceList;
        }
    }, [settings.voiceURI, onUpdate]);


    const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdate({ rate: parseFloat(e.target.value) });
    };

    const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onUpdate({ voiceURI: e.target.value });
    };

    return (
        <div className={`${cardClasses} rounded-xl p-6`}>
            <h3 className="text-lg font-bold text-gray-900 dark:text-text-primary mb-4 flex items-center gap-2"><SpeakerWaveIcon />تنظیمات صدای هوش مصنوعی</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="voice-select" className="block text-sm font-medium text-gray-600 dark:text-text-secondary mb-1">صدا (فقط فارسی)</label>
                    <select
                        id="voice-select"
                        value={settings.voiceURI || ''}
                        onChange={handleVoiceChange}
                        disabled={voices.length === 0}
                        className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-text-primary rounded-md border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary transition p-2.5"
                    >
                        {voices.length > 0 ? (
                            voices.map(voice => (
                                <option key={voice.voiceURI} value={voice.voiceURI}>
                                    {`${voice.name} (${voice.lang})`}
                                </option>
                            ))
                        ) : (
                            <option>صدای فارسی یافت نشد</option>
                        )}
                    </select>
                </div>
                <div>
                    <label htmlFor="rate-slider" className="block text-sm font-medium text-gray-600 dark:text-text-secondary mb-1">سرعت گفتار: <span className="font-bold">{settings.rate.toFixed(1)}x</span></label>
                    <input
                        type="range"
                        id="rate-slider"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={settings.rate}
                        onChange={handleRateChange}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
            </div>
             <p className="text-xs text-gray-400 mt-2">
                {voices.length === 0 
                    ? "مرورگر شما از گفتار فارسی پشتیبانی نمی‌کند. لطفاً یک صدای فارسی در سیستم‌عامل خود نصب کنید."
                    : "لیست صداهای فارسی موجود در مرورگر شما."
                }
            </p>
        </div>
    );
};
