console.log("[ DiscordJS ] Handling events...");

module.exports = new Promise(async res => {
    const { readdirSync } = require("fs");
    const { resolve } = require("path");
    
    for (const file of readdirSync(resolve(__dirname, "../events"))) {
        let event = await require(resolve(__dirname, "../events", file));
        if (typeof event === "object") {
            if (typeof event.name === "string" && event.name.length > 0) event.name; else event = null;
            if (typeof event.once !== "boolean") event.once = false;
            if (typeof event.execute !== "function") event = null;
        } else if (typeof event === "function") {
            event.execute = event;
            event.name = file.split(".")[0];
            event.once = false;
        } else event = null;
        if (event !== null) global.client.on(event.name, event.execute);
    };
    console.log("[ DiscordJS ] Listening to all events.");
    return res(null);
});