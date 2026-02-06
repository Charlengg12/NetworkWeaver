import RouterOSPage from './pages/RouterOS';
import React, { useState, useEffect } from 'react';
import { Activity, BarChart } from 'lucide-react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import AlertSummary from './components/AlertSummary';
import Security from './pages/Security';
import Monitoring from './pages/Monitoring';
import Login from './pages/Login';
import Devices from './pages/Devices';
import Logs from './pages/Logs';
import { apiClient } from './services/api';
import RouterOSDeviceList from './components/RouterOS/DeviceList';
import LoadingSpinner from './components/LoadingSpinner';
import './App.css'; // Global Layout Styles

const ProtectedLayout = () => {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

const DashboardHome = () => {
  const [stats, setStats] = useState({ routers: 0, status: 'Checking...' });
  const [isLoading, setIsLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    const abortController = new AbortController();

    const fetchStats = async () => {
      try {
        const res = await apiClient.get('/devices/', { signal: abortController.signal });
        setStats({ routers: res.data.length, status: 'Healthy' });
      } catch (err) {
        if (err.name === 'AbortError' || err.name === 'CanceledError') return;
        setStats({ routers: '-' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();

    return () => {
      abortController.abort();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="page-container" style={{ height: 'calc(100vh - 4rem)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <h1 className="page-title">System Overview</h1>
      </header>
      <div className="content-grid">
        <div style={{ gridColumn: '1 / -1' }}>
          <AlertSummary />
        </div>
        <div className="card" style={{ height: 'auto' }}>
          <h3 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Active Routers</h3>
          <p style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: '0.5rem 0 0 0' }}>{stats.routers}</p>
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem' }}>Network Devices</h3>
          <RouterOSDeviceList />
        </div>
      </div>
    </div>
  );
};

import { createContext, useContext } from 'react';
import { X } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`}>
      <span>{message}</span>
      <button onClick={onClose} className="toast-close"><X size={14} /></button>
    </div>
  );
};

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/security" element={<Security />} />
          <Route path="/monitoring" element={<Monitoring />} />
          <Route path="/devices" element={<Devices />} />
          <Route path="/routeros" element={<RouterOSPage />} />
          <Route path="/logs" element={<Logs />} />
        </Route>
      </Routes>
    </ToastProvider>
  );
}

export default App;
