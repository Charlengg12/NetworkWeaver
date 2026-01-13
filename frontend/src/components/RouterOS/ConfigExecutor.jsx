import React, { useState, useEffect } from 'react';
import { routerosAPI } from '../../services/routeros/api';
import { apiClient } from '../../services/api';

const ConfigExecutor = () => {
    const [devices, setDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState('');
    const [command, setCommand] = useState('');
    const [logs, setLogs] = useState('');
    const [loading, setLoading] = useState(false);

    // New State for Templates
    const [template, setTemplate] = useState('custom');
    const [params, setParams] = useState({});

    useEffect(() => {
        apiClient.get('/devices/').then(res => setDevices(res.data));
    }, []);

    const handleExecute = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // "template_name" acts as the command for this mock
            // If template is custom, use command box. If template, use template name + params.
            const cmdToSend = template === 'custom' ? command : `[TEMPLATE: ${template}] Params: ${JSON.stringify(params)}`;

            const res = await routerosAPI.executeConfig({
                device_id: selectedDevice,
                template_name: cmdToSend,
                params: params
            });
            setLogs(prev => `[Success] ${new Date().toLocaleTimeString()}: ${res.data.message}\n${prev}`);
        } catch (error) {
            setLogs(prev => `[Error] ${new Date().toLocaleTimeString()}: ${error.response?.data?.detail || error.message}\n${prev}`);
        } finally {
            setLoading(false);
        }
    };

    const templates = [
        { id: 'basic_firewall', name: 'Basic Firewall Setup', fields: ['WAN Interface', 'LAN Interface'] },
        { id: 'bandwidth_limit', name: 'Bandwidth Limit', fields: ['Target IP', 'Max Upload'] },
        { id: 'custom', name: 'Custom Command', fields: [] }
    ];

    return (
        <div className="card">
            <h2>Configuration Executor</h2>
            <form onSubmit={handleExecute}>
                <div className="form-group">
                    <label>Target Device</label>
                    <select
                        className="form-control"
                        value={selectedDevice}
                        onChange={e => setSelectedDevice(e.target.value)}
                        required
                    >
                        <option value="">Select Device...</option>
                        {devices.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </div>

                <div className="form-group">
                    <label>Template Selector</label>
                    <select
                        className="form-control"
                        value={template}
                        onChange={e => {
                            setTemplate(e.target.value);
                            setParams({});
                        }}
                    >
                        {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>

                {template === 'custom' ? (
                    <div className="form-group">
                        <label>Command / Script</label>
                        <input
                            type="text"
                            className="form-control"
                            value={command}
                            onChange={e => setCommand(e.target.value)}
                            placeholder="e.g. /system/identity/print"
                        />
                    </div>
                ) : (
                    templates.find(t => t.id === template)?.fields.map(field => (
                        <div className="form-group" key={field}>
                            <label>{field}</label>
                            <input
                                type="text"
                                className="form-control"
                                onChange={e => setParams(prev => ({ ...prev, [field]: e.target.value }))}
                                required
                            />
                        </div>
                    ))
                )}

                <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                    <button type="submit" className="btn btn-warning" disabled={loading || !selectedDevice}>
                        {loading ? 'Deploying...' : 'Deploy'}
                    </button>
                    <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => setLogs(prev => `[Rollback] ${new Date().toLocaleTimeString()}: Rollback initiated (Mock)\n${prev}`)}
                        disabled={loading || !selectedDevice}
                    >
                        Rollback
                    </button>
                </div>
            </form>
            <div style={{ marginTop: '2rem' }}>
                <h3>Execution Log</h3>
                <pre style={{ background: '#333', color: '#0f0', padding: '1rem', borderRadius: '4px', minHeight: '100px' }}>
                    {logs || 'Ready to execute...'}
                </pre>
            </div>
        </div>
    );
};

export default ConfigExecutor;
