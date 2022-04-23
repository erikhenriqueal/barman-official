this.getUsers = async () => {
    return await global.query("SELECT * FROM `users`");
};
this.getUser = async (id, forceInsert = false) => {
    if (typeof id != "string" || !/\d{17,19}/.test(String(id))) return;
    await verifyDatabaseIntegrit();
    const users = await this.getUsers();
    if (!users.some(u => u.id == id) && forceInsert === true) await this.setUser(id);
    return (await this.getUsers()).find(u => u.id == id);
};
this.setUser = async (id, fields) => {
    if (typeof id != "string" || !/\d{17,19}/.test(String(id))) return;
    await verifyDatabaseIntegrit();
    const users = await this.getUsers();
    if (users.some(u => u.id == id)) return await this.editUser(id, fields, false);
    fields = {
        coins: fields && typeof fields.coins === "number" && Number.isInteger(fields.coins) ? fields.coins : 0,
        punishments: fields && String(Array.isArray(fields.punishments) ? JSON.stringify(fields.punishments) : Array.isArray(JSON.parse(fields.punishments)) ? fields.punishments : "[]").replaceAll("'", "\"")
    };
    await global.query(`INSERT INTO \`users\` (\`id\`, \`coins\`, \`punishments\`) VALUES ("${id}", ${fields.coins}, '${fields.punishments}')`);
    return await this.getUser(id);
};
this.editUser = async (id, fields, forceInsert) => {
    if (typeof id != "string" || !/\d{17,19}/.test(String(id)) || !(typeof fields == "object" && !Array.isArray(fields))) return;
    await verifyDatabaseIntegrit();
    const users = await this.getUsers();
    if (!users.some(u => u.id == id) && forceInsert === true) await this.setUser(id, fields);
    const user = await this.getUser(id);
    if (!user) return;
    fields = {
        id: typeof fields.id === "string" && /\d{17,19}/.test(fields.id) ? fields.id : user.id,
        coins: typeof fields.coins === "number" && Number.isInteger(fields.coins) ? fields.coins : user.coins,
        punishments: String(Array.isArray(fields.punishments) ? JSON.stringify(fields.punishments) : Array.isArray(JSON.parse(fields.punishments)) ? fields.punishments : user.punishments).replaceAll("'", "\"")
    };
    await global.query(`UPDATE \`users\` SET \`id\`="${fields.id}", \`coins\`=${fields.coins}, \`punishments\`='${fields.punishments}' WHERE \`id\`="${id}"`);
    return await this.getUser(fields.id);
};