// server/routes/trips.js
const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController'); // On importe le cerveau

router.get('/', tripController.getAllTrips);
router.post('/', tripController.createTrip);
router.get('/:id', tripController.getTripById);

module.exports = router;
// AJOUTER une activité (POST /api/trips/:id/activities)
router.post('/:id/activities', tripController.addActivity);