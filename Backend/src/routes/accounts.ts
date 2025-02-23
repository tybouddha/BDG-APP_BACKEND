import jwt from "jsonwebtoken";
import { Request, Response, Router } from "express";
import { query } from "../config/database";
import dotenv from "dotenv";
import { log } from "console";

dotenv.config();

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;

//****************//
//  ROUTE GET    //
//**************//

// Route GET pour voir les comptes associé à l'utilisateur
router.get("/accounts", async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Vérification du token
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      res.status(401).json({ result: false, message: "Pas de token reçu." });
      return;
    }

    if (!JWT_SECRET) {
      res.status(500).json({
        result: false,
        message:
          "JWT_SECRET doit être défini dans les variables d'environnement.",
      });
      return;
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET); // Décodage du token
    } catch (err) {
      res.status(401).json({ result: false, message: "Token invalide." });
      return;
    }

    // 2. Récupération de l'ID utilisateur depuis le token
    const userIdFromToken = decoded.user_id;

    // 3. Récupération des comptes associés à l'utilisateur
    const accountsQuery = await query(
      "SELECT id, name, balance, currency, is_active FROM accounts WHERE user_id = $1",
      [userIdFromToken]
    );

    // 4. Vérification s'il y a des comptes associés
    if (accountsQuery.rows.length === 0) {
      res.status(404).json({
        result: false,
        message: "Aucun compte trouvé pour cet utilisateur.",
      });
      return;
    }

    // 5. Réponse avec les comptes trouvés
    res.status(200).json({
      result: true,
      message: "Comptes récupérés avec succès.",
      accounts: accountsQuery.rows,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des comptes :", error);
    res.status(500).json({
      result: false,
      message: "Erreur interne du serveur.",
    });
  }
});

//****************//
//  ROUTE POST   //
//**************//

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

//****************//
//  ROUTE PUT    //
//**************//

// Route PUT /accounts/update/:id
router.put(
  "/update/:id",
  async (req: Request, res: Response): Promise<void> => {
    console.log("Requête reçue sur /accounts/update/:id");

    try {
      // 1. Vérification du token
      // const tokenHeader = req.headers.authorization;
      // console.log(`Header Authorization reçu : ${tokenHeader}`);
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        res.status(401).json({ result: false, message: "Pas de token reçu." });
        return;
      }
      // console.log(`token reçu : ${token}`);

      if (!JWT_SECRET) {
        throw new Error(
          "JWT_SECRET doit être défini dans les variables d'environnement"
        );
      }

      let decoded: any;
      try {
        // console.log(JWT_SECRET);
        decoded = jwt.verify(token, JWT_SECRET); // Vérifie et décode le token
      } catch (err) {
        res.status(401).json({ result: false, message: "Token invalide." });
        return;
      }

      // console.log("Token décodé :", decoded);
      // 2. Validation des données entrantes
      const { name, balance, currency, is_active } = req.body;
      const accountId = req.params.id;

      if (!accountId) {
        res
          .status(400)
          .json({ result: false, message: "ID du compte manquant." });
        return;
      }

      // Optionnel : Vérifier que l'utilisateur a les droits pour modifier le compte
      const userIdFromToken = decoded.user_id; // Assurez-vous que le token contient cette information
      const accountOwner = await query(
        "SELECT user_id FROM accounts WHERE id = $1",
        [accountId]
      );

      if (accountOwner.rows.length === 0) {
        res.status(404).json({ result: false, message: "Compte introuvable." });
        return;
      }

      if (accountOwner.rows[0].user_id !== userIdFromToken) {
        res.status(403).json({ result: false, message: "Accès non autorisé." });
        return;
      }

      // 3. Mise à jour du compte dans la base de données
      const updatedAccount = await query(
        `UPDATE accounts 
       SET name = COALESCE($1, name), 
           balance = COALESCE($2, balance), 
           currency = COALESCE($3, currency), 
           is_active = COALESCE($4, is_active)
       WHERE id = $5
       RETURNING id, user_id, name, balance, currency, is_active`,
        [name, balance, currency, is_active, accountId]
      );

      if (updatedAccount.rows.length === 0) {
        res.status(404).json({
          result: false,
          message: "Échec de la mise à jour. Compte introuvable.",
        });
        return;
      }

      // 4. Réponse de succès
      res.status(200).json({
        result: true,
        message: "Compte mis à jour avec succès.",
        account: updatedAccount.rows[0],
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du compte :", error);
      res.status(500).json({
        result: false,
        message: "Erreur interne du serveur.",
      });
    }
  }
);

//****************//
//  ROUTE DELETE //
//**************//

// Route DELETE avec option id du compte ou nom du  compte
router.delete("/delete", async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Vérification du token
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      res.status(401).json({ result: false, message: "Pas de token reçu." });
      return;
    }

    if (!JWT_SECRET) {
      res.status(500).json({
        result: false,
        message:
          "JWT_SECRET doit être défini dans les variables d'environnement.",
      });
      return;
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      res.status(401).json({ result: false, message: "Token invalide." });
      return;
    }

    const userIdFromToken = decoded.user_id;

    // 2. Validation des données entrantes
    const { id, name } = req.query; // On accepte soit un ID, soit un nom de compte
    if (!id && !name) {
      res.status(400).json({
        result: false,
        message: "ID ou nom du compte manquant.",
      });
      return;
    }

    let accountQuery: any;
    if (id) {
      // Recherche par ID
      accountQuery = await query(
        "SELECT id, user_id FROM accounts WHERE id = $1",
        [id]
      );
    } else if (name) {
      // Recherche par nom
      accountQuery = await query(
        "SELECT id, user_id FROM accounts WHERE name = $1 AND user_id = $2",
        [name, userIdFromToken]
      );
    }

    if (accountQuery.rows.length === 0) {
      res.status(404).json({
        result: false,
        message: "Compte introuvable.",
      });
      return;
    }

    const account = accountQuery.rows[0];

    // Vérification de l'appartenance
    if (account.user_id !== userIdFromToken) {
      res.status(403).json({
        result: false,
        message: "Accès non autorisé.",
      });
      return;
    }

    // 3. Suppression du compte
    const deleteAccount = await query("DELETE FROM accounts WHERE id = $1", [
      account.id,
    ]);

    if (deleteAccount.rowCount === 0) {
      res.status(500).json({
        result: false,
        message: "Échec de la suppression du compte.",
      });
      return;
    }

    // 4. Réponse de succès
    res.status(200).json({
      result: true,
      message: "Compte supprimé avec succès.",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression du compte :", error);
    res.status(500).json({
      result: false,
      message: "Erreur interne du serveur.",
    });
  }
});

export default router;
