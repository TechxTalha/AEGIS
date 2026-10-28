import axiosInstance from './axiosInstance';
import { getRefreshToken } from '../utils/tokenStorage';

export const authApi = {
    login: async (credentials) => {
        const response = await axiosInstance.post('/auth/login', credentials);
        return response.data;
    },
    register: async (data) => {
        const response = await axiosInstance.post('/auth/register', data);
        return response.data;
    },
    logout: async () => {
        const response = await axiosInstance.post('/auth/logout');
        return response.data;
    },
    refresh: async (token) => {
        const storedRefreshToken = token || getRefreshToken();
        const response = await axiosInstance.post('/auth/refresh',
            storedRefreshToken ? { refreshToken: storedRefreshToken } : {},
            storedRefreshToken ? { headers: { 'X-Refresh-Token': storedRefreshToken } } : {}
        );
        return response.data;
    }
};
