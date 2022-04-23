module.exports = deleteMessage = (message, timeout, error) => new Promise(res => {
    if (!message || typeof message.delete !== "function") return res(null);
    return setTimeout(async () => await message.delete().then(res).catch(err => {
        console.log(`[ DiscordJS ] Couldn't delete a message${message.content ? ` ("${message.content}"${message.author && message.author.id ? ` from "${message.author.id}"` : ""})` : ""}:\n${err}`);
        if (typeof error === "function") return error(err);
    }), !isNaN(timeout) ? Number(timeout) : 0);
});