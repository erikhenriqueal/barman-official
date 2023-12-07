import { LocalizationMap } from 'discord.js'
import { stringify, parse } from '../utils/database'
import { Patterns } from '../utils/discord'
import { DiscordUtils, DatabaseUtils } from '../utils'

export interface GuildSettingTypes {
	channel: string
	role: string
}
export interface GuildSetting<T extends keyof GuildSettingTypes> {
	type: T
	id: string
	name: string
	nameLocalizations: LocalizationMap
	value: GuildSettingTypes[T]
}

export interface GuildPunishmentsTypes {
	mute: string
	kick: string
	ban: string
}
export interface GuildPunishments<T extends keyof GuildPunishmentsTypes> {
	type: T
	userId: string
	authorId: string
	reason: string
	timestamp: number
	duration: number
}

export interface DatabaseGuildData {
	id: string
	settings: GuildSetting<keyof GuildSettingTypes>[]
	punishments: GuildPunishments<keyof GuildPunishmentsTypes>[]
}

export type DatabaseGuildResolvable = string | number | DatabaseGuild | DatabaseGuildData | { [key: string]: any }

export default class DatabaseGuild implements DatabaseGuildData {
	static validate(data: DatabaseGuildResolvable): boolean {
		if (!data) return false
		const idOnly = DatabaseUtils.isIdOnly(data)
		const guildId = idOnly ? String(data) : data.id
		if (!Patterns.SnowflakeId.test(guildId)) return false
		if (!idOnly) {
			try {
				if (typeof data.settings === 'string') parse(data.settings)
				else stringify(data.settings)
				if (typeof data.punishments === 'string') parse(data.punishments)
				else stringify(data.punishments)
			} catch(error) {
				return false
			}
		}
		return true
	}

	public id: string
	public settings: GuildSetting<keyof GuildSettingTypes>[]
	public punishments: GuildPunishments<keyof GuildPunishmentsTypes>[]

	/**
	 * Returns a list of guild's settings that starts with `prefix`.
	 * @param prefix A prefix to filter all settings (if null, return all settings).
	 * @param type A type to filter in the settings.
	 */
	public getSettings<T extends keyof GuildSettingTypes>(prefix?: string, type?: T): GuildSetting<T>[] {
		return this.settings?.filter(item => (type ? item.type === type : true) && (prefix ? [item.id, item.name, ...Object.values(item.nameLocalizations || {})].some(s => s.startsWith(prefix)) : true)) as GuildSetting<T>[]
	}
	/**
	 * Returns a specific item from guild's settings.
	 * @param id An identificator (`id`, `name` or `nameLocalization` properties) to find the setting.
	 * @param type The type of required setting.
	 */
	public getSetting<T extends keyof GuildSettingTypes>(id: string, type?: T): GuildSetting<T> | undefined {
		const filteredTypes = this.settings.filter(item => type ? item.type === type : true) as GuildSetting<T>[]
		const idMatch = filteredTypes.find(item => item.id === id)
		const nameMatch = filteredTypes.find(item => item.name === id)
		const nameLocalesMatch = filteredTypes.find(item => Object.values(item.nameLocalizations || {}).some(name => name === id))
		if (idMatch) return idMatch
		else if (nameMatch) return nameMatch
		else if (nameLocalesMatch) return nameLocalesMatch
		else return undefined
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
	public setSetting<T extends keyof GuildSettingTypes>(type: T, id: string, name: string, value: string, nameLocalizations?: LocalizationMap): GuildSetting<T> {
		const target = this.getSetting(id, type)
		if (target) {
			if (target.name != name) target.name = name
			if (target.nameLocalizations != nameLocalizations) target.nameLocalizations = nameLocalizations
			if (target.value != value) target.value = value
			return target
		} else {
			const object: GuildSetting<typeof type> = {
				type,
				id,
				name,
				value,
				nameLocalizations: nameLocalizations || {}
			}
			this.settings.push(object)
			return this.getSetting(object.id, object.type)
		}
	}

	public getPunishments<T extends keyof GuildPunishmentsTypes>(input?: Partial<GuildPunishments<T>>): GuildPunishments<T>[] {
		return this.punishments.filter(punishment => {
			if (input?.authorId === punishment.authorId) return true
			if (input?.duration === punishment.duration) return true
			if (input?.reason === punishment.reason) return true
			if (input?.timestamp === punishment.timestamp) return true
			if (input?.userId === punishment.userId) return true
			return false
		}) as GuildPunishments<T>[]
	}
	public setPunishments(...inputs: GuildPunishments<keyof GuildPunishmentsTypes>[]): this {
		for (let i = 0; i < inputs.length; i++) {
			const target = inputs[i]
			// Verify if this input is a valid punishment Add this to `this.punishments`
			if (!DiscordUtils.Patterns.SnowflakeId.test(target.userId)) throw new Error(`[ DatabaseGuild<${this.id}> - setPunishments ] userId is not a valid value (${target.userId}).`)
			if (!DiscordUtils.Patterns.SnowflakeId.test(target.authorId)) throw new Error(`[ DatabaseGuild<${this.id}> - setPunishments ] authorId is not a valid value (${target.authorId}).`)
		}
		return this
	}

	public toJSON(): DatabaseGuildData {
		return {
			id: this.id,
			settings: this.settings,
			punishments: this.punishments
		}
	}

	/**
	 * Generates a Database Guild Object.
	 * @param data It's can be just a Guild ID or a resolvable Guild Data.
	 */
	constructor(data: DatabaseGuildResolvable) {
		const idOnly = DatabaseUtils.isIdOnly(data)
		if (!data || (!idOnly && !data.id)) throw new Error(`[ DatabaseGuild - Invalid Data ] Can't obtain informations from '${data}'`)
		const id = idOnly ? String(data) : data.id
		if (!DiscordUtils.Patterns.SnowflakeId.test(id)) throw new Error(`[ DatabaseGuild - Invalid ID ] Guild's ID '${id}' is not valid.`)
		this.id = id
		if (idOnly) {
			this.settings = []
			this.punishments = []
		} else if (typeof data.settings === 'string') {
			try {
				this.settings = parse(data.settings)
			} catch(error) {
				throw new Error(`[ DatabaseGuild - Invalid JSON ] Can't parse 'settings' JSON object.`, error)
			}
		} else this.settings = data.settings
		if (idOnly || !data.punishments) this.punishments = []
		else if (typeof data.punishments === 'string') {
			try {
				this.punishments = parse(data.punishments)
			} catch(error) {
				throw new Error(`[ DatabaseGuild - Invalid JSON ] Can't parse 'punishments' JSON object.`, error)
			}
		} else this.punishments = data.punishments
	}
}
