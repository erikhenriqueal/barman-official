export interface CommandListConstructorData<T> {
	finder: (id: string, item: T) => boolean;
}

export default class CommandList<T> extends Array<T> {
	private finder: (id: string, item: T) => boolean;
	public get(id: string) {
		return this.find((item) => this.finder(id, item));
	}

	protected constructor(data: CommandListConstructorData<T>, ...items: T[]) {
		super(...items);
		this.finder = data.finder;
	}
}
