// server/controllers/tripController.js
const Trip = require('../models/Trip');

// Récupérer tous les voyages
exports.getAllTrips = async (req, res) => {
  try {
    const trips = await Trip.find();
    res.status(200).json(trips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Créer un voyage
exports.createTrip = async (req, res) => {
  try {
    const newTrip = new Trip(req.body);
    const savedTrip = await newTrip.save();
    res.status(201).json(savedTrip);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Récupérer un seul voyage (avec son ID)
exports.getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: "Voyage introuvable" });
    res.status(200).json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Ajouter une activité à un voyage existant
exports.addActivity = async (req, res) => {
  try {
    const tripId = req.params.id;
    const activityData = req.body; // { name: "Resto", type: "repas", ... }

    // On cherche le voyage et on pousse l'activité dans le tableau
    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: "Voyage introuvable" });

    trip.activities.push(activityData);
    await trip.save(); // Sauvegarde magique

    res.status(201).json(trip);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};