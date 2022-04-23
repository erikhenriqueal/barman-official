module.exports = (value, step, unities, universal = false, round = false) => {
    if (typeof value !== "number" || typeof step !== "number" || !Array.isArray(unities)) return value;
    const numberParse = num => typeof num === "number" ? String(Number(num).toLocaleString(universal === true ? "us" : "br")).replace(/\s/g, ".") : num;
    unities = unities.filter(u => typeof u === "string");
    let newValue = value;
    let unity = unities[0] ? unities[0] : "";
    const result = () => `${numberParse(round === true ? Math.round(newValue) : newValue)}${unity}`;
    if (unities.length > 0) {
        unities.shift();
        for (let i = 0; i < unities.length; i++) {
            if (newValue < step) return result();
            unity = unities[i];
            if (newValue >= step) newValue = newValue / step;
        };
    };
    return result();
};