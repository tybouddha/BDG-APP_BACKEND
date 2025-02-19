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
  query: jest.fn().mockImplementation((queryText: string, params: any[]) => {
    if (queryText.includes("INSERT")) {
      return Promise.resolve({ rows: [{ user_id: 1 }] }); // Simule un utilisateur inséré
    }
    if (queryText.includes("SELECT")) {
      return Promise.resolve({
        rows: [
          {
            id: 1,
            username: "testuser",
            email: "test@example.com",
          },
        ],
      }); // Simule un utilisateur récupéré
    }
    return Promise.resolve({ rows: [] }); // Cas par défaut
  }),
}));

// Après chaque test, nettoyez la base de données pour éviter les interférences
afterEach(async () => {
  await query("DELETE FROM users WHERE email = $1", ["test@example.com"]); // Supprimez les utilisateurs de test
  jest.clearAllMocks(); // Réinitialiser les mocks
});

describe("GET /auth/userData", () => {
  let userId: number;
  let token: string;

  // Avant tous les tests, insère un utilisateur de test dans la base
  beforeAll(async () => {
    const result = await query(
      "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING user_id",
      ["testuser", "test@example.com", "hashedpassword123"]
    );
    userId = result.rows[0].user_id;

    // Génère un token valide pour cet utilisateur
    token = jwt.sign({ user_id: userId }, process.env.JWT_SECRET as string, {
      expiresIn: "1h",
    });
  });

  // Après tous les tests, nettoie la base de données
  afterAll(async () => {
    await query("DELETE FROM users WHERE email = $1", ["test@example.com"]);
  });

  it("doit récupérer les informations de l'utilisateur avec un token valide", async () => {
    const mockUser = {
      user_id: 1,
      username: "testuser",
      email: "test@example.com",
    };

    (query as jest.Mock).mockResolvedValueOnce({ rows: [mockUser] }); // Simulez la réponse de la base de données

    // Générer un token valide pour cet utilisateur
    const token = jwt.sign(
      { user_id: mockUser.user_id },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    const res = await request(app)
      .get("/auth/userData")
      .set("Authorization", `Bearer ${token}`); // Ajoutez le token dans l'en-tête

    expect(res.status).toBe(200); // Vérifiez que la réponse est 200
    expect(res.body.result).toBe(true); // Vérifiez que le résultat est vrai
    expect(res.body.user).toEqual(mockUser); // Vérifiez que les données de l'utilisateur sont correctes
  });

  it("doit retourner une erreur 401 si le token est manquant", async () => {
    const res = await request(app).get("/auth/userData"); // Pas de token

    expect(res.status).toBe(401); // Erreur non autorisé
    expect(res.body.result).toBe(false);
    expect(res.body.message).toBe("Pas de token reçu.");
  });

  it("doit retourner une erreur 401 si le token est invalide", async () => {
    const res = await request(app)
      .get("/auth/userData")
      .set("Authorization", "Bearer invalid_token");

    expect(res.status).toBe(401); // Erreur non autorisé
    expect(res.body.result).toBe(false);
    expect(res.body.message).toBe("Token invalide.");
  });

  it("doit retourner une erreur 404 si l'utilisateur n'existe pas", async () => {
    (query as jest.Mock).mockResolvedValueOnce({ rows: [] }); // Simulez l'absence d'utilisateur

    const token = jwt.sign({ user_id: 999 }, process.env.JWT_SECRET as string, {
      expiresIn: "1h",
    }); // ID d'utilisateur inexistant

    const res = await request(app)
      .get("/auth/userData")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404); // Vérifiez que la réponse est 404
    expect(res.body.message).toBe("Utilisateur non trouvé."); // Vérifiez le message d'erreur
  });
});
