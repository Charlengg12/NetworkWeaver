import React, { useState, useEffect } from 'react';
import { routerosAPI } from '../../services/routeros/api';
import { apiClient } from '../../services/api';

const MetricsView = () => {
    const [devices, setDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState('');
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Load devices for dropdown
        apiClient.get('/devices/').then(res => setDevices(res.data));
    }, []);

    const fetchMetrics = async () => {
        if (!selectedDevice) return;
        setLoading(true);
        setError(null);
        try {
            const res = await routerosAPI.getMetrics(selectedDevice);
            setMetrics(res.data);
        } catch (err) {
            setError("Failed to fetch metrics: " + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <h2>Live Resource Usage</h2>
            <div className="form-group" style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
                <select
                    value={selectedDevice}
                    onChange={e => setSelectedDevice(e.target.value)}
                    className="form-control"
                    style={{ maxWidth: '300px' }}
                >
                    <option value="">Select a Device...</option>
                    {devices.map(d => <option key={d.id} value={d.id}>{d.name} ({d.ip_address})</option>)}
                </select>
                <button className="btn btn-primary" onClick={fetchMetrics} disabled={!selectedDevice || loading}>
                    {loading ? 'Fetching...' : 'Get Metrics'}
                </button>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            {metrics && (
                <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div className="metric-box" style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
                        <h4>CPU Load</h4>
                        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{metrics['cpu-load']}%</div>
                    </div>
                    <div className="metric-box" style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
                        <h4>Uptime</h4>
                        <div style={{ fontSize: '18px' }}>{metrics['uptime']}</div>
                    </div>
                    <div className="metric-box" style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
                        <h4>Free Memory</h4>
                        <div style={{ fontSize: '18px' }}>{Math.round(metrics['free-memory'] / 1024 / 1024)} MB</div>
                    </div>
                    <div className="metric-box" style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
                        <h4>Version</h4>
                        <div style={{ fontSize: '18px' }}>{metrics['version']}</div>
                    </div>
                </div>
            )}

            <div style={{ marginTop: '2rem' }}>
                <h3>Traffic & Resources</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                        <iframe
                            src="http://localhost:3001/d-solo/your-dashboard-uid/routeros-metrics?orgId=1&panelId=1"
                            width="100%"
                            height="300"
                            frameBorder="0"
                            title="Interface Traffic"
                        ></iframe>
                    </div>
                    <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                        <iframe
                            src="http://localhost:3001/d-solo/your-dashboard-uid/routeros-metrics?orgId=1&panelId=2"
                            width="100%"
                            height="300"
                            frameBorder="0"
                            title="CPU & Memory"
                        ></iframe>
                    </div>
                </div>
                <small className="text-muted">Note: Ensure Grafana dashboards are creating and Allow Embedding is enabled.</small>
            </div>
        </div>
    );
};

export default MetricsView;
