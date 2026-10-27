import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Tooltip, Badge } from 'antd';
import { 
    DesktopOutlined, 
    CoffeeOutlined, 
    LaptopOutlined, 
    PoweroffOutlined,
    UserOutlined,
    InfoCircleOutlined,
    ReloadOutlined
} from '@ant-design/icons';
import { agentApi } from '../../api/agentApi';

/**
 * SimsAgentHouse (3D Roof-Off Architectural Smart HQ)
 * - Structured into 3 Specialized Workstation Wings + 1 Grand Recreation & Living Haven:
 *   1. Master Command Bridge (Top-Left) -> AEGIS Core Orchestrator
 *   2. Quantum Synthesis Lab (Top-Right) -> Antigravity Coder
 *   3. Data Vault & Cyber Radar Intelligence Wing (Bottom-Left) -> Database Agent + Web Research Agent
 *   4. Grand Recreation, Social & Living Haven (Bottom-Right) -> Espresso Bar, Retro Arcade, Cyber Sofa, Sleep Pods
 * - Architectural floor plan with organic open-plan layout, custom floor textures, open archways, and glass dividers
 * - Natural hallway & doorway pathfinding with realistic dwell times (18-30s work, 12-20s lounge breaks)
 * - 100% Real-time telemetry, strictly restricted to the 4 canonical agents from the plan
 */

const WINGS = {
    bridge: {
        id: 'bridge',
        name: 'Master Command Bridge',
        icon: '💻',
        color: '#00d2ff',
        bg: 'rgba(0, 210, 255, 0.08)',
        border: 'rgba(0, 210, 255, 0.35)',
        door: { x: 185, y: 155 },
        stations: {
            master: { x: 80, y: 80, role: 'master_console', label: 'Command Console', thought: '⚡' },
            holo: { x: 135, y: 110, role: 'holo_globe', label: 'Tactical Holo-Globe', thought: '🌐' }
        }
    },
    quantum_lab: {
        id: 'quantum_lab',
        name: 'Quantum Synthesis Lab',
        icon: '⚡',
        color: '#a855f7',
        bg: 'rgba(168, 85, 247, 0.08)',
        border: 'rgba(168, 85, 247, 0.35)',
        door: { x: 235, y: 155 },
        stations: {
            ide: { x: 285, y: 75, role: 'compiler', label: 'Quantum IDE', thought: '💻' },
            bench: { x: 345, y: 95, role: 'hardware_bench', label: 'Synthesizer Bench', thought: '⚡' }
        }
    },
    data_radar: {
        id: 'data_radar',
        name: 'Data & Radar Intelligence Wing',
        icon: '🗄️',
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.08)',
        border: 'rgba(16, 185, 129, 0.35)',
        door: { x: 185, y: 245 },
        stations: {
            sql: { x: 95, y: 235, role: 'sql_terminal', label: 'SQL Matrix Terminal', thought: '🗄️' },
            servers: { x: 50, y: 275, role: 'servers', label: 'High-Density Clusters', thought: '📊' },
            recon: { x: 110, y: 365, role: 'recon_desk', label: 'Web Recon Terminal', thought: '📡' },
            radar: { x: 55, y: 385, role: 'satellite_dish', label: 'Satellite Scanner', thought: '🛰️' }
        }
    },
    lounge: {
        id: 'lounge',
        name: 'Grand Recreation & Living Haven',
        icon: '☕',
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.08)',
        border: 'rgba(245, 158, 11, 0.35)',
        door: { x: 235, y: 245 },
        stations: {
            coffee_bar: { x: 265, y: 235, role: 'bar_stool', label: 'Espresso Bar', thought: '☕' },
            arcade: { x: 350, y: 235, role: 'arcade_cabinet', label: 'Retro Arcade', thought: '🎮' },
            sofa: { x: 280, y: 335, role: 'couch', label: 'Cyber Lounge Sofa', thought: '🛋️' },
            pod: { x: 350, y: 375, role: 'sleep_pod', label: 'Cryo-Sleep Pod', thought: '💤' }
        }
    }
};

const CANONICAL_IDS = ['agent-core-1', 'agent-db-worker', 'agent-research-1', 'agent-coder-x'];

const DEFAULT_AGENTS = [
    {
        id: 'agent-core-1',
        name: 'AEGIS Core Orchestrator',
        role: 'Mission Lead & System Orchestrator',
        type: 'System',
        status: 'ONLINE',
        homeWing: 'bridge',
        defaultStation: 'master',
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
        defaultStation: 'sql',
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
        defaultStation: 'recon',
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
        defaultStation: 'ide',
        currentTask: 'Pod Hibernation (Recreation Bay)',
        cpu: 0,
        memory: '0 GB',
        capabilities: ['fs.write', 'git.commit', 'ide.edit'],
        drink: 'None',
        persona: { outfitColor: '#a855f7', hairColor: '#4c1d95', accessory: 'hoodie', title: 'Hacker' }
    }
];

