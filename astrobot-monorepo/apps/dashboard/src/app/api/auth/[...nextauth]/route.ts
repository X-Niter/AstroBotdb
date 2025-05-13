import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

const handler = NextAuth({
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID as string,
      clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
      authorization: {
        params: {
          scope: "identify email guilds"
        }
      }
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist the Discord access token to the token right after sign in
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.tokenType = account.token_type;
        token.expiresAt = account.expires_at;
      }
      return token;
    },
    async session({ session, token, user }) {
      // Send properties to the client
      session.accessToken = token.accessToken as string;
      session.user.id = token.sub as string;
      
      return session;
    },
  },
  pages: {
    signIn: '/login',
    signOut: '/',
    error: '/auth/error',
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
});

export { handler as GET, handler as POST };