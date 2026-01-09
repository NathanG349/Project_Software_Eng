const Trip = require('../models/Trip');

// 1. Récupérer tous les voyages
exports.getAllTrips = async (req, res) => {
  try {
    // On ne cherche que les voyages qui ont MON ID
    const trips = await Trip.find({ userId: req.user.id });
    res.status(200).json(trips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Créer un voyage
exports.createTrip = async (req, res) => {
  try {
    const newTrip = new Trip({
      ...req.body,
      userId: req.user.id // <--- C'est ici que la magie opère !
      // "req.user.id" vient du middleware auth qu'on a codé à l'étape 7
    });

    const savedTrip = await newTrip.save();
    res.status(201).json(savedTrip);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 3. Récupérer un seul voyage (avec son ID)
exports.getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: "Voyage introuvable" });
    res.status(200).json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Ajouter une activité
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

// 5. Supprimer un voyage (C'EST CELLE-LA QUI MANQUAIT !)
exports.deleteTrip = async (req, res) => {
  try {
    await Trip.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Voyage supprimé" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};  

// 6. SUPPRIMER UNE ACTIVITÉ
exports.deleteActivity = async (req, res) => {
  try {
    const { id, activityId } = req.params; // On récupère l'ID du voyage et de l'activité
    
    // 1. On trouve le voyage
    const trip = await Trip.findById(id);
    if (!trip) return res.status(404).json({ message: "Voyage introuvable" });

    // 2. On filtre pour garder toutes les activités SAUF celle qu'on veut supprimer
    // (C'est comme ça qu'on supprime un élément d'un tableau en Mongo)
    trip.activities = trip.activities.filter(act => act._id.toString() !== activityId);
    
    // 3. On sauvegarde le voyage modifié
    await trip.save();

    // 4. On renvoie le voyage mis à jour au frontend
    res.status(200).json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 7. MODIFIER UN VOYAGE (PUT)
exports.updateTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body; // Contient title, dates, participants...
    
    // { new: true } permet de renvoyer le voyage une fois modifié, pas l'ancien
    const updatedTrip = await Trip.findByIdAndUpdate(id, updates, { new: true });
    
    if (!updatedTrip) return res.status(404).json({ message: "Voyage introuvable" });
    
    res.status(200).json(updatedTrip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 8. MODIFIER UNE ACTIVITÉ
exports.updateActivity = async (req, res) => {
  try {
    const { id, activityId } = req.params;
    
    const trip = await Trip.findById(id);
    if (!trip) return res.status(404).json({ message: "Voyage introuvable" });

    // On trouve l'activité dans le tableau (méthode Mongoose spéciale pour les sous-documents)
    const activity = trip.activities.id(activityId);
    if (!activity) return res.status(404).json({ message: "Activité introuvable" });

    // On met à jour les champs
    activity.set(req.body);
    
    await trip.save();
    res.status(200).json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};