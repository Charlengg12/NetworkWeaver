import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { Server, Plus, Trash2, X, Globe, User, Hash, AlertCircle } from 'lucide-react';
import './Devices.css';

const Devices = () => {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        ip_address: '',
        username: '',
        password: '',
        api_port: 8728,
        snmp_community: 'public'
    });
    const [skipValidation, setSkipValidation] = useState(false);
    const [error, setError] = useState(null);

    const fetchDevices = async (signal = null) => {
        try {
            const config = signal ? { signal } : {};
            const res = await apiClient.get('/devices/', config);
            setDevices(res.data);
        } catch (err) {
            // Ignore abort errors
            if (err.name === 'AbortError' || err.name === 'CanceledError') {
                return;
            }
            console.error("Failed to fetch devices", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const abortController = new AbortController();
        fetchDevices(abortController.signal);
        return () => abortController.abort();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'api_port' ? parseInt(value) : value
        }));
        if (error) setError(null);
    };

    const validateIP = (ip) => {
        const parts = ip.split('.');
        if (parts.length !== 4) return false;
        return parts.every(part => {
            const num = parseInt(part, 10);
            return !isNaN(num) && num >= 0 && num <= 255 && num.toString() === part;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!validateIP(formData.ip_address)) {
            setError("Invalid IP Address: Must be 4 numbers between 0 and 255 (e.g., 192.168.1.1)");
            return;
        }

        try {
            await apiClient.post(`/devices/?validate_connectivity=${!skipValidation}`, formData);
            setShowAddModal(false);
            setFormData({
                name: '',
                ip_address: '',
                username: '',
                password: '',
                api_port: 8728,
                snmp_community: 'public'
            });
            setSkipValidation(false);
            fetchDevices();
        } catch (err) {
            // Auto-retry with validation skipped if it was a connectivity error (400)
            if (err.response?.status === 400 && !skipValidation) {
                try {
                    console.log("Connectivity check failed, retrying with validation skipped...");
                    await apiClient.post(`/devices/?validate_connectivity=false`, formData);

                    // Success on retry!
                    setShowAddModal(false);
                    setFormData({
                        name: '',
                        ip_address: '',
                        username: '',
                        password: '',
                        api_port: 8728,
                        snmp_community: 'public'
                    });
                    setSkipValidation(false);
                    fetchDevices();
                    alert("Device added successfully, but it is currently unreachable. Please check your network connection.");
                    return;
                } catch (retryErr) {
                    // Retry failed too, handle normally
                    console.error("Retry failed", retryErr);
                    err = retryErr; // Use the retry error for the subsequent error handling
                }
            }

            console.error("Failed to add device", err);
            let errorMessage = "Failed to add device. Please check your inputs and connection.";

            if (err.response?.data?.detail) {
                const detail = err.response.data.detail;
                // Handle nested error object from backend
                if (typeof detail === 'object' && detail.message) {
                    errorMessage = `${detail.message}: ${detail.errors?.join(', ') || ''}`;
                    if (detail.suggestion) {
                        errorMessage += ` ${detail.suggestion}`;
                    }
                } else {
                    errorMessage = detail;
                }
            }
            setError(errorMessage);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this device?")) return;
        try {
            await apiClient.delete(`/devices/${id}`);
            fetchDevices();
        } catch (err) {
            console.error("Failed to delete device", err);
        }
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <div>
                    <h1 className="page-title">Device Inventory</h1>
                    <p className="page-subtitle">Manage your MikroTik routers and switches</p>
                </div>
                <button
                    className="btn-primary add-device-btn"
                    onClick={() => setShowAddModal(true)}
                >
                    <Plus size={20} /> Add Device
                </button>
            </header>

            {loading ? (
                <p>Loading devices...</p>
            ) : (
                <div className="devices-grid">
                    {devices.map(device => (
                        <div key={device.id} className="device-card">
                            <div className="device-card-header">
                                <h3><Server size={20} /> {device.name}</h3>
                                <span className="status-indicator online"></span>
                            </div>
                            <div className="device-details">
                                <p><Globe size={16} /> {device.ip_address}</p>
                                <p><User size={16} /> {device.username}</p>
                                <p><Hash size={16} /> Port: {device.api_port}</p>
                            </div>
                            <div className="device-actions">
                                <button
                                    className="btn-delete"
                                    onClick={() => handleDelete(device.id)}
                                    title="Delete Device"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {devices.length === 0 && (
                        <div className="no-data">
                            <p>No devices found. Add one to get started.</p>
                        </div>
                    )}
                </div>
            )}

            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Add New Device</h2>
                            <button className="btn-icon" onClick={() => setShowAddModal(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        {error && (
                            <div className="error-message" style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                color: 'var(--danger-color)',
                                padding: '10px',
                                borderRadius: '6px',
                                marginBottom: '15px',
                                fontSize: '0.9rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Device Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    className="input-field"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="e.g. Core-Router-01"
                                />
                            </div>
                            <div className="form-group">
                                <label>IP Address</label>
                                <input
                                    type="text"
                                    name="ip_address"
                                    className="input-field"
                                    value={formData.ip_address}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="192.168.88.1"
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>API Port</label>
                                    <input
                                        type="number"
                                        name="api_port"
                                        className="input-field"
                                        value={formData.api_port}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>SNMP Community</label>
                                    <input
                                        type="text"
                                        name="snmp_community"
                                        className="input-field"
                                        value={formData.snmp_community}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Username</label>
                                    <input
                                        type="text"
                                        name="username"
                                        className="input-field"
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Password</label>
                                    <input
                                        type="password"
                                        name="password"
                                        className="input-field"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group checkbox-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={skipValidation}
                                        onChange={(e) => setSkipValidation(e.target.checked)}
                                    />
                                    <span>Skip connectivity validation (for non-RouterOS devices)</span>
                                </label>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-text" onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Add Device</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Devices;
