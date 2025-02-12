import dotenv from "dotenv";
import express from "express";
import { query } from "./config/database";

// Charger les variables d'environnement
dotenv.config();
console.log("DB_USER:", process.env.DB_USER); //Pour voir si les variable env sont bien chargées

const app = express();
app.use(express.json());

// Exemple de route pour tester la base de données
app.get("/test-db", async (req, res) => {
  try {
    const result = await query("SELECT NOW()"); // Teste la connexion avec la commande SQL
    res.json({ message: "Connexion réussie !", time: result.rows[0] });
  } catch (error) {
    console.error("Erreur de connexion :", error);
    res.status(500).json({ error: "Erreur de connexion à la base de données" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
