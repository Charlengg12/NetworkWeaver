import React, { useState, useEffect } from 'react';
import { routerosAPI } from '../../services/routeros/api';
import { apiClient } from '../../services/api';
import { Terminal, Play, RotateCcw, Box, Hash, ChevronRight, Zap } from 'lucide-react';

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
        const abortController = new AbortController();

        apiClient.get('/devices/', { signal: abortController.signal })
            .then(res => setDevices(res.data))
            .catch(err => {
                // Ignore abort errors
                if (err.name === 'AbortError' || err.name === 'CanceledError') {
                    return;
                }
                console.error("Failed to fetch devices", err);
            });

        return () => {
            abortController.abort();
        };
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
        <div className="config-executor-container fade-in">
            <header style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.25rem' }}>Configuration Studio</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Deploy scripts and manage device configurations</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}>
                <div className="controls-section">
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <form onSubmit={handleExecute}>
                            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                                    <Box size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Target Device
                                </label>
                                <select
                                    className="input-field"
                                    value={selectedDevice}
                                    onChange={e => setSelectedDevice(e.target.value)}
                                    required
                                >
                                    <option value="">Select Device...</option>
                                    {devices.map(d => <option key={d.id} value={d.id}>{d.name} ({d.ip_address})</option>)}
                                </select>
                            </div>

                            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                                    <Hash size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Template
                                </label>
                                <select
                                    className="input-field"
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
                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                                        <ChevronRight size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Command / Script
                                    </label>
                                    <textarea
                                        className="input-field"
                                        value={command}
                                        onChange={e => setCommand(e.target.value)}
                                        placeholder="/system/identity/print"
                                        rows="3"
                                        style={{ fontFamily: 'monospace', resize: 'vertical' }}
                                    />
                                </div>
                            ) : (
                                <div className="template-fields" style={{ marginBottom: '1.5rem' }}>
                                    {templates.find(t => t.id === template)?.fields.map(field => (
                                        <div className="form-group" key={field} style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>{field}</label>
                                            <input
                                                type="text"
                                                className="input-field"
                                                onChange={e => setParams(prev => ({ ...prev, [field]: e.target.value }))}
                                                required
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={loading || !selectedDevice}>
                                    {loading ? <Zap className="spin" size={18} /> : <Play size={18} />}
                                    {loading ? 'Deploying...' : 'Deploy Now'}
                                </button>
                                <button
                                    type="button"
                                    className="btn-text"
                                    style={{ padding: '0.6rem 1rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}
                                    onClick={() => setLogs(prev => `[Rollback] ${new Date().toLocaleTimeString()}: Manual rollback initiated\n${prev}`)}
                                    disabled={loading || !selectedDevice}
                                >
                                    <RotateCcw size={16} /> Rollback
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="log-section">
                    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                        <header style={{ padding: '0.75rem 1.25rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Terminal size={16} color="var(--text-secondary)" />
                            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Execution Log</span>
                        </header>
                        <div style={{ flex: 1, padding: '1.25rem', background: '#000', fontFamily: '"Fira Code", "SauceCodePro Nerd Font", monospace', fontSize: '0.85rem', color: '#a1a1aa', overflowY: 'auto' }}>
                            {logs ? (
                                logs.split('\n').map((line, i) => (
                                    <div key={i} style={{ marginBottom: '0.25rem', display: 'flex', gap: '0.5rem' }}>
                                        <span style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>{i + 1}</span>
                                        <span style={{ color: line.includes('[Success]') ? '#10b981' : line.includes('[Error]') ? '#ef4444' : line.includes('[Rollback]') ? '#f59e0b' : 'inherit' }}>
                                            {line}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div style={{ opacity: 0.3, fontStyle: 'italic' }}>Shell initialized. Waiting for commands...</div>
                            )}
                        </div>
                        <footer style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--glass-border)', textAlign: 'right' }}>
                            <button onClick={() => setLogs('')} style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', opacity: 0.7 }}>Clear Console</button>
                        </footer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfigExecutor;
