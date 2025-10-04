import { useState, useEffect } from 'react';

const API_BASE = '/api';

function App() {
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState({ total: 0, count: 0, byCategory: {} });
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'food',
    date: new Date().toISOString().split('T')[0]
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [slipFile, setSlipFile] = useState(null);
  const [slipPreview, setSlipPreview] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([{ name: '', quantity: 1, category: 'food' }]);
  const [showInventory, setShowInventory] = useState(false);

  // Fetch expenses from API
  const fetchExpenses = async () => {
    try {
      const response = await fetch(`${API_BASE}/expenses`);
      const data = await response.json();
      setExpenses(data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/expenses/stats/summary`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Fetch inventory items
  const fetchInventory = async () => {
    try {
      const response = await fetch(`${API_BASE}/inventory`);
      const data = await response.json();
      setInventory(data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchStats();
    fetchInventory();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${API_BASE}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setFormData({
          description: '',
          amount: '',
          category: 'food',
          date: new Date().toISOString().split('T')[0]
        });
        fetchExpenses();
        fetchStats();
      }
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  // Handle slip file selection
  const handleSlipFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSlipFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setSlipPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle slip form submission with file upload
  const handleSlipSubmit = async (e) => {
    e.preventDefault();
    
    const formDataWithFile = new FormData();
    if (slipFile) {
      formDataWithFile.append('slip', slipFile);
    }
    formDataWithFile.append('description', formData.description);
    formDataWithFile.append('amount', formData.amount);
    formDataWithFile.append('category', formData.category);
    formDataWithFile.append('date', formData.date);
    
    // Add inventory items if any are filled
    const validItems = inventoryItems.filter(item => item.name.trim() !== '');
    if (validItems.length > 0) {
      formDataWithFile.append('items', JSON.stringify(validItems));
    }

    try {
      const response = await fetch(`${API_BASE}/slips/create-expense`, {
        method: 'POST',
        body: formDataWithFile
      });

      if (response.ok) {
        setFormData({
          description: '',
          amount: '',
          category: 'food',
          date: new Date().toISOString().split('T')[0]
        });
        setSlipFile(null);
        setSlipPreview(null);
        setInventoryItems([{ name: '', quantity: 1, category: 'food' }]);
        fetchExpenses();
        fetchStats();
        fetchInventory();
      }
    } catch (error) {
      console.error('Error adding expense from slip:', error);
    }
  };

  // Handle inventory item changes
  const handleInventoryItemChange = (index, field, value) => {
    const newItems = [...inventoryItems];
    newItems[index][field] = value;
    setInventoryItems(newItems);
  };

  // Add inventory item field
  const addInventoryItem = () => {
    setInventoryItems([...inventoryItems, { name: '', quantity: 1, category: 'food' }]);
  };

  // Remove inventory item field
  const removeInventoryItem = (index) => {
    if (inventoryItems.length > 1) {
      const newItems = inventoryItems.filter((_, i) => i !== index);
      setInventoryItems(newItems);
    }
  };

  // Delete inventory item
  const handleDeleteInventory = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/inventory/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchInventory();
      }
    } catch (error) {
      console.error('Error deleting inventory item:', error);
    }
  };

  // Handle expense deletion
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/expenses/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchExpenses();
        fetchStats();
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  // Filter expenses based on search term and category
  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || expense.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="app">
      <header className="app-header">
        <h1>💰 Expense Tracker</h1>
        <p>Manage your expenses and stay on budget</p>
      </header>

      {/* Statistics Dashboard */}
      <div className="stats">
        <div className="stat-card">
          <h3>Total Expenses</h3>
          <div className="value">${stats.total.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <h3>Number of Expenses</h3>
          <div className="value">{stats.count}</div>
        </div>
        <div className="stat-card">
          <h3>Average Expense</h3>
          <div className="value">
            ${stats.count > 0 ? (stats.total / stats.count).toFixed(2) : '0.00'}
          </div>
        </div>
      </div>

      {/* Add Expense Form */}
      <div className="expense-form">
        <h2>Add New Expense</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <input
              type="text"
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="What did you spend on?"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="amount">Amount ($)</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="food">Food & Dining</option>
              <option value="transportation">Transportation</option>
              <option value="entertainment">Entertainment</option>
              <option value="utilities">Utilities</option>
              <option value="healthcare">Healthcare</option>
              <option value="shopping">Shopping</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="date">Date</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn">
            Add Expense
          </button>
        </form>
      </div>

      {/* Scan Slip Form */}
      <div className="expense-form slip-form">
        <h2>📸 Scan Slip to Import Expense</h2>
        <p className="form-description">Upload a receipt/slip image and enter expense details</p>
        <form onSubmit={handleSlipSubmit}>
          <div className="form-group">
            <label htmlFor="slip-file">Upload Receipt/Slip Image</label>
            <input
              type="file"
              id="slip-file"
              accept="image/*,application/pdf"
              onChange={handleSlipFileChange}
              className="file-input"
            />
            {slipPreview && (
              <div className="slip-preview">
                <img src={slipPreview} alt="Slip preview" />
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="slip-description">Description</label>
            <input
              type="text"
              id="slip-description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="What did you spend on?"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="slip-amount">Amount ($)</label>
            <input
              type="number"
              id="slip-amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="slip-category">Category</label>
            <select
              id="slip-category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="food">Food & Dining</option>
              <option value="transportation">Transportation</option>
              <option value="entertainment">Entertainment</option>
              <option value="utilities">Utilities</option>
              <option value="healthcare">Healthcare</option>
              <option value="shopping">Shopping</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="slip-date">Date</label>
            <input
              type="date"
              id="slip-date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="inventory-section">
            <h3>Add Items to Inventory (Optional)</h3>
            {inventoryItems.map((item, index) => (
              <div key={index} className="inventory-item-row">
                <input
                  type="text"
                  placeholder="Item name"
                  value={item.name}
                  onChange={(e) => handleInventoryItemChange(index, 'name', e.target.value)}
                  className="inventory-input"
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => handleInventoryItemChange(index, 'quantity', e.target.value)}
                  min="1"
                  className="inventory-input-small"
                />
                <select
                  value={item.category}
                  onChange={(e) => handleInventoryItemChange(index, 'category', e.target.value)}
                  className="inventory-select"
                >
                  <option value="food">Food</option>
                  <option value="transportation">Transportation</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="utilities">Utilities</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="shopping">Shopping</option>
                  <option value="other">Other</option>
                </select>
                {inventoryItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeInventoryItem(index)}
                    className="btn-remove"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addInventoryItem} className="btn-add-item">
              + Add Item
            </button>
          </div>

          <button type="submit" className="btn">
            Import from Slip
          </button>
        </form>
      </div>

      {/* Search and Filter */}
      <div className="search-filter">
        <h2>Search & Filter Expenses</h2>
        <div className="search-filter-controls">
          <div className="form-group">
            <label htmlFor="search">Search by Description</label>
            <input
              type="text"
              id="search"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="filter">Filter by Category</label>
            <select
              id="filter"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="food">Food & Dining</option>
              <option value="transportation">Transportation</option>
              <option value="entertainment">Entertainment</option>
              <option value="utilities">Utilities</option>
              <option value="healthcare">Healthcare</option>
              <option value="shopping">Shopping</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <div className="expenses-list">
        <h2>Recent Expenses</h2>
        {filteredExpenses.length === 0 && expenses.length > 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
            <p>No expenses match your search or filter criteria.</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
            <p>No expenses yet. Add your first expense above!</p>
          </div>
        ) : (
          filteredExpenses.map((expense) => (
            <div key={expense.id} className="expense-item">
              <div className="expense-info">
                <h3>{expense.description}</h3>
                <div className="expense-meta">
                  <span className="category-badge">{expense.category}</span>
                  <span>{new Date(expense.date).toLocaleDateString()}</span>
                  {expense.slipImage && (
                    <span className="slip-badge">📎 Has Receipt</span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div className="expense-amount">
                  ${expense.amount.toFixed(2)}
                </div>
                <button
                  onClick={() => handleDelete(expense.id)}
                  className="btn btn-delete"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Inventory Section */}
      <div className="inventory-list">
        <div className="inventory-header">
          <h2>📦 Inventory</h2>
          <button 
            onClick={() => setShowInventory(!showInventory)} 
            className="btn-toggle"
          >
            {showInventory ? 'Hide' : 'Show'} Inventory
          </button>
        </div>
        
        {showInventory && (
          <>
            {inventory.length === 0 ? (
              <div className="empty-state">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 2H4c-1 0-2 .9-2 2v3.01c0 .72.43 1.34 1 1.69V20c0 1.1 1.1 2 2 2h14c.9 0 2-.9 2-2V8.7c.57-.35 1-.97 1-1.69V4c0-1.1-1-2-2-2zm-5 12H9v-2h6v2zm5-7H4V4h16v3z"/>
                </svg>
                <p>No inventory items yet. Add items through slip scanning!</p>
              </div>
            ) : (
              <div className="inventory-grid">
                {inventory.map((item) => (
                  <div key={item.id} className="inventory-card">
                    <div className="inventory-card-header">
                      <h3>{item.name}</h3>
                      <button
                        onClick={() => handleDeleteInventory(item.id)}
                        className="btn-remove-small"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="inventory-card-body">
                      <div className="inventory-detail">
                        <span className="label">Quantity:</span>
                        <span className="value">{item.quantity}</span>
                      </div>
                      <div className="inventory-detail">
                        <span className="label">Category:</span>
                        <span className="category-badge">{item.category}</span>
                      </div>
                      <div className="inventory-detail">
                        <span className="label">Added:</span>
                        <span className="value">{new Date(item.addedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
