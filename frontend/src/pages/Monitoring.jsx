import React from 'react';

const Monitoring = () => {
    // Kiosk mode URL for cleaner look
    const GRAFANA_URL = "http://localhost:3000/d/mikrotik-exporter/mikrotik-monitoring?orgId=1&kiosk";

    return (
        <div style={{ width: '100%', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
            <iframe
                src={GRAFANA_URL}
                width="100%"
                height="100%"
                frameBorder="0"
                title="MikroTik Dashboard"
                style={{ display: 'block' }}
            ></iframe>
        </div>
    );
};

export default Monitoring;
