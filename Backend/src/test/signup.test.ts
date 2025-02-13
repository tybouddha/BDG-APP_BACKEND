import request from "supertest";
import app from "../app"; // Ton fichier principal Express (où app est créé)
import { query } from "../config/database";

// Mock de la base de données
jest.mock("../config/database", () => ({
  query: jest.fn(),
}));

describe("POST /signup", () => {
  const signupEndpoint = "/signup";

  it("Devrait créer un utilisateur avec succès", async () => {
    (query as jest.Mock).mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          username: "testuser",
          email: "test@mail.com",
          created_at: "2025-02-11",
        },
      ],
    });

    const res = await request(app).post(signupEndpoint).send({
      username: "testuser",
      email: "test@mail.com",
      password: "password123",
    });

    expect(res.status).toBe(201);
    expect(res.body.result).toBe(true);
    expect(res.body.user.username).toBe("testuser");
  });

  it("Devrait échouer si l'utilisateur existe déjà", async () => {
    (query as jest.Mock).mockResolvedValueOnce({
      rows: [{ email: "test@mail.com" }],
    });

    const res = await request(app).post(signupEndpoint).send({
      username: "testuser",
      email: "test@mail.com",
      password: "password123",
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Un utilisateur avec cet email existe déjà.");
  });

  it("Devrait échouer si un champ obligatoire est manquant", async () => {
    const res = await request(app)
      .post(signupEndpoint)
      .send({ email: "test@mail.com" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Champs manquants ou mal renseignés.");
  });
});
