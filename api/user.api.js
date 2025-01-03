const { User, UserMiddleware } = require('../models/user.model');
const { SessionMiddleware } = require('../models/session.model');
const { rateLimit } = require("express-rate-limit");
const { PERMISSIONS } = require('../utils/roles');
const { CustomError } = require('../utils/errors');

const router = require('express').Router();

// get users
router.get("/users", SessionMiddleware.requiresValidAuthExpress, UserMiddleware.requiresPermissions(PERMISSIONS.VIEW_USERS), async (req, res) => {
    try {
        const users = await User.getAll();
        res.status(200).json(users.map(user => User.getUserFields(user)));
    } catch (error) {
        console.error(error);
        res.status(400).json(error.message || { message: "Une erreur est survenue.", error: "UnknownError" });
    }
});

// create user
router.post("/user", SessionMiddleware.requiresValidAuthExpress, UserMiddleware.requiresPermissions(PERMISSIONS.CREATE_USER), async (req, res) => {
    try {
        if (!req.body) throw new CustomError({ message: "Requête invalide.", error: "InvalidRequest" });

        const { password, email, role, username } = req.body;
        if (typeof password != "string" || typeof email != "string" || typeof role != "number" || typeof username !== "string") throw new CustomError({ message: "Requête invalide.", error: "InvalidRequest" });

        const user = await User.create(password, email, username, role);
        res.status(201).json(User.getUserFields(user));
    } catch (error) {
        console.error(error);
        res.status(400).json(error.message || { message: "Une erreur est survenue.", error: "UnknownError" });
    }
});

// get user
router.get("/user/:id", SessionMiddleware.requiresValidAuthExpress, UserMiddleware.parseParamsUser(PERMISSIONS.VIEW_USERS), async (req, res) => {
    try {
        res.status(200).json(User.getUserFields(req.paramsUser));
    } catch (error) {
        console.error(error);
        res.status(400).json(error.message || { message: "Une erreur est survenue.", error: "UnknownError" });
    }
});

// patch user
router.patch("/user/:id", rateLimit({
    windowMs: 1000 * 30,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req,res) => {
        return req.headers['cf-connecting-ip'];
    }
}), SessionMiddleware.requiresValidAuthExpress, UserMiddleware.parseParamsUser(PERMISSIONS.MANAGE_USERS), async (req, res) => {
    try {
        if (!req.body) throw new CustomError({ message: "Requête invalide.", error: "InvalidRequest" });
        const user = req.paramsUser;

        if (typeof req.body.email == "string") {
            user.email = req.body.email;
        }
        if (typeof req.body.password == "string") {
            user.password = req.body.password;
        }
        if (typeof req.body.username == "string") {
            user.username = req.body.username;
        }

        await user.save();

        res.status(200).json(User.getUserFields(user));
    } catch (error) {
        console.error(error);
        res.status(400).json(error.message || { message: "Une erreur est survenue.", error: "UnknownError" });
    }
});

module.exports = router;
