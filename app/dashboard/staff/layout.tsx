import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { redirect } from "next/navigation";
import { StaffSidebar } from "../../../components/ui/staff-sidebar";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");

  // Admin can visit staff view; non-auth cannot
  if (session.user.role !== "STAFF" && session.user.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div style={{ display: "flex" }}>
      <StaffSidebar />
      <main className="main-layout fade-in">{children}</main>
    </div>
  );
}
