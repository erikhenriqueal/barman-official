import MySQL from 'mysql';
import DatabaseUser, { DatabaseUserResolvable } from './DatabaseUser';
import DatabaseGuild, { DatabaseGuildResolvable } from './DatabaseGuild';
import { DiscordUtils } from '../utils';
import { stringify } from '../utils/database';

export default class Database {
	static numberTypes = ['int', 'decimal', 'bigint', 'double', 'float', 'mediumint', 'real', 'tinyint', 'smallint'];
	
	/**
	 * Fix the `value` to fit correctly in column's `type` DataType. 
	 * @param value The requested value.
	 * @param type The column DataType.
	 */
	static typeParse(value: any, type: string) {
		if (Database.numberTypes.includes(type)) return value;
		else return `'${String(value).replace(/'/, '\\\'')}'`;
	}
	
	public connection: MySQL.Connection;
	
	// Database Management
	
	/**
	 * 
	 */
	public async query(string: string): Promise<{ results: any, fields?: MySQL.FieldInfo[] }> {
		return new Promise((res, rej) => {
			this.connection.query(string, (error: MySQL.MysqlError | null, results?: any, fields?: MySQL.FieldInfo[]) => {
				if (error) return rej(error);
				else return res({ results, fields });
			});
		});
	}

	/**
	 * Returns the requested Column DataType or `undefined` if the column `table.column` doesn't exists.
	 * @param table The table to find the column.
	 * @param column The column to get the DataType.
	 */
	public async getDataType(table: string, column: string): Promise<string | undefined> {
		await this.awaitValidation();
		return new Promise((res, rej) => this.connection.query(`SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='${this.connection.config.database}' AND TABLE_NAME='${table}' AND COLUMN_NAME='${column}'`, (error, results) => {
			if (error) return rej(error);
			return res(results[0]?.DATA_TYPE);
		}));
	}
	/**
	 * Add a new value to the database.
	 * @param table The database `table` you want to add this value.
	 * @param data Data to add in the `table`.
	 * @returns The database `table`.
	 */
	public async set(table: string, data: { [key: string]: any }): Promise<any[]> {
		await this.awaitValidation();
		return new Promise(async (res, rej) => {
			const types: { [key: string]: string } = {};
			const entries = Object.entries(data);
			for (const entry of entries.map((e) => e[0]).flat()) types[entry] = await this.getDataType(table, entry);
			const keys = entries.map((e) => `\`${e[0]}\``);
			const values = entries.map((e) => Database.typeParse(e[1], types[e[0]]));
			return this.connection.query(`INSERT INTO \`${table}\` (${keys.join(', ')}) VALUES (${values.join(', ')})`, async (error) => {
				if (error) return rej(error);
				return res(await this.get(table));
			});
		});
	}
	/**
	 * Get a data list from your database.
	 * @param table The table to find the results.
	 * @param keys Keys whitelist. If there's no `keys`, it'll return all that.
	 * @param filter If you need to use some filter on this request.
	 */
	public async get(table: string, keys?: string[], filter?: (target: any) => boolean): Promise<any[]> {
		await this.awaitValidation();
		return new Promise(async (res, rej) => {
			if (keys && keys.length > 0) keys = keys.map((k) => `\`${k}\``);
			if (!filter) {
				if (!keys || keys.length === 0) return this.connection.query(`SELECT * FROM \`${table}\``, callback);
				else return this.connection.query(`SELECT ${keys.join(', ')} FROM \`${table}\``, callback);
			} else {
				if (!keys || keys.length === 0) this.connection.query(`SELECT * FROM \`${table}\``, (error, results) => {
					if (error) return rej(error);
					return res(results.filter((i) => filter(i)));
				});
				else this.connection.query(`SELECT ${keys.join(', ')} FROM \`${table}\``, (error, results) => {
					if (error) return rej(error);
					return res(results.filter((i) => filter(i)));
				});
			}
			function callback(error, results) {
				if (error) return rej(error);
				return res(results);
			}
		});
	}
	/**
	 * Edit a data inside your database.
	 * @param table The table to be updated.
	 * @param filter Filter all elements you want to modify.
	 * @param data The data modifier to apply to each filtered database item.
	 */
	public async edit(table: string, filter: (target: any) => boolean, data: (data: any) => any): Promise<any[]> {
		await this.awaitValidation();
		return new Promise(async (res, rej) => {
			const items = await this.get(table, [], filter);
			if (items.length === 0) return res([]);
			for (let results = [], i = 0; i < items.length; i++) {
				const item = items[i];
				const entries = Object.entries(item);
				const types: { [key: string]: any } = {};
				for (const entry of entries) types[entry[0]] = await this.getDataType(table, entry[0]);
				const newData = Object.assign(item, data(item));
				const newDataEntries = Object.entries(newData);
				const newDataString = newDataEntries.map((e) => `\`${e[0]}\`=${Database.typeParse(e[1], types[e[0]])}`).join(', ');
				const conditions = entries.map((e) => `\`${e[0]}\`=${Database.typeParse(e[1], types[e[0]])}`);
				this.connection.query(`UPDATE \`${table}\` SET ${newDataString} WHERE ${conditions.join(' AND ')}`, (error) => {
					if (error) return rej(error);
					results.push(newData);
					if (i === items.length - 1) return res(results);
				});
			}
		});
	}
	/**
	 * Delete data from database.
	 * @param table Table to be used.
	 * @param filter Data values to filter. If there's no `filter`, all that `table`'s items will be deleted.
	 */
	public async delete(table: string, filter?: (target: any) => boolean): Promise<any[]> {
		await this.awaitValidation();
		return new Promise(async (res, rej) => {
			try {
				const results = await this.get(table, [], filter);
				const types: { [key: string]: any } = {};
				for (const item of results) {
					const entries = Object.entries(item);
					for (const entry of entries) types[entry[0]] = await this.getDataType(table, entry[0]);
				}
				const conditions = results.map((r) => Object.entries(r).map((e) => `\`${e[0]}\`=${Database.typeParse(e[1], types[e[0]])}`));
				return this.connection.query(`DELETE FROM \`${table}\`${filter ? ` WHERE ${conditions.map((c) => `(${c.join(' AND ')})`).join(' OR ')}` : ''}`, (error) => {
					if (error) return rej(error);
					return res(results);
				});
			} catch(error) {
				return rej(error);
			}
		});
	}

	
	// Users Management


