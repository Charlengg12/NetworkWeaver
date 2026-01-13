import React from 'react';
import { NavLink } from 'react-router-dom';
import './SidebarItem.css';

/* eslint-disable react/prop-types */
const SidebarItem = ({ icon, label, to }) => {
    const Icon = icon;
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                `sidebar-item ${isActive ? 'active' : ''}`
            }
        >
            <Icon size={20} />
            <span className="label">{label}</span>
        </NavLink>
    );
};

export default SidebarItem;
