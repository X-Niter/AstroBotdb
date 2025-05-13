/**
 * Command Deployment Script
 * 
 * This script is used to deploy commands to Discord without starting the bot.
 * Use it when you need to update command definitions but don't want to restart the bot.
 */

const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const args = process.argv.slice(2);
const isGlobal = args.includes('--global');

// Check for required environment variables
if (!process.env.DISCORD_TOKEN) {
  console.error('DISCORD_TOKEN environment variable is required');
  process.exit(1);
}

if (!process.env.TEST_GUILD_ID && !isGlobal) {
  console.error('TEST_GUILD_ID environment variable is required for guild deployments');
  console.error('Use --global flag to deploy commands globally');
  process.exit(1);
}

// Get the application ID from the token
const token = process.env.DISCORD_TOKEN;
const tokenParts = token.split('.');
if (tokenParts.length !== 3) {
  console.error('Invalid Discord token format');
  process.exit(1);
}

// Extract the application ID from the token
const payload = JSON.parse(Buffer.from(tokenParts[0], 'base64').toString());
const clientId = payload.id || payload.bot_id;

if (!clientId) {
  console.error('Could not extract application ID from token');
  process.exit(1);
}

// Configure REST client
const rest = new REST({ version: '10' }).setToken(token);

// Load command files
async function loadCommands() {
  const commands = [];
  const commandsPath = path.join(__dirname, '../src/commands');
  const commandFolders = fs.readdirSync(commandsPath);
  
  for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    
    // Skip if not a directory
    if (!fs.statSync(folderPath).isDirectory()) continue;
    
    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
      const filePath = path.join(folderPath, file);
      try {
        const command = require(filePath);
        
        if (command.data && (command.type === 'SLASH_COMMAND' || 
                            command.type === 'USER_CONTEXT_MENU' || 
                            command.type === 'MESSAGE_CONTEXT_MENU')) {
          commands.push(command.data.toJSON());
          console.log(`Loaded command: ${command.data.name}`);
        } else {
          console.warn(`Skipping invalid command at ${filePath}`);
        }
      } catch (error) {
        console.error(`Error loading command at ${filePath}:`, error);
      }
    }
  }
  
  return commands;
}

// Deploy commands
async function deployCommands() {
  try {
    console.log('Loading commands...');
    const commands = await loadCommands();
    
    console.log(`Loaded ${commands.length} command(s) for deployment`);
    
    if (commands.length === 0) {
      console.warn('No commands to deploy. Exiting...');
      process.exit(0);
    }
    
    const deployTarget = isGlobal 
      ? `global application commands (${clientId})`
      : `guild commands (Guild: ${process.env.TEST_GUILD_ID}, App: ${clientId})`;
    
    console.log(`Started deploying ${commands.length} ${deployTarget}...`);
    
    // Deploy commands
    const data = isGlobal
      ? await rest.put(Routes.applicationCommands(clientId), { body: commands })
      : await rest.put(
          Routes.applicationGuildCommands(clientId, process.env.TEST_GUILD_ID),
          { body: commands }
        );
    
    console.log(`Successfully deployed ${data.length} ${deployTarget}!`);
  } catch (error) {
    console.error('Error deploying commands:', error);
  }
}

// Run the deployment
deployCommands();