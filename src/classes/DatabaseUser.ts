import { stringify, parse } from '../utils/database';
import { Patterns } from '../utils/discord';

export interface DatabaseUserPunishmentData {
	type: 'ban' | 'kick' | 'mute';
	guildId: string;
	authorId: string;
	reason: string;
	startTimestamp: number;
	endTimestamp: number | null;
}
export interface DatabaseUserPreferenciesData {
	lang: string;
}
export interface DatabaseUserData {
	id: string;
	preferencies: string;
	punishments: string;
}
export interface UserData {
	id: string;
	punishments: DatabaseUserPunishmentData[];
	preferencies: DatabaseUserPreferenciesData;
}
export type DatabaseUserResolvable = string | UserData | DatabaseUser | DatabaseUserData;

export default class DatabaseUser implements UserData {
	static validate(data: DatabaseUserResolvable): boolean {
		if (!data) return false;
		const userId = typeof data === 'string' ? data : data.id;
		if (!Patterns.SnowflakeId.test(userId)) return false;
		if (typeof data !== 'string') {
			try {
				if (typeof data.preferencies === 'string') JSON.parse(data.preferencies);
				else JSON.stringify(data.preferencies);
				if (typeof data.punishments === 'string') JSON.parse(data.punishments);
				else JSON.stringify(data.punishments);
			} catch(error) {
				return false;
			}
		}
		return true;
	}

	public id: string;
	public punishments: DatabaseUserPunishmentData[];
	public preferencies: DatabaseUserPreferenciesData;
	public toJSON(): DatabaseUserData {
		return {
			id: this.id,
			punishments: stringify(this.punishments),
			preferencies: stringify(this.preferencies)
		}
	}

	/**
	 * Generates a Database User Object.
	 * @param data It's can be just a User ID or a resolvable User Data.
	 */
	constructor(data: DatabaseUserResolvable) {
		if (!data || (typeof data !== 'string' && !data.id)) throw new Error(`[ DatabaseUser - Invalid Data ] Can't obtain informations from '${data}'`);
		const id = typeof data === 'string' ? data : data.id;
		if (!/\d{17,19}/.test(id)) throw new Error(`[ DatabaseUser - Invalid ID ] User's ID '${id}' is not valid.`);
		this.id = id;
		if (typeof data === 'string') {
			this.punishments = [];
			this.preferencies = { lang: 'pt-BR' };
		} else {
			try {
				if (typeof data.punishments === 'string') this.punishments = parse(data.punishments);
				else this.punishments = data.punishments;
				if (typeof data.preferencies === 'string') this.preferencies = parse(data.preferencies);
				else this.preferencies = data.preferencies;
			} catch(error) {
				throw new Error(`[ DatabaseUser - Invalid JSON ] Can't parse JSON object.`, error);
			}
		}
	}
}
