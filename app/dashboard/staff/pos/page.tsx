import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { redirect } from "next/navigation";
import { loadPOSData } from "@/lib/pos-data";
import { POSClient } from "@/components/pos/pos-client";

export default async function StaffPOSPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { products, userId } = await loadPOSData(session.user.email!);

  return <POSClient products={products} userId={userId} />;
}
