import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { authConfig } from "./auth.config";
import type { Session } from "next-auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const nextAuth = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const valid = await compare(password, user.password);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
});

export const { handlers, signIn, signOut } = nextAuth;

function devSession(): Session {
  return {
    user: {
      id: "dev-admin",
      email: "dev-admin@local.test",
      name: "Dev Admin",
      role: "ADMIN",
    },
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  } as Session;
}

export const auth: typeof nextAuth.auth = (async (...args: Parameters<typeof nextAuth.auth>) => {
  const session = await nextAuth.auth(...args);
  if (session) return session;
  if (process.env.DISABLE_ADMIN_AUTH === "true") return devSession();
  return null;
}) as typeof nextAuth.auth;
