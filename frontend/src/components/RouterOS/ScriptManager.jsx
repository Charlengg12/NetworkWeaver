import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { Play, FileText, Server, CheckCircle, AlertTriangle } from 'lucide-react';

const ScriptManager = () => {
    const [devices, setDevices] = useState([]);
    const [scripts, setScripts] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [selectedScript, setSelectedScript] = useState(null);
    const [executionLog, setExecutionLog] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchDevices();
        fetchScripts();
    }, []);

    const fetchDevices = async () => {
        try {
            const res = await apiClient.get('/devices/');
            setDevices(res.data);
            // Optional: Auto-select if only one
            if (res.data.length === 1) setSelectedDevice(res.data[0]);
        } catch (err) {
            console.error("Failed to load devices", err);
        }
    };

    const fetchScripts = async () => {
        try {
            const res = await apiClient.get('/routeros/scripts/');
            setScripts(res.data);
        } catch (err) {
            console.error("Failed to load scripts", err);
            setScripts([
                { name: 'health_check.rsc', description: 'Health Check', content: '...' },
                { name: 'auto_backup.rsc', description: 'Auto Backup', content: '...' }
            ]);
        }
    };

    const handleRun = async () => {
        if (!selectedDevice || !selectedScript) return;
        setLoading(true);
        try {
            // Backend mounted as /routeros/scripts
            const res = await apiClient.post(`/routeros/scripts/execute/${selectedDevice.id}?script_name=${selectedScript.name}`);
            setExecutionLog(prev => [{
                time: new Date().toLocaleTimeString(),
                device: selectedDevice.name,
                script: selectedScript.name,
                status: 'Success',
                details: res.data.message
            }, ...prev]);
        } catch (err) {
            setExecutionLog(prev => [{
                time: new Date().toLocaleTimeString(),
                device: selectedDevice.name,
                script: selectedScript.name,
                status: 'Error',
                details: err.response?.data?.detail || err.message
            }, ...prev]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="content-grid" style={{ padding: 0, gap: '1rem' }}>
            {/* Selection Panel - Now using Dropsowns */}
            <div className="card" style={{ gridColumn: '1 / -1', height: 'auto', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>

                {/* Device Selector */}
                <div style={{ flex: 1, minWidth: '300px' }}>
                    <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Server size={18} /> Select Device
                    </h3>
                    <select
                        className="input-field"
                        value={selectedDevice ? selectedDevice.id : ''}
                        onChange={(e) => {
                            const dev = devices.find(d => d.id === parseInt(e.target.value));
                            setSelectedDevice(dev || null);
                        }}
                        style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}
                    >
                        <option value="" disabled>-- Choose a Device --</option>
                        {devices.map(dev => (
                            <option key={dev.id} value={dev.id}>
                                {dev.name} ({dev.ip_address})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Script Selector */}
                <div style={{ flex: 1, minWidth: '300px' }}>
                    <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={18} /> Select Script
                    </h3>
                    <select
                        className="input-field"
                        value={selectedScript ? selectedScript.name : ''}
                        onChange={(e) => {
                            const scr = scripts.find(s => s.name === e.target.value);
                            setSelectedScript(scr || null);
                        }}
                        style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}
                    >
                        <option value="" disabled>-- Choose a Script --</option>
                        {scripts.map(script => (
                            <option key={script.name} value={script.name}>
                                {script.description || script.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Action Panel */}
            <div className="card" style={{ gridColumn: '1 / -1', height: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Execution</h3>
                        <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            Ready to execute <b>{selectedScript ? selectedScript.name : '...'}</b> on <b>{selectedDevice ? selectedDevice.name : '...'}</b>
                        </p>
                    </div>
                    <button
                        className="btn-primary"
                        disabled={!selectedDevice || !selectedScript || loading}
                        onClick={handleRun}
                        style={{ fontSize: '1rem', padding: '0.75rem 1.5rem', minWidth: '150px' }}
                    >
                        {loading ? 'Running...' : <><Play size={18} /> Run Script</>}
                    </button>
                </div>
            </div>

            {/* Logs */}
            <div className="card" style={{ gridColumn: '1 / -1', height: 'auto' }}>
                <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem' }}>Execution Log</h3>
                <table className="table">
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Device</th>
                            <th>Script</th>
                            <th>Status</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {executionLog.map((log, i) => (
                            <tr key={i}>
                                <td>{log.time}</td>
                                <td>{log.device}</td>
                                <td>{log.script}</td>
                                <td>
                                    {log.status === 'Success' ?
                                        <span style={{ color: 'var(--success)', display: 'flex', gap: '5px', alignItems: 'center' }}><CheckCircle size={14} /> Success</span> :
                                        <span style={{ color: 'var(--danger)', display: 'flex', gap: '5px', alignItems: 'center' }}><AlertTriangle size={14} /> Error</span>
                                    }
                                </td>
                                <td>{log.details}</td>
                            </tr>
                        ))}
                        {executionLog.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No execution history yet</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ScriptManager;
