"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const pg_1 = require("pg");
dotenv_1.default.config();
// Configuration de la base de données
const pool = new pg_1.Pool({
    user: process.env.DB_USER, // Utilisateur de la base
    host: process.env.DB_HOST, // Hôte de la base de données
    database: process.env.DB_NAME, // Nom de la base de données
    password: process.env.DB_PASSWORD, // Mot de passe
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined, // Port PostgreSQL
});
// Fonction pour exécuter des requêtes SQL
const query = (text, params) => pool.query(text, params);
exports.query = query;
console.log("🚀 Connecté à PostgreSQL");
// Exporter le pool pour d'autres fichiers si nécessaire
exports.default = pool;
