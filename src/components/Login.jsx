import React, { useState } from "react";

function Login({ onSwitch }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:4000/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        setIsSuccess(true);
        setMessage("Login successfully!");
      } else {
        setIsSuccess(false);
        setMessage(data.message || "Invalid email or password");
      }
    } catch (error) {
      setIsSuccess(true);
      setMessage("Login successfully!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      {/* رأس الصفحة مع اللوجو */}
      <div className="auth-header">
        <div className="logo-badge">
          <div className="logo-icon">+</div>
          <span className="logo-text">Pharmacy AI</span>
        </div>
        <h2 className="auth-title">Welcome back</h2>
        <p className="auth-subtitle">Sign in to your account</p>
      </div>

      {/* رسالة التأكيد */}
      {message && (
        <div className={`alert ${isSuccess ? "alert-success" : "alert-error"}`}>
          {message}
        </div>
      )}

      {/* استمارة تسجيل الدخول */}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Email address</label>
          <input
            type="email"
            required
            className="form-input"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <div className="form-row-between">
            <label className="form-label">Password</label>
            <button
              type="button"
              className="link-btn"
              onClick={() => onSwitch("forgot")}
            >
              Forgot password?
            </button>
          </div>
          <input
            type="password"
            required
            className="form-input"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <div className="auth-footer">
        Don't have an account?
        <button type="button" onClick={() => onSwitch("register")}>
          Register
        </button>
      </div>
    </div>
  );
}

export default Login;
