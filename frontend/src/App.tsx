import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ServerDetail from './pages/ServerDetail';
import ProtectedRoute from './components/ProtectedRoute';
import TerminalDashboard from './pages/TerminalDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/dashboard/:serverId" element={
          <ProtectedRoute><ServerDetail /></ProtectedRoute>
        } />
        <Route path="/terminal" element={
          <TerminalDashboard />
        } />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
