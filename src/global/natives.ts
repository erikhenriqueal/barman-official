import './types';

Array.prototype.uniques = function uniques<T>(this: T[]) {
	let uniques: T[] = [];
	for (const item of this) if (!uniques.includes(item)) uniques.push(item);
	return uniques;
}

Number.random = function random(this: number, min: number, max: number, options?: RandomNumberOptions): number {
	const x = min < max ? min : max;
	const y = max > min ? max : min;
	const z = Math.random() * (y - x) + x;

	if (options?.decimalsOnly === true) return Number((z % 1).toPrecision(21).slice(2));
	return z;
}

Number.prototype.resize = function resize(
	this: number,
	length: number,
	locales?: Intl.LocalesArgument,
	options?: Intl.NumberFormatOptions
) {
	const numberLength = `${parseInt(`${this}`)}`.length;
	if (numberLength > length) return this.toLocaleString(locales, options);
	return `${'0'.repeat(length - numberLength)}${this}`;
}

Date.prototype.format = function format(this: Date, replacer: string) {
	return replacer.replace(/d|mon|y|h|min|s|ms|gmt/gi, (str) => {
		switch (str.toLowerCase()) {
			case 'd':
				return `${this.getDate().resize(2)}`;
			case 'mon':
				return `${(this.getMonth() + 1).resize(2)}`;
			case 'y':
				return `${this.getFullYear()}`;
			case 'h':
				return `${this.getHours().resize(2)}`;
			case 'min':
				return `${this.getMinutes().resize(2)}`;
			case 's':
				return `${this.getSeconds().resize(2)}`;
			case 'ms':
				return `${this.getMilliseconds().resize(3)}`;
			case 'gmt':
				return `GMT${(this.getHours() - this.getUTCHours()).resize(2)}`;
			default:
				return '';
		}
	});
}

String.prototype.resize = function resize(this: string, maxLength, options): string {
	const e: boolean = maxLength >= this.length && options?.ellipsis ? false : true;
	return `${this.slice(0, e ? maxLength - 3 : maxLength)}${e ? '...' : ''}`;
}

Math.factorial = function factorial(this: string, x: number) {
	if (!Number.isSafeInteger(x)) return NaN;
	let a = 1;
	for (let b = 1; b <= x; b++) a = a * b;
	return a;
}
