import React, { useState } from 'react';
import RouterOSDeviceList from '../../components/RouterOS/DeviceList';
import MetricsView from '../../components/RouterOS/MetricsView';
import ConfigHistory from '../../components/RouterOS/ConfigHistory';
import ConfigExecutor from '../../components/RouterOS/ConfigExecutor';
import './RouterOS.css'; // New styles for tabs

const RouterOSPage = () => {
    const [activeTab, setActiveTab] = useState('monitoring');

    return (
        <div className="page-container">
            <header className="page-header">
                <h1 className="page-title">RouterOS Management</h1>
            </header>

            {/* Top Section: Always Visible */}
            <div style={{ marginBottom: '2rem' }}>
                <RouterOSDeviceList />
            </div>

            {/* Tab Navigation */}
            <div className="tabs-container">
                <div className="tabs-header">
                    <button
                        className={`tab-btn ${activeTab === 'monitoring' ? 'active' : ''}`}
                        onClick={() => setActiveTab('monitoring')}
                    >
                        Monitoring
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'configuration' ? 'active' : ''}`}
                        onClick={() => setActiveTab('configuration')}
                    >
                        Configuration
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        History
                    </button>
                </div>

                <div className="tab-content">
                    {activeTab === 'monitoring' && (
                        <div className="fade-in">
                            <MetricsView />
                        </div>
                    )}

                    {activeTab === 'configuration' && (
                        <div className="fade-in">
                            <ConfigExecutor />
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="fade-in">
                            <ConfigHistory />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RouterOSPage;
