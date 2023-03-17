

/* database */
const mongoose = require("mongoose");
mongoose.connect(process.env.DB, { dbName: process.env.DB_NAME });

/* constantes */
const PORT = 9600;

/* express */
const express = require("express");
const app = express();

/* middleware */
const bodyParser = require('body-parser');
app.use(bodyParser.json());
const cookieParser = require('cookie-parser');
app.use(cookieParser());

const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

/* server */
server.listen(PORT, () => {
    console.log("Serveur lancé sur le port: " + PORT);
});

module.exports = { app, io };