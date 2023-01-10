import { LocalizationMap } from 'discord.js';
import { stringify, parse } from '../utils/database';
import { Patterns } from '../utils/discord';
import { DiscordUtils } from '../utils';

export interface GuildSettingTypes {
	channel: string;
	role: string;
}
export interface GuildSetting<T extends keyof GuildSettingTypes> {
	type: T;
	id: string;
	name: string;
	nameLocalizations: LocalizationMap;
	value: GuildSettingTypes[T];
}

export interface GuildPunishmentsTypes {
	mute: string;
	kick: string;
	ban: string;
}
export interface GuildPunishments<T extends keyof GuildPunishmentsTypes> {
	type: T;
	userId: string;
	authorId: string;
	reason: string;
	timestamp: number;
	duration: number;
}

export interface DatabaseGuildData {
	id: string;
	settings: string;
	punishments: string;
}
export interface GuildData {
	id: string;
	settings: GuildSetting<keyof GuildSettingTypes>[];
	punishments: GuildPunishments<keyof GuildPunishmentsTypes>[];
}
export type DatabaseGuildResolvable = string | GuildData | DatabaseGuild | DatabaseGuildData;

export default class DatabaseGuild implements GuildData {
	static validate(data: DatabaseGuildResolvable): boolean {
		if (!data) return false;
		const guildId = typeof data === 'string' ? data : data.id;
		if (!Patterns.SnowflakeId.test(guildId)) return false;
		if (typeof data !== 'string') {
			try {
				if (typeof data.settings === 'string') JSON.parse(data.settings);
				else JSON.stringify(data.settings);
				if (typeof data.punishments === 'string') JSON.parse(data.punishments);
				else JSON.stringify(data.punishments);
			} catch(error) {
				return false;
			}
		}
		return true;
	}

	public id: string;
	public settings: GuildSetting<keyof GuildSettingTypes>[];
	public punishments: GuildPunishments<keyof GuildPunishmentsTypes>[];

	/**
	 * Returns a list of guild's settings that starts with `prefix`.
	 * @param prefix A prefix to filter all settings (if null, return all settings).
	 * @param type A type to filter in the settings.
	 */
	public getSettings(prefix?: string, type?: keyof GuildSettingTypes): GuildSetting<keyof GuildSettingTypes>[] {
		return this.settings?.filter((item) => (type ? item.type === type : true) && (prefix ? [item.id, item.name, ...Object.values(item.nameLocalizations || {})].some((s) => s.startsWith(prefix)) : true));
	}
	/**
	 * Returns a specific item from guild's settings.
	 * @param id An identificator (`id`, `name` or `nameLocalization` properties) to find the setting.
	 * @param type The type of required setting.
	 */
	public getSetting(id: string, type?: keyof GuildSettingTypes): GuildSetting<keyof GuildSettingTypes> | undefined {
		const filteredTypes = this.settings.filter((item) => (type ? item.type === type : true));
		const idMatch = filteredTypes.find((item) => item.id === id);
		const nameMatch = filteredTypes.find((item) => item.name === id);
		const nameLocalesMatch = filteredTypes.find((item) => Object.values(item.nameLocalizations || {}).some((name) => name === id));
		if (idMatch) return idMatch;
		else if (nameMatch) return nameMatch;
		else if (nameLocalesMatch) return nameLocalesMatch;
		else return undefined;
	}
	/**
	 * Add or change an item inside guild's settings.  
	 * If the requested item already exists, it will be replaced by the new settings.  
	 * The replace option will work only with the same `type` of the object, what means that you can add two or more items with the same properties, but with different types.
	 * @param type Item type
	 * @param id Id type
	 * @param name 
	 * @param value 
	 * @param nameLocalizations 
	 */
	public setSetting(type: keyof GuildSettingTypes, id: string, name: string, value: string, nameLocalizations?: LocalizationMap): GuildSetting<keyof GuildSettingTypes> {
		const target = this.getSetting(id, type);
		if (target) {
			if (target.name != name) target.name = name;
			if (target.nameLocalizations != nameLocalizations) target.nameLocalizations = nameLocalizations;
			if (target.value != value) target.value = value;
			return target;
		} else {
			const object: GuildSetting<typeof type> = {
				type,
				id,
				name,
				value,
				nameLocalizations: nameLocalizations || {}
			}
			this.settings.push(object);
			return this.getSetting(object.id, object.type);
		}
	}

	public getPunishments(input?: Partial<GuildPunishments<keyof GuildPunishmentsTypes>>): GuildPunishments<keyof GuildPunishmentsTypes>[] {
		return this.punishments.filter((punishment) => {
			if (input?.authorId === punishment.authorId) return true;
			if (input?.duration === punishment.duration) return true;
			if (input?.reason === punishment.reason) return true;
			if (input?.timestamp === punishment.timestamp) return true;
			if (input?.userId === punishment.userId) return true;
			return false;
		});
	}
	public setPunishments(...inputs: GuildPunishments<keyof GuildPunishmentsTypes>[]): this {
		for (let i = 0; i < inputs.length; i++) {
			const target = inputs[i];
			// Verify if this input is a valid punishment; Add this to `this.punishments`;
			if (!DiscordUtils.Patterns.SnowflakeId.test(target.userId)) throw new Error(`[ DatabaseGuild<${this.id}> - setPunishments ] userId is not a valid value (${target.userId}).`);
			if (!DiscordUtils.Patterns.SnowflakeId.test(target.authorId)) throw new Error(`[ DatabaseGuild<${this.id}> - setPunishments ] authorId is not a valid value (${target.authorId}).`);
		}
		return this;
	}

	public toJSON(): DatabaseGuildData {
		return {
			id: this.id,
			settings: stringify(this.settings),
			punishments: stringify(this.punishments)
		}
	}

	/**
	 * Generates a Database Guild Object.
	 * @param data It's can be just a Guild ID or a resolvable Guild Data.
	 */
	constructor(data: DatabaseGuildResolvable) {
		if (!data || (typeof data !== 'string' && !data.id)) throw new Error(`[ DatabaseGuild - Invalid Data ] Can't obtain informations from '${data}'`);
		const id = typeof data === 'string' ? data : data.id;
		if (!DiscordUtils.Patterns.SnowflakeId.test(id)) throw new Error(`[ DatabaseGuild - Invalid ID ] Guild's ID '${id}' is not valid.`);
		this.id = id;
		if (typeof data === 'string' || !data.settings) this.settings = [];
		else if (typeof data.settings === 'string') {
			try {
				this.settings = parse(data.settings);
			} catch(error) {
				throw new Error(`[ DatabaseGuild - Invalid JSON ] Can't parse 'settings' JSON object.`, error);
			}
		} else this.settings = data.settings;
		if (typeof data === 'string' || !data.punishments) this.punishments = [];
		else if (typeof data.punishments === 'string') {
			try {
				this.punishments = parse(data.punishments);
			} catch(error) {
				throw new Error(`[ DatabaseGuild - Invalid JSON ] Can't parse 'punishments' JSON object.`, error);
			}
		} else this.punishments = data.punishments;
	}
}
