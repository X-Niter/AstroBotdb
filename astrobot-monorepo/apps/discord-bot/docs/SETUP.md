# AstroBot Setup Guide

This guide will walk you through the process of setting up AstroBot for your Discord server. It covers the initial configuration and essential features to get you started.

## Prerequisites

Before you begin, make sure you have:

1. **Administrator permissions** on the Discord server
2. **Discord Developer Portal access** (if setting up your own instance)
3. Required **API keys** for external services (if using features like GitHub, Twitter, or Twitch integration)

## Installation

### Adding the Bot to Your Server

1. Use the invite link provided by the bot administrator or developer
2. Select the server where you want to add AstroBot
3. Authorize the bot with the requested permissions
4. Once the bot joins your server, it's ready to be configured

### Self-Hosting (Advanced)

If you're setting up your own instance of AstroBot:

1. Clone the repository from GitHub
2. Install dependencies with `npm install`
3. Configure environment variables in a `.env` file
4. Start the bot with `npm start`

For detailed self-hosting instructions, see the [Self-Hosting Guide](./SELF-HOSTING.md).

## Initial Configuration

### Setting Up Admin Roles

First, designate which roles should have administrative access to the bot:

```
/config admin-role role:@Admin
```

For moderator roles with limited access:

```
/config mod-role role:@Moderator
```

### Command Prefix

Set the prefix for custom commands (default is `!`):

```
/config prefix prefix:!
```

### Log Channel

Set up a channel for bot logs:

```
/config log-channel channel:#bot-logs
```

### Server Timezone

Configure the timezone for scheduled events:

```
/config timezone timezone:America/New_York
```

## Essential Features Setup

### Auto-Responses

Create automatic responses to common questions:

```
/config autoresponse add trigger:"how do I join" response:"You can join the game by clicking the link in #server-info!"
```

List current auto-responses:

```
/config autoresponse list
```

### Welcome Messages

Configure messages to greet new members:

```
/welcome set-message message:"Welcome {user} to {server}! Please check out #rules and #info to get started!"
```

Enable welcome messages:

```
/welcome toggle enabled:true
```

### Leveling System

Enable the XP system:

```
/level system enable
```

Configure XP settings:

```
/level settings xp-min:15 xp-max:25 cooldown:60
```

## External Integrations

### GitHub Integration

Set up GitHub notifications:

```
/github track repository:owner/repo channel:#github-updates
```

### Twitter Integration

Track Twitter accounts:

```
/twitter track username:twitterhandle channel:#twitter-feed
```

### Twitch Integration

Get notified when streamers go live:

```
/twitch track username:streamername channel:#stream-alerts
```

## Moderation Setup

### Auto-Moderation

Configure auto-moderation features:

```
/automod setup filter-profanity:true filter-spam:true filter-invites:true
```

### Ticket System

Set up a support ticket system:

```
/tickets setup category:"Support Tickets" support-team:@Support
```

### Reaction Roles

Create role assignment through reactions:

```
/role create channel:#roles message:"Choose your roles below" role:@Gamer emoji:🎮
```

## Scheduled Events

Set up recurring announcements:

```
/schedule create name:"Weekend Event" channel:#announcements type:recurring recurring:weekly day:friday time:18:00 message:"Weekend events start tomorrow! Don't forget to sign up in #events."
```

## Backup Configuration

It's recommended to create a backup after initial configuration:

```
/backup create name:"Initial Setup" description:"After configuring essential features"
```

## Verification

After setting up the bot, verify that everything is working as expected:

1. Test admin commands to ensure permissions are set correctly
2. Check notification channels to make sure they're receiving updates
3. Test auto-responses with trigger phrases
4. Invite a test account to verify welcome messages

## Troubleshooting

If you encounter issues during setup:

1. Check the bot's permissions in your server
2. Verify that the bot has access to all relevant channels
3. Ensure API keys for external services are correctly configured
4. Check the logs in your designated log channel

For more detailed troubleshooting help, see the [Troubleshooting Guide](./TROUBLESHOOTING.md).

## Next Steps

After completing the basic setup, consider exploring these advanced features:

- Custom commands with variables
- Music player configuration
- AI chat integration
- Advanced automod rules
- Giveaway system

For a full list of AstroBot's capabilities, see the [Feature Documentation](./FEATURES.md).

## Support

If you need additional help setting up AstroBot:

- Check the [Documentation](./README.md) for detailed information
- Join the official support server at [discord.gg/astrobot](https://discord.gg/astrobot)
- Contact the bot developer for premium support options