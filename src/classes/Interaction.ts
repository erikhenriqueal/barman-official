import Discord from 'discord.js'
import log from '../utils/log'

export type InteractionReplyOptions = string | (Discord.InteractionReplyOptions | Discord.MessagePayload) & { deleteBefore?: number }
export type MessageInteractionReplyOptions = string | (Discord.MessageReplyOptions | Discord.MessagePayload) & { deleteBefore?: number }
export async function sendReply(interaction: Discord.Interaction<Discord.CacheType> | Discord.Message<boolean>, options: InteractionReplyOptions | MessageInteractionReplyOptions): Promise<Discord.Message | Discord.InteractionResponse> {
	try {
		const repliable = interaction instanceof Discord.Message ? true : interaction.isRepliable()
		const replied = interaction instanceof Discord.Message ? false : interaction.isRepliable() && (interaction.replied || interaction.deferred)
		if (!repliable) throw new Error(`Interaction '${interaction.id}' (in '${interaction.guild?.name || ''}#${(interaction as Discord.RepliableInteraction<Discord.CacheType>).channel.name}' at ${interaction.createdAt.toString()}) is not repliable`)
    
		const reply: Discord.Message<boolean> = await (replied ? (interaction as Discord.RepliableInteraction<Discord.CacheType>).editReply(options) : (interaction as any).reply(options))
		if (typeof options != 'string' && !isNaN(options.deleteBefore)) setTimeout(() => reply.deletable ? reply.delete().catch(() => {}) : {}, (reply.createdTimestamp + options.deleteBefore) - Date.now())
		return reply
  } catch(error) {
    log({ message: `[ Interaction - sendReply ] Can't reply to the interaction: ${error}`, type: 'error' }, true)
  }
}

export class ChatInputCommandInteraction extends Discord.ChatInputCommandInteraction<Discord.CacheType> {
  public sendReply(options: InteractionReplyOptions): Promise<Discord.Message | Discord.InteractionResponse> {
    return sendReply(this, options)
  }
}

export class AutocompleteInteraction extends Discord.AutocompleteInteraction<Discord.CacheType> {
  public sendReply(options: InteractionReplyOptions): Promise<Discord.Message | Discord.InteractionResponse> {
    return sendReply(this, options)
  }
}

export class MessageContextMenuCommandInteraction extends Discord.MessageContextMenuCommandInteraction<Discord.CacheType> {
  public sendReply(options: InteractionReplyOptions): Promise<Discord.Message | Discord.InteractionResponse> {
    return sendReply(this, options)
  }
}

export class UserContextMenuCommandInteraction extends Discord.UserContextMenuCommandInteraction<Discord.CacheType> {
  public sendReply(options: InteractionReplyOptions): Promise<Discord.Message | Discord.InteractionResponse> {
    return sendReply(this, options)
  }
}
