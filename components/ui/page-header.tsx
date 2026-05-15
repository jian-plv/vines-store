"use client";

import { Bell } from "lucide-react";
import { useSession } from "next-auth/react";

interface PageHeaderProps {
  title: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, children }: PageHeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="page-header">
      {/* Left: close icon + title  (mirrors the × Title pattern in screenshots) */}
      <div className="page-header-title">
        <span
          style={{
            width: 22,
            height: 22,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            background: "var(--surface-2)",
            fontSize: 13,
            color: "var(--text-muted)",
            cursor: "default",
            userSelect: "none",
          }}
        >
          ×
        </span>
        {title}
      </div>

      {/* Right: bell + user */}
      <div className="page-header-actions">
        {children}

        <button
          className="btn btn-ghost btn-sm"
          style={{ padding: "6px", borderRadius: "50%" }}
          aria-label="Notifications"
        >
          <Bell size={18} />
        </button>

        {session?.user && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              color: "var(--text-primary)",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: "var(--brand-600)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
                color: "#fff",
              }}
            >
              {session.user.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            {session.user.role === "ADMIN" ? "Admin" : "Staff"} ↓
          </div>
        )}
      </div>
    </header>
  );
}
