module.exports = {
    status: "private",
    name: "banir",
    aliases: ["ban"],
    description: "Mande um individuo para Nárnea!",
    uses: [
        "<usuário> <motivo> <duração> | O parâmetro usuário pode ser uma menção, uma tag ou um ID relativo ao alvo da expulsão. O motivo é opcional, mas recomenda-se adicionar para evitar futuros problemas com a administração. A duração deve ser um valor numérico seguido de uma unidade de medida de tempo (min, h ou d), caso vazio ou inválido, a duração será eterna."
    ],
    args: true,
    whitelist: [ "BAN_MEMBERS" ],
    async execute({ message, args }) {
        const { resolve } = require("path");
        const { send, reply, edit, deleteMessage, guild, embed, log, userAvatar, timeToString } = global;
        const { color_red, color_blue, color_green } = global.embedDefaults;
        const target = args[0];
        const targetType = /\d{17,19}/.test(target) ? "id" : /.+#\d{4}/.test(target) ? "tag" : /<@[!]?\d{17,19}>/.test(target) ? "mention" : null;
        if (!targetType) return await deleteMessage(await reply(message, { embeds: [ embed({
            color: color_red,
            title: "❌ Usuário inválido!",
            description: `<@${message.author.id}>, o usuário definido é inválido. Você deve **mencionar** (@usuário) ou citar a **tag** ou **ID numérico** do respectivo usuário à ser banido.\n• Valor recebido: \`${target}\``
        })]}), 15000);
        let msg = await reply(message, { embeds: [ embed({
            color: color_blue,
            title: "🔒 Banir usuário - Buscando membros",
            description: `<@${message.author.id}>, estou fazendo uma busca pelos membros do servidor para encontrar o usuário solicitado. Este processo deve demorar mais nas primeiras vezes após a reinicialização do sistema.`
        })]});

        await cacheMembers();

        msg = await edit(msg, { embeds: [ embed({
            color: color_blue,
            title: "🔒 Banir usuário - Busca finalizada",
            description: `<@${message.author.id}>, já sei de todos os membros da rede, agora vou buscar pelo usuário que pediu, um segundo...`
        })]});

        const members = guild.members.cache;
        const member = members.find(m => target.includes(m.id) || target === m.user.tag)
        if (!member) return deleteMessage(await edit(msg, { embeds: [ embed({
            color: color_red,
            title: "❌ Usuário não encontrado!",
            description: `<@${message.author.id}>, não encontrei usuários com essas credenciais em nosso servidor. Verifique-as e tente novamente.`
        })]}), 15e3);

        if (message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0) return await deleteMessage(await edit(msg, { embeds: [ embed({
            color: color_red,
            title: "❌ Permissões insuficientes",
            description: `<@${message.author.id}>, você só pode banir membros com cargos inferiores ao seu.`
        })]}), 15e3);
        
        let duration = String(args.reverse()[0].toLowerCase());
        if (!/[\d]+(?:min|[hdm])/.test(duration)) duration = 0;
        else {
            args.pop();
            const nums = duration.match(/\d+/);
            const unity = duration.match(/[mhd]|ms|min/i);
            if (!nums || !unity || !Number.isInteger(Number(nums[0]))) return await deleteMessage(await edit(msg, { embeds: [ embed({
                color: color_red,
                title: "❌ Duração Incompatível",
                description: `<@${message.author.id}>, a duração deve ser um valor **númerico inteiro** seguido de uma unidade como: **Min** (minutos), **H** (horas) ou **D** (dias).`
            })]}), 15000);
            if (["m", "min"].includes(unity[0].toLowerCase())) duration = parseInt(nums[0]) * 1000 * 60;
            else if (unity[0].toLowerCase() == "h") duration = parseInt(nums[0]) * 1000 * 60 * 60;
            else if (unity[0].toLowerCase() == "d") duration = parseInt(nums[0]) * 1000 * 60 * 60 * 24;
        };

        msg = await edit(msg, { embeds: [ embed({
            color: color_blue,
            title: "🔒 Banir usuário - Confirmação",
            description: `<@${message.author.id}>, você está prestes à **banir** <@${member.id}> ${duration === 0 ? "**para sempre**" : `por **${timeToString(duration, 0)}**`}, deseja continuar?`
        })]});

        const collector = msg.createReactionCollector({ filter: (r, u) => ["✅", "❌"].includes(r.emoji.name) && u.id == message.author.id, idle: 3e4 });
        collector.on("collect", async reaction => {
            if (reaction.emoji.name === "❌") return collector.stop();
            await msg.reactions.removeAll().catch(() => null);
            const reason = args[1] ? args.slice(1).join(" ") : "Não definido";
            return member.ban({ reason }).then(async () => {
                await client.emit("memberPunished", member, message.author, { type: "ban", reason, duration });
                return await deleteMessage(await edit(msg, { embeds: [ embed({
                    color: color_green,
                    title: `✅ ${member.user.username} foi banido por ${message.author.username}`,
                    description: `<@${message.author.id}>, você baniu **${member.user.tag}** (${member.id})${reason != "Não definido" ? ` por "${reason}"` : ""} durante **${duration === 0 ? "tempo indeterminado" : timeToString(duration, 0)}**.`
                })]}), 15e3);
            }).catch(async error => {
                const noPermsErr = String(error).toLowerCase().includes("missing permissions");
                deleteMessage(await edit(msg, { embeds: [ embed({
                    color: color_red,
                    title: `❌ ${member.user.username} não pôde ser banido`,
                    description: `<@${message.author.id}>, não pude banir <@${member.user.id}>${noPermsErr ? " pois não tenho permissões o suficiente para isto. Caso queira forçar o banimento, você pode colocar meu cargo acima dos outros para que este problema não venha a acontecer futuramente." : `.\n• Nota: eu não esperava este erro, então recomendo que verifique o canal de Registros (<#${process.env.LOGS_CHANNEL}>) da nossa Equipe para checar o que aconteceu, e se não souber o que pode ser, contate meu desenvolvedor.`}`
                })]}), 15e3);
                if (noPermsErr) return;
                if (guild.channels.cache.has(process.env.LOGS_CHANNEL)) await send(guild.channels.cache.get(process.env.LOGS_CHANNEL), { embeds: [ embed({
                    color: color_red,
                    author: { name: `Por ${message.author.tag} (${message.author.id})`, image: userAvatar(message.author) },
                    title: `💥 Não foi possível banir ${member.user.username}`,
                    description: `Recebi este erro ao tentar banir ${member.user.tag} (${member.id}):\n${error}`
                })]});
                await log(resolve(process.cwd(), "src/internalLogs/commands", `ban_${message.author.id}_${Date.now()}.log`), `Author: ${message.author.id}\nTarget: ${member.id}\nDate: ${new Date().toLocaleDateString()} - ${new Date().toLocaleTimeString()}\nError: ${error}`, true);
            });
        });
        collector.on("end", async () => {
            await msg.reactions.removeAll().catch(() => null);
            await deleteMessage(await edit(msg, { embeds: [ embed({
                color: color_blue,
                title: `❌ ${member.user.username} não foi banido`,
                description: `<@${message.author.id}>, como você não confirmou o banimento, <@${member.id}> continua no Servidor. Se mudar de ideia utilize o comando novamente e confirme utilizando ✅.`
            })]}), 15e3);
        });

        await msg.react("✅");
        await msg.react("❌");

        async function cacheMembers() {
            const members = await guild.members.fetch({ force: true });
            if (members.size > 0 && members.size !== guild.memberCount) return await cacheMembers();
        };
    }
};