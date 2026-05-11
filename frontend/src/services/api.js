import axios from 'axios';
import { supabase } from './supabase';

// In development, we use the Vite proxy defined in astro.config.mjs
// In production, we use relative paths if hosted together.
const API_BASE_URL = import.meta.env.DEV ? '' : (import.meta.env.PUBLIC_API_URL || '');

const apiClient = axios.create({
    baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use(async (config) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            config.headers.Authorization = `Bearer ${session.access_token}`;
        }
    } catch (e) {
        console.error('AUTH_INTERCEPTOR_ERROR:', e);
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
