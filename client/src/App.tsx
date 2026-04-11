import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Roster from './pages/Roster';
import PlayerProfile from './pages/PlayerProfile';
import Events from './pages/Events';
import NewEvent from './pages/NewEvent';
import EventDetail from './pages/EventDetail';
import EditEvent from './pages/EditEvent';
import Spending from './pages/Spending';

export default function App() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/roster" element={<Roster />} />
          <Route path="/roster/:playerId" element={<PlayerProfile />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/new" element={<NewEvent />} />
          <Route path="/events/:eventId" element={<EventDetail />} />
          <Route path="/events/:eventId/edit" element={<EditEvent />} />
          <Route path="/spending" element={<Spending />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
