import React, { useState, useEffect, useRef } from 'react';
import { SparklesIcon, PaperAirplaneIcon, WalletIcon, KeyIcon } from './Icons';
import { Transaction, TransactionType, ChatMessage, Category } from '../types';
import { createAnalysisChat } from '../services/geminiService';
import { Chat } from '@google/genai';
import { useTheme } from '../App';

interface AnalysisProps {
    apiKey: string | null;
    transactions: Transaction[];
    addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
    expenseCategories: Category[];
    incomeCategories: Category[];
}

const suggestedPrompts = [
    "خلاصه‌ای از وضعیت مالی من بده",
    "بزرگترین هزینه‌های من در این ماه چیست؟",
    "آیا الگوی خرج کردن غیرعادی‌ای می‌بینی؟",
    "چگونه می‌توانم بیشتر پس‌انداز کنم؟"
];

const TypingIndicator: React.FC = () => (
    <div className="flex items-center space-x-1 p-3">
        <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce"></div>
    </div>
);

export const Analysis: React.FC<AnalysisProps> = ({ apiKey, transactions, addTransaction, expenseCategories, incomeCategories }) => {
    const { cardClasses } = useTheme();
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (transactions.length > 0 && apiKey) {
            try {
                const newChat = createAnalysisChat(apiKey, transactions, expenseCategories, incomeCategories);
                setChat(newChat);
                 setMessages([
                    { role: 'model', content: "سلام! من مشاور مالی هوش مصنوعی شما هستم. داده‌های شما را بررسی کردم و آماده‌ام تا تراکنش‌های جدید را برایتان ثبت کنم. چطور می‌توانم به شما کمک کنم؟" }
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
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, isLoading]);


    const handleSend = async (prompt?: string) => {
        const messageToSend = prompt || input;
        if (!messageToSend.trim() || isLoading || !chat) return;

        const newUserMessage: ChatMessage = { role: 'user', content: messageToSend };
        setMessages(prev => [...prev, newUserMessage]);
        setInput('');
        setIsLoading(true);
        setError('');

        try {
            const response = await chat.sendMessage({ message: messageToSend });

            const functionCalls = response.functionCalls;

            if (functionCalls && functionCalls.length > 0) {
                const call = functionCalls[0];
                if (call.name === 'addTransaction') {
                    if (
                        typeof call.args.description !== 'string' || !call.args.description ||
                        typeof call.args.amount !== 'number' ||
                        (call.args.type !== TransactionType.INCOME && call.args.type !== TransactionType.EXPENSE) ||
                        (call.args.category !== undefined && typeof call.args.category !== 'string')
                    ) {
                        throw new Error("هوش مصنوعی اطلاعات ناقصی برای ثبت تراکنش ارائه کرده است.");
                    }

                    const newTx: Omit<Transaction, 'id'> = {
                        description: call.args.description,
                        amount: call.args.amount,
                        type: call.args.type,
                        date: new Date().toISOString().split('T')[0],
                        // FIX: Cast `call.args.category` to string as its type has been validated.
                        expenseCategory: call.args.type === TransactionType.EXPENSE ? call.args.category as string : undefined,
                        // FIX: Cast `call.args.category` to string as its type has been validated.
                        incomeCategory: call.args.type === TransactionType.INCOME ? call.args.category as string : undefined,
                    };

                    await addTransaction(newTx);

                    const toolResponse = await chat.sendMessage({
                        message: [{
                            functionResponse: {
                                name: call.name,
                                response: { success: true, message: "تراکنش با موفقیت ثبت شد." },
                            }
                        }],
                    });

                    const finalModelMessage: ChatMessage = { role: 'model', content: toolResponse.text };
                    setMessages(prev => [...prev, finalModelMessage]);
                }
            } else {
                const modelMessage: ChatMessage = { role: 'model', content: response.text };
                setMessages(prev => [...prev, modelMessage]);
            }
        } catch (err) {
            console.error("AI Chat Error:", err);
            const errorMessage = "متاسفانه مشکلی در ارتباط با هوش مصنوعی پیش آمد. لطفاً دوباره تلاش کنید.";
            setError(errorMessage);
            setMessages(prev => prev.filter(m => m !== newUserMessage));
        } finally {
            setIsLoading(false);
        }
    };
    
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
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-lg lg:max-w-2xl px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-primary text-white rounded-br-lg' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-text-primary rounded-bl-lg'}`}>
                           <div className="prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br />') }} />
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <TypingIndicator />
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
                <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-lg pr-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="یک پیام بنویسید یا یک تراکنش را وارد کنید..."
                        className="w-full bg-transparent text-gray-900 dark:text-text-primary focus:outline-none py-3 placeholder-gray-500 dark:placeholder-gray-400"
                        disabled={isLoading}
                    />
                    <button onClick={() => handleSend()} disabled={isLoading || !input.trim()} className="p-3 text-primary dark:text-white disabled:text-gray-400 dark:disabled:text-gray-500 enabled:hover:bg-primary/10 dark:enabled:hover:bg-primary/80 rounded-lg transition-colors">
                        <PaperAirplaneIcon />
                    </button>
                </div>
            </div>
        </div>
    );
};
