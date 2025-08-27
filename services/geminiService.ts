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
    شما همچنین یک ابزار قدرتمند برای کمک به کاربر در اختیار دارید: 'addTransaction'.

    **ابزار: addTransaction**
    - از این ابزار زمانی استفاده کنید که کاربر از شما می‌خواهد یک تراکنش اضافه کنید، یا متنی شبیه به پیامک بانکی مربوط به واریز ('واریز') یا برداشت ('برداشت') ارائه می‌دهد.
    - توضیحات، مبلغ و نوع تراکنش را از پیام کاربر استخراج کنید.
    - برای پارامتر 'category'، شما **باید** یکی از مقادیر معتبر دسته‌بندی را از لیست‌های زیر انتخاب کنید. سعی کنید منطقی‌ترین گزینه را انتخاب کنید. اگر مطمئن نیستید، می‌توانید از کاربر برای شفاف‌سازی سوال کنید.
    - همیشه برای واریز از نوع 'income' و برای برداشت از نوع 'expense' استفاده کنید.

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
        name: "addTransaction",
        description: "یک تراکنش جدید درآمد یا هزینه را ثبت می‌کند.",
        parameters: {
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