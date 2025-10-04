import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { financialAPI } from '../utils/api';
import { 
  Plus, 
  Search, 
  Filter, 
  Wallet, 
  Utensils, 
  ShoppingBag, 
  Car, 
  Film, 
  Home, 
  Heart,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Trash2,
  Calendar,
  X
} from 'lucide-react';

const Transactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const [formData, setFormData] = useState({
    amount: '',
    category: 'food',
    description: '',
    type: 'expense'
  });

  const categories = [
    { value: 'food', label: 'Food & Dining', icon: Utensils, color: 'category-food' },
    { value: 'shopping', label: 'Shopping', icon: ShoppingBag, color: 'category-shopping' },
    { value: 'transport', label: 'Transport', icon: Car, color: 'category-transport' },
    { value: 'entertainment', label: 'Entertainment', icon: Film, color: 'category-entertainment' },
    { value: 'bills', label: 'Bills & Utilities', icon: Home, color: 'category-bills' },
    { value: 'healthcare', label: 'Healthcare', icon: Heart, color: 'category-healthcare' },
    { value: 'other', label: 'Other', icon: CreditCard, color: 'category-other' }
  ];

  useEffect(() => {
    if (user?.user_id) {
      fetchTransactions();
    }
  }, [user]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await financialAPI.getTransactions(user.user_id);
      if (response.data.success) {
        setTransactions(response.data.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      alert('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.description) {
      alert('Please fill in amount and description');
      return;
    }

    try {
      const response = await financialAPI.addTransaction(
        user.user_id,
        parseFloat(formData.amount),
        formData.category,
        formData.description,
        formData.type
      );

      if (response.data.success) {
        setFormData({
          amount: '',
          category: 'food',
          description: '',
          type: 'expense'
        });
        setShowForm(false);
        fetchTransactions();
        alert('Transaction added successfully!');
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Failed to add transaction');
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      await financialAPI.deleteTransaction(transactionId);
      fetchTransactions();
      alert('Transaction deleted successfully!');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Failed to delete transaction');
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesFilter = filter === 'all' || transaction.category === filter;
    const matchesSearch = transaction.description?.toLowerCase().includes(search.toLowerCase()) ||
                         transaction.category?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const netBalance = totalIncome - totalExpenses;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryIcon = (categoryValue) => {
    const category = categories.find(c => c.value === categoryValue);
    const IconComponent = category ? category.icon : CreditCard;
    return <IconComponent size={18} />;
  };

  const getCategoryClass = (categoryValue) => {
    const category = categories.find(c => c.value === categoryValue);
    return category ? category.color : 'category-other';
  };

  return (
    <div className="transactions-page">
      <div className="transactions-container">
        
        {/* Header */}
        <div className="transactions-header">
          <div className="header-content">
            <div className="header-title">
              <h1>Transactions</h1>
              <p>Manage your income and expenses</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="add-transaction-btn"
            >
              <Plus size={20} />
              Add Transaction
            </button>
          </div>
        </div>

        {/* Add Transaction Form Modal */}
        {showForm && (
          <div className="transaction-form-overlay">
            <div className="transaction-form-container">
              <div className="form-header">
                <h2>Add New Transaction</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="close-btn"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddTransaction}>
                {/* Transaction Type */}
                <div className="form-group">
                  <label className="form-label">Transaction Type</label>
                  <div className="type-selector">
                    <button
                      type="button"
                      className={`type-btn ${formData.type === 'income' ? 'active income' : ''}`}
                      onClick={() => setFormData({...formData, type: 'income'})}
                    >
                      <TrendingUp size={20} />
                      Income
                    </button>
                    <button
                      type="button"
                      className={`type-btn ${formData.type === 'expense' ? 'active expense' : ''}`}
                      onClick={() => setFormData({...formData, type: 'expense'})}
                    >
                      <TrendingDown size={20} />
                      Expense
                    </button>
                  </div>
                </div>

                {/* Amount and Category */}
                <div className="form-group">
                  <label className="form-label">Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="form-select"
                  >
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <input
                    type="text"
                    placeholder="What was this transaction for?"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>

                {/* Form Actions */}
                <div className="form-actions">
                  <button type="submit" className="submit-btn">
                    Add Transaction
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="summary-card income">
            <div className="summary-card-content">
              <div className="summary-icon">
                <TrendingUp size={24} />
              </div>
              <div className="summary-text">
                <h3>Total Income</h3>
                <p className="amount">{formatCurrency(totalIncome)}</p>
              </div>
            </div>
          </div>

          <div className="summary-card expense">
            <div className="summary-card-content">
              <div className="summary-icon">
                <TrendingDown size={24} />
              </div>
              <div className="summary-text">
                <h3>Total Expenses</h3>
                <p className="amount">{formatCurrency(totalExpenses)}</p>
              </div>
            </div>
          </div>

          <div className="summary-card net">
            <div className="summary-card-content">
              <div className="summary-icon">
                <Wallet size={24} />
              </div>
              <div className="summary-text">
                <h3>Net Balance</h3>
                <p className={`amount ${netBalance >= 0 ? 'positive' : 'negative'}`}>
                  {formatCurrency(netBalance)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="filters-section">
          <div className="filters-content">
            <div className="search-container">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Search transactions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="filter-container">
              <Filter size={20} className="filter-label" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="transactions-list-container">
          <div className="transactions-header-row">
            <h3>Transactions ({filteredTransactions.length})</h3>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p className="loading-text">Loading transactions...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredTransactions.length === 0 && (
            <div className="empty-state">
              <Wallet className="empty-icon" size={48} />
              <h3 className="empty-title">
                {transactions.length === 0 ? "No transactions yet" : "No transactions found"}
              </h3>
              <p className="empty-description">
                {transactions.length === 0 
                  ? "Get started by adding your first transaction!"
                  : "Try adjusting your search or filter criteria."
                }
              </p>
              {transactions.length === 0 && (
                <button
                  onClick={() => setShowForm(true)}
                  className="add-transaction-btn"
                >
                  <Plus size={20} />
                  Add Your First Transaction
                </button>
              )}
            </div>
          )}

          {/* Transactions List */}
          {!loading && filteredTransactions.length > 0 && (
            <ul className="transaction-items">
              {filteredTransactions.map((transaction) => (
                <li key={transaction.transaction_id || transaction._id} className="transaction-item">
                  <div className="transaction-content">
                    <div className="transaction-info">
                      <div className={`transaction-icon ${getCategoryClass(transaction.category)}`}>
                        {getCategoryIcon(transaction.category)}
                      </div>
                      <div className="transaction-details">
                        <h4 className="transaction-title">
                          {transaction.description || 'No description'}
                        </h4>
                        <div className="transaction-meta">
                          <span className="transaction-category capitalize">
                            {transaction.category}
                          </span>
                          <span className="transaction-date">
                            <Calendar size={14} />
                            {formatDate(transaction.date)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="transaction-actions">
                      <div className="transaction-amount">
                        <p className={`amount-value ${transaction.type}`}>
                          {transaction.type === 'income' ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </p>
                        <p className="amount-type">{transaction.type}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteTransaction(transaction.transaction_id || transaction._id)}
                        className="delete-btn"
                        title="Delete transaction"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Summary Footer */}
          {!loading && filteredTransactions.length > 0 && (
            <div className="transactions-footer">
              <div className="footer-content">
                <div className="footer-stats">
                  Showing {filteredTransactions.length} of {transactions.length} transactions
                </div>
                <div className="footer-totals">
                  <span className="income-total">Income: {formatCurrency(totalIncome)}</span>
                  <span className="expense-total">Expenses: {formatCurrency(totalExpenses)}</span>
                  <span className={`net-total ${netBalance >= 0 ? 'positive' : 'negative'}`}>
                    Net: {formatCurrency(netBalance)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Transactions;