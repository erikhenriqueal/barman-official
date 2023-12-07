import MySQL from 'mysql2/promise'
import { isPlainObject, mapValues } from 'lodash'

export const { identify: identifyQuery } = require('sql-query-identifier')

import DatabaseUser, { DatabaseUserData, DatabaseUserResolvable } from './DatabaseUser'
import DatabaseGuild, { DatabaseGuildData, DatabaseGuildResolvable } from './DatabaseGuild'
import { DatabaseUtils, DiscordUtils, debug } from '../utils'

export type MySQLResult = MySQL.RowDataPacket[] | MySQL.RowDataPacket[][] | MySQL.OkPacket | MySQL.OkPacket[] | MySQL.ResultSetHeader

export default class Database {
	static numberTypes = ['int', 'decimal', 'bigint', 'double', 'float', 'mediumint', 'real', 'tinyint', 'smallint']
	
	/**
	 * Fix the `value` to fit correctly in column's `type` DataType. 
	 * @param value The requested value.
	 * @param type The column DataType.
	 */
	static typeParse(value: any, type: string) {
		const result = Database.numberTypes.includes(type) ? value : `'${String(value).replace(/'/, '\\\'')}'`
		debug(`Parsing Database values:`, { type, raw: value, output: result })
		return result
	}
	
	public readonly pool: MySQL.Pool;

	public async getConnection(): Promise<MySQL.PoolConnection> {
		const connection = await this.pool.getConnection()
		connection.on('disconnect', (...args) => console.error(`[ MySQL ] Application disconnected.`, ...args))
		connection.on('exit', (...args) => console.error(`[ MySQL ] Application exited.`, ...args))
		connection.on('error', (...args) => {
			console.error(`[ MySQL ] Received an error.`, ...args)
			// console.error(`[ MySQL ] Received an error. Trying to force reload.`, ...args)
			// connection.end(err => console.error(`[ MySQL ] Coudn't end connection`, err))
		})
		return connection
	}
	
	// Database Management
	
	/**
	 * Process the values to be queried.
	 * @param value The value you want to process.
	 * @param options Additional options:
	 * ```
	 * const options: Options = {
	 * - json: 'Whether you want to parse Object\'s and Array\'s to a JSON String.'
	 * }
	 * ```
	 */
	public processValue(value: any, options?: { json?: boolean; }): any {
		// typeof value === 'function'
		// typeof value === 'object'
		// typeof value === 'symbol'
		// typeof value === 'undefined'
		const bypassableTypes = [ 'bigint', 'boolean', 'number', 'string' ]
		if (value === undefined) return null
		if (bypassableTypes.includes(typeof value)) return value
		if (Array.isArray(value) || isPlainObject(value)) {
			if (options?.json === true) return JSON.stringify(value)
			return mapValues(value, this.processValue)
		}
		return String(value)
	}

	/**
	 * Parses your Query values by your SQL Query String.
	 * @param queryString Query string of your request.
	 * @param values Values you need to put in your query.
	 * @param options Additional options.  
	 * ---
	 * - `options`.`force`: Uses bruteforce to prevent TypeError's by converting all invalid values to `null`. It's recommended to treat that errors by applying `NOT NULL` option on creating a new key.
	 */
	public parseQueryStringValues(queryString: string, values?: any, options?: { force?: boolean }): any {
		if ([null, undefined].includes(values)) return null
		
		const bruteforce = options?.force === true
		
		const namedPlaceholders = queryString.match(/:[a-z]+/ig) || []
		const [ { parameters: placeholders } ] = identifyQuery(queryString, { dialect: 'mysql' })
		
		const cause = {
			query_string: queryString,
			placeholders: placeholders,
			named_placeholders: namedPlaceholders,
			values
		}
		
		if (placeholders.length === 1) {
			if (Array.isArray(values)) return [ this.processValue(values[0], { json: true }) ]
			else if (![ 'bigint', 'boolean', 'number', 'string' ].includes(typeof values)) return this.processValue(values, { json: true })
			return [ values ]
		}
		if (placeholders.length > 0 && Array.isArray(values)) return values.map(v => this.processValue(v, { json: true }))
		if (namedPlaceholders.length > 0 && isPlainObject(values)) {
			const keys = Object.keys(values)
			return Object.fromEntries(namedPlaceholders.map((k: `:${string}`) => {
				const key = k.slice(1)
				if (!keys.includes(key)) {
					if (bruteforce) return [key, null]
					else throw new Error(`Parameter '${key}' not found on values object.`, { cause })
				}
				return [key, this.processValue(values[key], { json: true })]
			}))
		}

		return null
	}

