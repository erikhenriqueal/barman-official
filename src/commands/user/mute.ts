import Discord from 'discord.js';

import UserCommandBuilder from '../../classes/UserCommand';
export default new UserCommandBuilder()
.setName('Mute / Unmute')
.setNameLocalization('pt-BR', 'Silenciar / Dessilenciar')
.setDMPermission(false)
.setDefaultMemberPermissions(new Discord.PermissionsBitField(['ModerateMembers', 'MuteMembers', 'DeafenMembers']).bitfield)
.setExecute((interaction) => {
	interaction.sendReply('Este comando está atualmente em desenvolvimento.');
});
