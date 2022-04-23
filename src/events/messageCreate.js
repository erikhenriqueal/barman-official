async function emitLog(message) {
    const { send, guild, embed, userAvatar, log, parse, randomWord, __az__, __09__, clearValues } = global;
    const { resolve } = require("path");
    const { MessageAttachment } = require("discord.js");
    const generateLogId = () => {
        const { existsSync } = require("fs");
        const id = randomWord([...__az__, ...__09__], 25);
        if (existsSync(resolve(__dirname, "../temp/logs/", `created_${id}.json`))) return generateLogId();
        return id;
    };
    const messageLogId = generateLogId();
    const actualTime = new Date();
    const logContent = JSON.stringify(clearValues(JSON.parse(JSON.stringify(message)), true), null, 2);
    actualTime.setHours(actualTime.getUTCHours() - 3);
    log(resolve(__dirname, "../internalLogs/messages/", `${actualTime.toLocaleDateString().replaceAll("/", "_")}.log`), `Message from ${message.author.tag}:\n${logContent}`);
    await log(resolve(__dirname, "../temp/logs/", `created_${messageLogId}.json`), logContent);
    const logsChannel = guild.channels.cache.find(c => c.id === process.env.LOGS_CHANNEL || String(c.name).includes("logs"));
    if (!logsChannel) return;
    if (message.channelId == logsChannel.id) return;
    const date = new Date(message.createdTimestamp);
    const fields = [
        { name: "⏰ Data:", value: date.toLocaleDateString("br") + " " + date.toLocaleTimeString("br") },
        { name: "🎯 Canal:", value: message.channel.type === "DM" ? "Mensagens Diretas" : message.channel.toString() },
        { name: "📝 Conteúdo:", value: message.content.length === 0 ? "--" : message.content.length > 515 ? message.content.slice(0, 512).trim() + "..." : message.content },
        message.attachments.size > 0 ? { name: "📎 Itens Fixados:", value: message.attachments.reduce((acc, a) => acc + `• [${a.name}](${a.proxyURL ? a.proxyURL : a.url}) (${parse(Number(a.size), 1024, [" B", " Kb", " Mb"], true, true)})\n`, "") } : null,
        { name: "🎲 ID de Registro:", value: `||${messageLogId}||` }
    ].filter(f => f != null);
    return await send(logsChannel, { embeds: [ embed({
        author: { text: `De ${message.author.tag}`, image: userAvatar(message.author), url: message.url },
        title: "✏️ Mensagem Recebida",
        description: fields.map(f => `**${f.name}** ${f.value}`).join("\n"),
        timestamp: date
    })], files: [ new MessageAttachment(resolve(__dirname, "../temp/logs/", `created_${messageLogId}.json`), `${message.author.username}.json`).setSpoiler(true) ]});
};
async function emitQuickHelp(message) {
    const { reply, embed, prefix, guild, client } = global;
    const { ADMIN_ROLE, RULES_CHANNEL, ALERTS_CHANNEL, NEWS_CHANNEL } = process.env;
    if (new RegExp(`<@[!]?${client.user.id}>|${client.user.tag}`).test(message.content)) await reply(message, { embeds: [ embed({
        title: "🪅 Central de Ajuda Rápida",
        description: `Olá <@${message.author.id}> 👋. Essa é a Central de Ajuda Rápida, onde te darei um pézinho para me conhecer melhor.\nUtilize o prefixo **${prefix}** ao utilizar meus comandos para executa-los.`,
        fields: [
            {
                name: "🎠 Comandos Importantes:",
                value: `**${prefix}ajuda**: O comando **ajuda** vai ser utilizado para mostrar mais detalhadamente tudo sobre nosso Servidor.\n**${prefix}info**: Este irá lhe mostrar algumas informações e curiosidades sobre mim ou sobre o Servidor.\n**${prefix}userinfo**: Com esse aqui irei extrair informações __simples__ e __acessíveis__ sobre a conta de algum de nossos Membros.`
            }, {
                name: "🔮 Seções Importantes:",
                value: `**<#${RULES_CHANNEL}>**: Este canal é de suma importância para manter o comportamento pacífico em nossa comunidade, lá você encontrará todas as nossas regras, siga-as para não ser punido! (caso veja alguém infringindo nossos termos chame algum de nossos Administradores no Privado ou faça uma denûncia usando o comando **${prefix}reportar**)\n**<#${ALERTS_CHANNEL}>**: Aqui você irá encontrar alguns informativos, geralmente sobre imprevistos ou assuntos relacionados.\n**<#${NEWS_CHANNEL}>**: Sempre que houver alguma novidade em nossa comunidade iremos anuncia-la aqui!`,
            }, {
                name: "🎎 Equipe Administrativa:",
                value: `Abaixo você encontra toda nossa Equipe de Administradores atualmente definida, se precisar de ajuda, pode nos marcar:\n${guild.members.cache.filter(m => !m.user.bot && m.roles.cache.has(ADMIN_ROLE)).map(m => `• <@${m.id}>`).join("\n")}`
            }
        ]
    })]});
};
async function emitCommand(message) {
    const { prefix, commands, send, reply, deleteMessage, embed, guild, memberInfo, timeToString } = global;
    const { DEVELOPER_ID } = process.env;
    const { color_red, color_white } = global.embedDefaults;
    if (!prefix || !message.content.startsWith(prefix)) return;
    const content = message.content.slice(prefix.length).trim();
    const args = content.split(" ");
    const commandName = args.shift().toLowerCase();
    const command = commands.select(commandName);
    const author = memberInfo(message.member);
    if (!command || command.status === "off" || (command.status === "private" && !(author.admin || author.developer))) return await deleteMessage(await reply(message, { embeds: [ embed({ color: color_red, title: "❓ Comando Desconhecido", description: `Sinto muito <@${message.author.id}>, porém o comando recebido não consta em nosso Sistema ou foi desativado pelo desenvolvedor. Por favor, verifique se não houve erro gramático e tente novamente.` }) ] }), 15e3);
    if (!author.developer && command.status === "maintenance") return await deleteMessage(await reply(message, { embeds: [ embed({ color: color_white, title: "🛠️ Comando em Manutenção", description: `<@${message.author.id}> este comando encontra-se atualmente em manutenção. Logo iremos habilita-lo novamente para uso público.` }) ] }), 15e3);
    if (!author.admin && command.channels[0] && !command.channels.some(id => message.channel.id == id || (message.channel.type === "GUILD_TEXT" && message.channel.parentId == id))) return await deleteMessage(await reply(message, { embeds: [ embed({ color: color_red, title: "🎯 Local não permitido", description: `<@${message.author.id}>, este comando só pode ser executado nos canais ${guild.channels.cache.filter(c => command.channels.some(id => c.id == id)).map(c => c.type === "GUILD_CATEGORY" ? guild.channels.cache.filter(_c => _c.parentId === c.id).map(_c => `<#${_c.id}>`).join(", ") : `<#${c.id}>`).join(", ")}.` }) ] }), 15e3);
    if (command.channelsBlacklist[0] && command.channelsBlacklist.some(id => message.channel.id == id || (message.channel.parentId && message.channel.parentId == id))) return await deleteMessage(await reply(message, { embeds: [ embed({ color: color_red, title: "🎯 Local não permitido", description: `<@${message.author.id}>, este comando não pode ser executado aqui.` }) ] }), 15e3);
    if (command.args && !args[0]) return await deleteMessage(await reply(message, { embeds: [ embed({ color: color_red, title: "❌ Comando Incompleto", description: `<@${message.author.id}>, este comando utiliza de alguns parâmetros para funcionar. Caso não saiba quais são esses, pode utilizar **${prefix}ajuda comando ${commandName}** para saber mais sobre esse comando.` })]}), 15e3);
    if (command.once === true) {
        const { Collection } = require("discord.js");
        if (!global.commandUses) global.commandUses = new Collection();
        const { commandUses } = global;
        if (!commandUses.has(message.author.id)) commandUses.set(message.author.id, new Collection());
        const userUses = commandUses.get(message.author.id);
        const commandUse = userUses.get(commandName);
        if (commandUse) {
            if (commandUse.warnSent === true) return;
            userUses.set(commandName, { timestamp: commandUse.timestamp, warnSent: true });
            const date = new Date(commandUse.timestamp);
            date.setHours(date.getUTCHours() - 3);
            deleteMessage(await reply(message, { embeds: [ embed({ color: color_red, title: "🎲 Comando já em uso", description: `<@${message.author.id}>, o comando solicitado ja está em uso em mensagens anteriores. Foi executado no dia ${date.toLocaleDateString("br")} às ${date.toLocaleTimeString()}.` }) ] }), 15e3);
            return;
        } else {
            const { cooldowns } = global;
            const userCooldowns = cooldowns ? cooldowns.get(message.author.id) : null;
            if (!userCooldowns || !userCooldowns.has(commandName)) userUses.set(commandName, { timestamp: Date.now(), warnSent: false });
        };
    };
    const { Collection } = require("discord.js");
    if (!author.admin && command.cooldown > 0) {
        if (!global.cooldowns) global.cooldowns = new Collection();
        const { cooldowns } = global;
        if (!cooldowns.has(message.author.id)) cooldowns.set(message.author.id, new Collection());
        const userCooldowns = cooldowns.get(message.author.id);
        const lastUse = userCooldowns.get(commandName);
        if (!lastUse && !command.once) {
            userCooldowns.set(commandName, { timestamp: Date.now(), warnSent: false });
            setTimeout(() => userCooldowns.delete(commandName), command.cooldown);
        } else if (lastUse && !isNaN(lastUse.timestamp) && Date.now() - lastUse.timestamp <= command.cooldown) {
            const cooldown = -(Date.now() - lastUse.timestamp - command.cooldown);
            const warnEmbed = embed({ color: color_white, title: "⏰ Comando em espera", description: `<@${message.author.id}>, você deve aguardar mais ${timeToString(cooldown)} para executar este comando novamente.` });
            if (lastUse.warnSent !== false) {
                if (lastUse && lastUse.message) await lastUse.message.edit({ embeds: [ warnEmbed ] });
                return await deleteMessage(message);
            };
            const warnMessage = await reply(message, { embeds: [ warnEmbed ] });
            userCooldowns.set(commandName, { timestamp: lastUse.timestamp, warnSent: true, message: warnMessage });
            return await deleteMessage(warnMessage, 15e3).then(() => userCooldowns.set(commandName, { timestamp: lastUse.timestamp, warnSent: true, message: null }));
        };
    };
    try {
        console.log(`[ DiscordJS ] Command ${commandName} executed by ${message.author.tag} (${message.author.id})`);
        const params = { message, content, args, commandName };
        if (command.once === true) return await command.execute(params).then(signal => {
            if (signal === "done") {
                const timestamp = Date.now();
                const { commandUses } = global;
                if (commandUses && commandUses.has(message.author.id)) {
                    const userUses = commandUses.get(message.author.id);
                    if (userUses.has(commandName)) userUses.delete(commandName);
                };

                if (author.admin || command.cooldown === 0) return;
                
                if (!global.cooldowns) global.cooldowns = new Collection();
                const { cooldowns } = global;
                if (!cooldowns.has(message.author.id)) cooldowns.set(message.author.id, new Collection());
                const userCooldowns = cooldowns.get(message.author.id);
                
                if (!userCooldowns.has(commandName)) {
                    userCooldowns.set(commandName, { timestamp, warnSent: false });
                    setTimeout(() => userCooldowns.delete(commandName), command.cooldown);
                };
            };
        }); else return await command.execute(params);
    } catch (error) {
        console.log(`[ DiscordJS ] Received error on "${commandName}" command execution:\n${error}`);
        if (!error.__sendConfirmationMessage__) await send(guild.members.cache.get(DEVELOPER_ID), { embeds: [ embed({ color: color_red, title: `💥 Falha ao executar o comando "${commandName}":`, description: `<@${DEVELOPER_ID}>, recebi um erro ao executar o comando "${commandName}", mais informações abaixo:\nMensagem: ${message.content}\nAutor: ${message.author.tag} (${message.author.id})\nErro: ${error}` })]});
        return await deleteMessage(await reply(message, { embeds: [ embed({ color: color_red, title: "💥 Falha na Execução", description: `Perdão <@${message.author.id}>, mas infelizmente recebi um erro inesperado ao executar seu comando. Fica tranquilo! Meu desenvolvedor já foi avisado e logo logo corrigiremos o erro.` })]}), 15e3);
    };
};

module.exports = {
    name: "messageCreate",
    async execute(message) {
        if (process.env.LOGS_CHANNEL == message.channel.id && message.author.id != global.client.user.id) return await global.deleteMessage(message);
        await emitLog(message);
        if (message.author.bot) return;
        await emitQuickHelp(message);
        if (message.channel.type === "DM") return;
        await emitCommand(message);
    }
};