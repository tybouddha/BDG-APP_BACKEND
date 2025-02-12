import express, { Request, Response } from "express";
import path from "path";

const app = express();

// Configurer le moteur de rendu
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Exemple d'itinéraire avec res.render()
app.get("/", (req: Request, res: Response) => {
  res.render("index", { message: "Hello World!" });
});

app.listen(3000, () => console.log("Serveur démarré sur le port 3000"));
