import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            // Server responded with a status code verification
            if (error.response.status === 401) {
                // Token expired or invalid
                localStorage.removeItem('token');
                // Optional: Redirect to login if not already there
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            } else if (error.response.status === 503) {
                console.error('Service Unavailable: Backend might be starting up.');
            }
        } else if (error.request) {
            // The request was made but no response was received
            console.error('Network Error: No response received from backend.');
        } else {
            console.error('Error setup:', error.message);
        }
        return Promise.reject(error);
    }
);
