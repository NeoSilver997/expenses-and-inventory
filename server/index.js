const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'slip-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, JPG, PNG, GIF) and PDF are allowed!'));
    }
  }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(uploadsDir));

// In-memory storage for expenses and inventory (in production, use a database)
let expenses = [];
let nextId = 1;
let inventory = [];
let nextInventoryId = 1;

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

// Upload slip/receipt image
app.post('/api/slips/upload', upload.single('slip'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const slipData = {
    filename: req.file.filename,
    originalName: req.file.originalname,
    path: `/uploads/${req.file.filename}`,
    size: req.file.size,
    uploadedAt: new Date().toISOString()
  };

  res.status(201).json(slipData);
});

// Create expense from slip with manual data entry
app.post('/api/slips/create-expense', upload.single('slip'), (req, res) => {
  const { description, amount, category, date, items } = req.body;
  
  if (!description || !amount || !category) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const slipPath = req.file ? `/uploads/${req.file.filename}` : null;

  const newExpense = {
    id: nextId++,
    description,
    amount: parseFloat(amount),
    category,
    date: date || new Date().toISOString(),
    slipImage: slipPath,
    createdAt: new Date().toISOString()
  };

  expenses.push(newExpense);

  // If items are provided, add them to inventory
  const addedItems = [];
  if (items) {
    try {
      const itemsArray = JSON.parse(items);
      itemsArray.forEach(item => {
        const newItem = {
          id: nextInventoryId++,
          name: item.name,
          quantity: parseInt(item.quantity) || 1,
          category: item.category || category,
          expenseId: newExpense.id,
          addedAt: new Date().toISOString()
        };
        inventory.push(newItem);
        addedItems.push(newItem);
      });
    } catch (error) {
      console.error('Error parsing items:', error);
    }
  }

  res.status(201).json({
    expense: newExpense,
    inventoryItems: addedItems
  });
});

// Inventory API Routes

// Get all inventory items
app.get('/api/inventory', (req, res) => {
  res.json(inventory);
});

// Get inventory item by ID
app.get('/api/inventory/:id', (req, res) => {
  const item = inventory.find(i => i.id === parseInt(req.params.id));
  if (!item) {
    return res.status(404).json({ error: 'Inventory item not found' });
  }
  res.json(item);
});

// Create new inventory item
app.post('/api/inventory', (req, res) => {
  const { name, quantity, category, expenseId } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const newItem = {
    id: nextInventoryId++,
    name,
    quantity: parseInt(quantity) || 1,
    category: category || 'other',
    expenseId: expenseId || null,
    addedAt: new Date().toISOString()
  };

  inventory.push(newItem);
  res.status(201).json(newItem);
});

// Update inventory item
app.put('/api/inventory/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = inventory.findIndex(i => i.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Inventory item not found' });
  }

  const { name, quantity, category } = req.body;
  inventory[index] = {
    ...inventory[index],
    name: name || inventory[index].name,
    quantity: quantity !== undefined ? parseInt(quantity) : inventory[index].quantity,
    category: category || inventory[index].category
  };

  res.json(inventory[index]);
});

// Delete inventory item
app.delete('/api/inventory/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = inventory.findIndex(i => i.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Inventory item not found' });
  }

  inventory.splice(index, 1);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
