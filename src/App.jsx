import { lazy, Suspense } from 'react';
import { Navigate, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import TopBar from './components/TopBar';
import LanguageSwitcher from './components/LanguageSwitcher';
import PrivateRoute from './components/PrivateRoute';
import { useAuth } from './context/auth-context';
import usePresence from './hooks/usePresence';

// ── Eagerly loaded (critical path) ──────────────────────────────────────────
import Home    from './pages/Home';
import Login   from './pages/Login';
import Register from './pages/Register';

// ── Lazy loaded ──────────────────────────────────────────────────────────────
const Movies          = lazy(() => import('./pages/Movies'));
const MovieDetail     = lazy(() => import('./pages/MovieDetail'));
const StaffLogin      = lazy(() => import('./pages/StaffLogin'));
const StaffRegister   = lazy(() => import('./pages/StaffRegister'));
const ForgotPassword  = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword   = lazy(() => import('./pages/ResetPassword'));
const Watchlist       = lazy(() => import('./pages/Watchlist'));
const AdminPanel      = lazy(() => import('./pages/AdminPanel'));
const AuthorDashboard = lazy(() => import('./pages/AuthorDashboard'));
const Actors          = lazy(() => import('./pages/Actors'));
const ActorProfile    = lazy(() => import('./pages/ActorProfile'));
const Account         = lazy(() => import('./pages/Account'));
const Analytics       = lazy(() => import('./pages/Analytics'));
const Subscription    = lazy(() => import('./pages/Subscription'));
const UserManagement  = lazy(() => import('./pages/UserManagement'));
const About           = lazy(() => import('./pages/About'));
const Contact         = lazy(() => import('./pages/Contact'));
const Privacy         = lazy(() => import('./pages/Privacy'));
const Terms           = lazy(() => import('./pages/Terms'));
const Plans           = lazy(() => import('./pages/Plans'));
const Checkout        = lazy(() => import('./pages/Checkout'));
const WhoIsWatching   = lazy(() => import('./pages/WhoIsWatching'));

function RouteLoading() {
  return (
    <div className="route-loading" role="status" aria-live="polite">
      <span className="route-loading-mark" />
      <span>Loading CINEMA Rwanda</span>
    </div>
  );
}

// Pages where we hide the nav chrome entirely
const NO_CHROME = ['/', '/login', '/register', '/staff/login', '/staff/register', '/who-is-watching'];
// Pages where we hide the topbar (auth pages, staff portal)
const NO_TOPBAR = ['/', '/login', '/register', '/staff/login', '/staff/register', '/who-is-watching', '/forgot-password', '/reset-password'];

export default function App() {
  const { user } = useAuth();
  const location = useLocation();

  const hideChrome = NO_CHROME.includes(location.pathname) && !user;
  const hideTopBar = NO_TOPBAR.includes(location.pathname);
  // '/' has its own inline landing footer; '/who-is-watching' has no footer at all
  const hideFooter = location.pathname === '/who-is-watching' || (location.pathname === '/' && !user);

  // Presence heartbeat — pings every 30s while logged in
  usePresence(user);

  return (
    <>
      {!hideTopBar && <TopBar />}
      {!hideChrome && <Navbar />}

      <Suspense fallback={<RouteLoading />}>
        <Routes>
          <Route path="/"               element={user ? <Navigate to="/movies" replace /> : <Home />} />
          <Route path="/login"          element={<Login />} />
          <Route path="/register"       element={<Register />} />
          <Route path="/staff/login"    element={<StaffLogin />} />
          <Route path="/staff/register" element={<StaffRegister />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password"  element={<ResetPassword />} />
          <Route path="/about"   element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms"   element={<Terms />} />
          <Route path="/plans"   element={<Plans />} />

          <Route path="/who-is-watching" element={<PrivateRoute><WhoIsWatching /></PrivateRoute>} />
          <Route path="/movies"          element={<PrivateRoute><Movies /></PrivateRoute>} />
          <Route path="/movies/:id"      element={<PrivateRoute><MovieDetail /></PrivateRoute>} />
          <Route path="/actors"          element={<PrivateRoute><Actors /></PrivateRoute>} />
          <Route path="/actors/:id"      element={<PrivateRoute><ActorProfile /></PrivateRoute>} />
          <Route path="/watchlist"       element={<PrivateRoute><Watchlist /></PrivateRoute>} />
          <Route path="/account"         element={<PrivateRoute><Account /></PrivateRoute>} />
          <Route path="/subscription"    element={<PrivateRoute><Subscription /></PrivateRoute>} />
          <Route path="/checkout"        element={<PrivateRoute><Checkout /></PrivateRoute>} />
          <Route path="/dashboard"       element={<PrivateRoute authorOnly><AuthorDashboard /></PrivateRoute>} />
          <Route path="/admin"           element={<PrivateRoute adminOnly><AdminPanel /></PrivateRoute>} />
          <Route path="/analytics"       element={<PrivateRoute adminOnly><Analytics /></PrivateRoute>} />
          <Route path="/users"           element={<PrivateRoute adminOnly><UserManagement /></PrivateRoute>} />
        </Routes>
      </Suspense>

      {!hideFooter && <Footer />}
      <LanguageSwitcher />
    </>
  );
}
