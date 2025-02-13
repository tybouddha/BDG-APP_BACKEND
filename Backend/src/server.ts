import dotenv from "dotenv";
import app from "./app"; // Importer l'application configurée dans app.ts
import { query } from "./config/database";

// Charger les variables d'environnement
dotenv.config();
console.log("DB_USER:", process.env.DB_USER); // Vérifier si les variables sont bien chargées

// Test de la connexion à la base de données avant de démarrer le serveur
(async () => {
  try {
    const result = await query("SELECT NOW()");
    console.log("Connexion réussie à PostgreSQL :", result.rows[0]);
  } catch (error) {
    console.error("Erreur de connexion à PostgreSQL :", error);
    process.exit(1); // Stoppe le démarrage si la base est inaccessible
  }
})();

// Lancer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