	public async query(string: string, values?: any, connection?: MySQL.Connection | MySQL.PoolConnection): Promise<[ MySQL.RowDataPacket[] | MySQL.RowDataPacket[][] | MySQL.OkPacket | MySQL.OkPacket[] | MySQL.ResultSetHeader, MySQL.FieldPacket[] ]> {
		const conn: MySQL.Connection | MySQL.PoolConnection = connection ? connection : await this.getConnection()
		const parsedValues = this.parseQueryStringValues(string, values)
		const response = await conn.execute(string, parsedValues)

		if (!connection) (conn as MySQL.PoolConnection).release()

		return response
	}

	public async set(table: string, data: { [key: string]: any }[]): Promise<MySQL.ResultSetHeader[]> {
		/**
		 * [!] Implementation Note
		 * - Add a grouping mapping of the received values to insert that ones with the same structure.
		 */
		const insertQueries = data.map(item => {
			const keys = Object.keys(item).map(k => `\`${k}\``).join(',')
			const values = Object.values(item)
			return this.query(`INSERT INTO \`${table}\` (${keys}) VALUES (${values.map(() => '?').join(',')})`, values)
		})

		const response = await Promise.all(insertQueries)
		const results = response.map(r => r[0] as MySQL.ResultSetHeader)
		return results
	}

