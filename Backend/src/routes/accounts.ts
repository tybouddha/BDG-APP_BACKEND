import jwt from "jsonwebtoken";
import { Request, Response, Router } from "express";
import { query } from "../config/database";
import dotenv from "dotenv";

dotenv.config();

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Route POST /accounts/create
router.post("/create", async (req: Request, res: Response): Promise<void> => {
  console.log("Requête reçue sur /accounts/create");

  try {
    // 1. Vérification du token
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      res.status(401).json({ result: false, message: "Pas de token reçu." });
      return;
    }

    if (!JWT_SECRET) {
      throw new Error(
        "JWT_SECRET doit être défini dans les variables d'environnement"
      );
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET); // Vérifie et décode le token
    } catch (err) {
      res.status(401).json({ result: false, message: "Token invalide." });
      return;
    }

    // 2. Validation des données du corps de la requête
    const { user_id, name, balance, currency, is_active } = req.body;

    if (
      !user_id ||
      !name ||
      balance === undefined ||
      !currency ||
      is_active === undefined
    ) {
      res.status(400).json({
        result: false,
        message: "Des informations obligatoires sont manquantes.",
      });
      return;
    }

    // 3. Vérification si l'utilisateur existe
    const userExists = await query("SELECT * FROM users WHERE id = $1", [
      user_id,
    ]);
    if (userExists.rows.length === 0) {
      res.status(400).json({
        result: false,
        message: "L'utilisateur n'existe pas.",
      });
      return;
    }

    // 4. Création du compte
    const result = await query(
      `INSERT INTO accounts (user_id, name, balance, currency, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, name, balance, currency, is_active`,
      [user_id, name, balance, currency, is_active]
    );

    // 5. Réponse de succès
    res.status(201).json({
      result: true,
      message: "Compte créé avec succès.",
      account: {
        id: result.rows[0].id,
        user_id: result.rows[0].user_id,
        name: result.rows[0].name,
        balance: result.rows[0].balance,
        currency: result.rows[0].currency,
        is_active: result.rows[0].is_active,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la création du compte :", error);
    res.status(500).json({
      result: false,
      message: "Erreur interne du serveur.",
    });
  }
});

export default router;
