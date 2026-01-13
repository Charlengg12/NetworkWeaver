import React, { useState, useEffect } from 'react';
import { routerosAPI } from '../../services/routeros/api';
import { apiClient } from '../../services/api'; // Use generic client for standard CRUD
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';

const RouterOSDeviceList = () => {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [testingId, setTestingId] = useState(null);
    const [testResults, setTestResults] = useState({});

    useEffect(() => {
        fetchDevices();
    }, []);

    const fetchDevices = async () => {
        try {
            const res = await apiClient.get('/devices/'); // Standard CRUD endpoint
            setDevices(res.data);
        } catch (error) {
            console.error("Failed to fetch devices", error);
        } finally {
            setLoading(false);
        }
    };

    const handleTestConnection = async (id) => {
        setTestingId(id);
        setTestResults(prev => ({ ...prev, [id]: { status: 'testing' } }));
        try {
            const res = await routerosAPI.testConnection(id);
            setTestResults(prev => ({
                ...prev,
                [id]: {
                    status: res.data.status,
                    message: res.data.message
                }
            }));
        } catch (error) {
            setTestResults(prev => ({
                ...prev,
                [id]: {
                    status: 'error',
                    message: error.response?.data?.detail || "Connection failed"
                }
            }));
        } finally {
            setTestingId(null);
        }
    };

    if (loading) return <div>Loading devices...</div>;

    return (
        <div className="card">
            <h2>RouterOS Devices</h2>
            <div className="table-responsive">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>IP Address</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {devices.map(device => (
                            <tr key={device.id}>
                                <td>{device.name}</td>
                                <td>{device.ip_address}</td>
                                <td>
                                    {testResults[device.id] && (
                                        <span className={`status-badge ${testResults[device.id].status}`}>
                                            {testResults[device.id].status === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                            {testResults[device.id].status}
                                        </span>
                                    )}
                                </td>
                                <td>
                                    <button
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => handleTestConnection(device.id)}
                                        disabled={testingId === device.id}
                                    >
                                        {testingId === device.id ? <RefreshCw className="spin" size={16} /> : 'Test Connection'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RouterOSDeviceList;
