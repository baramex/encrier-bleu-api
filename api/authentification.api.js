const { User } = require("../models/user.model");
const { SessionMiddleware, Session } = require("../models/session.model");
const { getClientIp } = require("request-ip");
const { rateLimit } = require("express-rate-limit");
const { CustomError } = require("../utils/errors");

const router = require("express").Router();

// déconnexion
router.post("/logout", SessionMiddleware.requiresValidAuthExpress, async (req, res) => {
    try {
        await Session.disable(req.session);
        res.clearCookie("token").clearCookie("refreshToken").sendStatus(200);
    } catch (error) {
        console.error(error);
        res.status(400).json(error.message || { message: "Une erreur est survenue.", error: "UnknownError" });
    }
});

// connexion
router.post("/login", rateLimit({
    windowMs: 1000 * 60,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false
}), SessionMiddleware.isValidAuthExpress, async (req, res) => {
    try {
        if (!req.body) throw new CustomError({ message: "Requête invalide.", error: "InvalidRequest" });
        if (req.isAuthed) throw new CustomError({ message: "Vous êtes déjà authentifié.", error: "AlreadyAuthenticated" });

        const { email, password } = req.body;
        if (typeof email != "string" || typeof password != "string") throw new CustomError({ message: "Requête invalide.", error: "InvalidRequest" });

        const user = await User.check(email, password);
        if (!user) throw new CustomError({ message: "Identifants incorrects.", error: "InvalidCredentials" });

        let session = await Session.getSessionByUserId(user._id);
        const ip = getClientIp(req);
        if (session) {
            if (session.active) await Session.disable(session);
            session.active = true;
            if (!session.ips.includes(ip)) session.ips.push(ip);
            await session.save({ validateBeforeSave: true });
        } else {
            session = await Session.create(user._id, ip);
        }

        const expires = new Date(Session.expiresIn * 1000 + new Date(session.date).getTime());
        const expiresRefresh = new Date(Session.expiresInRefresh * 1000 + new Date(session.date).getTime());

        res.cookie("token", session.token, { expires })
            .cookie("refreshToken", session.refreshToken, { expires: expiresRefresh })
            .json(User.getUserFields(user));
    } catch (error) {
        console.error(error);
        res.status(400).json(error.message || { message: "Une erreur est survenue.", error: "UnknownError" });
    }
});

// refresh token
router.post("/refresh", async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (typeof refreshToken != "string") throw new CustomError({ message: "Requête invalide.", error: "InvalidRequest" });

        let session = await Session.getSessionByRefreshToken(refreshToken);

        const user = session?.user;
        if (!session || typeof user != "object") {
            res.clearCookie("refreshToken");
            throw new CustomError({ message: "Jeton de rafraîchissement invalide.", error: "InvalidRefreshToken" });
        }

        const ip = getClientIp(req);
        if (session.active) await Session.disable(session);

        session.active = true;
        if (!session.ips.includes(ip)) session.ips.push(ip);
        await session.save({ validateBeforeSave: true });

        const expires = new Date(Session.expiresIn * 1000 + new Date(session.date).getTime());
        const expiresRefresh = new Date(Session.expiresInRefresh * 1000 + new Date(session.date).getTime());
        res.cookie("token", session.token, { expires }).cookie("refreshToken", session.refreshToken, { expires: expiresRefresh }).json(User.getUserFields(user));
    } catch (error) {
        console.error(error);
        res.status(400).json(error.message || { message: "Une erreur est survenue.", error: "UnknownError" });
    }
});

module.exports = router;