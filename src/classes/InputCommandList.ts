import InputCommandBuilder from './InputCommand'
import CommandList from './CommandList'

export default class InputCommandList extends CommandList<InputCommandBuilder> {
  constructor(...items: InputCommandBuilder[]) {
		super({ finder: (id, command) =>  command.name === id || Object.values(command.name_localizations).includes(id) }, ...items)
	}
}
