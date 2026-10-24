import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Card, Row, Col, Statistic, Spin, Button, Tag, Empty } from 'antd';
import { UserOutlined, ApiOutlined, DatabaseOutlined, SecurityScanOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { taskApi } from '../../api/taskApi';

const { Title, Text } = Typography;

const DashboardPage = () => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(Date.now());

    const fetchDashboardData = async () => {
        try {
            const data = await taskApi.getUserTasks();
            setTasks(data || []);
        } catch (err) {
            console.error('Failed to load dashboard tasks:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 8000);
        return () => clearInterval(interval);
    }, [lastRefresh]);

    // Compute live metrics from actual tasks
    const activeTasksCount = tasks.filter(t => 
        ['EXECUTING', 'IN_PROGRESS', 'PLANNING', 'WAITING'].includes(t.status)
    ).length;

    const failedTasksCount = tasks.filter(t => t.status === 'FAILED').length;

    const completedTasksCount = tasks.filter(t => t.status === 'COMPLETED').length;

    // Check approvals from localStorage or tasks awaiting approval
    const pendingApprovalsCount = (() => {
        try {
            const saved = localStorage.getItem('aegis_pending_approvals');
            const localCount = saved ? JSON.parse(saved).length : 0;
            const taskWaitingCount = tasks.filter(t => ['WAITING_FOR_APPROVAL', 'AWAITING_APPROVAL'].includes(t.status)).length;
            return localCount + taskWaitingCount;
        } catch {
            return 0;
        }
    })();

    const getStatusBadge = (status) => {
        switch (status) {
            case 'COMPLETED':
                return <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs font-medium border border-green-500/30">COMPLETED</span>;
            case 'FAILED':
                return <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs font-medium border border-red-500/30">FAILED</span>;
            case 'EXECUTING':
            case 'IN_PROGRESS':
                return <span className="px-2 py-0.5 bg-blue-500/20 text-[#00d2ff] rounded text-xs font-medium border border-[#00d2ff]/30 shadow-neon">EXECUTING</span>;
            case 'PLANNING':
                return <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs font-medium border border-purple-500/30">PLANNING</span>;
            case 'WAITING':
            case 'WAITING_FOR_APPROVAL':
                return <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs font-medium border border-yellow-500/30">WAITING</span>;
            default:
                return <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 rounded text-xs font-medium border border-gray-500/30">{status || 'CREATED'}</span>;
        }
    };

    const formatTime = (isoString) => {
        if (!isoString) return 'Recently';
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' • ' + date.toLocaleDateString();
    };

    // Sort recent activity by updated/created descending
    const recentTasks = [...tasks].sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return timeB - timeA;
    }).slice(0, 5);

    return (
        <div className="animate-fade-in pb-4 px-2">
            <div className="mb-6 pt-2 flex justify-between items-start">
                <div>
                    <Title level={2} className="!mt-0 !mb-1 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 font-bold tracking-tight">Command Center</Title>
                    <Text className="text-gray-400">Live operational overview and system telemetry.</Text>
                </div>
                <div className="flex gap-2">
                    <Button 
                        icon={<ReloadOutlined spin={loading} />} 
                        onClick={() => { setLoading(true); setLastRefresh(Date.now()); }} 
                        className="border-white/10 text-gray-300 hover:text-white"
                    />
                    <Button 
                        type="primary" 
                        icon={<PlusOutlined />} 
                        onClick={() => navigate('/tasks')} 
                        className="bg-primary text-[#0B0F19] font-semibold border-none shadow-neon hover:bg-primary/90"
                    >
                        New Task
                    </Button>
                </div>
            </div>

            <Row gutter={[16, 16]} className="mb-8">
                <Col xs={12} sm={12} lg={6}>
                    <Card bordered={false} className="shadow-glass border border-white/5 bg-[#0e1422]/60 hover:border-[#00d2ff]/30 transition-all">
                        <Statistic
                            title={<span className="text-gray-400 text-xs font-medium uppercase tracking-wider">Active Tasks</span>}
                            value={activeTasksCount}
                            valueStyle={{ color: '#00d2ff', fontWeight: 700 }}
                            prefix={<ApiOutlined className="text-lg mr-1 text-[#00d2ff]" />}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={12} lg={6}>
                    <Card bordered={false} className="shadow-glass border border-white/5 bg-[#0e1422]/60 hover:border-green-500/30 transition-all">
                        <Statistic
                            title={<span className="text-gray-400 text-xs font-medium uppercase tracking-wider">Online Agents</span>}
                            value={1}
                            valueStyle={{ color: '#52c41a', fontWeight: 700 }}
                            prefix={<UserOutlined className="text-lg mr-1 text-[#52c41a]" />}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={12} lg={6}>
                    <Card bordered={false} className="shadow-glass border border-white/5 bg-[#0e1422]/60 hover:border-yellow-500/30 transition-all">
                        <Statistic
                            title={<span className="text-gray-400 text-xs font-medium uppercase tracking-wider">Pending Approvals</span>}
                            value={pendingApprovalsCount}
                            valueStyle={{ color: '#faad14', fontWeight: 700 }}
                            prefix={<SecurityScanOutlined className="text-lg mr-1 text-[#faad14]" />}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={12} lg={6}>
                    <Card bordered={false} className="shadow-glass border border-white/5 bg-[#0e1422]/60 hover:border-red-500/30 transition-all">
                        <Statistic
                            title={<span className="text-gray-400 text-xs font-medium uppercase tracking-wider">Failed Tasks</span>}
                            value={failedTasksCount}
                            valueStyle={{ color: '#ff4d4f', fontWeight: 700 }}
                            prefix={<DatabaseOutlined className="text-lg mr-1 text-[#ff4d4f]" />}
                        />
                    </Card>
                </Col>
            </Row>

            <Card bordered={false} className="shadow-glass border border-white/5 bg-[#0e1422]/60 mb-4">
                <div className="flex justify-between items-center mb-4">
                    <Title level={4} className="!mt-0 !mb-0 text-white font-semibold">Recent Task Activity</Title>
                    <Button type="link" onClick={() => navigate('/tasks')} className="text-xs text-[#00d2ff] hover:text-[#00d2ff]/80 p-0 font-medium">
                        View All Tasks →
                    </Button>
                </div>

                {loading && tasks.length === 0 ? (
                    <div className="flex justify-center items-center py-10">
                        <Spin size="default" />
                    </div>
                ) : recentTasks.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-xs">
                        No recent activity recorded. Create your first task to see execution telemetry.
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {recentTasks.map((t) => (
                            <div 
                                key={t.id} 
                                onClick={() => navigate(`/tasks/${t.id}`)}
                                className="flex justify-between items-center py-3.5 px-2 hover:bg-white/[0.02] cursor-pointer transition-colors rounded-lg"
                            >
                                <div className="pr-4 min-w-0">
                                    <div className="font-medium text-gray-200 text-sm truncate">{t.title}</div>
                                    <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                                        <span>Task #{t.id}</span>
                                        <span>•</span>
                                        <span>{formatTime(t.updatedAt || t.createdAt)}</span>
                                    </div>
                                </div>
                                <div className="flex-shrink-0">
                                    {getStatusBadge(t.status)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
};

export default DashboardPage;
