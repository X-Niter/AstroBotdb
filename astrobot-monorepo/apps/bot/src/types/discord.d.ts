import { Collection, Client, SlashCommandBuilder } from 'discord.js';

declare module 'discord.js' {
  export interface Client {
    commands: Collection<string, Command>;
    cooldowns: Collection<string, Collection<string, number>>;
  }
}

export interface Command {
  data: SlashCommandBuilder | any;
  cooldown?: number;
  execute: (interaction: any) => Promise<void>;
}

export interface Event {
  name: string;
  once?: boolean;
  execute: (...args: any[]) => Promise<void>;
}