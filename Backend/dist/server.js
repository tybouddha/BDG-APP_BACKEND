"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = __importDefault(require("./app")); // Importer l'application configurée dans app.ts
const database_1 = require("./config/database");
// Charger les variables d'environnement
dotenv_1.default.config();
console.log("DB_USER:", process.env.DB_USER); // Vérifier si les variables sont bien chargées
// Test de la connexion à la base de données avant de démarrer le serveur
(async () => {
    try {
        const result = await (0, database_1.query)("SELECT NOW()");
        console.log("Connexion réussie à PostgreSQL :", result.rows[0]);
    }
    catch (error) {
        console.error("Erreur de connexion à PostgreSQL :", error);
        process.exit(1); // Stoppe le démarrage si la base est inaccessible
    }
})();
// Lancer le serveur
const PORT = process.env.PORT || 3000;
app_1.default.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
