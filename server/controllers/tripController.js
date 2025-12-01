const Trip = require('../models/Trip');

exports.createTrip = async (req, res) => {
  try {
    const newTrip = new Trip(req.body);
    const savedTrip = await newTrip.save();
    res.status(201).json(savedTrip);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAllTrips = async (req, res) => {
  // ... ta logique de récupération
};