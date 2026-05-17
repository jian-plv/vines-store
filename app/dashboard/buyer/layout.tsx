import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { redirect } from "next/navigation";
import { BuyerSidebar } from "../../../components/ui/buyer-sidebar";
import { BuyerTopBarWrapper } from "../../../components/ui/buyer-topbar-wrapper";

export default async function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Only BUYER (and ADMIN viewing) can access buyer dashboard
  if (!session) redirect("/login");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>
      <BuyerSidebar />
      
<div
  style={{ marginLeft: 230, flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}
  className="main-content"
>
        <BuyerTopBarWrapper />
        <main style={{ flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
