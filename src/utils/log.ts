import '../global';
import { join, normalize, parse } from 'path';
import fs from 'fs';

export default function log(options: string | { paths: string[], message: string, timestamp: number }, print: boolean = false, printDate: boolean = false): void {
	const date = new Date(typeof options === 'string' || !options.timestamp ? Date.now() : options.timestamp);
	const rawMessage = typeof options === 'string' ? options : options.message;
	const message = rawMessage.split('\n').map((ln) => `[ ${date.format('d/mon/y, h:min:s.ms')} ] ${ln}`).join('\n');
	const paths = [ join(process.cwd(), 'logs'), ...(typeof options === 'string' ? [] : options.paths || []) ].map(p => normalize(p)).uniques();
	if (print) {
		if (printDate) console.log(message);
		else console.log(rawMessage);
	}
	for (let path of paths) {
		let pathInfo = parse(path);
		const pathType = (fs.existsSync(path) && fs.statSync(path).isDirectory()) || pathInfo.ext.length === 0 ? 'dir' : 'file';
		if (!fs.existsSync(path) || pathType === 'dir') {
			if (pathType === 'dir') fs.mkdirSync(normalize(path), { recursive: true });
			else fs.mkdirSync(normalize(pathInfo.dir), { recursive: true });
			let filePath = pathType === 'file' ? path : join(path, `autolog_${new Date().format('y-mon-d')}.txt`);
			path = filePath;
		}
		const fileContent = fs.existsSync(path) ? fs.readFileSync(path, { encoding: 'utf-8' }) : '';
		fs.writeFileSync(path, `${fileContent.trim()}\n${message.trim()}`.trim());
	}
}
