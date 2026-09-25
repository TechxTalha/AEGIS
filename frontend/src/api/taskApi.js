export const taskApi = {
    createTask: async (taskData) => {
        return { id: 'mock-id-123', ...taskData, status: 'CREATED', createdAt: new Date().toISOString() };
    },

    getUserTasks: async () => {
        return [
            { id: 'task-1', title: 'Deploy application to prod', status: 'EXECUTING', priority: 'HIGH', createdAt: new Date(Date.now() - 3600000).toISOString() },
            { id: 'task-2', title: 'sys.execute requires approval', status: 'WAITING', priority: 'NORMAL', createdAt: new Date(Date.now() - 7200000).toISOString() },
            { id: 'task-3', title: 'Research "Agent Patterns"', status: 'COMPLETED', priority: 'LOW', createdAt: new Date(Date.now() - 86400000).toISOString() }
        ];
    },

    getTask: async (taskId) => {
        return {
            id: taskId,
            title: 'Mocked Task ' + taskId,
            description: 'This is a mocked task for UI testing without the backend.',
            status: 'EXECUTING',
            priority: 'HIGH',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    },

    getTaskExecutions: async (taskId) => {
        return [
            {
                id: 'exec-1',
                events: [
                    { eventType: 'STARTED', details: 'Task execution started', timestamp: new Date().toISOString() }
                ]
            }
        ];
    },

    startTask: async (taskId) => { },
    pauseTask: async (taskId) => { },
    resumeTask: async (taskId) => { },
    cancelTask: async (taskId) => { },
    completeTask: async (taskId) => { },
    failTask: async (taskId, reason) => { }
};
