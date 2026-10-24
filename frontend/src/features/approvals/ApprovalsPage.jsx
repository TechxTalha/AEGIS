import React, { useState, useEffect } from 'react';
import { Typography, Card, Button, Tag, Space, notification } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, SafetyCertificateOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const ApprovalsPage = () => {
    const [approvals, setApprovals] = useState(() => {
        try {
            const saved = localStorage.getItem('aegis_pending_approvals');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const handleApprove = (id) => {
        const remaining = approvals.filter(a => a.id !== id);
        setApprovals(remaining);
        localStorage.setItem('aegis_pending_approvals', JSON.stringify(remaining));
        notification.success({ message: 'Execution Approved', description: 'Tool operation approved for execution.' });
    };

    const handleDeny = (id) => {
        const remaining = approvals.filter(a => a.id !== id);
        setApprovals(remaining);
        localStorage.setItem('aegis_pending_approvals', JSON.stringify(remaining));
        notification.info({ message: 'Execution Denied', description: 'Tool operation was blocked.' });
    };

    return (
        <div className="animate-fade-in pb-4 px-2 pt-2">
            <div className="mb-6 pt-2">
                <Title level={2} className="!mt-0 !mb-1 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 font-bold tracking-tight">Approvals</Title>
                <Text className="text-gray-400">Review high-risk tool executions and sensitive operations.</Text>
            </div>

            <div className="space-y-3">
                {approvals.length === 0 ? (
                    <Card className="w-full flex flex-col items-center justify-center py-12 shadow-glass border border-white/5 bg-[#0e1422]/60 text-center">
                        <SafetyCertificateOutlined className="text-4xl text-[#00d2ff] mb-3 opacity-80" />
                        <div className="text-gray-200 font-semibold text-base mb-1">No Pending Approvals</div>
                        <div className="text-gray-400 text-xs max-w-sm">
                            All automated tools and agent executions are operating normally within established security boundaries.
                        </div>
                    </Card>
                ) : (
                    approvals.map((approval) => (
                        <Card 
                            key={approval.id} 
                            bordered={false} 
                            className="shadow-glass border border-white/5"
                            styles={{ body: { padding: '16px' } }}
                        >
                            <div className="mb-3">
                                <div className="flex justify-between items-start">
                                    <div className="font-bold text-gray-200 text-base">{approval.toolName || 'Tool Execution'}</div>
                                    <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs font-medium border border-red-500/30">
                                        {approval.riskLevel || 'HIGH'}
                                    </span>
                                </div>
                                <div className="text-xs text-gray-400 mb-3 mt-1">
                                    Task: {approval.taskId} • {approval.requestedAt ? new Date(approval.requestedAt).toLocaleTimeString() : 'Just now'}
                                </div>
                                <div className="bg-black/40 border border-white/5 p-3 rounded-lg text-xs font-mono text-gray-300 break-all">
                                    {typeof approval.parameters === 'string' ? approval.parameters : JSON.stringify(approval.parameters, null, 2)}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 mt-4">
                                <Button 
                                    danger 
                                    type="primary" 
                                    className="bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500 hover:text-white" 
                                    icon={<CloseCircleOutlined />} 
                                    onClick={() => handleDeny(approval.id)} 
                                    block
                                >
                                    Deny
                                </Button>
                                <Button 
                                    type="primary" 
                                    className="bg-primary text-[#0B0F19] hover:bg-primary/90 border-none shadow-neon font-semibold" 
                                    icon={<CheckCircleOutlined />} 
                                    onClick={() => handleApprove(approval.id)} 
                                    block
                                >
                                    Approve
                                </Button>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default ApprovalsPage;
