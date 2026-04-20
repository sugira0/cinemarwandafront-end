import { Navigate, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LanguageSwitcher from './components/LanguageSwitcher';
import Home from './pages/Home';
import Movies from './pages/Movies';
import MovieDetail from './pages/MovieDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Watchlist from './pages/Watchlist';
import AdminPanel from './pages/AdminPanel';
import AuthorDashboard from './pages/AuthorDashboard';
import Actors from './pages/Actors';
import ActorProfile from './pages/ActorProfile';
import Account from './pages/Account';
import Analytics from './pages/Analytics';
import Subscription from './pages/Subscription';
import UserManagement from './pages/UserManagement';
import About from './pages/About';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Plans from './pages/Plans';
import Checkout from './pages/Checkout';
import WhoIsWatching from './pages/WhoIsWatching';
import PrivateRoute from './components/PrivateRoute';
import { useAuth } from './context/auth-context';

export default function App() {
  const { user } = useAuth();
  const location = useLocation();
  const hideChrome = (!user && location.pathname === '/') || location.pathname === '/who-is-watching';

  return (
    <>
      {!hideChrome && <Navbar />}
      <Routes>
        <Route path="/" element={user ? <Navigate to="/movies" replace /> : <Home />} />
        <Route path="/who-is-watching" element={<PrivateRoute><WhoIsWatching /></PrivateRoute>} />
        <Route path="/movies" element={<PrivateRoute><Movies /></PrivateRoute>} />
        <Route path="/movies/:id" element={<PrivateRoute><MovieDetail /></PrivateRoute>} />
        <Route path="/actors" element={<PrivateRoute><Actors /></PrivateRoute>} />
        <Route path="/actors/:id" element={<PrivateRoute><ActorProfile /></PrivateRoute>} />
        <Route path="/login"            element={<Login />} />
        <Route path="/register"         element={<Register />} />
        <Route path="/forgot-password"  element={<ForgotPassword />} />
        <Route path="/reset-password"   element={<ResetPassword />} />
        <Route path="/watchlist" element={<PrivateRoute><Watchlist /></PrivateRoute>} />
        <Route path="/account"   element={<PrivateRoute><Account /></PrivateRoute>} />
        <Route path="/dashboard"  element={<PrivateRoute authorOnly><AuthorDashboard /></PrivateRoute>} />
        <Route path="/admin"      element={<PrivateRoute adminOnly><AdminPanel /></PrivateRoute>} />
        <Route path="/analytics"    element={<PrivateRoute adminOnly><Analytics /></PrivateRoute>} />
        <Route path="/users"        element={<PrivateRoute adminOnly><UserManagement /></PrivateRoute>} />
        <Route path="/subscription" element={<PrivateRoute><Subscription /></PrivateRoute>} />
        <Route path="/about"   element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms"   element={<Terms />} />
        <Route path="/plans"    element={<Plans />} />
        <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
      </Routes>
      {!hideChrome && <Footer />}
      <LanguageSwitcher />
    </>
  );
}
