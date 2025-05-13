import { Lucia } from "lucia";
import { PrismaAdapter } from "@lucia-auth/adapter-prisma";
import { Discord } from "@lucia-auth/oauth/providers";
import { cookies } from "next/headers";
import { cache } from "react";
import { db } from "@astrobot/db";

// Make sure to set your environment variables for production
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "";
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || "";
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || "http://localhost:3000/auth/callback";

export const adapter = new PrismaAdapter(db.session, db.user);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    expires: false,
    attributes: {
      secure: process.env.NODE_ENV === "production",
    },
  },
  getUserAttributes: (attributes) => {
    return {
      id: attributes.id,
      discordId: attributes.discordId,
      username: attributes.username,
      email: attributes.email,
      avatar: attributes.avatar,
      isPremium: attributes.isPremium,
    };
  },
});

export const discord = Discord(lucia, {
  clientId: DISCORD_CLIENT_ID,
  clientSecret: DISCORD_CLIENT_SECRET,
  redirectUri: DISCORD_REDIRECT_URI,
  scope: ["identify", "email", "guilds"],
});

export const getSession = cache(async () => {
  const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;
  if (!sessionId) return null;
  
  const { session, user } = await lucia.validateSession(sessionId);
  try {
    if (session && session.fresh) {
      const sessionCookie = lucia.createSessionCookie(session.id);
      cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    }
    if (!session) {
      const sessionCookie = lucia.createBlankSessionCookie();
      cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    }
    return session ? { user } : null;
  } catch (e) {
    return null;
  }
});

// For TypeScript users
declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: {
      id: string;
      discordId: string;
      username: string;
      email: string | null;
      avatar: string | null;
      isPremium: boolean;
    };
  }
}