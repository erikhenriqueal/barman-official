import Discord, { EmbedBuilder } from 'discord.js';
import { DiscordUtils } from '../../utils';

import InputCommandBuilder from '../../classes/InputCommand';

export default new InputCommandBuilder()
.setName('delete')
.setNameLocalization('pt-BR', 'deletar')
.setDescription('Delete some unwanted messages from the channel.')
.setDescriptionLocalization('pt-BR', 'Apague algumas mensagens indesejadas do canal.')
.setDMPermission(false)
.setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageMessages)
.addIntegerOption(
	new Discord.SlashCommandIntegerOption()
	.setName('amount')
	.setNameLocalization('pt-BR', 'quantia')
	.setDescription('A amount of messages to delete.')
	.setDescriptionLocalization('pt-BR', 'A quantia de mensagens à deletar.')
	.setMinValue(1)
	.setMaxValue(100)
	.setRequired(true)
).addBooleanOption(
	new Discord.SlashCommandBooleanOption()
	.setName('force')
	.setNameLocalization('pt-BR', 'forçar')
	.setDescription('Forces deletation of messages that was sent before 14 days ago.')
	.setDescriptionLocalization('pt-BR', 'Deleta forçadamente mensagens enviadas à mais de 14 dias.')
	.setRequired(false)
).setExecute(async (interaction) => {
	if (!interaction.channel.permissionsFor(interaction.guild.members.me, true).has('ManageMessages', true)) return interaction.sendReply({
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

  return await DiscordUtils.deleteMessages(interaction.channel, interaction.options.getInteger('amount', true), {
		force: interaction.options.getBoolean('force', false) || false,
		filter: (message) => message.id != reply.id
	}).then((deleted) => interaction.sendReply({
		content: interaction.user.toString(),
		embeds: [ new EmbedBuilder()
			.setColor(interaction.guild?.members.me.displayHexColor)
			.setAuthor({ name: interaction.user.tag, iconURL: interaction.user.avatarURL() })
			.setTitle(`🗑️ ${deleted.size} menssage${deleted.size === 1 ? 'm' : 'ns'} deletada${deleted.size === 1 ? '' : 's'}.`)
			.setDescription(`Prontinho ${interaction.user.toString()}, tudo certo! Já apaguei todas as últimas ${deleted.size} mensagens deste canal.${interaction.options.getInteger('amount', true) > deleted.size ? `\n> Obs.: Algumas mensagens não foram apagadas pois foram enviadas à mais de 14 dias, ou porquê eu simplesmente não posso deleta-las. Se quiser mudar isso, utilize o argumento \`forçar: True\` na hora da execução do comando.` : ''}`)
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
