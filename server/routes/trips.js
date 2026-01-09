const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const auth = require('../middleware/auth'); // <--- 1. IMPORT DU VIGILE

// GET : Tout le monde peut voir ? (Ou tu veux protéger aussi ?)
// Disons qu'on protège tout pour l'instant :
router.get('/', auth, tripController.getAllTrips); 
router.get('/:id', auth, tripController.getTripById);

// POST, PUT, DELETE : Il faut ABSOLUMENT être connecté
router.post('/', auth, tripController.createTrip); // <--- 2. LE VIGILE EST LÀ
router.put('/:id', auth, tripController.updateTrip);
router.delete('/:id', auth, tripController.deleteTrip);

// Pour les activités aussi
router.post('/:id/activities', auth, tripController.addActivity);
router.put('/:id/activities/:activityId', auth, tripController.updateActivity);
router.delete('/:id/activities/:activityId', auth, tripController.deleteActivity);

module.exports = router;