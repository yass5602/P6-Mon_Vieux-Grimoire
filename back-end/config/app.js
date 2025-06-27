const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const app = express();
require("./../db/mongo.js");

const IMAGES_FOLDER = String(process.env.IMAGES_FOLDER);
app.use(helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "http://localhost:4000"], // Ajoutez ici votre domaine et port
      // ... autres directives si besoin
    },
  }));
app.use(cors());
app.use(express.json());
app.use("/" + process.env.IMAGES_PUBLIC_URL, express.static(IMAGES_FOLDER));

module.exports = { app };