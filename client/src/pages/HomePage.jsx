import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext'; // <--- AJOUT IMPORTANT

// Imports UI
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"

export default function HomePage() {
  const [trips, setTrips] = useState([]);
  const { user } = useAuth(); // <--- On récupère l'utilisateur connecté
  
  const [form, setForm] = useState({ 
    title: '', 
    startDate: undefined, 
    endDate: undefined, 
    participants: '' 
  });

  // Charger les voyages (Axios envoie le token tout seul)
  useEffect(() => {
    api.get('/trips')
       .then(res => setTrips(res.data))
       .catch(err => console.error(err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) return;

    // On transforme "Tom, Léa" en ["Tom", "Léa"]
    const participantsArray = form.participants.split(',').map(p => p.trim()).filter(p => p !== "");

    // AJOUT SÉCURITÉ : On s'assure que TOI (le créateur) tu es dans la liste
    if (user && user.username && !participantsArray.includes(user.username)) {
        participantsArray.push(user.username);
    }

    const payload = {
        title: form.title,
        participants: participantsArray,
        startDate: form.startDate ? format(form.startDate, 'yyyy-MM-dd') : '',
        endDate: form.endDate ? format(form.endDate, 'yyyy-MM-dd') : ''
    };

    try {
        const res = await api.post('/trips', payload);
        setTrips([...trips, res.data]);
        // Reset du formulaire
        setForm({ title: '', startDate: undefined, endDate: undefined, participants: '' });
    } catch (error) {
        console.error("Erreur création voyage:", error);
        alert("Impossible de créer le voyage.");
    }
  };

  const handleDelete = async (id, e) => {
    e.preventDefault(); // Empêche d'ouvrir le lien
    if (window.confirm("Supprimer ce voyage ?")) {
      try {
          await api.delete(`/trips/${id}`);
          setTrips(trips.filter(trip => trip._id !== id));
      } catch (error) {
          console.error("Erreur suppression:", error);
      }
    }
  };

  return (
    <div className="space-y-8">

      <h1 className="text-3xl font-bold text-gray-800 tracking-tight">✈️ Mes Voyages</h1>

      {/* --- FORMULAIRE DE CRÉATION (Ton design original) --- */}
      <Card className="shadow-md border-t-4 border-t-blue-600">
        <CardHeader>
          <CardTitle>Nouveau Voyage</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Titre du voyage</Label>
              <Input
                placeholder="Ex: Roadtrip Italie"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Participants (séparés par des virgules)</Label>
              <Input
                placeholder="Ex: Max, Tom, Léa"
                value={form.participants}
                onChange={e => setForm({ ...form, participants: e.target.value })}
              />
              <p className="text-xs text-gray-400">Vous ({user?.username}) serez ajouté automatiquement.</p>
            </div>
            
            {/* --- SÉLECTEUR DATE DÉBUT --- */}
            <div className="space-y-2 flex flex-col">
              <Label>Début</Label>
              <Popover>
                  <PopoverTrigger asChild>
                      <Button
                          variant={"outline"}
                          className={cn(
                              "w-full justify-start text-left font-normal",
                              !form.startDate && "text-muted-foreground"
                          )}
                      >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.startDate ? format(form.startDate, "PPP", { locale: fr }) : <span>Date de début</span>}
                      </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white" align="start">
                      <Calendar
                          mode="single"
                          selected={form.startDate}
                          onSelect={(date) => setForm({...form, startDate: date})}
                          initialFocus
                          locale={fr}
                      />
                  </PopoverContent>
              </Popover>
            </div>

            {/* --- SÉLECTEUR DATE FIN --- */}
            <div className="space-y-2 flex flex-col">
              <Label>Fin</Label>
              <Popover>
                  <PopoverTrigger asChild>
                      <Button
                          variant={"outline"}
                          className={cn(
                              "w-full justify-start text-left font-normal",
                              !form.endDate && "text-muted-foreground"
                          )}
                      >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.endDate ? format(form.endDate, "PPP", { locale: fr }) : <span>Date de fin</span>}
                      </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white" align="start">
                      <Calendar
                          mode="single"
                          selected={form.endDate}
                          onSelect={(date) => setForm({...form, endDate: date})}
                          initialFocus
                          locale={fr}
                          defaultMonth={form.startDate || new Date()}
                          disabled={{ before: form.startDate }}
                      />
                  </PopoverContent>
              </Popover>
            </div>

            <Button onClick={handleSubmit} className="md:col-span-2 w-full bg-blue-600 hover:bg-blue-700">
              Créer le voyage
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* --- LISTE DES VOYAGES --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {trips.length === 0 && <p className="text-gray-400 italic">Aucun voyage trouvé.</p>}
        
        {trips.map(trip => (
          <Link key={trip._id} to={`/trip/${trip._id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group relative overflow-hidden h-full">
              {/* Petite barre dégradée décorative */}
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-400 to-purple-500"></div>
              
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span className="truncate pr-2">{trip.title}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDelete(trip._id, e)}
                    className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-2 shrink-0"
                  >
                    🗑️
                  </Button>
                </CardTitle>
                <p className="text-sm text-gray-500">
                  {trip.startDate ? new Date(trip.startDate).toLocaleDateString() : '...'} 
                  {' ➔ '} 
                  {trip.endDate ? new Date(trip.endDate).toLocaleDateString() : '...'}
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 truncate">👥 {trip.participants.join(', ')}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

    </div>
  );
}