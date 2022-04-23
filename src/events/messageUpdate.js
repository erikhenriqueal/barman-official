async function emitLog(message, newMessage) {
    const { send, guild, embed, userAvatar, log, parse, __az__, __09__, clearValues } = global;
    const { resolve } = require("path");
    const { MessageAttachment } = require("discord.js");
    const generateLogId = () => {
        const { existsSync } = require("fs");
        const id = randomWord([...__az__, ...__09__], 25);
        if (existsSync(resolve(__dirname, "../temp/logs/", `edited_${id}.json`))) return generateLogId();
        return id;
    };
    const messageLogId = generateLogId();
    const actualTime = new Date();
    actualTime.setHours(actualTime.getUTCHours() - 3);
    const logContent = JSON.stringify(clearValues(JSON.parse(JSON.stringify({ old: message, new: newMessage })), true), null, 2);
    log(resolve(__dirname, "../internalLogs/messages/", `${actualTime.toLocaleDateString().replaceAll("/", "_")}.log`), `Message from ${message.author.tag} was updated:\n${logContent}`);
    await log(resolve(__dirname, "../temp/logs/", `edited_${messageLogId}.json`), logContent);
    const logsChannel = guild.channels.cache.find(c => c.id === process.env.LOGS_CHANNEL || String(c.name).includes("logs"));
    if (!logsChannel) return;
    if (message.channelId == logsChannel.id) return;
    const date = new Date(newMessage.editedTimestamp ? newMessage.editedTimestamp : newMessage.createdTimestamp);
    const fields = [
        { name: "⏰ Data:", value: date.toLocaleDateString("br") + " " + date.toLocaleTimeString("br") },
        { name: "🎯 Canal:", value: message.channel.type === "DM" ? "Mensagens Diretas" : message.channel.toString() },
        { name: "📝 Conteúdo Anterior:", value: message.content.length === 0 ? "--" : message.content.length > 259 ? message.content.slice(0, 256).trim() + "..." : message.content },
        { name: "📝 Conteúdo Novo:", value: newMessage.content.length === 0 ? "--" : newMessage.content.length > 259 ? newMessage.content.slice(0, 256).trim() + "..." : newMessage.content },
        message.attachments.size > 0 ? { name: "📎 Itens Fixados:", value: message.attachments.reduce((acc, a) => acc + `• [${a.name}](${a.proxyURL ? a.proxyURL : a.url}) (${parse(Number(a.size), 1024, [" B", " Kb", " Mb"], true, true)})\n`, "") } : null,
        { name: "🎲 ID de Registro:", value: messageLogId }
    ].filter(f => f != null);
    return await send(logsChannel, { embeds: [ embed({
        author: { text: `De ${message.author.tag}`, image: userAvatar(message.author), url: message.url },
        title: "✂️ Mensagem Alterada",
        description: fields.map(f => `**${f.name}** ${f.value}`).join("\n"),
        timestamp: date
    })], files: [ new MessageAttachment(resolve(__dirname, "../temp/logs/", `edited_${messageLogId}.json`), `${message.author.username}.json`).setSpoiler(true) ]});
};

module.exports = {
    name: "messageUpdate",
    async execute(oldMessage, newMessage) {
        await emitLog(oldMessage, newMessage);
    }
};