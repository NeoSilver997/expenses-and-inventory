const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// In-memory storage for expenses (in production, use a database)
let expenses = [];
let nextId = 1;

// API Routes

// Get all expenses
app.get('/api/expenses', (req, res) => {
  res.json(expenses);
});

// Get expense by ID
app.get('/api/expenses/:id', (req, res) => {
  const expense = expenses.find(e => e.id === parseInt(req.params.id));
  if (!expense) {
    return res.status(404).json({ error: 'Expense not found' });
  }
  res.json(expense);
});

// Create new expense
app.post('/api/expenses', (req, res) => {
  const { description, amount, category, date } = req.body;
  
  if (!description || !amount || !category) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const newExpense = {
    id: nextId++,
    description,
    amount: parseFloat(amount),
    category,
    date: date || new Date().toISOString(),
    createdAt: new Date().toISOString()
  };

  expenses.push(newExpense);
  res.status(201).json(newExpense);
});

// Update expense
app.put('/api/expenses/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = expenses.findIndex(e => e.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  const { description, amount, category, date } = req.body;
  expenses[index] = {
    ...expenses[index],
    description: description || expenses[index].description,
    amount: amount !== undefined ? parseFloat(amount) : expenses[index].amount,
    category: category || expenses[index].category,
    date: date || expenses[index].date
  };

  res.json(expenses[index]);
});

// Delete expense
app.delete('/api/expenses/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = expenses.findIndex(e => e.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  expenses.splice(index, 1);
  res.status(204).send();
});

// Get expense statistics
app.get('/api/expenses/stats/summary', (req, res) => {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const byCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  res.json({
    total,
    count: expenses.length,
    byCategory
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
