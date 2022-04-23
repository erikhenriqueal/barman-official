async function emitLog(message) {
    const { client, send, guild, embed, userAvatar, parse, log, __az__, __09__, clearValues } = global;
    const { existsSync } = require("fs");
    const { resolve } = require("path");
    const { MessageAttachment } = require("discord.js");
    const generateLogId = () => {
        const id = randomWord([...__az__, ...__09__], 25);
        if (existsSync(resolve(__dirname, "../temp/logs/", `deleted_${id}.json`))) return generateLogId();
        return id;
    };
    const messageLogId = generateLogId();
    const actualTime = new Date();
    actualTime.setHours(actualTime.getUTCHours() - 3);
    const logsChannel = guild.channels.cache.find(c => c.id === process.env.LOGS_CHANNEL || String(c.name).includes("logs"));
    if (!logsChannel) return;
    if (message.channelId == logsChannel.id && message.author.id == client.user.id && message.embeds.length > 0) {
        let { author, title, description, timestamp } = message.embeds[0];
        const { name, iconURL, url } = author;
        const type = title.startsWith("✏️") ? "created_" : title.startsWith("✂️") ? "edited_" : "deleted_";
        let messageLogId = type + description.split("\n").reverse()[0].split(" ").reverse()[0].replace(/(\|)*|(\.json)/gi, "");
        if (!existsSync(resolve(__dirname, "../temp/logs/", `${messageLogId}.json`))) {
            messageLogId = null;
            description = description.split("\n");
            description.pop();
            description = description.join("\n");
        };
        await send(logsChannel, { content: message.content.length > 0 ? message.content : `Recuperado - ${actualTime.toLocaleString("br")}`, embeds: [ embed({
            author: { text: name, image: iconURL, url: url },
            title: title,
            description: description,
            timestamp: new Date(timestamp)
        })], files: !messageLogId ? null : [ new MessageAttachment(resolve(__dirname, "../temp/logs/", `${messageLogId}.json`), `${name.split(" ")[1].split("#")[0]}.json`).setSpoiler(true) ]});
    } else if (message.channelId != logsChannel.id) {
        const logContent = JSON.stringify(clearValues(JSON.parse(JSON.stringify(message)), true), null, 2);
        log(resolve(__dirname, "../internalLogs/messages/", `${actualTime.toLocaleDateString().replaceAll("/", "_")}.log`), `Message from ${message.author.tag} was deleted:\n${logContent}`);
        await log(resolve(__dirname, "../temp/logs/", `deleted_${messageLogId}.json`), logContent);
        const date = new Date(actualTime);
        const fields = [
            { name: "⏰ Data:", value: date.toLocaleDateString("br") + " " + date.toLocaleTimeString("br") },
            { name: "🎯 Canal:", value: message.channel.type === "DM" ? "Mensagens Diretas" : message.channel.toString() },
            { name: "📝 Conteúdo:", value: message.content.length === 0 ? "--" : message.content.length > 515 ? message.content.slice(0, 512).trim() + "..." : message.content },
            message.attachments.size > 0 ? { name: "📎 Itens Fixados:", value: message.attachments.reduce((acc, a) => acc + `• [${a.name}](${a.proxyURL ? a.proxyURL : a.url}) (${parse(Number(a.size), 1024, [" B", " Kb", " Mb"], true, true)})\n`, "") } : null,
            { name: "🎲 ID de Registro:", value: `||${messageLogId}||` }
        ].filter(f => f != null);
        await send(logsChannel, { embeds: [ embed({
            author: { text: `De ${message.author.tag}`, image: userAvatar(message.author) },
            title: "🗑️ Mensagem Deletada",
            description: fields.map(f => `**${f.name}** ${f.value}`).join("\n"),
            timestamp: date
        })], files: [ new MessageAttachment(resolve(__dirname, "../temp/logs/", `deleted_${messageLogId}.json`), `${message.author.username}.json`).setSpoiler(true) ]});
    };
    return;
};

module.exports = {
    name: "messageDelete",
    async execute(message) {
        await emitLog(message);
    }
};