import React, { useState } from 'react';
import { Typography, Card, Tag, Badge } from 'antd';
import { DesktopOutlined, DatabaseOutlined, GlobalOutlined, CodeOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const AgentsPage = () => {
    // Mock connected agents
    const [agents] = useState([
        {
            id: 'agent-core-1',
            name: 'AEGIS Core Orchestrator',
            type: 'System',
            status: 'ONLINE',
            icon: <DesktopOutlined />,
            capabilities: ['plan', 'execute', 'reason']
        },
        {
            id: 'agent-db-worker',
            name: 'Database Agent',
            type: 'Specialized',
            status: 'ONLINE',
            icon: <DatabaseOutlined />,
            capabilities: ['sql.read', 'sql.write', 'schema.analyze']
        },
        {
            id: 'agent-research-1',
            name: 'Web Research Agent',
            type: 'Specialized',
            status: 'BUSY',
            icon: <GlobalOutlined />,
            capabilities: ['web.search', 'web.scrape']
        },
        {
            id: 'agent-coder-x',
            name: 'Antigravity Coder',
            type: 'External',
            status: 'OFFLINE',
            icon: <CodeOutlined />,
            capabilities: ['fs.write', 'git.commit', 'ide.edit']
        }
    ]);

    return (
        <div className="animate-fade-in pb-4 px-2 pt-2">
            <div className="mb-6 pt-2">
                <Title level={2} className="!mt-0 !mb-1 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 font-bold tracking-tight">Agents</Title>
                <Text className="text-gray-400">Manage machine and specialized agents.</Text>
            </div>

            <div className="space-y-3">
                {agents.map((agent) => (
                    <Card 
                        key={agent.id} 
                        bordered={false} 
                        className="shadow-glass"
                        styles={{ body: { padding: '16px' } }}
                    >
                        <div className="flex items-start">
                            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-lg mr-3 shadow-neon">
                                {agent.icon}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <div className="font-bold text-gray-200 text-base leading-tight pr-2">{agent.name}</div>
                                    <Badge 
                                        status={agent.status === 'ONLINE' ? 'success' : agent.status === 'BUSY' ? 'processing' : 'default'} 
                                        text={<span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">{agent.status}</span>}
                                    />
                                </div>
                                <div className="text-xs text-gray-400 mb-3">
                                    {agent.id} • {agent.type}
                                </div>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {agent.capabilities.map(cap => (
                                        <span key={cap} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-300">
                                            {cap}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default AgentsPage;
