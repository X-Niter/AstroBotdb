import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment validation schema
const envSchema = z.object({
  // Discord
  DISCORD_TOKEN: z.string().min(1, "Discord token is required"),
  DISCORD_CLIENT_ID: z.string().min(1, "Discord client ID is required"),
  DISCORD_GUILD_ID: z.string().optional(),
  
  // Bot settings
  COMMAND_PREFIX: z.string().default("!"),
  DEFAULT_COOLDOWN: z.string().transform(Number).default("3"),
  
  // Database
  DATABASE_URL: z.string().min(1, "Database URL is required"),
  
  // Optional integrations
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),

  // Node environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

// Parse environment variables
const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("❌ Invalid environment variables:", result.error.format());
  throw new Error("Invalid environment configuration");
}

const env = result.data;

// Configuration object
export const config = {
  discord: {
    token: env.DISCORD_TOKEN,
    clientId: env.DISCORD_CLIENT_ID,
    guildId: env.DISCORD_GUILD_ID,
  },
  bot: {
    prefix: env.COMMAND_PREFIX,
    defaultCooldown: env.DEFAULT_COOLDOWN,
  },
  database: {
    url: env.DATABASE_URL,
  },
  integrations: {
    openai: env.OPENAI_API_KEY,
    anthropic: env.ANTHROPIC_API_KEY,
  },
  environment: env.NODE_ENV,
  isDevelopment: env.NODE_ENV === "development",
  isProduction: env.NODE_ENV === "production",
  isTest: env.NODE_ENV === "test",
};