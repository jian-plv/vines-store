"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ShoppingBasket, User, Lock, Eye, EyeOff, Loader2, ChevronDown,
} from "lucide-react";

// ─── Role → redirect destination ─────────────────────────────────────────────
const ROLE_REDIRECT: Record<string, string> = {
  ADMIN: "/dashboard/admin",
  STAFF: "/dashboard/staff",
  BUYER: "/dashboard/buyer",
};

// ─── Role → email mapping ─────────────────────────────────────────────────────
const ROLE_EMAIL: Record<string, string> = {
  ADMIN: "admin@vine.com",
  STAFF: "staff@vine.com",
  BUYER: "buyer@vine.com",
};

export default function LoginPage() {
  const router = useRouter();

  const [username,     setUsername]     = useState("admin@vine.com");
  const [password,     setPassword]     = useState("");
  const [role,         setRole]         = useState("ADMIN");
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      username: username.trim(),
      password,
      redirect: false,
    });

    if (result?.error || !result?.ok) {
      setError("Invalid username or password. Please try again.");
      setLoading(false);
      return;
    }

    // Fetch session to get actual role
    try {
      const res     = await fetch("/api/auth/session");
      const data    = await res.json();
      const userRole: string = data?.user?.role ?? role;
      router.push(ROLE_REDIRECT[userRole] ?? "/dashboard/admin");
      router.refresh();
    } catch {
      router.push(ROLE_REDIRECT[role] ?? "/dashboard/admin");
      router.refresh();
    }
  };

  return (
    <div className="login-bg">
      <div className="login-grid-overlay" />

      <div className="login-card">

        {/* ── Logo ── */}
        <div className="login-logo-block">
          <div className="login-logo-icon">
            <ShoppingBasket size={26} color="#fff" strokeWidth={2.4} />
          </div>
          <p className="login-logo-title">Vine's Store</p>
          <p className="login-logo-sub">Inventory Management System</p>
        </div>

        {/* ── Heading ── */}
        <div className="login-heading-block">
          <h1 className="login-heading">Welcome back</h1>
          <p className="login-subheading">Sign in to your account to continue</p>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="login-form" noValidate>

          {/* Username */}
          <div className="login-field">
            <label className="login-label" htmlFor="username">Username</label>
            <div className="login-input-wrap">
              <span className="login-input-icon">
                <User size={15} strokeWidth={2} />
              </span>
              <input
                id="username"
                type="text"
                autoComplete="username"
                required
                className="login-input"
                placeholder="Enter your username"
                value={username}
                readOnly
                onChange={(e) => setUsername(e.target.value)}
                style={{ background: "#f8fafc", cursor: "default" }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="login-field">
            <label className="login-label" htmlFor="password">Password</label>
            <div className="login-input-wrap">
              <span className="login-input-icon">
                <Lock size={15} strokeWidth={2} />
              </span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                className="login-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="login-eye-btn"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword
                  ? <EyeOff size={15} strokeWidth={2} />
                  : <Eye    size={15} strokeWidth={2} />}
              </button>
            </div>
          </div>

          {/* Role */}
          <div className="login-field">
            <label className="login-label" htmlFor="role">Role</label>
            <div className="login-input-wrap">
              <select
                id="role"
                className="login-input login-select"
                value={role}
                onChange={(e) => {
                  const selected = e.target.value;
                  setRole(selected);
                  setUsername(ROLE_EMAIL[selected] ?? "");
                  setError("");
                }}
              >
                <option value="ADMIN">Store Owner (Admin)</option>
                <option value="STAFF">Store Staff</option>
                <option value="BUYER">Customer (Buyer)</option>
              </select>
              <span className="login-select-arrow">
                <ChevronDown size={14} strokeWidth={2} />
              </span>
            </div>
          </div>

          {/* Forgot password */}
          <div className="login-forgot-row">
            <a href="#" className="login-forgot-link" tabIndex={-1}>
              Forgot Password?
            </a>
          </div>

          {/* Error */}
          {error && (
            <div className="login-error" role="alert">
              <span className="login-error-dot" />
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="login-submit-btn"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="login-spinner" />
                Signing in…
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>

      <style>{`
        .login-bg {
          min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          background: #f0f4f8; position: relative; overflow: hidden; padding: 24px;
        }
        .login-grid-overlay {
          position: absolute; inset: 0;
          background-image: radial-gradient(circle, #cbd5e1 1px, transparent 1px);
          background-size: 28px 28px; opacity: 0.45; pointer-events: none;
        }
        .login-card {
          position: relative; z-index: 1; background: #fff;
          border: 1px solid #e2e8f0; border-radius: 16px;
          padding: 36px 32px 32px; width: 100%; max-width: 420px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.08);
          animation: card-appear 0.35s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes card-appear {
          from { opacity:0; transform:translateY(16px) scale(0.98); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        .login-logo-block {
          display:flex; flex-direction:column; align-items:center; margin-bottom:28px;
        }
        .login-logo-icon {
          width:56px; height:56px; background:#16a34a; border-radius:14px;
          display:flex; align-items:center; justify-content:center;
          margin-bottom:12px; box-shadow:0 4px 12px rgba(22,163,74,0.30);
        }
        .login-logo-title {
          font-family:'DM Sans',sans-serif; font-size:19px; font-weight:700;
          color:#0f172a; letter-spacing:-0.03em; margin:0 0 3px;
        }
        .login-logo-sub {
          font-family:'DM Sans',sans-serif; font-size:12px; color:#94a3b8;
          margin:0; font-weight:400;
        }
        .login-heading-block { margin-bottom:22px; }
        .login-heading {
          font-family:'DM Sans',sans-serif; font-size:20px; font-weight:700;
          color:#0f172a; letter-spacing:-0.025em; margin:0 0 5px;
        }
        .login-subheading {
          font-family:'DM Sans',sans-serif; font-size:13px;
          color:#64748b; margin:0; font-weight:400;
        }
        .login-form { display:flex; flex-direction:column; gap:16px; }
        .login-field { display:flex; flex-direction:column; gap:5px; }
        .login-label {
          font-family:'DM Sans',sans-serif; font-size:12.5px;
          font-weight:600; color:#374151; letter-spacing:0.01em;
        }
        .login-input-wrap { position:relative; display:flex; align-items:center; }
        .login-input-icon {
          position:absolute; left:11px; top:50%; transform:translateY(-50%);
          color:#94a3b8; display:flex; align-items:center;
          pointer-events:none; z-index:1;
        }
        .login-input {
          width:100%; padding:10px 12px 10px 34px;
          border:1px solid #e2e8f0; border-radius:8px;
          font-family:'DM Sans',sans-serif; font-size:13.5px;
          color:#0f172a; background:#fff; outline:none;
          transition:border-color 0.15s, box-shadow 0.15s;
          -webkit-appearance:none; appearance:none; box-sizing:border-box;
        }
        .login-input::placeholder { color:#b0bcc8; }
        .login-input:focus {
          border-color:#16a34a;
          box-shadow:0 0 0 3px rgba(22,163,74,0.12);
        }
        .login-eye-btn {
          position:absolute; right:10px; top:50%; transform:translateY(-50%);
          background:none; border:none; cursor:pointer; color:#94a3b8;
          display:flex; align-items:center; padding:4px; border-radius:4px;
        }
        .login-eye-btn:hover { color:#475569; }
        .login-select { padding-right:36px; cursor:pointer; padding-left:12px; }
        .login-select-arrow {
          position:absolute; right:11px; top:50%; transform:translateY(-50%);
          color:#94a3b8; display:flex; align-items:center; pointer-events:none;
        }
        .login-forgot-row { display:flex; justify-content:flex-end; margin-top:-6px; }
        .login-forgot-link {
          font-family:'DM Sans',sans-serif; font-size:12.5px;
          font-weight:600; color:#16a34a; text-decoration:none;
        }
        .login-forgot-link:hover { text-decoration:underline; }
        .login-error {
          display:flex; align-items:center; gap:8px;
          background:#fef2f2; border:1px solid #fecaca;
          color:#dc2626; padding:10px 12px; border-radius:8px;
          font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500;
        }
        .login-error-dot {
          width:6px; height:6px; border-radius:50%;
          background:#dc2626; flex-shrink:0;
        }
        .login-submit-btn {
          display:flex; align-items:center; justify-content:center; gap:8px;
          width:100%; padding:11px 0; background:#16a34a; color:#fff;
          border:none; border-radius:8px;
          font-family:'DM Sans',sans-serif; font-size:14px; font-weight:700;
          cursor:pointer; transition:background 0.15s, box-shadow 0.15s;
          margin-top:2px; letter-spacing:0.01em;
        }
        .login-submit-btn:hover:not(:disabled) {
          background:#15803d; box-shadow:0 4px 12px rgba(22,163,74,0.30);
        }
        .login-submit-btn:disabled { opacity:0.65; cursor:not-allowed; }
        .login-spinner { animation:spin 0.8s linear infinite; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}