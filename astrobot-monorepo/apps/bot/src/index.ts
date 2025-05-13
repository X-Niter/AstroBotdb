import { serve } from "@hono/node-server";
import { db } from "@astrobot/db";
import app from "./server";
import { Client, GatewayIntentBits, Events } from "discord.js";

console.log("🚀 Starting AstroBot...");

const API_PORT = process.env.API_PORT || 3001;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

// Initialize Discord bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// Start the API server
serve({
  fetch: app.fetch,
  port: Number(API_PORT),
}).then(() => {
  console.log(`✅ API server running on port ${API_PORT}`);
});

// Bot is ready
client.once(Events.ClientReady, async (c) => {
  console.log(`✅ Discord bot logged in as ${c.user.tag}`);
  
  // Update status
  client.user?.setActivity({
    name: "space exploration",
    type: 3, // Watching
  });
  
  try {
    // Sync guilds with database
    const guilds = client.guilds.cache;
    console.log(`Bot is in ${guilds.size} servers`);
    
    for (const [id, guild] of guilds) {
      const existingGuild = await db.guild.findUnique({
        where: { id },
      });
      
      if (!existingGuild) {
        await db.guild.create({
          data: {
            id,
            name: guild.name,
            icon: guild.icon,
            ownerId: guild.ownerId,
            memberCount: guild.memberCount,
          },
        });
        console.log(`Added new guild to database: ${guild.name}`);
      }
    }
  } catch (error) {
    console.error("Error syncing guilds:", error);
  }
});

// Handle messages
client.on(Events.MessageCreate, async (message) => {
  // Ignore bot messages
  if (message.author.bot) return;
  
  // Get guild settings
  const guild = await db.guild.findUnique({
    where: { id: message.guild?.id },
  });
  
  const prefix = guild?.prefix || "!";
  
  // Check if message starts with prefix
  if (message.content.startsWith(prefix)) {
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift()?.toLowerCase();
    
    // Basic ping command
    if (command === "ping") {
      const reply = await message.reply("Pinging...");
      const latency = reply.createdTimestamp - message.createdTimestamp;
      await reply.edit(`Pong! Bot Latency: ${latency}ms | API Latency: ${Math.round(client.ws.ping)}ms`);
    }
    
    // Help command
    if (command === "help") {
      await message.reply({
        content: "**AstroBot Commands**\n" +
          `${prefix}ping - Check bot latency\n` +
          `${prefix}help - Show this help message\n\n` +
          "Visit the dashboard for more features!"
      });
    }
  }
});

// Login to Discord
if (DISCORD_TOKEN) {
  client.login(DISCORD_TOKEN).catch((error) => {
    console.error("Failed to login to Discord:", error);
  });
} else {
  console.warn("⚠️ No DISCORD_TOKEN provided. Bot functionality disabled.");
}