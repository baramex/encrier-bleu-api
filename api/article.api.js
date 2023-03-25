const { Article } = require('../models/articles.model');

const router = require('express').Router();

router.get("/articles", async (req, res) => {
    try {
        if (!req.query) throw new Error({ message: "Requête invalide.", error: "InvalidRequest" });

        const { page, categories } = req.query;

        if ((page && (typeof page !== "string" || isNaN(Number(page)))) || (categories && typeof categories !== "string")) throw new Error({ message: "Requête invalide.", error: "InvalidRequest" });

        const poscat = categories.split(",").filter(a => !a.startsWith("-"));
        const negcat = categories.split(",").filter(a => a.startsWith("-")).map(a => a.substring(1));

        const articles = await Article.getByCategory(poscat, negcat).skip(page * 20).limit(20);

        res.status(200).json(articles);
    } catch (error) {
        console.error(error);
        res.status(400).json(error.message || { message: "Une erreur est survenue.", error: "UnknownError" });
    }
});

router.get("/article/:id", async (req, res) => {
    try {
        if (!req.params || !req.params.id) throw new Error({ message: "Requête invalide.", error: "InvalidRequest" });

        const id = req.params.id;

        const article = await Article.getById(id);
        if (!article) throw new Error({ message: "Article introuvable.", error: "ArticleNotFound" });

        res.status(200).json(article);
    } catch (error) {
        console.error(error);
        res.status(400).json(error.message || { message: "Une erreur est survenue.", error: "UnknownError" });
    }
});

module.exports = router;