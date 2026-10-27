import React, { useState, useEffect } from 'react';
import { Modal, Progress, Button } from 'antd';
import { 
    DesktopOutlined, 
    DatabaseOutlined, 
    GlobalOutlined, 
    CodeOutlined,
    CoffeeOutlined,
    LaptopOutlined,
    PoweroffOutlined
} from '@ant-design/icons';
import { getStoredAgents, saveStoredAgents } from '../agents/agentsData';

/**
 * AgentWorkstations (Right Column Dedicated Deck)
 * 100% consistent with the Agents tab:
 * 1. AEGIS Core Orchestrator (agent-core-1)
 * 2. Database Agent (agent-db-worker)
 * 3. Web Research Agent (agent-research-1)
 * 4. Antigravity Coder (agent-coder-x)
 *
 * Sized to h-[640px] xl:h-[660px] to match the 3-column command layout.
 */
const AgentWorkstations = ({ liveTasks = [] }) => {
    const isAnyTaskRunning = liveTasks.some(t => ['EXECUTING', 'IN_PROGRESS', 'PLANNING'].includes(t.status));
    const activeTaskTitle = liveTasks.find(t => ['EXECUTING', 'IN_PROGRESS'].includes(t.status))?.title;

    const [agents, setAgents] = useState(getStoredAgents);
    const [selectedAgent, setSelectedAgent] = useState(null);

    useEffect(() => {
        const handleUpdate = () => {
            setAgents(getStoredAgents());
        };
        window.addEventListener('aegis_agents_updated', handleUpdate);
        return () => window.removeEventListener('aegis_agents_updated', handleUpdate);
    }, []);

    useEffect(() => {
        if (isAnyTaskRunning) {
            setAgents(prev => {
                const updated = prev.map(a => 
                    a.id === 'agent-core-1' 
                        ? { ...a, status: 'BUSY', currentTask: activeTaskTitle || 'Executing Task Pipeline', cpu: 75 } 
                        : a
                );
                saveStoredAgents(updated);
                return updated;
            });
        }
    }, [isAnyTaskRunning, activeTaskTitle]);

    const getAgentIcon = (id) => {
        switch (id) {
            case 'agent-core-1': return <DesktopOutlined />;
            case 'agent-db-worker': return <DatabaseOutlined />;
            case 'agent-research-1': return <GlobalOutlined />;
            case 'agent-coder-x': return <CodeOutlined />;
            default: return <DesktopOutlined />;
        }
    };

    const isWorking = (agent) => agent.status === 'BUSY';
    const isFree = (agent) => agent.status === 'ONLINE';
    const isOffline = (agent) => agent.status === 'OFFLINE';

    const handleStateChange = (agentId, newStatus) => {
        const updated = agents.map(a => {
            if (a.id === agentId) {
                return {
                    ...a,
                    status: newStatus,
                    cpu: newStatus === 'BUSY' ? Math.floor(70 + Math.random() * 25) : newStatus === 'ONLINE' ? 14 : 0,
                    currentTask: newStatus === 'BUSY' ? 'Locked Into Mainframe Operations' : newStatus === 'ONLINE' ? 'Resting on Cyber Lounge Sofa' : 'Disconnected // Absent'
                };
            }
            return a;
        });
        setAgents(updated);
        saveStoredAgents(updated);

        if (selectedAgent && selectedAgent.id === agentId) {
            setSelectedAgent(updated.find(a => a.id === agentId));
        }
    };

    return (
        <div className="w-full h-[640px] xl:h-[660px] rounded-3xl bg-gradient-to-b from-[#0e1424]/90 via-[#0B0F19] to-[#0B0F19] border border-white/15 p-3 flex flex-col justify-between shadow-[0_16px_48px_rgba(0,0,0,0.8)] overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center px-1 pb-1.5 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-neon" />
                    <h3 className="text-xs font-bold text-white tracking-wider uppercase mb-0">
                        Agent Operations Hub
                    </h3>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono">
                    <span className="text-cyan-400 font-semibold">{agents.filter(isWorking).length} Locked</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-amber-400 font-semibold">{agents.filter(isFree).length} Rest</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-400">{agents.filter(isOffline).length} Off</span>
                </div>
            </div>

            {/* 4 Agent Workstation Cards in Vertical Stack */}
            <div className="flex-1 flex flex-col justify-between gap-2 pt-2">
                {agents.map((agent) => (
                    <div
                        key={agent.id}
                        onClick={() => setSelectedAgent(agent)}
                        className={`relative rounded-xl p-2.5 transition-all duration-200 cursor-pointer overflow-hidden border flex-1 flex flex-col justify-between ${
                            isWorking(agent)
                                ? 'bg-gradient-to-r from-[#11192e] to-[#0c1221] border-cyan-500/50 shadow-[0_0_15px_rgba(0,210,255,0.18)] hover:border-cyan-400'
                                : isFree(agent)
                                    ? 'bg-gradient-to-r from-[#161a26] to-[#0e111a] border-amber-500/30 hover:border-amber-400/60'
                                    : 'bg-[#090d14]/70 border-white/5 opacity-60 hover:opacity-85'
                        }`}
                    >
                        {/* Card Header */}
                        <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center gap-2 min-w-0 pr-1">
                                <span className="text-cyan-400 text-sm flex-shrink-0">{getAgentIcon(agent.id)}</span>
                                <div className="truncate">
                                    <h4 className="text-xs font-bold text-white mb-0 truncate">{agent.name}</h4>
                                    <span className="text-[9px] text-gray-400 font-mono">{agent.id}</span>
                                </div>
                            </div>

                            {/* State Tag */}
                            {isWorking(agent) && (
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-neon animate-pulse flex-shrink-0">
                                    LOCKED IN
                                </span>
                            )}
                            {isFree(agent) && (
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex-shrink-0">
                                    RESTING ☕
                                </span>
                            )}
                            {isOffline(agent) && (
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-gray-800 text-gray-400 border border-white/10 flex-shrink-0">
                                    OFFLINE
                                </span>
                            )}
                        </div>

                        {/* Visual Animation Scene */}
                        <div className="w-full h-16 rounded-lg bg-black/50 border border-white/5 relative flex items-center justify-center overflow-hidden my-1">
                            
                            {/* --- STATE 1: WORKING (LOCKED IN) --- */}
                            {isWorking(agent) && (
                                <div className="w-full h-full relative flex items-center justify-around px-3">
                                    {/* Triple Monitors */}
                                    <div className="flex items-center gap-1">
                                        <div className="w-7 h-8 rounded bg-[#041c1b] border border-emerald-500/60 p-0.5 flex flex-col justify-around overflow-hidden shadow-[0_0_6px_rgba(16,185,129,0.3)]">
                                            <div className="w-full h-0.5 bg-emerald-400 animate-pulse" />
                                            <div className="w-3/4 h-0.5 bg-emerald-400/70" />
                                        </div>
                                        <div className="w-14 h-10 rounded bg-[#071927] border border-cyan-400 p-0.5 flex flex-col justify-between overflow-hidden shadow-[0_0_10px_rgba(0,210,255,0.5)]">
                                            <div className="flex justify-between items-center text-[5px] text-cyan-300 font-mono">
                                                <span>EXEC</span>
                                                <span className="w-1 h-1 rounded-full bg-cyan-400 animate-ping" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <div className="w-full h-0.5 bg-cyan-400 animate-pulse" />
                                                <div className="w-4/5 h-0.5 bg-cyan-300" />
                                            </div>
                                            <div className="text-[5px] font-mono text-cyan-400 truncate">SYS.RUN(0x8F)</div>
                                        </div>
                                        <div className="w-7 h-8 rounded bg-[#160b29] border border-purple-500/60 p-0.5 flex flex-col justify-around overflow-hidden shadow-[0_0_6px_rgba(168,85,247,0.3)]">
                                            <div className="w-full h-0.5 bg-purple-400" />
                                            <div className="w-2/3 h-0.5 bg-purple-400 animate-pulse" />
                                        </div>
                                    </div>

                                    {/* Agent Avatar Typing */}
                                    <div className="flex flex-col items-center">
                                        <div className="w-5 h-5 rounded-full bg-cyan-900 border border-cyan-400 flex items-center justify-center shadow-neon">
                                            <div className="w-3 h-1 rounded-full bg-cyan-300 animate-pulse" />
                                        </div>
                                        <div className="w-7 h-2 bg-gray-800 rounded-t-xs mt-0.5 flex justify-between px-0.5 items-end">
                                            <div className="w-1.5 h-1 bg-cyan-400 rounded-xs animate-bounce" />
                                            <div className="w-1.5 h-1 bg-cyan-400 rounded-xs animate-bounce" style={{ animationDelay: '0.15s' }} />
                                        </div>
                                        <div className="w-9 h-1 rounded-xs bg-cyan-950 border border-cyan-400/80" />
                                    </div>
                                </div>
                            )}

                            {/* --- STATE 2: FREE (RESTING / DRINK / SOFA) --- */}
                            {isFree(agent) && (
                                <div className="w-full h-full relative flex items-center justify-center px-4">
                                    <div className="w-36 h-10 bg-gradient-to-r from-[#2a241b] via-[#382e1e] to-[#2a241b] rounded-t-xl border-t border-amber-500/40 shadow-inner flex items-center justify-between px-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-amber-950 border border-amber-400 flex items-center justify-center">
                                                <span className="text-[8px] text-amber-300">^‿^</span>
                                            </div>
                                            <span className="text-[9px] font-mono text-amber-300/90 truncate max-w-[100px]">
                                                {agent.drink}
                                            </span>
                                        </div>
                                        <div className="relative flex flex-col items-center">
                                            <div className="flex gap-0.5 -mt-1.5">
                                                <span className="text-[7px] text-amber-200/80 animate-pulse">~</span>
                                                <span className="text-[8px] text-amber-200/90 animate-bounce">~</span>
                                            </div>
                                            <div className="w-4 h-4 rounded bg-amber-600 border border-amber-300 flex items-center justify-center text-[8px] text-white">
                                                ☕
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- STATE 3: OFFLINE (NOT PRESENT / ABSENT) --- */}
                            {isOffline(agent) && (
                                <div className="w-full h-full relative flex items-center justify-center gap-3 opacity-60">
                                    <div className="w-16 h-8 rounded border border-dashed border-gray-700 bg-gray-900/40 flex flex-col items-center justify-center p-0.5">
                                        <PoweroffOutlined className="text-xs text-gray-600 mb-0.5" />
                                        <span className="text-[7px] font-mono text-gray-500 uppercase tracking-widest">
                                            NO SIGNAL
                                        </span>
                                    </div>
                                    <div className="w-5 h-5 rounded-full border border-gray-700 bg-gray-800/40 flex items-center justify-center">
                                        <span className="text-[6px] text-gray-500 font-mono">VACANT</span>
                                    </div>
                                    <span className="text-[8px] font-mono text-gray-500 italic">
                                        Absent from desk
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Capabilities & Telemetry */}
                        <div className="flex justify-between items-center text-[10px] font-mono pt-0.5">
                            <div className="flex gap-1 overflow-hidden">
                                {agent.capabilities.slice(0, 2).map(cap => (
                                    <span key={cap} className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-gray-400">
                                        {cap}
                                    </span>
                                ))}
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                <span className="text-gray-400 text-[9px]">CPU:</span>
                                <span className={isWorking(agent) ? 'text-cyan-400 font-bold text-[10px]' : 'text-gray-500 text-[10px]'}>
                                    {agent.cpu}%
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Workstation Inspection Modal */}
            {selectedAgent && (
                <Modal
                    open={Boolean(selectedAgent)}
                    onCancel={() => setSelectedAgent(null)}
                    footer={null}
                    title={
                        <div className="flex items-center gap-2 text-white">
                            <span className="text-cyan-400">{getAgentIcon(selectedAgent.id)}</span>
                            <span>{selectedAgent.name} // Workstation Terminal</span>
                        </div>
                    }
                    className="cyber-modal"
                    styles={{
                        content: {
                            background: '#0e1424',
                            border: '1px solid rgba(0, 210, 255, 0.3)',
                            borderRadius: '16px'
                        }
                    }}
                >
                    <div className="py-2 space-y-3 text-gray-200">
                        <div className="flex justify-between items-center bg-[#151d32] p-2.5 rounded-xl border border-white/10">
                            <div>
                                <div className="text-[10px] text-gray-400 font-mono">OPERATIONAL STATUS</div>
                                <div className="text-xs font-bold text-cyan-400">{selectedAgent.status}</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-gray-400 font-mono">HARDWARE UTILIZATION</div>
                                <div className="text-xs font-bold text-white">{selectedAgent.cpu}% CPU • {selectedAgent.vram}</div>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-mono text-gray-400 mb-1.5 block uppercase tracking-wider">
                                Override Agent Physical State:
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                <Button
                                    type={isWorking(selectedAgent) ? 'primary' : 'default'}
                                    onClick={() => handleStateChange(selectedAgent.id, 'BUSY')}
                                    className={isWorking(selectedAgent) ? 'bg-[#00d2ff] text-black font-semibold' : 'border-white/10 text-gray-300'}
                                    icon={<LaptopOutlined />}
                                    size="small"
                                >
                                    Locked In
                                </Button>
                                <Button
                                    type={isFree(selectedAgent) ? 'primary' : 'default'}
                                    onClick={() => handleStateChange(selectedAgent.id, 'ONLINE')}
                                    className={isFree(selectedAgent) ? 'bg-amber-500 text-black font-semibold' : 'border-white/10 text-gray-300'}
                                    icon={<CoffeeOutlined />}
                                    size="small"
                                >
                                    Resting (Sofa)
                                </Button>
                                <Button
                                    type={isOffline(selectedAgent) ? 'primary' : 'default'}
                                    onClick={() => handleStateChange(selectedAgent.id, 'OFFLINE')}
                                    className={isOffline(selectedAgent) ? 'bg-gray-600 text-white font-semibold' : 'border-white/10 text-gray-300'}
                                    icon={<PoweroffOutlined />}
                                    size="small"
                                >
                                    Go Offline
                                </Button>
                            </div>
                        </div>

                        <div className="bg-black/80 rounded-xl p-2.5 border border-white/10 font-mono text-[11px] space-y-0.5">
                            <div className="text-cyan-400">[TELEMETRY] Node: 169.58.232.237</div>
                            <div className="text-gray-400">[BOUND] {selectedAgent.id} • {selectedAgent.type}</div>
                            <div className="text-emerald-400">[STATE] {selectedAgent.status} // {selectedAgent.currentTask}</div>
                            <div className="text-gray-400">[CAPABILITIES] {selectedAgent.capabilities.join(', ')}</div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default AgentWorkstations;
