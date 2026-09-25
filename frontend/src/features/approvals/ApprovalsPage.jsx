import React, { useState } from 'react';
import { Typography, Card, Button, Tag, Space, notification } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const ApprovalsPage = () => {
    // Mock pending approvals for now
    const [approvals, setApprovals] = useState([
        {
            id: 'apprv-1',
            taskId: 'task-102',
            toolName: 'sys.execute',
            parameters: { command: 'rm -rf /tmp/cache/*' },
            riskLevel: 'HIGH',
            requestedAt: new Date(Date.now() - 5 * 60000).toISOString()
        }
    ]);

    const handleApprove = (id) => {
        setApprovals(approvals.filter(a => a.id !== id));
        notification.success({ message: 'Execution Approved' });
    };

    const handleDeny = (id) => {
        setApprovals(approvals.filter(a => a.id !== id));
        notification.info({ message: 'Execution Denied' });
    };

    return (
        <div className="animate-fade-in pb-4 px-2 pt-2">
            <div className="mb-6 pt-2">
                <Title level={2} className="!mt-0 !mb-1 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 font-bold tracking-tight">Approvals</Title>
                <Text className="text-gray-400">Review high-risk tool executions.</Text>
            </div>

            <div className="space-y-3">
                {approvals.length === 0 ? (
                    <Card className="w-full flex justify-center py-8 shadow-glass">
                        <div className="text-gray-400">No pending approvals.</div>
                    </Card>
                ) : (
                    approvals.map((approval) => (
                        <Card 
                            key={approval.id} 
                            bordered={false} 
                            className="shadow-glass"
                            styles={{ body: { padding: '16px' } }}
                        >
                            <div className="mb-3">
                                <div className="flex justify-between items-start">
                                    <div className="font-bold text-gray-200 text-base">{approval.toolName}</div>
                                    <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs font-medium border border-red-500/30">{approval.riskLevel}</span>
                                </div>
                                <div className="text-xs text-gray-400 mb-3 mt-1">Task: {approval.taskId} • {new Date(approval.requestedAt).toLocaleTimeString()}</div>
                                <div className="bg-black/40 border border-white/5 p-3 rounded-lg text-xs font-mono text-gray-300 break-all">
                                    {JSON.stringify(approval.parameters)}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 mt-4">
                                <Button danger type="primary" className="bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500 hover:text-white" icon={<CloseCircleOutlined />} onClick={() => handleDeny(approval.id)} block>
                                    Deny
                                </Button>
                                <Button type="primary" className="bg-primary text-[#0B0F19] hover:bg-primary/90 border-none shadow-neon font-semibold" icon={<CheckCircleOutlined />} onClick={() => handleApprove(approval.id)} block>
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
