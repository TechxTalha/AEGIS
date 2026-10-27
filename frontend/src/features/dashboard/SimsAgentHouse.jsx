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
 * SimsAgentHouse (3D Roof-Off Smart Agent HQ)
 * - 4 Dedicated Specialized Agent Decks with Contextual Colors & Hardware:
 *   1. Command Ops Deck (Cyan) -> AEGIS Core Orchestrator
 *   2. Data Vault & SQL Matrix (Emerald) -> Database Agent
 *   3. Global Cyber Radar Hub (Amber) -> Web Research Agent
 *   4. Quantum Synthesis Lab & Sleep Pod (Purple) -> Antigravity Coder
 * - Central Social Corridor & Cross-Plaza:
 *   - Espresso Bar & Snack Counter
 *   - Retro 8-Bit Cyber Arcade Machine
 *   - Energy Nexus Core
 * - Autonomous Roaming Engine with Natural Hallway Pathfinding & Realistic Dwell Times
 * - 100% Real-Time Data (Linux Host Memory, active task state)
 * - Restricted strictly to the 4 planned canonical agents
 */

// 4 Contextual Decks & Central Plaza Definitions (Canvas grid: 400 x 460)
const DECKS = {
    deck_core: {
        id: 'deck_core',
        name: 'Command Ops Deck',
        icon: '💻',
        agentId: 'agent-core-1',
        themeColor: '#00d2ff',
        bgGlow: 'rgba(0, 210, 255, 0.08)',
        borderColor: 'rgba(0, 210, 255, 0.35)',
        x: 12, y: 12, w: 178, h: 196,
        door: { x: 160, y: 200 },
        stations: [
            { x: 75, y: 88, role: 'master_console', action: 'commanding', label: 'Master Console' },
            { x: 135, y: 92, role: 'tactical_map', action: 'analyzing', label: 'Tactical Map' },
            { x: 60, y: 155, role: 'holo_globe', action: 'orbiting', label: 'Holo-Globe' }
        ]
    },
    deck_db: {
        id: 'deck_db',
        name: 'Data Vault & SQL Matrix',
        icon: '🗄️',
        agentId: 'agent-db-worker',
        themeColor: '#10b981',
        bgGlow: 'rgba(16, 185, 129, 0.08)',
        borderColor: 'rgba(16, 185, 129, 0.35)',
        x: 210, y: 12, w: 178, h: 196,
        door: { x: 240, y: 200 },
        stations: [
            { x: 320, y: 92, role: 'query_terminal', action: 'indexing', label: 'Query Terminal' },
            { x: 255, y: 85, role: 'server_cluster', action: 'optimizing', label: 'Server Cluster' },
            { x: 280, y: 155, role: 'data_cube', action: 'inspecting', label: 'Holo Data-Cube' }
        ]
    },
    deck_research: {
        id: 'deck_research',
        name: 'Global Cyber Radar',
        icon: '📡',
        agentId: 'agent-research-1',
        themeColor: '#f59e0b',
        bgGlow: 'rgba(245, 158, 11, 0.08)',
        borderColor: 'rgba(245, 158, 11, 0.35)',
        x: 12, y: 252, w: 178, h: 196,
        door: { x: 160, y: 260 },
        stations: [
            { x: 125, y: 340, role: 'recon_desk', action: 'scraping', label: 'Recon Bay' },
            { x: 65, y: 340, role: 'radar_dish', action: 'scanning', label: 'Phased Radar' },
            { x: 80, y: 405, role: 'feed_wall', action: 'monitoring', label: 'Live Ticker' }
        ]
    },
    deck_coder: {
        id: 'deck_coder',
        name: 'Quantum Synthesis Lab',
        icon: '⚡',
        agentId: 'agent-coder-x',
        themeColor: '#a855f7',
        bgGlow: 'rgba(168, 85, 247, 0.08)',
        borderColor: 'rgba(168, 85, 247, 0.35)',
        x: 210, y: 252, w: 178, h: 196,
        door: { x: 240, y: 260 },
        stations: [
            { x: 265, y: 340, role: 'code_terminal', action: 'synthesizing', label: 'Quantum IDE' },
            { x: 335, y: 335, role: 'sleep_pod', action: 'hibernating', label: 'Cryo-Pod 01' },
            { x: 295, y: 410, role: 'docking_bay', action: 'docking', label: 'Recharge Bay' }
        ]
    }
};

