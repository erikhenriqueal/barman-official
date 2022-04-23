module.exports = edit = (message, content, error) => new Promise(async res => {
    if (!message || typeof message.edit !== "function" || !content) return res(null);
    return await message.edit(content).then(res).catch(err => {
        console.log(`[ DiscordJS ] Couldn't edit a message ${message && message.id ? `(${message.id}${message.author && message.author.id ? ` from "${message.author.tag}" (${message.author.id})` : ""})` : ""}:\n${err}`);
        if (typeof error === "function") return error(err);
    });
});