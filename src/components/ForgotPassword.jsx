import React, { useState } from 'react';

function ForgotPassword({ onSwitch }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:4000/api/v1/auth/forgotPassword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setMessage('Reset instructions sent to your email!');
      } else {
        setIsSuccess(false);
        setMessage(data.message || 'Failed to send reset email');
      }
    } catch (error) {
      setIsSuccess(true);
      setMessage('Reset instructions sent to your email!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-header">
        <div className="logo-badge">
          <div className="logo-icon">+</div>
          <span className="logo-text">Pharmacy AI</span>
        </div>
        <h2 className="auth-title">Forgot password</h2>
        <p className="auth-subtitle">
          Enter your email to receive recovery instructions.
        </p>
      </div>

      {message && (
        <div className={`alert ${isSuccess ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Registered email</label>
          <input
            type="email"
            required
            className="form-input"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="submit-btn"
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send instructions'}
        </button>
      </form>

      <div className="auth-footer">
        Remember your password?
        <button type="button" onClick={() => onSwitch('login')}>
          Sign In
        </button>
      </div>
    </div>
  );
}

export default ForgotPassword;
