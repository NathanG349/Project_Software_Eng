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

// 4. CALCULER LES COMPTES (L'Algo Tricount)
exports.calculateBalance = async (req, res) => {
  try {
    const { tripId } = req.params;
    const expenses = await Expense.find({ tripId });

    // ÉTAPE 1 : Calculer la balance de chaque personne
    // (Positif = on lui doit des sous / Négatif = il doit des sous)
    let balances = {};

    expenses.forEach(expense => {
      const amount = expense.amount;
      const payer = expense.payer;
      const beneficiaries = expense.beneficiaries;

      if (beneficiaries.length === 0) return; // Sécurité division par 0

      // Celui qui a payé récupère le montant total dans sa balance (+50€)
      if (!balances[payer]) balances[payer] = 0;
      balances[payer] += amount;

      // Ceux qui ont profité perdent leur part (-25€ chacun si ils sont 2)
      const splitAmount = amount / beneficiaries.length;
      
      beneficiaries.forEach(person => {
        if (!balances[person]) balances[person] = 0;
        balances[person] -= splitAmount;
      });
    });

    // ÉTAPE 2 : Générer les remboursements optimisés
    // On sépare ceux qui doivent (debtors) et ceux qui reçoivent (creditors)
    let debtors = [];
    let creditors = [];

    for (const [person, amount] of Object.entries(balances)) {
      if (amount < -0.01) debtors.push({ person, amount }); // Il doit des sous
      if (amount > 0.01) creditors.push({ person, amount });  // On lui doit des sous
    }

    // On trie pour optimiser (les plus gros montants d'abord)
    debtors.sort((a, b) => a.amount - b.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    let reimbursements = [];

    // TANT QU'il reste des gens à rembourser
    let i = 0; // Index débiteurs
    let j = 0; // Index créditeurs

    while (i < debtors.length && j < creditors.length) {
      let debtor = debtors[i];
      let creditor = creditors[j];

      // On cherche le montant à échanger (le min entre ce qu'il doit et ce qu'on attend)
      // Math.abs enlève le signe négatif
      let amountToPay = Math.min(Math.abs(debtor.amount), creditor.amount);

      // On note le remboursement
      reimbursements.push({
        from: debtor.person,
        to: creditor.person,
        amount: Number(amountToPay.toFixed(2)) // Arrondi à 2 chiffres
      });

      // On met à jour les montants restants
      debtor.amount += amountToPay; // Il se rapproche de 0
      creditor.amount -= amountToPay; // Il se rapproche de 0

      // Si le débiteur a fini de payer, on passe au suivant
      if (Math.abs(debtor.amount) < 0.01) i++;
      // Si le créditeur est remboursé, on passe au suivant
      if (creditor.amount < 0.01) j++;
    }

    // On renvoie le résultat final
    res.status(200).json({
      balances: balances,       // L'état des comptes (pour info)
      reimbursements: reimbursements // "Qui doit payer qui"
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. MODIFIER UNE DÉPENSE (PUT)
exports.updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    // { new: true } renvoie la version modifiée
    const updatedExpense = await Expense.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json(updatedExpense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};