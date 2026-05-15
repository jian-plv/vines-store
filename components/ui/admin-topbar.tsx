"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, ChevronDown, User, LogOut, Settings } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

interface AdminTopBarProps {
  title:      string;
  alertCount: number;
}

export function AdminTopBar({ title, alertCount }: AdminTopBarProps) {
  const { data: session } = useSession();
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        height: 56,
        background: "#fff",
        borderBottom: "1px solid #e2e8f0",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      {/* ── Left: × Title ──────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* × close icon (decorative, matches PDF) */}
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: "#f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 15,
            color: "#94a3b8",
            cursor: "default",
            userSelect: "none",
            fontWeight: 400,
            lineHeight: 1,
          }}
        >
          ×
        </span>

        <span
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "#0f172a",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </span>
      </div>

      {/* ── Right: Bell + Avatar ────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

        {/* Bell with red badge */}
        <Link
          href="/dashboard/admin/alerts"
          style={{
            position: "relative",
            width: 36,
            height: 36,
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#64748b",
            textDecoration: "none",
            transition: "all 0.13s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = "#f8fafc";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
          }}
        >
          <Bell size={16} strokeWidth={2} />

          {/* Red notification dot */}
          {alertCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: 5,
                right: 5,
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#dc2626",
                border: "1.5px solid #fff",
              }}
            />
          )}
        </Link>

        {/* Admin avatar dropdown */}
        <div ref={dropRef} style={{ position: "relative" }}>
          <button
            onClick={() => setDropOpen((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "5px 10px 5px 6px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              background: dropOpen ? "#f1f5f9" : "#fff",
              cursor: "pointer",
              transition: "all 0.13s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background = "#f8fafc")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background = dropOpen ? "#f1f5f9" : "#fff")
            }
          >
            {/* Avatar circle */}
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: "#16a34a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 800, color: "#fff" }}>
                {session?.user?.name?.[0]?.toUpperCase() ?? "A"}
              </span>
            </div>

            <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
              Admin
            </span>

            <ChevronDown
              size={13}
              color="#94a3b8"
              style={{
                transform: dropOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.15s",
              }}
            />
          </button>

          {/* Dropdown menu */}
          {dropOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                right: 0,
                minWidth: 180,
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                overflow: "hidden",
                animation: "drop-in 0.15s ease both",
                zIndex: 50,
              }}
            >
              {/* User info row */}
              <div
                style={{
                  padding: "12px 14px 10px",
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                  {session?.user?.name ?? "Admin"}
                </div>
                <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 1 }}>
                  {session?.user?.email ?? "admin@vine.com"}
                </div>
              </div>

              {/* Menu items */}
              {[
                { icon: User,     label: "Profile",  href: "/dashboard/admin/settings" },
                { icon: Settings, label: "Settings", href: "/dashboard/admin/settings" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setDropOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    padding: "9px 14px",
                    textDecoration: "none",
                    color: "#374151",
                    fontSize: 13,
                    fontWeight: 450,
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLAnchorElement).style.background = "#f8fafc")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLAnchorElement).style.background = "transparent")
                  }
                >
                  <item.icon size={14} color="#94a3b8" />
                  {item.label}
                </Link>
              ))}

              <div style={{ height: 1, background: "#f1f5f9", margin: "2px 0" }} />

              {/* Logout */}
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  padding: "9px 14px",
                  width: "100%",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#dc2626",
                  fontSize: 13,
                  fontWeight: 500,
                  textAlign: "left",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background = "#fef2f2")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background = "transparent")
                }
              >
                <LogOut size={14} color="#dc2626" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes drop-in {
          from { opacity:0; transform:translateY(-6px) scale(0.97); }
          to   { opacity:1; transform:translateY(0)    scale(1);    }
        }
      `}</style>
    </header>
  );
}
