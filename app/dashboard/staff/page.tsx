import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { StaffQuickLinks } from "../../../components/dashboard/staff-quick-links";

export default async function StaffDashboardPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div style={{ padding: 24 }}>

      {/* Welcome banner */}
      <div style={{
        background: "linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 60%, #3b82f6 100%)",
        borderRadius: 14,
        padding: "22px 28px",
        marginBottom: 24,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 4px 20px rgba(29,78,216,0.22)",
      }}>
        <div>
          <div style={{
            fontSize: 18, fontWeight: 800, color: "#fff",
            letterSpacing: "-0.02em", marginBottom: 4,
          }}>
            Hi, {session?.user?.name ?? "Staff"} 👋
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.78)" }}>
            Vine's Store — Staff Dashboard
          </div>
        </div>
        <div style={{
          background: "rgba(255,255,255,0.15)",
          borderRadius: 10,
          padding: "8px 16px",
          fontSize: 12,
          fontWeight: 700,
          color: "#fff",
          backdropFilter: "blur(8px)",
        }}>
          {isAdmin ? "Admin (Viewing Staff)" : "Staff Panel"}
        </div>
      </div>

      {/* Admin notice */}
      {isAdmin && (
        <div style={{
          background: "#fefce8",
          border: "1px solid #fde047",
          borderRadius: 10,
          padding: "11px 16px",
          marginBottom: 20,
          fontSize: 13,
          color: "#854d0e",
          fontWeight: 500,
        }}>
          ℹ️ You are viewing the Staff dashboard as Admin.{" "}
          <a href="/dashboard/admin" style={{ color: "#16a34a", fontWeight: 700, textDecoration: "none" }}>
            Return to Admin Dashboard →
          </a>
        </div>
      )}

      {/* Action cards — Client Component */}
      <StaffQuickLinks />

    </div>
  );
}