import React, { useState, useEffect } from 'react';
import { Terminal, Filter, RefreshCw, Download, Trash2 } from 'lucide-react';
import { apiClient } from '../services/api';
import './Logs.css';

const Logs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Simulated logs for now - will be replaced with actual API
    // Fetch logs from backend API
    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/logs/');
            setLogs(res.data);
        } catch (err) {
            console.error("Failed to fetch logs:", err);
            // On error, just show empty list or handle gracefully, DO NOT fallback to fake data
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 30000);
        return () => clearInterval(interval);
    }, []);

    const filteredLogs = logs.filter(log => {
        const matchesFilter = filter === 'all' || log.level === filter;
        const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.device.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.action.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const getLevelClass = (level) => {
        switch (level) {
            case 'success': return 'log-success';
            case 'warning': return 'log-warning';
            case 'error': return 'log-error';
            default: return 'log-info';
        }
    };

    const getLevelIcon = (level) => {
        switch (level) {
            case 'success': return '✓';
            case 'warning': return '⚠';
            case 'error': return '✕';
            default: return 'ℹ';
        }
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString() + ' ' + date.toLocaleDateString();
    };

    const clearLogs = () => {
        if (window.confirm('Clear all logs?')) {
            setLogs([]);
        }
    };

    const exportLogs = () => {
        const logText = filteredLogs.map(log =>
            `[${log.level.toUpperCase()}] ${formatTime(log.timestamp)} | ${log.device} | ${log.action}: ${log.message}`
        ).join('\n');

        const blob = new Blob([logText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `networkweaver-logs-${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
    };

    return (
        <div className="page-container logs-page">
            <header className="page-header">
                <div>
                    <h1 className="page-title">Activity Logs</h1>
                    <p className="page-subtitle">Monitor configuration changes and system events</p>
                </div>
                <div className="header-actions">
                    <button className="btn-secondary" onClick={fetchLogs} disabled={loading}>
                        <RefreshCw size={16} className={loading ? 'spin' : ''} />
                        Refresh
                    </button>
                    <button className="btn-secondary" onClick={exportLogs}>
                        <Download size={16} />
                        Export
                    </button>
                    <button className="btn-secondary danger" onClick={clearLogs}>
                        <Trash2 size={16} />
                        Clear
                    </button>
                </div>
            </header>

            <div className="logs-toolbar">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Search logs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field"
                    />
                </div>
                <div className="filter-group">
                    <Filter size={14} />
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="input-field"
                    >
                        <option value="all">All Levels</option>
                        <option value="info">Info</option>
                        <option value="success">Success</option>
                        <option value="warning">Warning</option>
                        <option value="error">Error</option>
                    </select>
                </div>
            </div>

            <div className="logs-container card">
                <div className="logs-header">
                    <Terminal size={16} />
                    <span>System Logs</span>
                    <span className="log-count">{filteredLogs.length} entries</span>
                </div>

                <div className="logs-content">
                    {loading ? (
                        <div className="logs-loading">
                            <RefreshCw className="spin" size={24} />
                            <span>Loading logs...</span>
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="logs-empty">
                            <Terminal size={32} />
                            <span>No logs found</span>
                        </div>
                    ) : (
                        <table className="logs-table">
                            <thead>
                                <tr>
                                    <th>Level</th>
                                    <th>Timestamp</th>
                                    <th>Device</th>
                                    <th>Action</th>
                                    <th>Message</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.map(log => (
                                    <tr key={log.id} className={getLevelClass(log.level)}>
                                        <td className="level-cell">
                                            <span className={`level-badge ${log.level}`}>
                                                {getLevelIcon(log.level)} {log.level}
                                            </span>
                                        </td>
                                        <td className="time-cell">{formatTime(log.timestamp)}</td>
                                        <td className="device-cell">{log.device}</td>
                                        <td className="action-cell">{log.action}</td>
                                        <td className="message-cell">{log.message}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Logs;
