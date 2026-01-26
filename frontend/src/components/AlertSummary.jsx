import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { apiClient } from '../services/api';
import './AlertSummary.css';

const AlertSummary = () => {
    const [alerts, setAlerts] = useState({ up: 0, down: 0, devices: [] });
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);

    const fetchAlerts = async (signal) => {
        try {
            const res = await apiClient.get('/monitoring/status', { signal });
            const devices = res.data;
            const upCount = devices.filter(d => d.status === 'UP').length;
            const downCount = devices.filter(d => d.status === 'DOWN').length;

            setAlerts({
                up: upCount,
                down: downCount,
                devices: devices.filter(d => d.status === 'DOWN')
            });
            setLastUpdated(new Date());
        } catch (err) {
            // Ignore abort errors
            if (err.name === 'AbortError' || err.name === 'CanceledError') {
                return;
            }
            console.error("Failed to fetch alerts", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const abortController = new AbortController();

        fetchAlerts(abortController.signal);
        const interval = setInterval(() => {
            fetchAlerts(abortController.signal);
        }, 30000); // Refresh every 30 seconds

        return () => {
            clearInterval(interval);
            abortController.abort(); // Cancel any pending requests
        };
    }, []);

    if (loading) {
        return (
            <div className="alert-summary loading">
                <RefreshCw className="spin" size={20} />
                <span>Checking device status...</span>
            </div>
        );
    }

    return (
        <div className="alert-summary">
            <div className="alert-header">
                <h3><AlertTriangle size={18} /> Device Status</h3>
                <span className="last-updated">
                    Updated: {lastUpdated?.toLocaleTimeString()}
                </span>
            </div>

            <div className="alert-cards">
                <div className={`alert-card ${alerts.down > 0 ? 'danger' : 'success'}`}>
                    {alerts.down > 0 ? (
                        <XCircle size={24} className="alert-icon" />
                    ) : (
                        <CheckCircle size={24} className="alert-icon" />
                    )}
                    <div className="alert-content">
                        <span className="alert-count">{alerts.down}</span>
                        <span className="alert-label">Devices Down</span>
                    </div>
                </div>

                <div className="alert-card success">
                    <CheckCircle size={24} className="alert-icon" />
                    <div className="alert-content">
                        <span className="alert-count">{alerts.up}</span>
                        <span className="alert-label">Devices Online</span>
                    </div>
                </div>
            </div>

            {alerts.down > 0 && (
                <div className="alert-details">
                    <h4>⚠️ Unreachable Devices</h4>
                    <ul>
                        {alerts.devices.map(device => (
                            <li key={device.id}>
                                <XCircle size={14} />
                                <span className="device-name">{device.name}</span>
                                <span className="device-ip">{device.ip_address}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default AlertSummary;
