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
import { enUS } from "date-fns/locale"
import { cn } from "@/lib/utils"

export default function HomePage() {
  const [trips, setTrips] = useState([]);
  const { user, logout } = useAuth(); // get user & logout function

  const [form, setForm] = useState({
    title: '',
    startDate: undefined,
    endDate: undefined,
    participants: ''
  });

  // Fetch trips
  useEffect(() => {
    api.get('/trips')
      .then(res => setTrips(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) return;

    // Convert "Tom, Lea" -> ["Tom", "Lea"]
    const participantsArray = form.participants.split(',').map(p => p.trim()).filter(p => p !== "");

    // Ensure the creator is in the participants list
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
      // Reset the form
      setForm({ title: '', startDate: undefined, endDate: undefined, participants: '' });
    } catch (error) {
      console.error("Error creating trip:", error);
      alert("Failed to create trip.");
    }
  };

  const handleDelete = async (id, e) => {
    e.preventDefault(); // Prevents opening the link
    if (window.confirm("Delete this trip?")) {
      try {
        await api.delete(`/trips/${id}`);
        setTrips(trips.filter(trip => trip._id !== id));
      } catch (error) {
        console.error("Error deleting:", error);
      }
    }
  };

  return (
    <div className="space-y-8">

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">✈️ My Trips</h1>
        <Button variant="outline" onClick={logout} className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
          Logout
        </Button>
      </div>

      {/* --- CREATION FORM --- */}
      <Card className="shadow-md border-t-4 border-t-blue-600">
        <CardHeader>
          <CardTitle>New Trip</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Trip Title</Label>
              <Input
                placeholder="Ex: Roadtrip Italy"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Participants (comma separated)</Label>
              <Input
                placeholder="Ex: Max, Tom, Lea"
                value={form.participants}
                onChange={e => setForm({ ...form, participants: e.target.value })}
              />
              <p className="text-xs text-gray-400">You ({user?.username}) will be added automatically.</p>
            </div>

            {/* --- START DATE --- */}
            <div className="space-y-2 flex flex-col">
              <Label>Start Date</Label>
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
                    {form.startDate ? format(form.startDate, "PPP", { locale: enUS }) : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white" align="start">
                  <Calendar
                    mode="single"
                    selected={form.startDate}
                    onSelect={(date) => setForm({ ...form, startDate: date })}
                    initialFocus
                    locale={enUS}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* --- END DATE --- */}
            <div className="space-y-2 flex flex-col">
              <Label>End Date</Label>
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
                    {form.endDate ? format(form.endDate, "PPP", { locale: enUS }) : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white" align="start">
                  <Calendar
                    mode="single"
                    selected={form.endDate}
                    onSelect={(date) => setForm({ ...form, endDate: date })}
                    initialFocus
                    locale={enUS}
                    defaultMonth={form.startDate || new Date()}
                    disabled={{ before: form.startDate }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button onClick={handleSubmit} className="md:col-span-2 w-full bg-blue-600 hover:bg-blue-700">
              Create Trip
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* --- TRIP LIST --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {trips.length === 0 && <p className="text-gray-400 italic">No trips found.</p>}

        {trips.map(trip => (
          <Link key={trip._id} to={`/trip/${trip._id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group relative overflow-hidden h-full">
              {/* Decorative gradient bar */}
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