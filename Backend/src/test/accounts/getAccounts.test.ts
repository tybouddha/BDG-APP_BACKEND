import request from "supertest";
import app from "../../app"; // Ton fichier principal Express (où app est créé)
import { query } from "../../config/database"; // Remplace par le chemin de ton fichier serveur
jest.mock("../../src/config/database"); // Remplace toutes les fonctions du fichier par des mocks

(query as jest.Mock).mockResolvedValue({
  rows: [{ id: 1, username: "testuser" }],
}); // Simule une réponse

import dotenv from "dotenv";

dotenv.config({ path: ".env.test" });

describe("Chargement des variables d'environnement", () => {
  it("doit charger la clé JWT_SECRET correctement", () => {
    expect(process.env.JWT_SECRET).toBe("mocked_jwt_secret");
  });

  it("doit charger les informations de la base de données", () => {
    expect(process.env.DB_USER).toBe("postgres");
    expect(process.env.DB_NAME).toBe("budget_app");
  });
});

import jwt from "jsonwebtoken";

jest.mock("jsonwebtoken");

(jwt.sign as jest.Mock).mockReturnValue("mocked_jwt_token");
(jwt.verify as jest.Mock).mockReturnValue({ user_id: 1, username: "testuser" });

describe("GET /accounts", () => {
  it("Devrait renvoyer les comptes associés à l'utilisateur", async () => {
    // Ajouter un token valide pour tester la route
    const validToken = "Bearer <ton-token-valide>"; // Remplace par un token généré lors des tests

    const response = await request(app)
      .get("/accounts")
      .set("Authorization", validToken);

    // Assertions
    expect(response.status).toBe(200);
    expect(response.body.result).toBe(true);
    expect(Array.isArray(response.body.accounts)).toBe(true);
  });

  it("Devrait renvoyer une erreur 401 si le token est manquant", async () => {
    const response = await request(app).get("/accounts");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Pas de token reçu.");
  });

  it("Devrait renvoyer une erreur 403 si le token est invalide", async () => {
    const invalidToken = "Bearer tokenInvalide123";

    const response = await request(app)
      .get("/accounts")
      .set("Authorization", invalidToken);

    expect(response.status).toBe(401); // Ou 403 selon ton implémentation
    expect(response.body.message).toBe("Token invalide.");
  });
});
