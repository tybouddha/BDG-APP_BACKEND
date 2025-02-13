"use strict";
require("dotenv").config(); // Lien avec le fichier .env (doit être en tout premier)
var express = require("express");
var path = require("path");
var cors = require("cors");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
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
var indexRouter = require("./src/routes/index");
var usersRouter = require("./src/routes/users");
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use("/", indexRouter);
app.use("/users", usersRouter);

export default app;
