const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, String(process.env.IMAGES_FOLDER));
  },
  filename: function (req, file, cb) {
    // Nettoyer le nom de fichier : supprimer espaces et caractères spéciaux
    const cleanName = file.originalname
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '_') // Remplacer caractères spéciaux par underscore
      .replace(/_+/g, '_') // Remplacer plusieurs underscores consécutifs par un seul
      .replace(/^_|_$/g, ''); // Supprimer underscore au début et à la fin
    
    const fileName = cleanName + Date.now() + ".jpg";
    cb(null, fileName);
  }
});
const upload = multer({
  storage
});

module.exports = { upload };