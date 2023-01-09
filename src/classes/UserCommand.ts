import Discord from 'discord.js';
import { DiscordUtils } from '../utils';
import { UserContextMenuCommandInteraction } from './Interaction';
import UserCommandList from './UserCommandList';
import { basename } from 'path';

export default class UserCommandBuilder extends Discord.ContextMenuCommandBuilder {
	static cache: UserCommandList = new UserCommandList();

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
	public setExecute(fn: (interaction: UserContextMenuCommandInteraction) => Discord.Awaitable<any>): this {
		this.executeFunction = fn;
		return this;
	}

	// Autocomplete function (readonly)
	public get autocomplete(): (interaction: Discord.AutocompleteInteraction) => Discord.Awaitable<Discord.ApplicationCommandOptionChoiceData<string | number>[]> {
		return this.autocompleteFunction;
	}
	// Execute function (readonly)
  public get execute(): (interaction: UserContextMenuCommandInteraction) => Discord.Awaitable<any> {
		return this.executeFunction;
	}
	
	private autocompleteFunction: (interaction: Discord.AutocompleteInteraction) => Discord.Awaitable<Discord.ApplicationCommandOptionChoiceData<string | number>[]>;
	private executeFunction: (interaction: UserContextMenuCommandInteraction) => Discord.Awaitable<any>;

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
	public setType(type: Discord.ContextMenuCommandType): this {
		super.setType(type);
		return this;
	}

	constructor() {
		super();
		this.setType(Discord.ApplicationCommandType.User);
		UserCommandBuilder.cache.push(this);
	}
}
