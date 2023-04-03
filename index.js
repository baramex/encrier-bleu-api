/* config */
require("dotenv").config();

const { SessionMiddleware } = require("./models/session.model");
const { app, io } = require("./server");
const cookie = require("cookie");

/* routes */
app.use("/api",
    require("./api/user.api"),
    require("./api/authentification.api"),
    require("./api/message.api"),
    require("./api/article.api")
);

app.get("*", (req, res) => {
    res.sendFile("index.html", { root: __dirname + "/public" });
});

io.on("connection", (socket) => {
    SessionMiddleware.checkValidAuth(cookie.parse(socket.handshake.headers.cookie)).then(result => {
        socket.user = result.user._id;

        socket.join(["authenticated", "userid:" + result.user._id.toString()]);

        socket.emit("connected");
    }).catch(e => {
        console.error(e);
        socket.disconnect(true);
    });
});