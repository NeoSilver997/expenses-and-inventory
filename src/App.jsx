import { useState, useEffect, useRef } from 'react';
import Tesseract from 'tesseract.js';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

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
  const [showMonthlyAnalytics, setShowMonthlyAnalytics] = useState(true);
  const [monthlyStats, setMonthlyStats] = useState({ monthly: [], predictions: {} });
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [showOcrReview, setShowOcrReview] = useState(false);
  const [showCropTool, setShowCropTool] = useState(false);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [ocrLanguage, setOcrLanguage] = useState('eng+chi_tra');
  const imgRef = useRef(null);

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

  // Fetch monthly statistics
  const fetchMonthlyStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/expenses/stats/monthly`);
      const data = await response.json();
      setMonthlyStats(data);
    } catch (error) {
      console.error('Error fetching monthly stats:', error);
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchStats();
    fetchInventory();
    fetchMonthlyStats();
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
        fetchMonthlyStats();
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
      // Reset OCR results when a new file is selected
      setOcrResult(null);
      setShowOcrReview(false);
      setShowCropTool(false);
      setCompletedCrop(null);
    }
  };

  // Function to get cropped image blob
  const getCroppedImg = (image, crop) => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.95);
    });
  };

  // Extract data from receipt using OCR
  const handleOcrExtraction = async (language = ocrLanguage) => {
    if (!slipFile) {
      alert('Please upload a receipt image first!');
      return;
    }

    setOcrProcessing(true);
    setOcrResult(null);
    setShowCropTool(false);

    try {
      let imageToProcess = slipFile;

      // If user cropped the image, use the cropped version
      if (completedCrop && imgRef.current) {
        const croppedBlob = await getCroppedImg(imgRef.current, completedCrop);
        imageToProcess = croppedBlob;
      }

      const result = await Tesseract.recognize(
        imageToProcess,
        language,
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
            }
          }
        }
      );

      const text = result.data.text;
      console.log('OCR Text:', text);

      // Parse the OCR text to extract meaningful data
      const extracted = parseReceiptText(text);
      setOcrResult(extracted);
      setShowOcrReview(true);

      // Auto-fill form with extracted data
      if (extracted.amount) {
        setFormData(prev => ({ ...prev, amount: extracted.amount }));
      }
      if (extracted.description) {
        setFormData(prev => ({ ...prev, description: extracted.description }));
      }
      if (extracted.date) {
        setFormData(prev => ({ ...prev, date: extracted.date }));
      }
      if (extracted.items && extracted.items.length > 0) {
        setInventoryItems(extracted.items);
      }

    } catch (error) {
      console.error('OCR Error:', error);
      alert('Failed to extract data from the receipt. Please try again or enter manually.');
    } finally {
      setOcrProcessing(false);
    }
  };

  // Parse receipt text to extract structured data
  const parseReceiptText = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    const extracted = {
      description: '',
      amount: '',
      date: '',
      items: []
    };

    // Extract total amount (looking for patterns like $XX.XX, TOTAL $XX.XX, etc.)
    const amountPatterns = [
      /(?:total|amount|sum)[\s:]*\$?\s*(\d+\.?\d{0,2})/i,
      /\$\s*(\d+\.\d{2})/,
      /(\d+\.\d{2})\s*(?:total|amount)/i
    ];

    for (const pattern of amountPatterns) {
      const match = text.match(pattern);
      if (match) {
        extracted.amount = match[1];
        break;
      }
    }

    // Extract date (looking for various date formats)
    const datePatterns = [
      /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/,
      /(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/,
      /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{4})/i
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          const parsedDate = new Date(match[1]);
          if (!isNaN(parsedDate)) {
            extracted.date = parsedDate.toISOString().split('T')[0];
            break;
          }
        } catch (e) {
          console.log('Date parsing error:', e);
        }
      }
    }

    // Extract merchant/store name as description (usually first few lines)
    const merchantLines = lines.slice(0, 3).filter(line => 
      line.length > 3 && 
      !line.match(/\d{10,}/) && // Not a phone number
      !line.match(/address|street|rd|ave|blvd/i) // Not an address
    );
    if (merchantLines.length > 0) {
      extracted.description = merchantLines[0].trim();
    }

    // Extract line items (looking for item name followed by price)
    const itemPattern = /^([a-zA-Z\s]+?)\s+\$?(\d+\.\d{2})$/;
    lines.forEach(line => {
      const match = line.trim().match(itemPattern);
      if (match && match[2] !== extracted.amount) {
        extracted.items.push({
          name: match[1].trim(),
          quantity: 1,
          category: 'food'
        });
      }
    });

    // If no items found, try simpler pattern
    if (extracted.items.length === 0) {
      lines.forEach(line => {
        const simple = line.trim().match(/^([a-zA-Z][a-zA-Z\s]{2,})/);
        if (simple && 
            !line.match(/total|subtotal|tax|address|phone|thank/i) &&
            line.length < 30) {
          extracted.items.push({
            name: simple[1].trim(),
            quantity: 1,
            category: 'food'
          });
        }
      });
      // Limit to first 5 items to avoid noise
      extracted.items = extracted.items.slice(0, 5);
    }

    return extracted;
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
        fetchMonthlyStats();
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
        fetchMonthlyStats();
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

  // Format month-year string for display
  const formatMonthYear = (monthKey) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

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

      {/* Monthly Analytics Section */}
      <div className="monthly-analytics">
        <div className="analytics-header">
          <h2>📊 Monthly Analytics</h2>
          <button 
            onClick={() => setShowMonthlyAnalytics(!showMonthlyAnalytics)} 
            className="btn-toggle"
          >
            {showMonthlyAnalytics ? 'Hide' : 'Show'} Analytics
          </button>
        </div>

        {showMonthlyAnalytics && (
          <>
            {/* Predictions Section */}
            {Object.keys(monthlyStats.predictions).length > 0 && (
              <div className="predictions-section">
                <h3>🔮 Next Month Predictions</h3>
                <p className="prediction-description">Based on your spending patterns from the last 3 months</p>
                <div className="predictions-grid">
                  <div className="prediction-card prediction-total">
                    <h4>Predicted Total</h4>
                    <div className="prediction-value">${monthlyStats.predictions._total?.toFixed(2) || '0.00'}</div>
                  </div>
                  {Object.entries(monthlyStats.predictions)
                    .filter(([key]) => key !== '_total')
                    .map(([category, amount]) => (
                      <div key={category} className="prediction-card">
                        <h4>{category.charAt(0).toUpperCase() + category.slice(1)}</h4>
                        <div className="prediction-value">${amount.toFixed(2)}</div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Monthly Breakdown */}
            <div className="monthly-breakdown">
              <h3>📅 Expenses by Month</h3>
              {monthlyStats.monthly.length === 0 ? (
                <div className="empty-state">
                  <p>No expense data yet. Add some expenses to see monthly analytics!</p>
                </div>
              ) : (
                monthlyStats.monthly.map((month) => (
                  <div key={month.month} className="month-card">
                    <div className="month-header">
                      <h4>{formatMonthYear(month.month)}</h4>
                      <div className="month-total">
                        <span className="total-label">Total:</span>
                        <span className="total-amount">${month.total.toFixed(2)}</span>
                        <span className="expense-count">({month.count} expense{month.count !== 1 ? 's' : ''})</span>
                      </div>
                    </div>
                    <div className="category-breakdown">
                      {Object.entries(month.byCategory).map(([category, amount]) => {
                        const percentage = (amount / month.total * 100).toFixed(1);
                        return (
                          <div key={category} className="category-item">
                            <div className="category-info">
                              <span className="category-badge">{category.charAt(0).toUpperCase() + category.slice(1)}</span>
                              <span className="category-amount">${amount.toFixed(2)}</span>
                            </div>
                            <div className="category-bar-container">
                              <div 
                                className="category-bar" 
                                style={{ width: `${percentage}%` }}
                              />
                              <span className="category-percentage">{percentage}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
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
        <p className="form-description">Upload a receipt/slip image and use OCR to automatically extract expense details, or enter them manually</p>
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
            {slipPreview && !showCropTool && (
              <div className="slip-preview">
                <img src={slipPreview} alt="Slip preview" />
              </div>
            )}
          </div>

          {slipPreview && showCropTool && (
            <div className="crop-container">
              <h3>✂️ Crop Image (Optional)</h3>
              <p className="crop-hint">Drag to select the area you want to OCR. This helps improve accuracy.</p>
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
              >
                <img
                  ref={imgRef}
                  src={slipPreview}
                  alt="Crop preview"
                  style={{ maxWidth: '100%' }}
                />
              </ReactCrop>
              <div className="crop-actions">
                <button
                  type="button"
                  onClick={() => {
                    setShowCropTool(false);
                    setCompletedCrop(null);
                  }}
                  className="btn btn-secondary"
                >
                  Cancel Crop
                </button>
                <button
                  type="button"
                  onClick={() => setShowCropTool(false)}
                  className="btn btn-primary"
                >
                  Done Cropping
                </button>
              </div>
            </div>
          )}

          {slipFile && !ocrProcessing && !showOcrReview && !showCropTool && (
            <div className="ocr-action">
              <div className="ocr-controls">
                <div className="form-group">
                  <label htmlFor="ocr-language">OCR Language</label>
                  <select
                    id="ocr-language"
                    value={ocrLanguage}
                    onChange={(e) => setOcrLanguage(e.target.value)}
                    className="language-select"
                  >
                    <option value="eng">English Only</option>
                    <option value="chi_tra">Traditional Chinese Only</option>
                    <option value="eng+chi_tra">English + Traditional Chinese</option>
                  </select>
                </div>
              </div>
              <div className="ocr-buttons">
                <button
                  type="button"
                  onClick={() => setShowCropTool(true)}
                  className="btn btn-crop"
                >
                  ✂️ Crop Image
                </button>
                <button
                  type="button"
                  onClick={() => handleOcrExtraction(ocrLanguage)}
                  className="btn btn-ocr"
                >
                  🤖 Extract Data with OCR
                </button>
              </div>
              <p className="ocr-hint">Optionally crop the image to focus on the receipt area, then extract expense details</p>
            </div>
          )}

          {ocrProcessing && (
            <div className="ocr-processing">
              <div className="loader"></div>
              <p>Processing receipt with OCR... This may take a few seconds.</p>
            </div>
          )}

          {showOcrReview && ocrResult && (
            <div className="ocr-review">
              <h3>📋 OCR Results - Review & Edit</h3>
              <div className="ocr-result-box">
                <p className="ocr-info">The following data was extracted from your receipt. Please review and edit as needed:</p>
                {ocrResult.description && (
                  <div className="ocr-field">
                    <strong>Description:</strong> {ocrResult.description}
                  </div>
                )}
                {ocrResult.amount && (
                  <div className="ocr-field">
                    <strong>Amount:</strong> ${ocrResult.amount}
                  </div>
                )}
                {ocrResult.date && (
                  <div className="ocr-field">
                    <strong>Date:</strong> {ocrResult.date}
                  </div>
                )}
                {ocrResult.items && ocrResult.items.length > 0 && (
                  <div className="ocr-field">
                    <strong>Items found:</strong> {ocrResult.items.length} item(s)
                    <ul className="ocr-items-list">
                      {ocrResult.items.map((item, idx) => (
                        <li key={idx}>{item.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="ocr-note">✏️ You can edit the fields below before submitting.</p>
              </div>
            </div>
          )}

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
