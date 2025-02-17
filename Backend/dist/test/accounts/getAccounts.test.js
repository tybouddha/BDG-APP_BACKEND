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
describe("GET /accounts", () => {
    it("Devrait renvoyer les comptes associés à l'utilisateur", async () => {
        // Ajouter un token valide pour tester la route
        const validToken = "Bearer <ton-token-valide>"; // Remplace par un token généré lors des tests
        const response = await (0, supertest_1.default)(app_1.default)
            .get("/accounts")
            .set("Authorization", validToken);
        // Assertions
        expect(response.status).toBe(200);
        expect(response.body.result).toBe(true);
        expect(Array.isArray(response.body.accounts)).toBe(true);
    });
    it("Devrait renvoyer une erreur 401 si le token est manquant", async () => {
        const response = await (0, supertest_1.default)(app_1.default).get("/accounts");
        expect(response.status).toBe(401);
        expect(response.body.message).toBe("Pas de token reçu.");
    });
    it("Devrait renvoyer une erreur 403 si le token est invalide", async () => {
        const invalidToken = "Bearer tokenInvalide123";
        const response = await (0, supertest_1.default)(app_1.default)
            .get("/accounts")
            .set("Authorization", invalidToken);
        expect(response.status).toBe(401); // Ou 403 selon ton implémentation
        expect(response.body.message).toBe("Token invalide.");
    });
});
