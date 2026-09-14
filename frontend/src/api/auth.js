import axiosInstance from './axiosInstance';

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
    // Useful to check if the user is logged in on mount
    refresh: async () => {
        const response = await axiosInstance.post('/auth/refresh');
        return response.data;
    }
};
