import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";
import { financialAPI } from "../utils/api";
import {
  PieChart,
  BarChart3,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  RefreshCw,
  DollarSign,
  CreditCard,
  Target,
  Heart,
  Sparkles,
} from "lucide-react";
import LoadingSpinner from "../components/common/LoadingSpinner";

const Insights = () => {
  const { user } = useAuth();
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchInsights();
  }, [user]);

  const fetchInsights = async () => {
    try {
      const response = await financialAPI.getInsights(user.user_id);
      setInsights(response.data);
    } catch (err) {
      console.error("Insights error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInsights();
  };

  const getHealthScore = (spending) => {
    if (spending < 300)
      return { score: 85, label: "Excellent", status: "excellent" };
    if (spending < 600) return { score: 70, label: "Good", status: "good" };
    if (spending < 1000) return { score: 55, label: "Fair", status: "fair" };
    return { score: 40, label: "Needs Improvement", status: "poor" };
  };

  const getCategoryColor = (category) => {
    const colors = {
      food: "category-color-food",
      shopping: "category-color-shopping",
      transport: "category-color-transport",
      entertainment: "category-color-entertainment",
      bills: "category-color-bills",
      healthcare: "category-color-healthcare",
      other: "category-color-other",
    };
    return colors[category] || "category-color-other";
  };

  if (loading) {
    return (
      <div className="insights-container">
        <div className="main-content">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (
    !insights?.insights?.total_transactions ||
    insights.insights.total_transactions === 0
  ) {
    return (
      <div className="insights-container">
        <div className="main-content">
          <div className="insights-header">
            <div className="insights-header-content">
              <div className="insights-title-section">
                <h1>Financial Insights</h1>
                <p>AI-powered analysis of your spending habits</p>
              </div>
            </div>
          </div>

          <div className="insights-empty-state">
            <div className="insights-empty-icon">
              <BarChart3 size={48} />
            </div>
            <h2 className="insights-empty-title">No data yet</h2>
            <p className="insights-empty-description">
              Add some transactions to unlock powerful AI insights and
              recommendations for your financial health.
            </p>
            <Link to="/transactions" className="btn-refresh">
              <Sparkles size={20} />
              Add Transactions
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { insights: data, recommendations } = insights;
  const healthScore = getHealthScore(data.total_spending);

  // Prepare category data
  const categoryData = Object.entries(data.spending_by_category || {})
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: ((amount / data.total_spending) * 100).toFixed(1),
    }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="insights-container">
      <div className="main-content">
        {/* Header */}
        <div className="insights-header">
          <div className="insights-header-content">
            <div className="insights-title-section">
              <h1>Financial Insights</h1>
              <p>AI-powered analysis of your spending habits</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="btn-refresh"
            >
              <RefreshCw
                size={20}
                className={refreshing ? "animate-spin" : ""}
              />
              {refreshing ? "Refreshing..." : "Refresh Insights"}
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="insights-stats-grid">
          <div className="insight-stat-card fade-in-up">
            <div className="insight-stat-content">
              <div className="insight-stat-info">
                <div className="insight-stat-label">Total Spending</div>
                <div className="insight-stat-value">
                  ₹{data.total_spending?.toFixed(2)}
                </div>
                <div className="insight-stat-description">
                  Across {data.total_transactions} transactions
                </div>
              </div>
              <div className="insight-stat-icon">
                <DollarSign size={28} />
              </div>
            </div>
          </div>

          <div
            className="insight-stat-card fade-in-up"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="insight-stat-content">
              <div className="insight-stat-info">
                <div className="insight-stat-label">Average Spending</div>
                <div className="insight-stat-value">
                  ₹{data.average_spending?.toFixed(2)}
                </div>
                <div className="insight-stat-description">Per transaction</div>
              </div>
              <div className="insight-stat-icon">
                <CreditCard size={28} />
              </div>
            </div>
          </div>

          <div
            className="insight-stat-card fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="insight-stat-content">
              <div className="insight-stat-info">
                <div className="insight-stat-label">Savings Rate</div>
                <div className="insight-stat-value">
                  {data.savings_rate?.toFixed(1)}%
                </div>
                <div className="insight-stat-description">Of your income</div>
              </div>
              <div className="insight-stat-icon">
                <Target size={28} />
              </div>
            </div>
          </div>

          <div
            className="insight-stat-card fade-in-up"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="insight-stat-content">
              <div className="insight-stat-info">
                <div className="insight-stat-label">Top Category</div>
                <div className="insight-stat-value capitalize">
                  {data.most_used_category}
                </div>
                <div className="insight-stat-description">Highest spending</div>
              </div>
              <div className="insight-stat-icon">
                <PieChart size={28} />
              </div>
            </div>
          </div>
        </div>

        <div className="insights-content-grid">
          {/* Category Breakdown */}
          <div className="category-breakdown-card slide-in-right">
            <div className="category-breakdown-header">
              <PieChart size={24} />
              <h2 className="category-breakdown-title">Spending by Category</h2>
            </div>
            <div className="category-breakdown-list">
              {categoryData.map((item, index) => (
                <div
                  key={item.category}
                  className="category-item"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="category-info">
                    <div
                      className={`category-color ${getCategoryColor(
                        item.category
                      )}`}
                      style={{
                        "--category-color": `var(--${getCategoryColor(
                          item.category
                        )})`,
                      }}
                    ></div>
                    <div className="category-details">
                      <div className="category-name capitalize">
                        {item.category}
                      </div>
                      <div className="category-bar">
                        <div
                          className="category-progress"
                          style={{
                            width: `${item.percentage}%`,
                            backgroundColor: `var(--${getCategoryColor(
                              item.category
                            )})`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="category-stats">
                    <div className="category-amount">
                      ₹{item.amount.toFixed(2)}
                    </div>
                    <div className="category-percentage">
                      {item.percentage}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Recommendations */}
          <div
            className="recommendations-card slide-in-right"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="recommendations-header">
              <Lightbulb size={24} />
              <h2 className="recommendations-title">AI Recommendations</h2>
            </div>
            <div className="recommendations-list">
              {recommendations?.map((recommendation, index) => (
                <div
                  key={index}
                  className="recommendation-item"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="recommendation-icon">
                    <Sparkles size={20} />
                  </div>
                  <div className="recommendation-content">
                    <div className="recommendation-text">{recommendation}</div>
                    <div className="recommendation-priority">
                      {index === 0 ? "High Priority" : "Recommended"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Financial Health Score */}
        <div className="health-score-card fade-in-up">
          <div className="health-score-header">
            <Heart size={24} />
            <h2 className="health-score-title">Financial Health Score</h2>
          </div>
          <div className="health-score-content">
            <div className="health-score-visual">
              <div
                className="health-score-circle"
                style={{ "--score-percentage": `${healthScore.score}%` }}
              >
                <div className="health-score-ring">
                  <div className="health-score-value">{healthScore.score}</div>
                </div>
                <div className="health-score-label">{healthScore.label}</div>
              </div>
            </div>
            <div className="health-score-details">
              <p className="health-score-description">
                Based on your spending patterns, savings rate, and financial
                habits.
                {healthScore.score >= 70
                  ? " You're doing great! Keep up the good financial habits."
                  : " Consider implementing some of our AI recommendations to improve your score."}
              </p>
              <div className="health-metrics">
                <div className="health-metric">
                  <span className="metric-label">Spending Control</span>
                  <span className="metric-value">
                    {data.total_spending < 500
                      ? "Excellent"
                      : data.total_spending < 1000
                      ? "Good"
                      : "Needs Work"}
                  </span>
                  <span
                    className={`metric-status ${
                      data.total_spending < 500
                        ? "excellent"
                        : data.total_spending < 1000
                        ? "good"
                        : "poor"
                    }`}
                  >
                    {data.total_spending < 500
                      ? "A+"
                      : data.total_spending < 1000
                      ? "B"
                      : "C"}
                  </span>
                </div>
                <div className="health-metric">
                  <span className="metric-label">Category Balance</span>
                  <span className="metric-value">
                    {categoryData.length >= 4 ? "Diversified" : "Concentrated"}
                  </span>
                  <span
                    className={`metric-status ${
                      categoryData.length >= 4 ? "good" : "fair"
                    }`}
                  >
                    {categoryData.length >= 4 ? "B+" : "C+"}
                  </span>
                </div>
                <div className="health-metric">
                  <span className="metric-label">Savings Rate</span>
                  <span className="metric-value">
                    {data.savings_rate >= 20
                      ? "Excellent"
                      : data.savings_rate >= 10
                      ? "Good"
                      : "Low"}
                  </span>
                  <span
                    className={`metric-status ${
                      data.savings_rate >= 20
                        ? "excellent"
                        : data.savings_rate >= 10
                        ? "good"
                        : "poor"
                    }`}
                  >
                    {data.savings_rate >= 20
                      ? "A"
                      : data.savings_rate >= 10
                      ? "B"
                      : "D"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Insights;
