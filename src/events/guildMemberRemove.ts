import { EmbedBuilder } from 'discord.js';
import { database } from '../';
import Event from '../classes/Event';
export default new Event('guildMemberRemove', __dirname, async (member) => {
	const databaseGuild = await database.getGuild(member.guild.id);
	
  const joinChannel = databaseGuild.getSetting('default_join', 'channel');
	if (!joinChannel) return;

  const channel = member.guild.channels.cache.get(joinChannel.value);
  if (!channel || !channel.isTextBased()) return;

  const leftPhrases = [
    `${member.user.username} deixou nossa Rede. Espero que um dia ele(a) volte!`,
    `${member.user.username} abandonou nosso navio, infelizmente não sabia nadar e foi devorado por tubarões...`,
    `Batalhão, temos um soldado ferido! Deem adeus à ${member.user.username}...`
  ];

  const leftEmbed = new EmbedBuilder()
  .setColor(member.guild.members.me.displayHexColor)
  .setAuthor({ name: `${member.user.tag}`, iconURL: member.user.displayAvatarURL({ forceStatic: false }) })
  .setTitle(`💨 Um Membro Saiu de nossa Rede`)
  .setDescription(leftPhrases[Number.random(0, leftPhrases.length - 1)])
  .setFooter({ text: `${member.guild?.name || member.client.user.username} © ${new Date().getFullYear()}`, iconURL: member.guild?.iconURL({ forceStatic: false }) });

  return await channel.send({ embeds: [ leftEmbed ]});
});
