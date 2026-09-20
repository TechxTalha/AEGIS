import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Card, Button, Tag, Divider, notification, Space, Timeline, Spin } from 'antd';
import { ArrowLeftOutlined, PlayCircleOutlined, PauseCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, StepForwardOutlined, RetweetOutlined } from '@ant-design/icons';
import { taskApi } from '../../api/taskApi';
import { useTaskWebSocket } from './useTaskWebSocket';

const { Title, Text, Paragraph } = Typography;

const TaskDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [task, setTask] = useState(null);
    const [executions, setExecutions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState([]);

    const fetchTaskDetails = async () => {
        try {
            const [taskData, executionData] = await Promise.all([
                taskApi.getTask(id),
                taskApi.getTaskExecutions(id)
            ]);
            setTask(taskData);
            setExecutions(executionData);
            
            // Flatten events for the timeline
            if (executionData && executionData.length > 0) {
                setEvents(executionData[0].events || []);
            }
        } catch (error) {
            notification.error({ message: 'Failed to fetch task details', description: error.message });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTaskDetails();
    }, [id]);

    // Subscribe to WebSockets for live updates
    const { isConnected } = useTaskWebSocket(id, (eventDto) => {
        console.log('Received live event:', eventDto);
        notification.info({
            message: 'Live Event',
            description: `${eventDto.eventType}: ${eventDto.details}`
        });
        // Refetch to get the latest state of everything
        fetchTaskDetails();
    });

    const handleAction = async (action, actionFn) => {
        try {
            await actionFn(id);
            notification.success({ message: `Task ${action} successfully` });
            // Optimistically refetch, though websocket will also trigger it
            fetchTaskDetails();
        } catch (error) {
            notification.error({ message: `Failed to ${action} task`, description: error.response?.data?.message || error.message });
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Spin size="large" /></div>;
    }

    if (!task) {
        return <div>Task not found</div>;
    }

    const getStatusColor = (status) => {
        if (status === 'CREATED') return 'blue';
        if (status === 'EXECUTING') return 'processing';
        if (status === 'COMPLETED') return 'success';
        if (status === 'FAILED') return 'error';
        if (status === 'CANCELLED') return 'warning';
        return 'default';
    };

    return (
        <div className="animate-fade-in">
            <div className="mb-6">
                <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/tasks')} className="px-0 mb-4">
                    Back to Tasks
                </Button>
                <div className="flex justify-between items-start">
                    <div>
                        <Title level={2} className="!mt-0 !mb-2">{task.title}</Title>
                        <Space>
                            <Tag color={getStatusColor(task.status)} className="text-sm px-3 py-1">
                                {task.status}
                            </Tag>
                            <Tag className="text-sm px-3 py-1">
                                Priority: {task.priority}
                            </Tag>
                            {isConnected ? (
                                <Tag color="green">Live Updates Active</Tag>
                            ) : (
                                <Tag color="default">Disconnected</Tag>
                            )}
                        </Space>
                    </div>
                    <Space>
                        {task.status === 'CREATED' && (
                            <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => handleAction('started', taskApi.startTask)}>
                                Start Task
                            </Button>
                        )}
                        {task.status === 'EXECUTING' && (
                            <Button icon={<PauseCircleOutlined />} onClick={() => handleAction('paused', taskApi.pauseTask)}>
                                Pause
                            </Button>
                        )}
                        {(task.status === 'WAITING' || task.status === 'BLOCKED') && (
                            <Button type="primary" icon={<StepForwardOutlined />} onClick={() => handleAction('resumed', taskApi.resumeTask)}>
                                Resume
                            </Button>
                        )}
                        {['CREATED', 'EXECUTING', 'WAITING', 'BLOCKED'].includes(task.status) && (
                            <Button danger icon={<CloseCircleOutlined />} onClick={() => handleAction('cancelled', taskApi.cancelTask)}>
                                Cancel
                            </Button>
                        )}
                        {['EXECUTING'].includes(task.status) && (
                            <Button type="primary" className="bg-green-600 hover:bg-green-700" icon={<CheckCircleOutlined />} onClick={() => handleAction('completed', taskApi.completeTask)}>
                                Complete
                            </Button>
                        )}
                    </Space>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card title="Description" bordered={false} className="shadow-sm">
                        <Paragraph className="whitespace-pre-wrap text-gray-700">
                            {task.description || 'No description provided.'}
                        </Paragraph>
                    </Card>

                    <Card title="Recent Execution Events" bordered={false} className="shadow-sm">
                        {events.length > 0 ? (
                            <Timeline
                                mode="left"
                                items={events.map(event => ({
                                    label: new Date(event.timestamp).toLocaleTimeString(),
                                    children: (
                                        <div>
                                            <Text strong>{event.eventType}</Text>
                                            <br />
                                            <Text type="secondary">{event.details}</Text>
                                        </div>
                                    ),
                                    color: event.eventType.includes('FAIL') ? 'red' : 'blue'
                                }))}
                            />
                        ) : (
                            <Text type="secondary">No events recorded yet.</Text>
                        )}
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card title="Task Details" bordered={false} className="shadow-sm">
                        <div className="space-y-4">
                            <div>
                                <Text type="secondary">Task ID</Text>
                                <div className="font-medium">{task.id}</div>
                            </div>
                            <div>
                                <Text type="secondary">Created At</Text>
                                <div className="font-medium">{new Date(task.createdAt).toLocaleString()}</div>
                            </div>
                            <div>
                                <Text type="secondary">Last Updated</Text>
                                <div className="font-medium">{new Date(task.updatedAt).toLocaleString()}</div>
                            </div>
                            {task.metadata && (
                                <div>
                                    <Text type="secondary">Metadata</Text>
                                    <div className="bg-gray-50 p-2 rounded mt-1 font-mono text-xs">
                                        {task.metadata}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default TaskDetail;
