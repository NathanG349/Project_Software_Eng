import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';

export default function TripPage() {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balance, setBalance] = useState(null);

  // Formulaires
  const [activityForm, setActivityForm] = useState({ name: '', date: '', cost: '', type: 'activite' });
  
  // MODIFICATION ICI : beneficiaries est maintenant un tableau [] vide par défaut
  const [expenseForm, setExpenseForm] = useState({ title: '', amount: '', payer: '', beneficiaries: [] });

  useEffect(() => {
    api.get(`/trips/${id}`).then(res => setTrip(res.data));
    api.get(`/expenses/trip/${id}`).then(res => setExpenses(res.data));
  }, [id]);

  const handleAddActivity = async (e) => {
    e.preventDefault();
    const res = await api.post(`/trips/${id}/activities`, activityForm);
    setTrip(res.data);
    setActivityForm({ name: '', date: '', cost: '', type: 'activite' }); // Reset
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    // On envoie directement le tableau beneficiaries qui est géré par les cases à cocher
    await api.post('/expenses', { ...expenseForm, tripId: id });
    
    const res = await api.get(`/expenses/trip/${id}`);
    setExpenses(res.data);
    // Reset du formulaire
    setExpenseForm({ title: '', amount: '', payer: '', beneficiaries: [] });
  };

  const handleCalculate = async () => {
    const res = await api.get(`/expenses/trip/${id}/balance`);
    setBalance(res.data);
  };

  // Petite fonction pour gérer les cases à cocher "Pour qui ?"
  const toggleBeneficiary = (participant) => {
    const currentList = expenseForm.beneficiaries;
    if (currentList.includes(participant)) {
      // Si déjà coché, on l'enlève
      setExpenseForm({ ...expenseForm, beneficiaries: currentList.filter(p => p !== participant) });
    } else {
      // Sinon, on l'ajoute
      setExpenseForm({ ...expenseForm, beneficiaries: [...currentList, participant] });
    }
  };

  if (!trip) return <div>Chargement...</div>;

  return (
    <div>
      <Link to="/">← Retour</Link>
      <h1>{trip.title}</h1>
      <p>Participants : {trip.participants.join(', ')}</p>

      <hr />

      <div style={{ display: 'flex', gap: '20px', flexDirection: 'row' }}>
        
        {/* --- COLONNE GAUCHE : PLANNING --- */}
        <div style={{ flex: 1, background: '#f0f9ff', padding: '10px' }}>
          <h2>📅 Planning</h2>
          <ul>
            {trip.activities.map((act, i) => (
              <li key={i}>{act.name} - {act.cost}€</li>
            ))}
          </ul>
          
          <form onSubmit={handleAddActivity} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <input placeholder="Activité" value={activityForm.name} onChange={e => setActivityForm({...activityForm, name: e.target.value})} />
            <input type="number" placeholder="Prix" value={activityForm.cost} onChange={e => setActivityForm({...activityForm, cost: e.target.value})} />
            <button type="submit">Ajouter</button>
          </form>
        </div>

        {/* --- COLONNE DROITE : DÉPENSES --- */}
        <div style={{ flex: 1, background: '#fff0f0', padding: '10px' }}>
          <h2>💸 Dépenses</h2>
          <ul>
            {expenses.map(exp => (
              <li key={exp._id}>
                <b>{exp.title}</b> : {exp.amount}€ ({exp.payer}) 
                <br /><small>Pour : {exp.beneficiaries.length > 0 ? exp.beneficiaries.join(', ') : 'Tout le monde'}</small>
              </li>
            ))}
          </ul>

          <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'white', padding: '10px', border: '1px solid #ccc' }}>
            <h4>Nouvelle Dépense</h4>
            
            {/* 1. Titre */}
            <input 
              placeholder="Titre (ex: Bières)" 
              value={expenseForm.title}
              onChange={e => setExpenseForm({...expenseForm, title: e.target.value})} 
            />
            
            {/* 2. Prix (Type number permet de taper au clavier) */}
            <input 
              type="number" 
              placeholder="Montant (€)" 
              value={expenseForm.amount}
              onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} 
            />

            {/* 3. Payeur (Liste déroulante) */}
            <select 
              value={expenseForm.payer} 
              onChange={e => setExpenseForm({...expenseForm, payer: e.target.value})}
              required
            >
              <option value="">-- Qui a payé ? --</option>
              {trip.participants.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            {/* 4. Pour qui ? (Cases à cocher) */}
            <div>
              <p style={{ margin: '5px 0', fontWeight: 'bold' }}>Pour qui ?</p>
              {trip.participants.map(p => (
                <label key={p} style={{ display: 'block', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={expenseForm.beneficiaries.includes(p)}
                    onChange={() => toggleBeneficiary(p)}
                  /> 
                  {p}
                </label>
              ))}
            </div>

            <button type="submit" style={{ background: '#333', color: 'white', padding: '5px' }}>Ajouter la dépense</button>
          </form>

          <hr />
          
          <button onClick={handleCalculate} style={{ padding: '10px', width: '100%', fontSize: '16px' }}>
            ⚖️ CALCULER LES COMPTES
          </button>

          {balance && (
            <div style={{ marginTop: '10px', background: 'white', padding: '10px', border: '2px solid black' }}>
              <h3>Qui doit quoi ?</h3>
              {balance.reimbursements.length === 0 ? <p>Les comptes sont bons ! ✅</p> : null}
              <ul>
                {balance.reimbursements.map((remb, i) => (
                  <li key={i}>
                    🔴 <b>{remb.from}</b> doit payer <b>{remb.amount}€</b> à 🟢 <b>{remb.to}</b>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}