module.exports = (timestamp, toFixed = 2) => {
    const milisseconds = timestamp;
    const seconds = (milisseconds / 1000).toFixed(!isNaN(toFixed) ? parseInt(toFixed) : 2);
    const minutes = (seconds / 60).toFixed(!isNaN(toFixed) ? parseInt(toFixed) : 2);
    const hours = (minutes / 60).toFixed(!isNaN(toFixed) ? parseInt(toFixed) : 2);
    const days = (hours / 24).toFixed(!isNaN(toFixed) ? parseInt(toFixed) : 2);
    if (days >= 1) return days + " dia" + (days == 0 || days > 1 ? "s" : "");
    if (hours >= 1) return hours + " hora" + (hours == 0 || hours > 1 ? "s" : "");
    if (minutes >= 1) return minutes + " minuto" + (minutes == 0 || minutes > 1 ? "s" : "");
    if (seconds >= 1) return seconds + " segundo" + (seconds == 0 || seconds > 1 ? "s" : "");
    if (milisseconds >= 1) return milisseconds + " milissegundo" + (milisseconds == 0 || milisseconds > 1 ? "s" : "");
};