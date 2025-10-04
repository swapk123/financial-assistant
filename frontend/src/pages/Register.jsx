import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";
import { TrendingUp, Mail, Lock, User, Sparkles } from "lucide-react";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    const result = await register(
      formData.username,
      formData.email,
      formData.password
    );

    if (result.success) {
      navigate("/dashboard");
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
          <h1 className="auth-title">Join FinanceAI</h1>
          <p className="auth-subtitle">
            Create your account and take control of your finances
          </p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <div className="form-input-wrapper">
              <input
                type="text"
                name="username"
                placeholder="Choose a username"
                value={formData.username}
                onChange={handleChange}
                className="form-input"
                required
              />
              <User className="form-icon" size={20} />
            </div>
          </div>

          <div className="form-group">
            <div className="form-input-wrapper">
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
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
                name="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                required
              />
              <Lock className="form-icon" size={20} />
            </div>
          </div>

          <div className="form-group">
            <div className="form-input-wrapper">
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
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
                <div
                  className="loading-spinner"
                  style={{ width: "20px", height: "20px", borderWidth: "2px" }}
                ></div>
                Creating Account...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                Create Account
              </>
            )}
          </button>
        </form>

        <div className="auth-link">
          <p>
            Already have an account? <Link to="/login">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
