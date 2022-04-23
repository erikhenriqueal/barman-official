const emit = (item, cleanOptions) => {
    if (typeof item != "object") return item;
    if (!cleanOptions) cleanOptions = {};
    else if (cleanOptions === true) cleanOptions = { emptyStrings: true, emptyArrays: true, emptyObjects: true, falseBooleans: true, zeros: true };
    const clearValues = value => {
        if ([null, undefined].includes(value)) return null;
        else if (cleanOptions.emptyStrings && typeof value === "string" && value.length === 0) return null;
        else if (cleanOptions.falseBooleans && value === false) return null;
        else if (typeof value == "object") {
            if (cleanOptions.emptyArrays && value.length === 0) return null;
            if (cleanOptions.emptyObjects && Object.keys(value).length === 0) return null;
            return emit(value, cleanOptions);
        } else if (cleanOptions.zeros && value == 0) return null;
        else return value;
    };
    if (Array.isArray(item)) {
        const cleanItem = [];
        for (const value of item) {
            const clearValue = clearValues(value);
            if (clearValue != null) cleanItem.push(clearValue);
        };
        return cleanItem;
    } else if (String(item).includes("object")) {
        const cleanItem = {};
        for (const key in item) {
            const value = item[key];
            const clearValue = clearValues(value);
            if (clearValue !== null) cleanItem[key] = clearValue;
        };
        return cleanItem;
    } else return item;
};

module.exports = emit;