	public async getUsers(): Promise<DatabaseUser[]> {
		await this.awaitValidation();
		return new Promise((res, rej) => this.get('users').then((users) => res(users.map((u) => new DatabaseUser(u)))).catch(rej));
	}
	public async getUser(data: DatabaseUserResolvable): Promise<DatabaseUser | undefined> {
		await this.awaitValidation();
		return new Promise((res, rej) => {
			const userId = typeof data === 'string' ? data : data.id;
			return this.get('users', [], (d) => d.id == userId).then((users) => {
				if (!users[0]) return res(undefined);
				return res(new DatabaseUser(users[0]));
			}).catch(rej);
		});
	}
	public async hasUser(data: DatabaseUserResolvable): Promise<boolean> {
		await this.awaitValidation();
		return new Promise((res, rej) => this.getUser(data).then((user) => user ? res(true) : res(false)).catch(rej));
	}
	public async addUser(data: DatabaseUserResolvable): Promise<DatabaseUser> {
		await this.awaitValidation();
		return new Promise(async (res, rej) => {
			const target = await this.getUser(data);
			if (!target) {
				const user = new DatabaseUser(data);
				await this.set('users', user.toJSON()).catch(rej);
				return res(await this.getUser(data));
			} else res(target);
		});
	}
	public async editUser(target: DatabaseUserResolvable, data: DatabaseUserResolvable | ((oldData: DatabaseUser) => DatabaseUserResolvable)): Promise<DatabaseUser> {
		await this.awaitValidation();
		return new Promise(async (res, rej) => {
			const targetId = typeof target === 'string' ? target : target.id;
			this.edit('users', (t) => t.id == targetId, (oldData) => new DatabaseUser(typeof data === 'function' ? data(new DatabaseUser(oldData)) : data).toJSON())
			.then(async () => res(await this.getUser(targetId)))
			.catch(rej);
		});
	}
	public async deleteUser(target: DatabaseUserResolvable): Promise<DatabaseUser | undefined> {
		await this.awaitValidation();
		return new Promise((res, rej) => {
			const targetId = typeof target === 'string' ? target : target.id;
			this.delete('users', (t) => t.id == targetId).then((deleted) => {
				const user = deleted.find((d) => d.id == targetId);
				if (!user) return res(null);
				else return res(new DatabaseUser(user));
			}).catch(rej);
		});
	}


