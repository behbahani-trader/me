import { GoogleGenAI, Chat, Type } from "@google/genai";
import { Transaction, Category } from '../types';

export function createAnalysisChat(
  apiKey: string,
  transactions: Transaction[],
  expenseCategories: Category[],
  incomeCategories: Category[]
): Chat {

  const ai = new GoogleGenAI({ apiKey });

  const transactionsJson = JSON.stringify(transactions.map(t => ({
    type: t.type,
    amount: t.amount,
    description: t.description,
    expenseCategory: t.expenseCategory,
    incomeCategory: t.incomeCategory,
    date: t.date.split('T')[0]
  })), null, 2);

  const expenseCategoryList = expenseCategories.map(c => `- ${c.label} (value: ${c.value})`).join('\n');
  const incomeCategoryList = incomeCategories.map(c => `- ${c.label} (value: ${c.value})`).join('\n');

  const systemInstruction = `
    شما یک مشاور مالی متخصص، خوش‌بین و مفید هستید. وظیفه شما تحلیل داده‌های تراکنش‌های مالی شخصی کاربر و پاسخ به سوالات اوست.
    شما دو ابزار قدرتمند در اختیار دارید:
    1. 'addTransactions': برای ثبت تراکنش‌های جدید.
    2. 'getFinancialReport': برای تحلیل و گزارش‌گیری از داده‌های موجود.

    **ابزار: addTransactions**
    - از این ابزار زمانی استفاده کنید که کاربر از شما می‌خواهد یک یا چند تراکنش را اضافه کنید.
    - اگر کاربر چندین مورد را در یک پیام ذکر کرد (مثلاً: '۵۰۰۰ تومان برای ناهار و ۲۰۰۰ تومان برای قهوه خرج کردم')، شما باید همه آنها را در یک فراخوانی ابزار به صورت لیستی از تراکنش‌ها ارسال کنید.
    - برای پارامتر 'category'، شما **باید** یکی از مقادیر معتبر دسته‌بندی را از لیست‌های زیر انتخاب کنید.

    **ابزار: getFinancialReport**
    - برای پاسخ به سوالات کاربر در مورد تاریخچه مالی او (مثلاً 'هزینه‌های ماه قبل من چقدر بود؟' یا 'بیشترین درآمد من از کجا بوده؟')، از این ابزار استفاده کنید.
    - پارامترهای لازم مانند بازه زمانی یا دسته‌بندی را از سوال کاربر استخراج کنید.

    **دسته‌بندی‌های هزینه موجود:**
    ${expenseCategoryList}

    **دسته‌بندی‌های درآمد موجود:**
    ${incomeCategoryList}

    لحن شما باید تشویق‌کننده، سازنده و بسیار دوستانه باشد. از پاسخ‌های کوتاه و مستقیم خودداری کنید و سعی کنید بینش‌های جالبی ارائه دهید.
    
    در ادامه داده‌های تراکنش‌های کاربر آمده است:
    \`\`\`json
    ${transactionsJson}
    \`\`\`
  `;
  
  const tools = [{
    functionDeclarations: [
      {
        name: "addTransactions",
        description: "یک یا چند تراکنش جدید درآمد یا هزینه را ثبت می‌کند.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            transactions: {
              type: Type.ARRAY,
              description: "لیستی از تراکنش‌ها برای افزودن.",
              items: {
                type: Type.OBJECT,
                properties: {
                  description: {
                    type: Type.STRING,
                    description: "توضیحی برای تراکنش، مثال: 'خرید از سوپرمارکت'",
                  },
                  amount: {
                    type: Type.NUMBER,
                    description: "مبلغ عددی تراکنش. باید یک عدد مثبت باشد.",
                  },
                  type: {
                    type: Type.STRING,
                    enum: ["income", "expense"],
                    description: "نوع تراکنش. 'income' برای وجه دریافتی، 'expense' برای وجه خرج شده.",
                  },
                  category: {
                    type: Type.STRING,
                    description: "مقدار (value) دسته‌بندی برای تراکنش. باید یکی از مقادیر معتبر ارائه شده باشد.",
                  },
                },
                required: ["description", "amount", "type"],
              },
            },
          },
          required: ["transactions"],
        },
      },
      {
        name: "getFinancialReport",
        description: "گزارشی از داده‌های مالی کاربر بر اساس فیلترهای مشخص شده (مانند بازه زمانی یا دسته‌بندی) ایجاد می‌کند. از این ابزار برای پاسخ به سوالات مربوط به جمع‌بندی، روندها یا جزئیات داده‌های مالی استفاده کنید.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                startDate: { type: Type.STRING, description: "تاریخ شروع گزارش (فرمت: YYYY-MM-DD)." },
                endDate: { type: Type.STRING, description: "تاریخ پایان گزارش (فرمت: YYYY-MM-DD)." },
                transactionType: { type: Type.STRING, enum: ["income", "expense"], description: "فیلتر بر اساس نوع تراکنش." },
                category: { type: Type.STRING, description: "فیلتر بر اساس مقدار (value) یک دسته‌بندی خاص." },
            },
            required: [],
        },
      },
    ],
  }];
  
  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: systemInstruction,
      tools: tools,
    },
  });
  return chat;
}