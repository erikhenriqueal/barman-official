import Discord from 'discord.js'
import log from './log'
import { sendReply, MessageInteractionReplyOptions } from '../classes/Interaction'

export namespace Patterns {
	export const SnowflakeId: RegExp = new RegExp('^\\d{17,19}$')
	export const UserTag: RegExp = new RegExp('^.{1,32}#\\d{4}$')
}

export namespace Cache {
	export async function cacheGuilds(client: Discord.Client): Promise<Discord.Collection<string, Discord.Guild>> {
		const cached = client.guilds.cache
		const fetched = await client.guilds.fetch()
		if (cached.size < fetched.size) return await cacheGuilds(client)
		else return cached
	}
	
	export async function cacheGuildMembers(guild: Discord.Guild): Promise<Discord.Collection<string, Discord.GuildMember>> {
		const cached = guild.members.cache
		const fetched = await guild.members.fetch()
		if (cached.size < fetched.size) return await cacheGuildMembers(guild)
		else return cached
	}
	
	export async function cacheGuildRoles(guild: Discord.Guild): Promise<Discord.Collection<string, Discord.Role>> {
		const cached = guild.roles.cache
		const fetched = await guild.roles.fetch()
		if (cached.size < fetched.size) return await cacheGuildRoles(guild)
		else return cached
	}

	export async function cacheChannelMessages(channel: Discord.TextBasedChannel): Promise<Discord.Collection<Discord.Snowflake, Discord.Message<boolean>>> {
		const cached = channel.messages.cache
		const fetched = await channel.messages.fetch()
		if (cached.size < fetched.size) return (await cacheChannelMessages(channel)).sort((a, b) => b.createdTimestamp - a.createdTimestamp)
		else return cached.sort((a, b) => b.createdTimestamp - a.createdTimestamp)
	}

	export async function cacheClientCommands(client: Discord.Client<true>): Promise<Discord.Collection<string, Discord.ApplicationCommand>> {
		const cached = client.application.commands.cache
		const fetched = await client.application.commands.fetch()
		if (cached.size < fetched.size) return (await cacheClientCommands(client))
		else return cached
	}
}

export namespace DefaultEmbedsBuilders {
	/**
	 * ```
	 * Title -> '🚫 Operation Blocked'  
	 * Description -> '> *Sorry ${user}, but I don't have sufficient permissions to do this action.*'
	 * ```
	 */
	export function unauthorized(interaction: Discord.RepliableInteraction, lang?: Discord.LocaleString): Discord.EmbedBuilder {
		const embed = new Discord.EmbedBuilder()
			.setColor(interaction.guild?.members.me.displayHexColor)
			.setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
			.setFooter({ text: `${interaction.guild?.name || interaction.client.user.username} © ${new Date().getFullYear()}`, iconURL: interaction.guild?.iconURL() })
		if ((lang || interaction.locale) === 'pt-BR') embed
			.setTitle(`🚫 Operação Bloqueada`)
			.setDescription(`> *Desculpe ${interaction.user.toString()}, mas não possuo permissões o suficiente para executar esta ação.*`)
		else embed
			.setTitle('🚫 Operation Blocked')
			.setDescription(`> *Sorry ${interaction.user.toString()}, but I don't have sufficient permissions to do this action.*`)
		return embed
	}
	/**
	 * ```
	 * Title -> '❌ Invalid Command'  
	 * Description -> '> *This command is still being developed.*'
	 * ```
	 */
	export function invalidCommand(interaction: Discord.RepliableInteraction, lang?: Discord.LocaleString): Discord.EmbedBuilder {
		const embed = new Discord.EmbedBuilder()
			.setColor(interaction.guild?.members.me.displayHexColor)
			.setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
			.setFooter({ text: `${interaction.guild?.name || interaction.client.user.username} © ${new Date().getFullYear()}`, iconURL: interaction.guild?.iconURL() })
		if ((lang || interaction.locale) === 'pt-BR') embed
			.setTitle('❌ Comando Inválido')
			.setDescription(`> *Este comando está atualmente em desenvolvimento.*`)
		else embed
			.setTitle('❌ Invalid Command')
			.setDescription(`> *This command is still being developed.*`)
		return embed
	}
}

export function isDeveloperInteraction(interaction: Discord.Interaction<Discord.CacheType> | Discord.Message<boolean>, developerOnly?: boolean): boolean {
	const hasDeveloperRole = interaction.member.roles instanceof Discord.GuildMemberRoleManager
		? interaction.member.roles.cache.some(r => matchName(r.name))
		: interaction.member.roles.some(id => matchName(interaction.guild.roles.cache.get(id)?.name))
	
	const userId = interaction instanceof Discord.Message ? interaction.author.id : interaction.user.id
	const isServerOwner = interaction.guild.ownerId == userId
	const isDeveloperAccount = process.env.DEVELOPER_ID == userId
	
	if ((developerOnly !== true && interaction.guildId == process.env.MAIN_GUILD_ID && (hasDeveloperRole || isServerOwner)) || isDeveloperAccount) return true
	return false
	
	function matchName(name: string): boolean {
		if (typeof name != 'string') return false
		const developerRoleMatchs = ['developer', 'desenvolvedor', 'dev', 'programador']
		return name.toLowerCase().split(' ').some(a => developerRoleMatchs.includes(a))
	}
}

export interface DeleteMessagesOptions {
	force?: boolean
	filter?: (message: Discord.Message) => boolean
}
export function deleteMessages(channel: Discord.GuildTextBasedChannel, messages: number | Discord.Collection<string, Discord.Message<boolean>>, options?: DeleteMessagesOptions): Promise<Discord.Collection<Discord.Snowflake, Discord.Message | Discord.PartialMessage | undefined>> {
	return new Promise(async (res, rej) => {
		const targetMessages = typeof messages === 'number'
			? (await Cache.cacheChannelMessages(channel)).filter(options?.filter || (() => true)).first(messages)
			: messages.toJSON().filter(options?.filter || (() => true))

		try {
			const deleted = await channel.bulkDelete(targetMessages, true)
			if (deleted.size < targetMessages.length && options.force === true) {
				const nonDeleted = targetMessages.filter(m => !deleted.some(d => d.id === m.id))
				for (const message of nonDeleted) {
					if (message.deletable) {
						await message.delete()
						deleted.set(message.id, message)
					}
				}
			}
			return res(deleted)
		} catch (error) {
			log({ message: `[ discord.ts - deleteMessages ] Can't delete messages: ${error}`, type: 'error' }, true)
			rej(error)
		}
	})
}

export type MessageInteraction<InGuild extends boolean = boolean> = Discord.Message<InGuild> & { sendReply(options: MessageInteractionReplyOptions): Promise<Discord.Message<boolean>> }
export function createMessageInteraction<InGuild extends boolean = boolean>(message: Discord.Message<InGuild>): MessageInteraction<InGuild> {
	const interaction: MessageInteraction<InGuild> = Object.assign(message, {
		sendReply(options: MessageInteractionReplyOptions): Promise<Discord.Message<boolean>> {
			return sendReply(message, options) as any
		}
	})
	return interaction
}
