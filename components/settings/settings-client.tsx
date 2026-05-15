"use client";

import { useState } from "react";
import {
  User, Store, Shield, Bell, Save, CheckCircle2,
  Eye, EyeOff, ChevronRight, Loader2, Info,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface SettingsUser {
  name:  string;
  email: string;
  role:  string;
}

// ─── Shared input style ────────────────────────────────────────────────────────

const inp: React.CSSProperties = {
  width: "100%", padding: "9px 12px",
  border: "1px solid #e2e8f0", borderRadius: 8,
  fontSize: 13.5, fontFamily: "DM Sans, sans-serif",
  color: "#0f172a", background: "#fff", outline: "none",
  transition: "border-color 0.14s, box-shadow 0.14s",
  boxSizing: "border-box" as any,
};
const focus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.borderColor = "#16a34a";
  e.currentTarget.style.boxShadow   = "0 0 0 3px rgba(22,163,74,0.12)";
};
const blur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.borderColor = "#e2e8f0";
  e.currentTarget.style.boxShadow   = "none";
};

// ─── Section card wrapper ─────────────────────────────────────────────────────

function Section({
  icon: Icon, title, desc, children,
}: {
  icon: React.ElementType; title: string; desc: string; children: React.ReactNode;
}) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #e2e8f0",
      borderRadius: 12, overflow: "hidden",
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    }}>
      {/* Header */}
      <div style={{ padding: "16px 22px 14px", borderBottom: "1px solid #f1f5f9",
        display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: "#f0fdf4",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={18} color="#16a34a" strokeWidth={2} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>{title}</div>
          <div style={{ fontSize: 12.5, color: "#64748b" }}>{desc}</div>
        </div>
      </div>
      {/* Body */}
      <div style={{ padding: "20px 22px" }}>{children}</div>
    </div>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: "#374151" }}>
        {label}{required && <span style={{ color: "#dc2626", marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {hint && <div style={{ fontSize: 11.5, color: "#94a3b8" }}>{hint}</div>}
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, label }: {
  checked: boolean; onChange: (v: boolean) => void; label: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "11px 0", borderBottom: "1px solid #f8fafc" }}>
      <span style={{ fontSize: 13.5, color: "#374151", fontWeight: 500 }}>{label}</span>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: 42, height: 24, borderRadius: 99,
          background: checked ? "#16a34a" : "#e2e8f0",
          border: "none", cursor: "pointer",
          position: "relative", transition: "background 0.2s",
          flexShrink: 0,
        }}
      >
        <div style={{
          position: "absolute", top: 3,
          left: checked ? 21 : 3,
          width: 18, height: 18, borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          transition: "left 0.2s",
        }} />
      </button>
    </div>
  );
}

// ─── Save button ──────────────────────────────────────────────────────────────

