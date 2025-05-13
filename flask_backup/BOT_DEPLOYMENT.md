# AstroBot AI Discord Bot Deployment Guide

This guide provides detailed instructions for deploying the AstroBot AI Discord bot component in a production environment.

## Prerequisites

Before deploying the bot, ensure you have:

1. A Discord Bot application created in the [Discord Developer Portal](https://discord.com/developers/applications)
2. The Discord Bot Token
3. Enabled appropriate intents in the Developer Portal:
   - Server Members Intent
   - Message Content Intent
   - Presence Intent
4. A server with Python 3.9+ installed
5. Access to a PostgreSQL database (and optionally MongoDB)

## Bot Architecture

AstroBot AI's Discord bot component is built with discord.py and features:

- Shard management for scaling across multiple Discord servers
- Automatic reconnection with exponential backoff
- Comprehensive error handling and logging
- Multi-environment configuration support
- Asynchronous command processing
- Statistics tracking and performance monitoring
- Integrated health checks

## Step-by-Step Deployment

### 1. Environment Setup

Create a dedicated directory for the bot:

```bash
mkdir -p ~/astrobot/data
mkdir -p ~/astrobot/logs
cd ~/astrobot
```

Create a virtual environment:

```bash
python3 -m venv venv
source venv/bin/activate
```

Install required packages:

```bash
pip install discord.py==2.3.0 SQLAlchemy==2.0.0 psycopg2-binary==2.9.5 pymongo==4.3.3 python-dotenv==1.0.0 aiohttp==3.8.4 colorlog==6.7.0
```

### 2. Bot Configuration

Create a `.env` file with the necessary configurations:

```
# Required Settings
DISCORD_TOKEN=your_discord_bot_token
DATABASE_URL=postgresql://username:password@localhost:5432/astrobot
BOT_PREFIX=!

# Optional Settings
MONGODB_URI=mongodb://username:password@localhost:27017/astrobot
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
BOT_SHARD_COUNT=0
BOT_INTENTS=default
LOG_LEVEL=INFO
ENVIRONMENT=production
```

### 3. Bot Files

Download or copy the following essential files for the bot:

- `bot.py`: Main bot implementation
- `bot_config.py`: Configuration management
- `bot_health.py`: Health checking utilities
- `commands/`: Directory containing command modules
- `utils/`: Utility functions and helpers
- `services/`: Integration with external services

### 4. Database Setup

Ensure your database is properly set up before starting the bot:

```bash
# Connect to PostgreSQL
psql -h localhost -U postgres

# Create database and user
CREATE USER astrobot WITH PASSWORD 'secure_password';
CREATE DATABASE astrobot OWNER astrobot;
```

### 5. Running the Bot

For testing, you can run the bot directly:

```bash
python bot.py
```

However, for production use, you should set up a systemd service:

### 6. Creating a Systemd Service

Create a file named `astrobot.service`:

```
[Unit]
Description=AstroBot AI Discord Bot
After=network.target postgresql.service

[Service]
Type=simple
User=yourusername
WorkingDirectory=/home/yourusername/astrobot
ExecStart=/home/yourusername/astrobot/venv/bin/python bot.py
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=astrobot
Environment="DISCORD_TOKEN=your_token_here"
Environment="DATABASE_URL=postgresql://username:password@localhost/astrobot"
Environment="ENVIRONMENT=production"

[Install]
WantedBy=multi-user.target
```

Install and start the service:

```bash
sudo cp astrobot.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable astrobot
sudo systemctl start astrobot
```

Check service status:

```bash
sudo systemctl status astrobot
```

## Bot Administration

### Monitoring Bot Health

Use the included health check utility:

```bash
python bot_health.py
```

This will check:
- Discord token validity
- Database connections
- Bot statistics
- Log file health

### Viewing Logs

Bot logs are stored in the `logs` directory:

```bash
tail -f logs/bot.log
```

For systemd service logs:

```bash
sudo journalctl -u astrobot -f
```

### Managing the Bot

To stop the bot:

```bash
sudo systemctl stop astrobot
```

To restart the bot:

```bash
sudo systemctl restart astrobot
```

To view configuration details:

```bash
sudo systemctl show astrobot
```

## Advanced Configuration

### Sharding

For bots in more than 1,000 servers, enable sharding:

1. Set `BOT_SHARD_COUNT=auto` in your `.env` file
2. Alternatively, specify a specific number: `BOT_SHARD_COUNT=3`
3. Restart the bot to apply the changes

### Memory Optimization

For larger deployments, consider these optimizations:

1. Set `DISCORD_MEMBERS_CACHE=False` to disable member caching
2. Set `DISCORD_CHANNEL_CACHE=minimal` to reduce channel cache size
3. Increase the `ulimit` for the bot process if handling many connections

### Performance Monitoring

The bot automatically collects performance metrics:

- Command usage statistics
- Response time metrics
- API rate limit monitoring
- Connection stability tracking

Access these metrics through the web dashboard or by reviewing the stats file in the `data` directory.

## Securing Your Bot

### Token Security

- Never commit your token to version control
- Rotate your token if ever compromised
- Use environment variables or a secure `.env` file

### Permissions Management

- Use the least privileged permissions for your bot
- Regularly audit the permissions your bot requests
- Implement role-based command restrictions

### Database Security

- Use strong, unique passwords for database accounts
- Restrict network access to database servers
- Enable SSL for database connections
- Regularly back up your database

## Troubleshooting

### Common Issues

#### Bot fails to connect

Check:
- Discord token validity
- Network connectivity
- Discord API status
- Required intents are enabled

#### Bot crashes or disconnects

Check:
- Memory usage and system resources
- Error logs for exceptions
- Database connection stability
- Intents configuration

#### Commands not responding

Check:
- Command prefix configuration
- Command permissions
- Bot role hierarchy in servers
- Rate limiting status

### Getting Help

If you encounter issues not covered here:

- Check the Discord.py documentation
- Review the AstroBot AI documentation
- Search for similar issues in the project repository
- Contact support@astrobot-ai.com for assistance

## Upgrading

To upgrade the bot:

1. Stop the bot service: `sudo systemctl stop astrobot`
2. Back up the bot directory
3. Update the code files
4. Upgrade dependencies: `pip install --upgrade -r requirements.txt`
5. Start the bot service: `sudo systemctl start astrobot`

## Conclusion

This guide covers the essentials of deploying and maintaining the AstroBot AI Discord bot. For more detailed information about specific features or configurations, refer to the full documentation or the web dashboard admin panel.