import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const uploadTransactions = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/api/transactions/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const getDashboardAnalytics = async () => {
    const response = await apiClient.get('/api/analytics/dashboard');
    return response.data;
};

export const getInsights = async () => {
    const response = await apiClient.get('/api/analytics/insights');
    return response.data;
};
