import { join } from 'path'
import log from './log'

export default function debug(data: string, ...args: any[]): void {
	if (process.env.DEBUGGING !== 'true') return void 0
	const parsedArgs = args.length > 0 ? stringifyObject(args) : ''
	const message = `${data} ${parsedArgs}`.split('\n').map(r => `[ DEBUG ] ${r}`.trim()).join('\n').trim()
	console.log(message.length > 128 ? `${message.slice(0, 127)}... (see debug logs for more)` : message)
	log({
		message: [data, parsedArgs].join(' ').split('\n').map(r => `[ DEBUG ] ${r}`.trim()).join('\n').trim(),
		paths: [ join(process.cwd(), 'logs/debug') ]
	})

}

export function stringifyObject(o: any): string {
	if (Array.isArray(o)) return `[ ${o.map(v => stringifyObject(v)).join(', ')} ]`
	else if (o && typeof o === 'object') {
		const ks = Object.keys(o)
		const vs = Object.values(o)
		return `{ ${ks.map((k, i) => `${k}: ${stringifyObject(vs[i])}`).join(', ')} }`
	} else return String(o)
}
