const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/**
 * Middleware pour traiter les images uploadées
 * Redimensionne et compresse les images
 */
const processImage = async (req, res, next) => {
  // Si aucun fichier n'est uploadé, passer au middleware suivant
  if (!req.file) {
    return next();
  }

  try {
    const originalPath = req.file.path;
    const filename = req.file.filename;
    const outputPath = path.join(String(process.env.IMAGES_FOLDER), `processed_${filename}`);

    // Vérifier que le fichier original existe
    if (!fs.existsSync(originalPath)) {
      console.error(`Fichier original introuvable: ${originalPath}`);
      return next(); // Continuer sans traitement plutôt que d'échouer
    }

    // Attendre un peu pour s'assurer que le fichier est complètement écrit
    await new Promise(resolve => setTimeout(resolve, 100));

    // Traitement de l'image avec Sharp
    await sharp(originalPath)
      .resize(400, 600, { 
        fit: 'cover', // Crop l'image pour remplir exactement les dimensions
        position: 'center' // Centre le crop
      })
      .jpeg({ 
        quality: 80, // Qualité JPEG à 80%
        progressive: true // JPEG progressif pour un chargement plus rapide
      })
      .toFile(outputPath);

    // Supprimer le fichier original seulement si le traitement a réussi
    if (fs.existsSync(originalPath)) {
      fs.unlinkSync(originalPath);
    }

    // Mettre à jour le nom du fichier dans req.file
    req.file.filename = `processed_${filename}`;
    req.file.path = outputPath;

    console.log(`Image traitée et redimensionnée: ${outputPath}`);
    next();
  } catch (error) {
    console.error('Erreur lors du traitement de l\'image:', error);
    
    // En cas d'erreur, ne pas supprimer le fichier original et continuer
    // L'image originale sera utilisée
    console.log('Utilisation de l\'image originale en raison d\'une erreur de traitement');
    next(); // Continuer plutôt que d'échouer complètement
  }
};

/**
 * Fonction utilitaire pour traiter une image existante
 * Utile pour le traitement en arrière-plan ou la migration
 */
const processExistingImage = async (imagePath, outputPath, options = {}) => {
  const {
    width = 400,
    height = 600,
    quality = 80
  } = options;

  try {
    await sharp(imagePath)
      .resize(width, height, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ 
        quality,
        progressive: true
      })
      .toFile(outputPath);

    return true;
  } catch (error) {
    console.error('Erreur lors du traitement de l\'image existante:', error);
    return false;
  }
};

module.exports = {
  processImage,
  processExistingImage
}; 