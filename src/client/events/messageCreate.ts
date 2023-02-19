import { EmbedBuilder } from 'discord.js';
import { log } from '../../utils';
import { database } from '..';

import Event from '../../classes/Event';
export default new Event('messageCreate', __dirname, async (message) => {
	if (!message.inGuild()) return;
	const databaseGuild = await database.getGuild(message.guildId);
	const guildLogsChannel = databaseGuild.getSetting('logs', 'channel');
	if (guildLogsChannel) {
		const channel = await message.guild.channels.fetch(guildLogsChannel.id);
		if (channel && channel.isTextBased()) await channel.send({
			embeds: [ new EmbedBuilder()
				.setColor(message.guild?.members.me.displayHexColor)
				.setAuthor({ name: message.author.tag, iconURL: message.author.avatarURL() })
				.setTitle('✏️ Mensagem Recebida')
				.setFooter({ text: `${message.guild.name || message.client.user.username} © ${new Date().getFullYear()}`, iconURL: message.guild.iconURL() })
			]
		});
	}
	if (new RegExp(message.client.user.toString()).test(message.content)) return message.reply({
		embeds: [ new EmbedBuilder()
			.setColor(message.guild?.members.me.displayHexColor)
			.setAuthor({ name: message.author.tag, iconURL: message.author.avatarURL() })
			.setTitle('🚩 Ajuda Rápida')
			.setDescription(`Olá ${message.author.toString()}, seja bem-vindo à **${message.guild.name}**!\n• Abaixo você encontra alguns campos que acho interessante você ficar ligado:`)
			.addFields(
				{
					name: '❗ Fique atento!',
					value: [
						`• Leia nossas <#${databaseGuild?.getSetting('rules', 'channel')}> para ajudar a comunidade à se manter ativa!`,
						`• Fique atento aos <#${databaseGuild?.getSetting('warnings', 'channel')}> para não perder nada.`,
						`• Se liga nas <#${databaseGuild?.getSetting('news', 'channel')}> e aproveite todas as vantages!`
					].join('\n')
				}, {
					name: '☕ Tá de boa?',
					value: [
						`• Então troca uma ideia com a galera no <#${databaseGuild?.getSetting('main_text', 'channel')}>, faça novos amigos!`,
						`• Entra aí: <#${databaseGuild?.getSetting('main_voice', 'channel')}>, bora trocar uma ideia!`
					].join('\n')
				}, {
					name: '😪 Que tédio...',
					value: [
						`• Coloca uma música pra **/tocar** e sente aquela vibe!`
					].join('\n')
				}
			)
			.setFooter({ text: `${message.guild.name || message.client.user.username} © ${new Date().getFullYear()}`, iconURL: message.guild.iconURL() })
		]
	}).catch(error => {
		console.error(`[ Event - messageCreate ] Can't reply to a mention: ${error}`);
		message.react('❌').catch(error => console.error(`[ Event - messageCreate ] Can't react to the message: ${error}`));
	});
});
