module.exports = new Promise(async res => {
    return res();
    const { db, client, changeNickname, log, embed } = global;
    const { MUTED_ROLE, LOGS_CHANNEL, DEVELOPER_ID } = process.env;
    const { resolve }  = require("path");
    const usersPunishments = (await db.getUsers()).map(u => {
        const up = JSON.parse(u.punishments);
        if (Array.isArray(up) && up.length > 0) return up.filter(p => p.type != "kick" && p.duration > 0);
        return;
    });
    for (const punishments of usersPunishments) {
        for (const punish of punishments) {
            const { type, targetId, authorId, guildId, duration, reason, timestamp } = punish;
            const timeToRemove = timestamp + duration;
            const activeDuration = timeToRemove - Date.now();
            const guild = await client.guilds.fetch(guildId);
            if (!guild) return;
            const target = await guild.members.fetch(targetId);
            const author = await guild.members.fetch(authorId);
            if (!target || !author) return;
            setTimeout(async () => {
                if (type == "ban") {
                    const ban = await guild.bans.fetch(target.id).catch(() => null);
                    if (ban) return await guild.bans.remove(ban.user.id, "A duração do banimento expirou.").catch(async e => {
                        await log(resolve(process.cwd(), "src/internalLogs/errors", `e_ban_remove_${target.id}_${Date.now()}`), `Couldn't unban ${target.user.tag}:\nAuthor: ${author.id}\nTarget: ${target.id}\nDuration: ${duration}\nReason: ${reason}\nError:\n${e}`, true);
                        await send(guild.channels.cache.get(LOGS_CHANNEL), { content: `<@${DEVELOPER_ID}>`, embeds: [ embed({
                            color: global.embedDefaults.color_red,
                            title: "❌ Usuário ainda banido",
                            description: `<@${DEVELOPER_ID}>, o banimento de <@${target.id}> já expirou, porém, por algum motivo eu não pude remover sua punição. Tente remover manualmente, e verifique o erro abaixo para que isso não ocorra novamente!\n${e}`
                        })]});
                    });
                } else if (type == "mute") {
                    await changeNickname(target, target.user.username);
                    if (target.roles.cache.has(MUTED_ROLE)) await target.roles.remove(MUTED_ROLE).catch(async e => {
                        await log(resolve(process.cwd(), "src/internalLogs/errors", `e_mute_roleremove_${target.id}_${Date.now()}`), `Couldn't remove (unmute) ${target.user.tag}'s role:\nAuthor: ${author.id}\nTarget: ${target.id}\nDuration: ${duration}\nReason: ${reason}\nError:\n${e}`, true);
                        await send(guild.channels.cache.get(LOGS_CHANNEL), { content: `<@${DEVELOPER_ID}>`, embeds: [ embed({
                            color: global.embedDefaults.color_red,
                            title: "❌ Usuário ainda silenciado",
                            description: `<@${DEVELOPER_ID}>, o silenciamento de <@${target.id}> já expirou, porém, por algum motivo eu não pude remover sua punição. Tente remover manualmente, e verifique o erro abaixo para que isso não ocorra novamente!\n${e}`
                        })]});
                    });
                };
            }, activeDuration <= 0 ? 0 : activeDuration);
        };
    };
    return res();
});