const express = require("express");
const uid2 = require("uid2"); // Package qui sert à créer des string aléatoires
const SHA256 = require("crypto-js/sha256"); // Sert à encripter une string
const encBase64 = require("crypto-js/enc-base64"); // Sert à transformer l'encryptage en string

const router = express.Router();

const Profil = require("../models/Profil");
//

router.post("/user/signup", async (req, res) => {
  try {
    //Destructuring en créant les variables userrname, email....
    const { username, email, password, newsletter } = req.body;
    //console.log(email);

    if (!username || !email || !password || typeof newsletter !== "boolean") {
      return res.status(400).json({ message: "Missing parameter ⚠️" });
    }
    const profilToFind = await Profil.findOne({ email: email }); //on peut aussi passer par .exist qui renvoie directement à l'Id au lieu de 
    //l'email dans le profil complet
    //console.log(profilToFind); //pour savoir si le mail existe deja dans la BD: va chercher avec l'Id la correspondance email
    //et donc si profilToFind qui contient l'email en question existe ou pas

    if (profilToFind) {
      return res.status(400).json({ message: "email already exist ⚠️" });
    }

    // const password1 = password;
    // console.log("password1 :", password);
    //on peut se passer des 2 lignes de dessus et mettre directement password au lieu de créer une var password1 et faire (salt + password1)
    const salt = uid2(16);
    //console.log("salt :", salt);
    const hash = SHA256(salt + password).toString(encBase64);
    //console.log("hash :", hash);
    const token = uid2(64);
    //console.log("token :", token);

    //création du nouveau Profil dans la base de données avec les données cryptées
    const newProfil = new Profil({
      email: email,
      account: {
        username: username,
      },
      newletter: true,
      token: token,
      hash: hash,
      salt: salt,
    });

    await newProfil.save();
    //console.log(newProfil); nouveau profil créé et save dans la BD

    res.status(200).json({
      _id: newProfil._id,
      token: newProfil.token,
      account: {
        username: newProfil.account.username,
      },
    }); // on aurait pu passer par la création d'une varibale genre réponse qui aura en paramètre id, token et account et res.json(reponse)

    //console.log("ok");
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

//
module.exports = router;
