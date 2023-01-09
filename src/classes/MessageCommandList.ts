import MessageCommand from './MessageCommand';
import CommandList from './CommandList';

export default class MessageCommandList extends CommandList<MessageCommand> {
	constructor(...items: MessageCommand[]) {
		super({ finder: (id, command) => command.name === id || Object.values(command.name_localizations).includes(id) }, ...items);
	}
}
