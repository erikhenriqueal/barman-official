module.exports = user => {
    if (!user || !user.avatar || typeof user.displayAvatarURL !== "function") return global.guild.iconURL({ dynamic: true });
    return user.displayAvatarURL({ dynamic: true });
};