import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SettingsClient } from "@/components/settings/settings-client";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  return (
    <SettingsClient
      user={{
        name:  session.user.name  ?? "Store Owner",
        email: session.user.email ?? "admin@vine.com",
        role:  session.user.role  ?? "ADMIN",
      }}
    />
  );
}
