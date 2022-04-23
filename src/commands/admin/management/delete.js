module.exports = {
    status: "active",
    name: "deletar",
    aliases: ["delete", "excluir", "del"],
    description: "Excluí uma determinada quantia de mensagens no seu canal atual.",
    uses: [
        "<quantia> | A quantia deve ser um número a entre 1 e 100. Lembre-se, a mensagem do comando não conta!"
    ],
    args: true,
    once: true,
    channelsBlacklist: [ process.env.LOGS_CHANNEL ],
    whitelist: [ "MANAGE_MESSAGES" ],
    execute: ({ message, args }) => new Promise(async res => {
        const done = () => res("done");
        const amount = isNaN(args[0]) ? null : Math.floor(Number(args[0]));
        const { send, reply, deleteMessage, embed, embedDefaults } = global;
        const { color_red, color_blue, color_green } = embedDefaults;
        if (isNaN(amount) || (amount < 1 || amount > 100)) return done(deleteMessage(await reply(message, { embeds: [ embed({
            color: color_red,
            title: "🗑️ Deletar Mensanges - Quantia Inválida",
            description: `<@${message.author.id}>, a quantia definida deve ser um valor **numérico** de **1** à **100**.`
        })]}), 10000));
        
        await message.delete();
        
        await message.channel.bulkDelete(amount, true).then(async messages => {
            if (messages.size === 0) return done(await deleteMessage(await send(message.channel, { embeds: [ embed({
                color: color_blue,
                title: "🗑️ Deletar Mensagens - Nenhuma mensagem excluída",
                description: `Não pude excluir as mensagens anteriores pois as mesmas foram enviadas há mais de 14 dias.`
            })]}), 10000));
            return done(await deleteMessage(await send(message.channel, { embeds: [ embed({
                color: color_green,
                title: "🗑️ Deletar Mensagens - Mensagens excluídas",
                description: `Foram excluídas ${messages.size} mensagens deste canal.\nComando executado por <@${message.author.id}>`
            })]}), 10000));
        }).catch(async error => {
            await done(deleteMessage(await send(message.channel, { embeds: [ embed({
                color: color_red,
                title: "🗑️ Deletar Mensagens - Falha na operação",
                description: `<@${message.author.id}>, desculpe, mas recebi um erro ao tentar excluir as mensagens. Abaixo listei alguns dos possíveis erros:\n• As mensagens anteriores foram enviadas há mais de 14 dias.\n• Eu não tenho permissão para excluir mensagens neste canal.\n\nEste erro foi registrado em nosso sistema, você pode visualizá-lo em nossa categoria privada para a equipe administrativa.`
            })]}), 10000));
            error.__sendConfirmationMessage__ = true;
            throw new Error(error);
        });

    })
};