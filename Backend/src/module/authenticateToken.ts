import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.token; // ou req.headers.authorization

  if (!token) {
    return res.sendStatus(401); // Unauthorized
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).send("JWT_SECRET is not defined"); // Erreur serveur
  }

  // Vérification du token
  jwt.verify(token, secret, (err: any, user: any) => {
    if (err) return res.sendStatus(403); // Forbidden
    req.user = user; // Assurez-vous que req.user est défini
    next();
  });
};

export default authenticateToken;
