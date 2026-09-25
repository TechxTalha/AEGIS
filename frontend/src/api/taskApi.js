import axiosInstance from './axiosInstance';

export const taskApi = {
    createTask: async (taskData) => {
        const response = await axiosInstance.post('/tasks', taskData);
        return response.data;
    },

    getUserTasks: async () => {
        const response = await axiosInstance.get('/tasks');
        return response.data;
    },

    getTask: async (taskId) => {
        const response = await axiosInstance.get(`/tasks/${taskId}`);
        return response.data;
    },

    getTaskExecutions: async (taskId) => {
        const response = await axiosInstance.get(`/tasks/${taskId}/executions`);
        return response.data;
    },

    startTask: async (taskId) => {
        const response = await axiosInstance.post(`/tasks/${taskId}/start`);
        return response.data;
    },
    pauseTask: async (taskId) => {
        const response = await axiosInstance.post(`/tasks/${taskId}/pause`);
        return response.data;
    },
    resumeTask: async (taskId) => {
        const response = await axiosInstance.post(`/tasks/${taskId}/resume`);
        return response.data;
    },
    cancelTask: async (taskId) => {
        const response = await axiosInstance.post(`/tasks/${taskId}/cancel`);
        return response.data;
    },
    completeTask: async (taskId) => {
        const response = await axiosInstance.post(`/tasks/${taskId}/complete`);
        return response.data;
    },
    failTask: async (taskId, reason) => {
        const response = await axiosInstance.post(`/tasks/${taskId}/fail`, { reason });
        return response.data;
    }
};
