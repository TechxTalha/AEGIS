import React, { useState, useEffect } from 'react';
import { Typography, Card, Badge, Tooltip } from 'antd';
import { 
    DesktopOutlined, 
    DatabaseOutlined, 
    GlobalOutlined, 
    CodeOutlined,
    ReloadOutlined,
    DashboardOutlined,
    ApartmentOutlined
} from '@ant-design/icons';
import { agentApi } from '../../api/agentApi';

const { Title, Text } = Typography;

const CANONICAL_IDS = ['agent-core-1', 'agent-db-worker', 'agent-research-1', 'agent-coder-x'];

const ROOM_NAMES = {
    bridge: { name: 'Master Command Bridge', icon: '💻', color: 'text-cyan-400' },
    quantum_lab: { name: 'Quantum Synthesis Lab', icon: '⚡', color: 'text-purple-400' },
    data_radar: { name: 'Data & Radar Wing', icon: '🗄️', color: 'text-emerald-400' },
    lounge: { name: 'Recreation Haven', icon: '☕', color: 'text-amber-400' }
};

const DEFAULT_AGENTS = [
    {
        id: 'agent-core-1',
        name: 'AEGIS Core Orchestrator',
        role: 'Mission Lead & System Orchestrator',
        type: 'System',
        status: 'ONLINE',
        homeWing: 'bridge',
        room: 'bridge',
        currentTask: 'Command bridge synchronized',
        cpu: 14,
        memory: '1.4 GB / 7.8 GB',
        capabilities: ['plan', 'execute', 'reason', 'orchestrate'],
        drink: 'Espresso',
        persona: { outfitColor: '#00d2ff', hairColor: '#1e293b', accessory: 'headset', title: 'Commander' }
    },
    {
        id: 'agent-db-worker',
        name: 'Database Agent',
        role: 'Data Architect & SQL Engine',
        type: 'Specialized',
        status: 'ONLINE',
        homeWing: 'data_radar',
        room: 'data_radar',
        currentTask: 'Database connection pool active',
        cpu: 11,
        memory: '1.8 GB allocated',
        capabilities: ['sql.read', 'sql.write', 'schema.analyze'],
        drink: 'Green Tea',
        persona: { outfitColor: '#10b981', hairColor: '#064e3b', accessory: 'datapad', title: 'Archivist' }
    },
    {
        id: 'agent-research-1',
        name: 'Web Research Agent',
        role: 'Realtime Web & API Explorer',
        type: 'Specialized',
        status: 'ONLINE',
        homeWing: 'data_radar',
        room: 'data_radar',
        currentTask: 'Global network scanner standby',
        cpu: 8,
        memory: '2.4 GB allocated',
        capabilities: ['web.search', 'web.scrape', 'doc.parse'],
        drink: 'Iced Latte',
        persona: { outfitColor: '#f59e0b', hairColor: '#78350f', accessory: 'goggles', title: 'Scout' }
    },
    {
        id: 'agent-coder-x',
        name: 'Antigravity Coder',
        role: 'Autonomous Code Synthesis',
        type: 'External',
        status: 'OFFLINE',
        homeWing: 'quantum_lab',
        room: 'quantum_lab',
        currentTask: 'Pod Hibernation (Recreation Bay)',
        cpu: 0,
        memory: '0 GB',
        capabilities: ['fs.write', 'git.commit', 'ide.edit'],
        drink: 'None',
        persona: { outfitColor: '#a855f7', hairColor: '#4c1d95', accessory: 'hoodie', title: 'Hacker' }
    }
];

