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
  
  // Add these additional methods for better functionality
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
  }
};

export default api;