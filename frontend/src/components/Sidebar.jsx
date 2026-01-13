import React from 'react';
import { LayoutDashboard, Server, Settings, Shield, Activity, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SidebarItem from './SidebarItem';
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
                <Server size={28} className="logo-icon" />
                <h1 className="app-title">ConfigWeaver</h1>
            </div>

            <nav className="nav-menu">
                <SidebarItem icon={LayoutDashboard} label="Overview" to="/" />
                <SidebarItem icon={Activity} label="Monitoring" to="/monitoring" />
                <SidebarItem icon={Shield} label="Security Policies" to="/security" />
                <SidebarItem icon={Settings} label="Devices" to="/devices" />
                <SidebarItem icon={Activity} label="RouterOS" to="/routeros" />
            </nav>

            <div className="sidebar-footer">
                <div className="user-info">
                    <div className="user-avatar">AD</div>
                    <div className="user-details">
                        <span className="username">Admin User</span>
                        <span className="role">Administrator</span>
                    </div>
                </div>
                <button onClick={handleLogout} className="logout-btn" title="Log Out">
                    <LogOut size={20} />
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
