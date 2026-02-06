import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Server, Settings, Shield, Activity, LogOut, Cpu, AlertTriangle, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SidebarItem from './SidebarItem';
import { apiClient } from '../services/api';
import logo from '../assets/logo.jpg';
import './Sidebar.css';

const Sidebar = () => {
    const navigate = useNavigate();
    const [alertCount, setAlertCount] = useState(0);

    useEffect(() => {
        const abortController = new AbortController();

        const fetchAlerts = async () => {
            try {
                const res = await apiClient.get('/monitoring/status', { signal: abortController.signal });
                const downCount = res.data.filter(d => d.status === 'DOWN').length;
                setAlertCount(downCount);
            } catch (err) {
                // Ignore abort errors
                if (err.name === 'AbortError' || err.name === 'CanceledError') {
                    return;
                }
                console.error("Failed to fetch alerts", err);
            }
        };

        fetchAlerts();
        const interval = setInterval(fetchAlerts, 30000);

        return () => {
            clearInterval(interval);
            abortController.abort();
        };
    }, []);

    const handleLogout = () => {
        if (window.confirm("Are you sure you want to log out?")) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
        }
    };

    return (
        <div className="sidebar">
            <div className="logo-container">
                <img src={logo} alt="NetworkWeaver" className="app-logo" style={{ width: '32px', height: '32px', borderRadius: '6px' }} />
                <h1 className="app-title">NetworkWeaver</h1>
            </div>

            <nav className="nav-menu">
                <div className="nav-item-wrapper">
                    <SidebarItem icon={LayoutDashboard} label="Overview" to="/" />
                    {alertCount > 0 && (
                        <span className="alert-badge">{alertCount}</span>
                    )}
                </div>
                <SidebarItem icon={Activity} label="Monitoring" to="/monitoring" />
                <SidebarItem icon={Shield} label="Security" to="/security" />
                <SidebarItem icon={Settings} label="Devices" to="/devices" />
                <SidebarItem icon={Cpu} label="Configurations" to="/routeros" />
                <SidebarItem icon={FileText} label="Logs" to="/logs" />
            </nav>

            <div className="sidebar-footer">
                <div className="user-info">
                    <div className="user-avatar">AD</div>
                    <div className="user-details">
                        <span className="username">Admin</span>
                        <span className="role">System Root</span>
                    </div>
                </div>
                <button onClick={handleLogout} className="logout-btn">
                    <LogOut size={16} /> Sign Out
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
