export function stringify(item: any): string {
	return JSON.stringify(item, (k, value) => {
		if (typeof value === 'string') return encodeURI(value)
		else return value
	})
}

export function parse(item: string): any {
	return JSON.parse(item, (k, value) => {
		if (typeof value === 'string') return decodeURI(value)
		else return value
	})
}

export function isIdOnly(T: any): T is string | number {
	if (['string', 'number'].includes(typeof T)) return true
	return false
}
