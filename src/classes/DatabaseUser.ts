import { DatabaseUtils } from '../utils'
import { stringify, parse } from '../utils/database'
import { Patterns } from '../utils/discord'

export interface DatabaseUserPunishmentData {
	type: 'ban' | 'kick' | 'mute'
	guildId: string
	authorId: string
	reason: string
	startTimestamp: number
	endTimestamp: number | null
}
export interface DatabaseUserPreferenciesData {
	lang: string
}
export interface DatabaseUserData {
	id: string
	punishments: DatabaseUserPunishmentData[]
	preferencies: DatabaseUserPreferenciesData
}
export type DatabaseUserResolvable = string | number | DatabaseUser | DatabaseUserData | { [key: string]: any }

export default class DatabaseUser implements DatabaseUserData {
	static validate(data: DatabaseUserResolvable): boolean {
		if (!data) return false
		const idOnly = DatabaseUtils.isIdOnly(data)
		const userId = idOnly ? String(data) : data.id
		if (!Patterns.SnowflakeId.test(userId)) return false
		if (!idOnly) {
			try {
				if (typeof data.preferencies === 'string') parse(data.preferencies)
				else stringify(data.preferencies)
				if (typeof data.punishments === 'string') parse(data.punishments)
				else stringify(data.punishments)
			} catch(error) {
				return false
			}
		}
		return true
	}

	public id: string
	public punishments: DatabaseUserPunishmentData[]
	public preferencies: DatabaseUserPreferenciesData

	public toJSON(): DatabaseUserData {
		return {
			id: this.id,
			punishments: this.punishments,
			preferencies: this.preferencies
		}
	}

	/**
	 * Generates a Database User Object.
	 * @param data It's can be just a User ID or a resolvable User Data.
	 */
	constructor(data: DatabaseUserResolvable) {
		const idOnly = DatabaseUtils.isIdOnly(data)
		if (!data || (!idOnly && !data.id)) throw new Error(`[ DatabaseUser - Invalid Data ] Can't obtain informations from '${data}'`)
		const id = idOnly ? String(data) : data.id
		if (!/\d{17,19}/.test(id)) throw new Error(`[ DatabaseUser - Invalid ID ] User's ID '${id}' is not valid.`)
		this.id = id
		if (idOnly) {
			this.punishments = []
			this.preferencies = { lang: 'pt-BR' }
		} else {
			if (!this.punishments) this.punishments = []
			if (!this.preferencies) this.preferencies = { lang: 'pt-BR' }
			try {
				if (typeof data.punishments === 'string') this.punishments = parse(data.punishments)
				else this.punishments = data.punishments
				if (typeof data.preferencies === 'string') this.preferencies = parse(data.preferencies)
				else this.preferencies = data.preferencies
			} catch(error) {
				throw new Error(`[ DatabaseUser - Invalid JSON ] Can't parse JSON object.`, error)
			}
		}
	}
}
