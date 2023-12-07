import { EmbedBuilder } from 'discord.js'
import play from 'play-dl'
import { joinVoiceChannel, createAudioResource, createAudioPlayer, NoSubscriberBehavior } from '@discordjs/voice'
import { DiscordUtils } from '../../utils'
import { DevCommand } from './'
import { translateMessage } from '../utils'

export default {
	name: 'play',
	developerOnly: true,
	async execute({ message, args }): Promise<any> {
		const translateOptions = { userId: message.author.id, guildLocale: message.guild.preferredLocale }
		const voiceChannel = message.member.voice?.channel
		if (!voiceChannel) return message.sendReply(await translateMessage({
			deleteBefore: 10e3,
			embeds: [ new EmbedBuilder()
				.setColor(message.guild.members.me.displayHexColor)
				.setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
				.setTitle('🔍 Voice Channel not found')
				.setDescription(`> • ${message.author.toString()}, you must be connected into a voice channel to use this command.`)
				.setFooter({ text: `${message.guild?.name || message.client.user.username} © ${new Date().getFullYear()}`, iconURL: message.guild?.iconURL() })
			],
			replyLocalizations: {
				'pt-BR': {
					deleteBefore: 10e3,
					embeds: [ new EmbedBuilder()
						.setColor(message.guild.members.me.displayHexColor)
						.setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
						.setTitle('🔍 Canal de Voz não encontrado')
						.setDescription(`> • ${message.author.toString()}, você deve estar conectado à um canal de voz para utilizar este comando.`)
						.setFooter({ text: `${message.guild?.name || message.client.user.username} © ${new Date().getFullYear()}`, iconURL: message.guild?.iconURL() })
					]
				}
			}
		}, translateOptions))

		const connection = joinVoiceChannel({
			channelId: voiceChannel.id,
			guildId: voiceChannel.guildId,
			adapterCreator: voiceChannel.guild.voiceAdapterCreator
		})

		const argsValidation = play.yt_validate(args.join(' '))
		if (argsValidation === false) return message.sendReply(await translateMessage({
			embeds: [ new EmbedBuilder()
				.setColor(message.guild.members.me.displayHexColor)
				.setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
				.setTitle('')
				.setDescription(``)
				.setFooter({ text: `${message.guild?.name || message.client.user.username} © ${new Date().getFullYear()}`, iconURL: message.guild?.iconURL() })
			],
			replyLocalizations: {
				'pt-BR': {
					embeds: [ new EmbedBuilder()
						.setColor(message.guild.members.me.displayHexColor)
						.setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
						.setTitle('')
						.setDescription(``)
						.setFooter({ text: `${message.guild?.name || message.client.user.username} © ${new Date().getFullYear()}`, iconURL: message.guild?.iconURL() })
					]
				}
			}
		}, translateOptions))

		const stream = await play.stream(args.join(' '))
		const resource = createAudioResource(stream.stream, { inputType: stream.type })
		const player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Play } })

		player.play(resource)
		connection.subscribe(player)
	}
} as DevCommand
