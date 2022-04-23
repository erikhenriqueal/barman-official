console.log("[ DiscordJS ] Handling commands...");

module.exports = new Promise(async res => {
    const { resolve } = require("path");
    const { Collection, Permissions } = require("discord.js");
    
    const commands = new Collection();
    global.commands = commands;
    
    await global.pathReader(resolve(__dirname, "../commands"), { recursive: true, extensions: ["js"] }).then(async commandsFiles => {
        for (const file of commandsFiles) {
            if (!file.fileName.startsWith("!")) {
                const command = await require(resolve(file.path));
                if (typeof command.name === "string" && command.name.length > 0 && typeof command.description === "string" && command.description.length > 0 && typeof command.execute === "function") {
                    const validateUsers = u => /(<@[!]?\d{17,19}>)|(<&[!]?\d{17,19}>)/.test(u) || Object.keys(Permissions.FLAGS).map(p => p.toLowerCase()).includes(String(u).toLowerCase());
                    command.status = ["active", "hidden", "maintenance", "private", "off"].includes(command.status) ? command.status : "active";
                    command.aliases = (Array.isArray(command.aliases) ? command.aliases.map(a => String(a).replaceAll(" ", "").toLowerCase()) : []).sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
                    command.matches = /\/.+\//.test(String(command.matches)) ? new RegExp(command.matches) : new RegExp(command.name);
                    command.uses = Array.isArray(command.uses) ? command.uses.map(a => String(a).toLowerCase()) : [];
                    command.args = typeof command.args === "boolean" ? command.args : false;
                    command.once = typeof command.once === "boolean" ? command.once : false;
                    command.channels = Array.isArray(command.channels) ? command.channels : [];
                    command.channelsBlacklist = Array.isArray(command.channelsBlacklist) ? command.channelsBlacklist : [];
                    command.whitelist = Array.isArray(command.whitelist) ? command.whitelist.filter(validateUsers) : [];
                    command.blacklist = Array.isArray(command.blacklist) ? command.blacklist.filter(validateUsers) : [];
                    command.cooldown = !isNaN(command.cooldown) ? Number(command.cooldown) : 0;
                    if (!commands.find(c => c === command || c.name === command.name || c.aliases.some(a => command.aliases.includes(a)) || String(c.matches) === String(command.matches))) commands.set(command.name, command);
                    else console.log(`[ DiscordJS ] Commands with the same credentials found: ${command.name} (${resolve(file.path).replace(resolve(process.cwd()), "")})`);
                };
            };
        };
        return console.log("[ DiscordJS ] All commands successfully imported.");
    });
    commands.select = options => {
        if (!options) return;
        const utils = {
            filter: i => typeof i === "string",
            map: i => i.replaceAll(" ", "").toLowerCase()
        };
        const rawOptions = options;
        options = {
            name: typeof options === "string" ? options.replaceAll(" ", "") : typeof options.name === "string" ? options.name.replaceAll(" ", "") : "acommandthatdoesntexists",
            aliases: Array.isArray(options) ? options.filter(utils.filter).map(utils.map) : []
        };
        const command = commands.find(c => c.matches.test(options.name) || [c.name, ...c.aliases].some(n => [options, options.name, ...options.aliases].filter(utils.filter).map(utils.map).includes(n)));
        if (command) return command;
        if (typeof rawOptions === "object" && !Array.isArray(rawOptions)) {
            const sameKeys = Object.keys(rawOptions).filter(k => Object.keys(commands.first()).includes(k));
            const matches = commands.filter(cmd => sameKeys.some(key => rawOptions[key] === cmd[key]));
            if (matches.length <= 1) return matches[0];
            else return matches;
        };
        return;
    };
    return res(commands);
});