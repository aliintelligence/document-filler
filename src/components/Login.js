import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'sales_rep'
  });

  const { signIn, signUp, loading, error } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSignUp) {
      const result = await signUp(formData.email, formData.password, formData.fullName, formData.role);
      if (result.data && !result.error) {
        alert('Account created successfully! Please check your email for verification.');
      }
    } else {
      await signIn(formData.email, formData.password);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setFormData({
      email: '',
      password: '',
      fullName: '',
      role: 'sales_rep'
    });
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>📄 Document Filler</h1>
          <h2>{isSignUp ? 'Create Account' : 'Sign In'}</h2>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {isSignUp && (
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required={isSignUp}
                placeholder="Enter your full name"
              />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              minLength="6"
            />
          </div>

          {isSignUp && (
            <div className="form-group">
              <label>Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="sales_rep">Sales Representative</option>
                <option value="admin">Administrator</option>
              </select>
              <small className="form-help">
                Administrators can manage contracts and user permissions
              </small>
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-btn"
            disabled={loading}
          >
            {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div className="login-footer">
          <p>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button
              type="button"
              className="toggle-btn"
              onClick={toggleMode}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>

        {/* Demo credentials for testing */}
        <div className="demo-section">
          <h3>Demo Credentials</h3>
          <div className="demo-credentials">
            <div className="demo-cred">
              <strong>Admin:</strong>
              <br />
              admin@demo.com / password123
            </div>
            <div className="demo-cred">
              <strong>Sales Rep:</strong>
              <br />
              sales@demo.com / password123
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;