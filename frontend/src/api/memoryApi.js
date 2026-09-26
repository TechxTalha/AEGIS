import axiosInstance from './axiosInstance';

export const memoryApi = {
    createMemory: async (category, content) => {
        const response = await axiosInstance.post('/memory/long-term', { category, content });
        return response.data;
    },

    getAllMemories: async () => {
        const response = await axiosInstance.get('/memory/long-term');
        return response.data;
    },

    searchMemories: async (query) => {
        const response = await axiosInstance.get(`/memory/long-term/search?query=${encodeURIComponent(query)}`);
        return response.data;
    },

    deleteMemory: async (id) => {
        const response = await axiosInstance.delete(`/memory/long-term/${id}`);
        return response.data;
    }
};