const AgentsPage = () => {
    const [agents, setAgents] = useState(DEFAULT_AGENTS);
    const [hostTelemetry, setHostTelemetry] = useState({ hostMemory: '1.4 GB / 7.8 GB (19%)' });
    const [houseStats, setHouseStats] = useState({ workingCount: 0, idleCount: 3, offlineCount: 1 });
    const [loading, setLoading] = useState(false);

    const fetchLiveAgents = async () => {
        try {
            const data = await agentApi.getLiveAgents();
            if (data && data.agents && data.agents.length > 0) {
                const canonicalAgents = data.agents.filter(a => CANONICAL_IDS.includes(a.id));
                setAgents(canonicalAgents);
                setHouseStats({
                    workingCount: canonicalAgents.filter(a => a.status === 'BUSY').length,
                    idleCount: canonicalAgents.filter(a => a.status === 'ONLINE').length,
                    offlineCount: canonicalAgents.filter(a => a.status === 'OFFLINE').length
                });
                setHostTelemetry({
                    hostMemory: data.hostMemory,
                    activeTask: data.activeTask,
                    isExecuting: data.isExecuting
                });
            }
        } catch (err) {
            console.error('Failed to fetch real-time agents:', err);
        }
    };

    useEffect(() => {
        fetchLiveAgents();
        const interval = setInterval(fetchLiveAgents, 4000);
        return () => clearInterval(interval);
    }, []);

    const getAgentIcon = (id, outfitColor) => {
        return (
            <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg mr-3 shadow-neon transition-transform hover:scale-105"
                style={{ 
                    backgroundColor: `${outfitColor}20`, 
                    border: `1px solid ${outfitColor}60`,
                    color: outfitColor 
                }}
            >
                {id.includes('db') ? <DatabaseOutlined /> :
                 id.includes('research') ? <GlobalOutlined /> :
                 id.includes('coder') ? <CodeOutlined /> : <DesktopOutlined />}
            </div>
        );
    };

    return (
        <div className="animate-fade-in pb-4 px-2 pt-2">
            {/* Header: Clean title without redundant text description */}
            <div className="mb-4 pt-1 flex justify-between items-center">
                <Title level={2} className="!mt-0 !mb-0 text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 font-bold tracking-tight">
                    Agents
                </Title>
                <div className="flex items-center gap-3 text-xs font-mono text-gray-400">
                    <span className="text-cyan-400 font-semibold">{houseStats.workingCount} Working</span>
                    <span className="text-gray-600">•</span>
                    <span className="text-amber-400 font-semibold">{houseStats.idleCount} Idle</span>
                    <span className="text-gray-600">•</span>
                    <span className="text-gray-400">{houseStats.offlineCount} Offline</span>
                    <button 
                        onClick={() => { setLoading(true); fetchLiveAgents().finally(() => setLoading(false)); }}
                        className="ml-2 text-gray-400 hover:text-white transition-colors cursor-pointer"
                        title="Refresh Agents"
                    >
                        <ReloadOutlined spin={loading} />
                    </button>
                </div>
            </div>

            {/* Host Hardware & Telemetry Bar */}
            {hostTelemetry && (
                <div className="mb-4 p-3 rounded-2xl bg-gradient-to-r from-[#0e1424] to-[#12182b] border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-glass">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        <span className="text-gray-400">HOST TELEMETRY:</span>
                        <span className="text-white font-bold">{hostTelemetry.hostMemory}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400">ACTIVE TASK:</span>
                        <span className="text-cyan-300 font-semibold truncate max-w-[320px]">
                            {hostTelemetry.activeTask || 'Standing by for instructions'}
                        </span>
                    </div>
                </div>
            )}

            {/* Agent Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {agents.map((agent) => {
                    const wingKey = agent.homeWing || agent.room;
                    const roomInfo = ROOM_NAMES[wingKey] || { name: 'Smart HQ', icon: '📍', color: 'text-gray-400' };
                    const outfitColor = agent.persona?.outfitColor || '#00d2ff';

                    return (
                        <Card 
                            key={agent.id} 
                            bordered={false} 
                            className="shadow-glass border border-white/5 hover:border-white/20 transition-all rounded-2xl bg-[#0b0f19]/90"
                            styles={{ body: { padding: '16px' } }}
                        >
                            <div className="flex items-start">
                                {getAgentIcon(agent.id, outfitColor)}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="font-bold text-gray-100 text-sm leading-tight pr-2 truncate">
                                            {agent.name}
                                        </div>
                                        <Badge 
                                            status={agent.status === 'ONLINE' ? 'success' : agent.status === 'BUSY' ? 'processing' : 'default'} 
                                            text={<span className="text-[10px] uppercase font-bold tracking-wider text-gray-300">{agent.status}</span>}
                                        />
                                    </div>

                                    {/* Role, Location & Hardware Usage */}
                                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-400 mb-2">
                                        <span>{agent.type}</span>
                                        <span>•</span>
                                        <span className={`flex items-center gap-1 font-semibold ${roomInfo.color}`}>
                                            <span>{roomInfo.icon}</span>
                                            <span>{roomInfo.name}</span>
                                        </span>
                                        <span>•</span>
                                        <span className="text-cyan-400 font-mono">{agent.cpu}% CPU</span>
                                    </div>

                                    {/* Real-time Activity */}
                                    <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-gray-300 mb-2.5 font-sans line-clamp-1">
                                        <span className="text-gray-500 font-mono mr-1.5">TASK:</span>
                                        {agent.currentTask}
                                    </div>

                                    {/* Capabilities */}
                                    <div className="flex flex-wrap gap-1.5">
                                        {agent.capabilities?.map(cap => (
                                            <span key={cap} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400 font-mono">
                                                {cap}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default AgentsPage;
