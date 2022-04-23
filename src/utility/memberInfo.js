module.exports = member => {
    const { ADMIN_ROLE, DEVELOPER_ROLE, DEVELOPER_ID } = process.env;
    const { guild } = global;
    const author = {};
    author.admin = member.roles.cache.some(r => r.permissions.toArray().includes("ADMINISTRATOR") || r.id == ADMIN_ROLE);
    author.developer = member.roles.cache.some(r => r.id == DEVELOPER_ROLE) || member.id == DEVELOPER_ID;
    author.owner = member.id == guild.ownerId;
    return author;
};