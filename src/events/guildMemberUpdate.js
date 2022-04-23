module.exports = {
    name: "guildMemberUpdate",
    async execute(oldMember, newMember) {
        const { db, changeNickname } = global;
        if (oldMember.nickname != newMember.nickname || oldMember.user.username != newMember.user.username) {
            const userDb = await db.getUser(newMember.user.id, true);
            const punishments = JSON.parse(userDb.punishments).filter(p => p.type == "mute" && p.timestamp + p.duration > Date.now());
            if (punishments[0]) await changeNickname(newMember, `🔇 ${newMember.user.username}`);
            else if (String(newMember.nickname).startsWith("🔇 ")) await changeNickname(newMember, newMember.user.username.replace("🔇", "").trim());
        };
    }
};