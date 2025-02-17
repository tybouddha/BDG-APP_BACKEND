"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config(); // Lien avec le fichier .env (doit être en tout premier)
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const users_1 = __importDefault(require("./routes/users"));
const accounts_1 = __importDefault(require("./routes/accounts"));
const path = require("path");
var cors = require("cors");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var indexRouter = require("./index");
const app = (0, express_1.default)();
// Configuration de CORS
app.use(cors()); // Autorise toutes les origines par défaut
//Vérification des variables d'environnement de la bdd
if (!process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_HOST) {
    console.error("⚠️  Certaines variables de configuration de la base de données sont manquantes.");
    process.exit(1);
}
// Vérification de la variable d'environnement JWT_SECRET
if (!process.env.JWT_SECRET) {
    console.error("⚠️  JWT_SECRET est manquant dans le fichier .env. L'application ne peut pas démarrer.");
    process.exit(1); // Stoppe le serveur
}
// Middleware
app.use(body_parser_1.default.json()); // Pour parser le body en JSON
// Routes
app.use(logger("dev"));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express_1.default.static(path.join(__dirname, "public")));
app.use("/", indexRouter);
app.use("/auth", users_1.default);
app.use("/accounts", accounts_1.default);
// Gestion des routes non trouvées
app.use((req, res) => {
    res.status(404).json({
        result: false,
        message: "Route non trouvée.",
    });
});
app._router.stack.forEach((layer) => {
    if (layer.route) {
        console.log(layer.route.path);
    }
});
exports.default = app;
