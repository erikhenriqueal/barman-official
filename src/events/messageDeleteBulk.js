async function emitLog(messages) {
    if (messages.size === 0) return;
    if (messages.size === 1) return global.client.emit("messageDelete", messages.first());
    const { client, send, guild, embed, userAvatar, parse, log, randomWord, __az__, __09__, clearValues } = global;
    const { resolve } = require("path");
    const { MessageAttachment } = require("discord.js");
    const actualTime = new Date();
    actualTime.setHours(actualTime.getUTCHours() - 3);
    const logsChannel = guild.channels.cache.find(c => c.id === process.env.LOGS_CHANNEL || String(c.name).includes("logs"));
    if (!logsChannel) return;
    const generateLogId = () => {
        const { existsSync } = require("fs");
        const id = randomWord([...__az__, ...__09__], 25);
        if (existsSync(resolve(__dirname, "../temp/logs/", `bulkdeleted_${id}.json`))) return generateLogId();
        return id;
    };
    const bulkDeleteLogId = generateLogId();
    const logContent = JSON.stringify(clearValues(messages.toJSON(), true), null, 2);
    log(resolve(__dirname, "../internalLogs/messages/", `${actualTime.toLocaleDateString().replaceAll("/", "_")}.log`), `Message bulk delete:\n${logContent}`);
    await log(resolve(__dirname, "../temp/logs/", `bulkdeleted_${bulkDeleteLogId}.json`), logContent);
    const date = new Date();
    const messagesChannel = messages.first().channel;
    const fields = [
        { name: "⏰ Data:", value: date.toLocaleDateString("br") + " " + date.toLocaleTimeString("br") },
        { name: "🎯 Canal:", value: messagesChannel.type === "DM" ? "__Mensagens Diretas__" : `__<#${messagesChannel.id}>__` },
        { name: "🧮 Quantia:", value: messages.size + " mensagens" }
    ].filter(f => f != null);
    await send(logsChannel, { embeds: [ embed({
        title: "🗑️ Mensagens Deletadas",
        description: fields.map(f => `**${f.name}** ${f.value}`).join("\n"),
        timestamp: date
    })], files: [ new MessageAttachment(resolve(__dirname, "../temp/logs/", `bulkdeleted_${bulkDeleteLogId}.json`), `deleted_messages.json`) ]});
    messages.each(async message => {
        if (message.channelId == logsChannel.id && message.author.id == client.user.id && message.embeds.length > 0) return client.emit("messageDelete", message);
    });
};

module.exports = {
    name: "messageDeleteBulk",
    async execute(messages) {
        await emitLog(messages);
    }
};