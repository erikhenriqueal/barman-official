module.exports = (characters = [], wordSize = 0) => {
    if (!Array.isArray(characters) || typeof wordSize != "number") return "";
    const random = require("./random.js");
    let word = "";
    for (let i = 0; i < wordSize; i++) word += String(characters[random(0, characters.length - 1)]);
    return word.replace(/\s/g, "");
};