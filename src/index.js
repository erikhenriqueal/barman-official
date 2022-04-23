"use strict";
require("dotenv").config();
const { resolve } = require("path");
const { statSync, existsSync } = require("fs");
const Discord = require("discord.js");
const client = new Discord.Client({ intents: Object.values(Discord.Intents.FLAGS) });

client.on("ready", async () => {
    console.log(`[ DiscordJS ] Connected as ${client.user.tag}.`);

    global.prefix = "b!";
    global.Discord = Discord;
    global.client = client;
    global.guild = client.guilds.cache.get(process.env.MAIN_GUILD);
    global.__az__ = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
    global.__09__ = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    global.embedDefaults = {
        color: "#fad311",
        color_red: "#fa1111",
        color_green: "#08fc5d",
        color_blue: "#4287f5",
        color_white: "#e6eff5",
        footer: `${global.guild.name ? global.guild.name : "ButecoGamer🍻"} © ${new Date().getUTCFullYear()}`
    };

    const processes = [
        {
            id: "utilities_handler",
            path: resolve(__dirname, "handlers/utility.js")
        }, {
            id: "commands_system",
            path: resolve(__dirname, "handlers/commands.js")
        }, {
            id: "events_handler",
            path: resolve(__dirname, "handlers/events.js")
        }, {
            id: "timers",
            path: resolve(__dirname, "systems/timers.js")
        }
    ];

    for (const options of processes) {
        try {
            let { id, path } = options;
            if (!id || String(id).length == 0 || !path || !existsSync(resolve(String(path)))) throw new Error("Could not identify a process.");
            if (processes.filter(p => p.id == id).length > 1) throw new Error(`Duplicates processes with ID "${id}" found.`);
            
            path = String(path);
            id = String(id);
            
            console.log(`Initializing "${path}"...`);
            if (statSync(path).isFile() && path.endsWith(".js")) await require(path);
        } catch (error) {
            throw new Error(error);
        };
    };
    
    client.user.setActivity({ type: "PLAYING", name: "Online novamente!" });
    
    setTimeout(() => {
        const defaultActivity = { type: "LISTENING", name: `@${client.user.username}` };
        client.user.setStatus("online");
        client.user.setActivity(defaultActivity);
        setInterval(() => {
            const tips = [
                // { type: "STREAMING", name: `Dica: utilize o comando secreto ${global.prefix}garçom para fazer um pedido utilizando seus pontos de experiência.` },
                // { type: "STREAMING", name: `Dica: interaja com as pessoas nos canais de texto para ganhar coins e utiliza-los em nossa loja!` },
                { type: "LISTENING", name: `${global.guild.memberCount} membros em nosso Servidor!` },
                { type: "PLAYING", name: `Deixe seu feedback sobre mim para o meu criador poder melhorar cada vez mais!` }
            ];
            client.user.setActivity(tips[global.random(0, tips.length)] || defaultActivity);
            setTimeout(() => client.user.setActivity(defaultActivity), 30000);
        }, 5 * 60 * 1000);
    }, 10000);
    
    console.log("[ System ] The system is ready and running.");
});

client.login(process.env.TOKEN);