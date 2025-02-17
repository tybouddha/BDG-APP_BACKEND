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
// jest.mock("../../src/config/database"); // Mock de la base de données pour éviter les appels réels si pas de bdd dédié
const dotenv_1 = __importDefault(require("dotenv"));
// Mock pour les services externes
dotenv_1.default.config({ path: ".env.test" });
jest.mock("jsonwebtoken", () => ({
    sign: jest.fn(),
    verify: jest.fn(),
}));
jsonwebtoken_1.default.sign.mockReturnValue("mocked_jwt_token");
jsonwebtoken_1.default.verify.mockReturnValue({ user_id: 1, username: "testuser" });
jest.mock("bcrypt"); // Mock de bcrypt pour éviter le hashing réel
//Hook de nettoyage avant et après
beforeEach(() => {
    jest.clearAllMocks(); // Nettoyage des mocks avant chaque test pour éviter les effets de bord
});
afterEach(async () => {
    // Nettoyer la base après chaque test pour garantir qu'il n'y ait pas de pollution entre les tests
    await (0, database_1.query)("DELETE FROM users WHERE email = $1", ["test@example.com"]);
    // Fermer les connexions si nécessaire, selon les framework de base de données
    // await db.close(); //(si applicable)
});
describe("Chargement des variables d'environnement", () => {
    it("doit charger la clé JWT_SECRET correctement", () => {
        expect(process.env.JWT_SECRET).toBe("mocked_jwt_secret");
    });
    it("doit charger les informations de la base de données", () => {
        expect(process.env.DB_USER).toBe("postgres");
        expect(process.env.DB_NAME).toBe("budget_app_test"); // Vérifie bien que tu es sur la base de test
    });
});
//Description de la partie à tester
describe("POST /auth/signup", () => {
    const mockUser = {
        id: 1,
        username: "testuser",
        email: "test@example.com",
        password_hash: "$2b$10$examplehashedpassword1234567890", // Un mot de passe haché simulé
    };
    it("doit insérer un utilisateur dans la base de données", async () => {
        // On envoie une requête pour créer un utilisateur
        const res = await (0, supertest_1.default)(app_1.default).post("/auth/signup").send({
            username: "testuser",
            email: "test@example.com",
            password: "password123",
        });
        // Attente de la fin de l'insertion et vérification dans la base de données
        const result = await (0, database_1.query)("SELECT * FROM users WHERE email = $1", [
            "test@example.com",
        ]);
        // Vérifie que l'utilisateur a bien été inséré
        expect(result.rows.length).toBe(1); // L'utilisateur doit être dans la base
        expect(result.rows[0].email).toBe("test@example.com");
    });
    it("doit retourner une erreur 400 si les champs requis sont manquants", async () => {
        const res = await (0, supertest_1.default)(app_1.default).post("/auth/signup").send({});
        expect(res.status).toBe(400);
        expect(res.body.result).toBe(false);
        expect(res.body.errors).toBeDefined();
    });
    it("doit retourner une erreur 409 si l'email existe déjà", async () => {
        database_1.query.mockResolvedValueOnce({ rows: [mockUser] });
        const res = await (0, supertest_1.default)(app_1.default).post("/auth/signup").send({
            username: "testuser",
            email: "test@example.com",
            password: "password123",
        });
        expect(res.status).toBe(409);
        expect(res.body.message).toBe("Email déjà utilisé.");
    });
    it("doit retourner une erreur 400 si l'email est invalide", async () => {
        const res = await (0, supertest_1.default)(app_1.default).post("/auth/signup").send({
            username: "testuser",
            email: "testexample.com", // Email invalide
            password: "password123",
        });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Email invalide.");
    });
    it("doit retourner une erreur 400 si le mot de passe est trop court", async () => {
        const res = await (0, supertest_1.default)(app_1.default).post("/auth/signup").send({
            username: "testuser",
            email: "test@example.com",
            password: "123", // Mot de passe trop court
        });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Le mot de passe doit comporter au moins 6 caractères.");
    });
    it("doit hasher le mot de passe et créer un utilisateur", async () => {
        database_1.query.mockResolvedValueOnce({ rows: [] }); // Aucun utilisateur existant
        bcrypt_1.default.hash.mockResolvedValueOnce(mockUser.password_hash); // Simulation du hashage du mot de passe
        database_1.query.mockResolvedValueOnce({ rows: [mockUser] }); // Simulation de l'insertion en base
        jsonwebtoken_1.default.sign.mockReturnValue("mocked_token"); // Génération du token mocké
        const res = await (0, supertest_1.default)(app_1.default).post("/auth/signup").send({
            username: "testuser",
            email: "test@example.com",
            password: "password123",
        });
        expect(bcrypt_1.default.hash).toHaveBeenCalledWith("password123", 10); // Vérifie que bcrypt a été appelé correctement
        expect(jsonwebtoken_1.default.sign).toHaveBeenCalledWith({ user_id: mockUser.id, username: mockUser.username }, expect.any(String), // Vérifie que le JWT_SECRET est passé
        { expiresIn: "1h" });
        expect(res.status).toBe(201); // Vérifie le statut 201 pour la création réussie
        expect(res.body.result).toBe(true);
        expect(res.body.token).toBe("mocked_token");
    });
    it("doit générer un token JWT valide", async () => {
        const res = await (0, supertest_1.default)(app_1.default).post("/auth/signup").send({
            username: "testuser",
            email: "test@example.com",
            password: "password123",
        });
        const token = res.body.token;
        expect(token).toMatch(/^[A-Za-z0-9-_.]+$/); // Vérifie que le token a un format valide
    });
    it("doit retourner une erreur 500 en cas d'erreur serveur", async () => {
        database_1.query.mockRejectedValueOnce(new Error("Erreur serveur"));
        const res = await (0, supertest_1.default)(app_1.default).post("/auth/signup").send({
            username: "testuser",
            email: "test@example.com",
            password: "password123",
        });
        expect(res.status).toBe(500); // Vérifie le statut d'erreur interne
        expect(res.body.result).toBe(false);
        expect(res.body.message).toBe("Erreur interne du serveur.");
    });
});
