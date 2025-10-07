import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000, // Increased timeout for file uploads
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API functions
export const authAPI = {
  register: (userData) => api.post('/register', null, { params: userData }),
  login: (credentials) => api.post('/login', null, { params: credentials }),
};

// Fixed uploadAPI - using axios with proper FormData handling
export const uploadAPI = {
  uploadStatement: (file, userId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', userId);
    
    return api.post('/upload-bank-statement', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 45000, // 45 seconds for large files
    });
  },
  
  // NEW: Save extracted transactions to user profile
  saveExtractedTransactions: (user_id, statement_id, transactions) => {
    const formData = new FormData();
    formData.append('user_id', user_id);
    formData.append('statement_id', statement_id);
    formData.append('transactions_to_save', JSON.stringify(transactions));
    
    return api.post('/save-extracted-transactions', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // NEW: Get transactions from specific bank statement
  getStatementTransactions: (statement_id, user_id) => {
    return api.get(`/bank-statements/${statement_id}/transactions`, {
      params: { user_id }
    });
  },

  // NEW: Auto-categorize transactions
  categorizeTransactions: (transactions) => {
    return api.post('/categorize-transactions', transactions);
  },

  // NEW: Delete bank statement
  deleteBankStatement: (statement_id, user_id) => {
    return api.delete(`/bank-statements/${statement_id}`, {
      params: { user_id }
    });
  },

  // Existing methods
  getUserStatements: (userId) => api.get(`/bank-statements/${userId}`),
  getStatement: (statementId) => api.get(`/bank-statement/${statementId}`),
  deleteStatement: (statementId) => api.delete(`/bank-statement/${statementId}`),
};

// SINGLE financialAPI object (removed duplicate)
export const financialAPI = {
  // Add transaction - CORRECTED version that matches your backend
  addTransaction: (user_id, amount, category, description = "", type = "expense") => {
    const params = {
      user_id: user_id,
      amount: amount,
      category: category,
      description: description,
      transaction_type: type
    };
    return api.post('/transactions', null, { params });
  },

  // Get transactions
  getTransactions: (userId) => {
    return api.get(`/transactions/${userId}`);
  },

  // Delete transaction
  deleteTransaction: (transactionId) => {
    return api.delete(`/transactions/${transactionId}`);
  },

  // Get transactions summary
  getTransactionsSummary: (userId) => {
    return api.get(`/transactions/${userId}/summary`);
  },

  // Get insights
  getInsights: (userId) => {
    return api.get(`/insights/${userId}`);
  },

  // Get stock data
  getStockData: (symbol) => {
    return api.get(`/stock/${symbol}`);
  },

  // Create sample data - CORRECTED to use POST method
  createSampleData: (userId) => {
    return api.post(`/create-sample-data/${userId}`);
  },

  // NEW: Debug endpoint to check transactions
  debugTransactions: (userId = null) => {
    const params = userId ? { user_id: userId } : {};
    return api.get('/debug/transactions', { params });
  },

  // NEW: Test all features
  testAllFeatures: () => {
    return api.get('/test-all');
  },

  // NEW: Health check
  healthCheck: () => {
    return api.get('/health');
  },

  // NEW: Database test
  testDatabase: () => {
    return api.get('/test-db');
  }
};

// NEW: Utility functions for bank statement processing
export const bankStatementUtils = {
  // Format transaction for display
  formatTransaction: (transaction) => {
    return {
      ...transaction,
      formattedAmount: new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
      }).format(transaction.amount),
      displayDate: new Date(transaction.date).toLocaleDateString('en-IN'),
      type: transaction.type || (transaction.amount >= 0 ? 'credit' : 'debit')
    };
  },

  // Filter transactions by type
  filterTransactions: (transactions, type = 'all') => {
    if (type === 'all') return transactions;
    return transactions.filter(t => t.type === type);
  },

  // Calculate summary from transactions
  calculateSummary: (transactions) => {
    const totalIncome = transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const netFlow = totalIncome - totalExpenses;
    
    return {
      total_income: totalIncome,
      total_expenses: totalExpenses,
      net_flow: netFlow,
      transaction_count: transactions.length,
      average_transaction: transactions.length > 0 ? (totalIncome + totalExpenses) / transactions.length : 0
    };
  },

  // Validate transaction before saving
  validateTransaction: (transaction) => {
    const errors = [];
    
    if (!transaction.amount || isNaN(transaction.amount)) {
      errors.push('Invalid amount');
    }
    
    if (!transaction.description?.trim()) {
      errors.push('Description is required');
    }
    
    if (!transaction.date) {
      errors.push('Date is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};


export default api;