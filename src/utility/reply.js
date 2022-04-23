module.exports = (message, content, error) => new Promise(async res => {
    if (!message || typeof message.reply !== "function" || !content) return await global.send(message, content);
    return await message.reply(content).then(res).catch(err => {
        console.log(`[ DiscordJS ] Couldn't reply to "${message}".\n${err}`);
        if (typeof error === "function") return error(err);
    });
});