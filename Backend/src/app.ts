"use strict";
require("dotenv").config(); // Lien avec le fichier .env (doit être en tout premier)
import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import usersRouter from "./routes/users";
import accountsRouter from "./routes/accounts";
const path = require("path");
var cors = require("cors");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var indexRouter = require("./index");

const app = express();

// Configuration de CORS
app.use(cors()); // Autorise toutes les origines par défaut

//Vérification des variables d'environnement de la bdd
if (!process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_HOST) {
  console.error(
    "⚠️  Certaines variables de configuration de la base de données sont manquantes."
  );
  process.exit(1);
}
// Vérification de la variable d'environnement JWT_SECRET
if (!process.env.JWT_SECRET) {
  console.error(
    "⚠️  JWT_SECRET est manquant dans le fichier .env. L'application ne peut pas démarrer."
  );
  process.exit(1); // Stoppe le serveur
}

// Middleware
app.use(bodyParser.json()); // Pour parser le body en JSON

// Routes
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use("/", indexRouter);
app.use("/auth", usersRouter);
app.use("/accounts", accountsRouter);

// Gestion des routes non trouvées
app.use((req: Request, res: Response) => {
  res.status(404).json({
    result: false,
    message: "Route non trouvée.",
  });
});

app._router.stack.forEach((layer: any) => {
  if (layer.route) {
    console.log(layer.route.path);
  }
});

export default app;
