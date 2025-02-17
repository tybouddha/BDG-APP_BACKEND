"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../app")); // Ton fichier principal Express (où app est créé)
const database_1 = require("../../config/database"); // Remplace par le chemin de ton fichier serveur
jest.mock("../../src/config/database"); // Remplace toutes les fonctions du fichier par des mocks
database_1.query.mockResolvedValue({
    rows: [{ id: 1, username: "testuser" }],
}); // Simule une réponse
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: ".env.test" });
describe("Chargement des variables d'environnement", () => {
    it("doit charger la clé JWT_SECRET correctement", () => {
        expect(process.env.JWT_SECRET).toBe("mocked_jwt_secret");
    });
    it("doit charger les informations de la base de données", () => {
        expect(process.env.DB_USER).toBe("postgres");
        expect(process.env.DB_NAME).toBe("budget_app");
    });
});
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
jest.mock("jsonwebtoken");
jsonwebtoken_1.default.sign.mockReturnValue("mocked_jwt_token");
jsonwebtoken_1.default.verify.mockReturnValue({ user_id: 1, username: "testuser" });
describe("DELETE /accounts/:id", () => {
    it("Devrait supprimer un compte si l'utilisateur est autorisé", async () => {
        const validToken = "Bearer <ton-token-valide>";
        const accountId = 1; // Remplace par un ID valide dans ta base de données
        const response = await (0, supertest_1.default)(app_1.default)
            .delete(`/accounts/${accountId}`)
            .set("Authorization", validToken);
        expect(response.status).toBe(200);
        expect(response.body.result).toBe(true);
        expect(response.body.message).toBe("Compte supprimé avec succès.");
    });
    it("Devrait renvoyer une erreur 403 si l'utilisateur n'est pas autorisé", async () => {
        const validToken = "Bearer <ton-token-valide>";
        const accountId = 99; // Compte appartenant à un autre utilisateur
        const response = await (0, supertest_1.default)(app_1.default)
            .delete(`/accounts/${accountId}`)
            .set("Authorization", validToken);
        expect(response.status).toBe(403);
        expect(response.body.message).toBe("Accès non autorisé.");
    });
    it("Devrait renvoyer une erreur 404 si le compte n'existe pas", async () => {
        const validToken = "Bearer <ton-token-valide>";
        const nonExistentAccountId = 99999;
        const response = await (0, supertest_1.default)(app_1.default)
            .delete(`/accounts/${nonExistentAccountId}`)
            .set("Authorization", validToken);
        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Compte introuvable.");
    });
});
