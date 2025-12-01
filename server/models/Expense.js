// server/models/Expense.js
const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true }, 
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  payer: { type: String, required: true },
  beneficiaries: [{ type: String }],
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Expense', ExpenseSchema);