const { default: axios } = require("axios");
const { Schema, model } = require("mongoose");
const { scheduleJob } = require("node-schedule");

const articleSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String, required: true },
    url: { type: String, required: true },
    image: { type: String },
    publishedAt: { type: Date, required: true },
    source: {
        type: {
            name: { type: String, required: true },
            url: { type: String, required: true }
        }, required: true, default: {}
    },
    date: { type: Date, default: Date.now, required: true }
});

const articleModel = model("Article", articleSchema, "articles");

class Article {
    static create(title, description, content, category, url, image, publishedAt, source) {
        return new articleModel({ title, description, content, category, url, image, publishedAt, source }).save();
    }

    static getByCategory(category) {
        return articleModel.find({ category }, {}).sort({ date: -1 });
    }

    static getById(id) {
        return articleModel.findById(id, {});
    }

    static async pickupArticle(category) {
        const articles = await axios.get("https://news-api14.p.rapidapi.com/top-headlines", {
            params: {
                category,
                lang: "fr"
            },
            headers: {
                "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
                "X-RapidAPI-Host": "news-api14.p.rapidapi.com"
            }
        });

        const article = articles.data?.articles?.[0];
        if (!article) return;

        const lastArticle = await articleModel.findOne({ category }, {}, { sort: { date: -1 } });

        if (!lastArticle || new Date(article.publishedAt).getTime() > lastArticle.date.getTime()) {
            const { title, description, content, url, image, publishedAt, source } = article;
            return await Article.create(title, description, content, category, url, image, publishedAt, source);
        }
    }

    static async update() {
        const categories = [undefined, "business"];
        for (const category of categories) {
            await Article.pickupArticle(category);
        }
    }
}

const update = scheduleJob("0 */12 * * *", () => {
    Article.update().catch(console.error);
});

update.invoke();

module.exports = { Article };