import React from 'react';
import { SettingsCard } from './SettingsCard';
import { CogIcon, DownloadIcon, UploadIcon, CalendarDaysIcon } from '../Icons';

interface DataManagementProps {
    onManageIncomeCategories: () => void;
    onManageExpenseCategories: () => void;
    onManageRecurring: () => void;
    onDownloadJson: () => void;
    onUploadJson: () => void;
}

export const DataManagement: React.FC<DataManagementProps> = ({
    onManageIncomeCategories,
    onManageExpenseCategories,
    onManageRecurring,
    onDownloadJson,
    onUploadJson
}) => {
    return (
        <>
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
        </>
    );
};
