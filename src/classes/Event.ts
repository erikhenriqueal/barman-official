import Discord from 'discord.js'
import log from '../utils/log'
import { client } from '../client/index'

export type Events = Discord.ClientEvents
export type EventListener<K extends keyof Events> = (...args: Events[K]) => Discord.Awaitable<any>

export default class Event<K extends keyof Events> {
	public name: K
	public path: string
	public once: boolean
	public listener: EventListener<K>

	constructor(name: K, path: string, listener: EventListener<K>, once: boolean = false) {
		console.log(`[ Event - ${name} ] Initializing event...`)
		this.name = name
		this.path = path
		this.once = once
		this.listener = (...args: Events[K]) => {
			try {
				return listener(...args)
			} catch (error) {
				log({ message: `[ Event - ${this.name} ] Received an error on event's execution: ${error}`, type: 'error' }, true)
			}
		}
		if (this.once) client.once(this.name, this.listener)
		else client.on(this.name, this.listener)
	}
}
