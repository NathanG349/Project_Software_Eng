import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function HomePage() {
  const [trips, setTrips] = useState([]);
  const [form, setForm] = useState({ title: '', startDate: '', endDate: '', participants: '' });

  useEffect(() => {
    api.get('/trips').then(res => setTrips(res.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const participantsArray = form.participants.split(',').map(p => p.trim());
    const res = await api.post('/trips', { ...form, participants: participantsArray });
    setTrips([...trips, res.data]);
  };

  return (
    <div>
      <h1>✈️ Mes Voyages</h1>
      <div style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '20px' }}>
        <h3>Nouveau Voyage</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
          <input placeholder="Titre" onChange={e => setForm({...form, title: e.target.value})} />
          <input type="date" onChange={e => setForm({...form, startDate: e.target.value})} />
          <input type="date" onChange={e => setForm({...form, endDate: e.target.value})} />
          <input placeholder="Participants (ex: Max, Tom)" onChange={e => setForm({...form, participants: e.target.value})} />
          <button type="submit">Créer</button>
        </form>
      </div>
      <ul>
        {trips.map(trip => (
          <li key={trip._id} style={{ margin: '10px 0' }}>
            <Link to={`/trip/${trip._id}`} style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {trip.title} ({new Date(trip.startDate).toLocaleDateString()})
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}