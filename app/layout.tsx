import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";

export const metadata: Metadata = {
  title: "Vine's Store – Inventory Management System",
  description: "Grocery Inventory Management System for Vine's Store",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
