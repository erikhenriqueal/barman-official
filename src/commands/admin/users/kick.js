module.exports = {
	status: "private",
	name: "expulsar",
	aliases: ["kick"],
	description: "Peça com gentileza para que um membro forçadamente se retire de nosso servidor, com (ainda) possibilidade de retorno futuramente.",
	uses: [ "<usuário> <motivo> | O parâmetro usuário ode ser uma menção, uma tag ou um ID relativo ao alvo da expulsão. O motivo é opcional, mas recomenda-se adicionar para evitar futuros problemas com a administração." ],
	args: true,
	whitelist: [ "KICK_MEMBERS" ],
	async execute({ message, args }) {
		const { resolve } = require("path");
		const { send, reply, edit, deleteMessage, guild, embed, log, userAvatar } = global;
		const { color_red, color_blue, color_green } = global.embedDefaults;
		const target = args[0];
		const targetType = /\d{17,19}/.test(target) ? "id" : /.+#\d{4}/.test(target) ? "tag" : /<@[!]?\d{17,19}>/.test(target) ? "mention" : null;
		if (!targetType) return await deleteMessage(await reply(message, { embeds: [ embed({
			color: color_red,
			title: "❌ Usuário inválido!",
			description: `<@${message.author.id}>, o usuário definido é inválido. Você deve **mencionar** (@usuário) ou citar a **tag** ou **ID numérico** do respectivo usuário à ser expulso.\n• Valor recebido: \`${target}\``
		})]}), 15000);
		let msg = await reply(message, { embeds: [ embed({
			color: color_blue,
			title: "💥 Expulsar usuário - Buscando membros",
			description: `<@${message.author.id}>, estou fazendo uma busca pelos membros do servidor para encontrar o usuário solicitado. Este processo deve demorar mais nas primeiras vezes após a reinicialização do sistema.`
		})]});

		await cacheMembers();

		msg = await edit(msg, { embeds: [ embed({
			color: color_blue,
			title: "💥 Expulsar usuário - Busca finalizada",
			description: `<@${message.author.id}>, já sei de todos os membros da rede, agora vou buscar pelo usuário que pediu, um segundo...`
		})]});

		const members = guild.members.cache;
		const member = members.find(m => target.includes(m.id) || target === m.user.tag)
		if (!member) return await edit(msg, { embeds: [ embed({
			color: color_red,
			title: "❌ Usuário não encontrado!",
			description: `<@${message.author.id}>, não encontrei usuários com essas credenciais em nosso servidor. Verifique-as e tente novamente.`
		})]});

		if (message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0) return await edit(msg, { embeds: [ embed({
			color: color_red,
			title: "❌ Permissões insuficientes",
			description: `<@${message.author.id}>, você só pode expulsar membros com cargos inferiores ao seu.`
		})]});

		msg = await edit(msg, { embeds: [ embed({
			color: color_blue,
			title: "💥 Expulsar usuário - Confirmação",
			description: `<@${message.author.id}>, você está prestes à **expulsar** <@${member.id}>, quer confirmar a expulsão?`
		})]});

		const collector = msg.createReactionCollector({ filter: (r, u) => ["✅", "❌"].includes(r.emoji.name) && u.id == message.author.id, idle: 3e4 });
		collector.on("collect", async reaction => {
			if (reaction.emoji.name === "❌") return collector.stop();
			await msg.reactions.removeAll().catch(() => null);
			const reason = args[1] ? args.slice(1).join(" ") : "Não definido.";
			return member.kick(reason).then(async () => {
				await client.emit("memberPunished", member, message.author, { type: "kick", reason });
				return await deleteMessage(await edit(msg, { embeds: [ embed({
					color: color_green,
					title: `✅ ${member.user.username} foi expulso por ${message.author.username}`,
					description: `<@${message.author.id}>, você expulsou ${member.user.tag}. Lembre-se, a expulsão apenas pune temporariamente um usuário, caso não queira alguém no Servidor por um tempo determinado ou indeterminado utilize o comando **banir**.`
				})]}), 15e3);
			}).catch(async error => {
				const noPermsErr = String(error).toLowerCase().includes("missing permissions");
				deleteMessage(await edit(msg, { embeds: [ embed({
					color: color_red,
					title: `❌ ${member.user.username} não pôde ser expulso`,
					description: `<@${message.author.id}>, não pude expulsar <@${member.user.id}>${noPermsErr ? " pois não tenho permissões o suficiente para executar esta ação. Caso queira forçar a expulsão, você pode colocar meu cargo acima dos outros para que este problema não venha a acontecer futuramente." : `.\n• Nota: eu não esperava este erro, então recomendo que verifique o canal de Registros (<#${process.env.LOGS_CHANNEL}>) da nossa Equipe para checar o que aconteceu, e se não souber o que pode ser, contate meu desenvolvedor.`}`
				})]}), 15e3);
				if (noPermsErr) return;
				if (guild.channels.cache.has(process.env.LOGS_CHANNEL)) await send(guild.channels.cache.get(process.env.LOGS_CHANNEL), { embeds: [ embed({
					color: color_red,
					author: { name: `Por ${message.author.tag} (${message.author.id})`, image: userAvatar(message.author) },
					title: `💥 Não foi possível expulsar ${member.user.username}`,
					description: `Recebi este erro ao tentar expulsar ${member.user.tag} (${member.id}):\n${error}`
				})]});
				await log(resolve(process.cwd(), "src/internalLogs/commands", `kick_${message.author.id}_${Date.now()}.log`), `Author: ${message.author.id}\nTarget: ${member.id}\nDate: ${new Date().toLocaleDateString()} - ${new Date().toLocaleTimeString()}\nError: ${error}`, true);
			});
		});
		collector.on("end", async () => {
			await msg.reactions.removeAll().catch(() => null);
			await deleteMessage(await edit(msg, { embeds: [ embed({
				color: color_blue,
				title: `❌ ${member.user.username} não foi expulso`,
				description: `<@${message.author.id}>, como você não confirmou a expulsão, <@${member.id}> continua no Servidor. Se mudar de ideia utilize o comando novamente e confirme utilizando ✅.`
			})]}), 15e3);
		});

		await msg.react("✅");
		await msg.react("❌");

		async function cacheMembers() {
			const members = await guild.members.fetch({ force: true });
			console.log(members.size);
			if (members.size > 0 && members.size !== guild.memberCount) return await cacheMembers();
		};
	}
};