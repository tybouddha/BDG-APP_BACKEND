"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const authenticateToken = (req, res, next) => {
    const token = req.cookies.token; // ou req.headers.authorization
    if (!token) {
        return res.sendStatus(401); // Unauthorized
    }
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        return res.status(500).send("JWT_SECRET is not defined"); // Erreur serveur
    }
    // Vérification du token
    jsonwebtoken_1.default.verify(token, secret, (err, user) => {
        if (err)
            return res.sendStatus(403); // Forbidden
        req.user = user; // Assurez-vous que req.user est défini
        next();
    });
};
exports.default = authenticateToken;
