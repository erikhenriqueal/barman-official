module.exports = body => {
    const ofType = (item, type) => type === "s" ? typeof item === "string" && item.length > 0 : type === "o" ? typeof item === "object" && !Array.isArray(item) : type === "a" ? typeof item === "object" && Array.isArray(item) : type === "b" ? typeof item === "boolean" : false;
    const parse = (item = "", type = "s", original = "") => ofType(item, type.charAt(0).toLowerCase()) ? item : original;
    const validateURL = string => /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/i.test(String(string)) ? String(string) : "";
    const { color, author, title, thumbnail, description, fields, image, timestamp, footer } = body;
    const embed = new (require("discord.js")).MessageEmbed();
    if (/#([a-f0-9]{2}){3}/i.test(String(color))) embed.setColor(String(color));
    else embed.setColor(global.embedDefaults.color);
    if (ofType(author, "s")) embed.setAuthor(author);
    else if (ofType(author, "o") && ofType(author.text, "s")) embed.setAuthor({ name: String(author.text), url: validateURL(author.url), iconURL: validateURL(author.image) });
    if (ofType(title, "s")) embed.setTitle(title);
    else if (ofType(title, "o")) {
        if (ofType(title.text, "s")) embed.setTitle(title.text);
        if (validateURL(title.url)) embed.setURL(title.url);
    };
    if (validateURL(thumbnail)) embed.setThumbnail(thumbnail);
    if (ofType(description, "s")) embed.setDescription(description);
    if (ofType(fields, "o")) embed.addField(parse(fields.name, "s"), parse(fields.value, "s"));
    else if (ofType(fields, "a")) embed.addFields(...fields.map(f => Object({ name: parse(f.name, "s"), value: parse(f.value, "s"), inline: parse(f.inline, "b", false) })));
    if (validateURL(image)) embed.setImage(image);
    if (String(Date.parse(timestamp)) !== "NaN") embed.setTimestamp(timestamp);
    else embed.setTimestamp();
    if (ofType(footer, "s")) embed.setFooter({ text: footer ? String(footer) : "Barman" });
    else if (ofType(footer, "o") && ofType(footer.text, "s")) embed.setFooter({ text: String(footer.text), iconURL: validateURL(footer.image) });
    else embed.setFooter({ text: global.embedDefaults.footer ? String(global.embedDefaults.footer) : "Barman" });
    return embed;
};