export {};
declare global {
	interface Array<T> {
		uniques(): T[];
	}
	interface Date {
		format(replacer: string): string;
	}

	interface RandomNumberOptions {
		decimalsOnly?: boolean;
	}
	interface NumberConstructor {
		random(min?: number, max?: number, options?: RandomNumberOptions): number;
	}
	interface Number {
		resize(length: number, locales?: Intl.LocalesArgument, options?: Intl.NumberFormatOptions): string;
	}

	interface StringResizerOptions {
		/** Whether you want to add ellipsis (`...`) on the end of your String. (default `true`) */
		ellipsis: boolean;
	}
	interface String {
		resize(maxLength: number, options?: StringResizerOptions): string;
	}

	interface Math {
		factorial(x: number): number;
	}
}
