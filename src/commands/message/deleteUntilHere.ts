import Discord, { EmbedBuilder } from 'discord.js';
import { DiscordUtils } from '../../utils';

import MessageCommand from '../../classes/MessageCommand';
export default new MessageCommand()
.setName('Delete until here')
.setNameLocalization('pt-BR', 'Deletar até aqui')
.setDMPermission(false)
.setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageMessages)
.setExecute(async (interaction) => {
	if (!interaction.channel.permissionsFor(interaction.guild.members.me).has('ManageMessages')) return interaction.sendReply({
		ephemeral: true,
		embeds: [ DiscordUtils.DefaultEmbedsBuilders.unauthorized(interaction) ]
	});

	await interaction.sendReply({
    content: interaction.user.toString(),
    embeds: [ new EmbedBuilder()
      .setColor(interaction.guild?.members.me.displayHexColor)
      .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.avatarURL() })
      .setTitle('🗑️ Apagando mensagens')
      .setDescription(`> Aguarde enquanto tento apagar as mensagens...`)
      .setFooter({ text: `${interaction.guild?.name || interaction.client.user.username} © ${new Date().getFullYear()}`, iconURL: interaction.guild?.iconURL() })
    ]
  }) as Discord.InteractionResponse<boolean>;

	const reply = await interaction.fetchReply();

	const channelMessages = await DiscordUtils.Cache.cacheChannelMessages(interaction.channel);
	const messages = channelMessages.filter((m) => m.id !== reply.id && m.createdTimestamp >= interaction.targetMessage.createdTimestamp);

	return await DiscordUtils.deleteMessages(interaction.channel, messages, { force: true }).then((deleted) => interaction.sendReply({
		content: interaction.user.toString(),
		embeds: [ new EmbedBuilder()
			.setColor(interaction.guild?.members.me.displayHexColor)
			.setAuthor({ name: interaction.user.tag, iconURL: interaction.user.avatarURL() })
			.setTitle(`🗑️ ${deleted.size} menssage${deleted.size === 1 ? 'm' : 'ns'} deletada${deleted.size === 1 ? '' : 's'}.`)
			.setDescription(`Prontinho ${interaction.user.toString()}, tudo certo! Já apaguei todas as últimas ${deleted.size} mensagens deste canal.${messages.size > deleted.size ? '\n> Obs.: Não pude excluir algumas das mensagens selecionadas, por isso elas permaneceram no canal.' : ''}`)
			.setFooter({ text: `${interaction.guild?.name || interaction.client.user.username} © ${new Date().getFullYear()}`, iconURL: interaction.guild?.iconURL() })
		]
	})).catch((error) => {
		console.error(`[ Command - delete ] Couldn't delete messages: ${error}`);
		return interaction.sendReply({
			ephemeral: true,
			content: interaction.user.toString(),
			embeds: [ new EmbedBuilder()
				.setColor(interaction.guild?.members.me.displayHexColor)
				.setAuthor({ name: interaction.user.tag, iconURL: interaction.user.avatarURL() })
				.setTitle(`🗑️ Mensagens não deletadas`)
				.setDescription(`Desculpe ${interaction.user.toString()}, mas não há mensagens que possam ser deletadas neste canal.`)
				.setFooter({ text: `${interaction.guild?.name || interaction.client.user.username} © ${new Date().getFullYear()}`, iconURL: interaction.guild?.iconURL() })
			]
		});
	});
});
