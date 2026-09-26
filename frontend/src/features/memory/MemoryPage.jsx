import React, { useState, useEffect } from 'react';
import { Typography, Card, Button, Modal, Form, Input, Select, notification, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { memoryApi } from '../../api/memoryApi';

const { Title, Text } = Typography;
const { Option } = Select;

const MemoryPage = () => {
    const [memories, setMemories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [searchQuery, setSearchQuery] = useState('');

    const fetchMemories = async (query = '') => {
        try {
            setLoading(true);
            const data = query 
                ? await memoryApi.searchMemories(query) 
                : await memoryApi.getAllMemories();
            setMemories(data);
        } catch (error) {
            notification.error({ message: 'Failed to fetch memories', description: error.message });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMemories(searchQuery);
    }, [searchQuery]);

    const handleCreateMemory = async (values) => {
        try {
            await memoryApi.createMemory(values.category, values.content);
            notification.success({ message: 'Memory stored successfully' });
            setIsModalVisible(false);
            form.resetFields();
            fetchMemories(searchQuery);
        } catch (error) {
            notification.error({ message: 'Failed to store memory', description: error.message });
        }
    };

    const handleDelete = async (id) => {
        try {
            await memoryApi.deleteMemory(id);
            notification.success({ message: 'Memory deleted' });
            fetchMemories(searchQuery);
        } catch (error) {
            notification.error({ message: 'Failed to delete memory', description: error.message });
        }
    };

    return (
        <div className="animate-fade-in pb-4 px-2 pt-2">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <Title level={2} className="!mt-0 !mb-0 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 font-bold tracking-tight">
                        Knowledge Base
                    </Title>
                    <Text className="text-gray-400 text-xs mt-1">Long-term facts and agent context</Text>
                </div>
                <Button type="primary" shape="round" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)} className="shadow-neon border-none">
                    Add Fact
                </Button>
            </div>

            <div className="mb-6">
                <Input.Search 
                    placeholder="Search memories..." 
                    allowClear 
                    onSearch={setSearchQuery}
                    onChange={(e) => { if(!e.target.value) setSearchQuery(''); }}
                    className="w-full"
                    size="large"
                />
            </div>

            <div className="space-y-3">
                {loading ? (
                    <Card className="w-full flex justify-center py-8 shadow-sm">
                        <div className="text-gray-400">Accessing memory core...</div>
                    </Card>
                ) : memories.length === 0 ? (
                    <Card className="w-full flex justify-center py-8 shadow-sm">
                        <div className="text-gray-400">No memory fragments found.</div>
                    </Card>
                ) : (
                    memories.map((memory) => (
                        <Card 
                            key={memory.id} 
                            bordered={false} 
                            className="shadow-glass relative group"
                            styles={{ body: { padding: '16px' } }}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1 pr-8">
                                    <div className="text-xs text-primary font-bold tracking-wider uppercase mb-1 flex items-center">
                                        {memory.category}
                                        <Tooltip title={`Confidence: ${memory.confidenceScore}`}>
                                            <InfoCircleOutlined className="ml-2 text-gray-500 cursor-help" />
                                        </Tooltip>
                                    </div>
                                    <div className="text-gray-200 text-sm">{memory.content}</div>
                                </div>
                                <Button 
                                    type="text" 
                                    danger 
                                    icon={<DeleteOutlined />} 
                                    onClick={() => handleDelete(memory.id)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 top-4"
                                />
                            </div>
                        </Card>
                    ))
                )}
            </div>

            <Modal
                title="Store New Fact"
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleCreateMemory}>
                    <Form.Item name="category" label="Category" initialValue="FACT">
                        <Select>
                            <Option value="FACT">General Fact</Option>
                            <Option value="PREFERENCE">User Preference</Option>
                            <Option value="PROJECT_KNOWLEDGE">Project Knowledge</Option>
                            <Option value="MACHINE_KNOWLEDGE">Machine Knowledge</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item 
                        name="content" 
                        label="Memory Content" 
                        rules={[{ required: true, message: 'Please enter the fact or memory to store' }]}
                    >
                        <Input.TextArea rows={4} placeholder="e.g., The production server IP is 10.0.0.5" />
                    </Form.Item>
                    <Form.Item>
                        <div className="flex justify-end gap-2">
                            <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
                            <Button type="primary" htmlType="submit">Store in Memory</Button>
                        </div>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default MemoryPage;
