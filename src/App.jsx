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

  useEffect(() => {
    fetchExpenses();
    fetchStats();
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
    </div>
  );
}

export default App;
