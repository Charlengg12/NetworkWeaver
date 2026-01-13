import { apiClient } from '../api';

export const routerosAPI = {
    // Devices
    testConnection: (deviceId) => apiClient.post(`/routeros/devices/${deviceId}/test_connection`),

    // Config
    executeConfig: (data) => apiClient.post('/routeros/config/execute', data),

    // Metrics
    getMetrics: (deviceId) => apiClient.get(`/routeros/metrics/resources/${deviceId}`),
};
