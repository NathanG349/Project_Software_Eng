// server/routes/trips.js
const express = require('express');
const router = express.Router();

// ICI : On importe le Modèle avec la majuscule 'Trip'
const Trip = require('../models/Trip'); 

// Route POST : Créer un voyage
router.post('/', async (req, res) => {
  try {
    const newTrip = new Trip(req.body);
    const savedTrip = await newTrip.save();
    res.status(201).json(savedTrip);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Route GET : Lire les voyages
router.get('/', async (req, res) => {
  try {
    const trips = await Trip.find();
    res.status(200).json(trips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;