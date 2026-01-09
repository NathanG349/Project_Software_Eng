const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }, // Pseudo unique
  email: { type: String, required: true, unique: true },    // Email unique
  password: { type: String, required: true },               // Mot de passe crypté
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);