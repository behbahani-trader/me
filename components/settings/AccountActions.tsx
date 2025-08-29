import React from 'react';
import { SettingsCard } from './SettingsCard';
import { LogoutIcon } from '../Icons';

interface AccountActionsProps {
    onLogout: () => void;
}

export const AccountActions: React.FC<AccountActionsProps> = ({ onLogout }) => {
    return (
         <SettingsCard
            title="خروج از حساب"
            description="از حساب کاربری خود خارج شوید. برای ورود مجدد نیاز به نام کاربری و رمز عبور خواهید داشت."
            buttonText="خروج"
            icon={<LogoutIcon />}
            onButtonClick={onLogout}
        />
    );
}
