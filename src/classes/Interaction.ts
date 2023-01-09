import Discord from 'discord.js';
import log from '../utils/log';

export type InteractionReplyOptions = string | Discord.InteractionReplyOptions | Discord.MessagePayload;
export function sendReply(interaction: Discord.Interaction<Discord.CacheType>, options: InteractionReplyOptions): Promise<Discord.Message | Discord.InteractionResponse> {
	try {
		if (!interaction.isRepliable()) throw new Error(`Interaction '${interaction.id}' (in '${interaction.guild?.name || ''}#${interaction.channel.name}' at ${interaction.createdAt.toString()}) is not repliable`);
    if (interaction.replied || interaction.deferred) return interaction.editReply(options);
    else return interaction.reply(options);
  } catch(error) {
    log(`[ Interaction - sendReply ] Can't reply to the interaction: ${error}`, true);
  }
}

export class ChatInputCommandInteraction extends Discord.ChatInputCommandInteraction<Discord.CacheType> {
  public sendReply(options: InteractionReplyOptions): Promise<Discord.Message | Discord.InteractionResponse> {
    return sendReply(this, options);
  }
}

export class AutocompleteInteraction extends Discord.AutocompleteInteraction<Discord.CacheType> {
  public sendReply(options: InteractionReplyOptions): Promise<Discord.Message | Discord.InteractionResponse> {
    return sendReply(this, options);
  }
}

export class MessageContextMenuCommandInteraction extends Discord.MessageContextMenuCommandInteraction<Discord.CacheType> {
  public sendReply(options: InteractionReplyOptions): Promise<Discord.Message | Discord.InteractionResponse> {
    return sendReply(this, options);
  }
}

export class UserContextMenuCommandInteraction extends Discord.UserContextMenuCommandInteraction<Discord.CacheType> {
  public sendReply(options: InteractionReplyOptions): Promise<Discord.Message | Discord.InteractionResponse> {
    return sendReply(this, options);
  }
}
