module.exports = new Promise(async res => {
    console.log("[ DiscordJS ] Handling utilities...");
    
    const { readdirSync } = require("fs");
    const { resolve } = require("path");
    
    for (const file of readdirSync(resolve(__dirname, "../utility"))) {
        const item = await require(resolve(__dirname, "../utility", file));
        global[file.split(".")[0]] = item;
    };
    return res(null);
});