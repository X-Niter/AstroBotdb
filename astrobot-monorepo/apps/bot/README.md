# AstroBot Discord Bot

A powerful Discord bot built using Discord.js v14 for Minecraft server management, AI assistance, and community moderation.

## Features

- **Minecraft Integration**: Interact with your Minecraft servers through Discord
- **Moderation Tools**: Simplify server management with powerful moderation commands
- **AI Integration**: Ask questions and get AI-powered responses using OpenAI's models
- **Customizable**: Extends easily with new command modules
- **Interactive UI**: Modern Discord interactions with embeds, buttons, and dropdowns

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.0.0 or higher)
- Discord Bot Token & Application ID
- Node.js 18+ (if not using Bun directly)

### Environment Setup

Create a `.env` file based on the `.env.example` template:

```env
# Discord Bot Configuration
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_GUILD_ID=optional_development_guild_id

# Bot Settings
COMMAND_PREFIX=!
DEFAULT_COOLDOWN=3

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/database

# Optional AI Integrations
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Environment
NODE_ENV=development
```

### Installation

```bash
# Install dependencies
bun install

# Register slash commands with Discord
bun run deploy

# Start the bot
bun run dev
```

## Project Structure

```
src/
├── commands/            # Bot commands organized by category
│   ├── general/         # General purpose commands
│   ├── minecraft/       # Minecraft-specific commands
│   ├── moderation/      # Server moderation commands
│   ├── ai/              # AI-powered commands
│   └── utility/         # Utility commands
├── events/              # Discord.js event handlers
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
├── config.ts            # Configuration management
├── deploy-commands.ts   # Command registration script
└── index.ts             # Main bot entry point
```

## Command System

Commands are organized by category folders. Each command follows this structure:

```typescript
import { SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types/discord';

export default {
  data: new SlashCommandBuilder()
    .setName('command-name')
    .setDescription('Command description'),
  
  async execute(interaction) {
    // Command implementation
  },
} as Command;
```

## Adding New Commands

1. Create a new file in the appropriate category folder
2. Export a Command object with `data` and `execute` properties
3. Run `bun run deploy` to register the new command with Discord

## License

MIT