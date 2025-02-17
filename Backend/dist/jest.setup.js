"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("./config/database")); // Chemin vers ton fichier de configuration DB
// Réinitialiser la base avant chaque test
beforeEach(async () => {
    await database_1.default.query("TRUNCATE TABLE accounts RESTART IDENTITY CASCADE");
    await database_1.default.query("TRUNCATE TABLE users RESTART IDENTITY CASCADE");
});
// Fermer la connexion après tous les tests
afterAll(async () => {
    await database_1.default.end();
});
