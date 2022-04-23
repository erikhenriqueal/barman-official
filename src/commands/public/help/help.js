module.exports = {
    status: "active",
    name: "ajuda",
    aliases: ["help"],
    description: "Mostra algumas informações sobre todas as funções de nosso Sistema, incluindo comandos e variados.",
    uses: [
        "| Cria uma breve descrição sobre meus sistemas atualmente ativos ou em desenvolvimento.",
        "comando <nome> | Cria um bloco informativo sobre o comando requisitado.",
        "comando todos | Cria um menu com todas as informações de cada comando para você.",
        "comandos | Lista todos os comandos disponíveis para você.",
        "projetos | Cria uma lista com nossos projetos futuros e uma breve descrição sobre cada um.",
    ],
    once: true,
    channels: [ process.env.COMMANDS_CHANNEL ],
    cooldown: 15000,
    execute: ({ message, commandName, args }) => new Promise(async res => {
        const { prefix, embed, commands, reply, edit, deleteMessage, makeOnceMessage, userAllowed, userAvatar, memberInfo } = global;
        const author = memberInfo(message.member);
        const userCommands = commands.filter(c => {
            if (userAllowed(message.author.id, c.name, message.channel.id)) {
                const parent = message.channel.parent;
                if (parent && (parent.name.toLowerCase().includes("staff") || parent.id == process.env.STAFF_CATEGORY)) return c;
                else if (["active", "maintenance", "off"].includes(c.status)) return c;
            };
        }).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
        userCommands.select = commands.select;
        const done = async p => {
            if (typeof p === "function") await p();
            else if (p) await p;
            return res("done");
        };
        if (args.length > 0) args = args.map(a => a.toLowerCase());

        const createCommandMenu = command => {
            const fields = [
                { name: "🔧 Comando", value: `${command.name} ${command.aliases.length > 0 ? `(${command.aliases.map(a => `_${a}_`).join(", ")})` : ""}` },
                { name: "🎯 Status", value: `${command.status == "active" ? "Ativo" : command.status == "hidden" ? "Oculto" : command.status == "maintenance" ? "Manutenção" : command.status == "private" ? "Privado" : command.status == "off" ? "Indisponível" : "Não encontrado"}` },
                { name: "📄 Descrição", value: command.description },
                command.uses.length > 0 ? { name: "📒 Utilidades", value: "\n" + command.uses.map(u => `• ${command.name} ${u}`).join("\n") } : null,
                command.channels.length > 0 ? { name: "🌐 Canais permitidos", value: command.channels.filter(c => /\d{17,19}/.test(c)).map(c => `<#${c}>`).join(", ") } : null,
                command.channelsBlacklist.length > 0 ? { name: "❌ Canais bloqueados", value: command.channelsBlacklist.filter(c => /\d{17}/.test(c)).map(c => `<#${c}>`).join(", ") } : null,
                command.whitelist.length > 0 ? { name: "👤 Permissões", value: command.whitelist.join(", ") } : null,
                command.blacklist.length > 0 ? { name: "👤 Lista negra", value: command.blacklist.join(", ") } : null,
                command.cooldown > 0 ? { name: "⏲️ Tempo de espera", value: command.cooldown > 60 * 60 * 1000 ? `${(command.cooldown / 60 / 60 / 1000).toFixed(2)} horas` : command.cooldown > 60 * 1000 ? `${(command.cooldown / 60 / 1000).toFixed(2)} minutos` : command.cooldown < 1000 ? `${command.cooldown} milissegundos` : `${(command.cooldown / 1000).toFixed(2)} segundos` } : null
            ];
            return fields.filter(f => f != null).map(f => `**${f.name}:** ${f.value}`).join("\n");
        };

        if (["command", "comando"].includes(args[0])) {
            if (["todos", "all"].includes(args[1])) {
                if (userCommands.size > 1) {
                    let commandIndex = 1;
                    const newPage = () => {
                        const command = userCommands.at(commandIndex - 1);
                        return embed({
                            author: { text: `De ${message.author.tag}`, image: userAvatar(message.author) },
                            title: `📋 Sobre o comando ${command.name.charAt(0).toUpperCase() + command.name.slice(1).toLowerCase()}`,
                            description: createCommandMenu(command) + "\n\n❗ Aviso: Esta mensagem será apagada após 1 minuto de inatividade.",
                            footer: global.embedDefaults.footer + ` (${commandIndex}/${userCommands.size})`
                        });
                    };
                    let msg = await reply(message, { embeds: [ newPage() ]});
                    const collector = msg.createReactionCollector({ filter: (r, u) => u.id == message.author.id && ["⏮️", "◀️", "▶️", "⏭️", "❌"].includes(r.emoji.name), idle: 6e4 });
                    collector.on("collect", async (reaction, user) => {
                        const previousPage = commandIndex;
                        await reaction.users.remove(user.id);
                        if (reaction.emoji.name == "⏮️") commandIndex = 1;
                        else if (reaction.emoji.name == "◀️") {
                            if (commandIndex > 1) commandIndex -= 1;
                            else commandIndex = userCommands.size;
                        } else if (reaction.emoji.name == "▶️") {
                            if (commandIndex < userCommands.size) commandIndex += 1;
                            else commandIndex = 1;
                        } else if (reaction.emoji.name == "⏭️") commandIndex = userCommands.size;
                        else if (reaction.emoji.name == "❌") return collector.stop("canceled");
                        if (previousPage != commandIndex) msg = await edit(msg, { embeds: [ newPage() ]});
                    });
                    collector.on("end", async () => await done(await deleteMessage(msg)));
                    for (const emoji of ["⏮️", "◀️", "▶️", "⏭️", "❌"]) await msg.react(emoji);
                } else {
                    const command = userCommands.first();
                    const menu = createCommandMenu(command);
                    return await makeOnceMessage(await reply(message, { embeds: [ embed({
                        author: { text: `De ${message.author.tag}`, image: userAvatar(message.author) },
                        title: `📋 Sobre o comando ${command.name.charAt(0).toUpperCase() + command.name.slice(1).toLowerCase()}`,
                        description: menu + "\n\n❗ Aviso: Esta mensagem será apagada em 1 minuto."
                    })]}), message.author.id, 6e4, res);
                };
            } else {
                if (!args[1]) return done(deleteMessage(await reply(message, { embeds: [ embed({
                    author: { text: `De ${message.author.tag}`, image: userAvatar(message.author) },
                    title: "❓ Sistema de Ajuda - Comando não definido",
                    description: `${message.author.username}, você deve especificar o comando que deseja utilizando **${prefix}${commandName} comando <nome do comando>**, ou utilizar **${prefix}${commandName} comando todos** para criar um menu interativo com todos os comandos que você pode acessar.`
                })]}), 15000));
                const command = userCommands.select(args[1]);
                if (!command || (command.status == "maintenance" && !author.developer) || (command.status == "private" && !(author.developer || author.admin))) return done(deleteMessage(await reply(message, { embeds: [ embed({
                    author: { text: `De ${message.author.tag}`, image: userAvatar(message.author) },
                    title: "❓ Sistema de Ajuda - Comando desconhecido",
                    description: `Desculpe ${message.author.username}, não encontrei o comando \`${args[1]}\` em meu sistema.\nVocê pode acessar os comandos disponíveis para você utilizando **${prefix}${commandName} comandos**, ou ver informações sobre um determinado comando utilizando **${prefix}${commandName} comando <nome do comando>**.`
                })]}), 15000));
                const menu = createCommandMenu(command);
                return await makeOnceMessage(await reply(message, { embeds: [ embed({
                    author: { text: `De ${message.author.tag}`, image: userAvatar(message.author) },
                    title: `📋 Sobre o comando ${args[1].charAt(0).toUpperCase() + args[1].slice(1).toLowerCase()}`,
                    description: menu + "\n\n❗ Aviso: Esta mensagem será apagada em 1 minuto."
                })]}), message.author.id, 6e4, res);
            };
        } else if (["command", "comandos"].includes(args[0])) {
            let page = 1;
            const newPage = () => embed({
                author: { text: `De ${message.author.username}`, image: userAvatar(message.author) },
                title: "❓ Sistema de Ajuda - Lista de Comandos Disponíveis",
                description: `Olá <@${message.author.id}> 👋\nVejo que precisa de ajuda com meus comandos, sem problemas!${userCommands.size > 10 ? "\nUtilizando os emojis abaixo desta mensagem, você pode controlar a página atual, cada página mostra até 10 comandos disponíveis." : ""}\nAqui está minha lista de comandos disponíveis para você, caso precise de informações mais precisas sobre um comando em específico, utilize **${prefix}${commandName} comando <nome do comando>**.`,
                fields: [{ name: "📒 Comandos", value: userCommands.toJSON().slice((page - 1) * 10, page * 10).map(c => `• ${c.status === "maintenance" ? `__${c.name}__ *` : c.status === "off" ? `~~${c.name}~~ *` : c.name}${c.aliases.length > 0 ? ` (${c.aliases.map(a => `_${a}_`).join(", ")})` : ""}`).join("\n") + `\n\n❗ Aviso: esta mensagem será excluída após 1 minuto${userCommands.size > 10 ? " de inatividade" : ""}.` }],
                footer: global.embedDefaults.footer + (userCommands.size > 10 ? ` (${page}/${(userCommands.size / 10).toFixed(0)})` : "")
            });
            let msg = await reply(message, { embeds: [newPage()]});
            if (userCommands.size > 10) {
                const collector = msg.createReactionCollector({ filter: (r, u) => ["⏮️", "◀️", "▶️", "⏭️", "❌"].includes(r.emoji.name) && u.id === message.author.id, idle: 6e4 });
                collector.on("collect", async (reaction, user) => {
                    const previousPage = page;
                    const maxPages = Math.ceil(userCommands.size / 10);
                    await reaction.users.remove(user.id);
                    if (reaction.emoji.name == "⏮️") page = 1;
                    else if (reaction.emoji.name == "◀️") {
                        if (page > 1) page -= 1;
                        else page = maxPages;
                    } else if (reaction.emoji.name == "▶️") {
                        if (page < maxPages) page += 1;
                        else page = 1;
                    } else if (reaction.emoji.name == "⏭️") page = maxPages;
                    else if (reaction.emoji.name == "❌") return collector.stop("canceled");
                    if (previousPage != page) msg = await edit(msg, { embeds: [ newPage() ]});
                });
                collector.on("end", async () => await done(await deleteMessage(msg)));
                for (const emoji of ["⏮️", "◀️", "▶️", "⏭️", "❌"]) await msg.react(emoji);
            } else return await makeOnceMessage(msg, message.author.id, 6e4, done);
        } else if (["projetos", "projects"].includes(args[0])) return await makeOnceMessage(await reply(message, { embeds: [ embed({
            author: { text: `De ${message.author.username}`, image: userAvatar(message.author) },
            title: "❓ Sistema de Ajuda - Projetos",
            description: `Opa <@${message.author.id}>, fico feliz em saber que você se interessa pelos nossos futuros projetos! Abaixo, deixei uma listinha com um gostinho do que cada um deles pode acrescentar em nossa comunidade, espero que goste.`,
            fields: [
                { name: "🪙 Economia", value: "• Basicamente, você receberá **coins** ao interagir nos canais de texto, ajudar membros com dificuldade, reportar *bugs*, e participar de nossos eventos. Esses coins poderão ser utilizados futuramente para adquirir cosméticos/colecionáveis em nossa loja." },
                { name: "🎧 Rádio", value: "• Estamos desenvolvendo também sistemas musicais com diversos atributos que em outros sistemas são considerados \"premium\", porém, disponibilizaremos esses mesmos sistemas sem precisas pagar nada, apenas por entretenimento." },
                { name: "🛒 Loja", value: "• Como dito na sessão Economia, teremos um sistema econômico em nossa rede, logo, esse dinheiro tem que ir para algum lugar. Em nossa loja você poderá adquirir itens colecionáveis, cargos superiores e cores personalizadas, nickname customizável, insígnias, entre outros benefícios em nossa rede." }
            ]
        })]}), message.author.id, 2 * 6e4, res);
        else return await makeOnceMessage(await reply(message, { embeds: [ embed({
            author: { text: `De ${message.author.username}`, image: userAvatar(message.author) },
            title: "❓ Sistema de Ajuda Central",
            description: `Olá <@${message.author.id}>, como vai? Espero que bem!\nSe está aqui é porquê provavelmente tem alguma dúvida que gostaria de sanar sobre meu sistema, se for isso, é seu dia de sorte!\nAqui embaixo você encontra muitas (senão todas) das minhas funcionalidades, dá uma conferida e vê se isso responde suas dúvidas, se não, é só abrir um <#${process.env.TICKET_CHANNEL}> de suporte em nosso Servidor.`,
            fields: [
                { name: "🔧 Comandos", value: `• Se você entrou agora no nosso Servidor, alguns dos meus comandos estão disponíveis para você e podem ser acessados utilizando o comando **${prefix}${commandName} comandos**, onde todos os comandos disponíveis serão listados.` },
                { name: "🎯 Entretenimento", value: "• Além de mim, nossa rede conta com outros bots que nos ajudam justamente nessa questão. Alguns possuem rádios, outros minigames, miscelânia, e outras formas de entreter nossos membros. Futuramente, pretendemos adicionar nossos próprios minigames personalizados para sua melhor experiência!" },
                { name: "🪙 Economia", value: "• Este sistema ainda está em desenvolvimento, porém sim, nós teremos um sistema de economia! Claro que não vamos utilizar uma moeda real, somente a nossa própria, que funciona como um crédito social, onde quando você ajuda um usuário, ou frequentemente interage no nosso servidor, você é recompensado por aquilo." },
                { name: "🔰 Segurança", value: "• Nós nos preocupamos com nossa comunidade, então nossos sistemas possuem diversos meios de assegurar que nenhuma falha apareça, tais como: gerenciamento de usuários, registros de eventos, backups automáticos, e outros que por segurança não posso te dizer." }
            ]
        })]}), message.author.id, 2 * 6e4, res);
    })
};