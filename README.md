# Expenses and Inventory Tracker

A modern web application for tracking expenses and managing your financial records. Built with React and Node.js/Express.

## Features

- 💰 **Expense Tracking**: Add, view, and delete expenses
- 📸 **Slip Scanning**: Upload receipt/slip images to import expenses
- 📦 **Inventory Management**: Track items purchased and manage inventory
- 📊 **Statistics Dashboard**: View total expenses, count, and averages
- 🏷️ **Categories**: Organize expenses by categories (Food, Transportation, Entertainment, etc.)
- 📅 **Date Tracking**: Record when expenses occurred
- 🔍 **Search & Filter**: Search expenses by description and filter by category
- 🎨 **Modern UI**: Beautiful, responsive design with gradient styling
- ⚡ **Fast**: Built with Vite for optimal performance

## Tech Stack

### Frontend
- **React 19**: Modern UI library
- **Vite**: Fast build tool and dev server
- **CSS3**: Custom styling with gradients and animations

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **CORS**: Cross-origin resource sharing
- **Body Parser**: Request body parsing middleware
- **Multer**: File upload handling middleware

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/NeoSilver997/expenses-and-inventory.git
cd expenses-and-inventory
```

2. Install dependencies:
```bash
npm install
```

### Running the Application

#### Development Mode

You need to run both the backend server and the frontend development server:

1. **Start the backend server** (in one terminal):
```bash
npm run server
```
The API server will run on http://localhost:3001

2. **Start the frontend development server** (in another terminal):
```bash
npm run dev
```
The frontend will run on http://localhost:3000

3. Open your browser and navigate to http://localhost:3000

#### Production Build

1. Build the frontend:
```bash
npm run build
```

2. Preview the production build:
```bash
npm run preview
```

## API Endpoints

### Expenses

- `GET /api/expenses` - Get all expenses
- `GET /api/expenses/:id` - Get a specific expense
- `POST /api/expenses` - Create a new expense
  ```json
  {
    "description": "Grocery shopping",
    "amount": 45.50,
    "category": "food",
    "date": "2024-01-15"
  }
  ```
- `PUT /api/expenses/:id` - Update an expense
- `DELETE /api/expenses/:id` - Delete an expense

### Statistics

- `GET /api/expenses/stats/summary` - Get expense statistics
  ```json
  {
    "total": 450.00,
    "count": 10,
    "byCategory": {
      "food": 200.00,
      "transportation": 150.00,
      "entertainment": 100.00
    }
  }
  ```

### Slips (Receipt Uploads)

- `POST /api/slips/upload` - Upload a slip/receipt image
  - Accepts multipart/form-data with a file field named `slip`
  - Returns the uploaded file information
- `POST /api/slips/create-expense` - Create expense from slip with optional inventory items
  - Accepts multipart/form-data with:
    - `slip` (file) - Receipt/slip image (optional)
    - `description` (string) - Expense description
    - `amount` (number) - Expense amount
    - `category` (string) - Expense category
    - `date` (string) - Expense date
    - `items` (JSON string) - Array of inventory items to add
  ```json
  {
    "expense": {
      "id": 1,
      "description": "Grocery Shopping",
      "amount": 23.18,
      "category": "food",
      "date": "2025-10-04",
      "slipImage": "/uploads/slip-1234567890.png"
    },
    "inventoryItems": [
      {
        "id": 1,
        "name": "Milk",
        "quantity": 1,
        "category": "food",
        "expenseId": 1
      }
    ]
  }
  ```

### Inventory

- `GET /api/inventory` - Get all inventory items
- `GET /api/inventory/:id` - Get a specific inventory item
- `POST /api/inventory` - Create a new inventory item
  ```json
  {
    "name": "Milk",
    "quantity": 2,
    "category": "food",
    "expenseId": 1
  }
  ```
- `PUT /api/inventory/:id` - Update an inventory item
- `DELETE /api/inventory/:id` - Delete an inventory item

## Project Structure

```
expenses-and-inventory/
├── public/
│   └── index.html          # HTML template
├── server/
│   ├── index.js            # Express backend server
│   └── uploads/            # Uploaded receipt/slip images
├── src/
│   ├── App.jsx             # Main React component
│   ├── main.jsx            # React entry point
│   └── index.css           # Global styles
├── .gitignore              # Git ignore rules
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite configuration
└── README.md               # This file
```

## Available Categories

- Food & Dining
- Transportation
- Entertainment
- Utilities
- Healthcare
- Shopping
- Other

## How to Use Slip Scanning

1. **Upload a Receipt**: In the "📸 Scan Slip to Import Expense" section, click on the file upload button to select a receipt/slip image (supports JPG, PNG, GIF, PDF)
2. **Enter Expense Details**: Fill in the description, amount, category, and date from the receipt
3. **Add Inventory Items** (Optional): Add individual items from the receipt to track your inventory
   - Click "+ Add Item" to add more items
   - Enter the item name, quantity, and category for each item
4. **Import**: Click "Import from Slip" to create the expense and add inventory items
5. **View Results**: 
   - The expense will appear in "Recent Expenses" with a "📎 Has Receipt" badge
   - Click "Show Inventory" to view all inventory items

## Future Enhancements

- 🤖 OCR (Optical Character Recognition) to automatically extract data from receipts
- 💾 Persistent database storage (SQLite, PostgreSQL)
- 🔐 User authentication and authorization
- 📈 Advanced charts and visualizations
- 📱 Mobile app version
- 💸 Budget planning and alerts
- 📤 Export data (CSV, PDF)
- 🌍 Multi-currency support
- 🔔 Low inventory alerts

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC License
