import dotenv from 'dotenv'
dotenv.config()

import Entity from './classes/Entity'
import { join, extname } from 'path'
import { existsSync, statSync } from 'fs'
import { debug } from './utils'

debug('Debugging mode is active.')

const ext = extname(__filename)
const clientPath = join(__dirname, `client/index${ext}`)

debug(`Working with '${ext}' extension`)

if (!existsSync(clientPath)) throw new Error(`File '${clientPath}' doesn't exists.`)
if (!statSync(clientPath).isFile()) throw new Error(`File '${clientPath}' is not recognized as a valid file.`)

const command = extname(__filename) === '.ts' ? `tsnd "${clientPath}"` : `node "${clientPath}"`

export const main = new Entity({
	label: 'main',
	command
})
