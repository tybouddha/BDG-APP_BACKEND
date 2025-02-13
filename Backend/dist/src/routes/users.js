"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET;
// Route POST /signup
router.post("/signup", [
    // Validation des champs
    (0, express_validator_1.body)("username")
        .notEmpty()
        .withMessage("Le nom d'utilisateur est obligatoire."),
    (0, express_validator_1.body)("email").isEmail().withMessage("Format d'email invalide."),
    (0, express_validator_1.body)("password")
        .isLength({ min: 6 })
        .withMessage("Le mot de passe doit contenir au moins 6 caractères."),
], async (req, res) => {
    try {
        // Vérification des erreurs de validation
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                result: false,
                errors: errors.array(),
            });
        }
        // Extraction des données
        const { username, email, password } = req.body;
        // Vérifier si l'utilisateur existe déjà
        const userExists = await (0, database_1.query)("SELECT * FROM users WHERE email = $1", [
            email,
        ]);
        if (userExists.rows.length > 0) {
            res.status(400).json({
                result: false,
                message: "Un utilisateur avec cet email existe déjà.",
            });
        }
        // Hash du mot de passe
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        if (!JWT_SECRET) {
            throw new Error("JWT_SECRET doît être obligatoirement défini dans les variables d'environnement");
        }
        // Génération du token JWT
        const token = jsonwebtoken_1.default.sign({ email }, JWT_SECRET, { expiresIn: "1h" });
        // Insertion de l'utilisateur dans la base
        const result = await (0, database_1.query)(`INSERT INTO users (username, email, password, token, token_expiration) 
         VALUES ($1, $2, $3, $4, NOW() + INTERVAL '1 hour') 
         RETURNING id, username, email, created_at`, [username, email, hashedPassword, token]);
        // Réponse de succès
        res.status(201).json({
            result: true,
            message: "Utilisateur créé avec succès.",
            user: {
                id: result.rows[0].id,
                username: result.rows[0].username,
                email: result.rows[0].email,
                created_at: result.rows[0].created_at,
            },
        });
    }
    catch (error) {
        console.error("Erreur lors de la création d'un utilisateur :", error);
        res.status(500).json({
            result: false,
            message: "Erreur interne du serveur.",
        });
    }
});
exports.default = router;
