import pool from "./config/database"; // Chemin vers ton fichier de configuration DB

// Réinitialiser la base avant chaque test
beforeEach(async () => {
  await pool.query("TRUNCATE TABLE accounts RESTART IDENTITY CASCADE");
  await pool.query("TRUNCATE TABLE users RESTART IDENTITY CASCADE");
});

// Fermer la connexion après tous les tests
afterAll(async () => {
  await pool.end();
});
