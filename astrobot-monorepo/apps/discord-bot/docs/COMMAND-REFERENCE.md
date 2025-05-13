# AstroBot Command Reference

This document provides a comprehensive reference for all AstroBot commands, their options, and examples of usage.

## Command Categories

- [Configuration Commands](#configuration-commands)
- [Moderation Commands](#moderation-commands)
- [Utility Commands](#utility-commands)
- [Fun & Entertainment Commands](#fun--entertainment-commands)
- [Leveling & Economy Commands](#leveling--economy-commands)
- [External Integrations](#external-integrations)
- [AI & Image Commands](#ai--image-commands)
- [Music Commands](#music-commands)
- [Admin Commands](#admin-commands)

## Configuration Commands

### `/config`

Configure server-specific bot settings.

| Subcommand | Options | Description | Example |
|------------|---------|-------------|---------|
| `view` | None | View current configuration | `/config view` |
| `prefix` | `prefix`: String | Set command prefix | `/config prefix prefix:!` |
| `admin-role` | `role`: Role | Add admin role | `/config admin-role role:@Admin` |
| `remove-admin` | `role`: Role | Remove admin role | `/config remove-admin role:@Admin` |
| `mod-role` | `role`: Role | Add mod role | `/config mod-role role:@Moderator` |
| `remove-mod` | `role`: Role | Remove mod role | `/config remove-mod role:@Moderator` |
| `log-channel` | `channel`: Channel | Set log channel | `/config log-channel channel:#bot-logs` |
| `timezone` | `timezone`: String | Set timezone | `/config timezone timezone:America/New_York` |

### `/config autoresponse`

Manage automatic responses.

| Subcommand | Options | Description | Example |
|------------|---------|-------------|---------|
| `add` | `trigger`: String, `response`: String | Add auto response | `/config autoresponse add trigger:"hello" response:"Hi there!"` |
| `remove` | `trigger`: String | Remove auto response | `/config autoresponse remove trigger:"hello"` |
| `list` | None | List auto responses | `/config autoresponse list` |

## Moderation Commands

### `/ban`

Ban a user from the server.

| Options | Description | Example |
|---------|-------------|---------|
| `user`: User | The user to ban | `/ban user:@User` |
| `reason`: String | Reason for ban | `/ban user:@User reason:"Rule violation"` |
| `delete-days`: Integer | Delete message history (days) | `/ban user:@User reason:"Rule violation" delete-days:7` |

### `/kick`

Kick a user from the server.

| Options | Description | Example |
|---------|-------------|---------|
| `user`: User | The user to kick | `/kick user:@User` |
| `reason`: String | Reason for kick | `/kick user:@User reason:"Disruptive behavior"` |

### `/mute`

Mute a user in text and voice channels.

| Options | Description | Example |
|---------|-------------|---------|
| `user`: User | The user to mute | `/mute user:@User` |
| `duration`: String | Duration of mute | `/mute user:@User duration:1h` |
| `reason`: String | Reason for mute | `/mute user:@User duration:1h reason:"Spamming"` |

### `/warn`

Warn a user.

| Options | Description | Example |
|---------|-------------|---------|
| `user`: User | The user to warn | `/warn user:@User` |
| `reason`: String | Reason for warning | `/warn user:@User reason:"Inappropriate language"` |

### `/purge`

Delete multiple messages at once.

| Options | Description | Example |
|---------|-------------|---------|
| `amount`: Integer | Number of messages to delete | `/purge amount:10` |
| `user`: User | Only delete from this user | `/purge amount:10 user:@User` |

## Utility Commands

### `/poll`

Create a poll.

| Options | Description | Example |
|---------|-------------|---------|
| `question`: String | The poll question | `/poll question:"What game should we play?"` |
| `options`: String | Comma-separated options | `/poll question:"What game?" options:"Minecraft,Fortnite,Valorant"` |
| `duration`: String | Poll duration | `/poll question:"What game?" options:"Minecraft,Fortnite" duration:24h` |

### `/remind`

Set a reminder.

| Subcommand | Options | Description | Example |
|------------|---------|-------------|---------|
| `me` | `time`: String, `message`: String | Personal reminder | `/remind me time:1h message:"Check server"` |
| `channel` | `time`: String, `message`: String | Channel reminder | `/remind channel time:10m message:"Event starting soon"` |

### `/role`

Manage reaction roles.

| Subcommand | Options | Description | Example |
|------------|---------|-------------|---------|
| `create` | `channel`: Channel, `message`: String, `role`: Role, `emoji`: String | Create reaction role | `/role create channel:#roles message:"Get roles" role:@Gamer emoji:🎮` |
| `list` | None | List reaction roles | `/role list` |
| `remove` | `message-id`: String | Remove reaction role | `/role remove message-id:123456789` |

### `/ticket`

Manage support tickets.

| Subcommand | Options | Description | Example |
|------------|---------|-------------|---------|
| `setup` | `category`: String, `support-team`: Role | Set up ticket system | `/ticket setup category:"Support" support-team:@Support` |
| `panel` | `channel`: Channel, `title`: String, `description`: String | Create ticket panel | `/ticket panel channel:#help title:"Support" description:"Click for help"` |
| `close` | `reason`: String | Close a ticket | `/ticket close reason:"Issue resolved"` |

## Fun & Entertainment Commands

### `/giveaway`

Create and manage giveaways.

| Subcommand | Options | Description | Example |
|------------|---------|-------------|---------|
| `create` | `prize`: String, `winners`: Integer, `duration`: String | Create giveaway | `/giveaway create prize:"Nitro" winners:1 duration:7d` |
| `end` | `message-id`: String | End giveaway early | `/giveaway end message-id:123456789` |
| `reroll` | `message-id`: String | Reroll winners | `/giveaway reroll message-id:123456789` |

### `/custom`

Create and manage custom commands.

| Subcommand | Options | Description | Example |
|------------|---------|-------------|---------|
| `create` | `name`: String, `response`: String | Create custom command | `/custom create name:serverinfo response:"Server: {server}"` |
| `edit` | `name`: String, `response`: String | Edit custom command | `/custom edit name:serverinfo response:"New response"` |
| `delete` | `name`: String | Delete custom command | `/custom delete name:serverinfo` |
| `list` | None | List custom commands | `/custom list` |

## Leveling & Economy Commands

### `/level`

View and manage levels.

| Subcommand | Options | Description | Example |
|------------|---------|-------------|---------|
| (none) | None | View your level | `/level` |
| `user` | `user`: User | View user's level | `/level user:@User` |
| `system` | `enabled`: Boolean | Enable/disable system | `/level system enabled:true` |
| `settings` | `xp-min`: Integer, `xp-max`: Integer, `cooldown`: Integer | Configure settings | `/level settings xp-min:15 xp-max:25 cooldown:60` |

### `/leaderboard`

View the server's XP leaderboard.

| Options | Description | Example |
|---------|-------------|---------|
| `page`: Integer | Leaderboard page | `/leaderboard page:2` |

## External Integrations

### `/github`

Manage GitHub repository tracking.

| Subcommand | Options | Description | Example |
|------------|---------|-------------|---------|
| `track` | `repository`: String, `channel`: Channel | Track repository | `/github track repository:owner/repo channel:#github` |
| `untrack` | `repository`: String | Untrack repository | `/github untrack repository:owner/repo` |
| `list` | None | List tracked repositories | `/github list` |
| `set-channel` | `channel`: Channel | Set notification channel | `/github set-channel channel:#github` |

### `/twitter`

Manage Twitter account tracking.

| Subcommand | Options | Description | Example |
|------------|---------|-------------|---------|
| `track` | `username`: String, `channel`: Channel | Track account | `/twitter track username:elonmusk channel:#twitter` |
| `untrack` | `username`: String | Untrack account | `/twitter untrack username:elonmusk` |
| `list` | None | List tracked accounts | `/twitter list` |
| `set-channel` | `channel`: Channel | Set notification channel | `/twitter set-channel channel:#twitter` |

### `/twitch`

Manage Twitch streamer tracking.

| Subcommand | Options | Description | Example |
|------------|---------|-------------|---------|
| `track` | `username`: String, `channel`: Channel, `disable-updates`: Boolean | Track streamer | `/twitch track username:pokimane channel:#streams` |
| `untrack` | `username`: String | Untrack streamer | `/twitch untrack username:pokimane` |
| `list` | None | List tracked streamers | `/twitch list` |
| `set-channel` | `channel`: Channel | Set notification channel | `/twitch set-channel channel:#streams` |
| `toggle-updates` | `disable`: Boolean | Toggle stream updates | `/twitch toggle-updates disable:true` |

## AI & Image Commands

### `/ai chat`

Generate text with AI.

| Options | Description | Example |
|---------|-------------|---------|
| `prompt`: String | What to generate | `/ai chat prompt:"Write a poem about space"` |
| `model`: String | AI model to use | `/ai chat prompt:"Tell me a story" model:gpt-4` |

### `/ai image`

Generate images with AI.

| Options | Description | Example |
|---------|-------------|---------|
| `prompt`: String | Image description | `/ai image prompt:"sunset over mountains"` |
| `size`: String | Image size | `/ai image prompt:"cat" size:1024x1024` |

## Music Commands

### `/play`

Play music in a voice channel.

| Options | Description | Example |
|---------|-------------|---------|
| `query`: String | Song name or URL | `/play query:"never gonna give you up"` |

### `/queue`

View and manage the music queue.

| Subcommand | Options | Description | Example |
|------------|---------|-------------|---------|
| (none) | None | View the queue | `/queue` |
| `clear` | None | Clear the queue | `/queue clear` |
| `shuffle` | None | Shuffle the queue | `/queue shuffle` |

### `/volume`

Adjust music volume.

| Options | Description | Example |
|---------|-------------|---------|
| `level`: Integer | Volume level (0-100) | `/volume level:50` |

## Admin Commands

### `/schedule`

Manage scheduled events.

| Subcommand | Options | Description | Example |
|------------|---------|-------------|---------|
| `list` | None | List scheduled events | `/schedule list` |
| `create` | Various (see below) | Create scheduled event | See examples below |
| `delete` | `event-id`: String | Delete scheduled event | `/schedule delete event-id:123456` |
| `info` | `event-id`: String | Get event info | `/schedule info event-id:123456` |
| `enable` | `event-id`: String | Enable event | `/schedule enable event-id:123456` |
| `disable` | `event-id`: String | Disable event | `/schedule disable event-id:123456` |

Example for one-time event:
```
/schedule create name:"Server Maintenance" channel:#announcements type:one-time date:2023-06-15 time:16:00 message:"Server will be down for maintenance"
```

Example for recurring event:
```
/schedule create name:"Weekly Update" channel:#news type:recurring recurring:weekly day:monday time:10:00 message:"Weekly server updates!"
```

### `/backup`

Manage server backups.

| Subcommand | Options | Description | Example |
|------------|---------|-------------|---------|
| `create` | `name`: String, `description`: String | Create backup | `/backup create name:"Weekly" description:"Regular backup"` |
| `list` | None | List backups | `/backup list` |
| `info` | `backup-id`: String | Backup details | `/backup info backup-id:123456` |
| `restore` | `backup-id`: String | Restore backup | `/backup restore backup-id:123456` |
| `delete` | `backup-id`: String | Delete backup | `/backup delete backup-id:123456` |

---

This reference documentation covers the main commands available in AstroBot. For more detailed information about specific features, please refer to the dedicated documentation pages or use the `/help` command within Discord.