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

describe("DELETE /accounts/:id", () => {
  it("Devrait supprimer un compte si l'utilisateur est autorisé", async () => {
    const validToken = "Bearer <ton-token-valide>";
    const accountId = 1; // Remplace par un ID valide dans ta base de données

    const response = await request(app)
      .delete(`/accounts/${accountId}`)
      .set("Authorization", validToken);

    expect(response.status).toBe(200);
    expect(response.body.result).toBe(true);
    expect(response.body.message).toBe("Compte supprimé avec succès.");
  });

  it("Devrait renvoyer une erreur 403 si l'utilisateur n'est pas autorisé", async () => {
    const validToken = "Bearer <ton-token-valide>";
    const accountId = 99; // Compte appartenant à un autre utilisateur

    const response = await request(app)
      .delete(`/accounts/${accountId}`)
      .set("Authorization", validToken);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Accès non autorisé.");
  });

  it("Devrait renvoyer une erreur 404 si le compte n'existe pas", async () => {
    const validToken = "Bearer <ton-token-valide>";
    const nonExistentAccountId = 99999;

    const response = await request(app)
      .delete(`/accounts/${nonExistentAccountId}`)
      .set("Authorization", validToken);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Compte introuvable.");
  });
});
