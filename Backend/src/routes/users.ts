import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { query } from "../config/database";
import dotenv from "dotenv";
import { authenticateToken } from "../module/authenticateToken";

dotenv.config();

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;

//****************//
//  ROUTE POST   //
//**************//

// Route POST /auth/signup
router.post(
  "/signup",
  [
    // 1.Validation des champs
    body("username")
      .notEmpty()
      .withMessage("Le nom d'utilisateur est obligatoire."),
    body("email").isEmail().withMessage("Format d'email invalide."),
    body("password_hash")
      .isLength({ min: 6 })
      .withMessage("Le mot de passe doit contenir au moins 6 caractères."),
  ],
  async (req: Request, res: Response): Promise<void> => {
    console.log("Requête reçue sur /auth/signup");
    // 2.Vérification des erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("Erreurs de validation :", errors.array());
      res.status(400).json({
        result: false,
        errors: errors.array(),
      });
      return;
    }
    // 3.Extraction des données
    const { username, email, password_hash } = req.body;

    try {
      // 4.Vérifier si l'utilisateur existe déjà
      const userExists = await query("SELECT * FROM users WHERE email = $1", [
        email,
      ]);
      if (userExists.rows.length > 0) {
        res.status(409).json({
          result: false,
          message: "Un utilisateur avec cet email existe déjà.",
        });
        return;
      }

      // 5.Hash du mot de passe
      const hashedPassword = await bcrypt.hash(password_hash, 10);
      if (!process.env.JWT_SECRET) {
        throw new Error(
          "JWT_SECRET doît être obligatoirement défini dans les variables d'environnement"
        );
        return;
      }
      // 6.Génération du token JWT
      const token = jwt.sign({ email }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      // 7.Insertion de l'utilisateur dans la base
      const result = await query(
        `INSERT INTO users (username, email, password_hash, token, token_expiration) 
         VALUES ($1, $2, $3, $4, NOW() + INTERVAL '1 hour') 
         RETURNING id, username, email, created_at`,
        [username, email, hashedPassword, token]
      );

      // 8.Réponse de succès
      res.status(201).json({
        result: true,
        message: "Utilisateur créé avec succès.",
        user: {
          id: result.rows[0].id,
          username: result.rows[0].username,
          email: result.rows[0].email,
          created_at: result.rows[0].created_at,
        },
      });
    } catch (error) {
      console.error("Erreur lors de la création d'un utilisateur :", error);
      res.status(500).json({
        result: false,
        message: "Erreur interne du serveur.",
      });
    }
  }
);

//Route POST /auth/signin
router.post(
  "/signin",

  [
    // 1.Validation des champs
    body("username")
      .notEmpty()
      .withMessage("Le nom d'utilisateur est obligatoire."),
    body("password_hash")
      .isLength({ min: 6 })
      .withMessage("Le mot de passe doit contenir au moins 6 caractères."),
  ],
  async (req: Request, res: Response): Promise<void> => {
    console.log("Requête reçue sur /auth/signin");
    try {
      // 2.Vérification des erreurs de validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          result: false,
          errors: errors.array(),
        });
        return;
      }

      // 3.Extraction des données
      const { username, password_hash } = req.body;

      // 4.Vérifier si l'utilisateur existe déjà
      const userResult = await query(
        "SELECT * FROM users WHERE username = $1",
        [username]
      );
      const userExists = userResult.rows;
      if (userExists.length === 0) {
        res.status(404).json({ error: "Utilisateur non trouvé." });
        return;
      }
      // 5.Vérifier la concordance des mots de passe
      const passwordMatch = await bcrypt.compare(
        password_hash,
        userExists[0].password_hash
      );
      if (!passwordMatch) {
        res.status(401).json({ error: "Mot de passe incorrect." });
        return;
      }

      if (!JWT_SECRET) {
        throw new Error(
          "JWT_SECRET doit être obligatoirement défini dans les variables d'environnement"
        );
      }

      // 6.Génération du token JWT
      const token = jwt.sign(
        { username, user_id: userExists[0].id },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      // 7.Réponse du succès
      res.status(200).json({
        result: true,
        message: "Utilisateur connecté.",
        token: token,
      });
    } catch (error) {
      console.error("Erreur lors de la connexion de l'utilisateur :", error);
      res.status(500).json({
        result: false,
        message: "Erreur interne du serveur.",
      });
    }
  }
);

//****************//
//  ROUTE PUT    //
//**************//

//****************//
//  ROUTE DELETE //
//**************//

//****************//
//  ROUTE GET    //
//**************//

router.get(
  "/userData",
  authenticateToken, // Middleware pour vérifier le token
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { user_id } = (req as any).user; // Récupérer `user_id` ajouté par le middleware
      console.log("ID utilisateur extrait du token :", user_id);

      // Récupération des informations utilisateur
      const userQuery = await query(
        "SELECT id, username, email FROM users WHERE id = $1",
        [user_id]
      );

      if (!userQuery || userQuery.rows.length === 0) {
        res.status(404).json({
          result: false,
          message: "Utilisateur non trouvé.",
        });
        return;
      }

      const user = userQuery.rows[0];
      res.status(200).json({
        result: true,
        message: "Utilisateur récupéré avec succès.",
        user,
      });
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des informations utilisateur :",
        error
      );
      res.status(500).json({
        result: false,
        message: "Erreur interne du serveur.",
      });
    }
  }
);

export default router;
