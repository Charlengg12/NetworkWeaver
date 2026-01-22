import React from 'react';
import { LayoutDashboard, Server, Settings, Shield, Activity, LogOut, Cpu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SidebarItem from './SidebarItem';
import logo from '../assets/logo.jpg';
import './Sidebar.css';

const Sidebar = () => {
    const navigate = useNavigate();

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
                <SidebarItem icon={LayoutDashboard} label="Overview" to="/" />
                <SidebarItem icon={Activity} label="Monitoring" to="/monitoring" />
                <SidebarItem icon={Shield} label="Security" to="/security" />
                <SidebarItem icon={Settings} label="Devices" to="/devices" />
                <SidebarItem icon={Cpu} label="RouterOS" to="/routeros" />
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
