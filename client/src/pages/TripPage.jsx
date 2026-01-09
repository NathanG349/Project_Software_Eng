import { useEffect, useState, useMemo } from 'react'; // Ajout de useMemo
import { useParams, Link } from 'react-router-dom';
import api from '../api';

// Imports UI de base
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"

// Imports Calendrier & Icônes
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Pencil, Clock, MapPin } from "lucide-react" // Ajout de Clock et MapPin pour le style
import { format, parseISO, isValid } from "date-fns" // Ajout de parseISO et isValid
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"

// --- GÉNÉRATION DES CRÉNEAUX STANDARDS (15 min) ---
const TIME_SLOTS = Array.from({ length: 96 }).map((_, i) => {
  const hour = Math.floor(i / 4).toString().padStart(2, '0');
  const minutes = (i % 4) * 15;
  const minutesStr = minutes === 0 ? '00' : minutes.toString();
  return `${hour}:${minutesStr}`;
});

export default function TripPage() {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balance, setBalance] = useState(null);
  
  // --- ÉTATS DES MODALES ---
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // --- ÉTATS POUR L'ÉDITION ---
  const [editingActivityId, setEditingActivityId] = useState(null);
  const [editingExpenseId, setEditingExpenseId] = useState(null);

  // --- FORMULAIRES ---
  const [activityForm, setActivityForm] = useState({ 
    name: '', date: undefined, startTime: '', endTime: '', address: '', notes: '' 
  });

  const [expenseForm, setExpenseForm] = useState({ 
    title: '', amount: '', payer: '', beneficiaries: [] 
  });

  const [editForm, setEditForm] = useState({ 
    title: '', startDate: undefined, endDate: undefined, participantsStr: '' 
  });

  // --- CHARGEMENT INITIAL ---
  const refreshBalance = async () => {
    try {
      const res = await api.get(`/expenses/trip/${id}/balance`);
      setBalance(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    api.get(`/trips/${id}`).then(res => setTrip(res.data));
    api.get(`/expenses/trip/${id}`).then(res => setExpenses(res.data));
    refreshBalance();
  }, [id]);

  // =========================================================================
  // LOGIQUE DE TRI ET REGROUPEMENT DES ACTIVITÉS (NOUVEAU)
  // =========================================================================
  const groupedActivities = useMemo(() => {
    if (!trip || !trip.activities) return { groups: [], noDate: [] };

    const withDate = [];
    const withoutDate = [];

    // 1. Séparation
    trip.activities.forEach(act => {
        if (act.date) withDate.push(act);
        else withoutDate.push(act);
    });

    // 2. Tri global par date
    withDate.sort((a, b) => new Date(a.date) - new Date(b.date));

    // 3. Regroupement par jour
    const groups = {}; // Objet temporaire : { "2024-05-20": [act1, act2], ... }

    withDate.forEach(act => {
        // On sécurise la date pour avoir une clé string propre (ex: "2024-05-20")
        const dateKey = new Date(act.date).toISOString().split('T')[0];
        
        if (!groups[dateKey]) {
            groups[dateKey] = {
                dateObj: new Date(act.date),
                activities: []
            };
        }
        groups[dateKey].activities.push(act);
    });

    // 4. Transformation en tableau et Tri interne (par heure)
    const sortedGroups = Object.values(groups).map(group => {
        // Tri des activités DANS le groupe
        group.activities.sort((a, b) => {
            // Si pas d'heure, on met à la fin ("ZZZ" est après les chiffres)
            const timeA = a.startTime || "ZZZ";
            const timeB = b.startTime || "ZZZ";
            return timeA.localeCompare(timeB);
        });
        return group;
    });

    // On s'assure que les groupes sont bien triés par date (normalement oui grâce à l'étape 2, mais sécurité)
    sortedGroups.sort((a, b) => a.dateObj - b.dateObj);

    return { groups: sortedGroups, noDate: withoutDate };

  }, [trip]);


  // =========================================================================
  // 1. GESTION DU VOYAGE
  // =========================================================================
  const openEditModal = () => {
    setEditForm({
        title: trip.title,
        startDate: trip.startDate ? new Date(trip.startDate) : undefined,
        endDate: trip.endDate ? new Date(trip.endDate) : undefined,
        participantsStr: trip.participants.join(', ')
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateTrip = async () => {
    try {
      const str = editForm.participantsStr || "";
      const participantsArray = str.split(',').map(p => p.trim()).filter(p => p !== "");
      
      const payload = {
          title: editForm.title,
          participants: participantsArray,
          startDate: editForm.startDate ? format(editForm.startDate, 'yyyy-MM-dd') : '',
          endDate: editForm.endDate ? format(editForm.endDate, 'yyyy-MM-dd') : ''
      };

      const res = await api.put(`/trips/${id}`, payload);
      setTrip(res.data);
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("ERREUR lors de la modification :", error);
      alert("Erreur lors de la sauvegarde !");
    }
  };


  // =========================================================================
  // 2. GESTION DES ACTIVITÉS
  // =========================================================================
  
  const openActivityModal = (activity = null) => {
    if (activity) {
      setEditingActivityId(activity._id);
      setActivityForm({
        name: activity.name,
        date: activity.date ? new Date(activity.date) : undefined,
        startTime: activity.startTime || '',
        endTime: activity.endTime || '',
        address: activity.address || '',
        notes: activity.notes || ''
      });
    } else {
      setEditingActivityId(null);
      setActivityForm({ name: '', date: undefined, startTime: '', endTime: '', address: '', notes: '' });
    }
    setIsActivityModalOpen(true);
  };

  const handleSaveActivity = async () => {
    if (!activityForm.name) return;

    if (activityForm.startTime && activityForm.endTime && activityForm.endTime < activityForm.startTime) {
        alert("L'heure de fin ne peut pas être avant l'heure de début !");
        return;
    }

    try {
      let res;
      if (editingActivityId) {
        res = await api.put(`/trips/${id}/activities/${editingActivityId}`, activityForm);
      } else {
        res = await api.post(`/trips/${id}/activities`, activityForm);
      }
      setTrip(res.data);
      setIsActivityModalOpen(false);
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la sauvegarde de l'activité");
    }
  };

  const handleDeleteActivity = async (activityId) => {
    if (window.confirm("Supprimer cette activité ?")) {
        const res = await api.delete(`/trips/${id}/activities/${activityId}`);
        setTrip(res.data);
    }
  };


  // =========================================================================
  // 3. GESTION DES DÉPENSES
  // =========================================================================

  const openExpenseModal = (expense = null) => {
    if (expense) {
      setEditingExpenseId(expense._id);
      setExpenseForm({
        title: expense.title,
        amount: expense.amount,
        payer: expense.payer,
        beneficiaries: expense.beneficiaries
      });
    } else {
      setEditingExpenseId(null);
      setExpenseForm({ title: '', amount: '', payer: trip.participants[0] || '', beneficiaries: [] });
    }
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = async () => {
    if (!expenseForm.title || !expenseForm.amount || !expenseForm.payer) return;
    if (expenseForm.beneficiaries.length === 0) { alert("Sélectionnez au moins une personne !"); return; }

    try {
      if (editingExpenseId) {
        await api.put(`/expenses/${editingExpenseId}`, { ...expenseForm, tripId: id });
      } else {
        await api.post('/expenses', { ...expenseForm, tripId: id });
      }

      const res = await api.get(`/expenses/trip/${id}`);
      setExpenses(res.data);
      await refreshBalance();
      setIsExpenseModalOpen(false);
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la sauvegarde de la dépense");
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (window.confirm("Supprimer ?")) {
      await api.delete(`/expenses/${expenseId}`);
      setExpenses(expenses.filter(exp => exp._id !== expenseId));
      await refreshBalance();
    }
  };

  const toggleBeneficiary = (participant) => {
    const currentList = expenseForm.beneficiaries;
    if (currentList.includes(participant)) {
      setExpenseForm({ ...expenseForm, beneficiaries: currentList.filter(p => p !== participant) });
    } else {
      setExpenseForm({ ...expenseForm, beneficiaries: [...currentList, participant] });
    }
  };

  const handleToggleSelectAll = () => {
    if (expenseForm.beneficiaries.length === trip?.participants.length) {
        setExpenseForm({ ...expenseForm, beneficiaries: [] });
    } else {
        setExpenseForm({ ...expenseForm, beneficiaries: trip?.participants });
    }
  };


  // =========================================================================
  // RENDER
  // =========================================================================

  if (!trip) return <div className="p-10 text-center">Chargement...</div>;
  const isAllSelected = expenseForm.beneficiaries.length === trip.participants.length;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* --- EN-TÊTE --- */}
        <div className="flex justify-between items-center">
          <Link to="/">
            <Button variant="outline">← Retour</Button>
          </Link>
          
          <div className="text-right flex flex-col items-end">
            <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight">{trip.title}</h1>
                
                {/* MODAL MODIF VOYAGE */}
                <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={openEditModal} className="h-8 w-8 text-gray-400 hover:text-blue-600">
                            <Pencil className="h-5 w-5" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] bg-white">
                        <DialogHeader><DialogTitle>Modifier le voyage</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Titre du voyage</Label>
                                <Input value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Participants (séparés par virgule)</Label>
                                <Input value={editForm.participantsStr} onChange={e => setEditForm({...editForm, participantsStr: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Début</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !editForm.startDate && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {editForm.startDate ? format(editForm.startDate, "PPP", { locale: fr }) : <span>Date début</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 bg-white" align="start">
                                            <Calendar mode="single" selected={editForm.startDate} onSelect={(date) => setEditForm({...editForm, startDate: date})} initialFocus locale={fr} />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Fin</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !editForm.endDate && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {editForm.endDate ? format(editForm.endDate, "PPP", { locale: fr }) : <span>Date fin</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 bg-white" align="start">
                                            <Calendar mode="single" selected={editForm.endDate} onSelect={(date) => setEditForm({...editForm, endDate: date})} initialFocus locale={fr} disabled={{ before: editForm.startDate }} />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleUpdateTrip} className="bg-blue-600 hover:bg-blue-700 text-white">Sauvegarder</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <p className="text-muted-foreground text-sm">Participants : {trip.participants.join(', ')}</p>
            {(trip.startDate || trip.endDate) && (
                <p className="text-blue-600 font-medium text-sm mt-1">
                  🗓️ {trip.startDate ? new Date(trip.startDate).toLocaleDateString() : '...'} 
                  {' ➔ '} 
                  {trip.endDate ? new Date(trip.endDate).toLocaleDateString() : '...'}
                </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* --- COLONNE GAUCHE : PLANNING (REFAITE) --- */}
          <Card className="shadow-sm border-blue-100 h-fit">
            <CardHeader className="bg-blue-50/50 border-b pb-4 flex flex-row justify-between items-center">
              <CardTitle className="text-blue-700">📅 Planning & Activités</CardTitle>
              
              <Dialog open={isActivityModalOpen} onOpenChange={setIsActivityModalOpen}>
                <Button size="sm" onClick={() => openActivityModal(null)} className="bg-blue-600 hover:bg-blue-700 text-white">➕ Ajouter</Button>
                
                <DialogContent className="sm:max-w-[425px] bg-white">
                    <DialogHeader>
                        <DialogTitle>{editingActivityId ? 'Modifier l\'activité' : 'Ajouter une activité'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2"><Label>Nom</Label><Input placeholder="Ex: Restaurant" value={activityForm.name} onChange={e => setActivityForm({...activityForm, name: e.target.value})} /></div>
                        
                        <div className="grid gap-2">
                            <Label>Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !activityForm.date && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {activityForm.date ? format(activityForm.date, "PPP", { locale: fr }) : <span>Choisir une date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-white" align="start">
                                    <Calendar mode="single" selected={activityForm.date} onSelect={(date) => setActivityForm({...activityForm, date: date})} initialFocus locale={fr} defaultMonth={activityForm.date || (trip.startDate ? new Date(trip.startDate) : new Date())} disabled={[trip.startDate ? { before: new Date(trip.startDate) } : null, trip.endDate ? { after: new Date(trip.endDate) } : null]} />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* --- HEURES (Input + Datalist) --- */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Début</Label>
                                <Input type="time" list="time-options" value={activityForm.startTime} onChange={e => setActivityForm({...activityForm, startTime: e.target.value})} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Fin</Label>
                                <Input type="time" list="time-options" min={activityForm.startTime} value={activityForm.endTime} onChange={e => setActivityForm({...activityForm, endTime: e.target.value})} />
                            </div>
                            <datalist id="time-options">{TIME_SLOTS.map(t => (<option key={t} value={t} />))}</datalist>
                        </div>

                        <div className="grid gap-2"><Label>Adresse</Label><Input placeholder="12 rue..." value={activityForm.address} onChange={e => setActivityForm({...activityForm, address: e.target.value})} /></div>
                        <div className="grid gap-2"><Label>Notes</Label><Input placeholder="Infos..." value={activityForm.notes} onChange={e => setActivityForm({...activityForm, notes: e.target.value})} /></div>
                    </div>
                    <DialogFooter><Button onClick={handleSaveActivity} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                        {editingActivityId ? 'Mettre à jour' : 'Enregistrer'}
                    </Button></DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              <div className="space-y-6">
                
                {/* 1. CAS VIDE */}
                {trip.activities.length === 0 && <p className="text-sm text-gray-400 italic text-center">Aucune activité prévue.</p>}

                {/* 2. GROUPES PAR DATE */}
                {groupedActivities.groups.map((group, index) => {
                    // Formatage du titre : "Lundi 12 décembre" (1ère lettre majuscule)
                    const dateStr = format(group.dateObj, "EEEE d MMMM", { locale: fr });
                    const formattedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

                    return (
                        <div key={index} className="space-y-3">
                            {/* Titre du jour (Démarcation) */}
                            <h3 className="text-sm font-bold text-blue-900 bg-blue-50 px-3 py-1.5 rounded-md inline-block border border-blue-100">
                                {formattedDate}
                            </h3>

                            {/* Liste des activités du jour */}
                            {group.activities.map(act => (
                                <div key={act._id} className="bg-white p-4 rounded-lg border shadow-sm relative group hover:border-blue-300 transition-all ml-2">
                                    <div className="flex justify-between items-start">
                                        <div className="w-full pr-8">
                                            <div className="flex items-center gap-2 mb-1">
                                                {/* Affichage heure ou placeholder */}
                                                <div className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {act.startTime ? (
                                                        <span>{act.startTime} {act.endTime && `➔ ${act.endTime}`}</span>
                                                    ) : (
                                                        <span>--:--</span>
                                                    )}
                                                </div>
                                            </div>

                                            <h4 className="font-bold text-gray-800 text-lg">{act.name}</h4>
                                            
                                            {act.address && (<div className="flex items-center gap-1 text-sm text-gray-500 mt-1"><MapPin className="w-3 h-3" /> {act.address}</div>)}
                                            {act.notes && (<p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded border border-gray-100 italic">"{act.notes}"</p>)}
                                        </div>
                                        
                                        <div className="absolute top-2 right-2 flex gap-1">
                                            <Button variant="ghost" size="sm" onClick={() => openActivityModal(act)} className="h-6 w-6 p-0 text-gray-300 hover:text-blue-600"><Pencil className="h-3 w-3" /></Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDeleteActivity(act._id)} className="h-6 w-6 p-0 text-gray-300 hover:text-red-600 hover:bg-red-50">✕</Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                })}

                {/* 3. ACTIVITÉS SANS DATE (À LA FIN) */}
                {groupedActivities.noDate.length > 0 && (
                    <div className="space-y-3 border-t border-dashed pt-4 mt-6">
                        <h3 className="text-sm font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-md inline-block">
                            📌 À planifier / Sans date
                        </h3>
                        {groupedActivities.noDate.map(act => (
                             <div key={act._id} className="bg-gray-50/50 p-4 rounded-lg border border-gray-200 shadow-sm relative group hover:border-gray-400 transition-all ml-2">
                                <div className="flex justify-between items-start">
                                    <div className="w-full pr-8">
                                        <h4 className="font-bold text-gray-700 text-lg">{act.name}</h4>
                                        {act.notes && (<p className="text-sm text-gray-500 mt-2 italic">"{act.notes}"</p>)}
                                    </div>
                                    <div className="absolute top-2 right-2 flex gap-1">
                                        <Button variant="ghost" size="sm" onClick={() => openActivityModal(act)} className="h-6 w-6 p-0 text-gray-300 hover:text-blue-600"><Pencil className="h-3 w-3" /></Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteActivity(act._id)} className="h-6 w-6 p-0 text-gray-300 hover:text-red-600 hover:bg-red-50">✕</Button>
                                    </div>
                                </div>
                             </div>
                        ))}
                    </div>
                )}

              </div>
            </CardContent>
          </Card>

          {/* --- COLONNE DROITE : DÉPENSES (Identique à avant) --- */}
          <Card className="shadow-sm border-orange-100 h-fit">
            <CardHeader className="bg-orange-50/50 border-b pb-4 flex flex-row justify-between items-center">
              <CardTitle className="text-orange-700">💸 Dépenses</CardTitle>
              <Dialog open={isExpenseModalOpen} onOpenChange={setIsExpenseModalOpen}>
                <Button size="sm" onClick={() => openExpenseModal(null)} className="bg-orange-600 hover:bg-orange-700 text-white">➕ Ajouter</Button>
                <DialogContent className="sm:max-w-[500px] bg-white">
                    <DialogHeader><DialogTitle>{editingExpenseId ? 'Modifier la dépense' : 'Ajouter une dépense'}</DialogTitle></DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2"><Label>Quoi ?</Label><Input placeholder="Ex: Bière" value={expenseForm.title} onChange={e => setExpenseForm({...expenseForm, title: e.target.value})} /></div>
                            <div className="grid gap-2"><Label>Combien (€) ?</Label><Input type="number" placeholder="0" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} /></div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Qui a payé ?</Label>
                            <div className="flex flex-wrap gap-2">
                                {trip.participants.map(p => (
                                    <div key={p} onClick={() => setExpenseForm({...expenseForm, payer: p})} className={`px-3 py-1.5 rounded-full border cursor-pointer select-none text-sm font-medium ${expenseForm.payer === p ? "bg-blue-600 border-blue-600 text-white shadow-md" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}>{p}</div>
                                ))}
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <div className="flex justify-between items-end">
                                <Label>Pour qui ?</Label>
                                <button onClick={handleToggleSelectAll} className="text-xs text-orange-600 font-bold hover:underline">{isAllSelected ? "Tout décocher" : "Tout cocher"}</button>
                            </div>
                            <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-gray-50 max-h-40 overflow-y-auto">
                                {trip.participants.map(p => (
                                    <div key={p} onClick={() => toggleBeneficiary(p)} className={`px-3 py-1.5 rounded-full border cursor-pointer select-none text-sm font-medium ${expenseForm.beneficiaries.includes(p) ? "bg-orange-600 border-orange-600 text-white shadow-md" : "bg-white border-gray-200 text-gray-600 hover:bg-orange-50" }`}>{p}</div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter><Button onClick={handleSaveExpense} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold">{editingExpenseId ? 'METTRE À JOUR' : 'AJOUTER'}</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <ul className="space-y-2 max-h-80 overflow-y-auto pr-2">
                {expenses.map(exp => (
                  <li key={exp._id} className="group flex justify-between items-center bg-white p-3 rounded-lg border shadow-sm hover:border-orange-200 transition-colors">
                    <div>
                      <div className="font-bold text-gray-800">{exp.title} <span className="text-orange-600">({exp.amount}€)</span></div>
                      <div className="text-xs text-gray-500">Payé par <span className="font-medium text-gray-700">{exp.payer}</span></div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openExpenseModal(exp)} className="h-8 w-8 text-gray-400 hover:text-orange-600"><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteExpense(exp._id)} className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50">✕</Button>
                    </div>
                  </li>
                ))}
              </ul>
              {balance && (
                <div className="mt-4 bg-slate-900 text-white p-5 rounded-xl shadow-xl">
                  <h3 className="font-bold mb-4 border-b border-gray-700 pb-2 text-lg">Remboursements :</h3>
                  <ul className="space-y-3 text-sm">
                    {balance.reimbursements.map((remb, i) => (
                      <li key={i} className="flex items-center justify-between bg-slate-800 p-3 rounded-lg">
                        <div className="flex items-center gap-2">🔴 <span className="font-bold text-red-300">{remb.from}</span> <span className="text-gray-400">doit</span></div>
                        <span className="bg-white text-black px-2 py-1 rounded font-bold text-base">{remb.amount}€</span> 
                        <div className="flex items-center gap-2"><span className="text-gray-400">à</span> 🟢 <span className="font-bold text-green-300">{remb.to}</span></div>
                      </li>
                    ))}
                    {balance.reimbursements.length === 0 && <li className="text-green-400 font-bold text-center text-lg">✅ Tout est à l'équilibre !</li>}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}