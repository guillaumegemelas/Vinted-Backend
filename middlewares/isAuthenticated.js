const Profil = require("../models/Profil");

const isAuthenticated = async (req, res, next) => {
  try {
    // Le token reçu est dans req.headers.authorization:
    //req.headers.authorization

    //si token n'existe pas (on ne rentre rien dans le token)
    if (!req.headers.authorization) {
      return res.status(401).json({ message: "Unauthorized 📛" });
    }

    //récup du token et enlever "Bearer"
    const token = req.headers.authorization.replace("Bearer ", "");
    // on obtient le Token sans le "Bearer"

    //on va aller voir dans la BDD si j'ai un profil dont le token correspond au token reçu  sur postman
    const profilToCheck = {
      token: token,
    };
    //Me donne le token rentré dans le Authorization de Postman
    //console.log(profilToCheck);

    //je veux voir si il existe un Profil avec le même token que celui rentré dans Postman:
    const profil = await Profil.findOne(profilToCheck).select("account"); // .select("") permet dans la route offer quand on se servira de req.user et dc profil
    //n'avoir que le account sans avoir le reste (hash, salt et token)
    //console.log(profil);

    if (!profil) {
      return res.status(401).json({ message: "Unauthorized ⛔️" });
    }

    // il faut stocker le profil qui match pour le garder sous la main et l'utiliser dans ma route
    req.user = profil; //le req est le meme que dans la route avec oofer donc on créé une clef à req (user) que l'on pourra utiliser dans la route offer
    //
    next();
    //
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = isAuthenticated;
