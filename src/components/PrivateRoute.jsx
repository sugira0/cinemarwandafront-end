import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/auth-context';

export default function PrivateRoute({ children, adminOnly, authorOnly }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    const redirect = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace />;
  }

  // Support both old {isAdmin} shape and new {role} shape from localStorage
  const role = user.role || (user.isAdmin ? 'admin' : 'viewer');
  if (adminOnly && role !== 'admin') return <Navigate to="/" replace />;
  if (authorOnly && role !== 'author' && role !== 'admin') return <Navigate to="/" replace />;
  return children;
}