function SaveBtn({ loading, saved, onClick }: {
  loading: boolean; saved: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick} disabled={loading}
      style={{ display: "flex", alignItems: "center", gap: 7,
        padding: "9px 20px", borderRadius: 8, border: "none",
        background: saved ? "#f0fdf4" : "#16a34a",
        color: saved ? "#15803d" : "#fff",
        fontSize: 13.5, fontWeight: 700, fontFamily: "DM Sans, sans-serif",
        cursor: loading ? "not-allowed" : "pointer",
        transition: "all 0.15s",
        boxShadow: saved ? "none" : "0 2px 8px rgba(22,163,74,0.25)" }}
      onMouseEnter={e => { if (!loading && !saved) (e.currentTarget as HTMLButtonElement).style.background = "#15803d"; }}
      onMouseLeave={e => { if (!loading && !saved) (e.currentTarget as HTMLButtonElement).style.background = "#16a34a"; }}>
      {loading ? (
        <><Loader2 size={14} style={{ animation: "spin 0.7s linear infinite" }} />Saving…</>
      ) : saved ? (
        <><CheckCircle2 size={14} />Saved!</>
      ) : (
        <><Save size={14} />Save Changes</>
      )}
    </button>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function SettingsClient({ user }: { user: SettingsUser }) {
  // Profile
  const [name,  setName]  = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savedProfile,  setSavedProfile]  = useState(false);

  // Store
  const [storeName,    setStoreName]    = useState("Vine's Store");
  const [storeAddress, setStoreAddress] = useState("123 Main Street, Valenzuela City");
  const [currency,     setCurrency]     = useState("PHP");
  const [timezone,     setTimezone]     = useState("Asia/Manila");
  const [savingStore,  setSavingStore]  = useState(false);
  const [savedStore,   setSavedStore]   = useState(false);

  // Security
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd,     setNewPwd]     = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd,    setShowPwd]    = useState(false);
  const [pwdError,   setPwdError]   = useState("");
  const [savingPwd,  setSavingPwd]  = useState(false);
  const [savedPwd,   setSavedPwd]   = useState(false);

  // Notifications
  const [notifs, setNotifs] = useState({
    lowStock:    true,
    nearExpiry:  true,
    expiredItems:true,
    dailyReport: false,
    salesSummary:true,
  });
  const [savingNotifs, setSavingNotifs] = useState(false);
  const [savedNotifs,  setSavedNotifs]  = useState(false);

  // ── Fake save handlers ────────────────────────────────────────────────────
  async function fakeSave(
    setSaving: (v: boolean) => void,
    setSaved:  (v: boolean) => void
  ) {
    setSaving(true);
    await new Promise(r => setTimeout(r, 900));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function saveProfile()       { fakeSave(setSavingProfile, setSavedProfile); }
  function saveStore()         { fakeSave(setSavingStore,   setSavedStore);   }
  function saveNotifications() { fakeSave(setSavingNotifs,  setSavedNotifs);  }

  function savePassword() {
    setPwdError("");
    if (!currentPwd)          { setPwdError("Enter your current password."); return; }
    if (newPwd.length < 8)    { setPwdError("New password must be at least 8 characters."); return; }
    if (newPwd !== confirmPwd) { setPwdError("Passwords do not match."); return; }
    fakeSave(setSavingPwd, setSavedPwd);
    setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
  }

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20, maxWidth: 720 }}>

      {/* Page heading */}
      <div style={{ marginBottom: 4 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a",
          letterSpacing: "-0.03em", margin: "0 0 4px" }}>Settings</h1>
        <p style={{ fontSize: 13.5, color: "#64748b", margin: 0 }}>
          Manage your account, store configuration, and preferences.
        </p>
      </div>

      {/* ── Profile ── */}
      <Section icon={User} title="Profile Information"
        desc="Update your personal details and contact information.">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Full Name" required>
              <input style={inp} value={name}
                onChange={e => setName(e.target.value)}
                onFocus={focus} onBlur={blur} />
            </Field>
            <Field label="Role">
              <input style={{ ...inp, background: "#f8fafc", color: "#94a3b8" }}
                value={user.role === "ADMIN" ? "Store Owner (Admin)" : "Store Staff"} readOnly />
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Email Address" required>
              <input style={inp} type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={focus} onBlur={blur} />
            </Field>
            <Field label="Phone Number" hint="Used for SMS alerts (optional)">
              <input style={inp} type="tel" placeholder="+63 9XX XXX XXXX"
                value={phone} onChange={e => setPhone(e.target.value)}
                onFocus={focus} onBlur={blur} />
            </Field>
          </div>
          {/* Avatar section */}
          <div style={{ display: "flex", alignItems: "center", gap: 16,
            padding: "14px 0", borderTop: "1px solid #f1f5f9" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%",
              background: "#16a34a", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 20, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
              {name[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a", marginBottom: 3 }}>
                Profile photo
              </div>
              <div style={{ fontSize: 12.5, color: "#64748b" }}>
                Initials avatar is auto-generated from your name.
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <SaveBtn loading={savingProfile} saved={savedProfile} onClick={saveProfile} />
          </div>
        </div>
      </Section>

      {/* ── Store Configuration ── */}
      <Section icon={Store} title="Store Configuration"
        desc="Configure your store name, address, currency, and timezone.">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Store Name" required>
            <input style={inp} value={storeName}
              onChange={e => setStoreName(e.target.value)}
              onFocus={focus} onBlur={blur} />
          </Field>
          <Field label="Store Address">
            <textarea
              style={{ ...inp, resize: "vertical", minHeight: 72, lineHeight: 1.6 }}
              value={storeAddress}
              onChange={e => setStoreAddress(e.target.value)}
              onFocus={focus as any} onBlur={blur as any}
            />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Currency">
              <select style={{ ...inp, appearance: "none", paddingRight: 32,
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
                backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}
                value={currency} onChange={e => setCurrency(e.target.value)}
                onFocus={focus as any} onBlur={blur as any}>
                <option value="PHP">PHP – Philippine Peso (₱)</option>
                <option value="USD">USD – US Dollar ($)</option>
              </select>
            </Field>
            <Field label="Timezone">
              <select style={{ ...inp, appearance: "none", paddingRight: 32,
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
                backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}
                value={timezone} onChange={e => setTimezone(e.target.value)}
                onFocus={focus as any} onBlur={blur as any}>
                <option value="Asia/Manila">Asia/Manila (GMT+8)</option>
                <option value="UTC">UTC (GMT+0)</option>
              </select>
            </Field>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <SaveBtn loading={savingStore} saved={savedStore} onClick={saveStore} />
          </div>
        </div>
      </Section>

      {/* ── Security ── */}
      <Section icon={Shield} title="Security & Password"
        desc="Change your password to keep your account secure.">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Current Password" required>
            <div style={{ position: "relative" }}>
              <input style={{ ...inp, paddingRight: 40 }}
                type={showPwd ? "text" : "password"}
                placeholder="Enter current password"
                value={currentPwd}
                onChange={e => setCurrentPwd(e.target.value)}
                onFocus={focus} onBlur={blur} />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: "#94a3b8",
                  display: "flex", padding: 2 }}>
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="New Password" required hint="Minimum 8 characters">
              <input style={inp} type={showPwd ? "text" : "password"}
                placeholder="New password"
                value={newPwd} onChange={e => setNewPwd(e.target.value)}
                onFocus={focus} onBlur={blur} />
            </Field>
            <Field label="Confirm New Password" required>
              <input style={inp} type={showPwd ? "text" : "password"}
                placeholder="Repeat new password"
                value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
                onFocus={focus} onBlur={blur} />
            </Field>
          </div>

          {pwdError && (
            <div style={{ display: "flex", alignItems: "center", gap: 7,
              background: "#fef2f2", border: "1px solid #fecaca",
              color: "#dc2626", padding: "9px 12px", borderRadius: 8,
              fontSize: 13, fontWeight: 500 }}>
              <Info size={13} /> {pwdError}
            </div>
          )}

          {/* Password strength */}
          {newPwd.length > 0 && (
            <div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 5 }}>
                Password strength: <strong style={{ color: newPwd.length < 8 ? "#dc2626" : newPwd.length < 12 ? "#d97706" : "#15803d" }}>
                  {newPwd.length < 8 ? "Weak" : newPwd.length < 12 ? "Fair" : "Strong"}
                </strong>
              </div>
              <div style={{ height: 4, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 99, transition: "width 0.3s",
                  background: newPwd.length < 8 ? "#dc2626" : newPwd.length < 12 ? "#d97706" : "#15803d",
                  width: `${Math.min(100, (newPwd.length / 16) * 100)}%`,
                }} />
              </div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <SaveBtn loading={savingPwd} saved={savedPwd} onClick={savePassword} />
          </div>
        </div>
      </Section>

      {/* ── Notifications ── */}
      <Section icon={Bell} title="Notification Preferences"
        desc="Choose which alerts and reports you want to receive.">
        <div>
          {[
            { key: "lowStock",    label: "Low Stock Alerts"      },
            { key: "nearExpiry",  label: "Near-Expiry Warnings"  },
            { key: "expiredItems",label: "Expired Item Alerts"   },
            { key: "dailyReport", label: "Daily Summary Report"  },
            { key: "salesSummary",label: "Sales Summary Alerts"  },
          ].map(n => (
            <Toggle key={n.key} label={n.label}
              checked={notifs[n.key as keyof typeof notifs]}
              onChange={v => setNotifs(p => ({ ...p, [n.key]: v }))} />
          ))}

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
            <SaveBtn loading={savingNotifs} saved={savedNotifs} onClick={saveNotifications} />
          </div>
        </div>
      </Section>

      {/* ── App info ── */}
      <div style={{
        background: "#f8fafc", border: "1px solid #e2e8f0",
        borderRadius: 12, padding: "16px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 12,
      }}>
        <div style={{ fontSize: 13, color: "#64748b" }}>
          <strong style={{ color: "#374151" }}>Vine's Store</strong> · Inventory Management System v1.0.0
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {[
            { label: "Documentation", href: "#" },
            { label: "Support",       href: "#" },
            { label: "Privacy",       href: "#" },
          ].map(l => (
            <a key={l.label} href={l.href}
              style={{ fontSize: 12.5, color: "#16a34a", fontWeight: 600,
                textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
              {l.label} <ChevronRight size={12} />
            </a>
          ))}
        </div>
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
