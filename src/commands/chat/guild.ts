import Discord from 'discord.js';
import { database } from '../../';
import InputCommandBuilder from '../../classes/InputCommand';

const channelDefaults: {[key: string]: Discord.ApplicationCommandOptionChoiceData } = {
	default_join: { name: '⛳ Default Join Channel', nameLocalizations: { 'pt-BR': '⛳ Canal de Entradas Padrão' }, value: 'default_join' },
	default_leave: { name: '🛝 Default Leave Channel', nameLocalizations: { 'pt-BR': '🛝 Canal de Saídas Padrão' }, value: 'default_leave' },
	default_punishments: { name: '🎡 Default Punishments Channel', nameLocalizations: { 'pt-BR': '🎡 Canal de Punições Padrão' }, value: 'default_punishments' }
}
const roleDefaults : {[key: string]: Discord.ApplicationCommandOptionChoiceData } = {
	default_member: { name: '🚩 Default Member Role', nameLocalizations: { 'pt-BR': '🚩 Cargo para Membros Padrão' }, value: 'default_member' },
	default_bot: { name: '🚀 Default Bot Role', nameLocalizations: { 'pt-BR': '🚀 Cargo para Bots Padrão' }, value: 'default_bot' }
}

export default new InputCommandBuilder()
.setName('guild')
.setNameLocalization('pt-BR', 'servidor')
.setDescription('Manage this server settings.')
.setDescriptionLocalization('pt-BR', 'Gerencie as configurações deste servidor.')
.setDMPermission(false)
.setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageGuild)
.addSubcommand(
	new Discord.SlashCommandSubcommandBuilder()
	.setName('see')
	.setNameLocalization('pt-BR', 'ver')
	.setDescription('Shows you the current guild settings.')
	.setDescriptionLocalization('pt-BR', 'Lhe mostra as configurações do servidor atual.')
	.addStringOption(
		new Discord.SlashCommandStringOption()
		.setName('label')
		.setNameLocalization('pt-BR', 'nome')
		.setDescription('A label to select a setting.')
		.setDescriptionLocalization('pt-BR', 'Nome da opção à ser selecionada.')
		.setRequired(false)
		.setAutocomplete(true)
	)
).addSubcommandGroup(
	new Discord.SlashCommandSubcommandGroupBuilder()
	.setName('add')
	.setNameLocalization('pt-BR', 'adicionar')
	.setDescription('Adds a new option in your guild settings.')
	.setDescriptionLocalization('pt-BR', 'Adiciona uma nova opção nas configurações do servidor.')
	.addSubcommand(
		new Discord.SlashCommandSubcommandBuilder()
		.setName('channel')
		.setNameLocalization('pt-BR', 'canal')
		.setDescription('Adds a new channel option in your guild settings.')
		.setDescriptionLocalization('pt-BR', 'Adiciona uma nova opção nas configurações do servidor.')
		.addStringOption(
			new Discord.SlashCommandStringOption()
			.setName('id')
			.setDescription('An identificator to find this option as a variable.')
			.setDescriptionLocalization('pt-BR', 'Um identificador para encontrar esta opção como variável.')
			.setRequired(true)
			.setAutocomplete(true)
		).addChannelOption(
			new Discord.SlashCommandChannelOption()
			.setName('channel')
			.setNameLocalization('pt-BR', 'canal')
			.setDescription('The channel to be assigned.')
			.setDescriptionLocalization('pt-BR', 'O canal à ser adicionado à esta opção.')
			.setRequired(true)
		).addStringOption(
			new Discord.SlashCommandStringOption()
			.setName('label')
			.setDescription('The label to refer to your option. (in en-US)')
		).addStringOption(
			new Discord.SlashCommandStringOption()
			.setName('nome')
			.setDescription('O nome para se referir à esta opção. (em pt-BR)')
		)
	).addSubcommand(
		new Discord.SlashCommandSubcommandBuilder()
		.setName('role')
		.setNameLocalization('pt-BR', 'cargo')
		.setDescription('Adds a new role option in your guild settings.')
		.setDescriptionLocalization('pt-BR', 'Adiciona uma nova opção nas configurações do servidor.')
		.addStringOption(
			new Discord.SlashCommandStringOption()
			.setName('id')
			.setDescription('An identificator to find this option as a variable.')
			.setDescriptionLocalization('pt-BR', 'Um identificador para encontrar esta opção como variável.')
			.setRequired(true)
			.setAutocomplete(true)
		).addRoleOption(
			new Discord.SlashCommandRoleOption()
			.setName('role')
			.setNameLocalization('pt-BR', 'cargo')
			.setDescription('The role to be assigned.')
			.setDescriptionLocalization('pt-BR', 'O cargo à ser adicionado à esta opção.')
			.setRequired(true)
		).addStringOption(
			new Discord.SlashCommandStringOption()
			.setName('label')
			.setDescription('The label to refer to your option. (in en-US)')
		).addStringOption(
			new Discord.SlashCommandStringOption()
			.setName('nome')
			.setDescription('O nome para se referir à esta opção. (em pt-BR)')
		)
	)
).addSubcommand(
	new Discord.SlashCommandSubcommandBuilder()
	.setName('change')
	.setNameLocalization('pt-BR', 'alterar')
	.setDescription('Modify the guild settings data.')
	.setDescriptionLocalization('pt-BR', 'Altera as configurações do servidor.')
	.addStringOption(
		new Discord.SlashCommandStringOption()
		.setName('selector')
		.setNameLocalization('pt-BR', 'seletor')
		.setDescription('A label or id to select a setting.')
		.setDescriptionLocalization('pt-BR', 'Nome ou identificador (id) da opção à ser alterada.')
		.setRequired(true)
		.setAutocomplete(true)
	).addStringOption(
		new Discord.SlashCommandStringOption()
		.setName('value')
		.setNameLocalization('pt-BR', 'valor')
		.setDescription('Defines the value for this option.')
		.setDescriptionLocalization('pt-BR', 'Define o valor desta opção.')
		.setRequired(true)
	)
).setAutocomplete(async (interaction) => {
	if (!await database.hasGuild(interaction.guildId)) await database.addGuild(interaction.guildId);
	const databaseGuild = await database.getGuild(interaction.guildId);
	const subcommandName = interaction.options.getSubcommand(true);
	const subcommandGroupName = interaction.options.getSubcommandGroup();
	const focused = interaction.options.getFocused(true);

	// See Subcommand
	if (subcommandName === 'see' && focused.name === 'label') return databaseGuild.settings.map((i) => channelDefaults[i.name] ? channelDefaults[i.name] : ({ name: i.name, value: i.id }));
	
	// Add SubcommandGroup
	if (subcommandGroupName === 'add') {
		if (subcommandName === 'channel' && focused.name === 'id') return Object.keys(channelDefaults).map((k) => ({ name: k, value: k }));
		else if (subcommandName === 'role' && focused.name === 'id') return Object.keys(roleDefaults).map((k) => ({ name: k, value: k }));
	}

	// Change Subcommand
	if (subcommandName === 'change') {
		if (focused.name === 'selector') return [
			...databaseGuild.settings.map((i) => ({ name: i.id, value: i.id })),
			...databaseGuild.settings.map((i) => ({ name: i.name, value: i.id }))
		];
	}
	return [];
}).setExecute(async (interaction) => {
	const embed = new Discord.EmbedBuilder()
		.setColor(interaction.guild?.members.me.displayHexColor)
		.setAuthor({ name: interaction.user.tag, iconURL: interaction.user.avatarURL() })
		.setFooter({ text: `${interaction.guild?.name || interaction.client.user.username} © ${new Date().getFullYear()}`, iconURL: interaction.guild?.iconURL() })

	const subcommand = interaction.options.getSubcommand(true);
	const subcommandGroup = interaction.options.getSubcommandGroup();

	if (!await database.hasGuild(interaction.guildId)) await database.addGuild(interaction.guildId);
	const databaseGuild = await database.getGuild(interaction.guildId);

	if (subcommand === 'see') {
		const label = interaction.options.getString('label');
		if (!label) {
			const description = databaseGuild.settings.map((i) => `• ${typeof i.nameLocalizations[interaction.locale] === 'string' ? i.nameLocalizations[interaction.locale] : i.name} (\`${i.id}\`): <${i.type === 'channel' ? '#' : i.type === 'role' ? '@&' : ''}${i.value}>`).join('\n');
			return interaction.sendReply({
				ephemeral: true,
				embeds: [
					embed
					.setTitle(`📒 Configurações de ${interaction.guild.name}`)
					.setDescription(description.trim().length === 0 ? '> *Nenhuma configuração foi encontrada neste servidor.*' : description)
				]
			});
		}
		const settings = databaseGuild.settings.filter((i) => i.name === label);
		if (settings.length === 0) return interaction.sendReply({
			ephemeral: true,
			embeds: [
				embed
				.setTitle('❌ Item não encontrado')
				.setDescription(`Desculpe ${interaction.user.toString()}, mas não encontrei nenhum item chamado '${label}'. Verifique e tente novamente.`)
			]
		});
		return interaction.sendReply({
			ephemeral: true,
			embeds: [
				embed
				.setTitle(`📒 Configurações de ${interaction.guild.name}`)
				.setDescription(settings.map((i) => `• ${i.nameLocalizations[interaction.locale] ? i.nameLocalizations[interaction.locale] : i.name} (\`${i.id}\`): <${i.type === 'channel' ? '#' : i.type === 'role' ? '@&' : ''}${i.value}>`).join('\n'))
			]
		});
	} if (subcommandGroup === 'add') {
		if (subcommand === 'channel') {
			const id = interaction.options.getString('id', true);
			const channel = interaction.options.getChannel('channel', true);
			const label = interaction.options.getString('label');
			const nome = interaction.options.getString('nome');

			if (Object.keys(channelDefaults).includes(id)) {
				const targetDefault = channelDefaults[id];
				databaseGuild.setSetting('channel', id, targetDefault.name, channel.id, targetDefault.nameLocalizations);
			}
			databaseGuild.setSetting('channel', id, label, channel.id, { 'pt-BR': nome });

			const updatedDatabaseGuild = await database.editGuild(databaseGuild.id, databaseGuild);

			const added = updatedDatabaseGuild.getSetting(id, 'channel');
			return interaction.sendReply({
				ephemeral: true,
				embeds: [ embed
					.setTitle('⚙️ Item Alterado com Sucesso!')
					.setDescription(`Pronto ${interaction.user.toString()}, as configurações de seu servidor foram alteradas!\n\n> Alterações feitas:\n> • ID: ${added.id}\n> Nome (en-US): ${added.name}\n> • Nome (pt-BR): ${added.nameLocalizations['pt-BR'] || '*nenhum*'}\n> • Canal: <#${added.value}>`)
				]
			});
		} else if (subcommand === 'role') {
			const id = interaction.options.getString('id', true);
			const role = interaction.options.getRole('role', true);
			const label = interaction.options.getString('label');
			const nome = interaction.options.getString('nome');
		}
	} else if (subcommand === 'change') {
		const selector = interaction.options.getString('selector', true);
		const value = interaction.options.getString('value');
	}

  interaction.sendReply({
		ephemeral: true,
		embeds: [
    	new Discord.EmbedBuilder()
			.setColor(interaction.guild?.members.me.displayHexColor)
			.setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ forceStatic: false }) })
			.setTitle('⚙️ Configurações')
			.setDescription(`> *Este comando está atualmente em desenvolvimento.*`)
			.setFooter({ text: `${interaction.guild?.name || interaction.client.user.username} © ${new Date().getFullYear()}`, iconURL: interaction.guild?.iconURL({ forceStatic: false }) })
		]
	});
});
