import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "../../../components/ui/admin-sidebar";
import { AdminTopBarInjector } from "../../../components/ui/admin-topbar-injector";
import { prisma } from "../../../lib/prisma";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  // Live alert count for sidebar badge + bell dot
  let alertCount = 0;
  try {
    alertCount = await prisma.alert.count({ where: { isResolved: false } });
  } catch {
    alertCount = 0;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>
      {/* Fixed left sidebar */}
      <AdminSidebar alertCount={alertCount} />

      {/* Right column: topbar + page content */}
      <div style={{
  marginLeft: 230,
  flex: 1,
  display: "flex",
  flexDirection: "column",
  minHeight: "100vh",
}}
  className="main-content"
  
      >
        <AdminTopBarInjector alertCount={alertCount} />
        <main style={{ flex: 1 }}>{children}</main>
      </div>
    </div>
  );
}
