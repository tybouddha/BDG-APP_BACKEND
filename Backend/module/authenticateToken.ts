import dotenv from "dotenv";
const jwt = require("jsonwebtoken");

dotenv.config();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer TOKEN"

  if (!token) {
    return res
      .status(401)
      .json({ error: "Accès refusé : Aucun token fourni." });
  }

  // Vérification du token
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Token invalide ou expiré." });
    }
    req.user = user; // Attache les informations utilisateur au req
    next();
  });
};

module.exports = authenticateToken;
