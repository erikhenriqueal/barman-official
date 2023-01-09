import dotenv from 'dotenv';
dotenv.config(); // Setting up .env files

import './global'; // Importing global methods

import { DiscordUtils } from './utils'; // Importing Caching Methods

import Discord from 'discord.js'; // Importing Discord.Js lib
export const client = new Discord.Client({ // Creating the client
	intents: [
		'AutoModerationConfiguration',
		'AutoModerationExecution',
		'DirectMessageReactions',
		'DirectMessageTyping',
		'DirectMessages',
		'GuildBans',
		'GuildEmojisAndStickers',
		'GuildIntegrations',
		'GuildInvites',
		'GuildMembers',
		'GuildMessageReactions',
		'GuildMessageTyping',
		'GuildMessages',
		'GuildPresences',
		'GuildScheduledEvents',
		'GuildVoiceStates',
		'GuildWebhooks',
		'Guilds',
		'MessageContent'
		// This is all the possible Intents in Discord.Js v14.7.0
		// Just remove that ones you don't want
	]
});

import DatabaseGuild from './classes/DatabaseGuild';
import DatabaseUser from './classes/DatabaseUser';
import Database from './classes/Database';
export const database = new Database({
	database: process.env.MYSQL_DATABASE,
	user: process.env.MYSQL_USERNAME,
	password: process.env.MYSQL_PASSWORD,
	host: process.env.MYSQL_HOSTNAME
});

import './events';
import './commands';

client.login(process.env.TOKEN).then(async () => { // Logging in Client
	await verifyIntegrity().catch(console.error);
});

async function verifyIntegrity(): Promise<void> {
	const databaseUsers = await database.getUsers();
	for (const user of databaseUsers) {
		if (!DatabaseUser.validate(user)) await database.deleteUser(user);
	}

	const guilds = await DiscordUtils.Cache.cacheGuilds(client);
	const databaseGuilds = await database.getGuilds();

	for (const guild of databaseGuilds) {
		if (!DatabaseGuild.validate(guild)) await database.deleteGuild(guild);
	}

	for (const guild of guilds.values()) {
		if (!(await database.hasGuild(guild.id))) await database.addGuild(guild.id);
		const databaseGuild = await database.getGuild(guild.id);
		const members = await DiscordUtils.Cache.cacheGuildMembers(guild);
		for (const member of members.values()) {
			if (!(await database.hasUser(member.user.id))) await database.addUser(member.user.id).catch(console.error);
			const default_member = databaseGuild.getSetting('default_member', 'role');
			const default_bot = databaseGuild.getSetting('default_bot', 'role');
			if (default_member || default_bot) {
				const userRole = member.user.bot ? default_bot : default_member;
				const role = await guild.roles.fetch(userRole?.value);
				if (!role) return console.error(`[ Discord.Js ] Can't find role '${userRole?.value}' in guild '${guild.id}'.`);
				if (member.roles.cache.has(role.id)) await member.roles.add(role.id);
			}
		}
	}
}