	// Guilds Management


	public async getGuilds(): Promise<DatabaseGuild[]> {
		await this.awaitValidation();
		return new Promise((res, rej) => this.get('guilds').then((guilds) => res(guilds.map((u) => new DatabaseGuild(u)))).catch(rej));
	}
	public async getGuild(data: DatabaseGuildResolvable): Promise<DatabaseGuild | undefined> {
		await this.awaitValidation();
		return new Promise((res, rej) => {
			const guildId = typeof data === 'string' ? data : data.id;
			return this.get('guilds', [], (d) => d.id == guildId).then((guilds) => {
				if (!guilds[0]) return res(undefined);
				return res(new DatabaseGuild(guilds[0]));
			}).catch(rej);
		});
	}
	public async hasGuild(data: DatabaseGuildResolvable): Promise<boolean> {
		await this.awaitValidation();
		return new Promise((res, rej) => this.getGuild(data).then((guild) => guild ? res(true) : res(false)).catch(rej));
	}
	public async addGuild(data: DatabaseGuildResolvable): Promise<DatabaseGuild> {
		await this.awaitValidation();
		return new Promise(async (res, rej) => {
			const target = await this.getGuild(data);
			if (!target) {
				const guild = new DatabaseGuild(data);
				await this.set('guilds', guild.toJSON()).catch(rej);
				return res(await this.getGuild(data));
			} else res(target);
		});
	}
	public async editGuild(target: DatabaseGuildResolvable, data: DatabaseGuildResolvable | ((oldData: DatabaseGuild) => DatabaseGuildResolvable)): Promise<DatabaseGuild> {
		await this.awaitValidation();
		return new Promise((res, rej) => {
			const targetId = typeof target === 'string' ? target : target.id;
			this.edit('guilds', (t) => t.id == targetId, (oldData) => new DatabaseGuild(typeof data === 'function' ? data(new DatabaseGuild(oldData)) : data).toJSON())
			.then(async () => res(await this.getGuild(targetId)))
			.catch(rej);
		});
	}
	public async deleteGuild(target: DatabaseGuildResolvable): Promise<DatabaseGuild | undefined> {
		await this.awaitValidation();
		return new Promise((res, rej) => {
			const targetId = typeof target === 'string' ? target : target.id;
			this.delete('guilds', (t) => t.id == targetId).then((deleted) => {
				const guild = deleted.find((d) => d.id == targetId);
				if (!guild) return res(null);
				else return res(new DatabaseGuild(guild));
			}).catch(rej);
		});
	}


	// Verification Only


	private available: boolean = false;
	private awaitValidation(): Promise<boolean> {
		return new Promise((res) => {
			const interval = setInterval(() => {
				if (!this.available) return;
				clearInterval(interval);
				res(true);
			}, 0);
		});
	}

