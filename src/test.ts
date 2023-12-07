const startTimestamp = Date.now()

import MySQL from 'mysql2/promise'

const pool: MySQL.Pool = MySQL.createPool({
  host: 'localhost',
  user: 'username',
  password: 'password',
  database: 'database_name'
})

async function query(string: string, values?: any, connection?: MySQL.Connection | MySQL.PoolConnection): Promise<{ results: MySQL.RowDataPacket[] | MySQL.RowDataPacket[][] | MySQL.OkPacket | MySQL.OkPacket[] | MySQL.ResultSetHeader, fields?: MySQL.FieldPacket[] }> {
	return new Promise(async (res, rej) => {
		console.log(`Querying '${string}'...`)

		const conn = connection ? connection : await pool.getConnection()
		conn.execute(string, values).then(result => res({ results: result[0], fields: result[1] })).catch(error => {
			console.error(`MySQL Query Error:`, error)
			rej(error)
		})

		if (!connection) (conn as MySQL.PoolConnection).release()
	})
}

async function get(table: string, keys?: string[], filter?: (target: any) => boolean): Promise<any[]> {
	return new Promise(async (res, rej) => {
		console.log('Trying to get data:', { table, keys, filter })

		if (!keys || keys.length === 0) callback(() => query(`SELECT * FROM \`${table}\``))
		else callback(() => query(`SELECT ${keys.map(k => `\`${k}\``).join(', ')} FROM \`${table}\``))

		function callback(fn: () => Promise<{ results: any; fields?: MySQL.FieldPacket[] }>): void {
			fn().then(response => {
				if (!filter) {
					console.log('Getted results:', response.results)
					return res(response.results)
				} else {
					const filtered = response.results.filter(i => filter(i))
					console.log('Getted results:', { raw: response.results, filtered })
					return res(filtered)
				}
			}).catch(error => {
				console.error('MySQL \'get\' Error:', error)
				return rej(error)
			})
		}
	})
}

async function edit(table: string, filter: (target: any) => boolean, data: (data: any) => any): Promise<any[]> {
	return new Promise(async (res, rej) => {
		console.log(`Trying to edit database '${table}' table...`)

		const items = await get(table, [], filter)
		console.log('Filtered Database items to edit:', items)
		if (items.length === 0) return res([])

		for (let results = [], i = 0; i < items.length; i++) {
			const item = items[i]
			const dataKeys = Object.keys(item)
			const dataValues = Object.values(item)
			const newData = Object.assign(item, data(item))
			const newDataKeys = Object.keys(newData)
			const newDataValues = Object.values(newData)
			
			query(
				`UPDATE \`${table}\` SET ${newDataKeys.map(e => `\`${e[0]}\`=?`).join(', ')} WHERE ${dataKeys.map(e => `\`${e[0]}\`=?`).join(' AND ')}`,
				[
					...newDataValues,
					...dataValues
				]
			).then(() => {
				results.push(newData)
				if (i === items.length - 1) {
					console.log('Database editing finished:', { old_data: items, new_data: results })
					return res(results)
				}
			}).catch(error => {
				console.error('MySQL \'edit\' Error:', error)
				rej(error)
			})
		}
	})
}

(async () => {
	const connection = await pool.getConnection()

	await query('CREATE TABLE `users` (`id` INT PRIMARY KEY AUTO_INCREMENT, `name` VARCHAR(255), `email` VARCHAR(255), `preferences` JSON)', null, connection)
	await query(
		'INSERT INTO \`users\` (`name`, `email`, `preferences`) VALUES (?, ?, ?), (`name`, `email`, `preferences`) VALUES (?, ?, ?), (`name`, `email`, `preferences`) VALUES (?, ?, ?)',
		[
			'Jhon Doe', 'jhon@example.com', { lang: 'pt-BR', theme: 'default' },
			'Jane Doe', 'jane@example.com', { lang: 'en-US', theme: 'default' },
			'Bob Smith', 'bob@example.com', { lang: 'es-ES', theme: 'default' }
		],
		connection
	)

	await query('SELECT * FROM `users`').then(console.log)

})().catch(err => console.error(err)).finally(() => console.log(`Done in ${(Date.now() - startTimestamp).toLocaleString('en-US', { maximumFractionDigits: 2 })}`))
