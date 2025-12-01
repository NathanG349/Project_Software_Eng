// server/index.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import des routes
const tripsRoutes = require('./routes/trips');

const app = express();

app.use(cors());
app.use(express.json());

// Connexion DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connecté à MongoDB !'))
  .catch((err) => console.error('❌ Erreur Mongo :', err));

// Utilisation des routes
app.use('/api/trips', tripsRoutes);

app.get('/', (req, res) => {
  res.send('API Voyage en ligne !');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur prêt sur le port ${PORT}`);
});