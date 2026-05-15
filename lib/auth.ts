import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// ─── Hardcoded users (all 3 roles) ───────────────────────────────────────────
const HARDCODED_USERS = [
  {
    id:       "user-admin-001",
    name:     "Store Owner",
    email:    "admin@vine.com",
    password: "vinestoreSakalam26",
    role:     "ADMIN" as const,
  },
  {
    id:       "user-staff-001",
    name:     "Store Staff",
    email:    "staff@vine.com",
    password: "wow26sakalam",
    role:     "STAFF" as const,
  },
  {
    id:       "user-buyer-001",
    name:     "Customer",
    email:    "buyer@vine.com",
    password: "vinestoreBuyer",
    role:     "BUYER" as const,
  },
];

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text"     },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const user = HARDCODED_USERS.find(
          (u) =>
            u.email    === credentials.username.trim().toLowerCase() &&
            u.password === credentials.password
        );

        if (!user) return null;

        return {
          id:    user.id,
          name:  user.name,
          email: user.email,
          role:  user.role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id   = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error:  "/login",
  },

  session: {
    strategy: "jwt",
    maxAge:   8 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET ?? "dev-secret-change-in-production",
};