import axiosInstance from './axiosInstance';

export const taskApi = {
    createTask: async (taskData) => {
        const response = await axiosInstance.post('/api/tasks', taskData);
        return response.data;
    },

    getUserTasks: async () => {
        const response = await axiosInstance.get('/api/tasks');
        return response.data;
    },

    getTask: async (taskId) => {
        const response = await axiosInstance.get(`/api/tasks/${taskId}`);
        return response.data;
    },

    getTaskExecutions: async (taskId) => {
        const response = await axiosInstance.get(`/api/tasks/${taskId}/executions`);
        return response.data;
    },

    startTask: async (taskId) => {
        await axiosInstance.post(`/api/tasks/${taskId}/start`);
    },

    pauseTask: async (taskId) => {
        await axiosInstance.post(`/api/tasks/${taskId}/pause`);
    },

    resumeTask: async (taskId) => {
        await axiosInstance.post(`/api/tasks/${taskId}/resume`);
    },

    cancelTask: async (taskId) => {
        await axiosInstance.post(`/api/tasks/${taskId}/cancel`);
    },

    completeTask: async (taskId) => {
        await axiosInstance.post(`/api/tasks/${taskId}/complete`);
    },

    failTask: async (taskId, reason) => {
        await axiosInstance.post(`/api/tasks/${taskId}/fail`, null, { params: { reason } });
    }
};
