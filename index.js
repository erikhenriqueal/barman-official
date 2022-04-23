"use strict";
require("dotenv").config();
const { resolve } = require("path");
const { existsSync, statSync, mkdirSync, readFileSync, writeFileSync } = require("fs");

createApplication();

function createApplication() {
    async function reload(message, { code, error }) {
        try {
            console.log(code);
            if (Number(code) !== 1395271) {
                log(message);
                await applicationReport({ code, error });
            } else log("Reloading the application...");
            application.kill();
            return createApplication();
        } catch (err) {
            log(`Received an error on try to reload application.\n${`- Previous data:${message ? "-- Message: " + message : ""}${code ? "-- Code: " + code : ""}${error ? "-- Error: " + error : ""}`}\n\n${err}`);
        };
    };
    const logData = data => log(String(data).slice(0, String(data).length - 1));

    const application = require("child_process").exec(`node "${resolve(__dirname, "src/index.js")}"`, { cwd: process.cwd() });
    application.on("error", async error => await reload(`Received an error from application:\n${error}`, { error }));
    application.on("exit", async code => await reload(`Exiting application with code ${code}.`, { code }));
    application.stdout.on("data", logData);
    application.stderr.on("data", logData);
};
async function applicationReport(options = { error: null, code: null }) {
    const Discord = require("discord.js");
    const client = new Discord.Client({ intents: Object.values(Discord.Intents.FLAGS) });
    await client.once("ready", async client => {
        const channels = [
            {
                type: "user",
                id: "897291486285156362"
            }
        ];
        
        for (const channel of channels) {
            const id = String(channel.id);
            const type = String(channel.type).toLowerCase();
            if (!/\d{17,19}/.test(id) || !["user", "channel"].includes(type)) return;
            let name = "";
            try {
                const guild = await client.guilds.cache.find(async guild => await guild[type === "channel" ? "channels" : "members"].fetch(id));
                if (!guild) return;
                const target = guild[type === "channel" ? "channels" : "members"].cache.get(id);
                if (!target) return;
                name = type === "channel" ? target.name : target.user.tag;
                await target.send(`> Erro inesperado recebido.${options.code !== 1 ? `\n> Código: ${options.code}` : ""}${options.error ? `\`\`\`${options.error}\`\`\`` : ""}\n${type === "channel" ? "> ||@here||" : ""}`);
            } catch (error) { log(`Unable to send message in ${name && name.length > 0 ? `${name} (${id}, ${type})` : `${id} (${type})`}:\n${error}\nError code previously received: ${options.code || "none"}`) };
        };
        return client.destroy();
    });
    return await client.login(process.env.TOKEN);
};
function log(message) {
    console.log(message);
    const timestamps = new Date();
    timestamps.setHours(timestamps.getHours());
    const weekDays = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const filename = `${timestamps.toLocaleDateString("br").replaceAll("/", "-")}_${weekDays[timestamps.getDay()]}.log`;
    const logsPath = resolve(process.cwd(), "logs");
    const logsFile = resolve(logsPath, filename);
    let logs = "";
    if (!existsSync(logsPath) || !statSync(logsPath).isDirectory()) mkdirSync(logsPath);
    if (existsSync(logsFile) && statSync(logsFile)) logs += readFileSync(logsFile, "utf-8");
    if (!logs.endsWith("\n")) logs += "\n";
    if (logs.startsWith("\n")) logs = logs.slice(1);
    logs += String(message).split("\n").map(str => `[${timestamps.toLocaleTimeString("br")}] ${str}\n`).join("");
    return writeFileSync(logsFile, logs);
};