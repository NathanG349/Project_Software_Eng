// server/models/Trip.js
const mongoose = require('mongoose');

const TripSchema = new mongoose.Schema({
  title: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  participants: [{ type: String }],
  activities: [{
    name: String,
    date: Date,
    type: { type: String, enum: ['transport', 'logement', 'activite', 'repas'] },
    cost: Number
  }]
});

module.exports = mongoose.model('Trip', TripSchema);