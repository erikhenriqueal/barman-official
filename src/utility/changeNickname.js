module.exports = async (member, nickname) => {
    if (!member || typeof member.setNickname != "function") return;
    await member.setNickname(nickname).catch(async e => await global.log(resolve(process.cwd(), "src/internalLogs/errors", `util_${__filename}_${Date.now()}.log`), `Could not change ${member.user.tag}'s (${member.id}) nickname:\n${e}`, true));
};