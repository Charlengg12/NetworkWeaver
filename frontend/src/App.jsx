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
import ScriptManager from './pages/ScriptManager';
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
        setStats({ routers: '-', status: 'Backend Offline' });
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
        <div className="card" style={{ height: 'auto' }}>
          <h3 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>System Status</h3>
          <p style={{
            fontSize: '1.75rem',
            fontWeight: 'bold',
            margin: '0.5rem 0 0 0',
            color: stats.status === 'Healthy' ? 'var(--success)' : 'var(--danger)'
          }}>{stats.status}</p>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem' }}>Network Devices</h3>
          <RouterOSDeviceList />
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/security" element={<Security />} />
        <Route path="/monitoring" element={<Monitoring />} />
        <Route path="/devices" element={<Devices />} />
        <Route path="/routeros" element={<RouterOSPage />} />
        <Route path="/scripts" element={<ScriptManager />} />
      </Route>
    </Routes>
  );
}

export default App;
