import { readdirSync } from 'fs'
import { join, basename } from 'path'
import { Awaitable } from 'discord.js'
import { DiscordUtils } from '../../utils'

export interface DevCommandExecuteOptions {
	message: DiscordUtils.MessageInteraction<boolean>
	args: string[]
	commandName: string
	command: DevCommand
}
export interface DevCommand {
	name: string
	developerOnly?: boolean
	execute(options: DevCommandExecuteOptions): Awaitable<any>
}

export class DevCommandList extends Array<DevCommand> {
	public get(name: string): DevCommand | null {
		return this.find(dc => dc.name.toLowerCase().trim() === name.toLowerCase().trim())
	}
	public has(name: string): boolean {
		return this.some(dc => dc.name.toLowerCase().trim() === name.toLowerCase().trim())
	}
}

const commands: DevCommandList = new DevCommandList()

const devCommands = readdirSync(__dirname, { encoding: 'utf-8' }).filter(f => f !== basename(__filename))
for (const filename of devCommands) {
	const commandPath = join(__dirname, filename)
	const commandFile = require(commandPath)
	const command: DevCommand = validateCommand(commandFile) ? commandFile : validateCommand(commandFile.default) ? commandFile.default : undefined
	if (!validateCommand(command)) throw new Error(`[ DevCommands ] Object is not a valid command (at '${filename}').`)
	if (commands.has(command.name)) throw new Error(`[ DevCommands ] Duplicated command '${command.name}'.`)
	commands.push(command)
}

export { commands }

export function validateCommand(command: any): boolean {
	// console.log(command)
	// console.log(typeof command != 'object', Array.isArray(command), typeof command.name != 'string', command.name.trim().length === 0, typeof command.execute != 'function')
	if (!command || typeof command != 'object' || Array.isArray(command)) return false
	if (typeof command.name != 'string' || command.name.trim().length === 0) return false
	if (typeof command.execute != 'function') return false
	return true
}
