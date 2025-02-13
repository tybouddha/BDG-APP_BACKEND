"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const checkTokenExpiration = async (req, res, next) => {
    const token = req.headers["authorization"]?.split(" ")[1]; // Bearer token
    if (!token)
        return res.status(401).json({ message: "Token manquant" });
    try {
        const result = await (0, database_1.query)("SELECT token_expiration FROM users WHERE token = $1", [token]);
        if (result.rows.length === 0 ||
            new Date(result.rows[0].token_expiration) < new Date()) {
            return res
                .status(401)
                .json({ message: "Token expiré, veuillez vous reconnecter." });
        }
        next();
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur interne du serveur." });
    }
};
exports.default = checkTokenExpiration;
