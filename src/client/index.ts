import dotenv from 'dotenv'
dotenv.config() // Setting up .env files

import '../global' // Importing global methods

import { DiscordUtils, debug, log } from '../utils' // Importing Caching Methods
import { stringifyObject } from '../utils/debug'

import Discord from 'discord.js' // Importing Discord.Js lib
debug('Initializing Client')
export const client = new Discord.Client({ // Creating the client
	intents: [
		'Guilds',
		'GuildMembers',
		'GuildBans',
		'GuildEmojisAndStickers',
		'GuildIntegrations',
		'GuildWebhooks',
		'GuildInvites',
		'GuildVoiceStates',
		'GuildPresences',
		'GuildMessages',
		'GuildMessageReactions',
		'GuildMessageTyping',
		'DirectMessages',
		'DirectMessageReactions',
		'DirectMessageTyping',
		'MessageContent',
		'GuildScheduledEvents',
		'AutoModerationConfiguration',
		'AutoModerationExecution'
		// This is all the possible Intents in Discord.Js v14.7.0
		// Just remove that ones you don't want
	]
})

import DatabaseGuild from '../classes/DatabaseGuild'
import DatabaseUser from '../classes/DatabaseUser'
import Database from '../classes/Database'
debug('Initializing Database')
export const database = new Database({
	database: process.env.MYSQL_DATABASE,
	user: process.env.MYSQL_USERNAME,
	password: process.env.MYSQL_PASSWORD,
	host: process.env.MYSQL_HOSTNAME,
	namedPlaceholders: true
})

debug('Initializing Events')
import './events'
debug('Initializing Commands')
import './commands'
debug('Initializing Dev Commands')
import './dev_commands'
debug('Initializing Music System')
import './music'

debug('Logging in client')
client.login(process.env.OLD_TOKEN).then(async () => { // Logging in Client
	debug('Verifying system integrity')
	await verifyIntegrity().catch(error => {
		console.error('Got an unexpected error on verifying Database\'s Integrity:')
		throw error
	})
})

async function verifyIntegrity(): Promise<void> {
	await deleteDatabaseInvalidUsers()
	await deleteDatabaseInvalidGuilds()

	const guilds = await DiscordUtils.Cache.cacheGuilds(client)

	for (const guild of guilds.toJSON()) {
		const databaseGuild = await database.addGuild(guild.id)
		const members = await DiscordUtils.Cache.cacheGuildMembers(guild)
		for (const member of members.toJSON()) {
			await database.addUser(member.user.id)
			const default_member = databaseGuild.getSetting('default_member', 'role')
			const default_bot = databaseGuild.getSetting('default_bot', 'role')
			const userRole = member.user.bot ? default_bot : default_member
			if (userRole) {
				const role = await guild.roles.fetch(userRole?.value)
				if (!role) {
					log({ type: 'error', message: `[ Discord.Js ] Can't find role '${userRole?.value}' in guild '${guild.id}'.` }, true)
					continue
				}
				if (!member.roles.cache.has(role.id)) await member.roles.add(role.id)
			}
		}
	}

	async function deleteDatabaseInvalidUsers(): Promise<void> {
		const invalidUsers = await database.getUsers(u => !DatabaseUser.validate(u))
		if (invalidUsers.length > 0) {
			const deleted = await database.deleteUsers(...invalidUsers)
			log(`[ Client - ${client.user.username} ] Deleted invalid users from database: ${JSON.stringify(deleted, null, 2)}`)
		}
	}
	async function deleteDatabaseInvalidGuilds(): Promise<void> {
		const databaseGuilds = await database.getGuilds()
		const invalidGuilds = databaseGuilds.filter(g => !DatabaseGuild.validate(g))
		if (invalidGuilds.length > 0) {
			const deleted = await database.deleteGuilds(...invalidGuilds)
			log(`[ Client - ${client.user.username} ] Deleted invalid guilds from database: ${JSON.stringify(deleted, null, 2)}`)
		}
	}
}
