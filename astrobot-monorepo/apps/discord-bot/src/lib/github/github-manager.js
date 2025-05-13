/**
 * GitHub Manager
 * Handles GitHub repository tracking and notifications
 */

const { Collection, EmbedBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const logger = require('../logger');

// Path to github tracking file
const GITHUB_TRACKING_FILE = path.join(process.cwd(), 'data', 'github-tracking.json');

// Collection of tracked repositories (guildId -> { channels: [], repositories: [] })
const trackedRepos = new Collection();

// Cache of last events for each repository
const repoEventCache = new Collection();

// Polling interval (in ms)
const POLLING_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Polling timer
let pollingTimer = null;

/**
 * Initialize GitHub manager
 * @returns {Promise<boolean>} Whether initialization was successful
 */
async function initialize() {
  try {
    logger.info('Initializing GitHub manager...');
    
    // Load tracked repositories
    await loadTrackedRepos();
    
    // Start polling
    startPolling();
    
    logger.info('GitHub manager initialized successfully');
    return true;
  } catch (error) {
    logger.error('Error initializing GitHub manager:', error);
    return false;
  }
}

/**
 * Shutdown GitHub manager
 */
function shutdown() {
  try {
    logger.info('Shutting down GitHub manager...');
    
    // Stop polling
    if (pollingTimer) {
      clearInterval(pollingTimer);
      pollingTimer = null;
    }
    
    logger.info('GitHub manager shut down successfully');
  } catch (error) {
    logger.error('Error shutting down GitHub manager:', error);
  }
}

/**
 * Load tracked repositories from disk
 * @returns {Promise<void>}
 */
async function loadTrackedRepos() {
  try {
    // Clear collection
    trackedRepos.clear();
    
    // Check if file exists
    try {
      await fs.access(GITHUB_TRACKING_FILE);
    } catch (error) {
      // File doesn't exist, create it
      await saveTrackedRepos();
      return;
    }
    
    // Read file
    const data = await fs.readFile(GITHUB_TRACKING_FILE, 'utf8');
    
    // Parse JSON
    const parsed = JSON.parse(data);
    
    // Load tracked repositories
    for (const [guildId, config] of Object.entries(parsed)) {
      trackedRepos.set(guildId, config);
    }
    
    logger.debug('Tracked repositories loaded from disk');
  } catch (error) {
    logger.error('Error loading tracked repositories:', error);
    throw error;
  }
}

/**
 * Save tracked repositories to disk
 * @returns {Promise<void>}
 */
async function saveTrackedRepos() {
  try {
    // Create data object
    const data = {};
    
    for (const [guildId, config] of trackedRepos.entries()) {
      data[guildId] = config;
    }
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(GITHUB_TRACKING_FILE), { recursive: true });
    
    // Write file
    await fs.writeFile(GITHUB_TRACKING_FILE, JSON.stringify(data, null, 2));
    
    logger.debug('Tracked repositories saved to disk');
  } catch (error) {
    logger.error('Error saving tracked repositories:', error);
    throw error;
  }
}

/**
 * Start polling for GitHub events
 */
function startPolling() {
  // Clear existing timer
  if (pollingTimer) {
    clearInterval(pollingTimer);
  }
  
  // Check immediately on startup
  checkForUpdates();
  
  // Set timer for periodic checks
  pollingTimer = setInterval(checkForUpdates, POLLING_INTERVAL);
  
  logger.debug('GitHub polling started');
}

/**
 * Check for updates in tracked repositories
 */
async function checkForUpdates() {
  try {
    logger.debug('Checking for GitHub updates...');
    
    // Get all unique repositories across all guilds
    const uniqueRepos = new Set();
    
    for (const [_, config] of trackedRepos.entries()) {
      for (const repo of config.repositories) {
        uniqueRepos.add(repo);
      }
    }
    
    // Check each repository
    for (const repoFullName of uniqueRepos) {
      try {
        await checkRepositoryEvents(repoFullName);
      } catch (error) {
        logger.error(`Error checking repository ${repoFullName}:`, error);
      }
    }
  } catch (error) {
    logger.error('Error checking for GitHub updates:', error);
  }
}

/**
 * Check events for a repository
 * @param {string} repoFullName - The full name of the repository (owner/repo)
 */
async function checkRepositoryEvents(repoFullName) {
  try {
    // Get events
    const events = await fetchRepositoryEvents(repoFullName);
    
    // Skip if no events
    if (!events || events.length === 0) {
      return;
    }
    
    // Get cached events
    const cachedEvents = repoEventCache.get(repoFullName) || [];
    
    // Find new events (events that weren't in the cache)
    const cachedEventIds = new Set(cachedEvents.map(e => e.id));
    const newEvents = events.filter(event => !cachedEventIds.has(event.id));
    
    // Skip if no new events
    if (newEvents.length === 0) {
      return;
    }
    
    // Update cache with new events
    repoEventCache.set(repoFullName, events.slice(0, 30)); // Keep last 30 events
    
    // Process new events (newest first)
    for (const event of newEvents.reverse()) {
      await processEvent(repoFullName, event);
    }
  } catch (error) {
    logger.error(`Error checking events for repository ${repoFullName}:`, error);
    throw error;
  }
}

