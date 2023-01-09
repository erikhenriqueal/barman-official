import Discord from 'discord.js';
import { DiscordUtils } from '../utils';
import Event from '../classes/Event';
import InputCommandBuilder from '../classes/InputCommand';
import MessageCommandBuilder from '../classes/MessageCommand';
import UserCommandBuilder from '../classes/UserCommand';

export default new Event('ready', __filename, async (client) => {
	console.log(`[ Discord.Js ] Logged in as '${client.user.tag}'`);
	switchActivity(0, true);

	const rest = new Discord.REST({ version: '10' }).setToken(client.token);

	/**
	 * Cleaning up commands
	 */

	await rest.put(Discord.Routes.applicationCommands(client.application.id), { body: [] });

	const clientGuilds = await DiscordUtils.Cache.cacheGuilds(client);
	for (const guild of clientGuilds.values()) await rest.put(Discord.Routes.applicationGuildCommands(client.application.id, guild.id), { body: [] });

	/**
	 * Uploading new commands
	 */

	const commands = [...InputCommandBuilder.cache, ...MessageCommandBuilder.cache, ...UserCommandBuilder.cache];
	const globalCommands = commands.filter(c => c.guilds.length === 0);
	await rest.put(Discord.Routes.applicationCommands(client.application.id), { body: globalCommands.map((c) => c.toJSON()) });

	const guildedCommands = commands.filter(c => !globalCommands.includes(c));
	const guilds = commands.map(c => c.guilds).flat().uniques();
	for (const id of guilds) {
		await rest.put(Discord.Routes.applicationGuildCommands(client.application.id, id), { body: [] });
		const guildCommands = guildedCommands.filter(c => c.guilds.includes(id));
		await rest.put(Discord.Routes.applicationGuildCommands(client.application.id, id), { body: guildCommands.map((c) => c.toJSON()) });
	}
	

	await DiscordUtils.Cache.cacheClientCommands(client);

	console.log(`[ Discord.Js ] ${client.application.commands.cache.size} commands is now working.`);

	function switchActivity(index: number, firstTime?: boolean): Promise<void> {
		const activities: (Discord.ActivitiesOptions & { duration: number, once?: true; })[] = [
			{ type: Discord.ActivityType.Playing, name: 'Online novamente!', duration: 10, once: true },
			{ type: Discord.ActivityType.Listening, name: 'Bot oficial da Rede ButecoGamer!', duration: 15 },
			{ type: Discord.ActivityType.Listening, name: `@${client.user.username}`, duration: 15 },
			{ type: Discord.ActivityType.Playing, name: 'Utilize /help para saber o que eu posso fazer.', duration: 15 }
		];

		index = !index || index > activities.length - 1 ? 0 : index;

		const activity = activities[index];
		if (activity.once === true && firstTime !== true) return switchActivity(index + 1);

		client.user.setActivity(activity);
		setTimeout(() => switchActivity(index + 1), activity.duration * 1000);
	}
}, true);
