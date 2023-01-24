const express = require("express");
const router = express.Router();

//Import de express-fileupoald:
const fileUpload = require("express-fileupload"); // permet de se passer de app.use(express.json()) pour config du serveur car upload d'images qui ne serait pas posssible avec app.use

//Import de cloudinary:
const cloudinary = require("cloudinary").v2;

const Profil = require("../models/Profil");
const Offer = require("../models/Offer");

// Import du middleware isAuthenticated
const isAuthenticated = require("../middlewares/isAuthenticated");

// Fonction qui permet de transformer nos fichier qu'on reçoit sous forme de Buffer en base64 afin de pouvoir
//les upload sur cloudinary
const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

//
router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      //si le Profil est bien authentifié dans isAuthenticated, alors on passe une nouvelle offer:

      // upload de l'image reçue dans l'annonce dans cloudinary et enregistrer dans la clef product_image la réponse de Cloudinary
      //cela revoie les éléments saisis en file dans Postman, ici une image:
      //console.log(req.files);
      // Je convertie le fichier reçu en base64 et j'envoie l'image sur cloudinary dans un dossier Vinted-Project:
      const result = await cloudinary.uploader.upload(
        convertToBase64(req.files.picture),
        { folder: "/Vinted/offers/," }
      );
      //destructuring pour symplifier le code à venir
      const {
        title,
        description,
        price,
        condition,
        city,
        brand,
        size,
        color,
        picture,
      } = req.body;

      //création de la nouvelle offre:
      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          { ETAT: condition },
          { EMPLACEMENT: city },
          { MARQUE: brand },
          { TAILLE: size },
          { COULEUR: color },
        ], //on peut détailler avec les appellations des éléments: marque, ville
        product_image: result, //secure url important
        owner: req.user, //ne pas voir apparaitre hash et  salt!
      });

      //console.log(result); //va permettre de récupérer l'url sécurisée de Cloudinary à la place de la photo qui sera stocké sur leur serveur
      //console.log(req.profilToCheck);
      await newOffer.save();

      //réponse dans Postman:
      res.json(newOffer);
      //
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

//route qui permet de trouver le nombre d'annonces total ainsi que le compteur du nombre d'annonces
router.get("/offers", async (req, res) => {
  try {
    //Recherche dans la base de données la totalité des annonces
    //const offersResults = await Offer.find().select("product_name product_price");
    //nombre tot d'annonces qui correspond à la longueur du tableau de résultats des annonces
    //counter = offersResults.length;

    //detructuring de la requête reçu en query:
    const { productName, priceMin, priceMax, sort, page } = req.query;
    //console.log(req.query);

    //Premier objet à remplir suivant ce qui est envoyé du Postman:
    const resultToFilter = {};

    //conditions à vérifier pour entrer les données du query dans le nouvel objet:
    if (productName) {
      resultToFilter.product_name = new RegExp(productName, "i"); //RegExp pour avoir le nom du produit pas forcémént exact (si on oubli une lettre par exple)
    }
    if (priceMin) {
      resultToFilter.product_price = { $gte: Number(priceMin) }; //Number() pour avoir des prix en Nombre et non pas en chaine de caractères
    }
    if (priceMax) {
      if (resultToFilter.product_price) {
        resultToFilter.product_price.$lte = Number(priceMax);
      } else resultToFilter.product_price = { $lte: Number(priceMax) };
    }

    //console.log(resultToFilter);
    //créer un second objet pour sort et le remplir

    const sortToFilter = {};
    if (sort === "price-desc") {
      sortToFilter.product_price = "desc";
    } else if (sort === "price-asc") {
      sortToFilter.product_price = "asc";
    }

    const limit = 5;

    let pageRequired = 1;
    if (page) pageRequired = Number(page);

    const skip = (pageRequired - 1) * limit;

    const filteredOffers = await Offer.find(resultToFilter)
      //.select("product_name product_price product_description")
      .sort(sortToFilter)
      .populate("owner", "account")
      .skip(skip)
      .limit(limit);

    //initilaliser un compteur sur le nombre d'annonces filtrées: mais pas significatif car limit et skip on utilise
    //counter = filteredOffers.length;
    //donc on va utiliser méthode mongoose
    const counter = await Offer.countDocuments(resultToFilter);

    //console.log(filteredOffers);
    res.status(200).json({
      counter,
      filteredOffers,
    });
    //
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// //route pour récupérer toutes les annonces en fonction de l'Id
router.get("/offer/:id", async (req, res) => {
  try {
    //console.log(req.params);
    const offer = await Offer.findById(req.params.id).populate(
      "owner",
      "account"
    );
    res.status(200).json(offer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

//route pour modifier une annonce: à compléter avec corrections et à tester en local//

router.put(
  "/offer/udate/:id",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      const offerToModify = await Offer.findById(req.params.id);
      //console.log(req.params.id);
      //renvoie à la requete Id reçue dans postman
      if (req.body.title) {
        offerToModify.product_name = req.body.title;
      }
      if (req.body.description) {
        offerToModify.product_description = req.body.description;
      }
      if (req.body.price) {
        offerToModify.product_price = req.body.price;
      }

      const details = offerToModify.product_details;
      //console.log(offerToModify.product_details);

      for (let i = 0; i < details.length; i++) {
        if (details[i].ETAT) {
          if (req.body.condition) {
            //console.log(details[i].ETAT); renvoie à l'ETAT qu'il y a dans l'annonce
            details[i].ETAT = req.body.condition;
          }
          //console.log(req.body.condition); renvoie à ce qu'on rentre dans Postman pour mettre à jour l'ETAT dans l'annonce initiale
        }
        if (details[i].EMPLACEMENT) {
          if (req.body.city) {
            details[i].EMPLACEMENT = req.body.city;
          }
        }
        if (details[i].MARQUE) {
          if (req.body.brand) {
            details[i].MARQUE = req.body.brand;
          }
        }
        if (details[i].TAILLE) {
          if (req.body.size) {
            details[i].TAILLE = req.body.size;
          }
        }
        if (details[i].COULEUR) {
          if (req.body.color) {
            details[i].COULEUR = req.body.color;
          }
        }
      }
      offerToModify.markModified("product_details");

      if (req.files?.picture) {
        const result = await cloudinary.uploader.upload(
          convertToBase64(req.files.picture),
          { folder: "/Vinted/offers/," }
        );
        offerToModify.product_image = result;
      }

      await offerToModify.save();

      console.log("route fonctionne");
      res.status(200).json("Offer modified succesfully !");
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

module.exports = router;
