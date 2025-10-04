import React, { useState } from 'react';
import { useAuth } from '../../utils/AuthContext'
import { 
  BarChart3, 
  Wallet, 
  TrendingUp, 
  PieChart,
  LogOut,
  User,
  Menu,
  X,
  FileText
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Transactions', href: '/transactions', icon: Wallet },
    { name: 'Bank Statements', href: '/pdf-upload', icon: FileText }, 
    { name: 'Insights', href: '/insights', icon: PieChart },
    { name: 'Stocks', href: '/stocks', icon: TrendingUp },
  ];

  const isActive = (path) => {
    return window.location.pathname === path;
  };

  return (
    <>
      {/* Mobile Sidebar Toggle */}
      <button 
        className="sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <TrendingUp size={24} />
          </div>
          <div className="sidebar-title">FinanceAI</div>
        </div>

        <nav className="sidebar-nav">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <a
                key={item.name}
                href={item.href}
                className={`nav-item ${active ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={20} />
                <span className="font-medium">{item.name}</span>
              </a>
            );
          })}
        </nav>

        {/* User section */}
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
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="main-content">
        {children}
      </div>
    </>
  );
};

export default Layout;