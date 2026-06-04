import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute() {
    const { signed, loading } = useAuth();

    if (loading) {
        return <div className="loading-screen">Carregando...</div>;
    }

    return signed ? <Outlet /> : <Navigate to="/login" replace />;
}
