import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import SystemMetrics from '../components/RouterOS/SystemMetrics';
import './Monitoring.css';

const Monitoring = () => {
    const [devices, setDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const GRAFANA_URL = "http://localhost:3000/d/networkweaver-main?orgId=1&kiosk=tv";

    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const response = await apiClient.get('/devices/');
                setDevices(response.data);
                // Auto-select first RouterOS device
                const routerOS = response.data.find(d => d.device_type === 'router' || d.device_type === 'routeros');
                if (routerOS) setSelectedDevice(routerOS.id);
                else if (response.data.length > 0) setSelectedDevice(response.data[0].id);
            } catch (err) {
                console.error('Failed to fetch devices:', err);
            }
        };
        fetchDevices();
    }, []);

    return (
        <div className="page-container monitoring-page">
            {/* API-Based System Metrics Panel */}
            <div className="monitoring-header">
                <h2>Real-Time Monitoring</h2>
                <select
                    className="device-selector"
                    value={selectedDevice || ''}
                    onChange={(e) => setSelectedDevice(parseInt(e.target.value))}
                >
                    <option value="" disabled>Select Device</option>
                    {devices.map(device => (
                        <option key={device.id} value={device.id}>
                            {device.name} ({device.ip_address})
                        </option>
                    ))}
                </select>
            </div>

            {/* System Metrics from RouterOS API */}
            <SystemMetrics deviceId={selectedDevice} />

            {/* Grafana Dashboard Embed */}
            <div className="grafana-container">
                <h3>Network Traffic (Grafana)</h3>
                <iframe
                    src={GRAFANA_URL}
                    width="100%"
                    height="500"
                    frameBorder="0"
                    title="Grafana Dashboard"
                ></iframe>
                <div className="grafana-overlay">
                    <p>If Grafana is not loading, ensure the container is running and the dashboard is created.</p>
                    <p>Dashboard URL: <a href="http://localhost:3000" target="_blank" rel="noreferrer">Open Grafana</a></p>
                </div>
            </div>
        </div>
    );
};

export default Monitoring;

