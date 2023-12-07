import Discord from 'discord.js'
import { InteractionReplyOptions, MessageInteractionReplyOptions } from '../../classes/Interaction'
import { database } from '../'

export interface TranslateOptions {
	userId: string
	guildLocale: Discord.LocaleString
	interactionLocale?: Discord.LocaleString
}
export type ReplyMessage<T extends InteractionReplyOptions | MessageInteractionReplyOptions> = T & { replyLocalizations?: Partial<Record<Discord.LocaleString, T | null>> }
export async function translateMessage<T extends InteractionReplyOptions | MessageInteractionReplyOptions>(message: ReplyMessage<T>, options: TranslateOptions): Promise<T> {
	let lang: Discord.LocaleString = null
	const databaseUser = await database.getUser(options.userId)
	if (!databaseUser?.preferencies?.lang) lang = options.interactionLocale || options.guildLocale
	else lang = databaseUser?.preferencies?.lang as any

	const reply = message.replyLocalizations && message.replyLocalizations[lang] ? message.replyLocalizations[lang] : message
	return reply
}
