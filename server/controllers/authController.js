const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Clé secrète pour signer les tokens (à mettre dans un fichier .env idéalement)
const JWT_SECRET = process.env.JWT_SECRET || 'MON_SUPER_SECRET_TEMPORAIRE';

// --- INSCRIPTION (REGISTER) ---
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 1. Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Cet email est déjà utilisé." });

    // 2. Crypter le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Créer l'utilisateur
    const newUser = new User({
      username,
      email,
      password: hashedPassword
    });

    await newUser.save();

    res.status(201).json({ message: "Compte créé avec succès !" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- CONNEXION (LOGIN) ---
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Trouver l'utilisateur
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Email ou mot de passe incorrect." });

    // 2. Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Email ou mot de passe incorrect." });

    // 3. Créer le Token (Le "Badge" d'accès)
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1d' }); // Valable 1 jour

    res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};