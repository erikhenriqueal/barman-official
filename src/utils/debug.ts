import { join } from 'path'
import log from './log'

export default function debug(data: string, ...args: any[]): void {
	if (process.env.DEBUGGING !== 'true') return void 0
	console.log(`[ DEBUG ] ${data}`, ...args)
	log({
		message: [data, ...args].join('\n').split('\n').map(r => `[ DEBUG ] ${r}`).join('\n'),
		paths: [ join(process.cwd(), 'debug') ]
	})
}