/**
 * Fetch events for a repository
 * @param {string} repoFullName - The full name of the repository (owner/repo)
 * @returns {Promise<Array>} The events
 */
async function fetchRepositoryEvents(repoFullName) {
  try {
    // Call GitHub API to get events
    const response = await axios.get(
      `https://api.github.com/repos/${repoFullName}/events`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'AstroBot-Discord'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    if (error.response) {
      logger.error(`GitHub API error (${error.response.status}) for ${repoFullName}:`, error.response.data);
      
      // Handle rate limiting
      if (error.response.status === 403 && error.response.headers['x-ratelimit-remaining'] === '0') {
        const resetTime = error.response.headers['x-ratelimit-reset'];
        const resetDate = new Date(resetTime * 1000);
        logger.error(`GitHub API rate limit exceeded. Resets at ${resetDate.toISOString()}`);
      }
    } else {
      logger.error(`Error fetching events for repository ${repoFullName}:`, error);
    }
    
    throw error;
  }
}

/**
 * Process a GitHub event
 * @param {string} repoFullName - The full name of the repository (owner/repo)
 * @param {Object} event - The event to process
 */
async function processEvent(repoFullName, event) {
  try {
    // Skip event types we don't care about
    if (!shouldProcessEvent(event)) {
      return;
    }
    
    // Prepare notification
    const embed = createEventEmbed(repoFullName, event);
    
    // Skip if embed couldn't be created
    if (!embed) {
      return;
    }
    
    // Find all guilds tracking this repository
    for (const [guildId, config] of trackedRepos.entries()) {
      // Skip if guild isn't tracking this repository
      if (!config.repositories.includes(repoFullName)) {
        continue;
      }
      
      // Send notification to all channels in the guild
      for (const channelId of config.channels) {
        try {
          // Get channel
          const channel = await global.client.channels.fetch(channelId).catch(() => null);
          
          // Skip if channel not found
          if (!channel) {
            logger.error(`Channel ${channelId} not found for GitHub notification in guild ${guildId}`);
            continue;
          }
          
          // Skip if channel is not text-based
          if (!channel.isTextBased() || channel.isVoiceBased()) {
            logger.error(`Channel ${channelId} is not text-based for GitHub notification in guild ${guildId}`);
            continue;
          }
          
          // Send notification
          await channel.send({ embeds: [embed] });
        } catch (error) {
          logger.error(`Error sending GitHub notification to channel ${channelId} in guild ${guildId}:`, error);
        }
      }
    }
  } catch (error) {
    logger.error(`Error processing GitHub event for ${repoFullName}:`, error);
  }
}

/**
 * Check if an event should be processed
 * @param {Object} event - The event to check
 * @returns {boolean} Whether the event should be processed
 */
function shouldProcessEvent(event) {
  // List of event types we care about
  const relevantEventTypes = [
    'PushEvent',
    'PullRequestEvent',
    'IssuesEvent',
    'IssueCommentEvent',
    'CreateEvent',
    'ReleaseEvent',
    'ForkEvent',
    'WatchEvent' // Star event
  ];
  
  return relevantEventTypes.includes(event.type);
}

/**
 * Create an embed for a GitHub event
 * @param {string} repoFullName - The full name of the repository (owner/repo)
 * @param {Object} event - The event
 * @returns {EmbedBuilder} The embed
 */
function createEventEmbed(repoFullName, event) {
  try {
    const embed = new EmbedBuilder()
      .setColor('#171515') // GitHub black
      .setAuthor({
        name: event.actor.login,
        iconURL: event.actor.avatar_url,
        url: `https://github.com/${event.actor.login}`
      })
      .setFooter({
        text: 'GitHub',
        iconURL: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
      })
      .setTimestamp(new Date(event.created_at));
    
    const [repoOwner, repoName] = repoFullName.split('/');
    
    // Add repository link
    embed.setURL(`https://github.com/${repoFullName}`);
    
    // Process event based on type
    switch (event.type) {
      case 'PushEvent': {
        // Get payload data
        const branch = event.payload.ref.replace('refs/heads/', '');
        const commits = event.payload.commits;
        
        embed.setTitle(`[${repoName}] New push to ${branch}`);
        
        // Add commit info
        const commitCount = commits.length;
        const commitText = commitCount === 1 ? '1 commit' : `${commitCount} commits`;
        
        let description = `${event.actor.login} pushed ${commitText}:\n`;
        
        // Add up to 5 commits
        const displayCommits = commits.slice(0, 5);
        
        for (const commit of displayCommits) {
          const shortHash = commit.sha.substring(0, 7);
          const message = commit.message.split('\n')[0]; // First line only
          
          description += `[\`${shortHash}\`](https://github.com/${repoFullName}/commit/${commit.sha}) ${message}\n`;
        }
        
        // Add ellipsis if there are more commits
        if (commitCount > 5) {
          description += `... and ${commitCount - 5} more commits`;
        }
        
        embed.setDescription(description);
        break;
      }
      
      case 'PullRequestEvent': {
        // Get payload data
        const action = event.payload.action;
        const pr = event.payload.pull_request;
        
        // Skip if not opened, closed, or merged
        if (!['opened', 'closed'].includes(action)) {
          return null;
        }
        
        // Set title based on action
        if (action === 'opened') {
          embed.setTitle(`[${repoName}] New pull request: #${pr.number} ${pr.title}`);
          embed.setColor('#28a745'); // GitHub green
        } else if (action === 'closed') {
          if (pr.merged) {
            embed.setTitle(`[${repoName}] Pull request merged: #${pr.number} ${pr.title}`);
            embed.setColor('#6f42c1'); // GitHub purple
          } else {
            embed.setTitle(`[${repoName}] Pull request closed: #${pr.number} ${pr.title}`);
            embed.setColor('#cb2431'); // GitHub red
          }
        }
        
        // Add PR details
        embed.setDescription(pr.body ? pr.body.substring(0, 200) + (pr.body.length > 200 ? '...' : '') : '');
        embed.setURL(pr.html_url);
        
        // Add source and target branches
        embed.addFields(
          { name: 'Source', value: `${pr.head.label}`, inline: true },
          { name: 'Target', value: `${pr.base.label}`, inline: true }
        );
        
        break;
      }
      
      case 'IssuesEvent': {
        // Get payload data
        const action = event.payload.action;
        const issue = event.payload.issue;
        
        // Skip if not opened or closed
        if (!['opened', 'closed', 'reopened'].includes(action)) {
          return null;
        }
        
        // Set title based on action
        if (action === 'opened') {
          embed.setTitle(`[${repoName}] New issue: #${issue.number} ${issue.title}`);
          embed.setColor('#28a745'); // GitHub green
        } else if (action === 'closed') {
          embed.setTitle(`[${repoName}] Issue closed: #${issue.number} ${issue.title}`);
          embed.setColor('#cb2431'); // GitHub red
        } else if (action === 'reopened') {
          embed.setTitle(`[${repoName}] Issue reopened: #${issue.number} ${issue.title}`);
          embed.setColor('#2188ff'); // GitHub blue
        }
        
        // Add issue details
        embed.setDescription(issue.body ? issue.body.substring(0, 200) + (issue.body.length > 200 ? '...' : '') : '');
        embed.setURL(issue.html_url);
        
        break;
      }
      
      case 'IssueCommentEvent': {
        // Get payload data
        const action = event.payload.action;
        const issue = event.payload.issue;
        const comment = event.payload.comment;
        
        // Skip if not created
        if (action !== 'created') {
          return null;
        }
        
        // Determine if it's a PR or issue
        const isPR = issue.pull_request ? true : false;
        
        embed.setTitle(`[${repoName}] New comment on ${isPR ? 'pull request' : 'issue'} #${issue.number}: ${issue.title}`);
        embed.setColor('#2188ff'); // GitHub blue
        
        // Add comment details
        embed.setDescription(comment.body ? comment.body.substring(0, 200) + (comment.body.length > 200 ? '...' : '') : '');
        embed.setURL(comment.html_url);
        
        break;
      }
      
      case 'CreateEvent': {
        // Get payload data
        const refType = event.payload.ref_type;
        const ref = event.payload.ref;
        
        // Skip if not branch or tag
        if (!['branch', 'tag'].includes(refType)) {
          return null;
        }
        
        embed.setTitle(`[${repoName}] New ${refType} created: ${ref}`);
        embed.setColor('#28a745'); // GitHub green
        
        if (refType === 'branch') {
          embed.setURL(`https://github.com/${repoFullName}/tree/${ref}`);
        } else {
          embed.setURL(`https://github.com/${repoFullName}/releases/tag/${ref}`);
        }
        
        break;
      }
      
      case 'ReleaseEvent': {
        // Get payload data
        const action = event.payload.action;
        const release = event.payload.release;
        
        // Skip if not published
        if (action !== 'published') {
          return null;
        }
        
        embed.setTitle(`[${repoName}] New release: ${release.tag_name} - ${release.name || 'Unnamed release'}`);
        embed.setColor('#f9c513'); // GitHub yellow
        
        // Add release details
        embed.setDescription(release.body ? release.body.substring(0, 200) + (release.body.length > 200 ? '...' : '') : '');
        embed.setURL(release.html_url);
        
        break;
      }
      
      case 'ForkEvent': {
        // Get payload data
        const forkee = event.payload.forkee;
        
        embed.setTitle(`[${repoName}] Repository forked by ${event.actor.login}`);
        embed.setColor('#2188ff'); // GitHub blue
        embed.setURL(forkee.html_url);
        
        break;
      }
      
      case 'WatchEvent': {
        // Watch event = star event
        embed.setTitle(`[${repoName}] Repository starred by ${event.actor.login}`);
        embed.setColor('#f9c513'); // GitHub yellow
        
        break;
      }
      
      default:
        // Skip other event types
        return null;
    }
    
    return embed;
  } catch (error) {
    logger.error(`Error creating embed for GitHub event:`, error);
    return null;
  }
}

/**
 * Track a GitHub repository for a guild
 * @param {string} guildId - The guild ID
 * @param {string} channelId - The channel ID to send notifications to
 * @param {string} repoFullName - The full name of the repository (owner/repo)
 * @returns {Promise<Object>} The updated tracking config
 */
async function trackRepository(guildId, channelId, repoFullName) {
  try {
    // Get current config or create new one
    const config = trackedRepos.get(guildId) || {
      channels: [],
      repositories: []
    };
    
    // Add channel if it doesn't exist
    if (!config.channels.includes(channelId)) {
      config.channels.push(channelId);
    }
    
    // Add repository if it doesn't exist
    if (!config.repositories.includes(repoFullName)) {
      config.repositories.push(repoFullName);
    }
    
    // Update collection
    trackedRepos.set(guildId, config);
    
    // Save to disk
    await saveTrackedRepos();
    
    // Seed initial data for the repository
    try {
      const events = await fetchRepositoryEvents(repoFullName);
      
      if (events && events.length > 0) {
        repoEventCache.set(repoFullName, events.slice(0, 30)); // Keep last 30 events
      }
    } catch (error) {
      logger.error(`Error seeding events for repository ${repoFullName}:`, error);
    }
    
    return config;
  } catch (error) {
    logger.error(`Error tracking repository ${repoFullName} for guild ${guildId}:`, error);
    throw error;
  }
}

/**
 * Untrack a GitHub repository for a guild
 * @param {string} guildId - The guild ID
 * @param {string} repoFullName - The full name of the repository (owner/repo)
 * @returns {Promise<Object>} The updated tracking config
 */
async function untrackRepository(guildId, repoFullName) {
  try {
    // Get current config
    const config = trackedRepos.get(guildId);
    
    // Skip if no config exists
    if (!config) {
      return null;
    }
    
    // Remove repository
    config.repositories = config.repositories.filter(repo => repo !== repoFullName);
    
    // Update collection
    trackedRepos.set(guildId, config);
    
    // Save to disk
    await saveTrackedRepos();
    
    return config;
  } catch (error) {
    logger.error(`Error untracking repository ${repoFullName} for guild ${guildId}:`, error);
    throw error;
  }
}

/**
 * Get all tracked repositories for a guild
 * @param {string} guildId - The guild ID
 * @returns {Object} The tracking config
 */
function getTrackedRepositories(guildId) {
  return trackedRepos.get(guildId) || {
    channels: [],
    repositories: []
  };
}

/**
 * Set notification channels for a guild
 * @param {string} guildId - The guild ID
 * @param {Array<string>} channelIds - The channel IDs
 * @returns {Promise<Object>} The updated tracking config
 */
async function setNotificationChannels(guildId, channelIds) {
  try {
    // Get current config or create new one
    const config = trackedRepos.get(guildId) || {
      channels: [],
      repositories: []
    };
    
    // Update channels
    config.channels = channelIds;
    
    // Update collection
    trackedRepos.set(guildId, config);
    
    // Save to disk
    await saveTrackedRepos();
    
    return config;
  } catch (error) {
    logger.error(`Error setting notification channels for guild ${guildId}:`, error);
    throw error;
  }
}

/**
 * Check if a repository exists
 * @param {string} repoFullName - The full name of the repository (owner/repo)
 * @returns {Promise<boolean>} Whether the repository exists
 */
async function checkRepositoryExists(repoFullName) {
  try {
    // Call GitHub API to get repository
    const response = await axios.get(
      `https://api.github.com/repos/${repoFullName}`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'AstroBot-Discord'
        }
      }
    );
    
    return response.status === 200;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      // Repository not found
      return false;
    }
    
    logger.error(`Error checking if repository ${repoFullName} exists:`, error);
    throw error;
  }
}

module.exports = {
  initialize,
  shutdown,
  trackRepository,
  untrackRepository,
  getTrackedRepositories,
  setNotificationChannels,
  checkRepositoryExists
};