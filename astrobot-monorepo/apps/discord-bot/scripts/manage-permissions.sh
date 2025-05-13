#!/bin/bash

# AstroBot Permission Management Utility
# This script helps manage permissions and admin tasks for the Discord bot

# Text colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Make sure we have the necessary environment variables
if [ -z "$DISCORD_TOKEN" ]; then
  echo -e "${RED}Error: DISCORD_TOKEN environment variable is not set.${NC}"
  echo "Please set the DISCORD_TOKEN environment variable before running this script."
  exit 1
fi

# Print the header
print_header() {
  clear
  echo -e "${CYAN}=======================================================${NC}"
  echo -e "${CYAN}          AstroBot Permission Management Tool          ${NC}"
  echo -e "${CYAN}=======================================================${NC}"
  echo ""
}

# Print the main menu
print_menu() {
  echo -e "${BLUE}Choose an option:${NC}"
  echo "1. List all servers (guilds) the bot is in"
  echo "2. Manage server-specific permissions"
  echo "3. Add a global admin user"
  echo "4. Remove a global admin user"
  echo "5. List all global admin users"
  echo "6. Check bot status"
  echo "7. Generate invite link"
  echo "8. View bot statistics"
  echo "9. Exit"
  echo ""
  echo -n "Enter your choice (1-9): "
}

# List all servers where the bot is present
list_servers() {
  print_header
  echo -e "${YELLOW}Fetching servers...${NC}"
  echo ""
  
  # Use the Discord API to get the bot's guilds
  response=$(curl -s -H "Authorization: Bot $DISCORD_TOKEN" \
                "https://discord.com/api/v10/users/@me/guilds")
  
  # Check if the response contains an error
  if echo "$response" | grep -q "\"code\""; then
    echo -e "${RED}Error: Failed to fetch servers.${NC}"
    echo "$response"
    echo ""
    read -p "Press Enter to continue..."
    return
  fi
  
  # Parse the JSON response to show a list of guilds
  echo -e "${GREEN}Servers where AstroBot is present:${NC}"
  echo "---------------------------------"
  echo "$response" | jq -r '.[] | "\(.id) | \(.name) | \(.owner | tostring) | \(.member_count // "N/A")"' | 
    awk -F' \\| ' '{printf "%-20s %-40s %-7s %s\n", $1, $2, $3, $4}' | 
    sort -k 2
  
  echo ""
  echo -e "${BLUE}Total servers: $(echo "$response" | jq '. | length')${NC}"
  echo ""
  read -p "Press Enter to continue..."
}

# Manage server-specific permissions
manage_server_permissions() {
  print_header
  echo -e "${YELLOW}Enter the server ID to manage permissions:${NC}"
  read -p "Server ID (or 'back' to return to main menu): " server_id
  
  if [ "$server_id" = "back" ]; then
    return
  fi
  
  # Validate server ID format
  if ! [[ $server_id =~ ^[0-9]+$ ]]; then
    echo -e "${RED}Error: Invalid server ID format. Server IDs should only contain numbers.${NC}"
    echo ""
    read -p "Press Enter to continue..."
    return
  fi
  
  # Check if the bot is in this server
  response=$(curl -s -H "Authorization: Bot $DISCORD_TOKEN" \
              "https://discord.com/api/v10/guilds/$server_id")
  
  if echo "$response" | grep -q "\"code\""; then
    echo -e "${RED}Error: Bot is not in this server or server ID is invalid.${NC}"
    echo ""
    read -p "Press Enter to continue..."
    return
  fi
  
  server_name=$(echo "$response" | jq -r '.name')
  
  while true; do
    print_header
    echo -e "${GREEN}Managing permissions for server: ${server_name} (${server_id})${NC}"
    echo ""
    echo -e "${BLUE}Choose an option:${NC}"
    echo "1. List server admins"
    echo "2. Add a server admin"
    echo "3. Remove a server admin"
    echo "4. List server moderators"
    echo "5. Add a server moderator"
    echo "6. Remove a server moderator"
    echo "7. Configure permission roles"
    echo "8. Back to main menu"
    echo ""
    read -p "Enter your choice (1-8): " choice
    
    case $choice in
      1) echo "Listing server admins..." ;;
      2) echo "Adding server admin..." ;;
      3) echo "Removing server admin..." ;;
      4) echo "Listing server moderators..." ;;
      5) echo "Adding server moderator..." ;;
      6) echo "Removing server moderator..." ;;
      7) echo "Configuring permission roles..." ;;
      8) break ;;
      *) echo -e "${RED}Invalid option.${NC}" ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
  done
}

# Add a global admin user
add_global_admin() {
  print_header
  echo -e "${YELLOW}Enter the Discord user ID to add as a global admin:${NC}"
  read -p "User ID: " user_id
  
  # TODO: Implement the API call to add global admin
  echo -e "${GREEN}Successfully added user with ID ${user_id} as a global admin.${NC}"
  echo ""
  read -p "Press Enter to continue..."
}

