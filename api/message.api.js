const { Message } = require("../models/message.model");
const { SessionMiddleware } = require("../models/session.model");

const router = require("express").Router();

app.get("/api/messages", SessionMiddleware.requiresValidAuthExpress, async (req, res) => {
    try {
        if (!req.query || !req.query.from) throw new Error({ message: "Requête invalide.", error: "InvalidRequest" });

        const from = req.query.from;
        const mes = await Message.getMessages(from, 20);

        res.status(200).json(mes);
    } catch (error) {
        console.error(error);
        res.status(400).send(error.message || { message: "Une erreur est survenue.", error: "UnknownError" });
    }
});

app.post("/api/message", rateLimit({
    windowMs: 1000 * 15,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false
}), Middleware.requiresValidAuthExpress, async (req, res) => {
    try {
        if (!req.body || !req.body.content || typeof req.body.content != "string") throw new Error({ message: "Requête invalide.", error: "InvalidRequest" });

        const content = req.body.content.trim();
        const message = await Message.create(req.user._id, content);

        res.status(201).json(message);
    } catch (error) {
        console.error(error);
        res.status(400).send(error.message || { message: "Une erreur est survenue.", error: "UnknownError" });
    }
});

module.exports = router;