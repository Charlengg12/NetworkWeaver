import RouterOSPage from './pages/RouterOS';
import React, { useState, useEffect } from 'react';
import { Activity, BarChart } from 'lucide-react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Security from './pages/Security';
import Monitoring from './pages/Monitoring';
import Login from './pages/Login';
import Devices from './pages/Devices';
import { apiClient } from './services/api';
import RouterOSDeviceList from './components/RouterOS/DeviceList';
import './App.css'; // Global Layout Styles

const ProtectedLayout = () => {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <Outlet />
    </div>
  );
};

const DashboardHome = () => {
  const [stats, setStats] = useState({ routers: 0, status: 'Checking...' });
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiClient.get('/devices/');
        setStats({ routers: res.data.length, status: 'Healthy' });
      } catch {
        setStats({ routers: '-', status: 'Backend Offline' });
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="page-container">
      <header className="page-header">
        <h1 className="page-title">System Overview</h1>
      </header>
      <div className="content-grid">
        <div className="card">
          <h3>Active Routers</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '10px' }}>{stats.routers}</p>
        </div>
        <div className="card">
          <h3>System Status</h3>
          <p style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            marginTop: '10px',
            color: stats.status === 'Healthy' ? 'var(--success-color)' : 'var(--danger-color)'
          }}>{stats.status}</p>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <h3>Network Devices</h3>
          <RouterOSDeviceList />
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <h3>Quick Links</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            {/* NetworkWeaver Tools */}
            <a href="http://localhost:3000" target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ textDecoration: 'none', background: 'var(--accent-cyan)', color: '#000', fontWeight: 'bold' }}>
              <Activity size={18} /> NW Grafana
            </a>
            <a href="http://localhost:9090" target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ textDecoration: 'none', background: 'var(--bg-tertiary)', border: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)' }}>
              <Activity size={18} /> NW Prometheus
            </a>

            {/* RouterOS Tools */}
            <a href="http://localhost:3001" target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ textDecoration: 'none', background: 'var(--accent-purple)', color: '#fff', fontWeight: 'bold' }}>
              <BarChart size={18} /> ROS Grafana
            </a>
            <a href="http://localhost:9091" target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ textDecoration: 'none', background: 'var(--bg-tertiary)', border: '1px solid var(--accent-purple)', color: 'var(--accent-purple)' }}>
              <Activity size={18} /> ROS Prometheus
            </a>
          </div>
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
      </Route>
    </Routes>
  );
}

export default App;
