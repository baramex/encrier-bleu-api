const { default: axios } = require("axios");
const { Schema, model } = require("mongoose");
const { scheduleJob } = require("node-schedule");

const articleSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String },
    content: { type: String, required: true },
    link: { type: String, required: true },
    category: { type: [String], required: true, default: [] },
    keywords: { type: [String], default: [] },
    creator: { type: [String], default: [] },
    image_url: { type: String },
    video_url: { type: String },
    source_id: { type: String },
    country: { type: [String], required: true, default: [] },
    language: { type: [String], required: true, default: [] },
    pubDate: { type: Date, required: true },
    date: { type: Date, default: Date.now, required: true }
});

const articleModel = model("Article", articleSchema, "articles");

class Article {
    static create(title, description, content, link, category, keywords, country, language, pubDate, creator, image_url, video_url, source_id) {
        return articleModel.create({ title, description, content, link, category, keywords, creator, image_url, video_url, source_id, country, language, pubDate });
    }

    static getByCategory(categories, negcat) {
        const query = {};
        if (categories && categories.length > 0) query.$in = categories;
        if (negcat && negcat.length > 0) query.$nin = negcat;
        return articleModel.find({ category: query }, {}).sort({ date: -1 });
    }

    static getById(id) {
        return articleModel.findById(id, {});
    }

    static async pickupArticle(category) {
        const articles = await axios.get("https://newsdata2.p.rapidapi.com/news", {
            params: {
                category,
                language: "fr"
            },
            headers: {
                "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
                "X-RapidAPI-Host": "newsdata2.p.rapidapi.com"
            }
        });

        const article = articles.data?.results?.[0];
        if (!article) return;

        const lastArticle = await articleModel.findOne({ category: category ? { $all: [category] } : { $nin: ["business"] } }, {}, { sort: { pubDate: -1 } });

        if (!lastArticle || new Date(article.pubDate).getTime() > lastArticle.pubDate.getTime()) {
            const { title, description, content, link, keywords, creator, video_url, image_url, source_id, category, country, language } = article;
            return await Article.create(title, description, content, link, category, keywords, country, language, new Date(article.pubDate), creator, image_url, video_url, source_id);
        }
    }

    static async update() {
        const categories = [undefined, "business"];
        for (const category of categories) {
            await Article.pickupArticle(category).catch(console.error);
        }
    }
}

scheduleJob("0 */12 * * *", () => {
    Article.update().catch(console.error);
});

module.exports = { Article };