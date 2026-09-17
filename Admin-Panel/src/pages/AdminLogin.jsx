import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ShieldAlert, Lock } from 'lucide-react';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { setIsAdminLoggedIn } = useStore();
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (adminId === 'admin' && password === 'admin123') {
      setIsAdminLoggedIn(true);
      navigate('/admin');
    } else {
      setError('Invalid Admin ID or Password');
    }
  };

  return (
    <div className="page-container" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
      <div className="glass-panel" style={{ padding: '40px', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <Lock size={64} color="var(--primary-color)" />
        </div>
        <h2 style={{ marginBottom: '24px' }}>Admin Access</h2>
        
        {error && (
          <div style={{ background: 'var(--danger-color)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '24px', display: 'flex', gap: '8px', color: '#fff' }}>
            <ShieldAlert size={20} />
            <span style={{ fontSize: '0.9rem' }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <input 
              required
              className="input-field" 
              type="text" 
              placeholder="Admin ID"
              value={adminId}
              onChange={e => setAdminId(e.target.value)}
            />
          </div>
          <div>
            <input 
              required
              className="input-field" 
              type="password" 
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '8px', width: '100%' }}>
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
