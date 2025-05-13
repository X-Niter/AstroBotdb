# AstroBot Discord Bot

The Discord bot component of the AstroBot AI platform, providing advanced AI-powered features and server management capabilities.

## Features

- **AI-Powered Chat**: Engage with an intelligent chatbot using advanced AI models from OpenAI and Anthropic
- **Server Management**: Comprehensive moderation and administration tools
- **Polls and Voting**: Create polls with customizable options and voting mechanics
- **Role Management**: Easily manage server roles with simple commands

## Getting Started

### Prerequisites

- Node.js 16.9.0 or higher
- Discord Bot Token
- OpenAI API Key (for AI chat features)

### Installation

1. Clone the repository
2. Navigate to the Discord bot directory:
   ```
   cd astrobot-monorepo/apps/discord-bot
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Copy the example environment file:
   ```
   cp .env.example .env
   ```
5. Fill in your environment variables in the `.env` file

### Usage

#### Development Mode

Run the bot in development mode with automatic reloading:

```
npm run dev
```

#### Production Mode

Start the bot in production mode:

```
npm start
```

#### Command Deployment

Deploy commands to a specific guild (for testing):

```
npm run deploy-commands
```

Deploy commands globally (may take up to an hour to propagate):

```
npm run deploy-commands -- --global
```

## Command Structure

The bot uses a modular command system organized by category:

- `/fun` - Entertainment commands
- `/moderation` - Server management commands
- `/utility` - Useful tools and information

## Adding New Commands

1. Create a new JavaScript file in the appropriate category folder under `src/commands/`
2. Follow the command template structure
3. Export the command object with required properties
4. The command will be automatically loaded when the bot starts

## License

This project is licensed under the MIT License