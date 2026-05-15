import NextAuth, { DefaultSession } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id:    string;
      name:  string;
      email: string;
      role:  "ADMIN" | "STAFF" | "BUYER";
    } & DefaultSession["user"];
  }

  interface User {
    role: "ADMIN" | "STAFF" | "BUYER";
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id:   string;
    role: "ADMIN" | "STAFF" | "BUYER";
  }
}