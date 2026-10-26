import React, { useState, useEffect } from 'react';
import { Modal, Tag, Progress, Button, Tooltip } from 'antd';
import { 
    LaptopOutlined, 
    CoffeeOutlined, 
    ThunderboltOutlined, 
    PoweroffOutlined, 
    CodeOutlined, 
    SecurityScanOutlined, 
    DatabaseOutlined,
    RocketOutlined
} from '@ant-design/icons';

/**
 * AgentWorkstations
 * Displays autonomous AEGIS agents and their workstations with three dynamic visual states:
 * 1. OFFLINE: Not present / absent from the desk; monitors powered down.
 * 2. FREE: Resting in the lounge, drinking coffee/beverage or reclining on a cyber sofa.
 * 3. WORKING: Fully locked into the system; triple glowing monitors, rapid typing, neural link active.
 */
const AgentWorkstations = ({ liveTasks = [] }) => {
    // Detect active tasks to dynamically lock in agents
    const isAnyTaskRunning = liveTasks.some(t => ['EXECUTING', 'IN_PROGRESS', 'PLANNING'].includes(t.status));
    const activeTaskTitle = liveTasks.find(t => ['EXECUTING', 'IN_PROGRESS'].includes(t.status))?.title || 'Kernel Telemetry Sync';

    const [agents, setAgents] = useState([
        {
            id: 'agent-nova',
            name: 'Nova Prime',
            role: 'AEGIS Core Orchestrator',
            state: isAnyTaskRunning ? 'WORKING' : 'FREE', // 'WORKING' | 'FREE' | 'OFFLINE'
            icon: <ThunderboltOutlined />,
            drink: 'Quantum Espresso',
            cpu: 64,
            currentTask: 'Directing Task Orchestration & Neural Graph'
        },
        {
            id: 'agent-hex',
            name: 'Hex Coder',
            role: 'Antigravity Systems Dev',
            state: 'WORKING', // locked in
            icon: <CodeOutlined />,
            drink: 'Iced Synth-Matcha',
            cpu: 88,
            currentTask: 'Compiling Async Task Telemetry Pipeline'
        },
        {
            id: 'agent-vanguard',
            name: 'Vanguard',
            role: 'Host Sentinel & Security',
            state: 'FREE', // resting with drink on sofa
            icon: <SecurityScanOutlined />,
            drink: 'Cyber Nitro Cold-Brew',
            cpu: 18,
            currentTask: 'Standby: Listening to Kernel FileStore'
        },
        {
            id: 'agent-oracle',
            name: 'Oracle Data',
            role: 'Vector Memory Synthesizer',
            state: 'OFFLINE', // absent / empty desk
            icon: <DatabaseOutlined />,
            drink: 'None',
            cpu: 0,
            currentTask: 'Disconnected'
        }
    ]);

    const [selectedAgent, setSelectedAgent] = useState(null);

    // Sync state if tasks change
    useEffect(() => {
        if (isAnyTaskRunning) {
            setAgents(prev => prev.map(a => a.id === 'agent-nova' ? { ...a, state: 'WORKING', currentTask: activeTaskTitle } : a));
        }
    }, [isAnyTaskRunning, activeTaskTitle]);

    const handleStateChange = (agentId, newState) => {
        setAgents(prev => prev.map(a => {
            if (a.id === agentId) {
                return {
                    ...a,
                    state: newState,
                    cpu: newState === 'WORKING' ? Math.floor(65 + Math.random() * 30) : newState === 'FREE' ? 12 : 0,
                    currentTask: newState === 'WORKING' ? 'Executing Active Cyber Operations' : newState === 'FREE' ? 'Resting on Cyber Sofa' : 'Disconnected'
                };
            }
            return a;
        }));
        if (selectedAgent && selectedAgent.id === agentId) {
            setSelectedAgent(prev => ({
                ...prev,
                state: newState,
                cpu: newState === 'WORKING' ? 78 : newState === 'FREE' ? 12 : 0
            }));
        }
    };

    return (
        <div className="w-full mt-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                <div>
                    <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-neon" />
                        Agent Operations Hub & Cyber Lounge
                    </h3>
                    <p className="text-xs text-gray-400">
                        Real-time presence: Offline agents are absent, free agents are resting with a drink, active agents are locked into their workstations.
                    </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-cyan-400 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                        {agents.filter(a => a.state === 'WORKING').length} Locked In
                    </span>
                    <span className="text-gray-500">•</span>
                    <span className="text-amber-400">{agents.filter(a => a.state === 'FREE').length} Resting</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-400">{agents.filter(a => a.state === 'OFFLINE').length} Offline</span>
                </div>
            </div>

            {/* Grid of Agent Workstations */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {agents.map((agent) => (
                    <div
                        key={agent.id}
                        onClick={() => setSelectedAgent(agent)}
                        className={`relative rounded-2xl p-4 transition-all duration-300 cursor-pointer overflow-hidden border ${
                            agent.state === 'WORKING'
                                ? 'bg-gradient-to-b from-[#121c32] to-[#0d1424] border-cyan-500/50 shadow-[0_0_20px_rgba(0,210,255,0.2)] hover:border-cyan-400 hover:scale-[1.02]'
                                : agent.state === 'FREE'
                                    ? 'bg-gradient-to-b from-[#181d2a] to-[#0e121d] border-amber-500/30 hover:border-amber-400/60 hover:scale-[1.01]'
                                    : 'bg-[#090d15]/80 border-white/5 opacity-60 hover:opacity-85'
                        }`}
                    >
                        {/* Top Header Card Info */}
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h4 className="text-sm font-bold text-white flex items-center gap-1.5 mb-0.5">
                                    <span className="text-cyan-400">{agent.icon}</span>
                                    {agent.name}
                                </h4>
                                <span className="text-[10px] text-gray-400 font-mono">{agent.role}</span>
                            </div>

                            {/* State Tag */}
                            {agent.state === 'WORKING' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-neon animate-pulse">
                                    LOCKED IN
                                </span>
                            )}
                            {agent.state === 'FREE' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                    RESTING ☕
                                </span>
                            )}
                            {agent.state === 'OFFLINE' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-700/40 text-gray-400 border border-white/10">
                                    OFFLINE
                                </span>
                            )}
                        </div>

                        {/* Visual Animation Scene per State */}
                        <div className="w-full h-36 rounded-xl bg-black/40 border border-white/5 relative flex items-center justify-center overflow-hidden mb-3">
                            
                            {/* --- STATE 1: WORKING (LOCKED IN) --- */}
                            {agent.state === 'WORKING' && (
                                <div className="w-full h-full relative flex flex-col items-center justify-center">
                                    {/* Matrix Data Stream on Curved Triple Monitors */}
                                    <div className="absolute top-2 w-full flex justify-center items-center gap-1.5 px-4">
                                        {/* Left Monitor */}
                                        <div className="w-12 h-14 rounded-md bg-[#041c1b] border border-emerald-500/60 p-1 flex flex-col justify-around overflow-hidden shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                                            <div className="w-full h-1 bg-emerald-400/80 animate-pulse" />
                                            <div className="w-3/4 h-1 bg-emerald-400/60" />
                                            <div className="w-full h-1 bg-emerald-400/80 animate-pulse" />
                                            <div className="w-2/3 h-1 bg-emerald-400/60" />
                                        </div>

                                        {/* Center Main Ultra-Wide Monitor */}
                                        <div className="w-20 h-16 rounded-md bg-[#071927] border-2 border-cyan-400 p-1.5 flex flex-col justify-between overflow-hidden shadow-[0_0_15px_rgba(0,210,255,0.5)]">
                                            <div className="flex justify-between items-center text-[7px] text-cyan-300 font-mono">
                                                <span>EXEC</span>
                                                <span className="animate-ping font-bold">●</span>
                                            </div>
                                            <div className="space-y-0.5">
                                                <div className="w-full h-1 bg-cyan-400 animate-pulse" />
                                                <div className="w-4/5 h-1 bg-cyan-300" />
                                                <div className="w-full h-1 bg-cyan-400/80" />
                                            </div>
                                            <div className="text-[6px] font-mono text-cyan-400 truncate">SYS.RUN(0x8F)</div>
                                        </div>

                                        {/* Right Monitor */}
                                        <div className="w-12 h-14 rounded-md bg-[#160b29] border border-purple-500/60 p-1 flex flex-col justify-around overflow-hidden shadow-[0_0_10px_rgba(168,85,247,0.3)]">
                                            <div className="w-full h-1 bg-purple-400/80" />
                                            <div className="w-2/3 h-1 bg-purple-400/60 animate-pulse" />
                                            <div className="w-4/5 h-1 bg-purple-400/80" />
                                        </div>
                                    </div>

                                    {/* Agent Avatar - Locked In Typing at Keyboard */}
                                    <div className="absolute bottom-2 flex flex-col items-center">
                                        {/* Head & Cyber Visor */}
                                        <div className="relative">
                                            <div className="w-7 h-7 rounded-full bg-cyan-900 border-2 border-cyan-400 flex items-center justify-center shadow-neon">
                                                {/* Visor glowing line */}
                                                <div className="w-5 h-1.5 rounded-full bg-cyan-300 animate-pulse shadow-[0_0_8px_#00d2ff]" />
                                            </div>
                                            {/* Neural Link Beam connecting upward */}
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-gradient-to-t from-cyan-400 to-transparent animate-pulse" />
                                        </div>

                                        {/* Shoulders & Fast Typing Arms */}
                                        <div className="w-12 h-4 bg-gray-800 rounded-t-md mt-0.5 flex justify-between px-1 items-end">
                                            <div className="w-2.5 h-2 bg-cyan-400/90 rounded-sm animate-bounce" />
                                            <div className="w-2.5 h-2 bg-cyan-400/90 rounded-sm animate-bounce" style={{ animationDelay: '0.15s' }} />
                                        </div>

                                        {/* Glowing Mechanical Keyboard */}
                                        <div className="w-16 h-2 rounded-sm bg-cyan-950 border border-cyan-400/80 flex items-center justify-center shadow-[0_0_8px_rgba(0,210,255,0.6)]">
                                            <div className="w-12 h-0.5 bg-cyan-300/70" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- STATE 2: FREE (RESTING / DRINK / SOFA) --- */}
                            {agent.state === 'FREE' && (
                                <div className="w-full h-full relative flex flex-col items-center justify-center">
                                    {/* Lounge Cyber Sofa Recliner */}
                                    <div className="w-32 h-14 bg-gradient-to-r from-[#2a241b] via-[#3d3221] to-[#2a241b] rounded-t-2xl border-t border-amber-500/40 shadow-inner flex items-center justify-center relative">
                                        
                                        {/* Agent Avatar Reclined on Sofa */}
                                        <div className="flex items-center gap-2">
                                            {/* Relaxed Head */}
                                            <div className="w-7 h-7 rounded-full bg-amber-950 border border-amber-400 flex items-center justify-center relative">
                                                {/* Peaceful Eyes */}
                                                <span className="text-[10px] text-amber-300">^‿^</span>
                                            </div>

                                            {/* Steaming Coffee / Cyber Drink */}
                                            <div className="relative flex flex-col items-center">
                                                {/* Animated Rising Steam Wisps */}
                                                <div className="flex gap-0.5 -mt-2 mb-0.5">
                                                    <span className="text-[9px] text-amber-200/80 animate-pulse">~</span>
                                                    <span className="text-[10px] text-amber-200/90 animate-bounce">~</span>
                                                </div>
                                                {/* Warm Coffee Mug */}
                                                <div className="w-5 h-5 rounded-md bg-amber-600 border border-amber-300 flex items-center justify-center text-[10px] text-white shadow-md">
                                                    ☕
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Chill Lounge Ambient Label */}
                                    <div className="absolute bottom-2 text-center">
                                        <span className="text-[10px] font-mono text-amber-300/90 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-500/30">
                                            Enjoying {agent.drink}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* --- STATE 3: OFFLINE (NOT PRESENT / ABSENT) --- */}
                            {agent.state === 'OFFLINE' && (
                                <div className="w-full h-full relative flex flex-col items-center justify-center opacity-60">
                                    {/* Empty Dark Desks & Swivel Chair */}
                                    <div className="w-20 h-12 rounded border border-dashed border-gray-700 bg-gray-900/40 flex flex-col items-center justify-center p-2 mb-1">
                                        <PoweroffOutlined className="text-xl text-gray-600 mb-1" />
                                        <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">
                                            NO SIGNAL
                                        </span>
                                    </div>

                                    {/* Empty Swivel Chair - Absent */}
                                    <div className="w-8 h-8 rounded-full border border-gray-700 bg-gray-800/50 flex items-center justify-center">
                                        <span className="text-[8px] text-gray-500 font-mono">VACANT</span>
                                    </div>

                                    <div className="absolute bottom-1">
                                        <span className="text-[9px] font-mono text-gray-500 italic">
                                            Agent not present at desk
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Bottom Status Info */}
                        <div className="space-y-1">
                            <div className="flex justify-between items-center text-[11px] font-mono">
                                <span className="text-gray-400">Load:</span>
                                <span className={agent.state === 'WORKING' ? 'text-cyan-400 font-bold' : 'text-gray-500'}>
                                    {agent.cpu}% CPU
                                </span>
                            </div>
                            <Progress 
                                percent={agent.cpu} 
                                size="small" 
                                showInfo={false} 
                                strokeColor={agent.state === 'WORKING' ? '#00d2ff' : agent.state === 'FREE' ? '#f59e0b' : '#374151'} 
                                trailColor="rgba(255,255,255,0.05)"
                            />
                            <div className="text-[10px] text-gray-400 truncate pt-0.5">
                                {agent.currentTask}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Workstation Inspection & State Override Modal */}
            {selectedAgent && (
                <Modal
                    open={Boolean(selectedAgent)}
                    onCancel={() => setSelectedAgent(null)}
                    footer={null}
                    title={
                        <div className="flex items-center gap-2 text-white">
                            <span className="text-cyan-400">{selectedAgent.icon}</span>
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
                    <div className="py-2 space-y-4 text-gray-200">
                        {/* Status banner */}
                        <div className="flex justify-between items-center bg-[#151d32] p-3 rounded-xl border border-white/10">
                            <div>
                                <div className="text-xs text-gray-400 font-mono">OPERATIONAL STATUS</div>
                                <div className="text-sm font-bold text-cyan-400">{selectedAgent.state}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-400 font-mono">HARDWARE UTILIZATION</div>
                                <div className="text-sm font-bold text-white">{selectedAgent.cpu}% CPU • 4.2 GB VRAM</div>
                            </div>
                        </div>

                        {/* Interactive State Switcher for User Testing */}
                        <div>
                            <label className="text-xs font-mono text-gray-400 mb-2 block uppercase tracking-wider">
                                Simulate / Override Agent Physical State:
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                <Button
                                    type={selectedAgent.state === 'WORKING' ? 'primary' : 'default'}
                                    onClick={() => handleStateChange(selectedAgent.id, 'WORKING')}
                                    className={selectedAgent.state === 'WORKING' ? 'bg-[#00d2ff] text-black font-semibold' : 'border-white/10 text-gray-300'}
                                    icon={<LaptopOutlined />}
                                >
                                    Locked In
                                </Button>
                                <Button
                                    type={selectedAgent.state === 'FREE' ? 'primary' : 'default'}
                                    onClick={() => handleStateChange(selectedAgent.id, 'FREE')}
                                    className={selectedAgent.state === 'FREE' ? 'bg-amber-500 text-black font-semibold' : 'border-white/10 text-gray-300'}
                                    icon={<CoffeeOutlined />}
                                >
                                    Resting (Sofa)
                                </Button>
                                <Button
                                    type={selectedAgent.state === 'OFFLINE' ? 'primary' : 'default'}
                                    onClick={() => handleStateChange(selectedAgent.id, 'OFFLINE')}
                                    className={selectedAgent.state === 'OFFLINE' ? 'bg-gray-600 text-white font-semibold' : 'border-white/10 text-gray-300'}
                                    icon={<PoweroffOutlined />}
                                >
                                    Go Offline
                                </Button>
                            </div>
                        </div>

                        {/* Terminal Telemetry Feed */}
                        <div className="bg-black/80 rounded-xl p-3 border border-white/10 font-mono text-xs space-y-1">
                            <div className="text-cyan-400">[TELEMETRY] Connected to Host node vmi3682971</div>
                            <div className="text-gray-400">[KERNEL] PID 40912 bound to {selectedAgent.id}</div>
                            <div className="text-emerald-400">[STATE] Current: {selectedAgent.state} // {selectedAgent.currentTask}</div>
                            <div className="text-gray-500">[AUDIO-SYNC] Subscribed to Central Digital Globe signals broadcast</div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default AgentWorkstations;
