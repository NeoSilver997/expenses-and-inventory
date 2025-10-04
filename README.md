# Expenses and Inventory Tracker

A modern web application for tracking expenses and managing your financial records. Built with React and Node.js/Express.

## Features

- 💰 **Expense Tracking**: Add, view, and delete expenses
- 📊 **Statistics Dashboard**: View total expenses, count, and averages
- 🏷️ **Categories**: Organize expenses by categories (Food, Transportation, Entertainment, etc.)
- 📅 **Date Tracking**: Record when expenses occurred
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

## Project Structure

```
expenses-and-inventory/
├── public/
│   └── index.html          # HTML template
├── server/
│   └── index.js            # Express backend server
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

## Future Enhancements

- 💾 Persistent database storage (SQLite, PostgreSQL)
- 🔐 User authentication and authorization
- 📈 Advanced charts and visualizations
- 📱 Mobile app version
- 💸 Budget planning and alerts
- 🔍 Search and filter functionality
- 📤 Export data (CSV, PDF)
- 🌍 Multi-currency support

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC License
