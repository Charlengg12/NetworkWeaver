import React, { useState, useEffect } from 'react';
import { routerosAPI } from '../../services/routeros/api';
import { apiClient } from '../../services/api';
import { Terminal, Play, RotateCcw, Box, Hash, ChevronRight, Zap, RefreshCw } from 'lucide-react';

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
                if (err.name === 'AbortError' || err.name === 'CanceledError') return;
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
            // Use /config/deploy endpoint for all templates
            const res = await apiClient.post('/config/deploy', {
                device_id: parseInt(selectedDevice),
                template_name: template,
                params: template === 'custom' ? { command: command } : params
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
        { id: 'bandwidth_limit', name: 'Bandwidth Limit', fields: ['Target IP', 'Max Upload', 'Max Download'] },
        { id: 'guest_network', name: 'Guest Network', fields: ['SSID', 'Gateway IP', 'DHCP Range'] },
        { id: 'port_forwarding', name: 'Port Forwarding', fields: ['Protocol', 'External Port', 'Internal IP', 'Internal Port'] },
        { id: 'block_website', name: 'Block Website', fields: ['URL'] },
        { id: 'vpn_setup', name: 'VPN Setup (PPTP)', fields: ['Username', 'Password'] },
        { id: 'mac_filtering', name: 'MAC Filtering', fields: ['MAC Address', 'Action'] },
        { id: 'auto_backup', name: 'Auto-Backup', fields: ['Backup Name'] },
        { id: 'custom', name: 'Custom Command', fields: [] }
    ];

    return (
        <div className="config-executor-container fade-in">
            <header className="page-header" style={{ border: 'none', paddingBottom: 0 }}>
                <h2 className="section-title">Configuration Studio</h2>
                <p className="page-subtitle">Deploy scripts and manage device configurations</p>
            </header>

            <div className="executor-grid">
                <div className="controls-section">
                    <div className="card">
                        <form onSubmit={handleExecute}>
                            <div className="form-group">
                                <label className="input-label">
                                    <Box size={14} /> Target Device
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

                            <div className="form-group">
                                <label className="input-label">
                                    <Hash size={14} /> Template
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
                                <div className="form-group">
                                    <label className="input-label">
                                        <ChevronRight size={14} /> Command / Script
                                    </label>
                                    <textarea
                                        className="input-field"
                                        value={command}
                                        onChange={e => setCommand(e.target.value)}
                                        placeholder="/system/identity/print"
                                        rows="5"
                                        style={{ fontFamily: 'var(--font-mono)' }}
                                    />
                                </div>
                            ) : (
                                <div className="template-fields">
                                    {templates.find(t => t.id === template)?.fields.map(field => (
                                        <div className="form-group" key={field}>
                                            <label className="input-label">{field}</label>
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

                            <div className="action-row">
                                <button type="submit" className="btn-primary" disabled={loading || !selectedDevice}>
                                    {loading ? <RefreshCw className="spin" size={18} /> : <Play size={18} />}
                                    {loading ? 'Executing...' : 'Run Configuration'}
                                </button>
                                <button
                                    type="button"
                                    className="btn-secondary rollback-btn"
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
                    <div className="card log-card">
                        <header className="log-header">
                            <Terminal size={16} />
                            <span>Execution Log</span>
                        </header>
                        <div className="log-content">
                            {logs ? (
                                logs.split('\n').map((line, i) => (
                                    <div key={i} className="log-line">
                                        <span className="line-num">{i + 1}</span>
                                        <span className={
                                            line.includes('[Success]') ? 'text-success' :
                                                line.includes('[Error]') ? 'text-danger' :
                                                    line.includes('[Rollback]') ? 'text-warning' : ''
                                        }>
                                            {line}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="log-empty">Shell ready. Waiting for input...</div>
                            )}
                        </div>
                        <footer className="log-footer">
                            <button onClick={() => setLogs('')}>Clear</button>
                        </footer>
                    </div>
                </div>
            </div>

            <style>{`
                .executor-grid {
                    display: grid;
                    grid-template-columns: 1fr 1.5fr;
                    gap: 2rem;
                }
                .section-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin-bottom: 0.25rem;
                    color: var(--text-primary);
                }
                .form-group {
                    margin-bottom: 1.25rem;
                }
                .input-label {
                    display: block;
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 0.5rem;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .action-row {
                    display: flex;
                    gap: 1rem;
                    margin-top: 1.5rem;
                }
                .btn-primary { flex: 1; justify-content: center; }
                .rollback-btn {
                    color: var(--danger);
                    border-color: rgba(239, 68, 68, 0.2);
                    background: rgba(239, 68, 68, 0.05);
                }
                .rollback-btn:hover {
                    background: rgba(239, 68, 68, 0.1);
                    border-color: var(--danger);
                }
                
                /* Log Terminal */
                .log-card {
                    padding: 0;
                    overflow: hidden;
                    height: 100%;
                    max-height: 600px;
                    display: flex;
                    flex-direction: column;
                    background: #111; /* Darker than card */
                    border-color: var(--border-color);
                }
                .log-header {
                    padding: 0.75rem 1.25rem;
                    border-bottom: 1px solid var(--border-color);
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: rgba(255,255,255,0.02);
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: var(--text-muted);
                    text-transform: uppercase;
                }
                .log-content {
                    flex: 1;
                    padding: 1rem;
                    font-family: var(--font-mono);
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                    overflow-y: auto;
                }
                .log-line {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 0.25rem;
                    line-height: 1.4;
                }
                .line-num {
                    color: var(--text-muted);
                    opacity: 0.3;
                    user-select: none;
                    min-width: 20px;
                    text-align: right;
                }
                .log-empty {
                    opacity: 0.3;
                    font-style: italic;
                    padding: 1rem;
                }
                .log-footer {
                    padding: 0.5rem 1rem;
                    border-top: 1px solid var(--border-color);
                    text-align: right;
                    background: rgba(255,255,255,0.02);
                }
                .log-footer button {
                    background: none;
                    border: none;
                    color: var(--text-muted);
                    font-size: 0.75rem;
                    cursor: pointer;
                }
                .log-footer button:hover {
                    color: var(--text-primary);
                }
                
                .text-success { color: var(--success); }
                .text-danger { color: var(--danger); }
                .text-warning { color: var(--warning); }
            `}</style>
        </div>
    );
};

export default ConfigExecutor;
