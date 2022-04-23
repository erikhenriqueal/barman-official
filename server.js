const express = require("express");
const app = express();

let logtimes = 0;

app.get("/ping", (req, res) => {
    const date = new Date();
    logtimes += 1;
    console.log(`[ Uptime Ping ] Pinged at ${date.toLocaleString("br")}`);
});

app.listen(8080, () => console.log(`[ Server ] Server started on port 8080`));