// Social Plaza Waypoints (Coffee Bar, Arcade Lounge, Central Nexus)
const SOCIAL_WAYPOINTS = [
    { id: 'coffee', x: 145, y: 230, action: 'sipping', thought: '☕', name: 'Espresso Bar' },
    { id: 'arcade', x: 255, y: 230, action: 'gaming', thought: '🎮', name: 'Cyber Arcade' },
    { id: 'nexus', x: 200, y: 230, action: 'socializing', thought: '💬', name: 'Plaza Nexus' }
];

const CANONICAL_IDS = ['agent-core-1', 'agent-db-worker', 'agent-research-1', 'agent-coder-x'];

const DEFAULT_AGENTS = [
    {
        id: 'agent-core-1',
        name: 'AEGIS Core Orchestrator',
        role: 'Mission Lead & System Orchestrator',
        type: 'System',
        status: 'ONLINE',
        homeDeck: 'deck_core',
        room: 'deck_core',
        currentTask: 'Command matrix synchronized',
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
        homeDeck: 'deck_db',
        room: 'deck_db',
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
        homeDeck: 'deck_research',
        room: 'deck_research',
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
        homeDeck: 'deck_coder',
        room: 'deck_coder',
        currentTask: 'Synthesizer in standby (Pod 01)',
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
    const [activeDeckFilter, setActiveDeckFilter] = useState(null);
    const [loading, setLoading] = useState(false);

    // Dynamic wandering states, paths and animation loop
    const agentSimStatesRef = useRef({});
    const animFrameRef = useRef(null);
    const [tick, setTick] = useState(0);

    // Fetch live agents & real system telemetry from backend
    const fetchLiveAgents = async () => {
        try {
            const data = await agentApi.getLiveAgents();
            if (data && data.agents && data.agents.length > 0) {
                // Strictly keep ONLY canonical planned agents
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
            const deck = DECKS[a.homeDeck] || DECKS.deck_core;
            const primaryStation = deck.stations[0];

            if (!agentSimStatesRef.current[a.id]) {
                const initX = a.status === 'OFFLINE' ? deck.stations[1].x : primaryStation.x;
                const initY = a.status === 'OFFLINE' ? deck.stations[1].y : primaryStation.y;

                agentSimStatesRef.current[a.id] = {
                    x: initX,
                    y: initY,
                    targetX: initX,
                    targetY: initY,
                    pathQueue: [],
                    currentAction: a.status === 'OFFLINE' ? 'hibernating' : 'commanding',
                    currentDeck: a.homeDeck,
                    facing: 'down',
                    thought: a.status === 'BUSY' ? '⚡' : a.status === 'OFFLINE' ? '💤' : '💻',
                    nextWanderTime: Date.now() + 14000 + idx * 4000, // Generous dwell time (14-26s)
                    walkCycle: 0
                };
            } else {
                const sim = agentSimStatesRef.current[a.id];
                // If agent is working, immediately guide them back to their home desk
                if (a.status === 'BUSY' && sim.currentAction !== 'working') {
                    sim.pathQueue = [
                        { x: sim.x, y: 230 }, // move to central hall
                        { x: deck.door.x, y: deck.door.y }, // deck door
                        { x: primaryStation.x, y: primaryStation.y } // work desk
                    ];
                    sim.currentAction = 'working';
                    sim.thought = '⚡';
                    sim.currentDeck = a.homeDeck;
                } else if (a.status === 'OFFLINE') {
                    sim.targetX = DECKS.deck_coder.stations[1].x;
                    sim.targetY = DECKS.deck_coder.stations[1].y;
                    sim.currentAction = 'hibernating';
                    sim.thought = '💤';
                }
            }
        });
    };

    // Autonomous Roaming Game Loop with Corridor Navigation & Realistic Dwell Times
    useEffect(() => {
        let lastTime = performance.now();

        const updateSimulation = (currentTime) => {
            const dt = Math.min(0.08, (currentTime - lastTime) / 1000);
            lastTime = currentTime;
            const now = Date.now();

            agents.forEach((agent) => {
                const sim = agentSimStatesRef.current[agent.id];
                if (!sim) return;

                const homeDeck = DECKS[agent.homeDeck] || DECKS.deck_core;

                // 1. Check if agent should pick a new autonomous roaming destination
                // Generous dwell time: 16 to 28 seconds spent at destination!
                if (agent.status === 'ONLINE' && now > sim.nextWanderTime && sim.pathQueue.length === 0) {
                    const isAtHome = sim.currentDeck === agent.homeDeck;

                    if (isAtHome) {
                        // 60% chance to roam to Coffee Bar or Arcade for a social break
                        const socialSpot = SOCIAL_WAYPOINTS[Math.floor(Math.random() * SOCIAL_WAYPOINTS.length)];
                        // Route: Room Station -> Room Doorway -> Hallway Center -> Social Spot
                        sim.pathQueue = [
                            { x: homeDeck.door.x, y: homeDeck.door.y },
                            { x: socialSpot.x, y: 230 },
                            { x: socialSpot.x, y: socialSpot.y }
                        ];
                        sim.targetDeck = 'plaza';
                        sim.thought = socialSpot.thought;
                        sim.nextWanderTime = now + 12000 + Math.random() * 8000; // Stay at coffee/arcade for 12-20s
                    } else {
                        // Return to home specialized deck and work
                        const station = homeDeck.stations[Math.floor(Math.random() * homeDeck.stations.length)];
                        sim.pathQueue = [
                            { x: 200, y: 230 }, // Hallway center
                            { x: homeDeck.door.x, y: homeDeck.door.y }, // Enter home door
                            { x: station.x, y: station.y } // Work at specialized machine
                        ];
                        sim.targetDeck = agent.homeDeck;
                        sim.thought = homeDeck.icon;
                        sim.nextWanderTime = now + 18000 + Math.random() * 12000; // Dwell at home station for 18-30s!
                    }
                }

                // 2. Consume path queue nodes
                if (sim.pathQueue.length > 0 && Math.hypot(sim.targetX - sim.x, sim.targetY - sim.y) < 3) {
                    const nextNode = sim.pathQueue.shift();
                    sim.targetX = nextNode.x;
                    sim.targetY = nextNode.y;
                    if (sim.pathQueue.length === 0 && sim.targetDeck) {
                        sim.currentDeck = sim.targetDeck;
                    }
                }

                // 3. Move smoothly towards target coordinate
                const dx = sim.targetX - sim.x;
                const dy = sim.targetY - sim.y;
                const dist = Math.hypot(dx, dy);

                if (dist > 1.5) {
                    const speed = 36; // comfortable walking speed
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
        <div className="w-full h-[650px] rounded-3xl bg-gradient-to-b from-[#0b101d] via-[#090d16] to-[#070b12] border border-white/15 p-3 flex flex-col justify-between shadow-[0_16px_48px_rgba(0,0,0,0.85)] overflow-hidden select-none">
            {/* Header: Roof-Off Title & Telemetry Counters */}
            <div className="flex justify-between items-center px-1 pb-1.5 border-b border-white/5 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-neon animate-pulse" />
                    <div>
                        <h3 className="text-xs font-bold text-white tracking-wider uppercase mb-0 flex items-center gap-1.5">
                            AEGIS SMART HQ
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 font-mono">
                                ROOF-OFF 3D
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

            {/* 3D / Isometric Roof-Off House SVG Canvas */}
            <div className="flex-1 relative w-full h-full min-h-0 my-1 rounded-2xl bg-[#060911] border border-white/10 overflow-hidden shadow-inner flex items-center justify-center">
                <svg
                    viewBox="0 0 400 460"
                    className="w-full h-full object-contain"
                    preserveAspectRatio="xMidYMid meet"
                >
                    <defs>
                        {/* Floor isometric grid */}
                        <pattern id="cyberGrid3D" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.025)" strokeWidth="0.8" />
                        </pattern>
                        {/* Gradients for contextual decks */}
                        <linearGradient id="coreDeckGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#00d2ff" stopOpacity="0.14" />
                            <stop offset="100%" stopColor="#00d2ff" stopOpacity="0.02" />
                        </linearGradient>
                        <linearGradient id="dbDeckGlow" x1="100%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.14" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
                        </linearGradient>
                        <linearGradient id="radarDeckGlow" x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.14" />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
                        </linearGradient>
                        <linearGradient id="coderDeckGlow" x1="100%" y1="100%" x2="0%" y2="0%">
                            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.14" />
                            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.02" />
                        </linearGradient>
                    </defs>

                    {/* Dark Cyber Ground & Grid */}
                    <rect width="400" height="460" fill="#060911" />
                    <rect width="400" height="460" fill="url(#cyberGrid3D)" />

                    {/* Outer Architectural Perimeter Wall */}
                    <rect 
                        x="6" y="6" width="388" height="448" 
                        rx="16" fill="none" 
                        stroke="rgba(0, 210, 255, 0.3)" strokeWidth="2.5" 
                    />

                    {/* Central Connecting Corridor Paths (Walkways) */}
                    {/* Horizontal Main Corridor */}
                    <rect x="8" y="210" width="384" height="40" fill="rgba(255, 255, 255, 0.015)" />
                    <line x1="8" y1="210" x2="392" y2="210" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="8" y1="250" x2="392" y2="250" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1" strokeDasharray="3 3" />

                    {/* Vertical Central Corridor */}
                    <rect x="190" y="8" width="20" height="444" fill="rgba(255, 255, 255, 0.015)" />
                    <line x1="190" y1="8" x2="190" y2="452" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="210" y1="8" x2="210" y2="452" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1" strokeDasharray="3 3" />

                    {/* Central Plaza Energy Nexus Hub */}
                    <circle cx="200" cy="230" r="16" fill="#090e1a" stroke="rgba(0, 210, 255, 0.5)" strokeWidth="1.5" />
                    <circle cx="200" cy="230" r="7" fill="#00d2ff" opacity="0.3" className="animate-ping" />
                    <circle cx="200" cy="230" r="3.5" fill="#00d2ff" />

                    {/* --- CENTRAL SOCIAL AMENITIES --- */}
                    {/* 1. Espresso Bar (Situated in Left Hallway) */}
                    <g transform="translate(130, 214)">
                        <rect x="0" y="0" width="32" height="15" rx="3" fill="#1c1917" stroke="#f59e0b" strokeWidth="0.8" />
                        <rect x="4" y="2" width="10" height="11" rx="2" fill="#44403c" stroke="#f59e0b" strokeWidth="0.6" />
                        <circle cx="9" cy="8" r="2" fill="#fbbf24" />
                        <text x="7" y="1" fill="#fef08a" fontSize="6" className="animate-bounce">~</text>
                        <circle cx="24" cy="8" r="3" fill="#78350f" stroke="#fbbf24" strokeWidth="0.5" />
                        <text x="2" y="22" fill="#d97706" fontSize="5.5" fontFamily="monospace">COFFEE</text>
                    </g>

                    {/* 2. Retro Arcade Machine (Situated in Right Hallway) */}
                    <g transform="translate(242, 214)">
                        <rect x="0" y="0" width="22" height="24" rx="3" fill="#2e1065" stroke="#c084fc" strokeWidth="1" />
                        <rect x="3" y="3" width="16" height="10" rx="1" fill="#ec4899" className="animate-pulse" />
                        <circle cx="11" cy="18" r="2" fill="#f43f5e" />
                        <text x="0" y="30" fill="#c084fc" fontSize="5.5" fontFamily="monospace">ARCADE</text>
                    </g>

                    {/* =========================================================================
                        DECK 1: COMMAND OPS DECK (Top-Left) -> AEGIS Core Orchestrator (#00d2ff)
                       ========================================================================= */}
                    <g 
                        className="cursor-pointer"
                        onClick={() => setActiveDeckFilter(activeDeckFilter === 'deck_core' ? null : 'deck_core')}
                    >
                        <rect 
                            x="12" y="12" width="176" height="196" rx="10" 
                            fill={activeDeckFilter === 'deck_core' ? 'rgba(0, 210, 255, 0.2)' : 'url(#coreDeckGlow)'} 
                            stroke={activeDeckFilter === 'deck_core' ? '#00d2ff' : 'rgba(0, 210, 255, 0.35)'} 
                            strokeWidth="1.2" 
                        />
                        {/* Deck Title */}
                        <text x="22" y="28" fill="#38bdf8" fontSize="9" fontWeight="bold" fontFamily="monospace">
                            💻 COMMAND OPS DECK
                        </text>
                        <text x="22" y="38" fill="rgba(56, 189, 248, 0.6)" fontSize="6.5" fontFamily="monospace">
                            AEGIS CORE ORCHESTRATOR
                        </text>

                        {/* Master Dual-Curved Console */}
                        <rect x="45" y="55" width="60" height="26" rx="4" fill="#0f172a" stroke="#00d2ff" strokeWidth="0.8" />
                        <rect x="52" y="60" width="20" height="7" rx="1" fill="#00d2ff" opacity="0.9" />
                        <rect x="76" y="60" width="20" height="7" rx="1" fill="#38bdf8" opacity="0.9" />
                        {/* Commander Swivel Chair */}
                        <circle cx="75" cy="94" r="7" fill="#1e293b" stroke="#00d2ff" strokeWidth="0.8" />

                        {/* Tactical Holo-Table with Planetary Projection */}
                        <circle cx="60" cy="155" r="16" fill="#090e1a" stroke="rgba(0, 210, 255, 0.4)" strokeWidth="0.8" strokeDasharray="3 2" />
                        <circle cx="60" cy="155" r="9" fill="none" stroke="#00d2ff" strokeWidth="1" className="animate-spin" />
                        <circle cx="60" cy="155" r="3" fill="#38bdf8" className="animate-ping" opacity="0.4" />

                        {/* Strategic Wall Radar Display */}
                        <rect x="125" y="55" width="48" height="32" rx="3" fill="#0b1120" stroke="#0284c7" strokeWidth="0.7" />
                        <circle cx="149" cy="71" r="10" fill="none" stroke="#38bdf8" strokeWidth="0.6" strokeDasharray="2 2" />
                        <line x1="149" y1="61" x2="149" y2="81" stroke="#38bdf8" strokeWidth="0.5" />
                        <line x1="139" y1="71" x2="159" y2="71" stroke="#38bdf8" strokeWidth="0.5" />

                        {/* Deck Doorway Marker */}
                        <line x1="150" y1="208" x2="175" y2="208" stroke="#00d2ff" strokeWidth="2.5" />
                    </g>

                    {/* =========================================================================
                        DECK 2: DATA VAULT & SQL MATRIX (Top-Right) -> Database Agent (#10b981)
                       ========================================================================= */}
                    <g 
                        className="cursor-pointer"
                        onClick={() => setActiveDeckFilter(activeDeckFilter === 'deck_db' ? null : 'deck_db')}
                    >
                        <rect 
                            x="212" y="12" width="176" height="196" rx="10" 
                            fill={activeDeckFilter === 'deck_db' ? 'rgba(16, 185, 129, 0.2)' : 'url(#dbDeckGlow)'} 
                            stroke={activeDeckFilter === 'deck_db' ? '#10b981' : 'rgba(16, 185, 129, 0.35)'} 
                            strokeWidth="1.2" 
                        />
                        {/* Deck Title */}
                        <text x="222" y="28" fill="#34d399" fontSize="9" fontWeight="bold" fontFamily="monospace">
                            🗄️ DATA VAULT & SQL
                        </text>
                        <text x="222" y="38" fill="rgba(52, 211, 153, 0.6)" fontSize="6.5" fontFamily="monospace">
                            DATABASE ARCHITECT BAY
                        </text>

                        {/* High Density Server Racks with Blinking LEDs */}
                        <rect x="230" y="55" width="55" height="28" rx="3" fill="#062d21" stroke="#10b981" strokeWidth="0.8" />
                        <circle cx="238" cy="65" r="2" fill="#10b981" className="animate-pulse" />
                        <circle cx="248" cy="65" r="2" fill="#34d399" />
                        <circle cx="258" cy="65" r="2" fill="#10b981" className="animate-pulse" />
                        <circle cx="268" cy="65" r="2" fill="#6ee7b7" />
                        <circle cx="276" cy="65" r="2" fill="#10b981" />

                        {/* SQL Matrix Query Terminal */}
                        <rect x="300" y="55" width="65" height="26" rx="4" fill="#061d18" stroke="#10b981" strokeWidth="0.8" />
                        <rect x="308" y="60" width="22" height="7" rx="1" fill="#34d399" opacity="0.9" />
                        <rect x="335" y="60" width="22" height="7" rx="1" fill="#10b981" opacity="0.9" />
                        {/* Swivel Chair */}
                        <circle cx="328" cy="94" r="7" fill="#064e3b" stroke="#34d399" strokeWidth="0.8" />

                        {/* Levitating Holographic Data Cube */}
                        <g transform="translate(280, 150)">
                            <rect x="-10" y="-10" width="20" height="20" rx="3" fill="none" stroke="#10b981" strokeWidth="1" className="animate-pulse" />
                            <rect x="-6" y="-6" width="12" height="12" rx="2" fill="rgba(16, 185, 129, 0.4)" />
                            <circle cx="0" cy="0" r="2" fill="#6ee7b7" />
                        </g>

                        {/* Deck Doorway Marker */}
                        <line x1="225" y1="208" x2="250" y2="208" stroke="#10b981" strokeWidth="2.5" />
                    </g>

                    {/* =========================================================================
                        DECK 3: GLOBAL CYBER RADAR (Bottom-Left) -> Web Research Agent (#f59e0b)
                       ========================================================================= */}
                    <g 
                        className="cursor-pointer"
                        onClick={() => setActiveDeckFilter(activeDeckFilter === 'deck_research' ? null : 'deck_research')}
                    >
                        <rect 
                            x="12" y="252" width="176" height="196" rx="10" 
                            fill={activeDeckFilter === 'deck_research' ? 'rgba(245, 158, 11, 0.2)' : 'url(#radarDeckGlow)'} 
                            stroke={activeDeckFilter === 'deck_research' ? '#f59e0b' : 'rgba(245, 158, 11, 0.35)'} 
                            strokeWidth="1.2" 
                        />
                        {/* Deck Title */}
                        <text x="22" y="268" fill="#fbbf24" fontSize="9" fontWeight="bold" fontFamily="monospace">
                            📡 GLOBAL CYBER RADAR
                        </text>
                        <text x="22" y="278" fill="rgba(251, 191, 36, 0.6)" fontSize="6.5" fontFamily="monospace">
                            WEB & NETWORK EXPLORER
                        </text>

                        {/* Phased Array Satellite Radar Dish */}
                        <g transform="translate(60, 335)">
                            <circle cx="0" cy="0" r="18" fill="#1c1917" stroke="#f59e0b" strokeWidth="1" />
                            <ellipse cx="0" cy="0" rx="14" ry="7" fill="none" stroke="#fbbf24" strokeWidth="0.8" className="animate-spin" />
                            <line x1="0" y1="0" x2="12" y2="-12" stroke="#f59e0b" strokeWidth="1.2" />
                            <circle cx="12" cy="-12" r="2.5" fill="#fef08a" className="animate-ping" opacity="0.6" />
                        </g>

                        {/* Tri-Monitor Recon Desk */}
                        <rect x="98" y="305" width="65" height="26" rx="4" fill="#292524" stroke="#f59e0b" strokeWidth="0.8" />
                        <rect x="104" y="310" width="16" height="7" rx="1" fill="#fbbf24" opacity="0.9" />
                        <rect x="123" y="310" width="16" height="7" rx="1" fill="#d97706" opacity="0.9" />
                        <rect x="142" y="310" width="16" height="7" rx="1" fill="#fbbf24" opacity="0.9" />
                        {/* Swivel Chair */}
                        <circle cx="130" cy="344" r="7" fill="#44403c" stroke="#f59e0b" strokeWidth="0.8" />

                        {/* Live Network Ticker Display */}
                        <rect x="35" y="405" width="125" height="18" rx="3" fill="#1c1917" stroke="rgba(245, 158, 11, 0.4)" strokeWidth="0.7" />
                        <text x="45" y="417" fill="#fbbf24" fontSize="6.5" fontFamily="monospace">
                            FEED: 48.2 GB/s • GLOBAL INDEXING
                        </text>

                        {/* Deck Doorway Marker */}
                        <line x1="150" y1="252" x2="175" y2="252" stroke="#f59e0b" strokeWidth="2.5" />
                    </g>

                    {/* =========================================================================
                        DECK 4: QUANTUM SYNTHESIS & SLEEP POD (Bottom-Right) -> Coder (#a855f7)
                       ========================================================================= */}
                    <g 
                        className="cursor-pointer"
                        onClick={() => setActiveDeckFilter(activeDeckFilter === 'deck_coder' ? null : 'deck_coder')}
                    >
                        <rect 
                            x="212" y="252" width="176" height="196" rx="10" 
                            fill={activeDeckFilter === 'deck_coder' ? 'rgba(168, 85, 247, 0.2)' : 'url(#coderDeckGlow)'} 
                            stroke={activeDeckFilter === 'deck_coder' ? '#a855f7' : 'rgba(168, 85, 247, 0.35)'} 
                            strokeWidth="1.2" 
                        />
                        {/* Deck Title */}
                        <text x="222" y="268" fill="#c084fc" fontSize="9" fontWeight="bold" fontFamily="monospace">
                            ⚡ QUANTUM SYNTHESIS
                        </text>
                        <text x="222" y="278" fill="rgba(192, 132, 252, 0.6)" fontSize="6.5" fontFamily="monospace">
                            ANTIGRAVITY CODER LAB
                        </text>

                        {/* Quantum IDE Terminal (Tall vertical monitors) */}
                        <rect x="235" y="305" width="55" height="26" rx="4" fill="#1e1b4b" stroke="#a855f7" strokeWidth="0.8" />
                        <rect x="242" y="308" width="18" height="11" rx="1" fill="#c084fc" opacity="0.9" />
                        <rect x="264" y="308" width="18" height="11" rx="1" fill="#e879f9" opacity="0.9" />
                        {/* Swivel Chair */}
                        <circle cx="262" cy="344" r="7" fill="#3b0764" stroke="#a855f7" strokeWidth="0.8" />

                        {/* Cryo-Hibernation Sleep Capsule Pod */}
                        <g transform="translate(315, 298)">
                            <rect x="0" y="0" width="45" height="72" rx="12" fill="#0f172a" stroke="#a855f7" strokeWidth="1" />
                            <rect x="6" y="8" width="33" height="42" rx="8" fill="rgba(168, 85, 247, 0.15)" stroke="rgba(168, 85, 247, 0.4)" strokeWidth="0.8" />
                            <circle cx="22" cy="60" r="3" fill="#c084fc" className="animate-ping" opacity="0.4" />
                            <circle cx="22" cy="60" r="1.8" fill="#c084fc" />
                            <text x="22" y="32" textAnchor="middle" fill="#c084fc" fontSize="6.5" fontFamily="monospace">POD 01</text>
                        </g>

                        {/* Recharge Docking Platform */}
                        <rect x="245" y="405" width="85" height="18" rx="3" fill="#1e1b4b" stroke="rgba(168, 85, 247, 0.4)" strokeWidth="0.7" />
                        <text x="256" y="417" fill="#c084fc" fontSize="6.5" fontFamily="monospace">
                            SYNTH DOCK: RECHARGING
                        </text>

                        {/* Deck Doorway Marker */}
                        <line x1="225" y1="252" x2="250" y2="252" stroke="#a855f7" strokeWidth="2.5" />
                    </g>

                    {/* =========================================================================
                        RENDER THE 4 CANONICAL AGENT PERSONAS (Sims Animated Sprites)
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
                                {/* Active Selection Reticle */}
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

                                {/* Persona Torso / Outfit */}
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

                                {/* Working Energy Halo */}
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

                                {/* Name Tag Label */}
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

            {/* Bottom Room Navigation & Status Footer */}
            <div className="flex justify-between items-center px-1 pt-1 border-t border-white/5 text-[10px] font-mono text-gray-400 flex-shrink-0">
                <div className="flex gap-1.5">
                    <span 
                        onClick={() => setActiveDeckFilter('deck_core')}
                        className={`cursor-pointer px-2 py-0.5 rounded transition-colors ${activeDeckFilter === 'deck_core' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
                    >
                        💻 Ops
                    </span>
                    <span 
                        onClick={() => setActiveDeckFilter('deck_db')}
                        className={`cursor-pointer px-2 py-0.5 rounded transition-colors ${activeDeckFilter === 'deck_db' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
                    >
                        🗄️ SQL
                    </span>
                    <span 
                        onClick={() => setActiveDeckFilter('deck_research')}
                        className={`cursor-pointer px-2 py-0.5 rounded transition-colors ${activeDeckFilter === 'deck_research' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
                    >
                        📡 Radar
                    </span>
                    <span 
                        onClick={() => setActiveDeckFilter('deck_coder')}
                        className={`cursor-pointer px-2 py-0.5 rounded transition-colors ${activeDeckFilter === 'deck_coder' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
                    >
                        ⚡ Coder
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
                                <div className="text-[10px] text-gray-400 font-mono">DEDICATED DECK</div>
                                <div className="text-xs font-bold text-white capitalize">
                                    {DECKS[selectedAgent.homeDeck]?.name || 'Command Matrix'}
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
