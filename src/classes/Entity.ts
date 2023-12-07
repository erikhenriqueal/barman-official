import cp from 'child_process'
import log from '../utils/log'

export interface EntityConstructorData {
	label: string
	command: string
	cwd?: string | URL
	env?: NodeJS.ProcessEnv
}
export interface EntityConstructorOptions {
	killSignal?: any
}

export default class Entity {
	static cache: Entity[] = []
	public label: string
	public subprocess: cp.ChildProcess
	public killSignal: any = null

	constructor(data: EntityConstructorData, options?: EntityConstructorOptions) {
		if (Entity.cache.some(e => e.label === data.label)) throw new Error(`[ Entity ] Duplicated label '${data.label}'.`)

		// const commandArgs = data.command.split(' ')
		// const command = commandArgs.shift()
		// const args = commandArgs
		// console.log({command, args})

		this.subprocess = cp.exec(data.command, { cwd: data.cwd || process.cwd(), env: data.env || process.env })
		// this.subprocess = cp.spawn(command, args, { cwd: process.cwd(), env: process.env })

		this.subprocess.on('spawn', () => log(`[ Entity - ${data.label} ] Child Process sucessfully executed command '${data.command}' in PID '${this.subprocess.pid}'`, true))
		this.subprocess.on('close', (code, signal) => log(`[ Entity - ${data.label} ] Process closed.`))
		this.subprocess.on('disconnect', () => log(`[ Entity - ${data.label} ] Process disconnected.`))
		this.subprocess.on('error', err => log({ message: displayText(`Received an Error:\n${err}`), type: 'error' }, true))
		this.subprocess.on('exit', (code, signal) => log(`[ Entity - ${data.label} ] Application exited with code ${code} (signal: ${signal})`))
		
		this.subprocess.stdout.on('data', chunk => log(displayText(parseChunk(chunk)), true))
		// this.subprocess.stdout.on('close', () => log(`[ Entity - ${data.label} ] 'stdout' closed.`))
		// this.subprocess.stdout.on('end', () => log(`[ Entity - ${data.label} ] 'stdout' ended.`))
		// this.subprocess.stdout.on('error', err => log({ message: displayText(`Received an 'stdout' Error:\n${err}`), type: 'error' }, true))
		// this.subprocess.stdout.on('pause', () => debug(`[ Entity - ${data.label} ] 'stdout' paused.`))
		// this.subprocess.stdout.on('readable', () => debug(`[ Entity - ${data.label} ] 'stdout' is readable.`))
		// this.subprocess.stdout.on('resume', () => debug(`[ Entity - ${data.label} ] 'stdout' resumed.`))
		
		this.subprocess.stderr.on('data', chunk => log(displayText(parseChunk(chunk)), true))
		// this.subprocess.stderr.on('close', () => log(`[ Entity - ${data.label} ] 'stderr' closed.`))
		// this.subprocess.stderr.on('end', () => log(`[ Entity - ${data.label} ] 'stderr' ended.`,))
		// this.subprocess.stderr.on('error', err => log({ message: displayText(`Received an 'stderr' Error:\n${err}`), type: 'error' }, true))
		// this.subprocess.stderr.on('pause', () => debug(`[ Entity - ${data.label} ] 'stderr' paused.`))
		// this.subprocess.stderr.on('readable', () => debug(`[ Entity - ${data.label} ] 'stderr' is readable.`))
		// this.subprocess.stderr.on('resume', () => debug(`[ Entity - ${data.label} ] 'stderr' resumed.`))

		Entity.cache.push(this)

		function displayText(message: any): string {
			return String(message).split('\n').map(r => `[ Entity - ${data.label} ] ${r}`).join('\n')
		}

		function parseChunk(chunk: any): string {
			return String(chunk).trim()
		}
	}
}
