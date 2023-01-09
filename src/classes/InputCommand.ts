import Discord from 'discord.js';
import InputCommandList from './InputCommandList';
import { ChatInputCommandInteraction } from './Interaction';
import { DiscordUtils } from '../utils';
import { basename } from 'path';

export default class InputCommandBuilder extends Discord.SlashCommandBuilder {
	static cache: InputCommandList = new InputCommandList();

	// This command's guild whitelist
	public guilds: string[] = [];

	// Changes the guild whitelist
	public setGuilds(...guildId: string[]): this {
		if (this.guilds.some((g) => !DiscordUtils.Patterns.SnowflakeId.test(g))) throw new Error(`[ Command - ${basename(__filename)} ] Received an invalid guild at setGuilds`);
		this.guilds = guildId;
		return this;
	}
	// Adds new guilds to this command
	public addGuilds(...guildId: string[]): this {
		if (this.guilds.some((g) => !DiscordUtils.Patterns.SnowflakeId.test(g))) throw new Error(`[ Command - ${basename(__filename)} ] Received an invalid guild at addGuilds`);
		this.guilds.push(...guildId);
		return this;
	}
	// Defines the autocomplete function to this command
	public setAutocomplete(fn: (interaction: Discord.AutocompleteInteraction) => Discord.Awaitable<Discord.ApplicationCommandOptionChoiceData<string | number>[]>): this {
		this.autocompleteFunction = fn;
		return this;
	}
	// Defines the execute function to this command
	public setExecute(fn: (interaction: ChatInputCommandInteraction) => Discord.Awaitable<any>): this {
		this.executeFunction = fn;
		return this;
	}

	// Autocomplete function (readonly)
	public get autocomplete(): (interaction: Discord.AutocompleteInteraction) => Discord.Awaitable<Discord.ApplicationCommandOptionChoiceData<string | number>[]> {
		return this.autocompleteFunction;
	}
	// Execute function (readonly)
  public get execute(): (interaction: ChatInputCommandInteraction) => Discord.Awaitable<any> {
		return this.executeFunction;
	}
	
	private autocompleteFunction: (interaction: Discord.AutocompleteInteraction) => Discord.Awaitable<Discord.ApplicationCommandOptionChoiceData<string | number>[]>;
	private executeFunction: (interaction: ChatInputCommandInteraction) => Discord.Awaitable<any>;

	/**
	 * _Remaking original types_  
	 * Sets if the command is available in DMs with the application, only for globally-scoped commands. By default, commands are visible.
	 */

	public setDMPermission(enabled: boolean): this {
		super.setDMPermission(enabled);
		return this;
	}
	public setDefaultMemberPermissions(permissions: string | number | bigint): this {
		super.setDefaultMemberPermissions(permissions);
		return this;
	}
	public setDescription(description: string): this {
		super.setDescription(description);
		return this;
	}
	public setDescriptionLocalization(locale: Discord.LocaleString, localizedDescription: string): this {
		super.setDescriptionLocalization(locale, localizedDescription);
		return this;
	}
	public setDescriptionLocalizations(localizedDescriptions: Discord.LocalizationMap | null): this {
		super.setDescriptionLocalizations(localizedDescriptions);
		return this;
	}
	public setName(name: string): this {
		super.setName(name);
		return this;
	}
	public setNameLocalization(locale: Discord.LocaleString, localizedName: string): this {
		super.setNameLocalization(locale, localizedName);
		return this;
	}
	public setNameLocalizations(localizedNames: Discord.LocalizationMap | null): this {
		super.setNameLocalizations(localizedNames);
		return this;
	}
	public addAttachmentOption(input: Discord.SlashCommandAttachmentOption | ((builder: Discord.SlashCommandAttachmentOption) => Discord.SlashCommandAttachmentOption)): this {
		super.addAttachmentOption(input);
		return this;
	}
	public addBooleanOption(input: Discord.SlashCommandBooleanOption | ((builder: Discord.SlashCommandBooleanOption) => Discord.SlashCommandBooleanOption)): this {
		super.addBooleanOption(input);
		return this;
	}
	public addChannelOption(input: Discord.SlashCommandChannelOption | ((builder: Discord.SlashCommandChannelOption) => Discord.SlashCommandChannelOption)): this {
		super.addChannelOption(input);
		return this;
	}
	public addIntegerOption(input: Discord.SlashCommandIntegerOption | ((builder: Discord.SlashCommandIntegerOption) => Discord.SlashCommandIntegerOption)): this {
		super.addIntegerOption(input);
		return this;
	}
	public addMentionableOption(input: Discord.SlashCommandMentionableOption | ((builder: Discord.SlashCommandMentionableOption) => Discord.SlashCommandMentionableOption)): this {
		super.addMentionableOption(input);
		return this;
	}
	public addNumberOption(input: Discord.SlashCommandNumberOption | ((builder: Discord.SlashCommandNumberOption) => Discord.SlashCommandNumberOption)): this {
		super.addNumberOption(input);
		return this;
	}
	public addRoleOption(input: Discord.SlashCommandRoleOption | ((builder: Discord.SlashCommandRoleOption) => Discord.SlashCommandRoleOption)): this {
		super.addRoleOption(input);
		return this;
	}
	public addStringOption(input: Discord.SlashCommandStringOption | ((builder: Discord.SlashCommandStringOption) => Discord.SlashCommandStringOption)): this {
		super.addStringOption(input);
		return this;
	}
	public addSubcommand(input: Discord.SlashCommandSubcommandBuilder | ((builder: Discord.SlashCommandSubcommandBuilder) => Discord.SlashCommandSubcommandBuilder)): this {
		super.addSubcommand(input);
		return this;
	}
	public addSubcommandGroup(input: Discord.SlashCommandSubcommandGroupBuilder | ((builder: Discord.SlashCommandSubcommandGroupBuilder) => Discord.SlashCommandSubcommandGroupBuilder)): this {
		super.addSubcommandGroup(input);
		return this;
	}
	public addUserOption(input: Discord.SlashCommandUserOption | ((builder: Discord.SlashCommandUserOption) => Discord.SlashCommandUserOption)): this {
		super.addUserOption(input);
		return this;
	}

	constructor() {
		super();
		InputCommandBuilder.cache.push(this);
	}
}
