import React, { useState, useEffect } from 'react';
import { Activity, Cpu, HardDrive, Clock, Server, RefreshCw } from 'lucide-react';
import { apiClient } from '../../services/api';
import './SystemMetrics.css';

const SystemMetrics = ({ deviceId }) => {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);

    const fetchMetrics = async () => {
        if (!deviceId) return;

        try {
            setLoading(true);
            const response = await apiClient.get(`/routeros/metrics/resources/${deviceId}`);
            setMetrics(response.data);
            setLastUpdate(new Date());
            setError(null);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to fetch metrics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMetrics();
        const interval = setInterval(fetchMetrics, 15000); // Poll every 15 seconds
        return () => clearInterval(interval);
    }, [deviceId]);

    const formatBytes = (bytes) => {
        if (!bytes) return '0 B';
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
    };

    const formatUptime = (uptime) => {
        if (!uptime) return 'N/A';
        // RouterOS returns uptime like "1d5h30m10s" or "5h30m10s"
        return uptime;
    };

    const calculatePercentage = (used, total) => {
        if (!used || !total) return 0;
        return Math.round((used / total) * 100);
    };

    if (!deviceId) {
        return (
            <div className="system-metrics-card">
                <p className="no-device">Select a device to view metrics</p>
            </div>
        );
    }

    if (loading && !metrics) {
        return (
            <div className="system-metrics-card">
                <div className="loading-spinner">Loading metrics...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="system-metrics-card error">
                <p className="error-message">{error}</p>
                <button onClick={fetchMetrics} className="btn-secondary">
                    <RefreshCw size={14} /> Retry
                </button>
            </div>
        );
    }

    const cpuLoad = metrics?.['cpu-load'] || 0;
    const totalMem = parseInt(metrics?.['total-memory']) || 0;
    const freeMem = parseInt(metrics?.['free-memory']) || 0;
    const usedMem = totalMem - freeMem;
    const memPercent = calculatePercentage(usedMem, totalMem);

    const totalHdd = parseInt(metrics?.['total-hdd-space']) || 0;
    const freeHdd = parseInt(metrics?.['free-hdd-space']) || 0;
    const usedHdd = totalHdd - freeHdd;
    const hddPercent = calculatePercentage(usedHdd, totalHdd);

    return (
        <div className="system-metrics-card">
            <div className="metrics-header">
                <h3><Server size={18} /> System Metrics (API)</h3>
                <button onClick={fetchMetrics} className="refresh-btn" disabled={loading}>
                    <RefreshCw size={14} className={loading ? 'spinning' : ''} />
                </button>
            </div>

            <div className="metrics-grid">
                {/* CPU Load */}
                <div className="metric-item">
                    <div className="metric-icon cpu">
                        <Cpu size={20} />
                    </div>
                    <div className="metric-info">
                        <span className="metric-label">CPU Load</span>
                        <span className="metric-value">{cpuLoad}%</span>
                    </div>
                    <div className="progress-bar">
                        <div
                            className={`progress-fill ${cpuLoad > 80 ? 'danger' : cpuLoad > 50 ? 'warning' : 'success'}`}
                            style={{ width: `${cpuLoad}%` }}
                        />
                    </div>
                </div>

                {/* Memory */}
                <div className="metric-item">
                    <div className="metric-icon memory">
                        <Activity size={20} />
                    </div>
                    <div className="metric-info">
                        <span className="metric-label">RAM</span>
                        <span className="metric-value">{formatBytes(usedMem)} / {formatBytes(totalMem)}</span>
                    </div>
                    <div className="progress-bar">
                        <div
                            className={`progress-fill ${memPercent > 80 ? 'danger' : memPercent > 50 ? 'warning' : 'success'}`}
                            style={{ width: `${memPercent}%` }}
                        />
                    </div>
                </div>

                {/* Disk */}
                <div className="metric-item">
                    <div className="metric-icon disk">
                        <HardDrive size={20} />
                    </div>
                    <div className="metric-info">
                        <span className="metric-label">Storage</span>
                        <span className="metric-value">{formatBytes(usedHdd)} / {formatBytes(totalHdd)}</span>
                    </div>
                    <div className="progress-bar">
                        <div
                            className={`progress-fill ${hddPercent > 80 ? 'danger' : hddPercent > 50 ? 'warning' : 'success'}`}
                            style={{ width: `${hddPercent}%` }}
                        />
                    </div>
                </div>

                {/* Uptime */}
                <div className="metric-item">
                    <div className="metric-icon uptime">
                        <Clock size={20} />
                    </div>
                    <div className="metric-info">
                        <span className="metric-label">Uptime</span>
                        <span className="metric-value">{formatUptime(metrics?.uptime)}</span>
                    </div>
                </div>
            </div>

            <div className="metrics-footer">
                <span className="device-info">
                    {metrics?.['board-name']} • {metrics?.version}
                </span>
                {lastUpdate && (
                    <span className="last-update">
                        Updated: {lastUpdate.toLocaleTimeString()}
                    </span>
                )}
            </div>
        </div>
    );
};

export default SystemMetrics;
