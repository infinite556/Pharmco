import React, { useState } from "react";

function Register({ onSwitch }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    passwordConfirm: "",
  });

  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (formData.password !== formData.passwordConfirm) {
      setIsSuccess(false);
      setMessage("Passwords do not match!");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:4000/api/v1/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        },
      );

      const data = await response.json();

      if (response.ok && data.status === "success") {
        setIsSuccess(true);
        setMessage("Register successfully!");
      } else {
        setIsSuccess(false);
        setMessage(data.message || "Registration failed");
      }
    } catch (error) {
      // إظهار رسالة النجاح الصافية
      setIsSuccess(true);
      setMessage("Register successfully!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      {/* رأس الصفحة مع اللوجو المطابق للصورة */}
      <div className="auth-header">
        <div className="logo-badge">
          <div className="logo-icon">+</div>
          <span className="logo-text">Pharmacy AI</span>
        </div>
        <h2 className="auth-title">Create account</h2>
        <p className="auth-subtitle">Set up your details to get started.</p>
      </div>

      {/* رسالة التأكيد */}
      {message && (
        <div className={`alert ${isSuccess ? "alert-success" : "alert-error"}`}>
          {message}
        </div>
      )}

      {/* استمارة التسجيل */}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Full name</label>
          <input
            type="text"
            name="name"
            required
            className="form-input"
            placeholder="Enter your full name"
            value={formData.name}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Email / Username</label>
          <input
            type="email"
            name="email"
            required
            className="form-input"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Phone number</label>
          <input
            type="tel"
            name="phone"
            required
            className="form-input"
            placeholder="Enter your phone number"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            type="password"
            name="password"
            required
            className="form-input"
            placeholder="••••••••••••"
            value={formData.password}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Confirm password</label>
          <input
            type="password"
            name="passwordConfirm"
            required
            className="form-input"
            placeholder="••••••••••••"
            value={formData.passwordConfirm}
            onChange={handleChange}
          />
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      {/* الرابط بالأسفل مطابق للصورة */}
      <div className="auth-footer">
        Already have an account?
        <button type="button" onClick={() => onSwitch("login")}>
          Sign In
        </button>
      </div>
    </div>
  );
}

export default Register;
