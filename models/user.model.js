const { Schema, model } = require("mongoose");
const { default: isEmail } = require("validator/lib/isEmail");
const { ObjectId } = require("mongodb");
const { hash, compare } = require("bcrypt");
const { ROLE_VALUES, PERMISSIONS } = require("../utils/roles");
const { CustomError } = require("../utils/errors");

const PASSWORD_REGEX = /^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{6,32}$)/;

const userSchema = new Schema({
    email: { type: String, trim: true, lowercase: true, required: true, validate: { validator: isEmail, message: "L'adresse email est invalide." } },
    role: { type: Number, min: 0, max: Object.keys(ROLE_VALUES).length - 1, get: v => ROLE_VALUES[v], required: true },
    username: { type: String, trim: true, required: true },
    password: { type: String, trim: true },
    date: { type: Date, default: Date.now, required: true }
});

userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        if (!PASSWORD_REGEX.test(this.password)) throw new CustomError({ message: "Le mot de passe est invalide.", error: "InvalidPassword" });
        this.password = await hash(this.password, 10);
    }
    next();
});

const UserModel = model("User", userSchema, "users");

class User {
    static create(password, email, username, role) {
        return new UserModel({ password, email, username, role }).save();
    }

    static hasPermission(user, ...permissions) {
        if (!permissions || permissions.length == 0) return true;
        if (!user) return false;
        return permissions.every(p => user.role.permissions?.includes(p)) || user.role.permissions?.includes(PERMISSIONS.ALL);
    }

    static getUserById(id) {
        return UserModel.findById(id);
    }

    static getAll() {
        return UserModel.find();
    }

    static async check(email, password) {
        if (!email || !password) return false;
        const user = await UserModel.findOne({ email });
        if (!user) return false;
        if (!user.password) return false;
        if (await compare(password, user.password)) return user;
        return false;
    }

    static getUserFields(user) {
        return { _id: user._id, email: user.email, role: user.role, username: user.username, date: user.date };
    }
}

class UserMiddleware {
    static parseParamsUser(...permissions) {
        return async (req, res, next) => {
            try {
                const id = req.params.id;
                if (!id || (id == "@me" ? false : !ObjectId.isValid(id))) throw new CustomError({ message: "Requête invalide.", error: "InvalidRequest" });

                if ((id == "@me" || req.user._id.equals(id)) ? false : !User.hasPermission(req.user, ...permissions)) throw new CustomError({ message: "Non autorisé.", error: "Unauthorized" }, 403);

                if (id == "@me" || req.user._id.equals(id)) req.paramsUser = req.user;
                else {
                    const user = await User.getUserById(id);
                    if (!user) throw new CustomError({ message: "Utilisateur introuvable.", error: "UserNotFound" });
                    req.paramsUser = user;
                }

                next();
            } catch (error) {
                console.error(error);
                res.status(error.status || 400).json(error.message || { message: "Une erreur est survenue.", error: "UnknownError" });
            }
        }
    }

    static requiresPermissions(...permissions) {
        return (req, res, next) => {
            try {
                if (!req.user || !User.hasPermission(req.user, ...permissions)) throw new CustomError({ message: "Non autorisé.", error: "Unauthorized" }, 403);
                next();
            } catch (error) {
                console.error(error);
                res.status(error.status || 400).json(error.message || { message: "Une erreur est survenue.", error: "UnknownError" });
            }
        }
    }
}

module.exports = { User, UserMiddleware };