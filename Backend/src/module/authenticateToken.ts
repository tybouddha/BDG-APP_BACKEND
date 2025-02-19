import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

dotenv.config();

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.log("Authorization Header :", req.headers.authorization);
  const authHeader = req.headers.authorization;

  // Vérification de la présence et du format du token
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("Token manquant ou invalide");
    res.status(401).json({ result: false, message: "Pas de token reçu." });
    return;
  }

  const token = authHeader.split(" ")[1];
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!JWT_SECRET) {
    res.status(500).json({
      result: false,
      message:
        "JWT_SECRET doit être défini dans les variables d'environnement.",
    });
    return;
  }

  // Vérification du token
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { user_id: string };
    (req as any).user = decoded; // Ajoute les infos du token au req pour la suite
    next(); // Passe à la route suivante
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      res.status(401).json({ result: false, message: "Token expiré." });
    } else {
      res.status(401).json({ result: false, message: "Token invalide." });
    }
  }
};
