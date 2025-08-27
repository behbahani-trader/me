import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataFile = join(__dirname, 'data.json');

const DEFAULT_DATA = {
  transactions: [],
  expenseCategories: [
    { value: 'food', label: 'غذا' },
    { value: 'transport', label: 'حمل و نقل' },
    { value: 'entertainment', label: 'سرگرمی' },
    { value: 'bills', label: 'قبوض' },
    { value: 'other', label: 'متفرقه' }
  ],
  incomeCategories: [
    { value: 'salary', label: 'حقوق' },
    { value: 'freelance', label: 'فریلنس' },
    { value: 'gift', label: 'هدیه' },
    { value: 'other', label: 'متفرقه' }
  ],
  recurringTransactions: [],
  apiKey: null
};

function loadData() {
  if (!existsSync(dataFile)) {
    return DEFAULT_DATA;
  }
  try {
    return JSON.parse(readFileSync(dataFile, 'utf-8'));
  } catch {
    return DEFAULT_DATA;
  }
}

function saveData() {
  writeFileSync(dataFile, JSON.stringify(db, null, 2));
}

let db = loadData();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/data', (req, res) => {
  res.json({
    transactions: db.transactions,
    expenseCategories: db.expenseCategories,
    incomeCategories: db.incomeCategories,
    recurringTransactions: db.recurringTransactions
  });
});

app.post('/api/transactions', (req, res) => {
  const newTx = { id: randomUUID(), ...req.body };
  db.transactions.unshift(newTx);
  saveData();
  res.json(newTx);
});

app.put('/api/transactions/:id', (req, res) => {
  const idx = db.transactions.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).end();
  db.transactions[idx] = req.body;
  saveData();
  res.json(db.transactions[idx]);
});

app.delete('/api/transactions/:id', (req, res) => {
  db.transactions = db.transactions.filter(t => t.id !== req.params.id);
  saveData();
  res.json({ id: req.params.id });
});

function createCategory(label) {
  return {
    label,
    value: label.toLowerCase().replace(/\s+/g, '-') + '-' + randomUUID().slice(0, 4)
  };
}

app.post('/api/expense-categories', (req, res) => {
  const cat = createCategory(req.body.label);
  db.expenseCategories.push(cat);
  saveData();
  res.json(cat);
});

app.put('/api/expense-categories/:value', (req, res) => {
  const cat = db.expenseCategories.find(c => c.value === req.params.value);
  if (!cat) return res.status(404).end();
  cat.label = req.body.label;
  saveData();
  res.json(cat);
});

app.delete('/api/expense-categories/:value', (req, res) => {
  db.expenseCategories = db.expenseCategories.filter(c => c.value !== req.params.value);
  db.transactions = db.transactions.map(t => {
    if (t.expenseCategory === req.params.value) {
      const { expenseCategory, ...rest } = t;
      return rest;
    }
    return t;
  });
  saveData();
  res.json({ value: req.params.value });
});

app.post('/api/income-categories', (req, res) => {
  const cat = createCategory(req.body.label);
  db.incomeCategories.push(cat);
  saveData();
  res.json(cat);
});

app.put('/api/income-categories/:value', (req, res) => {
  const cat = db.incomeCategories.find(c => c.value === req.params.value);
  if (!cat) return res.status(404).end();
  cat.label = req.body.label;
  saveData();
  res.json(cat);
});

app.delete('/api/income-categories/:value', (req, res) => {
  db.incomeCategories = db.incomeCategories.filter(c => c.value !== req.params.value);
  db.transactions = db.transactions.map(t => {
    if (t.incomeCategory === req.params.value) {
      const { incomeCategory, ...rest } = t;
      return rest;
    }
    return t;
  });
  saveData();
  res.json({ value: req.params.value });
});

app.post('/api/recurring', (req, res) => {
  const rec = { id: randomUUID(), lastAddedDate: null, ...req.body };
  db.recurringTransactions.push(rec);
  saveData();
  res.json(rec);
});

app.put('/api/recurring/:id', (req, res) => {
  const idx = db.recurringTransactions.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).end();
  db.recurringTransactions[idx] = req.body;
  saveData();
  res.json(db.recurringTransactions[idx]);
});

app.delete('/api/recurring/:id', (req, res) => {
  db.recurringTransactions = db.recurringTransactions.filter(r => r.id !== req.params.id);
  saveData();
  res.json({ id: req.params.id });
});

app.post('/api/recurring/process', (req, res) => {
  const { transactions, recurringTransactions } = req.body;
  db.transactions = transactions;
  db.recurringTransactions = recurringTransactions;
  saveData();
  res.status(204).end();
});

app.post('/api/replace-data', (req, res) => {
  db.transactions = req.body.transactions;
  db.expenseCategories = req.body.expenseCategories;
  db.incomeCategories = req.body.incomeCategories;
  saveData();
  res.status(204).end();
});

app.get('/api/apikey', (req, res) => {
  res.json({ apiKey: db.apiKey });
});

app.post('/api/apikey', (req, res) => {
  db.apiKey = req.body.key;
  saveData();
  res.json({ apiKey: db.apiKey });
});

app.delete('/api/apikey', (req, res) => {
  db.apiKey = null;
  saveData();
  res.status(204).end();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

