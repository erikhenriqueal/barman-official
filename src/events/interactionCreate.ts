import { EmbedBuilder } from 'discord.js';
import InputCommandBuilder from '../classes/InputCommand';
import MessageCommandBuilder from '../classes/MessageCommand';
import UserCommandBuilder from '../classes/UserCommand';
import Event from '../classes/Event';
import { sendReply, ChatInputCommandInteraction, MessageContextMenuCommandInteraction, InteractionReplyOptions, UserContextMenuCommandInteraction } from '../classes/Interaction';

export default new Event('interactionCreate', __dirname, async (responseInteraction) => {
  if (responseInteraction.isAutocomplete()) {
		const command = InputCommandBuilder.cache.get(responseInteraction.commandName);
		if (!command) return responseInteraction.respond([]);
		const response = await command.autocomplete(responseInteraction);
		return responseInteraction.respond(response);
	}
	else if (responseInteraction.isChatInputCommand()) {
		const interaction = responseInteraction as ChatInputCommandInteraction;
		interaction.sendReply = (options: InteractionReplyOptions) => sendReply(responseInteraction, options);

    const command = InputCommandBuilder.cache.get(interaction.commandName);
    if (!command) return interaction.sendReply({
			ephemeral: true,
			embeds: [
				new EmbedBuilder()
			.setColor(interaction.guild?.members.me.displayHexColor)
			.setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ forceStatic: false }) })
			.setTitle('🕶️ Comando desconhecido')
			.setDescription(`> *Este comando não consta em nosso sistema, ou ainda está em desenvolvimento.*`)
			.setFooter({ text: `${interaction.guild?.name || interaction.client.user.username} © ${new Date().getFullYear()}`, iconURL: interaction.guild?.iconURL({ forceStatic: false }) })
		]});

    return command.execute(interaction);
  }
	else if (responseInteraction.isMessageContextMenuCommand()) {
		const interaction = responseInteraction as MessageContextMenuCommandInteraction;
		interaction.sendReply = (options: InteractionReplyOptions) => sendReply(responseInteraction, options);
		
		const command = MessageCommandBuilder.cache.get(interaction.commandName);
		if (!command) return interaction.sendReply({
			ephemeral: true,
			embeds: [
				new EmbedBuilder()
			.setColor(interaction.guild?.members.me.displayHexColor)
			.setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ forceStatic: false }) })
			.setTitle('🕶️ Comando desconhecido')
			.setDescription(`> *Este comando não consta em nosso sistema, ou ainda está em desenvolvimento.*`)
			.setFooter({ text: `${interaction.guild?.name || interaction.client.user.username} © ${new Date().getFullYear()}`, iconURL: interaction.guild?.iconURL({ forceStatic: false }) })
		]});
		
		return command.execute(interaction);
	}
	else if (responseInteraction.isUserContextMenuCommand()) {
		const interaction = responseInteraction as UserContextMenuCommandInteraction;
		interaction.sendReply = (options: InteractionReplyOptions) => sendReply(responseInteraction, options);

		const command = UserCommandBuilder.cache.get(interaction.commandName);
		if (!command) return interaction.sendReply({
			ephemeral: true,
			embeds: [
				new EmbedBuilder()
			.setColor(interaction.guild?.members.me.displayHexColor)
			.setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ forceStatic: false }) })
			.setTitle('🕶️ Comando desconhecido')
			.setDescription(`> *Este comando não consta em nosso sistema, ou ainda está em desenvolvimento.*`)
			.setFooter({ text: `${interaction.guild?.name || interaction.client.user.username} © ${new Date().getFullYear()}`, iconURL: interaction.guild?.iconURL({ forceStatic: false }) })
		]});
		
		return command.execute(interaction);
	}
});
