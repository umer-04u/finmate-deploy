import axios from 'axios';
import { supabase } from './supabase';

// For unified deployment, we want to use relative paths. 
// If VITE_API_URL is not set (which it shouldn't be for unified Render deploy), 
// axios will use the same domain the frontend is served from.
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
});

// Add a request interceptor to include the auth token
apiClient.interceptors.request.use(async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
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

export const clearTransactions = async () => {
    const response = await apiClient.delete('/api/transactions/');
    return response.data;
};

export const addManualTransaction = async (transaction) => {
    const response = await apiClient.post('/api/transactions/manual', transaction);
    return response.data;
};

export const updateTransactionCategory = async (transactionId, category) => {
    const response = await apiClient.patch(`/api/transactions/${transactionId}/category`, { category });
    return response.data;
};
