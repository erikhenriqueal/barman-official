module.exports = {
    name: "guildMemberAdd",
    async execute(member) {
        const { db, random, send, userAvatar } = global;
        const { BOT_ROLE, MEMBER_ROLE, DEVELOPER_ROLE, WELCOME_CHANNEL, GUILD_INVITE, WHATSAPP_INVITE, RULES_CHANNEL, ALERTS_CHANNEL, NEWS_CHANNEL, PUBLIC_CHANNEL, MAIN_CHANNEL, MAIN_VOICE_CHANNEL, TEST_ACCOUNT_ID } = process.env;
        const { user, guild } = member;
        await member.roles.add(user.bot ? BOT_ROLE : MEMBER_ROLE);
        if (member.user.id === "850913914543013898") await member.roles.add(DEVELOPER_ROLE);
        if (!user.bot) {
            const userDB = await db.getUser(user.id, true);
            if (user.id == TEST_ACCOUNT_ID) return;
            const channel = guild.channels.cache.get(WELCOME_CHANNEL);
            if (!channel) return;

            const welcomePhrases = [
                `Olá ${user.username}! Seja muito bem vindo(a) à nossa Rede. Somos uma pequena comunidade de amigos e amigas onde costumamos conversar e jogar diariamente.`,
                `Que bom te conhecer ${user.username}! Apresento à você o ${guild.name}, uma pequena sociedade onde convivemos jogando e se divertindo, espero que se de bem com geral!`,
                `Muito legal te ver por aqui, ${user.username}! Espero que consiga socializar em nossa comunidade, nosso intuito é fazer você conhecer novas pessoas, fazer novas amizades, zoar e se divertir com todos nossos membros.`,
                `Saudações ${user.username}. Com muito prazer te convido à imergir em nosso Servidor. O ${guild.name} é uma comunidade de amigos e amigas, onde nos reunimos para jogar, conversar, e todo o resto, espero que goste!`
            ];

            const welcomeEmbed = embed({
                author: { text: `${user.tag}`, image: userAvatar(user) },
                title: `🚩 Membro Novo! Seja muito bem-vindo(a) ${user.username} ao ${guild.name}`,
                thumbnail: guild.iconURL({ dynamic: true }),
                description: `${welcomePhrases[random(0, welcomePhrases.length - 1)]}`,
                fields: [
                    { name: "📎 Links Relacionados:", value: `- 🔗 [Convite do Servidor](${GUILD_INVITE})\n- 📞 [WhatsApp Oficial](${WHATSAPP_INVITE})` },
                    { name: "🗺 Seções Importantes:", value: `- <#${RULES_CHANNEL}>\n- <#${ALERTS_CHANNEL}>\n- <#${NEWS_CHANNEL}>` },
                    { name: "🌐 Comunidade:", value: `- <#${PUBLIC_CHANNEL}> 📝\n- <#${MAIN_CHANNEL}> 📝\n- <#${MAIN_VOICE_CHANNEL}> 🔊` }
                ],
                image: guild.bannerURL({ size: "600" }),
                footer: { text: "Obrigado por entrar!", image: userAvatar(user) }
            });
            
            return await send(channel, { content: user.toString(), embeds: [ welcomeEmbed ] });
        };
    }
};