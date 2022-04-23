module.exports = {
    name: "guildMemberRemove",
    async execute(member) {
        if (member.user.bot) return;
        if (member.user.id == process.env.TEST_ACCOUNT_ID) return;
        const { userAvatar, random, send } = global;
        const { user, guild } = member;
        
        const leftPhrases = [
            `${user.username} deixou nossa Rede. Espero que um dia ele(a) volte!`,
            `${user.username} abandonou nosso navio, infelizmente não sabia nadar e foi devorado por tubarões...`,
            `Batalhão, temos um soldado ferido! Deem adeus à ${user.username}...`
        ];
        const goodbyeChannel = guild.channels.cache.get(process.env.GOODBYE_CHANNEL);
        if (goodbyeChannel) return await send(goodbyeChannel, { embeds: [ embed({
            author: { text: `${user.tag}`, image: userAvatar(member.user) },
            title: `💨 Um Membro Saiu de nossa Rede`,
            description: leftPhrases[random(0, leftPhrases.length - 1)]
        })]});
    }
};