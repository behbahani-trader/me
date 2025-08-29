import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SparklesIcon, PaperAirplaneIcon, WalletIcon, KeyIcon, MicrophoneIcon, StopIcon, SpeakerWaveIcon } from './Icons';
import { Transaction, TransactionType, ChatMessage, Category, AIVoiceSettings } from '../types';
import { createAnalysisChat } from '../services/geminiService';
import { Chat } from '@google/genai';
import { useTheme } from '../App';

interface AnalysisProps {
    apiKey: string | null;
    transactions: Transaction[];
    addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
    expenseCategories: Category[];
    incomeCategories: Category[];
    aiVoiceSettings: AIVoiceSettings;
}

const suggestedPrompts = [
    "خلاصه‌ای از وضعیت مالی من بده",
    "بزرگترین هزینه‌های من در این ماه چیست؟",
    "آیا الگوی خرج کردن غیرعادی‌ای می‌بینی؟",
    "چگونه می‌توانم بیشتر پس‌انداز کنم؟"
];

const TypingIndicator: React.FC = () => (
    <div className="flex items-center space-x-1.5">
        <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce"></div>
    </div>
);

export const Analysis: React.FC<AnalysisProps> = ({ apiKey, transactions, addTransaction, expenseCategories, incomeCategories, aiVoiceSettings }) => {
    const { cardClasses } = useTheme();
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
    const [isSpeechSynthesisSupported, setIsSpeechSynthesisSupported] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        if (transactions.length > 0 && apiKey) {
            try {
                const newChat = createAnalysisChat(apiKey, transactions, expenseCategories, incomeCategories);
                setChat(newChat);
                 setMessages([
                    { id: crypto.randomUUID(), role: 'model', content: "سلام! من مشاور مالی هوش مصنوعی شما هستم. داده‌های شما را بررسی کردم و آماده‌ام تا به سوالات شما پاسخ دهم یا تراکنش‌های جدید را برایتان ثبت کنم. چطور می‌توانم به شما کمک کنم؟" }
                ]);
                setError('');
            } catch (err) {
                console.error("Failed to initialize chat:", err);
                setError("خطا در راه‌اندازی چت. لطفاً کلید API خود را بررسی کنید، ممکن است نامعتبر باشد.");
            }
        }
    }, [transactions, expenseCategories, incomeCategories, apiKey]);
    
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages, isLoading]);
    
    useEffect(() => {
        const checkSupport = () => {
            if ('speechSynthesis' in window) {
                const persianVoices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('fa'));
                setIsSpeechSynthesisSupported(persianVoices.length > 0);
            }
        };

        checkSupport();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = checkSupport;
        }

        return () => {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                 window.speechSynthesis.onvoiceschanged = null;
            }
        };
    }, []);

    const sendMessageToAI = useCallback(async (parts: any[], userDisplayMessage: string) => {
        if (isLoading || !chat) return;

        const newUserMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: userDisplayMessage };
        setMessages(prev => [...prev, newUserMessage]);
        setInput('');
        setIsLoading(true);
        setError('');

        try {
            const response = await chat.sendMessage({ message: parts });

            const functionCalls = response.functionCalls;

            if (functionCalls && functionCalls.length > 0) {
                const call = functionCalls[0];
                let toolResponsePayload;

                if (call.name === 'addTransactions') {
                    const transactionsToAdd = call.args.transactions;

                    if (!Array.isArray(transactionsToAdd) || transactionsToAdd.length === 0) {
                        throw new Error("هوش مصنوعی لیست نامعتبری از تراکنش‌ها را ارائه کرده است.");
                    }

                    let transactionsAddedCount = 0;
                    for (const tx of transactionsToAdd) {
                         if (
                            typeof tx.description !== 'string' || !tx.description ||
                            typeof tx.amount !== 'number' || tx.amount <= 0 ||
                            (tx.type !== TransactionType.INCOME && tx.type !== TransactionType.EXPENSE) ||
                            (tx.category !== undefined && typeof tx.category !== 'string')
                        ) {
                            console.warn("Skipping invalid transaction object from AI:", tx);
                            continue;
                        }

                        const newTx: Omit<Transaction, 'id'> = {
                            description: tx.description,
                            amount: tx.amount,
                            type: tx.type,
                            date: new Date().toISOString().split('T')[0],
                            expenseCategory: tx.type === TransactionType.EXPENSE ? tx.category as string : undefined,
                            incomeCategory: tx.type === TransactionType.INCOME ? tx.category as string : undefined,
                        };

                        await addTransaction(newTx);
                        transactionsAddedCount++;
                    }
                    
                    if (transactionsAddedCount > 0) {
                       toolResponsePayload = {
                           functionResponse: {
                                name: call.name,
                                response: { success: true, message: `${transactionsAddedCount} تراکنش با موفقیت ثبت شد.` },
                           }
                       };
                    } else {
                        throw new Error("هوش مصنوعی اطلاعات نامعتبر برای ثبت تراکنش ارائه کرده است.");
                    }

                } else if (call.name === 'getFinancialReport') {
                    const { startDate, endDate, transactionType, category } = call.args;

                    let filtered = [...transactions];
                    // FIX: Cast startDate to string to resolve TypeScript error.
                    if (startDate) filtered = filtered.filter(t => new Date(t.date) >= new Date(startDate as string));
                    // FIX: Cast endDate to string to resolve TypeScript error.
                    if (endDate) filtered = filtered.filter(t => new Date(t.date) <= new Date(endDate as string));
                    if (transactionType) filtered = filtered.filter(t => t.type === transactionType);
                    if (category) {
                        const key = transactionType === 'income' ? 'incomeCategory' : 'expenseCategory';
                        filtered = filtered.filter(t => t[key] === category);
                    }

                    const totalAmount = filtered.reduce((sum, t) => sum + t.amount, 0);
                    
                    const breakdown = filtered.reduce((acc, t) => {
                        const catKey = t.type === 'income' ? t.incomeCategory : t.expenseCategory;
                        if (catKey) {
                            const catLabel = (t.type === 'income' ? incomeCategories : expenseCategories).find(c => c.value === catKey)?.label || catKey;
                            acc[catLabel] = (acc[catLabel] || 0) + t.amount;
                        }
                        return acc;
                    }, {} as {[key: string]: number});

                    const reportResult = {
                        totalTransactions: filtered.length,
                        totalAmount,
                        breakdownByCategory: breakdown,
                    };

                    toolResponsePayload = {
                        functionResponse: {
                            name: call.name,
                            response: { report: reportResult },
                        }
                    };
                }

                if (toolResponsePayload) {
                     const toolResponse = await chat.sendMessage({ message: [toolResponsePayload] });
                     const finalModelMessage: ChatMessage = { id: crypto.randomUUID(), role: 'model', content: toolResponse.text };
                     setMessages(prev => [...prev, finalModelMessage]);
                }

            } else {
                const modelMessage: ChatMessage = { id: crypto.randomUUID(), role: 'model', content: response.text };
                setMessages(prev => [...prev, modelMessage]);
            }
        } catch (err) {
            console.error("AI Chat Error:", err);
            const errorMessage = "متاسفانه مشکلی در ارتباط با هوش مصنوعی پیش آمد. لطفاً دوباره تلاش کنید.";
            setError(errorMessage);
            setMessages(prev => prev.filter(m => m.id !== newUserMessage.id));
        } finally {
            setIsLoading(false);
        }
    }, [chat, isLoading, addTransaction, transactions, incomeCategories, expenseCategories]);


    const handleSend = async (prompt?: string) => {
        const messageToSend = prompt || input;
        if (!messageToSend.trim() || isLoading || isRecording) return;
        sendMessageToAI([{ text: messageToSend }], messageToSend);
    };

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
    }, []);

    const startRecording = useCallback(() => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    setIsRecording(true);
                    audioChunksRef.current = [];
                    const options = { mimeType: 'audio/webm' };
                    let mediaRecorder;
                     try {
                        mediaRecorder = new MediaRecorder(stream, options);
                    } catch (e) {
                        console.warn('audio/webm not supported, falling back');
                        mediaRecorder = new MediaRecorder(stream);
                    }
                    mediaRecorderRef.current = mediaRecorder;

                    mediaRecorder.addEventListener("dataavailable", event => {
                        audioChunksRef.current.push(event.data);
                    });

                    mediaRecorder.addEventListener("stop", () => {
                        const mimeType = mediaRecorder.mimeType;
                        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                        const reader = new FileReader();
                        reader.readAsDataURL(audioBlob);
                        reader.onloadend = () => {
                            const base64String = (reader.result as string).split(',')[1];
                            const audioPart = { inlineData: { mimeType, data: base64String } };
                            sendMessageToAI([audioPart], "[پیام صوتی ارسال شد]");
                        };
                        stream.getTracks().forEach(track => track.stop());
                    });

                    mediaRecorder.start();
                })
                .catch(err => {
                    console.error("Error accessing microphone:", err);
                    setError("دسترسی به میکروفون امکان‌پذیر نیست. لطفاً مجوزهای لازم را بررسی کنید.");
                    setIsRecording(false);
                });
        } else {
            setError("مرورگر شما از ضبط صدا پشتیبانی نمی‌کند.");
        }
    }, [sendMessageToAI]);
    
    const handleToggleRecording = useCallback(() => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    }, [isRecording, startRecording, stopRecording]);

    const handleSpeak = useCallback((message: ChatMessage) => {
        if (!isSpeechSynthesisSupported) {
            setError("مرورگر شما از گفتار فارسی پشتیبانی نمی‌کند.");
            return;
        }

        if (speakingMessageId === message.id) {
            window.speechSynthesis.cancel();
            setSpeakingMessageId(null);
            return;
        }

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(message.content);
        const voices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('fa'));
        
        if (voices.length === 0) {
            setError("هیچ صدای فارسی‌ای برای پخش یافت نشد.");
            return;
        }
        
        let voiceToUse = voices.find(v => v.voiceURI === aiVoiceSettings.voiceURI);

        if (!voiceToUse) {
            voiceToUse = voices[0];
        }
        
        utterance.voice = voiceToUse;
        utterance.rate = aiVoiceSettings.rate;
        utterance.lang = 'fa-IR';

        utterance.onstart = () => setSpeakingMessageId(message.id);
        utterance.onend = () => setSpeakingMessageId(null);
        utterance.onerror = (e) => {
            console.error("Speech synthesis error:", e);
            setError("خطا در پخش صدا.");
            setSpeakingMessageId(null);
        };

        window.speechSynthesis.speak(utterance);
    }, [aiVoiceSettings.rate, aiVoiceSettings.voiceURI, speakingMessageId, isSpeechSynthesisSupported]);

    
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    
    if (transactions.length === 0) {
        return (
            <div className={`${cardClasses} rounded-xl p-6 text-center flex flex-col items-center justify-center min-h-[400px]`}>
                <WalletIcon />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-text-primary mt-4 mb-2">اولین قدم را بردارید!</h3>
                <p className="text-gray-500 dark:text-text-secondary max-w-xs mx-auto">برای شروع تحلیل هوشمند، لطفاً ابتدا چند تراکنش در صفحه «تراکنش‌ها» اضافه کنید.</p>
            </div>
        );
    }
    
    if (!apiKey) {
        return (
            <div className={`${cardClasses} rounded-xl p-6 text-center flex flex-col items-center justify-center min-h-[400px]`}>
                <KeyIcon />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-text-primary mt-4 mb-2">کلید API مورد نیاز است!</h3>
                <p className="text-gray-500 dark:text-text-secondary max-w-sm mx-auto">برای فعال کردن مشاور هوشمند، لطفاً به صفحه «تنظیمات» بروید و کلید API گوگل Gemini خود را وارد کنید.</p>
            </div>
        );
    }


    return (
        <div className={`${cardClasses} rounded-xl flex flex-col h-[75vh]`}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-text-primary flex items-center gap-2">
                    <SparklesIcon />
                    مشاور مالی هوش مصنوعی
                </h2>
            </div>

            <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                       {msg.role === 'model' && (
                           <button 
                                onClick={() => handleSpeak(msg)}
                                className={`p-2 rounded-full transition-colors ${speakingMessageId === msg.id ? 'bg-primary/20 text-primary' : 'text-gray-400'} ${isSpeechSynthesisSupported ? 'hover:bg-gray-200 dark:hover:bg-gray-700' : 'opacity-50 cursor-not-allowed'}`}
                                aria-label={isSpeechSynthesisSupported ? "خواندن پیام" : "گفتار فارسی پشتیبانی نمی‌شود"}
                                disabled={!isSpeechSynthesisSupported}
                           >
                               <SpeakerWaveIcon className="w-4 h-4" />
                           </button>
                       )}
                        <div className={`max-w-lg lg:max-w-2xl px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-primary text-white rounded-br-lg' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-text-primary rounded-bl-lg'}`}>
                           <div className="prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br />') }} />
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-end gap-2 justify-start animate-fade-in-up">
                        <div className="max-w-lg lg:max-w-2xl px-4 py-3 rounded-2xl bg-gray-200 dark:bg-gray-700 rounded-bl-lg">
                            <TypingIndicator />
                        </div>
                    </div>
                )}
                {error && <p className="text-red-500 text-sm p-2">{error}</p>}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                 { !isLoading && messages.length <= 1 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                        {suggestedPrompts.map(prompt => (
                            <button
                                key={prompt}
                                onClick={() => handleSend(prompt)}
                                className="text-left text-sm p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
                            >
                                {prompt}
                            </button>
                        ))}
                    </div>
                )}
                <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-lg">
                    <button
                        onClick={handleToggleRecording}
                        disabled={isLoading}
                        className={`p-3 rounded-lg transition-colors ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-600 dark:text-gray-300'} disabled:text-gray-400 dark:disabled:text-gray-500 enabled:hover:bg-primary/10 dark:enabled:hover:bg-primary/80`}
                        aria-label={isRecording ? 'توقف ضبط' : 'شروع ضبط'}
                    >
                        {isRecording ? <StopIcon /> : <MicrophoneIcon />}
                    </button>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={isRecording ? "در حال ضبط... برای توقف دوباره کلیک کنید" : "یک پیام بنویسید یا صدایتان را ضبط کنید..."}
                        className="w-full bg-transparent text-gray-900 dark:text-text-primary focus:outline-none py-3 pr-1 placeholder-gray-500 dark:placeholder-gray-400"
                        disabled={isLoading || isRecording}
                    />
                    <button onClick={() => handleSend()} disabled={isLoading || !input.trim() || isRecording} className="p-3 text-primary dark:text-white disabled:text-gray-400 dark:disabled:text-gray-500 enabled:hover:bg-primary/10 dark:enabled:hover:bg-primary/80 rounded-lg transition-colors">
                        <PaperAirplaneIcon />
                    </button>
                </div>
            </div>
        </div>
    );
};