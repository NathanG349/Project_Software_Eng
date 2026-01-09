const mongoose = require('mongoose');

const TripSchema = new mongoose.Schema({
  title: { type: String, required: true },
  participants: [String],
  startDate: Date,
  endDate: Date,
  
  // 👇 C'EST ICI QU'ON CHANGE LA STRUCTURE DE L'ACTIVITÉ
  activities: [{
    name: { type: String, required: true }, // Nom
    date: { type: String },                 // Date de l'activité
    startTime: { type: String },            // Heure début
    endTime: { type: String },              // Heure fin
    address: { type: String },              // Adresse
    notes: { type: String },                // Texte libre / Notes
    cost: { type: Number, default: 0 }      // (On garde le prix au cas où, sinon tu peux l'enlever)
  }],

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Trip', TripSchema);