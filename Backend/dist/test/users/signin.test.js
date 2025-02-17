"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../app")); // Ton fichier principal Express (où app est créé)
const database_1 = require("../../config/database");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
jest.mock("../../src/config/database");
jest.mock("bcrypt");
jest.mock("jsonwebtoken");
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
jest.mock("jsonwebtoken");
jsonwebtoken_1.default.sign.mockReturnValue("mocked_jwt_token");
jsonwebtoken_1.default.verify.mockReturnValue({ user_id: 1, username: "testuser" });
describe("POST /auth/signin", () => {
    const mockUser = {
        id: 1,
        username: "testuser",
        password_hash: "$2b$10$examplehashedpassword1234567890", // Exemple de hash bcrypt
    };
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it("doit retourner une erreur 400 si les champs requis sont manquants", async () => {
        const res = await (0, supertest_1.default)(app_1.default).post("/auth/signin").send({});
        expect(res.status).toBe(400);
        expect(res.body.result).toBe(false);
        expect(res.body.errors).toBeDefined();
    });
    it("doit retourner une erreur 404 si l'utilisateur n'existe pas", async () => {
        database_1.query.mockResolvedValueOnce({ rows: [] });
        const res = await (0, supertest_1.default)(app_1.default)
            .post("/auth/signin")
            .send({ username: "inexistant", password_hash: "password123" });
        expect(res.status).toBe(404);
        expect(res.body.error).toBe("Utilisateur non trouvé.");
    });
    it("doit retourner une erreur 401 si le mot de passe est incorrect", async () => {
        database_1.query.mockResolvedValueOnce({ rows: [mockUser] });
        bcrypt_1.default.compare.mockResolvedValueOnce(false);
        const res = await (0, supertest_1.default)(app_1.default)
            .post("/auth/signin")
            .send({ username: "testuser", password_hash: "wrongpassword" });
        expect(res.status).toBe(401);
        expect(res.body.error).toBe("Mot de passe incorrect.");
    });
    it("doit connecter l'utilisateur avec succès et retourner un token", async () => {
        database_1.query.mockResolvedValueOnce({ rows: [mockUser] });
        bcrypt_1.default.compare.mockResolvedValueOnce(true);
        jsonwebtoken_1.default.sign.mockReturnValue("mocked_token");
        const res = await (0, supertest_1.default)(app_1.default)
            .post("/auth/signin")
            .send({ username: "testuser", password_hash: "password123" });
        expect(res.status).toBe(200);
        expect(res.body.result).toBe(true);
        expect(res.body.token).toBe("mocked_token");
        expect(res.body.message).toBe("Utilisateur connecté.");
    });
    it("doit retourner une erreur 500 en cas de problème serveur", async () => {
        database_1.query.mockRejectedValueOnce(new Error("Erreur serveur"));
        const res = await (0, supertest_1.default)(app_1.default)
            .post("/auth/signin")
            .send({ username: "testuser", password_hash: "password123" });
        expect(res.status).toBe(500);
        expect(res.body.result).toBe(false);
        expect(res.body.message).toBe("Erreur interne du serveur.");
    });
});
