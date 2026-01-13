import React, { useState } from 'react';
import { apiClient } from '../services/api';
import { Shield, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import './Security.css';

const Security = () => {
    const [targetUrl, setTargetUrl] = useState('');
    const [deviceId, setDeviceId] = useState(1); // Default to device 1 for demo
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);

    const handleDeploy = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', message: '' });

        try {
            const response = await apiClient.post('/config/deploy', {
                device_id: deviceId,
                template_name: "block_website",
                params: { url: targetUrl }
            });

            setStatus({ type: 'success', message: response.data.message });
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.detail || "Connection failed";
            setStatus({ type: 'error', message: msg });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <h1 className="page-title">Security Policies</h1>
                <p className="page-subtitle">Manage firewall rules and access control lists</p>
            </header>

            <div className="content-grid">
                <div className="card config-card">
                    <div className="card-header">
                        <Shield size={24} className="card-icon" />
                        <h2>Block Website Access</h2>
                    </div>

                    <form onSubmit={handleDeploy} className="config-form">
                        <div className="form-group">
                            <label>Router ID</label>
                            <select
                                className="input-field"
                                value={deviceId}
                                onChange={(e) => setDeviceId(parseInt(e.target.value))}
                            >
                                <option value={1}>Lab-Router-1-Main</option>
                                <option value={2}>Lab-Router-2-Branch</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Target Website (URL)</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="e.g., facebook.com"
                                value={targetUrl}
                                onChange={(e) => setTargetUrl(e.target.value)}
                                required
                            />
                            <p className="hint">Uses Layer 7 Protocol Regex to block traffic.</p>
                        </div>

                        <button type="submit" className="btn-primary deploy-btn" disabled={loading}>
                            {loading ? (
                                <>
                                    <RefreshCw size={18} className="spin" /> Deploying...
                                </>
                            ) : (
                                'Apply Policy'
                            )}
                        </button>
                    </form>

                    {status.message && (
                        <div className={`status-message ${status.type}`}>
                            {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                            <span>{status.message}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Security;
