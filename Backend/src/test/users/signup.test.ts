import request from "supertest";
import app from "../../app"; // Ton fichier principal Express (où app est créé)
import { query } from "../../config/database";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// jest.mock("../../src/config/database"); // Mock de la base de données pour éviter les appels réels si pas de bdd dédié

// Mock pour les services externes
jest.mock("bcrypt"); // Mock de bcrypt pour éviter le hashing réel
jest.mock("jsonwebtoken"); // Mock de jsonwebtoken pour éviter la création réelle de tokens

import dotenv from "dotenv";

dotenv.config({ path: ".env.test" });

//Hook de nettoyage avant et après
beforeEach(() => {
  jest.clearAllMocks(); // Nettoyage des mocks avant chaque test pour éviter les effets de bord
});

afterEach(async () => {
  // Nettoyer la base après chaque test pour garantir qu'il n'y ait pas de pollution entre les tests
  await query("DELETE FROM users WHERE email = $1", ["test@example.com"]);
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

jest.mock("jsonwebtoken");

(jwt.sign as jest.Mock).mockReturnValue("mocked_jwt_token");
(jwt.verify as jest.Mock).mockReturnValue({ user_id: 1, username: "testuser" });

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
    const res = await request(app).post("/auth/signup").send({
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    });

    // Attente de la fin de l'insertion et vérification dans la base de données
    const result = await query("SELECT * FROM users WHERE email = $1", [
      "test@example.com",
    ]);

    // Vérifie que l'utilisateur a bien été inséré
    expect(result.rows.length).toBe(1); // L'utilisateur doit être dans la base
    expect(result.rows[0].email).toBe("test@example.com");
  });

  it("doit retourner une erreur 400 si les champs requis sont manquants", async () => {
    const res = await request(app).post("/auth/signup").send({});
    expect(res.status).toBe(400);
    expect(res.body.result).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  it("doit retourner une erreur 409 si l'email existe déjà", async () => {
    (query as jest.Mock).mockResolvedValueOnce({ rows: [mockUser] });

    const res = await request(app).post("/auth/signup").send({
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("Email déjà utilisé.");
  });

  it("doit retourner une erreur 400 si l'email est invalide", async () => {
    const res = await request(app).post("/auth/signup").send({
      username: "testuser",
      email: "testexample.com", // Email invalide
      password: "password123",
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Email invalide.");
  });

  it("doit retourner une erreur 400 si le mot de passe est trop court", async () => {
    const res = await request(app).post("/auth/signup").send({
      username: "testuser",
      email: "test@example.com",
      password: "123", // Mot de passe trop court
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      "Le mot de passe doit comporter au moins 6 caractères."
    );
  });

  it("doit hasher le mot de passe et créer un utilisateur", async () => {
    (query as jest.Mock).mockResolvedValueOnce({ rows: [] }); // Aucun utilisateur existant
    (bcrypt.hash as jest.Mock).mockResolvedValueOnce(mockUser.password_hash); // Simulation du hashage du mot de passe
    (query as jest.Mock).mockResolvedValueOnce({ rows: [mockUser] }); // Simulation de l'insertion en base
    (jwt.sign as jest.Mock).mockReturnValue("mocked_token"); // Génération du token mocké

    const res = await request(app).post("/auth/signup").send({
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    });

    expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10); // Vérifie que bcrypt a été appelé correctement
    expect(jwt.sign).toHaveBeenCalledWith(
      { user_id: mockUser.id, username: mockUser.username },
      expect.any(String), // Vérifie que le JWT_SECRET est passé
      { expiresIn: "1h" }
    );
    expect(res.status).toBe(201); // Vérifie le statut 201 pour la création réussie
    expect(res.body.result).toBe(true);
    expect(res.body.token).toBe("mocked_token");
  });

  it("doit générer un token JWT valide", async () => {
    const res = await request(app).post("/auth/signup").send({
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    });

    const token = res.body.token;
    expect(token).toMatch(/^[A-Za-z0-9-_.]+$/); // Vérifie que le token a un format valide
  });

  it("doit retourner une erreur 500 en cas d'erreur serveur", async () => {
    (query as jest.Mock).mockRejectedValueOnce(new Error("Erreur serveur"));

    const res = await request(app).post("/auth/signup").send({
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    });

    expect(res.status).toBe(500); // Vérifie le statut d'erreur interne
    expect(res.body.result).toBe(false);
    expect(res.body.message).toBe("Erreur interne du serveur.");
  });
});
