const Trip = require('../models/Trip');

// Get all trips for current user
exports.getAllTrips = async (req, res) => {
  try {
    const trips = await Trip.find({ userId: req.user.id });
    res.status(200).json(trips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new trip
exports.createTrip = async (req, res) => {
  try {
    const newTrip = new Trip({
      ...req.body,
      userId: req.user.id
    });

    const savedTrip = await newTrip.save();
    res.status(201).json(savedTrip);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get single trip
exports.getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: "Voyage introuvable" });
    res.status(200).json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add activity to trip
exports.addActivity = async (req, res) => {
  try {
    const tripId = req.params.id;
    const activityData = req.body;

    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: "Voyage introuvable" });

    trip.activities.push(activityData);
    await trip.save();

    res.status(201).json(trip);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete trip
exports.deleteTrip = async (req, res) => {
  try {
    await Trip.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Voyage supprimé" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete activity
exports.deleteActivity = async (req, res) => {
  try {
    const { id, activityId } = req.params;

    const trip = await Trip.findById(id);
    if (!trip) return res.status(404).json({ message: "Trip not found" });

    trip.activities = trip.activities.filter(act => act._id.toString() !== activityId);

    await trip.save();

    res.status(200).json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update trip details
exports.updateTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedTrip = await Trip.findByIdAndUpdate(id, updates, { new: true });

    if (!updatedTrip) return res.status(404).json({ message: "Trip not found" });

    res.status(200).json(updatedTrip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update activity
exports.updateActivity = async (req, res) => {
  try {
    const { id, activityId } = req.params;

    const trip = await Trip.findById(id);
    if (!trip) return res.status(404).json({ message: "Trip not found" });

    const activity = trip.activities.id(activityId);
    if (!activity) return res.status(404).json({ message: "Activity not found" });

    activity.set(req.body);

    await trip.save();
    res.status(200).json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};