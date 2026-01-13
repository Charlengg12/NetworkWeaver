import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

const ConfigHistory = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
        const interval = setInterval(fetchHistory, 5000); // Auto-refresh
        return () => clearInterval(interval);
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await apiClient.get('/config/history');
            setLogs(res.data);
        } catch (error) {
            console.error("Failed to fetch history", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <div className="card-header">
                <Clock size={20} />
                <h3>Configuration History</h3>
            </div>

            {loading && logs.length === 0 ? (
                <p>Loading history...</p>
            ) : (
                <div className="table-responsive">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Action</th>
                                <th>Status</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.log_id}>
                                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                                    <td>{log.action_type}</td>
                                    <td>
                                        {log.status === 'Success' ? (
                                            <span className="status-badge success"><CheckCircle size={14} /> Success</span>
                                        ) : (
                                            <span className="status-badge error"><XCircle size={14} /> {log.status}</span>
                                        )}
                                    </td>
                                    <td className="text-small">{log.details}</td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center' }}>No logs found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ConfigHistory;
