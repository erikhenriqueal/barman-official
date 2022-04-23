module.exports = function (min, max, float = false) {
    if (isNaN(min) || isNaN(max)) return 0;
    if (max < min) min = max;
    const random = Math.random() * (max - min) + min;
    return float == false ? Math.round(random) : random;
};