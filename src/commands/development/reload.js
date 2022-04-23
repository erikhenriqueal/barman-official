module.exports = {
    status: "private",
    name: "reiniciar",
    aliases: ["reload", "rl"],
    description: "Reinicia meu sistema (apenas para desenvolvimento).",
    channels: [ "831173861898846208" ],
    whitelist: [ process.env.DEVELOPER_ID ],
    async execute({ message }) {
        const { client, reply, edit, embed, userAvatar } = global;
        const { color_blue } = global.embedDefaults;
        let msg = await reply(message, { embeds: [ embed({
            title: ":arrows_counterclockwise: Reiniciar aplicação - Confirmar",
            description: `<@${message.author.id}>, tem certeza que deseja reiniciar a aplicação? Isso fará com que meus arquivos sejam atualizados, e se houver algum erro, não vou conseguir iniciar para reportá-lo!`
        })]});
        const collector = msg.createReactionCollector((r, u) => ["✅", "❌"].includes(r.emoji.name) && u.id == message.author.id, { idle: 60e3 });
        collector.on("collect", async r => {
            if (r.emoji.name === "❌") return collector.stop();
            else {
                await edit(msg, { embeds: [ embed({ color: color_blue, title: ":arrows_counterclockwise: Reiniciando aplicação...", description: `Meu sistema será reinciado e logo estará pronto para ser utilizado novamente.\nDica: minha **atividade** será definida como "Jogando **Online novamente!**" quando eu estiver com os sistemas novamente disponíveis.`, footer: { text: `Por ${message.author.tag} (${message.author.id})`, image: userAvatar(message.author)}})]});
                await client.user.setStatus("idle");
                await client.user.setActivity({ type: "PLAYING", name: "Reiniciando sistema..." });
                await client.user.setAFK(true);
                return process.exit(1395271);
            };
        });
        collector.on("end", async () => {
            await msg.reactions.removeAll();
            await edit(msg, { embeds: [ embed({
                title: ":arrows_counterclockwise: Reiniciar aplicação - Cancelado",
                description: `<@${message.author.id}, como você não confirmou a reinicialização, meu sistema continua funcionando como antes.`
            })]});
        });
        await msg.react("✅");
        await msg.react("❌");
    }
};