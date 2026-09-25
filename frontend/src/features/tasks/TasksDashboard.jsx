import React, { useState, useEffect } from 'react';
import { Typography, Card, Button, Modal, Form, Input, Select, Tag, Space, notification } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { taskApi } from '../../api/taskApi';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;
const { Option } = Select;

const TasksDashboard = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const navigate = useNavigate();

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const data = await taskApi.getUserTasks();
            setTasks(data);
        } catch (error) {
            notification.error({ message: 'Failed to fetch tasks', description: error.message });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleCreateTask = async (values) => {
        try {
            await taskApi.createTask(values);
            notification.success({ message: 'Task created successfully' });
            setIsModalVisible(false);
            form.resetFields();
            fetchTasks();
        } catch (error) {
            notification.error({ message: 'Failed to create task', description: error.message });
        }
    };


    return (
        <div className="animate-fade-in pb-4 px-2 pt-2">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <Title level={2} className="!mt-0 !mb-0 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 font-bold tracking-tight">Tasks</Title>
                </div>
                <Button type="primary" shape="round" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)} className="shadow-neon border-none">
                    New
                </Button>
            </div>

            <div className="space-y-3">
                {loading ? (
                    <Card className="w-full flex justify-center py-8 shadow-sm">
                        <div className="text-gray-400">Loading tasks...</div>
                    </Card>
                ) : tasks.length === 0 ? (
                    <Card className="w-full flex justify-center py-8 shadow-sm">
                        <div className="text-gray-400">No tasks found.</div>
                    </Card>
                ) : (
                    tasks.map((task) => (
                        <Card 
                            key={task.id} 
                            bordered={false} 
                            className="shadow-glass cursor-pointer hover:border-primary/50 transition-colors"
                            styles={{ body: { padding: '16px' } }}
                            onClick={() => navigate(`/tasks/${task.id}`)}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1 pr-2">
                                    <div className="font-semibold text-gray-200 text-base mb-1 truncate">{task.title}</div>
                                    <div className="text-xs text-gray-400 mb-2">
                                        {new Date(task.createdAt).toLocaleString()}
                                    </div>
                                </div>
                                <div>
                                    <Tag color={
                                        task.status === 'CREATED' ? 'blue' : 
                                        task.status === 'EXECUTING' ? 'processing' : 
                                        task.status === 'COMPLETED' ? 'success' : 
                                        task.status === 'FAILED' ? 'error' : 'default'
                                    }>
                                        {task.status}
                                    </Tag>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            <Modal
                title="Create New Task"
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleCreateTask}>
                    <Form.Item 
                        name="title" 
                        label="Title" 
                        rules={[{ required: true, message: 'Please enter a title' }]}
                    >
                        <Input placeholder="Task Title" />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea rows={4} placeholder="Task Description" />
                    </Form.Item>
                    <Form.Item name="priority" label="Priority" initialValue="NORMAL">
                        <Select>
                            <Option value="LOW">Low</Option>
                            <Option value="NORMAL">Normal</Option>
                            <Option value="HIGH">High</Option>
                            <Option value="CRITICAL">Critical</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item>
                        <div className="flex justify-end gap-2">
                            <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
                            <Button type="primary" htmlType="submit">Create Task</Button>
                        </div>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default TasksDashboard;
