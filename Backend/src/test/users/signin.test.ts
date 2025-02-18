import dotenv from "dotenv"; // Importation de dotenv pour charger les variables d'environnement
import request from "supertest"; // Importation de Supertest pour faire des requêtes HTTP
import app from "../../app"; // Importation de l'application Express
import { query } from "../../config/database"; // Importation de la fonction query pour interagir avec la base de données
import bcrypt from "bcrypt"; // Pour le hashage des mots de passe
import jwt from "jsonwebtoken"; // Pour les tokens JWT

// Chargez les variables d'environnement à partir de .env.test
dotenv.config({ path: ".env.test" });

// Mock des modules bcrypt et jsonwebtoken
jest.mock("bcrypt", () => ({
  hash: jest.fn().mockResolvedValue("hashed_password"), // Simulez le hachage du mot de passe
  compare: jest.fn(), // Mock la fonction compare
}));
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn().mockReturnValue(process.env.JWT_SECRET),
  verify: jest.fn().mockReturnValue({ user_id: 1, username: "testuser" }),
}));

// Mock de query
jest.mock("../../config/database", () => ({
  query: jest.fn(),
}));

// Après chaque test, nettoyez la base de données pour éviter les interférences
afterEach(async () => {
  await query("DELETE FROM users WHERE email = $1", ["test@example.com"]); // Supprimez les utilisateurs de test
  jest.clearAllMocks(); // Réinitialiser les mocks
});
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

  it("doit retourner une erreur 500 en cas de problème serveur", async () => {
    (query as jest.Mock).mockRejectedValueOnce(new Error("Erreur serveur")); // Simulez une erreur de base de données

    const res = await request(app)
      .post("/auth/signin")
      .send({ username: "testuser", password_hash: "password123" });

    expect(res.status).toBe(500); // Vérifiez que la réponse est 500
    expect(res.body.result).toBe(false); // Vérifiez que le résultat est faux
    expect(res.body.message).toBe("Erreur interne du serveur."); // Vérifiez le message d'erreur
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
