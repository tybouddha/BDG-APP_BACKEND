import request from "supertest";
import app from "../../app"; // Ton fichier principal Express (où app est créé)
import { query } from "../../config/database";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

jest.mock("../../src/config/database");
jest.mock("bcrypt");
jest.mock("jsonwebtoken");

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

jest.mock("jsonwebtoken");

(jwt.sign as jest.Mock).mockReturnValue("mocked_jwt_token");
(jwt.verify as jest.Mock).mockReturnValue({ user_id: 1, username: "testuser" });

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
    const res = await request(app).post("/auth/signin").send({});
    expect(res.status).toBe(400);
    expect(res.body.result).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  it("doit retourner une erreur 404 si l'utilisateur n'existe pas", async () => {
    (query as jest.Mock).mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .post("/auth/signin")
      .send({ username: "inexistant", password_hash: "password123" });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Utilisateur non trouvé.");
  });

  it("doit retourner une erreur 401 si le mot de passe est incorrect", async () => {
    (query as jest.Mock).mockResolvedValueOnce({ rows: [mockUser] });
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

    const res = await request(app)
      .post("/auth/signin")
      .send({ username: "testuser", password_hash: "wrongpassword" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Mot de passe incorrect.");
  });

  it("doit connecter l'utilisateur avec succès et retourner un token", async () => {
    (query as jest.Mock).mockResolvedValueOnce({ rows: [mockUser] });
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
    (jwt.sign as jest.Mock).mockReturnValue("mocked_token");

    const res = await request(app)
      .post("/auth/signin")
      .send({ username: "testuser", password_hash: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.result).toBe(true);
    expect(res.body.token).toBe("mocked_token");
    expect(res.body.message).toBe("Utilisateur connecté.");
  });

  it("doit retourner une erreur 500 en cas de problème serveur", async () => {
    (query as jest.Mock).mockRejectedValueOnce(new Error("Erreur serveur"));

    const res = await request(app)
      .post("/auth/signin")
      .send({ username: "testuser", password_hash: "password123" });

    expect(res.status).toBe(500);
    expect(res.body.result).toBe(false);
    expect(res.body.message).toBe("Erreur interne du serveur.");
  });
});
