import React, { useState, useEffect } from 'react';
import { Typography, Card, Button, Table, Modal, Form, Input, Select, Tag, Space, notification } from 'antd';
import { PlusOutlined, PlayCircleOutlined } from '@ant-design/icons';
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

    const columns = [
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            render: (text, record) => <a onClick={() => navigate(`/tasks/${record.id}`)}>{text}</a>,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = 'default';
                if (status === 'CREATED') color = 'blue';
                if (status === 'EXECUTING') color = 'processing';
                if (status === 'COMPLETED') color = 'success';
                if (status === 'FAILED') color = 'error';
                if (status === 'CANCELLED') color = 'warning';
                return <Tag color={color}>{status}</Tag>;
            },
        },
        {
            title: 'Priority',
            dataIndex: 'priority',
            key: 'priority',
        },
        {
            title: 'Created At',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => new Date(date).toLocaleString(),
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button 
                        type="primary" 
                        size="small" 
                        icon={<PlayCircleOutlined />} 
                        onClick={() => navigate(`/tasks/${record.id}`)}
                    >
                        View Details
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <Title level={2} className="!mt-0 !mb-2 text-gray-800">Task Manager</Title>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
                    New Task
                </Button>
            </div>

            <Card bordered={false} className="shadow-sm">
                <Table 
                    columns={columns} 
                    dataSource={tasks} 
                    rowKey="id" 
                    loading={loading} 
                />
            </Card>

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