const SimsAgentHouse = ({ liveTasks = [] }) => {
    const [agents, setAgents] = useState(DEFAULT_AGENTS);
    const [hostTelemetry, setHostTelemetry] = useState({ hostMemory: '1.4 GB / 7.8 GB (19%)' });
    const [houseStats, setHouseStats] = useState({ workingCount: 0, idleCount: 3, offlineCount: 1 });
    const [selectedAgent, setSelectedAgent] = useState(null);
    const [activeWingFilter, setActiveWingFilter] = useState(null);
    const [loading, setLoading] = useState(false);

    // Positions, velocities and animation states for Sims roaming personas
    const agentSimStatesRef = useRef({});
    const animFrameRef = useRef(null);
    const [tick, setTick] = useState(0);

    // Fetch live agents & real system telemetry from backend
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
                syncAgentWaypoints(canonicalAgents);
            }
        } catch (err) {
            console.error('Failed to fetch real-time agents:', err);
        }
    };

    useEffect(() => {
        syncAgentWaypoints(DEFAULT_AGENTS);
        fetchLiveAgents();
        const interval = setInterval(fetchLiveAgents, 4000);
        return () => clearInterval(interval);
    }, []);

    // Initialize or steer agent targets
    const syncAgentWaypoints = (agentList) => {
        agentList.forEach((a, idx) => {
            const wingKey = a.homeWing || (a.id === 'agent-core-1' ? 'bridge' : a.id === 'agent-coder-x' ? 'quantum_lab' : 'data_radar');
            const wing = WINGS[wingKey];
            const defStationKey = a.id === 'agent-research-1' ? 'recon' : a.id === 'agent-db-worker' ? 'sql' : Object.keys(wing.stations)[0];
            const station = wing.stations[defStationKey] || Object.values(wing.stations)[0];

            if (!agentSimStatesRef.current[a.id]) {
                const isOffline = a.status === 'OFFLINE';
                const initialPos = isOffline ? WINGS.lounge.stations.pod : station;

                agentSimStatesRef.current[a.id] = {
                    x: initialPos.x,
                    y: initialPos.y,
                    targetX: initialPos.x,
                    targetY: initialPos.y,
                    pathQueue: [],
                    currentWing: isOffline ? 'lounge' : wingKey,
                    facing: 'down',
                    thought: isOffline ? '💤' : a.status === 'BUSY' ? '⚡' : station.thought,
                    nextWanderTime: Date.now() + 16000 + idx * 5000,
                    walkCycle: 0
                };
            } else {
                const sim = agentSimStatesRef.current[a.id];
                if (a.status === 'BUSY') {
                    // Lock into home station immediately
                    sim.pathQueue = [
                        { x: sim.x, y: 200 },
                        { x: wing.door.x, y: wing.door.y },
                        { x: station.x, y: station.y }
                    ];
                    sim.thought = '⚡';
                    sim.currentWing = wingKey;
                } else if (a.status === 'OFFLINE') {
                    sim.targetX = WINGS.lounge.stations.pod.x;
                    sim.targetY = WINGS.lounge.stations.pod.y;
                    sim.thought = '💤';
                    sim.currentWing = 'lounge';
                }
            }
        });
    };

    // Autonomous Roaming Game Loop: agents dwell 18-30s at stations, then visit the Grand Recreation Haven!
    useEffect(() => {
        let lastTime = performance.now();

        const updateSimulation = (currentTime) => {
            const dt = Math.min(0.08, (currentTime - lastTime) / 1000);
            lastTime = currentTime;
            const now = Date.now();

            agents.forEach((agent) => {
                const sim = agentSimStatesRef.current[agent.id];
                if (!sim) return;

                const homeWingKey = agent.homeWing || (agent.id === 'agent-core-1' ? 'bridge' : agent.id === 'agent-coder-x' ? 'quantum_lab' : 'data_radar');
                const homeWing = WINGS[homeWingKey];

                // 1. Pick a roaming target when dwell timer elapses
                if (agent.status === 'ONLINE' && now > sim.nextWanderTime && sim.pathQueue.length === 0) {
                    const isAtHome = sim.currentWing === homeWingKey;

                    if (isAtHome) {
                        // 65% chance to wander into the Grand Recreation Haven for coffee, games, or sofa!
                        const loungeStations = [
                            WINGS.lounge.stations.coffee_bar,
                            WINGS.lounge.stations.arcade,
                            WINGS.lounge.stations.sofa
                        ];
                        const chosenActivity = loungeStations[Math.floor(Math.random() * loungeStations.length)];

                        // Route through doorways and central atrium:
                        sim.pathQueue = [
                            { x: homeWing.door.x, y: homeWing.door.y },
                            { x: 210, y: 200 }, // Central Atrium nexus
                            { x: WINGS.lounge.door.x, y: WINGS.lounge.door.y },
                            { x: chosenActivity.x, y: chosenActivity.y }
                        ];
                        sim.targetWing = 'lounge';
                        sim.thought = chosenActivity.thought;
                        sim.nextWanderTime = now + 14000 + Math.random() * 8000; // Stay at recreation lounge for 14-22s
                    } else {
                        // Return to home workstation
                        const stationKeys = Object.keys(homeWing.stations);
                        const chosenKey = (agent.id === 'agent-db-worker') ? 'sql' :
                                          (agent.id === 'agent-research-1') ? 'recon' : stationKeys[0];
                        const station = homeWing.stations[chosenKey];

                        sim.pathQueue = [
                            { x: WINGS.lounge.door.x, y: WINGS.lounge.door.y },
                            { x: 210, y: 200 }, // Central Atrium nexus
                            { x: homeWing.door.x, y: homeWing.door.y },
                            { x: station.x, y: station.y }
                        ];
                        sim.targetWing = homeWingKey;
                        sim.thought = station.thought;
                        sim.nextWanderTime = now + 20000 + Math.random() * 12000; // Dwell at work station for 20-32s
                    }
                }

                // 2. Consume path queue
                if (sim.pathQueue.length > 0 && Math.hypot(sim.targetX - sim.x, sim.targetY - sim.y) < 3) {
                    const nextNode = sim.pathQueue.shift();
                    sim.targetX = nextNode.x;
                    sim.targetY = nextNode.y;
                    if (sim.pathQueue.length === 0 && sim.targetWing) {
                        sim.currentWing = sim.targetWing;
                    }
                }

                // 3. Move smoothly towards target
                const dx = sim.targetX - sim.x;
                const dy = sim.targetY - sim.y;
                const dist = Math.hypot(dx, dy);

                if (dist > 1.5) {
                    const speed = 36;
                    sim.x += (dx / dist) * speed * dt;
                    sim.y += (dy / dist) * speed * dt;
                    sim.walkCycle = (sim.walkCycle + dt * 6) % 1;
                    sim.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
                } else {
                    sim.walkCycle = 0;
                }
            });

            setTick(prev => (prev + 1) % 10000);
            animFrameRef.current = requestAnimationFrame(updateSimulation);
        };

        animFrameRef.current = requestAnimationFrame(updateSimulation);
        return () => cancelAnimationFrame(animFrameRef.current);
    }, [agents]);

    return (
        <div className="w-full h-[650px] rounded-3xl bg-gradient-to-b from-[#0a0f1b] via-[#080d16] to-[#060a11] border border-white/15 p-3 flex flex-col justify-between shadow-[0_16px_48px_rgba(0,0,0,0.85)] overflow-hidden select-none">
            {/* Header: Roof-Off Title & Telemetry Counters */}
            <div className="flex justify-between items-center px-1 pb-1.5 border-b border-white/5 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-neon animate-pulse" />
                    <div>
                        <h3 className="text-xs font-bold text-white tracking-wider uppercase mb-0 flex items-center gap-1.5">
                            AEGIS SMART HQ
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 font-mono">
                                3 WINGS + RECREATION
                            </span>
                        </h3>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] font-mono">
                    <span className="text-cyan-400 font-semibold">{houseStats.workingCount} Working</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-amber-400 font-semibold">{houseStats.idleCount} Idle</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-400">{houseStats.offlineCount} Off</span>
                    <button 
                        onClick={() => { setLoading(true); fetchLiveAgents().finally(() => setLoading(false)); }}
                        className="ml-1 text-gray-400 hover:text-white transition-colors cursor-pointer"
                        title="Refresh Agents"
                    >
                        <ReloadOutlined spin={loading} />
                    </button>
                </div>
            </div>

            {/* Architectural 3D Roof-Off SVG Canvas */}
            <div className="flex-1 relative w-full h-full min-h-0 my-1 rounded-2xl bg-[#060910] border border-white/10 overflow-hidden shadow-inner flex items-center justify-center">
                <svg
                    viewBox="0 0 420 460"
                    className="w-full h-full object-contain"
                    preserveAspectRatio="xMidYMid meet"
                >
                    <defs>
                        {/* Floor textures */}
                        <pattern id="hexGrid" width="16" height="16" patternUnits="userSpaceOnUse">
                            <path d="M 16 0 L 0 0 0 16" fill="none" stroke="rgba(0, 210, 255, 0.04)" strokeWidth="0.8" />
                        </pattern>
                        <pattern id="matrixGrid" width="14" height="14" patternUnits="userSpaceOnUse">
                            <path d="M 14 0 L 0 0 0 14" fill="none" stroke="rgba(16, 185, 129, 0.04)" strokeWidth="0.8" />
                        </pattern>
                        <pattern id="woodPlanks" width="30" height="10" patternUnits="userSpaceOnUse">
                            <rect width="30" height="10" fill="#140f0c" />
                            <line x1="0" y1="10" x2="30" y2="10" stroke="rgba(245, 158, 11, 0.08)" strokeWidth="0.8" />
                            <line x1="30" y1="0" x2="30" y2="10" stroke="rgba(245, 158, 11, 0.06)" strokeWidth="0.8" />
                        </pattern>
                        <linearGradient id="atriumGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#00d2ff" stopOpacity="0.08" />
                            <stop offset="50%" stopColor="#ec4899" stopOpacity="0.03" />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.06" />
                        </linearGradient>
                    </defs>

                    {/* Outer Smart House Architectural Walls */}
                    <rect x="6" y="6" width="408" height="448" rx="20" fill="#070a13" stroke="rgba(0, 210, 255, 0.35)" strokeWidth="2.5" />

                    {/* Central Glass Atrium Linking All Wings */}
                    <path 
                        d="M 180 14 L 240 14 L 240 446 L 180 446 Z" 
                        fill="url(#atriumGlow)" 
                    />
                    <path 
                        d="M 14 185 L 406 185 L 406 215 L 14 215 Z" 
                        fill="url(#atriumGlow)" 
                    />

                    {/* Center Nexus Circle with Orbiting Power Core */}
                    <circle cx="210" cy="200" r="18" fill="#090e1a" stroke="rgba(0, 210, 255, 0.5)" strokeWidth="1.5" />
                    <circle cx="210" cy="200" r="9" fill="none" stroke="#00d2ff" strokeWidth="1" className="animate-spin" strokeDasharray="4 2" />
                    <circle cx="210" cy="200" r="3.5" fill="#00d2ff" className="animate-pulse" />

                    {/* =========================================================================
                        WING 1 (Top-Left): MASTER COMMAND BRIDGE (AEGIS Core Orchestrator)
                       ========================================================================= */}
                    <g 
                        className="cursor-pointer"
                        onClick={() => setActiveWingFilter(activeWingFilter === 'bridge' ? null : 'bridge')}
                    >
                        {/* Floor Boundary with Hex Texture */}
                        <path 
                            d="M 14 14 L 185 14 L 185 185 L 14 185 Z" 
                            fill={activeWingFilter === 'bridge' ? 'rgba(0, 210, 255, 0.18)' : 'rgba(0, 210, 255, 0.05)'} 
                        />
                        <path d="M 14 14 L 185 14 L 185 185 L 14 185 Z" fill="url(#hexGrid)" />
                        
                        {/* Glass Partition Wall & Open Archway */}
                        <line x1="185" y1="14" x2="185" y2="135" stroke="rgba(0, 210, 255, 0.4)" strokeWidth="2" strokeDasharray="6 3" />
                        <line x1="185" y1="175" x2="185" y2="185" stroke="rgba(0, 210, 255, 0.4)" strokeWidth="2" />
                        <line x1="14" y1="185" x2="185" y2="185" stroke="rgba(0, 210, 255, 0.3)" strokeWidth="1.5" />

                        {/* Title Badge */}
                        <rect x="22" y="24" width="130" height="15" rx="3" fill="rgba(0, 210, 255, 0.15)" stroke="rgba(0, 210, 255, 0.4)" strokeWidth="0.8" />
                        <text x="28" y="35" fill="#38bdf8" fontSize="8" fontWeight="bold" fontFamily="monospace">
                            💻 COMMAND BRIDGE
                        </text>

                        {/* Master Dual-Curved Console */}
                        <path d="M 45 65 Q 80 50 115 65 L 115 78 Q 80 63 45 78 Z" fill="#0f172a" stroke="#00d2ff" strokeWidth="1" />
                        <rect x="52" y="58" width="22" height="7" rx="1" fill="#00d2ff" opacity="0.9" />
                        <rect x="84" y="58" width="22" height="7" rx="1" fill="#38bdf8" opacity="0.9" />
                        {/* Commander Chair */}
                        <circle cx="80" cy="90" r="7.5" fill="#1e293b" stroke="#00d2ff" strokeWidth="1" />

                        {/* Tactical Holo-Globe Projector */}
                        <circle cx="140" cy="115" r="18" fill="#080f1d" stroke="rgba(0, 210, 255, 0.4)" strokeWidth="0.8" />
                        <circle cx="140" cy="115" r="11" fill="none" stroke="#00d2ff" strokeWidth="1" className="animate-spin" strokeDasharray="3 3" />
                        <circle cx="140" cy="115" r="4" fill="#38bdf8" className="animate-ping" opacity="0.5" />

                        {/* Strategic HUD Screen on Wall */}
                        <rect x="25" y="125" width="45" height="25" rx="3" fill="#091322" stroke="#0284c7" strokeWidth="0.7" />
                        <path d="M 30 137 L 42 131 L 52 142 L 64 133" fill="none" stroke="#38bdf8" strokeWidth="1" />
                    </g>

                    {/* =========================================================================
                        WING 2 (Top-Right): QUANTUM SYNTHESIS LAB (Antigravity Coder)
                       ========================================================================= */}
                    <g 
                        className="cursor-pointer"
                        onClick={() => setActiveWingFilter(activeWingFilter === 'quantum_lab' ? null : 'quantum_lab')}
                    >
                        {/* Floor Boundary */}
                        <path 
                            d="M 235 14 L 406 14 L 406 185 L 235 185 Z" 
                            fill={activeWingFilter === 'quantum_lab' ? 'rgba(168, 85, 247, 0.18)' : 'rgba(168, 85, 247, 0.05)'} 
                        />
                        {/* Glass Partition Wall & Open Archway */}
                        <line x1="235" y1="14" x2="235" y2="135" stroke="rgba(168, 85, 247, 0.4)" strokeWidth="2" strokeDasharray="6 3" />
                        <line x1="235" y1="175" x2="235" y2="185" stroke="rgba(168, 85, 247, 0.4)" strokeWidth="2" />
                        <line x1="235" y1="185" x2="406" y2="185" stroke="rgba(168, 85, 247, 0.3)" strokeWidth="1.5" />

                        {/* Title Badge */}
                        <rect x="245" y="24" width="130" height="15" rx="3" fill="rgba(168, 85, 247, 0.15)" stroke="rgba(168, 85, 247, 0.4)" strokeWidth="0.8" />
                        <text x="251" y="35" fill="#c084fc" fontSize="8" fontWeight="bold" fontFamily="monospace">
                            ⚡ QUANTUM LAB
                        </text>

                        {/* Quantum IDE Terminal (Dual vertical screens) */}
                        <rect x="260" y="55" width="55" height="26" rx="4" fill="#1e1b4b" stroke="#a855f7" strokeWidth="0.9" />
                        <rect x="267" y="58" width="18" height="12" rx="1" fill="#c084fc" opacity="0.9" />
                        <rect x="289" y="58" width="18" height="12" rx="1" fill="#e879f9" opacity="0.9" />
                        {/* Coder Gaming Chair */}
                        <circle cx="287" cy="94" r="7.5" fill="#3b0764" stroke="#a855f7" strokeWidth="1" />

                        {/* Synthesizer Hardware Bench with Oscillo Screen */}
                        <rect x="335" y="55" width="55" height="30" rx="3" fill="#181126" stroke="#9333ea" strokeWidth="0.8" />
                        <rect x="342" y="60" width="22" height="10" rx="1" fill="#10b981" opacity="0.8" />
                        <path d="M 344 65 Q 348 61 352 65 T 360 65" fill="none" stroke="#34d399" strokeWidth="0.8" />
                        {/* Power Conduits */}
                        <line x1="335" y1="120" x2="385" y2="120" stroke="#a855f7" strokeWidth="1" strokeDasharray="3 2" />
                    </g>

                    {/* =========================================================================
                        WING 3 (Bottom-Left): DATA & RADAR INTELLIGENCE WING (DB + Research)
                       ========================================================================= */}
                    <g 
                        className="cursor-pointer"
                        onClick={() => setActiveWingFilter(activeWingFilter === 'data_radar' ? null : 'data_radar')}
                    >
                        {/* Floor Boundary with Matrix Grid */}
                        <path 
                            d="M 14 215 L 185 215 L 185 446 L 14 446 Z" 
                            fill={activeWingFilter === 'data_radar' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(16, 185, 129, 0.05)'} 
                        />
                        <path d="M 14 215 L 185 215 L 185 446 L 14 446 Z" fill="url(#matrixGrid)" />
                        
                        {/* Corridor Divider & Open Archway */}
                        <line x1="185" y1="215" x2="185" y2="230" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="2" />
                        <line x1="185" y1="265" x2="185" y2="446" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="2" strokeDasharray="6 3" />

                        {/* Title Badge */}
                        <rect x="22" y="222" width="150" height="15" rx="3" fill="rgba(16, 185, 129, 0.15)" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="0.8" />
                        <text x="28" y="233" fill="#34d399" fontSize="7.5" fontWeight="bold" fontFamily="monospace">
                            🗄️ DATA & RADAR WING
                        </text>

                        {/* --- Section A: SQL Data Vault --- */}
                        {/* Server Towers with Cascading LEDs */}
                        <rect x="25" y="250" width="45" height="34" rx="3" fill="#042017" stroke="#10b981" strokeWidth="0.9" />
                        <circle cx="33" cy="260" r="2" fill="#10b981" className="animate-pulse" />
                        <circle cx="43" cy="260" r="2" fill="#34d399" />
                        <circle cx="53" cy="260" r="2" fill="#6ee7b7" />
                        <circle cx="33" cy="272" r="2" fill="#34d399" />
                        <circle cx="43" cy="272" r="2" fill="#10b981" className="animate-pulse" />

                        {/* SQL Matrix Terminal */}
                        <rect x="80" y="248" width="55" height="26" rx="4" fill="#061f18" stroke="#10b981" strokeWidth="0.8" />
                        <rect x="86" y="252" width="20" height="8" rx="1" fill="#34d399" opacity="0.9" />
                        <rect x="110" y="252" width="20" height="8" rx="1" fill="#10b981" opacity="0.9" />
                        <circle cx="107" cy="284" r="7" fill="#064e3b" stroke="#34d399" strokeWidth="0.8" />

                        {/* Levitating Emerald Data-Cube */}
                        <g transform="translate(155, 270)">
                            <rect x="-8" y="-8" width="16" height="16" rx="2" fill="none" stroke="#10b981" strokeWidth="1" className="animate-pulse" />
                            <circle cx="0" cy="0" r="2" fill="#6ee7b7" />
                        </g>

                        {/* Sub-Divider line within wing */}
                        <line x1="20" y1="315" x2="175" y2="315" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" strokeDasharray="3 3" />

                        {/* --- Section B: Cyber Radar & Web Recon --- */}
                        {/* Phased Satellite Radar Dish */}
                        <g transform="translate(50, 365)">
                            <circle cx="0" cy="0" r="17" fill="#1c1917" stroke="#f59e0b" strokeWidth="1" />
                            <ellipse cx="0" cy="0" rx="13" ry="6" fill="none" stroke="#fbbf24" strokeWidth="0.8" className="animate-spin" />
                            <circle cx="8" cy="-8" r="2" fill="#fef08a" className="animate-ping" opacity="0.6" />
                        </g>

                        {/* Recon Desk */}
                        <rect x="85" y="348" width="60" height="26" rx="4" fill="#292524" stroke="#f59e0b" strokeWidth="0.8" />
                        <rect x="91" y="352" width="14" height="8" rx="1" fill="#fbbf24" opacity="0.9" />
                        <rect x="108" y="352" width="14" height="8" rx="1" fill="#d97706" opacity="0.9" />
                        <rect x="125" y="352" width="14" height="8" rx="1" fill="#fbbf24" opacity="0.9" />
                        <circle cx="115" cy="384" r="7" fill="#44403c" stroke="#f59e0b" strokeWidth="0.8" />

                        {/* Global Feed Ticker */}
                        <rect x="25" y="415" width="145" height="16" rx="3" fill="#181512" stroke="rgba(245, 158, 11, 0.4)" strokeWidth="0.7" />
                        <text x="32" y="426" fill="#fbbf24" fontSize="6" fontFamily="monospace">
                            RECON: 48.2 GB/s • GLOBAL INDEXING
                        </text>
                    </g>

                    {/* =========================================================================
                        WING 4 (Bottom-Right): GRAND RECREATION & LIVING HAVEN (Entire Zone!)
                       ========================================================================= */}
                    <g 
                        className="cursor-pointer"
                        onClick={() => setActiveWingFilter(activeWingFilter === 'lounge' ? null : 'lounge')}
                    >
                        {/* Warm Hardwood Cyber Floor */}
                        <path 
                            d="M 235 215 L 406 215 L 406 446 L 235 446 Z" 
                            fill="url(#woodPlanks)" 
                        />
                        <path 
                            d="M 235 215 L 406 215 L 406 446 L 235 446 Z" 
                            fill={activeWingFilter === 'lounge' ? 'rgba(245, 158, 11, 0.22)' : 'rgba(245, 158, 11, 0.05)'} 
                        />

                        {/* Corridor Archway & Warm Glow Barrier */}
                        <line x1="235" y1="215" x2="235" y2="230" stroke="rgba(245, 158, 11, 0.4)" strokeWidth="2" />
                        <line x1="235" y1="265" x2="235" y2="446" stroke="rgba(245, 158, 11, 0.4)" strokeWidth="2" strokeDasharray="6 3" />

                        {/* Title Badge */}
                        <rect x="245" y="222" width="150" height="15" rx="3" fill="rgba(245, 158, 11, 0.15)" stroke="rgba(245, 158, 11, 0.4)" strokeWidth="0.8" />
                        <text x="251" y="233" fill="#fbbf24" fontSize="7.5" fontWeight="bold" fontFamily="monospace">
                            ☕ GRAND RECREATION HAVEN
                        </text>

                        {/* --- 1. Gourmet Cyber Espresso Bar --- */}
                        <rect x="245" y="248" width="55" height="18" rx="4" fill="#291a13" stroke="#f59e0b" strokeWidth="0.8" />
                        <rect x="250" y="251" width="12" height="12" rx="2" fill="#44403c" stroke="#f59e0b" strokeWidth="0.6" />
                        <circle cx="256" cy="257" r="2" fill="#fbbf24" />
                        <text x="254" y="248" fill="#fef08a" fontSize="6" className="animate-bounce">~</text>
                        {/* Bar Stools */}
                        <circle cx="270" cy="275" r="5" fill="#78350f" stroke="#fbbf24" strokeWidth="0.6" />
                        <circle cx="290" cy="275" r="5" fill="#78350f" stroke="#fbbf24" strokeWidth="0.6" />

                        {/* --- 2. Retro Arcade Corner --- */}
                        <g transform="translate(330, 246)">
                            {/* Arcade Cabinet 1: Galaxia */}
                            <rect x="0" y="0" width="22" height="26" rx="3" fill="#2e1065" stroke="#c084fc" strokeWidth="1" />
                            <rect x="3" y="3" width="16" height="11" rx="1" fill="#ec4899" className="animate-pulse" />
                            <circle cx="11" cy="20" r="1.8" fill="#f43f5e" />
                            {/* Arcade Cabinet 2: Cyber Fighter */}
                            <rect x="28" y="0" width="22" height="26" rx="3" fill="#1e1b4b" stroke="#38bdf8" strokeWidth="1" />
                            <rect x="31" y="3" width="16" height="11" rx="1" fill="#00d2ff" className="animate-pulse" />
                            <circle cx="39" cy="20" r="1.8" fill="#38bdf8" />
                        </g>

                        {/* --- 3. Living Room Lounge Area --- */}
                        {/* Sectional Cyber Sofa */}
                        <rect x="245" y="315" width="60" height="24" rx="6" fill="#1c1f2e" stroke="#60a5fa" strokeWidth="0.8" />
                        <rect x="290" y="339" width="15" height="26" rx="4" fill="#1c1f2e" stroke="#60a5fa" strokeWidth="0.8" />
                        
                        {/* Lounge Rug */}
                        <rect x="240" y="348" width="46" height="30" rx="4" fill="rgba(245, 158, 11, 0.12)" stroke="rgba(245, 158, 11, 0.3)" strokeWidth="0.6" />
                        
                        {/* Glass Coffee Table with Holographic Centerpiece */}
                        <rect x="250" y="354" width="26" height="16" rx="3" fill="#0b1120" stroke="#38bdf8" strokeWidth="0.7" />
                        <circle cx="263" cy="362" r="3" fill="#38bdf8" className="animate-ping" opacity="0.4" />

                        {/* Potted Cyber Bonsai Flora */}
                        <circle cx="250" cy="415" r="9" fill="#064e3b" stroke="#10b981" strokeWidth="0.8" />
                        <circle cx="250" cy="415" r="4" fill="#34d399" />

                        {/* --- 4. Acoustic Cryo-Sleep Pod Nook --- */}
                        <g transform="translate(328, 335)">
                            <rect x="0" y="0" width="45" height="74" rx="12" fill="#0c1220" stroke="#a855f7" strokeWidth="1" />
                            <rect x="6" y="8" width="33" height="44" rx="8" fill="rgba(168, 85, 247, 0.15)" stroke="rgba(168, 85, 247, 0.4)" strokeWidth="0.8" />
                            <circle cx="22" cy="62" r="2.5" fill="#c084fc" className="animate-ping" opacity="0.4" />
                            <circle cx="22" cy="62" r="1.5" fill="#c084fc" />
                            <text x="22" y="32" textAnchor="middle" fill="#c084fc" fontSize="6.5" fontFamily="monospace">POD 01</text>
                            <text x="22" y="70" textAnchor="middle" fill="#64748b" fontSize="5" fontFamily="monospace">CRYO-BAY</text>
                        </g>
                    </g>

                    {/* =========================================================================
                        RENDER THE 4 CANONICAL AGENT PERSONAS (Walking, Thinking & Relaxing)
                       ========================================================================= */}
                    {agents.map((agent) => {
                        const sim = agentSimStatesRef.current[agent.id] || { x: 100, y: 100, thought: '☕', walkCycle: 0 };
                        const isSelected = selectedAgent?.id === agent.id;
                        const isWorking = agent.status === 'BUSY';
                        const isOffline = agent.status === 'OFFLINE';

                        const outfitColor = agent.persona?.outfitColor || '#00d2ff';
                        const hairColor = agent.persona?.hairColor || '#1e293b';
                        const bobOffset = Math.sin(sim.walkCycle * Math.PI * 2) * 2;

                        return (
                            <g
                                key={agent.id}
                                className="cursor-pointer transition-transform duration-75"
                                transform={`translate(${sim.x}, ${sim.y + bobOffset})`}
                                onClick={() => setSelectedAgent(agent)}
                            >
                                {/* Selection Reticle */}
                                {isSelected && (
                                    <ellipse 
                                        cx="0" cy="10" rx="14" ry="7" 
                                        fill="none" stroke="#00d2ff" strokeWidth="1.5" 
                                        strokeDasharray="3 2" className="animate-spin" 
                                    />
                                )}

                                {/* Persona Shadow */}
                                <ellipse cx="0" cy="10" rx="10" ry="4" fill="rgba(0,0,0,0.5)" />

                                {/* Persona Legs (Walking cycle animation) */}
                                <rect x="-5" y="4" width="3" height="7" rx="1" fill="#0f172a" />
                                <rect x="2" y="4" width="3" height="7" rx="1" fill="#0f172a" />

                                {/* Persona Torso with Outfit Color */}
                                <rect 
                                    x="-8" y="-7" width="16" height="13" 
                                    rx="3" fill={outfitColor} 
                                    stroke="rgba(255,255,255,0.4)" strokeWidth="0.6" 
                                />

                                {/* Persona Head */}
                                <circle cx="0" cy="-13" r="7" fill="#fed7aa" stroke="rgba(0,0,0,0.3)" strokeWidth="0.5" />

                                {/* Persona Hair */}
                                <path 
                                    d="M -7 -15 Q 0 -22 7 -15 Q 6 -12 4 -12 Q 0 -14 -4 -12 Z" 
                                    fill={hairColor} 
                                />

                                {/* Persona Eyes */}
                                <circle cx="-2.5" cy="-13" r="0.9" fill="#0f172a" />
                                <circle cx="2.5" cy="-13" r="0.9" fill="#0f172a" />

                                {/* Active Task Halo Glow */}
                                {isWorking && (
                                    <circle cx="0" cy="-13" r="10" fill="none" stroke="#00d2ff" strokeWidth="1" className="animate-ping" opacity="0.7" />
                                )}

                                {/* Animated Sims Thought Bubble */}
                                <g transform="translate(6, -26)">
                                    <rect x="-8" y="-9" width="18" height="14" rx="4" fill="#0f172a" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
                                    <polygon points="-3,5 1,5 -1,8" fill="#0f172a" />
                                    <text x="1" y="2" textAnchor="middle" fontSize="9" dominantBaseline="middle">
                                        {sim.thought || (isWorking ? '⚡' : isOffline ? '💤' : '☕')}
                                    </text>
                                </g>

                                {/* Name Tag Label Below Persona */}
                                <rect 
                                    x="-32" y="15" width="64" height="12" 
                                    rx="3" fill="rgba(11, 15, 25, 0.9)" 
                                    stroke="rgba(255,255,255,0.18)" strokeWidth="0.6" 
                                />
                                <text 
                                    x="0" y="24" textAnchor="middle" 
                                    fill="white" fontSize="6.5" fontWeight="bold" fontFamily="monospace"
                                >
                                    {agent.name.split(' ')[0]}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* Bottom Wing Navigation & Status Footer */}
            <div className="flex justify-between items-center px-1 pt-1 border-t border-white/5 text-[10px] font-mono text-gray-400 flex-shrink-0">
                <div className="flex gap-1.5">
                    <span 
                        onClick={() => setActiveWingFilter('bridge')}
                        className={`cursor-pointer px-2 py-0.5 rounded transition-colors ${activeWingFilter === 'bridge' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
                    >
                        💻 Bridge
                    </span>
                    <span 
                        onClick={() => setActiveWingFilter('quantum_lab')}
                        className={`cursor-pointer px-2 py-0.5 rounded transition-colors ${activeWingFilter === 'quantum_lab' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
                    >
                        ⚡ Quantum Lab
                    </span>
                    <span 
                        onClick={() => setActiveWingFilter('data_radar')}
                        className={`cursor-pointer px-2 py-0.5 rounded transition-colors ${activeWingFilter === 'data_radar' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
                    >
                        🗄️ Data & Radar
                    </span>
                    <span 
                        onClick={() => setActiveWingFilter('lounge')}
                        className={`cursor-pointer px-2 py-0.5 rounded transition-colors ${activeWingFilter === 'lounge' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
                    >
                        ☕ Recreation Haven
                    </span>
                </div>

                <div className="text-[9px] text-gray-400">
                    Host RAM: <span className="text-cyan-400 font-semibold">{hostTelemetry?.hostMemory?.split(' ')[0] || '1.4GB'}</span>
                </div>
            </div>

            {/* Agent Inspection Modal */}
            {selectedAgent && (
                <Modal
                    open={Boolean(selectedAgent)}
                    onCancel={() => setSelectedAgent(null)}
                    footer={null}
                    title={
                        <div className="flex items-center gap-2 text-white">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ background: selectedAgent.persona?.outfitColor || '#00d2ff' }} />
                            <span>{selectedAgent.name} • Persona Telemetry</span>
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
                        <div className="flex justify-between items-center bg-[#151d32] p-3 rounded-xl border border-white/10">
                            <div>
                                <div className="text-[10px] text-gray-400 font-mono">STATUS</div>
                                <div className="text-xs font-bold" style={{ color: selectedAgent.status === 'BUSY' ? '#00d2ff' : selectedAgent.status === 'ONLINE' ? '#10b981' : '#64748b' }}>
                                    {selectedAgent.status}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] text-gray-400 font-mono">PRIMARY WING</div>
                                <div className="text-xs font-bold text-white capitalize">
                                    {WINGS[selectedAgent.homeWing || 'bridge']?.name || 'Smart HQ'}
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#12182b] p-3 rounded-xl border border-white/10">
                            <div className="text-[10px] text-gray-400 font-mono mb-1">LIVE ACTIVITY</div>
                            <div className="text-xs text-white font-medium">
                                {selectedAgent.currentTask}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-[#12182b] p-2.5 rounded-xl border border-white/10">
                                <div className="text-[10px] text-gray-400 font-mono">CPU UTILIZATION</div>
                                <div className="text-xs font-bold text-cyan-400">{selectedAgent.cpu}% Load</div>
                            </div>
                            <div className="bg-[#12182b] p-2.5 rounded-xl border border-white/10">
                                <div className="text-[10px] text-gray-400 font-mono">MEMORY FOOTPRINT</div>
                                <div className="text-xs font-bold text-white">{selectedAgent.memory}</div>
                            </div>
                        </div>

                        <div>
                            <div className="text-[10px] text-gray-400 font-mono mb-1.5 uppercase">Capabilities:</div>
                            <div className="flex flex-wrap gap-1.5">
                                {selectedAgent.capabilities?.map(cap => (
                                    <span key={cap} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-300 font-mono">
                                        {cap}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default SimsAgentHouse;
