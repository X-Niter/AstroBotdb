# AstroBot AI Production Deployment Guide

This guide provides comprehensive instructions for deploying AstroBot AI in a production environment.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Architecture Overview](#architecture-overview)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Database Setup](#database-setup)
6. [Running the Application](#running-the-application)
7. [Monitoring](#monitoring)
8. [Backup & Recovery](#backup--recovery)
9. [Scaling](#scaling)
10. [Troubleshooting](#troubleshooting)
11. [Security Considerations](#security-considerations)

## System Requirements

### Recommended Hardware

- **Small Deployment** (Up to 100 Discord servers):
  - 2 CPU cores
  - 4 GB RAM
  - 20 GB SSD storage

- **Medium Deployment** (100-500 Discord servers):
  - 4 CPU cores
  - 8 GB RAM
  - 40 GB SSD storage

- **Large Deployment** (500+ Discord servers):
  - 8+ CPU cores
  - 16+ GB RAM
  - 80+ GB SSD storage
  - Consider distributed setup with multiple bot instances

### Software Requirements

- Ubuntu 20.04 LTS or later (recommended)
- Python 3.9+ 
- PostgreSQL 13+
- MongoDB 5.0+ (optional, for enhanced analytics)
- Redis (optional, for caching/rate limiting)
- Nginx (for reverse proxy)
- Supervisor or systemd (for process management)
- UFW or similar firewall
- Let's Encrypt (for SSL certificates)

## Architecture Overview

AstroBot AI consists of two main components:

1. **Discord Bot**: Handles interactions within Discord, processing commands and events
2. **Web Dashboard**: Provides a user interface for configuration and analytics

The application uses:
- PostgreSQL as the primary database
- MongoDB for analytics data (optional)
- Redis for caching and rate limiting (optional)
- Socket.IO for real-time updates in the dashboard

## Installation

### 1. Create a System User

```bash
sudo adduser --system --group --home /opt/astrobot astrobot
sudo chown -R astrobot:astrobot /opt/astrobot
```

### 2. Clone the Repository

```bash
sudo -u astrobot git clone https://github.com/yourusername/astrobot-ai.git /opt/astrobot
cd /opt/astrobot
```

### 3. Set Up Python Environment

```bash
sudo -u astrobot python3 -m venv /opt/astrobot/venv
sudo -u astrobot /opt/astrobot/venv/bin/pip install --upgrade pip wheel
sudo -u astrobot /opt/astrobot/venv/bin/pip install -r requirements-prod.txt
```

### 4. Install Required System Dependencies

```bash
sudo apt update
sudo apt install -y postgresql nginx supervisor redis-server python3-dev build-essential libssl-dev
```

## Configuration

### 1. Environment Variables

Create a `.env` file in the application directory:

```bash
sudo -u astrobot touch /opt/astrobot/.env
sudo chmod 600 /opt/astrobot/.env
```

Edit the file to include required environment variables:

```
# Discord Bot Configuration
DISCORD_TOKEN=your_discord_bot_token
BOT_PREFIX=!
BOT_SHARD_COUNT=0

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/astrobot
MONGODB_URI=mongodb://username:password@localhost:27017/astrobot

# Web Dashboard Configuration
FLASK_ENV=production
SESSION_SECRET=your_random_secure_string
PORT=5000

# API Keys
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret

# Additional Settings
LOG_LEVEL=INFO
```

### 2. Nginx Configuration

Create an Nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/astrobot
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /socket.io {
        proxy_pass http://127.0.0.1:5000/socket.io;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable the configuration:

```bash
sudo ln -s /etc/nginx/sites-available/astrobot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. Set Up SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 4. Systemd Service

Use the provided `astrobot.service` file:

```bash
sudo cp /opt/astrobot/astrobot.service /etc/systemd/system/
sudo systemctl daemon-reload
```

## Database Setup

### 1. PostgreSQL Setup

```bash
sudo -u postgres psql
```

In the PostgreSQL shell:

```sql
CREATE USER astrobot WITH PASSWORD 'secure_password';
CREATE DATABASE astrobot OWNER astrobot;
\q
```

Update the `.env` file with the PostgreSQL connection string.

### 2. MongoDB Setup (Optional)

```bash
mongosh
```

In the MongoDB shell:

```javascript
use admin
db.createUser({
  user: "astrobot",
  pwd: "secure_password",
  roles: [{ role: "readWrite", db: "astrobot" }]
})
exit
```

Update the `.env` file with the MongoDB connection string.

## Running the Application

### 1. Initialize the Database

```bash
cd /opt/astrobot
sudo -u astrobot /opt/astrobot/venv/bin/python -c "from app import db; db.create_all()"
```

### 2. Start the Application with Systemd

```bash
sudo systemctl enable astrobot
sudo systemctl start astrobot
```

### 3. Using the Deployment Script

Alternatively, use the provided deployment script:

```bash
cd /opt/astrobot
sudo -u astrobot /opt/astrobot/venv/bin/python deploy.py --install-service
```

This script:
- Checks environment variables
- Creates necessary directories
- Installs dependencies
- Builds assets
- Sets up systemd service
- Starts the application

## Monitoring

### 1. Logging

All logs are stored in the `logs/` directory:

- `app.log`: Main application logs
- `bot.log`: Discord bot logs
- `gunicorn-access.log`: Web server access logs
- `gunicorn-error.log`: Web server error logs

### 2. Health Checks

#### Bot Health Check Script

Use the comprehensive bot health check script for terminal-based monitoring:

```bash
/opt/astrobot/venv/bin/python bot_health.py
```

This script checks:
- PostgreSQL connection and status
- MongoDB connection and status
- Discord token validity
- Bot status and statistics
- Log files for errors

The script can output results in JSON format for integration with monitoring systems:

```bash
/opt/astrobot/venv/bin/python bot_health.py --json
```

#### HTTP Health Check Endpoint

The application exposes a `/health` HTTP endpoint that returns detailed health information in JSON format:

```bash
curl http://localhost:5000/health
```

This endpoint provides:
- Overall application status
- Database connection status (PostgreSQL and MongoDB)
- Connection pool metrics
- System resource usage (disk space, memory)
- Feature flag statuses
- Uptime statistics
- Response time metrics

For convenient terminal-based monitoring, use the provided shell script:

```bash
/opt/astrobot/health_check.sh [URL]
```

This script provides a human-readable output of the health check results and returns appropriate exit codes (0 for healthy, non-zero for issues) for integration with monitoring systems.

#### Monitoring Integration

The HTTP health endpoint can be integrated with:
- Prometheus with the Blackbox exporter
- Datadog with HTTP check
- Nagios or Icinga with HTTP check plugins
- Custom monitoring solutions with the JSON output

### 3. External Monitoring Integration

The application can be configured to send metrics to:

- Prometheus (using prometheus-client)
- Datadog (using datadog-api-client)

## Backup & Recovery

### 1. Database Backup

Use the built-in backup functionality in the deployment script:

```bash
/opt/astrobot/venv/bin/python deploy.py --backup-db
```

This creates a timestamped backup in `data/backups/`.

### 2. Automated Backups

Set up a daily backup cron job:

```bash
sudo crontab -e
```

Add:

```
0 2 * * * cd /opt/astrobot && /opt/astrobot/venv/bin/python deploy.py --backup-db >> /var/log/astrobot-backup.log 2>&1
```

### 3. Recovery

To restore from a backup:

```bash
pg_restore -h localhost -U astrobot -d astrobot -c /opt/astrobot/data/backups/backup_file.sql
```

## Scaling

### 1. Bot Sharding

For more than 1,000 Discord servers, enable sharding:

1. Set `BOT_SHARD_COUNT=auto` in `.env`
2. Restart the application

### 2. Load Balancing

For high-traffic web dashboards:

1. Deploy multiple instances behind a load balancer
2. Use sticky sessions for Socket.IO
3. Share session state using Redis

### 3. Database Scaling

- Use connection pooling (already configured)
- Consider read replicas for PostgreSQL
- Use MongoDB Atlas for scalable analytics

## Troubleshooting

### Common Issues

#### Bot doesn't connect to Discord

1. Check `DISCORD_TOKEN` in `.env`
2. Verify intents are enabled in Discord Developer Portal
3. Check network connectivity to Discord API
4. Look for errors in `logs/bot.log`

#### Database connection errors

1. Verify PostgreSQL/MongoDB service is running
2. Check connection strings in `.env`
3. Ensure database user has correct permissions
4. Check for firewall issues

#### Web dashboard not loading

1. Check if gunicorn is running: `systemctl status astrobot`
2. Verify Nginx configuration: `nginx -t`
3. Look for errors in `logs/gunicorn-error.log`
4. Check browser console for JavaScript errors

### Debugging Tools

- Use `bot_health.py` for comprehensive health checks
- Monitor system resources with `htop`
- Check logs for specific errors
- Use the admin dashboard for bot status

## Security Considerations

### 1. Secure Environment Variables

- Store secrets in environment variables
- Use `.env` file with restricted permissions
- Consider a secret management system like HashiCorp Vault

### 2. Regular Updates

- Keep dependencies up-to-date with security fixes
- Update the application code regularly
- Use automatic security updates for the operating system

### 3. Firewall Configuration

- Restrict access to only necessary ports (80, 443, 22)
- Use UFW for simple firewall management

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow ssh
sudo ufw enable
```

### 4. Secure Database Access

- Use strong passwords for database users
- Restrict network access to database servers
- Regularly backup databases
- Use encrypted connections

### 5. Web Security

- Enable HTTPS with Let's Encrypt
- Set secure cookies (already configured)
- Implement rate limiting (already configured)
- Set appropriate CORS policies

### 6. Bot Permissions

- Use minimal required permissions for the Discord bot
- Implement role-based access control in the dashboard
- Regularly audit bot access and activity

## Additional Resources

- [Discord Developer Portal](https://discord.com/developers)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [discord.py Documentation](https://discordpy.readthedocs.io/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [MongoDB Documentation](https://docs.mongodb.com/)

## Support

For assistance with deployment issues:

- Check the troubleshooting section
- Review GitHub issues and wiki
- Reach out to support@astrobot-ai.com