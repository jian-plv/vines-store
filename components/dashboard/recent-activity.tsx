import type { StockMovement, Product, User } from "@prisma/client";

type MovementWithRelations = StockMovement & {
  product: Product;
  user: User;
};

interface Props {
  movements: MovementWithRelations[];
}

export function RecentActivity({ movements }: Props) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>Stock Movement History</div>
      </div>

      {movements.length === 0 ? (
        <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
          No stock movements yet.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Reason</th>
                <th>Date</th>
                <th>User</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id}>
                  <td>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        fontSize: 12,
                        fontWeight: 700,
                        padding: "3px 9px",
                        borderRadius: 99,
                        background: m.type === "IN" ? "var(--brand-100)" : "#fee2e2",
                        color: m.type === "IN" ? "var(--brand-700)" : "#dc2626",
                      }}
                    >
                      {m.type === "IN" ? "↓" : "↑"} Stock {m.type === "IN" ? "In" : "Out"}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{m.product.name}</td>
                  <td style={{ fontWeight: 600 }}>{m.quantity}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{m.reason ?? "—"}</td>
                  <td style={{ color: "var(--text-secondary)" }}>
                    {new Date(m.createdAt).toLocaleDateString("en-PH", {
                      year: "numeric", month: "short", day: "numeric",
                    })}
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>{m.user.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
