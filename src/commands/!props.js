module.exports = {
    status: "active" || "hidden" || "maintenance" || "private" || "off",
    name: "",
    aliases: [],
    matches: new RegExp(),
    description: "",
    uses: [],
    args: false,
    once: false,
    channels: [], // id
    channelsBlacklist: [], // id
    whitelist: [], // <@id> | <&id> | permission
    blacklist: [], // <@id> | <&id> | permission
    cooldown: 0,
    execute({ message, content, args, commandName }) {

    }
};