# AstroBot Features Guide

AstroBot offers a comprehensive suite of features designed to enhance your Discord server's functionality and user experience. This guide provides detailed information about each feature and how to use it effectively.

## Command System

### Slash Commands

AstroBot primarily uses Discord's slash command system, providing an intuitive and discoverable interface. Simply type `/` in any channel where the bot has permission to see the available commands.

### Custom Commands

Create personalized commands specific to your server:

```
/custom create name:serverinfo response:"Server Name: {server}\nMembers: {memberCount}\nCreated: {serverCreated}"
```

Available variables:
- `{user}` - Mentions the user who triggered the command
- `{username}` - Shows the username without mentioning
- `{server}` - Shows the server name
- `{memberCount}` - Shows the current member count
- `{channel}` - Shows the current channel name
- `{serverCreated}` - Shows when the server was created

## Server Management

### Configuration

Customize AstroBot for your server:

```
/config view                # View current configuration
/config prefix prefix:!     # Set custom command prefix
/config timezone UTC        # Set server timezone
```

### Auto-Responses

Create automatic replies to specific messages:

```
/config autoresponse add trigger:"how to join" response:"Check #welcome for instructions!"
```

For wildcard matching:
```
/config autoresponse add trigger:"*help*" response:"Need help? Ask in #support!"
```

## Moderation Tools

### Basic Moderation

Essential commands for server moderation:

```
/ban @user reason:"Violation of rules"           # Ban a user
/kick @user reason:"Disruptive behavior"         # Kick a user
/mute @user duration:1h reason:"Spamming"        # Temporarily mute a user
/purge amount:10                                 # Delete recent messages
```

### Auto Moderation

Automatically enforce server rules:

```
/automod setup filter-profanity:true filter-invites:true filter-spam:true
/automod filter-words add:bad,words,list
/automod punishment first:warn second:mute third:kick
```

### Warning System

Issue and track warnings:

```
/warn @user reason:"Rule violation"  # Issue a warning
/warnings @user                      # View user's warnings
/clearwarnings @user                 # Remove all warnings
```

## Community Engagement

### Leveling System

Reward active members with XP and levels:

```
/level                        # Check your level
/leaderboard                  # View server leaderboard
/level settings xp-min:15 xp-max:25 cooldown:60  # Configure XP settings
```

### Polls

Create interactive polls:

```
/poll create question:"What game should we play?" options:"Minecraft,Fortnite,Valorant" duration:24h
```

### Giveaways

Host giveaways with automatic winner selection:

```
/giveaway create prize:"Nitro Classic" winners:1 duration:7d requirement:level:10
```

### Reminders

Schedule reminders for yourself or the channel:

```
/remind me time:1h message:"Check server backups"
/remind channel time:10m message:"Event starting soon!"
```

## External Integrations

### GitHub Integration

Track repository events:

```
/github track repository:owner/repo channel:#github-updates
/github list                  # List tracked repositories
```

Notification types include commits, pull requests, issues, and releases.

### Twitter Integration

Get notified about new tweets:

```
/twitter track username:twittername channel:#twitter-feed
/twitter list                 # List tracked accounts
```

### Twitch Integration

Receive alerts when streamers go live:

```
/twitch track username:streamername channel:#stream-alerts
/twitch list                  # List tracked streamers
```

## Scheduled Events & Announcements

Create one-time or recurring announcements:

```
/schedule create name:"Weekend Event" channel:#announcements type:one-time date:2023-06-15 time:16:00 message:"Event starts tomorrow!"
```

For recurring events:
```
/schedule create name:"Weekly Update" channel:#news type:recurring recurring:weekly day:monday time:10:00 message:"Weekly server updates!"
```

## Role Management

### Reaction Roles

Allow members to self-assign roles:

```
/role create channel:#roles message:"Choose your roles below" role:@Gamer emoji:🎮
```

### Role Menus

Create dropdown menus for role selection:

```
/rolemenu create channel:#roles title:"Game Roles" description:"Select your favorite games" roles:@Minecraft,@Fortnite,@Valorant
```

## Support System

### Ticket System

Create a support ticket system:

```
/tickets setup category:"Support" team:@Support
/tickets panel channel:#help title:"Get Support" description:"Click the button below to create a ticket"
```

## Media & Entertainment

### Music System

Play music in voice channels:

```
/play query:"song name"       # Play a song
/queue                        # View the current queue
/skip                         # Skip current song
/pause                        # Pause playback
/resume                       # Resume playback
/volume level:50              # Set volume (0-100)
```

### AI Integration

Interact with AI features:

```
/ai chat prompt:"Write a poem about space"      # Generate AI text
/ai image prompt:"sunset over mountains"        # Generate AI image
```

## Server Backup & Recovery

Create and manage server backups:

```
/backup create name:"Weekly Backup" description:"Regular weekly backup"
/backup list                  # View available backups
/backup restore backup-id:123456  # Restore from backup
```

## Logging & Analytics

Track server activity:

```
/logs channel:#server-logs    # Set logging channel
/logs toggle member-join:true message-delete:true  # Configure what events to log
```

## Advanced Features

### Custom Embeds

Create rich message embeds:

```
/embed create title:"Server Rules" description:"Please follow these rules" color:#FF0000 thumbnail:URL footer:"Last updated today"
```

### Webhooks

Create and manage webhooks for external integrations:

```
/webhook create name:"GitHub Updates" channel:#github avatar:URL
/webhook list                 # List webhooks
```

### API Access

Access the AstroBot API for external applications (requires API key):

```
/api create-key description:"Website integration"
/api revoke-key key:your-key-here
```

## Getting Help

If you need assistance with any feature:

```
/help                         # General help
/help command:feature-name    # Help with specific feature
```

## Feature Requests

If you need additional functionality:

```
/feedback suggestion:"It would be great if..."
```

---

For more detailed information about specific features, please refer to the dedicated documentation pages or ask the bot developer for assistance.