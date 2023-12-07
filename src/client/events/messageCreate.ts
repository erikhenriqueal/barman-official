import { EmbedBuilder } from 'discord.js'
import { log, DiscordUtils, debug } from '../../utils'
import { database } from '../'
import { translateMessage } from '../utils'
import { commands } from '../dev_commands'

import Event from '../../classes/Event'
export default new Event('messageCreate', __dirname, async message => {
	const interaction = DiscordUtils.createMessageInteraction(message)
	const translatorOptions = { userId: message.author.id, guildLocale: message.guild.preferredLocale }
	
	const databaseGuild = await database.getGuild(interaction.guildId)
	debug('MessageCreate Event Emitted')
	
	const guildLogsChannel = databaseGuild.getSetting('logs', 'channel')
	if (guildLogsChannel) {
		const channel = await interaction.guild.channels.fetch(guildLogsChannel.id)
		if (channel && channel.isTextBased()) await channel.send({
			embeds: [ new EmbedBuilder()
				.setColor(interaction.guild?.members.me.displayHexColor)
				.setAuthor({ name: interaction.author.tag, iconURL: interaction.author.displayAvatarURL() })
				.setTitle('✏️ Mensagem Recebida')
				.setDescription(`> *Este sistema está atualmente em desenvolvimento...*`)
				.setFooter({ text: `${interaction.guild.name || interaction.client.user.username} © ${new Date().getFullYear()}`, iconURL: interaction.guild.iconURL() })
			]
		})
	}

	if (new RegExp(interaction.client.user.toString()).test(interaction.content)) {
		return interaction.sendReply(await translateMessage({
			embeds: [ new EmbedBuilder()
				.setColor(interaction.guild?.members.me.displayHexColor)
				.setAuthor({ name: interaction.author.tag, iconURL: interaction.author.displayAvatarURL() })
				.setTitle('🚩 Quick Help')
				.setDescription(`Hey ${interaction.author.toString()}, welcome to **${interaction.guild.name}**!\n• I'd listed some fields that I think you could be interested here:`)
				.addFields(
					{
						name: '❗ Stay alert!',
						value: [
							`• Read our <#${databaseGuild?.getSetting('rules', 'channel')}> to keep the community alive!`,
							`• Stay tuned for our <#${databaseGuild?.getSetting('warnings', 'channel')}> to known all about our notices.`,
							`• Check out the <#${databaseGuild?.getSetting('news', 'channel')}> and take all advantages!`
						].join('\n')
					}, {
						name: '☕ What\'s up?',
						value: [
							`• So let's talk to the guys in <#${databaseGuild?.getSetting('main_text', 'channel')}>, make new friends!`,
							`• Join here <#${databaseGuild?.getSetting('main_voice', 'channel')}>, let's play some game!`
						].join('\n')
					}, {
						name: '😪 So bored...',
						value: [
							`• **/play** a music to feel that vibe!`
						].join('\n')
					}
				).setFooter({ text: `${interaction.guild.name || interaction.client.user.username} © ${new Date().getFullYear()}`, iconURL: interaction.guild.iconURL() })
			],
			replyLocalizations: {
				'pt-BR': {
					embeds: [ new EmbedBuilder()
						.setColor(interaction.guild?.members.me.displayHexColor)
						.setAuthor({ name: interaction.author.tag, iconURL: interaction.author.displayAvatarURL() })
						.setTitle('🚩 Ajuda Rápida')
						.setDescription(`Olá ${interaction.author.toString()}, seja bem-vindo à **${interaction.guild.name}**!\n• Abaixo você encontra alguns campos que acho interessante você ficar ligado:`)
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
						).setFooter({ text: `${interaction.guild.name || interaction.client.user.username} © ${new Date().getFullYear()}`, iconURL: interaction.guild.iconURL() })
					]
				}
			}
		}, translatorOptions)).catch(error => {
			log({ type: 'error', message: `[ Event - messageCreate ] Can't reply to a mention: ${error}` })
			interaction.react('❌').catch(error => log({ type: 'error', message: `[ Event - messageCreate ] Can't react to the message: ${error}` }))
		})
	}

	if (!interaction.inGuild()) return
	if (!DiscordUtils.isDeveloperInteraction(message)) return log(`[ Event - messageCreate ] Someone tried to execute a Developer Command: '${message.author.tag}' (${message.author.id}) at ${message.createdTimestamp}`, true)

	const prefix = process.env.PREFIX?.trim()
	if (!prefix || prefix.length === 0) return log('[ Event - messageCreate ] \'PREFIX\' \'.env\' key is invalid.')

	if (!message.content.startsWith(prefix)) return

	const args = message.content.split(' ')
	const commandName = args.shift().slice(prefix.length)
	const command = commands.get(commandName)
	if (!command) return
	if (command.developerOnly === true && !DiscordUtils.isDeveloperInteraction(message, true)) {
		const reply = await interaction.sendReply(await translateMessage({
			embeds: [ new EmbedBuilder()
				.setColor(interaction.guild?.members.me.displayHexColor)
				.setAuthor({ name: interaction.author.tag, iconURL: interaction.author.displayAvatarURL() })
				.setTitle('💻 Comando em Desenvolvimento')
				.setDescription(`> *Este comando está em fase de testes e restrito apenas ao meu Desenvolvedor${process.env.DEVELOPER_ID ? ` <@${process.env.DEVELOPER_ID}>` : ''}.*`)
				.setFooter({ text: `${interaction.guild.name || interaction.client.user.username} © ${new Date().getFullYear()}`, iconURL: interaction.guild.iconURL() })
			]
		}, translatorOptions))
		return setTimeout(() => reply.delete().catch(r => debug(`[ Event - messageCreate ] Coudn't delete a message: ${r}`)), 10e3)
	}
	return command.execute({ message: interaction, args, command, commandName })
})
