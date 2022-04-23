const { existsSync, statSync, readdirSync, readFileSync } = require("fs");
const { resolve } = require("path");

const pathReader = (path, options = { recursive: false, extensions: [".js", ".json"] }, callback) => new Promise(async res => {
    if (typeof path != "string") throw new Error("[ Utils - PathReader ] Path is required as a string.");
    const recursive = options && typeof options.recursive === "boolean" ? options.recursive : false;
    const extensions = options && Array.isArray(options.extensions) ? options.extensions.filter(ext => typeof ext === "string").map(ext => ext.startsWith(".") ? ext : `.${ext}`) : [".js", ".json"];
    if (extensions.length == 0) throw new Error("[ Utils - PathReader ] No valid extensions found");
    path = /[a-z]{1}:./i.test(path) ? resolve(path) : resolve(process.cwd(), path);
    if (!existsSync(path)) throw new Error("[ Utils - PathReader ] This path doesn't exists.");
    const result = [];
    for (const item of readdirSync(path)) {
        const itemPath = resolve(path, item);
        if (statSync(itemPath).isDirectory() && recursive === true) await pathReader(itemPath, { recursive, extensions }).then(r => result.push(...r));
        else if (statSync(itemPath).isFile() && extensions.some(ext => item.endsWith(ext))) {
            const object = { directory: path, path: itemPath, fileName: item.split(".")[0], content: ["json", "js"].includes(item.split(".").slice(1)) ? require(itemPath) : readFileSync(itemPath, "utf-8") };
            result.push(object);
            if (typeof callback === "function") callback(object);
        };
    };
    return res(result);
});

module.exports = pathReader;