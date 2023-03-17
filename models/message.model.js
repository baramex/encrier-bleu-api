const { ObjectId } = require("mongodb");
const { Schema, model } = require("mongoose");
const { io } = require("../server");

const messageSchema = new Schema({
    author: { type: ObjectId, ref: "User", required: true },
    content: { type: String, required: true, validate: /^.{1,512}$/ },
    date: { type: Date, default: Date.now }
});

messageSchema.post("validate", async (doc, next) => {
    if (doc.isNew) {
        await doc.populate({ path: "author", select: "username" });
        io.to("authenticated").emit("message.send", { _id: doc._id, author: doc.author, content: doc.content, date: doc.date });
    }
    next();
});

const messageModel = model("Message", messageSchema, "messages");

class Message {
    /**
     * 
     * @param {ObjectId} profileId 
     * @param {String} content 
     */
    static create(profileId, content) {
        return new messageModel({ author: profileId, content }).save().populate("author", "username");
    }

    /**
     * 
     * @param {ObjectId} id 
     */
    static getById(id) {
        return messageModel.findById(id, {}).where("deleted", false);
    }

    /**
     * 
     * @param {Number} from 
     * @param {Number} number 
     */
    static getMessages(from, number) {
        if (!from || isNaN(from) || from < 0) throw new Error("La valeur de départ doit être supérieure à 0.");
        if (number > 50) throw new Error("Le nombre de message ne peut pas excéder 50.");
        return messageModel.find({}, {}, { populate: { path: "author", select: "username" } }).sort({ date: -1 }).skip(from).limit(number);
    }

    /**
     * 
     * @param {ObjectId[]} ids 
     */
    static getMessagesByIds(ids) {
        return messageModel.find({ _id: { $in: ids } }, {}, { populate: { path: "author", select: "username" } });
    }
}

module.exports = { Message };