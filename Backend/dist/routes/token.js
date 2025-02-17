"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET;
// Route pour rafraîchir le token
router.post("/refresh", (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            res.status(401).json({ result: false, message: "Pas de token reçu." });
            return;
        }
        jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                console.error("Erreur de vérification du token :", err);
                res
                    .status(401)
                    .json({ result: false, message: "Token invalide ou expiré." });
                return;
            }
            // Génère un nouveau token
            const newToken = jsonwebtoken_1.default.sign({ id: decoded.id, email: decoded.email }, JWT_SECRET, {
                expiresIn: "1h", // Ajuste la durée selon tes besoins
            });
            res.status(200).json({
                result: true,
                message: "Token rafraîchi avec succès.",
                token: newToken,
            });
        });
    }
    catch (error) {
        console.error("Erreur lors du rafraîchissement du token :", error);
        res
            .status(500)
            .json({ result: false, message: "Erreur interne du serveur." });
    }
});
exports.default = router;
