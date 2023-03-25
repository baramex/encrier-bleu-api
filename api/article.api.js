const { Article } = require('../models/articles.model');

const router = require('express').Router();

router.get("/articles", async (req, res) => {
    try {
        if (!req.query) throw new Error({ message: "Requête invalide.", error: "InvalidRequest" });

        const { page, categories } = req.query;

        if ((page && typeof page !== "number") || (categories && typeof categories !== "string")) throw new Error({ message: "Requête invalide.", error: "InvalidRequest" });

        const poscat = categories.split(" ").filter(a => !a.startsWith("-"));
        const negcat = categories.split(" ").filter(a => a.startsWith("-")).map(a => a.substring(1));

        const articles = await Article.getByCategory({ $in: poscat, $nin: negcat }).skip(page * 20).limit(20);

        res.status(200).json(articles);
    } catch (error) {
        console.error(error);
        res.status(400).send(error.message || { message: "Une erreur est survenue.", error: "UnknownError" });
    }
});