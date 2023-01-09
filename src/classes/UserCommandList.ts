import UserCommand from './UserCommand';
import CommandList from './CommandList';

export default class UserCommandList extends CommandList<UserCommand> {
	constructor(...items: UserCommand[]) {
		super({ finder: (id, command) => command.name === id || Object.values(command.name_localizations).includes(id) }, ...items);
	}
}
