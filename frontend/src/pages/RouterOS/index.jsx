import React from 'react';
import RouterOSDeviceList from '../../components/RouterOS/DeviceList';
import MetricsView from '../../components/RouterOS/MetricsView';
import ConfigExecutor from '../../components/RouterOS/ConfigExecutor';

const RouterOSPage = () => {
    return (
        <div className="page-container">
            <header className="page-header">
                <h1 className="page-title">RouterOS Management</h1>
            </header>

            <div className="content-grid">
                <div style={{ gridColumn: '1 / -1' }}>
                    <RouterOSDeviceList />
                </div>
                <div style={{ gridColumn: '1 / 2' }}>
                    <MetricsView />
                </div>
                <div style={{ gridColumn: '2 / -1' }}>
                    <ConfigExecutor />
                </div>
            </div>
        </div>
    );
};

export default RouterOSPage;
