# AstroBot Documentation

AstroBot is an advanced AI-powered Discord bot that provides a comprehensive suite of features for Discord server management, community engagement, and content integration. This documentation will help you understand how to use the various features of AstroBot.

## Table of Contents

- [Getting Started](#getting-started)
- [Command Overview](#command-overview)
- [Bot Configuration](#bot-configuration)
- [Moderation Features](#moderation-features)
- [Community Features](#community-features)
- [AI Chat Integration](#ai-chat-integration)
- [Music System](#music-system)
- [External Service Integration](#external-service-integration)
- [Custom Commands](#custom-commands)
- [Scheduled Events](#scheduled-events)
- [Backup and Restore](#backup-and-restore)
- [Advanced Configuration](#advanced-configuration)
- [API Documentation](#api-documentation)

## Getting Started

### Inviting the Bot

To add AstroBot to your Discord server, you'll need to use the invite link provided by the bot administrator. Once the bot is added to your server, you can start using its commands right away.

### Initial Setup

1. Configure server-specific settings using `/config` command
2. Set up admin and moderator roles with `/config admin-role` and `/config mod-role`
3. Configure notification channels for various features (GitHub, Twitter, Twitch)
4. Set up welcome messages and auto-roles if desired

## Command Overview

AstroBot uses slash commands for all its features. You can see all available commands by typing `/` in the chat box. Commands are organized into several categories:

### General Commands
- `/help` - Display help information about AstroBot
- `/ping` - Check the bot's latency
- `/info` - Display information about the bot

### Admin Commands
- `/config` - Configure server-specific bot settings
- `/schedule` - Manage scheduled announcements and events
- `/backup` - Create and manage server backups

### Moderation Commands
- `/ban` - Ban a user from the server
- `/kick` - Kick a user from the server
- `/mute` - Mute a user in text and voice channels
- `/warn` - Issue a warning to a user
- `/purge` - Delete multiple messages at once
- `/automod` - Configure auto-moderation settings

### Community Commands
- `/poll` - Create a poll with reactions for voting
- `/remind` - Set a reminder for yourself or the channel
- `/level` - View your current level and XP
- `/leaderboard` - View the server's XP leaderboard
- `/giveaway` - Create and manage giveaways

### Utility Commands
- `/github` - Manage GitHub repository tracking
- `/twitter` - Manage Twitter account tracking
- `/twitch` - Manage Twitch streamer tracking
- `/ticket` - Create and manage support tickets
- `/role` - Manage reaction roles
- `/custom` - Create and manage custom commands

### AI Commands
- `/ai chat` - Start a conversation with the AI
- `/ai image` - Generate an image using AI
- `/ai imagine` - Generate imaginative images from text descriptions

### Music Commands
- `/play` - Play a song or playlist
- `/pause` - Pause the current song
- `/skip` - Skip to the next song
- `/queue` - View the current queue
- `/volume` - Adjust the volume

## Bot Configuration

AstroBot allows for extensive server-specific configuration through the `/config` command. This includes:

### Command Prefix

Custom commands can be set to use a specific prefix with `/config prefix`:

```
/config prefix prefix:!
```

### Admin and Mod Roles

Set up roles that have admin or mod access to the bot:

```
/config admin-role role:@Admin
/config mod-role role:@Moderator
```

### Notification Channels

Configure where the bot should send various types of notifications:

```
/config log-channel channel:#bot-logs
```

### Auto-Responses

Create automatic responses to specific triggers:

```
/config autoresponse add trigger:"hello" response:"Hello there!"
```

## External Service Integration

AstroBot integrates with several external services to provide real-time notifications:

### GitHub Integration

Track GitHub repositories for events like new commits, pull requests, and issues:

```
/github track repository:username/repo channel:#github-updates
```

### Twitter Integration

Get notifications when tracked Twitter accounts post new tweets:

```
/twitter track username:elonmusk channel:#twitter-feed
```

### Twitch Integration

Receive alerts when streamers go live:

```
/twitch track username:pokimane channel:#stream-alerts
```

## Scheduled Events

AstroBot can schedule announcements and recurring events:

### One-time Events

```
/schedule create name:"Server Maintenance" channel:#announcements type:one-time date:2023-06-15 time:16:00 message:"Server will be down for maintenance at 4 PM tomorrow."
```

### Recurring Events

```
/schedule create name:"Weekly Game Night" channel:#events type:recurring recurring:weekly day:friday time:20:00 message:"It's game night! Join us in the Gaming voice channel!"
```

## Custom Commands

Create custom commands with variables:

```
/custom create name:server-info response:"Welcome to {server}! We currently have {memberCount} members!"
```

## Backup and Restore

AstroBot provides comprehensive backup and restore functionality:

```
/backup create name:"Pre-Update Backup" description:"Backup before server update"
```

To restore a backup:

```
/backup restore backup-id:123456
```

## Advanced Configuration

For advanced configuration options, please refer to the detailed documentation for each specific feature.

## API Documentation

Developers can interact with AstroBot through its API. For more information, see the [API Documentation](./api-docs.md).