import React, { useState, useEffect } from "react";
import { financialAPI } from "../utils/api";
import {
  TrendingUp,
  TrendingDown,
  Search,
  RefreshCw,
  DollarSign,
  Building2,
  Activity,
  ArrowUp,
  ArrowDown,
  Minus,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import LoadingSpinner from "../components/common/LoadingSpinner";

const Stocks = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchSymbol, setSearchSymbol] = useState("");
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const popularStocks = [
    { symbol: "AAPL", name: "Apple Inc." },
    { symbol: "GOOGL", name: "Alphabet Inc." },
    { symbol: "MSFT", name: "Microsoft" },
    { symbol: "TSLA", name: "Tesla Inc." },
    { symbol: "AMZN", name: "Amazon.com" },
    { symbol: "META", name: "Meta Platforms" },
    { symbol: "NFLX", name: "Netflix" },
    { symbol: "NVDA", name: "NVIDIA Corp" },
    { symbol: "JPM", name: "JPMorgan Chase" },
    { symbol: "JNJ", name: "Johnson & Johnson" },
    { symbol: "V", name: "Visa Inc." },
    { symbol: "WMT", name: "Walmart Inc." },
  ];

  useEffect(() => {
    loadPopularStocks();
  }, []);

  const loadPopularStocks = async () => {
    setLoading(true);
    setError("");
    setRefreshing(true);

    try {
      // Load first 6 popular stocks for better performance
      const stockPromises = popularStocks
        .slice(0, 6)
        .map((stock) => financialAPI.getStockData(stock.symbol));

      const results = await Promise.all(stockPromises);
      const successfulStocks = results
        .map((result) => result.data)
        .filter((stock) => stock.success);
      setStocks(successfulStocks);
    } catch (err) {
      setError("Failed to load stock data. Please try again.");
      console.error("Stocks error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const searchStock = async () => {
    if (!searchSymbol.trim()) return;

    setLoading(true);
    setError("");

    try {
      const response = await financialAPI.getStockData(
        searchSymbol.toUpperCase()
      );
      if (response.data.success) {
        // Add to stocks list if not already there
        if (!stocks.find((stock) => stock.symbol === response.data.symbol)) {
          setStocks((prev) => [response.data, ...prev.slice(0, 11)]); // Keep max 12 stocks
        }
        setSearchSymbol("");
      } else {
        setError(
          "Stock symbol not found. Please check the symbol and try again."
        );
      }
    } catch (err) {
      setError(
        "Failed to fetch stock data. Please check your connection and try again."
      );
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePopularStockClick = (symbol) => {
    setSearchSymbol(symbol);
    searchStock();
  };

  const getPriceChangeIcon = (change) => {
    if (!change && change !== 0) return <Minus size={16} />;
    return change >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />;
  };

  const getPriceChangeClass = (change) => {
    if (!change && change !== 0) return "neutral";
    return change >= 0 ? "positive" : "negative";
  };

  const formatPrice = (price) => {
    if (typeof price !== "number") return "0.00";
    return price.toFixed(2);
  };

  const formatChange = (change, percent) => {
    if (!change && change !== 0) return "N/A";
    const sign = change >= 0 ? "+" : "";
    const changeStr = `${sign}${change.toFixed(2)}`;
    const percentStr = percent ? ` (${sign}${percent.toFixed(2)}%)` : "";
    return changeStr + percentStr;
  };

  const getMarketStatus = () => {
    const now = new Date();
    const hours = now.getHours();
    const day = now.getDay();

    // Simple market hours check (9:30 AM - 4:00 PM ET, Mon-Fri)
    if (day === 0 || day === 6) return "closed"; // Weekend
    if (hours < 9 || hours >= 16) return "closed"; // Outside market hours
    return "open";
  };

  const marketStatus = getMarketStatus();

  return (
    <div className="stocks-container">
      <div className="main-content">
        {/* Header */}
        <div className="stocks-header">
          <div className="stocks-header-content">
            <div className="stocks-title-section">
              <h1>Stock Market</h1>
              <p>Real-time stock prices and market data</p>
            </div>
            <button
              onClick={loadPopularStocks}
              disabled={refreshing}
              className="btn-refresh-stocks"
            >
              <RefreshCw
                size={20}
                className={refreshing ? "animate-spin" : ""}
              />
              {refreshing ? "Refreshing..." : "Refresh All"}
            </button>
          </div>
        </div>

        {/* Search Section */}
        <div className="stocks-search-card">
          <div className="search-container">
            <div className="search-input-wrapper">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Search stock symbol (e.g., AAPL, TSLA, GOOGL)..."
                value={searchSymbol}
                onChange={(e) => setSearchSymbol(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === "Enter" && searchStock()}
                className="stocks-search-input"
              />
            </div>
            <button
              onClick={searchStock}
              disabled={loading || !searchSymbol.trim()}
              className="btn-search"
            >
              <Search size={20} />
              {loading ? "Searching..." : "Search Stock"}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="stocks-error-card">
            <div className="stocks-error-icon">
              <AlertCircle size={24} />
            </div>
            <h3 className="stocks-error-title">Unable to Load Data</h3>
            <p className="stocks-error-description">{error}</p>
            <button onClick={loadPopularStocks} className="btn-refresh-stocks">
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        )}

        {/* Market Status */}
        <div className="stocks-search-card">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "16px",
            }}
          >
            <span style={{ color: "white", fontWeight: "600" }}>
              Market Status:
            </span>
            <span className={`market-status ${marketStatus}`}>
              <Activity size={14} />
              {marketStatus === "open" ? "Market Open" : "Market Closed"}
            </span>
            <span
              style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "0.9rem" }}
            >
              Live prices{" "}
              {marketStatus === "open" ? "updating" : "from last close"}
            </span>
          </div>
        </div>

        {/* Stocks Grid */}
        {loading && stocks.length === 0 ? (
          <div className="stocks-loading">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            {stocks.length > 0 && (
              <div className="stocks-grid">
                {stocks.map((stock, index) => (
                  <div
                    key={`${stock.symbol}-${index}`}
                    className={`stock-card ${index === 0 ? "featured" : ""}`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="stock-header">
                      <div className="stock-symbol-section">
                        <div className="stock-icon">
                          <Building2 size={24} />
                        </div>
                        <div className="stock-symbol-info">
                          <div className="stock-symbol">{stock.symbol}</div>
                          <div className="stock-company">{stock.company}</div>
                        </div>
                      </div>
                      <div className="stock-price-section">
                        <div className="stock-price">
                          ₹{formatPrice(stock.current_price)}
                        </div>
                        <div
                          className={`stock-change ${getPriceChangeClass(
                            stock.price_change
                          )}`}
                        >
                          {getPriceChangeIcon(stock.price_change)}
                          {formatChange(
                            stock.price_change,
                            stock.price_change_percent
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="stock-details">
                      <div className="detail-item">
                        <span className="detail-label">Currency</span>
                        <span className="detail-value">
                          {stock.currency || "INR"}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Day Change</span>
                        <span
                          className={`detail-value ${getPriceChangeClass(
                            stock.price_change
                          )}`}
                        >
                          {formatChange(stock.price_change)}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Change %</span>
                        <span
                          className={`detail-value ${getPriceChangeClass(
                            stock.price_change
                          )}`}
                        >
                          {stock.price_change_percent
                            ? `${
                                stock.price_change >= 0 ? "+" : ""
                              }${stock.price_change_percent.toFixed(2)}%`
                            : "N/A"}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Type</span>
                        <span className="detail-value">Equity</span>
                      </div>
                    </div>

                    {stock.note && (
                      <div className="stock-note">
                        <Sparkles
                          size={14}
                          style={{ display: "inline", marginRight: "8px" }}
                        />
                        {stock.note}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && stocks.length === 0 && !error && (
              <div className="stocks-empty-state">
                <div className="stocks-empty-icon">
                  <TrendingUp size={48} />
                </div>
                <h2 className="stocks-empty-title">No stock data</h2>
                <p className="stocks-empty-description">
                  Search for stock symbols using the search bar above or load
                  popular stocks to get started with market data.
                </p>
                <button
                  onClick={loadPopularStocks}
                  className="btn-refresh-stocks"
                >
                  <Sparkles size={20} />
                  Load Popular Stocks
                </button>
              </div>
            )}
          </>
        )}

        {/* Popular Stocks */}
        <div className="popular-stocks-card">
          <div className="popular-stocks-header">
            <TrendingUp size={24} />
            <h2 className="popular-stocks-title">Popular Stocks</h2>
          </div>
          <div className="popular-symbols-grid">
            {popularStocks.map((stock) => (
              <button
                key={stock.symbol}
                onClick={() => handlePopularStockClick(stock.symbol)}
                className="popular-symbol"
              >
                {stock.symbol}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stocks;
