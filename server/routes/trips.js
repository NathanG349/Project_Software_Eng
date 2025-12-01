const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController'); // Import du controller

router.post('/', tripController.createTrip);
router.get('/', tripController.getAllTrips);

module.exports = router;