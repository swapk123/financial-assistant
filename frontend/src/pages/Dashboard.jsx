import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";
import { financialAPI } from "../utils/api";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PieChart,
  BarChart3,
  Plus,
  ArrowRight,
  Sparkles,
  CreditCard,
  ShoppingBag,
  Car,
  Film,
  Utensils,
  RefreshCw,
  AlertCircle,
  BanknoteIcon
} from "lucide-react";
import LoadingSpinner from "../components/common/LoadingSpinner";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [insights, setInsights] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const [insightsResponse, transactionsResponse] = await Promise.all([
        financialAPI.getInsights(user.user_id),
        financialAPI.getTransactions(user.user_id),
      ]);

      setInsights(insightsResponse.data);
      setTransactions(transactionsResponse.data.transactions || []);
    } catch (err) {
      console.error("Dashboard error:", err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
  };

  const createSampleData = async () => {
    try {
      setRefreshing(true);
      await financialAPI.createSampleData(user.user_id);
      await fetchDashboardData();
    } catch (err) {
      console.error("Failed to create sample data:", err);
      setError('Failed to create sample data. Please try again.');
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "food":
        return <Utensils size={20} />;
      case "shopping":
        return <ShoppingBag size={20} />;
      case "transport":
        return <Car size={20} />;
      case "entertainment":
        return <Film size={20} />;
      case "bills":
        return <CreditCard size={20} />;
      case "healthcare":
        return <TrendingUp size={20} />;
      default:
        return <CreditCard size={20} />;
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      food: 'food',
      shopping: 'shopping',
      transport: 'transport',
      entertainment: 'entertainment',
      bills: 'bills',
      healthcare: 'healthcare',
      other: 'other'
    };
    return colors[category] || 'other';
  };

  const getTransactionAmountDisplay = (transaction) => {
    const amount = transaction.amount;
    const sign = transaction.type === 'income' ? '+' : '-';
    return `${sign}₹${amount.toFixed(2)}`;
  };

  const getAmountColor = (transaction) => {
    return transaction.type === 'income' ? 'income' : 'expense';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const hasData = transactions.length > 0;

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="main-content">
          <div className="loading-container">
            <LoadingSpinner />
            <p>Loading your financial dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <TrendingUp size={24} />
          </div>
          <div className="sidebar-title">FinanceAI</div>
        </div>

        <nav className="sidebar-nav">
          <Link to="/dashboard" className="nav-item active">
            <BarChart3 />
            Dashboard
          </Link>
          <Link to="/transactions" className="nav-item">
            <Wallet />
            Transactions
          </Link>
          <Link to="/pdf-upload" className="nav-item">
            <BanknoteIcon />
            Bank Statements
          </Link>
          <Link to="/insights" className="nav-item">
            <PieChart />
            Insights
          </Link>
          <Link to="/stocks" className="nav-item">
            <TrendingUp />
            Stocks
          </Link>
        </nav>

        <div className="sidebar-user">
          <div className="user-info">
            <div className="user-avatar">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <div className="user-name">{user?.username}</div>
              <div className="user-email">{user?.email}</div>
            </div>
          </div>
          <button onClick={logout} className="logout-btn">
            <TrendingDown size={16} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Header with Refresh */}
        <div className="dashboard-header">
          <div className="header-content">
            <div className="header-title-section">
              <h1>Dashboard Overview</h1>
              <p>Your financial summary and recent activity</p>
            </div>
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="btn-refresh"
            >
              <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-card">
            <div className="error-icon">
              <AlertCircle size={24} />
            </div>
            <div className="error-content">
              <h3>Unable to Load Data</h3>
              <p>{error}</p>
            </div>
            <button onClick={fetchDashboardData} className="btn-retry">
              Try Again
            </button>
          </div>
        )}

        {/* Welcome Section */}
        <div className="welcome-card fade-in-up">
          <div className="welcome-content">
            <div className="welcome-text">
              <h1 className="welcome-title">
                Welcome back, {user?.username}! 👋
              </h1>
              <p className="welcome-subtitle">
                {hasData 
                  ? "Here's your financial overview for today" 
                  : "Get started by adding your first transaction"
                }
              </p>
            </div>
            <div className="welcome-actions">
              {!hasData && (
                <button onClick={createSampleData} className="btn-sample">
                  <Sparkles size={20} />
                  Generate Sample Data
                </button>
              )}
              <Link to="/transactions" className="btn-primary">
                <Plus size={20} />
                Add Transaction
              </Link>
            </div>
          </div>
        </div>

        {!hasData ? (
          /* Empty State */
          <div className="section-card fade-in-up">
            <div className="empty-state">
              <div className="empty-icon">
                <Wallet size={48} />
              </div>
              <h2 className="empty-title">No transactions yet</h2>
              <p className="empty-description">
                Start by adding transactions or generate sample data to see insights
              </p>
              <div className="empty-actions">
                <button onClick={createSampleData} className="btn-sample">
                  <Sparkles size={20} />
                  Generate Sample Data
                </button>
                <Link to="/transactions" className="btn-primary">
                  <Plus size={20} />
                  Add First Transaction
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* Dashboard with Data */
          <>
            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card fade-in-up">
                <div className="stat-content">
                  <div className="stat-info">
                    <div className="stat-label">Total Balance</div>
                    <div className="stat-value">
                      ₹{insights?.insights?.total_spending?.toFixed(2) || "0.00"}
                    </div>
                    <div className={`stat-change ${insights?.insights?.total_spending > 0 ? 'positive' : 'negative'}`}>
                      {insights?.insights?.total_spending > 0 ? (
                        <TrendingUp size={16} />
                      ) : (
                        <TrendingDown size={16} />
                      )}
                      Overall
                    </div>
                  </div>
                  <div className="stat-icon">
                    <Wallet size={24} />
                  </div>
                </div>
              </div>

              <div
                className="stat-card fade-in-up"
                style={{ animationDelay: "0.1s" }}
              >
                <div className="stat-content">
                  <div className="stat-info">
                    <div className="stat-label">Transactions</div>
                    <div className="stat-value">
                      {insights?.insights?.total_transactions || 0}
                    </div>
                    <div className="stat-change positive">
                      <TrendingUp size={16} />
                      All time
                    </div>
                  </div>
                  <div className="stat-icon">
                    <CreditCard size={24} />
                  </div>
                </div>
              </div>

              <div
                className="stat-card fade-in-up"
                style={{ animationDelay: "0.2s" }}
              >
                <div className="stat-content">
                  <div className="stat-info">
                    <div className="stat-label">Avg. Transaction</div>
                    <div className="stat-value">
                      ₹{insights?.insights?.average_spending?.toFixed(2) || "0.00"}
                    </div>
                    <div className="stat-change neutral">
                      <TrendingUp size={16} />
                      Per transaction
                    </div>
                  </div>
                  <div className="stat-icon">
                    <BarChart3 size={24} />
                  </div>
                </div>
              </div>

              <div
                className="stat-card fade-in-up"
                style={{ animationDelay: "0.3s" }}
              >
                <div className="stat-content">
                  <div className="stat-info">
                    <div className="stat-label">Top Category</div>
                    <div className="stat-value capitalize">
                      {insights?.insights?.most_used_category || "N/A"}
                    </div>
                    <div className="stat-change positive">
                      <TrendingUp size={16} />
                      Most used
                    </div>
                  </div>
                  <div className="stat-icon">
                    <PieChart size={24} />
                  </div>
                </div>
              </div>
            </div>

            {/* Content Grid */}
            <div className="content-grid">
              {/* Recent Transactions */}
              <div className="section-card slide-in-right">
                <div className="section-header">
                  <h2 className="section-title">Recent Transactions</h2>
                  <Link to="/transactions" className="section-action">
                    View All <ArrowRight size={16} />
                  </Link>
                </div>
                <div className="transaction-list">
                  {transactions.slice(0, 6).map((transaction) => (
                    <div
                      key={transaction.transaction_id}
                      className="transaction-item"
                    >
                      <div className="transaction-info">
                        <div
                          className={`transaction-icon ${getCategoryColor(
                            transaction.category
                          )}`}
                        >
                          {getCategoryIcon(transaction.category)}
                        </div>
                        <div className="transaction-details">
                          <div className="transaction-name">
                            {transaction.description || "No description"}
                          </div>
                          <div className="transaction-meta">
                            <span className="transaction-category capitalize">
                              {transaction.category}
                            </span>
                            <span className="transaction-date">
                              {formatDate(transaction.date)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className={`transaction-amount ${getAmountColor(transaction)}`}>
                        {getTransactionAmountDisplay(transaction)}
                      </div>
                    </div>
                  ))}
                </div>
                {transactions.length === 0 && (
                  <div className="empty-transactions">
                    <Wallet size={32} />
                    <p>No transactions found</p>
                  </div>
                )}
              </div>

              {/* AI Recommendations */}
              <div
                className="section-card slide-in-right"
                style={{ animationDelay: "0.1s" }}
              >
                <div className="section-header">
                  <h2 className="section-title">AI Recommendations</h2>
                  <Link to="/insights" className="section-action">
                    More <ArrowRight size={16} />
                  </Link>
                </div>
                <div className="recommendation-list">
                  {insights?.recommendations?.length > 0 ? (
                    insights.recommendations.map((recommendation, index) => (
                      <div key={index} className="recommendation-item">
                        <div className="recommendation-icon">
                          <Sparkles size={16} />
                        </div>
                        <div className="recommendation-text">
                          {recommendation}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-recommendations">
                      <Sparkles size={32} />
                      <p>Add more transactions to get personalized recommendations</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions-section">
              <h3>Quick Actions</h3>
              <div className="quick-actions-grid">
                <Link to="/transactions" className="quick-action-card">
                  <Plus size={24} />
                  <span>Add Transaction</span>
                </Link>
                <Link to="/pdf-upload" className="quick-action-card">
                  <BanknoteIcon size={24} />
                  <span>Upload Statement</span>
                </Link>
                <Link to="/insights" className="quick-action-card">
                  <PieChart size={24} />
                  <span>View Insights</span>
                </Link>
                <Link to="/stocks" className="quick-action-card">
                  <TrendingUp size={24} />
                  <span>Check Stocks</span>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;