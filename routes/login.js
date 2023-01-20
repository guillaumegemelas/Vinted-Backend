const express = require("express");
const uid2 = require("uid2"); // Package qui sert à créer des string aléatoires
const SHA256 = require("crypto-js/sha256"); // Sert à encripter une string
const encBase64 = require("crypto-js/enc-base64"); // Sert à transformer l'encryptage en string
const Profil = require("../models/Profil");

const router = express.Router();
//
router.post("/user/login", async (req, res) => {
  try {
    //restructuring pour plus de simplicité pour saisir la suite du code (gain de temps)
    const { email, password } = req.body;

    const loginToCheck = await Profil.findOne({ email: email });
    //console.log(loginToCheck);

    if (!loginToCheck) {
      return res.status(401).json({ message: "Unauthorized  ❌" }); //bien mettre Unauthorized car si on met wrong email c'est trop simple pour le hacker de savoir ce qui ne va pas
    }
    //console.log(loginToCheck);
    //pour vérifier le hash

    //il faut aller chercher dans la base de données les informations liées à l'adresse mail rentrée en req.body

    const hash2 = SHA256(loginToCheck.salt + password).toString(encBase64);
    //console.log(hash2); // on peut le comparer au hash que l'on peut voir avec le .log de logiToCheck ci dessus

    if (hash2 === loginToCheck.hash) {
      return res.status(200).json({
        _id: loginToCheck.id,
        token: loginToCheck.token,
        account: {
          username: loginToCheck.account.username,
        },
      });
    } else {
      res.status(400).json({ message: "Unauthorized ❌" });
    }

    //

    //
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

//
module.exports = router;
