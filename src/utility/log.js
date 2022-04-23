module.exports = async function(path, content, consoleView = false) {
    if (!path || !content) throw new Error("[ Utils - Log ] You must provide the path and content parameters.");
    const { writeFileSync, readFileSync, existsSync, statSync } = require("fs");
    const { resolve, basename } = require("path");
    const fileDir = resolve(path);
    if (!existsSync(fileDir)) await writeFileSync(fileDir, "");
    else if (existsSync(fileDir) && !statSync(fileDir).isFile()) throw new Error(`[ Utils - Log ] The path "${fileDir}" must be a file.`);
    let fileContent = existsSync(fileDir) ? readFileSync(fileDir, { encoding: "utf-8" }).split("\n").filter(s => s.length > 0).join("\n") : "";
    if (typeof content === "string" && content.length > 0) fileContent += `${fileContent.endsWith("\n") ? "" : "\n"}`+ content + "\n";
    if (consoleView === true) console.log(content);
    await writeFileSync(fileDir, fileContent);
    return { file: basename(fileDir), path: fileDir, directory: resolve(...fileDir.split(/\/\\/g).reverse().slice(1).reverse()), content: fileContent };
};