import React, { useState } from 'react';
import ConfigHistory from '../../components/RouterOS/ConfigHistory';
import ConfigExecutor from '../../components/RouterOS/ConfigExecutor';
import RouterOSDeviceList from '../../components/RouterOS/DeviceList';
import ScriptManager from '../../components/RouterOS/ScriptManager';
import { LayoutGrid, Terminal, FileText, History, Server } from 'lucide-react';
import './RouterOS.css';

const RouterOSPage = () => {
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', label: 'Device Status', icon: Server },
        { id: 'configuration', label: 'Config Executor', icon: Terminal },
        { id: 'scripts', label: 'Script Manager', icon: FileText },
        { id: 'history', label: 'History', icon: History },
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

                    {activeTab === 'configuration' && (
                        <div className="fade-in">
                            <ConfigExecutor />
                        </div>
                    )}

                    {activeTab === 'scripts' && (
                        <div className="fade-in">
                            <ScriptManager />
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
