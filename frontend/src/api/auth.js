import axiosInstance from './axiosInstance';

export const authApi = {
    login: async (credentials) => {
        // Mock login for UI testing without backend
        if (credentials.username === 'admin' && credentials.password === 'admin') {
            return { accessToken: 'mock-jwt-token' };
        }
        throw new Error('Invalid credentials');
    },
    register: async (data) => {
        return { success: true };
    },
    logout: async () => {
        return { success: true };
    },
    // Useful to check if the user is logged in on mount
    refresh: async () => {
        // Fail refresh to force login screen
        throw new Error('Token expired');
    }
};
