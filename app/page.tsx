import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");

  if (session.user.role === "ADMIN") redirect("/dashboard/admin");
  if (session.user.role === "STAFF") redirect("/dashboard/staff");
  if (session.user.role === "BUYER") redirect("/dashboard/buyer");

  redirect("/login");
}