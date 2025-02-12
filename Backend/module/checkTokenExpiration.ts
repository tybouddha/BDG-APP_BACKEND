import { query } from "../src/config/database";
import { Request, Response, NextFunction } from "express";

const checkTokenExpiration = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers["authorization"]?.split(" ")[1]; // Bearer token
  if (!token) return res.status(401).json({ message: "Token manquant" });

  try {
    const result = await query(
      "SELECT token_expiration FROM users WHERE token = $1",
      [token]
    );
    if (
      result.rows.length === 0 ||
      new Date(result.rows[0].token_expiration) < new Date()
    ) {
      return res
        .status(401)
        .json({ message: "Token expiré, veuillez vous reconnecter." });
    }
    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur interne du serveur." });
  }
};

export default checkTokenExpiration;
