const { ObjectId } = require('mongodb');
const { Article } = require('../models/articles.model');
const { CustomError } = require('../utils/errors');

const router = require('express').Router();

router.get("/articles", async (req, res) => {
    try {
        if (!req.query) throw new CustomError({ message: "Requête invalide.", error: "InvalidRequest" });

        const { page, categories } = req.query;

        if ((page && (typeof page !== "string" || isNaN(Number(page)))) || (categories && typeof categories !== "string")) throw new CustomError({ message: "Requête invalide.", error: "InvalidRequest" });

        const poscat = categories?.split(",").filter(a => !a.startsWith("-"));
        const negcat = categories?.split(",").filter(a => a.startsWith("-")).map(a => a.substring(1));

        const articles = await Article.getByCategory(poscat, negcat).skip((page || 0) * 10).limit(10);

        res.status(200).json(articles);
    } catch (error) {
        console.error(error);
        res.status(400).json(error.message || { message: "Une erreur est survenue.", error: "UnknownError" });
    }
});

router.get("/article/:id", async (req, res) => {
    try {
        if (!req.params || !req.params.id || !ObjectId.isValid(req.params.id)) throw new CustomError({ message: "Requête invalide.", error: "InvalidRequest" });

        const id = req.params.id;

        const article = await Article.getById(id);
        if (!article) throw new CustomError({ message: "Article introuvable.", error: "ArticleNotFound" });

        res.status(200).json(article);
    } catch (error) {
        console.error(error);
        res.status(400).json(error.message || { message: "Une erreur est survenue.", error: "UnknownError" });
    }
});

router.get("/articles/pageCount", async (req, res) => {
    try {
        if (!req.query) throw new CustomError({ message: "Requête invalide.", error: "InvalidRequest" });

        const { categories } = req.query;

        if (categories && typeof categories !== "string") throw new CustomError({ message: "Requête invalide.", error: "InvalidRequest" });

        const poscat = categories?.split(",").filter(a => !a.startsWith("-"));
        const negcat = categories?.split(",").filter(a => a.startsWith("-")).map(a => a.substring(1));

        const articles = await Article.getByCategory(poscat, negcat).count();

        res.status(200).json(Math.ceil(articles / 10));
    } catch (error) {
        console.error(error);
        res.status(400).json(error.message || { message: "Une erreur est survenue.", error: "UnknownError" });
    }
});

module.exports = router;