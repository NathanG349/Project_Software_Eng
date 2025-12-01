// server/controllers/expenseController.js
const Expense = require('../models/Expense');

// 1. AJOUTER une dépense
exports.createExpense = async (req, res) => {
  try {
    // On s'attend à recevoir : { tripId, title, amount, payer, beneficiaries }
    const newExpense = new Expense(req.body);
    const savedExpense = await newExpense.save();
    res.status(201).json(savedExpense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 2. LIRE les dépenses d'un voyage précis
exports.getExpensesByTrip = async (req, res) => {
  try {
    const { tripId } = req.params; // On récupère l'ID dans l'URL
    const expenses = await Expense.find({ tripId: tripId });
    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. (Bonus) SUPPRIMER une dépense
exports.deleteExpense = async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Dépense supprimée" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};