import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Route pour rafraîchir le token
router.post("/refresh", (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      res.status(401).json({ result: false, message: "Pas de token reçu." });
      return;
    }

    jwt.verify(token, JWT_SECRET!, (err, decoded: any) => {
      if (err) {
        console.error("Erreur de vérification du token :", err);
        res
          .status(401)
          .json({ result: false, message: "Token invalide ou expiré." });
        return;
      }

      // Génère un nouveau token
      const newToken = jwt.sign(
        { id: decoded.id, email: decoded.email },
        JWT_SECRET!,
        {
          expiresIn: "1h", // Ajuste la durée selon tes besoins
        }
      );

      res.status(200).json({
        result: true,
        message: "Token rafraîchi avec succès.",
        token: newToken,
      });
    });
  } catch (error) {
    console.error("Erreur lors du rafraîchissement du token :", error);
    res
      .status(500)
      .json({ result: false, message: "Erreur interne du serveur." });
  }
});

export default router;
