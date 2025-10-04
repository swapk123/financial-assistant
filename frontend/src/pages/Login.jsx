import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { TrendingUp, Mail, Lock, Sparkles } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <TrendingUp size={32} />
          </div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to your FinanceAI account</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <div className="form-input-wrapper">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                required
              />
              <Mail className="form-icon" size={20} />
            </div>
          </div>

          <div className="form-group">
            <div className="form-input-wrapper">
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                required
              />
              <Lock className="form-icon" size={20} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? (
              <>
                <div className="loading-spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                Signing In...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="auth-link">
          <p>
            Don't have an account?{' '}
            <Link to="/register">Create one here</Link>
          </p>
        </div>

        <div className="demo-credentials">
          <div className="demo-title">Demo Account</div>
          <div className="demo-content">
            Email: test@example.com<br />
            Password: test123
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;