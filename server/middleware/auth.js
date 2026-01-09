const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // 1. Récupérer le token dans le header de la requête
  const token = req.header('x-auth-token');

  // 2. Vérifier si le token existe
  if (!token) {
    return res.status(401).json({ message: 'Pas de token, autorisation refusée' });
  }

  // 3. Vérifier la validité du token
  try {
    // On déchiffre le token avec notre clé secrète
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // On ajoute l'info de l'utilisateur (son ID) dans la requête
    req.user = decoded;
    
    // On laisse passer la requête vers la suite (le contrôleur)
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token invalide' });
  }
};