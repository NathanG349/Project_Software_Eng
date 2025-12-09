// server/routes/expenses.js
const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');

// Route pour ajouter une dépense
// URL : POST /api/expenses
router.post('/', expenseController.createExpense);

// Route pour récupérer les dépenses d'un voyage
// URL : GET /api/expenses/trip/:tripId
router.get('/trip/:tripId', expenseController.getExpensesByTrip);

// Route pour supprimer
// URL : DELETE /api/expenses/:id
router.delete('/:id', expenseController.deleteExpense);

// Route pour calculer l'équilibre
// URL : GET /api/expenses/trip/:tripId/balance
router.get('/trip/:tripId/balance', expenseController.calculateBalance);

module.exports = router;