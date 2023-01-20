const express = require("express"); //serveur local
//cors
const cors = require("cors");
const mongoose = require("mongoose"); //lien vers BD
//dotenv
require("dotenv").config(); //permet d'activer les variables d'environnement qui sont dans le fichier `.env`

//import de fileupload qui nous permet de recevoir des formats
const fileUpload = require("express-fileupload");

//import de Cloudinary
const cloudinary = require("cloudinary").v2;

//A déclarer dans les routes car non utilisé ici:
// const uid2 = require("uid2"); // création string aléatoire
// const SHA256 = require("crypto-js/sha256"); //encrypter une string
// const encBase64 = require("crypto-js/enc-base64"); //transforme l'encryptage en string

const app = express();
app.use(cors());
app.use(express.json());

mongoose.set("strictQuery", false);
mongoose.connect(process.env.MONGODB_URI); //ceci renvoie àl'url contenue dans le fichier `.env`

//Je me connecte à mon compte cloudinary avec les identifiants présents sur mon compte: il est plus lisible de le faire sur le index.js que sur la route
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

//Import de mes fichiers de routes (bien penser à le faire avant le app.all)

const authRoutes = require("./routes/profil");
app.use(authRoutes);
const logRoutes = require("./routes/login");
app.use(logRoutes);
const offRoutes = require("./routes/offer");
app.use(offRoutes);

// Ceci est une route pour dire boujour
app.get("/", (req, res) => {
  res.json("Bienvenue sur mon serveur");
});
// url du serveur: https://site--backend-vinted--zqfvjrr4byql.code.run/
//
app.all("*", (req, res) => {
  res.status(400).json({ message: "This route doesn't exist" });
});

app.listen(process.env.PORT, () => {
  console.log("server started 🟩");
});


