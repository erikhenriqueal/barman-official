module.exports = {
    name: "memberPunished",
    async execute(target, author, punish) {
        const { resolve } = require("path");
        const { guild, send, embed, userAvatar, timeToString, db, log, changeNickname } = global;
        const { color_red } = global.embedDefaults;
        const punishmentsChannel = await guild.channels.fetch(process.env.PUNISH_CHANNEL);
        if (!punishmentsChannel) return;
        const punishmentsPath = resolve(process.cwd(), "src/internalLogs/punishments/");
        const punishment = {
            type: punish.type,
            targetId: target.id,
            authorId: author.id,
            guildId: target.guild ? target.guild.id : null,
            reason: String(punish.reason).replaceAll("\"", "%a"),
            duration: punish.duration,
            timestamp: Date.now()
        };
        let user = await db.getUser(target.id);
        if (!user) await db.setUser(target.id, { punishments: JSON.stringify([punishment])});
        else await db.editUser(target.id, { punishments: JSON.stringify([...JSON.parse(user.punishments), punishment]) });
        if (punish.type === "kick") {
            await log(resolve(punishmentsPath, `kick_${target.id}_${Date.now()}.log`), `Author: ${author.tag} - ${author.id}\nTarget: ${target.user.tag} - ${target.id}\nType: kick\nReason: ${punish.reason}`);
            return await send(punishmentsChannel, { embeds: [ embed({
                color: color_red,
                author: { name: `ID ${target.id}`, image: userAvatar(target.user) },
                title: `💥 ${target.user.tag} foi **Expulso** de nossa Comunidade`,
                description: `**👤 Autor:** ${author.tag} (${author.id})\n**🎯 Motivo:** ${punish.reason}`
            })]});
        } else if (punish.type === "ban") {
            await log(resolve(punishmentsPath, `ban_${target.id}_${Date.now()}.log`), `Author: ${author.tag} - ${author.id}\nTarget: ${target.user.tag} - ${target.id}\nType: ban\nDuration: ${punish.duration == 0 ? "none" : `${timeToString(punish.duration, 0)} - ${punish.duration}ms`}\nReason: ${punish.reason}`);
            const endDate = new Date(Date.now() + punish.duration);
            await send(punishmentsChannel, { embeds: [ embed({
                color: color_red,
                author: { name: `ID ${target.id}`, image: userAvatar(target.user) },
                title: `🔒 ${target.user.tag} foi **Banido** de nossa Comunidade`,
                description: `**👤 Autor:** ${author.tag} (${author.id})\n**⏲️ Duração:** ${punish.duration == 0 ? "Eterno" : timeToString(punish.duration, 0)}\n**🪁 Expedição:** ${punish.duration == 0 ? "Nunca" : `${endDate.toLocaleDateString("br")} às ${endDate.toLocaleTimeString("br")}`}\n**🎯 Motivo:** ${punish.reason}`
            })]});
            if (punish.duration > 0) setTimeout(async () => {
                const ban = await guild.bans.fetch(target.id);
                if (ban) return await guild.bans.remove(ban.user.id, "A duração do banimento expirou.").catch(async e => {
                    await log(resolve(process.cwd(), "src/internalLogs/errors", `e_ban_remove_${target.id}_${Date.now()}`), `Couldn't unban ${target.user.tag}:\nAuthor: ${author.id}\nTarget: ${target.id}\nDuration: ${duration}\nReason: ${reason}\nError:\n${e}`, true);
                    await send(guild.channels.cache.get(process.env.LOGS_CHANNEL), { content: `<@${process.env.DEVELOPER_ID}>`, embeds: [ embed({
                        color: global.embedDefaults.color_red,
                        title: "❌ Usuário ainda banido",
                        description: `<@${process.env.DEVELOPER_ID}>, o banimento de <@${target.id}> já expirou, porém, por algum motivo eu não pude remover sua punição. Tente remover manualmente, e verifique o erro abaixo para que isso não ocorra novamente!\n${e}`
                    })]});
                });
            }, punish.duration);
        } else if (punish.type === "mute") {
            await changeNickname(target, `🔇 ${target.user.username}`);
            await log(resolve(punishmentsPath, `mute_${target.id}_${Date.now()}.log`), `Author: ${author.tag} - ${author.id}\nTarget: ${target.user.tag} - ${target.id}\nType: mute\nDuration: ${punish.duration == 0 ? "none" : `${timeToString(punish.duration, 0)} - ${punish.duration}ms`}\nReason: ${punish.reason}`);
            const endDate = new Date(Date.now() + punish.duration);
            await send(punishmentsChannel, { embeds: [ embed({
                color: color_red,
                author: { name: `ID ${target.id}`, image: userAvatar(target.user) },
                title: `🔇 ${target.user.tag} foi **Silenciado** em nossa Comunidade`,
                description: `**👤 Autor:** ${author.tag} (${author.id})\n**⏲️ Duração:** ${punish.duration == 0 ? "Eterno" : timeToString(punish.duration, 0)}\n**🪁 Expedição:** ${punish.duration == 0 ? "Nunca" : `${endDate.toLocaleDateString("br")} às ${endDate.toLocaleTimeString("br")}`}\n**🎯 Motivo:** ${punish.reason}`
            })]});
            if (punish.duration > 0) setTimeout(async () => {
                await target.roles.remove(process.env.MUTED_ROLE).catch(async e => {
                    await log(resolve(process.cwd(), "src/internalLogs/errors", `e_mute_roleremove_${target.id}_${Date.now()}`), `Couldn't remove (unmute) ${target.user.tag}'s role:\nAuthor: ${author.id}\nTarget: ${target.id}\nDuration: ${duration}\nReason: ${reason}\nError:\n${e}`, true);
                    await send(guild.channels.cache.get(process.env.LOGS_CHANNEL), { content: `<@${process.env.DEVELOPER_ID}>`, embeds: [ embed({
                        color: global.embedDefaults.color_red,
                        title: "❌ Usuário ainda silenciado",
                        description: `<@${process.env.DEVELOPER_ID}>, o silenciamento de <@${target.id}> já expirou, porém, por algum motivo eu não pude remover sua punição. Tente remover manualmente, e verifique o erro abaixo para que isso não ocorra novamente!\n${e}`
                    })]});
                });
                await changeNickname(target, target.user.username);
            }, punish.duration);
        };
    }
}