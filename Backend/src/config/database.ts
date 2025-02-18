import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

// Configuration de la base de données
const pool = new Pool({
  user: process.env.DB_USER, // Utilisateur de la base
  host: process.env.DB_HOST, // Hôte de la base de données
  database: process.env.DB_NAME, // Nom de la base de données
  password: process.env.DB_PASSWORD, // Mot de passe
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined, // Port PostgreSQL
});

// Fonction pour exécuter des requêtes SQL
export const query = async (text: string, params?: any[]) => {
  try {
    return await pool.query(text, params);
  } catch (error) {
    console.error("Erreur lors de l'exécution de la requête :", error);
    throw error; // Relancez l'erreur pour qu'elle soit capturée dans votre route
  }
};

console.log("🚀 Connecté à PostgreSQL");

// Exporter le pool pour d'autres fichiers si nécessaire
export default pool;
