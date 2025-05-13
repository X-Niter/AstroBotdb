import { discord } from "@/lib/auth";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";

export const GET = async (request: NextRequest) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  
  const storedState = cookies().get("discord_oauth_state")?.value;
  
  if (!code || !state || !storedState || state !== storedState) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/auth/login?error=invalid_request"
      }
    });
  }
  
  // Exchange the authorization code for a token
  try {
    const { createDiscordUser, getExistingUser, discordUser } = await discord.validateAuthorizationCode(code);
    
    // Check if the user exists
    const existingUser = await getExistingUser();
    let userId: string;
    
    if (existingUser) {
      // User exists, update their information
      userId = existingUser.id;
    } else {
      // Create a new user
      const user = await createDiscordUser({
        attributes: {
          username: discordUser.username,
          avatar: discordUser.avatar ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png` : null,
          email: discordUser.email,
          discordId: discordUser.id,
          isPremium: false,
        }
      });
      userId = user.id;
    }
    
    // Create a new session for the user
    const session = await discord.lucia.createSession(userId, {});
    const sessionCookie = discord.lucia.createSessionCookie(session.id);
    
    cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/dashboard"
      }
    });
  } catch (e) {
    console.error(e);
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/auth/login?error=server_error"
      }
    });
  }
};