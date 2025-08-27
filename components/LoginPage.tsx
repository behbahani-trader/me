import React, { useState } from 'react';
import { useTheme } from '../App';
import { KeyIcon, SparklesIcon } from './Icons';

interface LoginPageProps {
    onLogin: (username: string, password: string) => boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const { cardClasses } = useTheme();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const success = onLogin(username, password);
        if (!success) {
            setError('نام کاربری یا رمز عبور اشتباه است.');
        }
    };
    
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100 dark:bg-background">
            <div className={`w-full max-w-md ${cardClasses} rounded-xl p-8 space-y-6 transform transition-all`}>
                <div className="text-center">
                    <SparklesIcon className="mx-auto h-12 w-12 text-primary" />
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-text-primary mt-2">
                        ورود به دستیار مالی
                    </h1>
                    <p className="text-gray-500 dark:text-text-secondary">
                        برای ادامه اطلاعات خود را وارد کنید.
                    </p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-600 dark:text-text-secondary mb-1">
                            نام کاربری
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-text-primary rounded-md border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary transition py-2.5 px-3"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-600 dark:text-text-secondary mb-1">
                            رمز عبور
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-text-primary rounded-md border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary transition py-2.5 px-3"
                            required
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <div>
                        <button
                            type="submit"
                            className="w-full flex justify-center items-center gap-2 bg-primary hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 transform hover:scale-105"
                        >
                            <KeyIcon />
                            <span>ورود</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
