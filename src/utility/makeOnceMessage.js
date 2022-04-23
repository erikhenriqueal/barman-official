module.exports = async (message, authorId, timeout, res) => {
    if (!message || !authorId || !timeout) return console.log("[ DiscordJS ] To make a message be once you need to enter all params.");
    try {
        const collector = message.createReactionCollector({ filter: (r, u) => r.emoji.name === "❌" && u.id == authorId, idle: timeout });
        collector.on("collect", () => collector.stop());
        collector.on("end", async () => {
            await global.deleteMessage(message);
            if (typeof res === "function") return res("done");
        });
        await message.react("❌");
        return message;
    } catch (error) {
        console.log(`[ DiscordJS ] I've received an error on executing a makeOnceMessage function.\n${error}`);
    };
};