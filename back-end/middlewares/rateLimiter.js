const rateLimit = require('express-rate-limit');

// Exemple : limite à 100 requêtes par 15 minutes par IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite chaque IP à 100 requêtes par fenêtre
  message: "Trop de requêtes, réessayez plus tard.",
});

module.exports = limiter;