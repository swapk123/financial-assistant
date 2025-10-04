import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { financialAPI } from '../utils/api';
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
  Utensils
} from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [insights, setInsights] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [insightsResponse, transactionsResponse] = await Promise.all([
        financialAPI.getInsights(user.user_id),
        financialAPI.getTransactions(user.user_id)
      ]);

      setInsights(insightsResponse.data);
      setTransactions(transactionsResponse.data.transactions || []);
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const createSampleData = async () => {
    try {
      await financialAPI.createSampleData(user.user_id);
      fetchDashboardData();
    } catch (err) {
      console.error('Failed to create sample data:', err);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'food': return <Utensils size={20} />;
      case 'shopping': return <ShoppingBag size={20} />;
      case 'transport': return <Car size={20} />;
      case 'entertainment': return <Film size={20} />;
      default: return <CreditCard size={20} />;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'food': return 'food';
      case 'shopping': return 'shopping';
      case 'transport': return 'transport';
      case 'entertainment': return 'entertainment';
      default: return 'food';
    }
  };

  const hasData = transactions.length > 0;

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
            <Wallet />
           PDFUpload
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
        {/* Welcome Section */}
        <div className="welcome-card fade-in-up">
          <div className="welcome-content">
            <h1 className="welcome-title">
              Welcome back, {user?.username}! 👋
            </h1>
            <p className="welcome-subtitle">
              Here's your financial overview for today
            </p>
            {!hasData && (
              <button onClick={createSampleData} className="btn-sample">
                <Sparkles size={20} />
                Generate Sample Data
              </button>
            )}
          </div>
        </div>

        {!hasData ? (
          /* Empty State */
          <div className="section-card fade-in-up">
            <div className="empty-state">
              <div className="empty-icon">
                <Wallet size={32} />
              </div>
              <h2 className="empty-title">No transactions yet</h2>
              <p className="empty-description">
                Start by adding transactions or generate sample data to see insights
              </p>
              <button onClick={createSampleData} className="btn-sample">
                <Plus size={20} />
                Generate Sample Data
              </button>
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
                    <div className="stat-label">Total Spending</div>
                    <div className="stat-value">
                      ${insights?.insights?.total_spending?.toFixed(2) || '0.00'}
                    </div>
                    <div className="stat-change negative">
                      <TrendingDown size={16} />
                      This month
                    </div>
                  </div>
                  <div className="stat-icon">
                    <Wallet size={24} />
                  </div>
                </div>
              </div>

              <div className="stat-card fade-in-up" style={{animationDelay: '0.1s'}}>
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

              <div className="stat-card fade-in-up" style={{animationDelay: '0.2s'}}>
                <div className="stat-content">
                  <div className="stat-info">
                    <div className="stat-label">Avg. Spending</div>
                    <div className="stat-value">
                      ${insights?.insights?.average_spending?.toFixed(2) || '0.00'}
                    </div>
                    <div className="stat-change positive">
                      <TrendingUp size={16} />
                      Per transaction
                    </div>
                  </div>
                  <div className="stat-icon">
                    <BarChart3 size={24} />
                  </div>
                </div>
              </div>

              <div className="stat-card fade-in-up" style={{animationDelay: '0.3s'}}>
                <div className="stat-content">
                  <div className="stat-info">
                    <div className="stat-label">Top Category</div>
                    <div className="stat-value capitalize">
                      {insights?.insights?.most_used_category || 'N/A'}
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
                  {transactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.transaction_id} className="transaction-item">
                      <div className="transaction-info">
                        <div className={`transaction-icon ${getCategoryColor(transaction.category)}`}>
                          {getCategoryIcon(transaction.category)}
                        </div>
                        <div className="transaction-details">
                          <div className="transaction-name">
                            {transaction.description || 'No description'}
                          </div>
                          <div className="transaction-meta capitalize">
                            {transaction.category} • {new Date(transaction.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="transaction-amount">
                        -${transaction.amount}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Recommendations */}
              <div className="section-card slide-in-right" style={{animationDelay: '0.1s'}}>
                <div className="section-header">
                  <h2 className="section-title">AI Recommendations</h2>
                  <Link to="/insights" className="section-action">
                    More <ArrowRight size={16} />
                  </Link>
                </div>
                <div className="recommendation-list">
                  {insights?.recommendations?.map((recommendation, index) => (
                    <div key={index} className="recommendation-item">
                      <div className="recommendation-icon">
                        <Sparkles size={16} />
                      </div>
                      <div className="recommendation-text">
                        {recommendation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;