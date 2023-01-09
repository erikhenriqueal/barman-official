import { EmbedBuilder } from 'discord.js';
import { database } from '../index';
import Event from '../classes/Event';
export default new Event('guildMemberAdd', __dirname, async (member) => {
	if (!(await database.hasUser(member.user.id))) await database.addUser(member.user.id);
	// const databaseUser = await database.getUser(member.user.id);
	const databaseGuild = await database.getGuild(member.guild.id);

  const memberRole = databaseGuild.getSetting('default_member', 'role');
  const botRole = databaseGuild.getSetting('default_bot', 'role');
	
  if (botRole && member.user.bot) return await member.roles.add(botRole.value);
  else if (memberRole) await member.roles.add(memberRole.value);
	
  const joinChannel = databaseGuild.getSetting('default_join', 'channel');
	if (!joinChannel) return;

  const channel = member.guild.channels.cache.get(joinChannel.value);
  if (!channel || !channel.isTextBased()) return;

  const welcomePhrases = [
    `Olá ${member.user.username}! Seja muito bem vindo(a) à nossa Rede. Somos uma pequena comunidade de amigos e amigas onde costumamos conversar e jogar diariamente.`,
    `Que bom te conhecer ${member.user.username}! Apresento à você o ${member.guild.name}, uma pequena sociedade onde convivemos jogando e se divertindo, espero que se de bem com geral!`,
    `Muito legal te ver por aqui, ${member.user.username}! Espero que consiga socializar em nossa comunidade, nosso intuito é fazer você conhecer novas pessoas, fazer novas amizades, zoar e se divertir com todos nossos membros.`,
    `Saudações ${member.user.username}. Com muito prazer te convido à imergir em nosso Servidor. O ${member.guild.name} é uma comunidade de amigos e amigas, onde nos reunimos para jogar, conversar, e todo o resto, espero que goste!`
  ];

  const welcomeEmbed = new EmbedBuilder()
		.setColor(member.guild.members.me.displayHexColor)
		.setAuthor({ name: `${member.user.tag}`, iconURL: member.user.displayAvatarURL() })
		.setTitle(`🚩 Membro Novo! Seja muito bem-vindo(a) ${member.user.username} ao ${member.guild.name}`)
		.setThumbnail(member.guild.iconURL())
		.setDescription(`${welcomePhrases[Number.random(0, welcomePhrases.length - 1)]}`)
		.setImage(member.guild.bannerURL({ size: 512 }))
		.setFooter({ text: 'Obrigado por entrar!', iconURL: member.user.displayAvatarURL() });

  return await channel.send({ content: member.user.toString(), embeds: [welcomeEmbed] });
});
