import Link from "next/link";
import { AlertTriangle, Clock, XCircle } from "lucide-react";
import type { Alert } from "@prisma/client";

interface Props {
  alerts: Alert[];
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; bg: string; color: string; label: string }> = {
  LOW_STOCK:   { icon: AlertTriangle, bg: "#ffedd5", color: "#ea580c", label: "Low Stock"   },
  NEAR_EXPIRY: { icon: Clock,         bg: "#fef3c7", color: "#d97706", label: "Near Expiry" },
  EXPIRED:     { icon: XCircle,       bg: "#fee2e2", color: "#dc2626", label: "Expired"     },
};

export function AlertsSummary({ alerts }: Props) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        overflow: "hidden",
        alignSelf: "start",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px 12px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 14 }}>Active Alerts</div>
        <Link
          href="/dashboard/alerts"
          style={{ fontSize: 12, color: "var(--brand-600)", fontWeight: 600, textDecoration: "none" }}
        >
          View all →
        </Link>
      </div>

      {/* Alert items */}
      <div style={{ padding: "8px 0" }}>
        {alerts.length === 0 ? (
          <div
            style={{
              padding: "24px 20px",
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: 13,
            }}
          >
            🎉 No active alerts
          </div>
        ) : (
          alerts.map((alert) => {
            const cfg = TYPE_CONFIG[alert.type] ?? TYPE_CONFIG.LOW_STOCK;
            const Icon = cfg.icon;
            return (
              <div
                key={alert.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "10px 20px",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: cfg.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  <Icon size={14} color={cfg.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      lineHeight: 1.4,
                    }}
                  >
                    {alert.message}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                    {new Date(alert.createdAt).toLocaleDateString("en-PH", {
                      month: "short", day: "numeric",
                    })}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 600,
                    background: cfg.bg,
                    color: cfg.color,
                    padding: "2px 7px",
                    borderRadius: 99,
                    flexShrink: 0,
                  }}
                >
                  {cfg.label}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
