import React, { useState } from 'react';
import ConfigExecutor from '../../components/RouterOS/ConfigExecutor';
import RouterOSDeviceList from '../../components/RouterOS/DeviceList';
import { Server, FileCode } from 'lucide-react';
import './RouterOS.css';

const RouterOSPage = () => {
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', label: 'Device Status', icon: Server },
        { id: 'templates', label: 'Templates', icon: FileCode },
    ];

    return (
        <div className="page-container">
            <header className="page-header">
                <div>
                    <h1 className="page-title">Configurations</h1>
                    <p className="page-subtitle">Unified command center for MikroTik devices</p>
                </div>
            </header>

            {/* Tab Navigation */}
            <div className="tabs-container">
                <div className="tabs-header">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="tab-content" style={{ marginTop: '2rem' }}>
                    {activeTab === 'overview' && (
                        <div className="fade-in">
                            <RouterOSDeviceList />
                        </div>
                    )}

                    {activeTab === 'templates' && (
                        <div className="fade-in">
                            <ConfigExecutor />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RouterOSPage;
