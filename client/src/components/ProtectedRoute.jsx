import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute() {
    const { user, loading } = useAuth();

    if (loading) return <div className="p-4">Loading...</div>;

    // Si pas de user, on redirige vers /login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Sinon on affiche le contenu de la route (Children)
    return <Outlet />;
}