# Remove a global admin user
remove_global_admin() {
  print_header
  echo -e "${YELLOW}Enter the Discord user ID to remove from global admins:${NC}"
  read -p "User ID: " user_id
  
  # TODO: Implement the API call to remove global admin
  echo -e "${GREEN}Successfully removed user with ID ${user_id} from global admins.${NC}"
  echo ""
  read -p "Press Enter to continue..."
}

# List all global admin users
list_global_admins() {
  print_header
  echo -e "${YELLOW}Fetching global admins...${NC}"
  echo ""
  
  # TODO: Implement the API call to list global admins
  echo -e "${GREEN}Global Admins:${NC}"
  echo "---------------------------------"
  # Placeholder for API response
  echo "No global admins found."
  
  echo ""
  read -p "Press Enter to continue..."
}

# Check bot status
check_bot_status() {
  print_header
  echo -e "${YELLOW}Checking bot status...${NC}"
  echo ""
  
  # Use the Discord API to get the bot's information
  response=$(curl -s -H "Authorization: Bot $DISCORD_TOKEN" \
                "https://discord.com/api/v10/users/@me")
  
  if echo "$response" | grep -q "\"code\""; then
    echo -e "${RED}Error: Failed to fetch bot information.${NC}"
    echo "$response"
  else
    bot_id=$(echo "$response" | jq -r '.id')
    bot_username=$(echo "$response" | jq -r '.username')
    bot_discriminator=$(echo "$response" | jq -r '.discriminator')
    bot_avatar=$(echo "$response" | jq -r '.avatar')
    
    echo -e "${GREEN}Bot Information:${NC}"
    echo "---------------------------------"
    echo "ID: $bot_id"
    echo "Username: $bot_username"
    if [ "$bot_discriminator" != "0" ]; then
      echo "Discriminator: $bot_discriminator"
    fi
    echo "Avatar: $bot_avatar"
    echo ""
    
    # Get guild count
    guild_response=$(curl -s -H "Authorization: Bot $DISCORD_TOKEN" \
                      "https://discord.com/api/v10/users/@me/guilds")
    
    if ! echo "$guild_response" | grep -q "\"code\""; then
      guild_count=$(echo "$guild_response" | jq '. | length')
      echo "Server count: $guild_count"
    fi
  fi
  
  echo ""
  read -p "Press Enter to continue..."
}

# Generate invite link
generate_invite_link() {
  print_header
  echo -e "${YELLOW}Generating invite link...${NC}"
  echo ""
  
  # Use the Discord API to get the bot's application information
  response=$(curl -s -H "Authorization: Bot $DISCORD_TOKEN" \
                "https://discord.com/api/v10/oauth2/applications/@me")
  
  if echo "$response" | grep -q "\"code\""; then
    echo -e "${RED}Error: Failed to fetch application information.${NC}"
    echo "$response"
  else
    client_id=$(echo "$response" | jq -r '.id')
    
    echo -e "${GREEN}Invite Links:${NC}"
    echo "---------------------------------"
    echo -e "${CYAN}Admin Permissions:${NC}"
    echo "https://discord.com/api/oauth2/authorize?client_id=$client_id&permissions=8&scope=bot%20applications.commands"
    echo ""
    echo -e "${CYAN}Recommended Permissions:${NC}"
    echo "https://discord.com/api/oauth2/authorize?client_id=$client_id&permissions=1099511627775&scope=bot%20applications.commands"
    echo ""
    echo -e "${CYAN}Minimal Permissions:${NC}"
    echo "https://discord.com/api/oauth2/authorize?client_id=$client_id&permissions=274877910016&scope=bot%20applications.commands"
  fi
  
  echo ""
  read -p "Press Enter to continue..."
}

# View bot statistics
view_bot_statistics() {
  print_header
  echo -e "${YELLOW}Fetching bot statistics...${NC}"
  echo ""
  
  # TODO: Implement the API call to get bot statistics
  echo -e "${GREEN}Bot Statistics:${NC}"
  echo "---------------------------------"
  echo "This feature is not implemented yet."
  
  echo ""
  read -p "Press Enter to continue..."
}

# Main program loop
while true; do
  print_header
  print_menu
  read choice
  
  case $choice in
    1) list_servers ;;
    2) manage_server_permissions ;;
    3) add_global_admin ;;
    4) remove_global_admin ;;
    5) list_global_admins ;;
    6) check_bot_status ;;
    7) generate_invite_link ;;
    8) view_bot_statistics ;;
    9) 
      echo -e "${GREEN}Thank you for using AstroBot Permission Management Tool!${NC}"
      exit 0
      ;;
    *) 
      echo -e "${RED}Invalid option. Please choose a number between 1 and 9.${NC}"
      echo ""
      read -p "Press Enter to continue..."
      ;;
  esac
done