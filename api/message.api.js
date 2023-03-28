const { rateLimit } = require("express-rate-limit");
const { Message } = require("../models/message.model");
const { SessionMiddleware } = require("../models/session.model");
const { CustomError } = require("../utils/errors");

const router = require("express").Router();

router.get("/messages", SessionMiddleware.requiresValidAuthExpress, async (req, res) => {
    try {
        if (!req.query || !req.query.from) throw new CustomError({ message: "Requête invalide.", error: "InvalidRequest" });

        const from = req.query.from;
        const mes = await Message.getMessages(from, 20);

        res.status(200).json(mes);
    } catch (error) {
        console.error(error);
        res.status(400).json(error.message || { message: "Une erreur est survenue.", error: "UnknownError" });
    }
});

router.post("/message", rateLimit({
    windowMs: 1000 * 15,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false
}), SessionMiddleware.requiresValidAuthExpress, async (req, res) => {
    try {
        if (!req.body || !req.body.content || typeof req.body.content != "string") throw new CustomError({ message: "Requête invalide.", error: "InvalidRequest" });

        const content = req.body.content.trim();
        const message = await Message.create(req.user._id, content);

        res.status(201).json(message);
    } catch (error) {
        console.error(error);
        res.status(400).json(error.message || { message: "Une erreur est survenue.", error: "UnknownError" });
    }
});

module.exports = router;