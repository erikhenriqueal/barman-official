import Discord from 'discord.js';
import { DiscordUtils } from '../../utils';

import UserCommandBuilder from '../../classes/UserCommand';
export default new UserCommandBuilder()
.setName('Mute / Unmute')
.setNameLocalization('pt-BR', 'Silenciar / Dessilenciar')
.setDMPermission(false)
.setDefaultMemberPermissions(new Discord.PermissionsBitField(['ModerateMembers', 'MuteMembers', 'DeafenMembers']).bitfield)
.setExecute((interaction) => {
	if (DiscordUtils.isDeveloperInteraction(interaction)) {

	} else return interaction.sendReply({
		ephemeral: true,
		embeds: [ DiscordUtils.DefaultEmbedsBuilders.invalidCommand(interaction) ]
	});
});
