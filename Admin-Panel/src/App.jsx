import React, { useState } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Fingerprint, Settings, UserPlus, CheckCircle } from 'lucide-react';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import Registration from './pages/Registration';
import { useStore } from './context/StoreContext';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { isAdminLoggedIn } = useStore();
  if (!isAdminLoggedIn) {
    return <AdminLogin />;
  }
  return children;
};

function App() {
  const { isAdminLoggedIn } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [clickCount, setClickCount] = useState(0);

  const handleLogoClick = () => {
    setClickCount(prev => prev + 1);
    if (clickCount + 1 >= 5) {
      setClickCount(0);
      navigate('/admin');
    }
    
    // Reset count if they stop clicking after 2 seconds
    setTimeout(() => setClickCount(0), 2000);
  };

  return (
    <div className="app-container">
      {location.pathname !== '/vote' && (
        <nav className="glass-panel main-nav">
          <div className="nav-brand" onClick={handleLogoClick} style={{ cursor: 'pointer' }} title="Smart Vote">
            <Fingerprint size={28} color="var(--primary-color)" />
            <span className="title-glow">Smart Vote</span>
          </div>
        <div className="nav-links">
          <Link to="/admin" className="nav-link"><Settings size={18} /> Admin Dashboard</Link>
          <Link to="/register" className="nav-link"><UserPlus size={18} /> Register Voter</Link>
        </div>
      </nav>
      )}

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/register" element={
            <ProtectedRoute>
              <Registration />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
    </div>
  );
}

export default App;