	public async get(table: string, keys?: string[], filter?: (target: any) => boolean): Promise<[ MySQL.RowDataPacket[], MySQL.FieldPacket[] ]> {
		const queryString = !keys || keys.length === 0
			? `SELECT * FROM \`${table}\``
			: `SELECT ${keys.map(k => `\`${k}\``).join(', ')} FROM \`${table}\``

		const [ results, fields ] = await this.query(queryString) as [ MySQL.RowDataPacket[], MySQL.FieldPacket[] ]

		if (!filter) return [ results, fields ]
		else {
			const filteredResults = results.filter(v => filter(v))
			return [ filteredResults, fields ]
		}
	}

	public async edit(table: string, data: (data: any) => any, filter?: (target: any) => boolean): Promise<MySQL.ResultSetHeader[]> {
		const [ targets, fields ] = await this.get(table, [], filter)

		const primaryKey: string = fields.find(f => (f.flags & 2) !== 0)?.name
		// Removing PRIMARY KEYS (2) and UNIQUE INDEXES (4) using Bitwise Operator from Fields Flags.
		const uniqueKeys: string[] = fields.filter(f => (f.flags & 4) !== 0).map(f => f.name)

		const updateQueries = targets.map(t => {
			const targetKeys: string[] = Object.keys(t)

			const updatedData = data(new Object(t))
			const editableKeys: string[] = targetKeys.filter(k => ![primaryKey, ...uniqueKeys].includes(k))
			
			const processedEntries: [string, any][] = editableKeys.map(k => [k, this.processValue(updatedData[k], { json: true })])
			const processedItem: { [k: string]: any } = Object.fromEntries(processedEntries)
			
			const valuesString = editableKeys.map(k => `\`${k}\` = :${k}`).join(', ')

			const selectorKeys: string[] = []
			if (typeof primaryKey === 'string') selectorKeys.push(primaryKey)
			else {
				const keys: string[] = uniqueKeys.length > 0 ? uniqueKeys : targetKeys
				selectorKeys.push(...keys)
			}
			const deleteCondition: string = selectorKeys.map(k => `\`${k}\` = :old${k}`).join(' AND ')
			
			const selectorEntries = selectorKeys.map(k => [`old${k}`, t[k]])
			const selectorObject = Object.fromEntries(selectorEntries)
			
			const queryString = `UPDATE \`${table}\` SET ${valuesString} WHERE ${deleteCondition}`
			const values = Object.assign(processedItem, selectorObject)
			
			return this.query(queryString, values)
		})

		const response = await Promise.all(updateQueries)
		const results = response.map(r => r[0] as MySQL.ResultSetHeader)
		return results
	}

	public async delete(table: string, filter?: (target: any) => boolean): Promise<[MySQL.RowDataPacket[], MySQL.ResultSetHeader[]]> {
		await this.awaitValidation()
		const [ targets, fields ] = await this.get(table, [], filter)

		const primaryKey: string = fields.find(f => (f.flags & 2) !== 0)?.name
		// Removing PRIMARY KEYS (2) and UNIQUE INDEXES (4) using Bitwise Operator from Fields Flags.
		const uniqueKeys: string[] = fields.filter(f => (f.flags & 4) !== 0).map(f => f.name)

		const deleteQueries = targets.map(t => {
			const selectorKeys: string[] = []
			if (typeof primaryKey === 'string') selectorKeys.push(primaryKey)
			else {
				const keys: string[] = uniqueKeys.length > 0 ? uniqueKeys : Object.keys(t)
				selectorKeys.push(...keys)
			}

			const deleteCondition: string = selectorKeys.map(k => `\`${k}\` = :${k}`).join(' AND ')

			const entries: [string, any][] = selectorKeys.map(k => [k, t[k]])
			const values: { [k: string]: any } = Object.fromEntries(entries)
			
			return this.query(`DELETE FROM \`${table}\` WHERE ${deleteCondition}`, values)
		})

		const response = await Promise.all(deleteQueries)
		const results = response.map(r => r[0] as MySQL.ResultSetHeader)
		return [ targets, results ]
	}

	
	// Users Management


	public async getUsers(filter?: (user: DatabaseUser) => boolean): Promise<DatabaseUser[]> {
		await this.awaitValidation()
		const [ databaseUsers ] = await this.get('users', [], filter)
		return databaseUsers.map(u => new DatabaseUser(u))
	}
	public async getUser(data: DatabaseUserResolvable): Promise<DatabaseUser | undefined> {
		await this.awaitValidation()
		const userId = String(DatabaseUtils.isIdOnly(data) ? data : data.id)
		const [ user ] = (await this.get('users', [], u => u.id == userId))[0]
		if (!user) return undefined
		return new DatabaseUser(user)
	}
	public async hasUser(data: DatabaseUserResolvable): Promise<boolean> {
		await this.awaitValidation()
		const user = await this.getUser(data)
		if (!user) return false
		return true
	}
	public async addUser(data: DatabaseUserResolvable): Promise<DatabaseUser> {
		await this.awaitValidation()
		const target = await this.getUser(data)
		if (!target) {
			const user = new DatabaseUser(data)
			await this.set('users', [ user ])
			return user
		} else return target
	}
	public async editUser(target: DatabaseUserResolvable, data: DatabaseUserData | MySQL.RowDataPacket | ((oldData: DatabaseUserData | MySQL.RowDataPacket) => DatabaseUserData | MySQL.RowDataPacket)): Promise<DatabaseUser> {
		await this.awaitValidation()
		const targetId = String(DatabaseUtils.isIdOnly(target) ? target : target.id)
		const newData = (oldData: DatabaseUserData | MySQL.RowDataPacket): DatabaseUserData | MySQL.RowDataPacket => typeof data === 'function' ? data(oldData) : data
		await this.edit('users', newData, t => t.id == targetId)
		return await this.getUser(targetId)
	}
	public async deleteUsers(...targets: DatabaseUserResolvable[]): Promise<DatabaseUser[]> {
		await this.awaitValidation()
		const targetsIds = targets.map(t => String(DatabaseUtils.isIdOnly(t) ? t : t.id))
		const [ deleted ] = await this.delete('users', t => targetsIds.includes(String(t.id)))
		return deleted.map(d => new DatabaseUser(d))
	}


	// Guilds Management


	public async getGuilds(filter?: (user: DatabaseUser) => boolean): Promise<DatabaseGuild[]> {
		await this.awaitValidation()
		const [ databaseGuilds ] = await this.get('guilds', [], filter)
		return databaseGuilds.map(u => new DatabaseGuild(u))
	}
	public async getGuild(data: DatabaseGuildResolvable): Promise<DatabaseGuild | undefined> {
		await this.awaitValidation()
		const guildId = String(DatabaseUtils.isIdOnly(data) ? data : data.id)
		const [[ guild ]] = await this.get('guilds', [], g => g.id == guildId)
		if (!guild) return undefined
		return new DatabaseGuild(guild)
	}
	public async hasGuild(data: DatabaseGuildResolvable): Promise<boolean> {
		await this.awaitValidation()
		const target = await this.getGuild(data)
		if (!target) return false
		else return true
	}
	public async addGuild(data: DatabaseGuildResolvable): Promise<DatabaseGuild> {
		await this.awaitValidation()
		const target = await this.getGuild(data)
		if (!target) {
			const guild = new DatabaseGuild(data)
			await this.set('guilds', [ guild ])
			return await this.getGuild(data)
		}
		return target
	}
	public async editGuild(target: DatabaseGuildResolvable, data: DatabaseGuildData | MySQL.RowDataPacket | ((oldData: DatabaseGuildData | MySQL.RowDataPacket) => DatabaseGuildData | MySQL.RowDataPacket)): Promise<DatabaseGuild> {
		await this.awaitValidation()
		const targetId = String(DatabaseUtils.isIdOnly(target) ? target : target.id)
		const newData = (oldData: DatabaseGuildData | MySQL.RowDataPacket): DatabaseGuildData | MySQL.RowDataPacket => typeof data === 'function' ? data(oldData) : data
		await this.edit('users', newData, t => t.id == targetId)
		return await this.getGuild(targetId)
	}
	public async deleteGuilds(...targets: DatabaseGuildResolvable[]): Promise<DatabaseGuild[]> {
		await this.awaitValidation()
		const targetsIds = targets.map(t => String(DatabaseUtils.isIdOnly(t) ? t : t.id))
		const [ deleted ] = await this.delete('guilds', t => targetsIds.includes(String(t.id)))
		return deleted.map(d => new DatabaseGuild(d))
	}


	// Verification Only


	public checked: boolean = false
	private valid: boolean = false
	private awaitValidation(checkedOnly: boolean = true): Promise<boolean> {
		return new Promise(res => {
			const interval = setInterval(() => {
				if (this.valid === true && (checkedOnly === true ? this.checked === true : true)) {
					clearInterval(interval)
					res(true)
				}
			}, 0)
		})
	}

	constructor(connectionUri: MySQL.PoolOptions) {
		this.pool = MySQL.createPool(connectionUri);

		(async () => {
			const connection = await this.pool.getConnection()
			const { host, database, user } = connection.config
			console.log(`[ MySQL ] Successfully connected as '${user}@${host}' in '${database}' database (schema).`)
			
			await this.query('CREATE TABLE IF NOT EXISTS `guilds` (`id` varchar(19) PRIMARY KEY NOT NULL, `settings` JSON, `punishments` JSON)').catch(console.error)
			await this.query('CREATE TABLE IF NOT EXISTS `users` (`id` varchar(19) PRIMARY KEY NOT NULL, `punishments` JSON, `preferencies` JSON)').catch(console.error)
	
			// await this.query('SHOW TABLES').then(async res => {
			// 	const tables = res.results.map(r => Object.values(r)).flat()
			// 	for (const tablename of ['guilds', 'users']) {
			// 		if (tables.includes(tablename)) {
			// 			const table = (await this.query(`DESCRIBE ${tablename}`)).results
			// 			if (tablename === 'guilds') {
			// 				const id = table.find(i => i.Field === 'id') // 
			// 				const settings = table.find(i => i.Field === 'settings')
			// 				const punishments = table.find(i => i.Field === 'punishments')
							
			// 			} else if (tablename === 'users') {
			// 				const id = table.find(i => i.Field === 'id')
			// 				const punishments = table.find(i => i.Field === 'punishments')
			// 				const preferencies = table.find(i => i.Field === 'preferencies')
							
			// 			}
			// 		}
			// 	}
			// }).catch(console.error)
	
			this.valid = true
			console.log(`[ Database ] Database is now available for use. Checking Database Integrity...`)
	
			const guilds = await this.getGuilds()
			for (const guild of guilds) {
				if (!DiscordUtils.Patterns.SnowflakeId.test(guild.id)) throw new Error(`[ Database ] Invalid database ID '${guild.id}'`)
				if (!Array.isArray(guild.punishments)) guild.punishments = []
				else for (const punishment of guild.punishments) {
					if (!DiscordUtils.Patterns.SnowflakeId.test(punishment.authorId)) throw new Error(`[ Database ] Invalid punishment 'authorId' value (${punishment.authorId}) in '${guild.id}'`)
					if (!DiscordUtils.Patterns.SnowflakeId.test(punishment.userId)) throw new Error(`[ Database ] Invalid punishment 'userId' value (${punishment.userId}) in '${guild.id}'`)
					if (!isNaN(punishment.timestamp) || !Number.isSafeInteger(punishment.timestamp)) throw new Error(`[ Database ] Invalid punishment 'timestamp' (${punishment.timestamp}) in '${guild.id}'`)
					if (!['ban', 'kick', 'mute'].includes(punishment.type)) throw new Error(`[ Database ] Punishment type '${punishment.type}' for '${guild.id}' doesn't match the choices: 'ban', 'kick' or 'mute'`)
				}
				if (!Array.isArray(guild.settings)) guild.settings = []
				else for (const setting of guild.settings) {
					if (!DiscordUtils.Patterns.SnowflakeId.test(setting.id)) throw new Error(`[ Database ] Invalid setting 'id' value (${setting.id}) in '${guild.id}'`)
					for (const name of [setting.name, ...Object.values(setting.nameLocalizations)]) if (!checkName(name)) throw new Error(`[ Database ] Invalid setting name '${name}' in '${guild.id}'`)
					if (!['channel', 'role'].includes(setting.type)) throw new Error(`[ Database ] Invalid setting 'type' value (${setting.type}) in '${guild.id}'`)
					function checkName(name: string): boolean {
						return typeof name === 'string' && name.trim().length > 0
					}
				}
	
				await this.editGuild(guild, guild.toJSON())
			}
	
			this.checked = true
			console.log(`[ Database ] Database Integrity Check complete.`)
		})()
	}
}
