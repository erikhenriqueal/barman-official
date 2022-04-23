module.exports = (userId, commandId, channelId, callback) => {
    const cb = (v, r = false) => typeof callback === "function" ? callback(v) && r : r;
    if (typeof userId !== "string" || typeof commandId !== "string") return cb(1);
    const { guild, commands } = global;
    if (!guild) return cb(2);
    const member = guild.members.cache.find(u => u.id === userId);
    if (!member) return cb(3);
    const command = commands.select(commandId);
    if (!command) return cb(4);
    if (member.id == process.env.DEVELOPER_ID) return cb(0, true);

    const
    channel = guild.channels.cache.get(channelId),
    permissions = member.permissions.serialize(),
    channelPermissions = channel ? channel.permissionsFor(member, true).serialize() : null,
    permissionsList = Object.keys(permissions).filter(p => permissions[p] === true),
    channelPermissionsList = channelPermissions !== null ? Object.keys(channelPermissions).filter(cp => channelPermissions[cp] === true) : [],
    allPermissionsList = [...permissionsList, ...channelPermissionsList],
    roleFilter = i => /[!]?<&\d{17,19}>/.test(String(i)),
    userFilter = i => /[!]?<@\d{17,19}>/.test(String(i)),
    permFilter = i => Object.keys(require("discord.js").Permissions.FLAGS).some(f => new RegExp(`[!]?${f}`).test(String(i))),
    parserMap = i => String(i).replaceAll(/[^!\d]/g, ""),
    rmImpMap = i => String(i).replaceAll("!", ""),
    impFilter = i => i.startsWith("!"),
    whitelist = {
        roles: command.whitelist.filter(roleFilter).map(parserMap),
        roles_i: command.whitelist.filter(roleFilter).map(parserMap).filter(impFilter).map(rmImpMap),
        users: command.whitelist.filter(userFilter).map(parserMap).map(rmImpMap),
        permissions: command.whitelist.filter(permFilter).map(p => String(p).toUpperCase()),
        permissions_i: command.whitelist.filter(permFilter).filter(impFilter).map(p => String(p).toUpperCase()).map(rmImpMap),
    }, blacklist = {
        roles: command.blacklist.filter(roleFilter).map(parserMap).map(rmImpMap),
        users: command.blacklist.filter(userFilter).map(parserMap).map(rmImpMap),
        permissions: command.blacklist.filter(permFilter).map(rmImpMap).map(p => String(p).toUpperCase())
    }, wl = {
        r: whitelist.roles.map(rmImpMap).some(r => member.roles.cache.has(r)),
        ri: whitelist.roles_i.length === 0 ? false : whitelist.roles_i.length === member.roles.cache.filter(r => whitelist.roles_i.includes(r.id)).size,
        u: whitelist.users.includes(member.id),
        p: whitelist.permissions.map(rmImpMap).some(p => allPermissionsList.includes(p)),
        pi: whitelist.permissions_i.length === 0 ? false : whitelist.permissions_i.length === allPermissionsList.filter(p => whitelist.permissions_i.includes(p)).length
    }, bl = {
        r: blacklist.roles.some(r => member.roles.cache.has(r)),
        u: blacklist.users.includes(member.id),
        p: blacklist.permissions.some(p => allPermissionsList.includes(p))
    };

    if (bl.r || bl.u || bl.p) return cb(5);
    if (wl.r && (!wl.ri && whitelist.roles_i.length > 0)) return cb(6);
    if (wl.p && (!wl.pi && whitelist.permissions_i.length > 0)) return cb(7);
    if ((!wl.r && whitelist.roles.length > 0) || (!wl.u && whitelist.users.length > 0) || (!wl.p && whitelist.permissions.length > 0)) return cb(8);

    return cb(0, true);
};