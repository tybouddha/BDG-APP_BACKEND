"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const database_1 = require("./config/database");
// Charger les variables d'environnement
dotenv_1.default.config();
console.log("DB_USER:", process.env.DB_USER); //Pour voir si les variable env sont bien chargées
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Exemple de route pour tester la base de données
app.get("/test-db", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, database_1.query)("SELECT NOW()"); // Teste la connexion avec la commande SQL
        res.json({ message: "Connexion réussie !", time: result.rows[0] });
    }
    catch (error) {
        console.error("Erreur de connexion :", error);
        res.status(500).json({ error: "Erreur de connexion à la base de données" });
    }
}));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
