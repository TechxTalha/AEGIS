import axiosInstance from './axiosInstance';

export const agentApi = {
    getLiveAgents: async () => {
        try {
            const response = await axiosInstance.get('/api/agents');
            return response.data;
        } catch (error) {
            console.error('Failed to fetch live agents:', error);
            throw error;
        }
    }
};
