import RouterOSPage from './pages/RouterOS';

import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Security from './pages/Security';
import Monitoring from './pages/Monitoring';
import Login from './pages/Login';
import Devices from './pages/Devices';
import axios from 'axios';

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
        const res = await axios.get(`${API_URL}/devices/`);
        setStats({ routers: res.data.length, status: 'Healthy' });
      } catch (err) {
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