	constructor(connectionUri: string | MySQL.ConnectionConfig) {
		this.connection = MySQL.createConnection(connectionUri);
		this.connection.connect(async (error) => {
			if (error) return console.error(error);
			const { host, database, user } = this.connection.config;
			console.log(`[ MySQL ] Successfully connected as '${user}@${host}' in '${database}' database (schema).`);
			this.available = true;

			await this.query('CREATE TABLE IF NOT EXISTS `guilds` (`id` varchar(19) NOT NULL, `settings` text, `punishments` text, PRIMARY KEY (`id`))').catch(console.error);
			await this.query('CREATE TABLE IF NOT EXISTS `users` (`id` varchar(19) NOT NULL, `punishments` text, `preferencies` text, PRIMARY KEY (`id`))').catch(console.error);

			// await this.query('SHOW TABLES').then(async (res) => {
			// 	const tables = res.results.map((r) => Object.values(r)).flat();
			// 	for (const tablename of ['guilds', 'users']) {
			// 		if (tables.includes(tablename)) {
			// 			const table = (await this.query(`DESCRIBE ${tablename}`)).results;
			// 			if (tablename === 'guilds') {
			// 				const id = table.find((i) => i.Field === 'id'); // 
			// 				const settings = table.find((i) => i.Field === 'settings');
			// 				const punishments = table.find((i) => i.Field === 'punishments');
							
			// 			} else if (tablename === 'users') {
			// 				const id = table.find((i) => i.Field === 'id');
			// 				const punishments = table.find((i) => i.Field === 'punishments');
			// 				const preferencies = table.find((i) => i.Field === 'preferencies');
							
			// 			}
			// 		}
			// 	}
			// }).catch(console.error);

			const guilds = await this.getGuilds();
			for (const guild of guilds) {
				if (!DiscordUtils.Patterns.SnowflakeId.test(guild.id)) throw new Error(`[ Database ] Invalid database ID '${guild.id}'`);
				if (!Array.isArray(guild.punishments)) guild.punishments = [];
				else for (const punishment of guild.punishments) {
					if (!DiscordUtils.Patterns.SnowflakeId.test(punishment.authorId)) throw new Error(`[ Database ] Invalid punishment 'authorId' value (${punishment.authorId}) in '${guild.id}'`);
					if (!DiscordUtils.Patterns.SnowflakeId.test(punishment.userId)) throw new Error(`[ Database ] Invalid punishment 'userId' value (${punishment.userId}) in '${guild.id}'`);
					if (!isNaN(punishment.timestamp) || !Number.isSafeInteger(punishment.timestamp)) throw new Error(`[ Database ] Invalid punishment 'timestamp' (${punishment.timestamp}) in '${guild.id}'`);
					if (!['ban', 'kick', 'mute'].includes(punishment.type)) throw new Error(`[ Database ] Punishment type '${punishment.type}' for '${guild.id}' doesn't match the choices: 'ban', 'kick' or 'mute'`);
				}
				if (!Array.isArray(guild.settings)) guild.settings = [];
				else for (const setting of guild.settings) {
					if (!DiscordUtils.Patterns.SnowflakeId.test(setting.id)) throw new Error(`[ Database ] Invalid setting 'id' value (${setting.id}) in '${guild.id}'`);
					for (const name of [setting.name, ...Object.values(setting.nameLocalizations)]) if (!checkName(name)) throw new Error(`[ Database ] Invalid setting name '${name}' in '${guild.id}'`);
					if (!['channel', 'role'].includes(setting.type)) throw new Error(`[ Database ] Invalid setting 'type' value (${setting.type}) in '${guild.id}'`);
					function checkName(name: string): boolean {
						return typeof name === 'string' && name.trim().length > 0;
					}
				}

				await this.editGuild(guild, guild.toJSON());
			}
		});
		this.connection.on('disconnect', (...args) => console.error(`[ MySQL ] Application disconnected.`, ...args));
		this.connection.on('exit', (...args) => console.error(`[ MySQL ] Application exited.`, ...args));
		this.connection.on('error', (...args) => console.error(`[ MySQL ] Received an error.`, ...args));
	}
}
