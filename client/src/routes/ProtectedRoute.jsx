import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;

  // Not logged in → go to that portal's login
  if (!user) return <Navigate to={`/portal/${role}`} replace />;

  // Logged in as wrong role → go to home
  if (user.role !== role) return <Navigate to="/" replace />;

  return children;
}
