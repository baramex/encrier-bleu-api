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
    tags: { type: [String], default: [] },
    creator: { type: [String], default: [] },
    image_url: { type: String },
    video_url: { type: String },
    source_id: { type: String },
    country: { type: [String], required: true, default: [] },
    language: { type: [String], required: true, default: [] },
    pubDate: { type: Date, required: true },
    date: { type: Date, default: Date.now, required: true }
});

// TODO: image downloader: self hosting

const articleModel = model("Article", articleSchema, "articles");

class Article {
    static create(title, description, content, link, category, keywords, language, pubDate, creator, image_url, source_id, tags) {
        return articleModel.create({ title, description, content, link, category, keywords, creator, image_url, source_id, language, pubDate, tags });
    }

    static getByCategory(categories, negcat) {
        const query = {};
        if (categories && categories.length > 0) query.$in = categories;
        if (negcat && negcat.length > 0) query.$nin = negcat;
        return articleModel.find({ category: query }, {}, { sort: { pubDate: -1 } });
    }

    static getById(id) {
        return articleModel.findById(id, {});
    }

    static async pickupArticle(category, number = 1) {
        const articles = await axios.get("https://news-api14.p.rapidapi.com/top-headlines", {
            params: {
                category,
                language: "fr"
            },
            headers: {
                "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
                "X-RapidAPI-Host": "news-api14.p.rapidapi.com"
            }
        });

        const resArticles = articles.data?.articles;
        if (!resArticles || resArticles.length === 0) return;

        let n = 0;
        for (const article of resArticles) {
            if (n >= number) break;

            if (!article || !article.url || !article.title || !article.published_date) continue;
            const exists = await articleModel.exists({ category: category ? { $all: [category] } : { $nin: ["business"] }, title: article.title });
            if (exists) continue;

            const articleData = (await axios.get("https://extract-news.p.rapidapi.com/v0/article", {
                params: { url: article.url },
                headers: {
                    "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
                    "X-RapidAPI-Host": "extract-news.p.rapidapi.com"
                }
            }))?.data?.article;

            if (!articleData || !articleData.text || !articleData.top_image || !new Date(article.published_date)) continue;

            const { text, meta_description, meta_keywords, creator, top_image, source_url, meta_lang, tags } = articleData;
            await Article.create(article.title, meta_description, text, article.url, category, meta_keywords, meta_lang, new Date(article.published_date), creator, top_image, source_url, tags);
            n++;
        }
    }

    static async update() {
        const categories = [undefined, "business"];
        for (const category of categories) {
            await Article.pickupArticle(category, 2).catch(console.error);
        }
    }
}

scheduleJob("0 */4 * * *", () => {
    Article.update().catch(console.error);
}).invoke();

module.exports = { Article };
