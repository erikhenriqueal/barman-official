module.exports = (channel, content, error) => new Promise(async res => {
    if (!channel || typeof channel.send !== "function" || !content) return res(null);
    return await channel.send(content).then(res).catch(err => {
        console.log(`[ DiscordJS ] Couldn't send message to "${channel.name ? channel.name : channel}"${channel.id ? ` (${channel.id})` : ""}.\n${err}`);
        if (typeof error === "function") return error(err);
    });
});