import { apiClient } from '../api';

export const routerosAPI = {
    // Devices
    testConnection: (deviceId) => apiClient.post(`/api/routeros/devices/${deviceId}/test_connection`),

    // Config
    executeConfig: (data) => apiClient.post('/api/routeros/config/execute', data),

    // Metrics
    getMetrics: (deviceId) => apiClient.get(`/api/routeros/metrics/resources/${deviceId}`),
};
