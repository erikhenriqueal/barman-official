module.exports = {
    name: "restaurar",
    status: "private",
    aliases: ["reset", "rs"],
    description: "Restaura todo o nosso servidor corrigindo possíveis erros indesejados.",
    once: true,
    execute: ({ message }) => new Promise(async res =>{
        const { send, reply, deleteMessage, query, guild, embed, log } = global;
        const { color_red, color_green } = global.embedDefaults;
        if (global.resetCommand) return await deleteMessage(await reply(message, { embeds: [ embed({
            color: color_red,
            title: "❌ Você não pode fazer isso agora",
            description: `<@${message.author.id}>, o sistema já está sendo restaurado por outro administrador. Só se pode iniciar o processo de restauração após outro ser finalizado.`
        })]}), 10000);
        global.resetCommand = true;
        const { resolve } = require("path");
        const { MEMBER_ROLE, BOT_ROLE } = process.env;
        const resetEmbed = embed({ title: "🪅 Restaurando Sistema", description: `<@${message.author.id}>, você iniciou uma restauração em nosso Sistema.\nNão se preoculpe, isso não vai demorar muito! Já estou procurando por erros que possam ser corrigidos.\nAbaixo você encontra todo o processo da restauração, assim que finalizado, você saberá por lá.` });
        const msg = await reply(message, { embeds: [ resetEmbed ] });
        const editMsg = async (fieldLine, color) => {
            if (!resetEmbed.fields[0]) resetEmbed.fields.push({ name: "<a:loading_1:904071489249226772> Buscando Falhas:", value: "> Busca iniciada..." });
            if (typeof fieldLine == "string") resetEmbed.fields[0].value += fieldLine.startsWith("\n> ") ? fieldLine : "\n> " + fieldLine;
            if (color && /#([a-f0-9]{2}){3}/i.test(String(color))) resetEmbed.color = String(color);
            return await msg.edit({ embeds: [ resetEmbed ] });
        };
        await editMsg();

        const cacheMembers = async () => {
            const getMembers = async () => {
                const membersList = await guild.members.fetch({ force: true });
                if ((isNaN(membersList.size) && membersList.user) || membersList.size > 0) getMembers();
                if (guild.memberCount > guild.members.cache.size) await getMembers();
                return membersList.toJSON();
            };
            return await getMembers();
        };
        await cacheMembers();
        const members = guild.members.cache;
        const irregularMembers = members.filter(m => m.user.id != guild.ownerId && ((m.nickname && m.nickname != m.user.username) || (!m.user.bot && (!m.roles.cache.has(MEMBER_ROLE) || m.roles.cache.has(BOT_ROLE))) || (m.user.bot && (m.roles.cache.has(MEMBER_ROLE) || !m.roles.cache.has(BOT_ROLE)))));
        if (irregularMembers.size > 0) {
            await editMsg("👥 Membros irregulares encontrados.");
            for (const member of irregularMembers.toJSON()) {
                if (member.nickname != member.user.username) await member.setNickname(member.user.username, `Apelido resetado por <@${message.author.id}>`).catch(async error => {
                    await log(resolve(process.cwd(), `src/internalLogs/commands/reset_${message.author.id}_${Date.now()}.log`), `Command name: ${this.name}\nCommand author: ${message.author.username} (${message.author.id})\nError: Couldn't change ${member.user.username}'s (${member.user.id}) nickname\nRaw error: ${error}`);
                    await editMsg(`❌ O nickname de <@${member.user.id}> não pôde ser modificado.`);
                });
                try {
                    if (!member.user.bot) {
                        if (member.roles.cache.has(BOT_ROLE)) await member.roles.remove(BOT_ROLE, `Cargo removido por <@${message.author.id}>`);
                        if (!member.roles.cache.has(MEMBER_ROLE)) await member.roles.add(MEMBER_ROLE, `Cargo adicionado por <@${message.author.id}>`);
                    } else {
                        if (member.roles.cache.has(MEMBER_ROLE)) await member.roles.remove(MEMBER_ROLE, `Cargo removido por <@${message.author.id}>`);
                        if (!member.roles.cache.has(BOT_ROLE)) await member.roles.add(BOT_ROLE, `Cargo adicionado por <@${message.author.id}>`);
                    };
                } catch (error) {
                    await log(resolve(process.cwd(), `src/internalLogs/commands/reset_${message.author.id}_${Date.now()}.log`), `Command name: ${this.name}\nCommand author: ${message.author.username} (${message.author.id})\nError: Couldn't change ${member.user.username}'s (${member.user.id}) roles\nRaw error: ${error}`);
                    await editMsg(`❌ Os cargos de <@${member.user.id}> não puderam ser modificados.`);
                };
            };
            await editMsg(`✅ ${irregularMembers.size} membros irregulares corrigidos.`);
        } else await editMsg("✅ Todos os membros estão regulares.");
        deleteMessage(await editMsg("🍻 Busca finalizada! Todos os erros foram corrigidos! Sistema estável novamente.", color_green), 15000);
        global.resetCommand = false;
        if (await guild.channels.fetch(process.env.LOGS_CHANNEL)) await send(guild.channels.cache.get(process.env.LOGS_CHANNEL), { embeds: [ embed({
            title: "🔄 Sistema restaurado",
            description: `👤 Autor: <@${message.author.id}>\n⏰ Data: ${new Date().toLocaleDateString("br")} - ${new Date().toLocaleTimeString("br")}\n📒 Registro:\n${resetEmbed.fields[0].value}`
        })]});
        return res("done");
    })
};