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
}));
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn().mockReturnValue(process.env.JWT_SECRET),
  verify: jest.fn().mockReturnValue({ user_id: 1, username: "testuser" }),
}));

// Après chaque test, nettoyez la base de données pour éviter les interférences
afterEach(async () => {
  await query("DELETE FROM users WHERE email = $1", ["test@example.com"]); // Supprimez les utilisateurs de test
  jest.clearAllMocks(); // Réinitialiser les mocks
});

// Début de la suite de tests pour la route POST /auth/signup
describe("POST /auth/signup", () => {
  // Test pour vérifier l'insertion d'un utilisateur dans la base de données
  it("doit insérer un utilisateur dans la base de données et appeler bcrypt et jwt", async () => {
    // Simuler le comportement de bcrypt.hash
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashed_password");

    // Simuler le comportement de jwt.sign
    (jwt.sign as jest.Mock).mockReturnValue(process.env.JWT_SECRET);

    const res = await request(app).post("/auth/signup").send({
      username: "testuser",
      email: "test@example.com",
      password_hash: "password123", // Utilisez le bon champ ici
    });

    expect(res.status).toBe(201); // Vérifiez que la réponse est 201
    expect(res.body.result).toBe(true); // Vérifiez que le résultat est vrai

    // Vérification que bcrypt.hash a été appelé correctement
    expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);

    // Vérification que jwt.sign a été appelé correctement
    expect(jwt.sign).toHaveBeenCalledWith(
      { email: "test@example.com" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Vérifiez que l'utilisateur a bien été inséré
    const result = await query("SELECT * FROM users WHERE email = $1", [
      "test@example.com",
    ]);

    expect(result.rows.length).toBe(1); // L'utilisateur doit être dans la base
    expect(result.rows[0].email).toBe("test@example.com"); // Vérifiez que l'email est correct
  });

  // Test pour vérifier le comportement en cas de champs manquants
  it("doit retourner une erreur 400 si les champs requis sont manquants", async () => {
    const res = await request(app).post("/auth/signup").send({});
    expect(res.status).toBe(400); // Vérifiez que la réponse est 400
    expect(res.body.result).toBe(false); // Vérifiez que le résultat est faux
    expect(res.body.errors).toBeDefined(); // Vérifiez que des erreurs sont définies
  });

  // Test pour vérifier le comportement si l'email existe déjà
  it("doit retourner une erreur 409 si l'email existe déjà", async () => {
    // Insérez d'abord un utilisateur pour simuler l'existence de l'email
    await query(
      "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)",
      ["existinguser", "test@example.com", "password123"]
    );

    const res = await request(app).post("/auth/signup").send({
      username: "testuser",
      email: "test@example.com",
      password_hash: "password123",
    });

    expect(res.status).toBe(409); // Vérifiez que la réponse est 409
    expect(res.body.message).toBe("Un utilisateur avec cet email existe déjà."); // Vérifiez le message d'erreur
  });

  // Test pour vérifier le comportement si l'email est invalide
  it("doit retourner une erreur 400 si l'email est invalide", async () => {
    const res = await request(app).post("/auth/signup").send({
      username: "testuser",
      email: "testexample.com", // Email invalide
      password_hash: "password123",
    });
    expect(res.status).toBe(400); // Vérifiez que la réponse est 400
    expect(res.body.errors[0].msg).toBe("Format d'email invalide."); // Vérifiez le message d'erreur
  });

  // Test pour vérifier le comportement si le mot de passe est trop court
  it("doit retourner une erreur 400 si le mot de passe est trop court", async () => {
    const res = await request(app).post("/auth/signup").send({
      username: "testuser",
      email: "test@example.com",
      password_hash: "123", // Mot de passe trop court
    });
    expect(res.status).toBe(400); // Vérifiez que la réponse est 400
    expect(res.body.errors[0].msg).toBe(
      "Le mot de passe doit contenir au moins 6 caractères."
    ); // Vérifiez le message d'erreur
  });

  // Test pour vérifier le comportement si bcrypt échoue
  it("doit retourner une erreur 400 si bcrypt échoue", async () => {
    // Simuler une erreur de bcrypt
    (bcrypt.hash as jest.Mock).mockRejectedValue(new Error("Hashing error"));

    const res = await request(app).post("/auth/signup").send({
      username: "testuser",
      email: "test@example.com",
      password_hash: "password123",
    });
    // Vérifications sur la réponse
    expect(res.status).toBe(500); // Statut 500 pour erreur serveur
    expect(res.body.result).toBe(false); // Le résultat doit être faux
    expect(res.body.message).toBe("Erreur interne du serveur."); // Message d'erreur générique

    // Vérifier que bcrypt.hash a été appelé
    expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
  });

  it("doit retourner une erreur 500 si jwt.sign échoue", async () => {
    // Simuler le comportement de bcrypt.hash
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashed_password");

    // Simuler une erreur dans jwt.sign
    (jwt.sign as jest.Mock).mockImplementation(() => {
      throw new Error("JWT error");
    });

    const res = await request(app).post("/auth/signup").send({
      username: "testuser",
      email: "test@example.com",
      password_hash: "password123",
    });

    // Vérifications sur la réponse
    expect(res.status).toBe(500); // Statut 500 pour erreur serveur
    expect(res.body.result).toBe(false); // Le résultat doit être faux
    expect(res.body.message).toBe("Erreur interne du serveur."); // Message d'erreur générique

    // Vérifier que bcrypt.hash a été appelé
    expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);

    // Vérifier que jwt.sign a été appelé
    expect(jwt.sign).toHaveBeenCalled();
  });

  // Test pour vérifier le comportement si jwt échoue
  it("doit retourner une erreur 500 si jwt.sign échoue", async () => {
    // Simuler le comportement de bcrypt.hash
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashed_password");

    // Simuler une erreur dans jwt.sign
    (jwt.sign as jest.Mock).mockImplementation(() => {
      throw new Error("JWT error");
    });

    const res = await request(app).post("/auth/signup").send({
      username: "testuser",
      email: "test@example.com",
      password_hash: "password123",
    });

    // Vérifications sur la réponse
    expect(res.status).toBe(500); // Statut 500 pour erreur serveur
    expect(res.body.result).toBe(false); // Le résultat doit être faux
    expect(res.body.message).toBe("Erreur interne du serveur."); // Message d'erreur générique

    // Vérifier que bcrypt.hash a été appelé
    expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);

    // Vérifier que jwt.sign a été appelé
    expect(jwt.sign).toHaveBeenCalled();
  });
});
