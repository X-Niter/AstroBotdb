import { config } from '../config';

// Basic console logger with different colored outputs
export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`\x1b[36m[INFO]\x1b[0m ${message}`, ...args);
  },
  
  warn: (message: string, ...args: any[]) => {
    console.log(`\x1b[33m[WARN]\x1b[0m ${message}`, ...args);
  },
  
  error: (message: string, ...args: any[]) => {
    console.error(`\x1b[31m[ERROR]\x1b[0m ${message}`, ...args);
  },
  
  debug: (message: string, ...args: any[]) => {
    if (config.isDevelopment) {
      console.log(`\x1b[32m[DEBUG]\x1b[0m ${message}`, ...args);
    }
  },
  
  command: (userId: string, guildId: string, commandName: string) => {
    console.log(`\x1b[35m[COMMAND]\x1b[0m User ${userId} in Guild ${guildId} used command ${commandName}`);
  },
  
  event: (eventName: string, ...args: any[]) => {
    if (config.isDevelopment) {
      console.log(`\x1b[34m[EVENT]\x1b[0m ${eventName}`, ...args);
    }
  }
};