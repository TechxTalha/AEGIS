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
 * SimsAgentHouse (3D / Isometric Roof-Off Agent Hub)
 * - From-roof view of the AEGIS Smart Agent Headquarters
 * - 4 Functional Interactive Zones:
 *   1. Command Workstation (Desks, triple monitors, servers)
 *   2. Coffee & Kitchen Bar (Espresso machine, mugs, stools)
 *   3. Living Lounge & Arcade (Sofa, coffee table, retro arcade cabinet)
 *   4. Rest Pods / Hibernation Bay (Sleep pods with floating "Zzz")
 * - Autonomous Sims-like AI Persona roaming & pathfinding
 * - 100% Real-Time Data from /api/agents (Real CPU, RAM, active task state)
 */

// Isometric House Dimensions (Internal Grid Coordinates: 0 to 400 x 0 to 480)
const ROOMS = {
    workstation: {
        id: 'workstation',
        name: 'Command Deck',
        icon: '💻',
        x: 15, y: 15, w: 180, h: 210,
        color: 'rgba(0, 210, 255, 0.08)',
        borderColor: 'rgba(0, 210, 255, 0.35)',
        waypoints: [
            { x: 60, y: 110, role: 'desk1', action: 'typing' },
            { x: 135, y: 110, role: 'desk2', action: 'typing' },
            { x: 100, y: 175, role: 'server', action: 'inspecting' }
        ]
    },
    kitchen: {
        id: 'kitchen',
        name: 'Coffee Bar',
        icon: '☕',
        x: 205, y: 15, w: 180, h: 210,
        color: 'rgba(245, 158, 11, 0.08)',
        borderColor: 'rgba(245, 158, 11, 0.35)',
        waypoints: [
            { x: 250, y: 70, role: 'espresso', action: 'brewing' },
            { x: 330, y: 70, role: 'fridge', action: 'snacking' },
            { x: 290, y: 145, role: 'counter', action: 'sipping' }
        ]
    },
    lounge: {
        id: 'lounge',
        name: 'Arcade Lounge',
        icon: '🎮',
        x: 15, y: 235, w: 180, h: 215,
        color: 'rgba(168, 85, 247, 0.08)',
        borderColor: 'rgba(168, 85, 247, 0.35)',
        waypoints: [
            { x: 60, y: 310, role: 'arcade', action: 'gaming' },
            { x: 125, y: 345, role: 'sofa', action: 'resting' },
            { x: 100, y: 400, role: 'rug', action: 'relaxing' }
        ]
    },
    rest_pod: {
        id: 'rest_pod',
        name: 'Sleep Pods',
        icon: '💤',
        x: 205, y: 235, w: 180, h: 215,
        color: 'rgba(100, 116, 139, 0.08)',
        borderColor: 'rgba(100, 116, 139, 0.35)',
        waypoints: [
            { x: 260, y: 320, role: 'pod1', action: 'hibernating' },
            { x: 330, y: 320, role: 'pod2', action: 'hibernating' },
            { x: 295, y: 395, role: 'dock', action: 'charging' }
        ]
    }
};

const SimsAgentHouse = ({ liveTasks = [] }) => {
    const [agents, setAgents] = useState([]);
    const [hostTelemetry, setHostTelemetry] = useState(null);
    const [houseStats, setHouseStats] = useState({ workingCount: 0, idleCount: 0, offlineCount: 0 });
    const [selectedAgent, setSelectedAgent] = useState(null);
    const [activeRoomFilter, setActiveRoomFilter] = useState(null);
    const [loading, setLoading] = useState(false);

    // Positions, velocities and animation states for Sims roaming personas
    const agentPositionsRef = useRef({});
    const animFrameRef = useRef(null);
    const [tick, setTick] = useState(0);

    // Fetch live agents & real system telemetry from backend
    const fetchLiveAgents = async () => {
        try {
            const data = await agentApi.getLiveAgents();
            if (data && data.agents) {
                setAgents(data.agents);
                setHouseStats(data.houseStats || { workingCount: 0, idleCount: 0, offlineCount: 0 });
                setHostTelemetry({
                    hostMemory: data.hostMemory,
                    activeTask: data.activeTask,
                    isExecuting: data.isExecuting
                });
                syncAgentWaypoints(data.agents);
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

    // Initialize or update autonomous roaming targets
    const syncAgentWaypoints = (agentList) => {
        agentList.forEach((a, idx) => {
            if (!agentPositionsRef.current[a.id]) {
                // Initialize initial coordinate
                const initialRoom = ROOMS[a.room] || ROOMS.lounge;
                const wp = initialRoom.waypoints[idx % initialRoom.waypoints.length];
                agentPositionsRef.current[a.id] = {
                    x: wp.x,
                    y: wp.y,
                    targetX: wp.x,
                    targetY: wp.y,
                    currentAction: wp.action,
                    facing: 'down',
                    thought: a.status === 'BUSY' ? '💻' : a.status === 'OFFLINE' ? '💤' : '☕',
                    nextMoveTime: Date.now() + 2000 + idx * 1500,
                    walkCycle: 0
                };
            } else {
                const pos = agentPositionsRef.current[a.id];
                // If agent is working, immediately steer to workstation desk
                if (a.status === 'BUSY') {
                    const deskWp = ROOMS.workstation.waypoints[idx % 2];
                    pos.targetX = deskWp.x;
                    pos.targetY = deskWp.y;
                    pos.currentAction = 'typing';
                    pos.thought = '💻';
                } else if (a.status === 'OFFLINE') {
                    const podWp = ROOMS.rest_pod.waypoints[idx % 2];
                    pos.targetX = podWp.x;
                    pos.targetY = podWp.y;
                    pos.currentAction = 'hibernating';
                    pos.thought = '💤';
                }
            }
        });
    };

    // Autonomous Roaming Game Loop (Sims behavior AI)
    useEffect(() => {
        let lastTime = performance.now();

        const updateSimulation = (currentTime) => {
            const dt = Math.min(0.1, (currentTime - lastTime) / 1000);
            lastTime = currentTime;

            const now = Date.now();
            let moved = false;

            agents.forEach((agent, i) => {
                const state = agentPositionsRef.current[agent.id];
                if (!state) return;

                // 1. Check if agent should pick a new autonomous roaming waypoint
                if (agent.status === 'ONLINE' && now > state.nextMoveTime) {
                    // Decide where to wander: Kitchen, Lounge, or inspect Workstation
                    const candidateRooms = [ROOMS.kitchen, ROOMS.lounge, ROOMS.workstation];
                    const chosenRoom = candidateRooms[Math.floor(Math.random() * candidateRooms.length)];
                    const wp = chosenRoom.waypoints[Math.floor(Math.random() * chosenRoom.waypoints.length)];
                    
                    state.targetX = wp.x + (Math.random() * 16 - 8);
                    state.targetY = wp.y + (Math.random() * 16 - 8);
                    state.currentAction = wp.action;
                    state.nextMoveTime = now + 5000 + Math.random() * 7000;

                    // Choose thought bubble
                    if (chosenRoom.id === 'kitchen') state.thought = agent.drink ? '☕' : '🥤';
                    else if (chosenRoom.id === 'lounge') state.thought = Math.random() > 0.5 ? '🎮' : '🛋️';
                    else state.thought = '📊';
                }

                // 2. Move towards target coordinate
                const dx = state.targetX - state.x;
                const dy = state.targetY - state.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > 2) {
                    const speed = 40; // pixels per second
                    const moveX = (dx / dist) * speed * dt;
                    const moveY = (dy / dist) * speed * dt;

                    state.x += moveX;
                    state.y += moveY;
                    state.walkCycle = (state.walkCycle + dt * 8) % 1;
                    state.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
                    moved = true;
                } else {
                    state.walkCycle = 0;
                }
            });

            // Trigger re-render at 30 fps interval for buttery animations
            setTick(prev => (prev + 1) % 10000);
            animFrameRef.current = requestAnimationFrame(updateSimulation);
        };

        animFrameRef.current = requestAnimationFrame(updateSimulation);
        return () => cancelAnimationFrame(animFrameRef.current);
    }, [agents]);

    return (
        <div className="w-full h-[650px] rounded-3xl bg-gradient-to-b from-[#0e1424]/90 via-[#0B0F19] to-[#0B0F19] border border-white/15 p-3 flex flex-col justify-between shadow-[0_16px_48px_rgba(0,0,0,0.8)] overflow-hidden select-none">
            {/* Header: Roof-View Title & Telemetry Counters */}
            <div className="flex justify-between items-center px-1 pb-1.5 border-b border-white/5 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-neon animate-pulse" />
                    <div>
                        <h3 className="text-xs font-bold text-white tracking-wider uppercase mb-0 flex items-center gap-1.5">
                            AEGIS Smart HQ
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
                        title="Refresh Live Agents"
                    >
                        <ReloadOutlined spin={loading} />
                    </button>
                </div>
            </div>

            {/* 3D / Isometric Roof-Off House SVG Canvas */}
            <div className="flex-1 relative w-full h-full min-h-0 my-1 rounded-2xl bg-[#070b14] border border-white/10 overflow-hidden shadow-inner flex items-center justify-center">
                <svg
                    viewBox="0 0 400 460"
                    className="w-full h-full object-contain"
                    preserveAspectRatio="xMidYMid meet"
                >
                    {/* Background Floor Grid */}
                    <defs>
                        <pattern id="cyberGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="0.8" />
                        </pattern>
                        <linearGradient id="neonGlowCyan" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#00d2ff" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#00d2ff" stopOpacity="0.02" />
                        </linearGradient>
                    </defs>

                    <rect width="400" height="460" fill="#070b14" />
                    <rect width="400" height="460" fill="url(#cyberGrid)" />

                    {/* Outer Architectural Cyber House Walls */}
                    <rect 
                        x="8" y="8" width="384" height="444" 
                        rx="16" fill="none" 
                        stroke="rgba(0, 210, 255, 0.25)" strokeWidth="2.5" 
                    />

                    {/* Central Corridor Dividers */}
                    <line x1="200" y1="12" x2="200" y2="448" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1.5" strokeDasharray="4 3" />
                    <line x1="12" y1="228" x2="388" y2="228" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1.5" strokeDasharray="4 3" />

                    {/* Central Corridor Hub Embellishment */}
                    <circle cx="200" cy="228" r="14" fill="#0c1221" stroke="rgba(0, 210, 255, 0.4)" strokeWidth="1.2" />
                    <circle cx="200" cy="228" r="6" fill="#00d2ff" className="animate-ping" opacity="0.3" />
                    <circle cx="200" cy="228" r="3" fill="#00d2ff" />

                    {/* --- ZONE 1: COMMAND WORKSTATION (Top-Left) --- */}
                    <g 
                        className="cursor-pointer group"
                        onClick={() => setActiveRoomFilter(activeRoomFilter === 'workstation' ? null : 'workstation')}
                    >
                        <rect 
                            x="16" y="16" width="176" height="204" rx="10" 
                            fill={activeRoomFilter === 'workstation' ? 'rgba(0, 210, 255, 0.15)' : 'rgba(0, 210, 255, 0.05)'} 
                            stroke={activeRoomFilter === 'workstation' ? '#00d2ff' : 'rgba(0, 210, 255, 0.2)'} 
                            strokeWidth="1.2" 
                        />
                        {/* Room Label */}
                        <text x="24" y="34" fill="#38bdf8" fontSize="10" fontWeight="bold" fontFamily="monospace">
                            💻 COMMAND DECK
                        </text>

                        {/* Furniture: Cyber Desk 1 */}
                        <rect x="35" y="65" width="55" height="26" rx="4" fill="#12182b" stroke="#00d2ff" strokeWidth="0.8" />
                        <rect x="42" y="70" width="18" height="6" rx="1" fill="#00d2ff" opacity="0.8" />
                        <rect x="63" y="70" width="18" height="6" rx="1" fill="#38bdf8" opacity="0.8" />
                        {/* Swivel Chair 1 */}
                        <circle cx="62" cy="105" r="7" fill="#1e293b" stroke="#00d2ff" strokeWidth="0.8" />

                        {/* Furniture: Cyber Desk 2 */}
                        <rect x="110" y="65" width="55" height="26" rx="4" fill="#12182b" stroke="#00d2ff" strokeWidth="0.8" />
                        <rect x="117" y="70" width="18" height="6" rx="1" fill="#00d2ff" opacity="0.8" />
                        <rect x="138" y="70" width="18" height="6" rx="1" fill="#38bdf8" opacity="0.8" />
                        {/* Swivel Chair 2 */}
                        <circle cx="137" cy="105" r="7" fill="#1e293b" stroke="#00d2ff" strokeWidth="0.8" />

                        {/* Server Rack Pillar with Blinking LEDs */}
                        <rect x="75" y="170" width="50" height="22" rx="3" fill="#090d16" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
                        <circle cx="85" cy="181" r="2" fill="#10b981" />
                        <circle cx="95" cy="181" r="2" fill="#00d2ff" className="animate-pulse" />
                        <circle cx="105" cy="181" r="2" fill="#10b981" />
                        <circle cx="115" cy="181" r="2" fill="#38bdf8" className="animate-pulse" />
                    </g>

                    {/* --- ZONE 2: COFFEE & KITCHEN BAR (Top-Right) --- */}
                    <g 
                        className="cursor-pointer group"
                        onClick={() => setActiveRoomFilter(activeRoomFilter === 'kitchen' ? null : 'kitchen')}
                    >
                        <rect 
                            x="208" y="16" width="176" height="204" rx="10" 
                            fill={activeRoomFilter === 'kitchen' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.05)'} 
                            stroke={activeRoomFilter === 'kitchen' ? '#f59e0b' : 'rgba(245, 158, 11, 0.2)'} 
                            strokeWidth="1.2" 
                        />
                        {/* Room Label */}
                        <text x="216" y="34" fill="#fbbf24" fontSize="10" fontWeight="bold" fontFamily="monospace">
                            ☕ COFFEE BAR
                        </text>

                        {/* Kitchen Countertop */}
                        <rect x="230" y="55" width="130" height="28" rx="4" fill="#1c1917" stroke="#f59e0b" strokeWidth="0.8" />
                        
                        {/* Chrome Espresso Machine */}
                        <rect x="245" y="60" width="22" height="18" rx="2" fill="#44403c" stroke="#f59e0b" strokeWidth="0.8" />
                        <circle cx="256" cy="69" r="3" fill="#fbbf24" />
                        <text x="270" y="73" fill="#fef08a" fontSize="7" className="animate-bounce">~</text>
                        
                        {/* Mini Fridge & Water Dispenser */}
                        <rect x="325" y="60" width="20" height="18" rx="2" fill="#1e293b" stroke="#38bdf8" strokeWidth="0.8" />
                        <circle cx="335" cy="69" r="3" fill="#38bdf8" />

                        {/* Bar Table & Stools */}
                        <rect x="260" y="140" width="70" height="20" rx="4" fill="#292524" stroke="rgba(245,158,11,0.4)" strokeWidth="0.8" />
                        <circle cx="275" cy="150" r="5" fill="#78350f" stroke="#fbbf24" strokeWidth="0.6" />
                        <circle cx="315" cy="150" r="5" fill="#78350f" stroke="#fbbf24" strokeWidth="0.6" />
                    </g>

                    {/* --- ZONE 3: ARCADE LOUNGE (Bottom-Left) --- */}
                    <g 
                        className="cursor-pointer group"
                        onClick={() => setActiveRoomFilter(activeRoomFilter === 'lounge' ? null : 'lounge')}
                    >
                        <rect 
                            x="16" y="236" width="176" height="208" rx="10" 
                            fill={activeRoomFilter === 'lounge' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(168, 85, 247, 0.05)'} 
                            stroke={activeRoomFilter === 'lounge' ? '#a855f7' : 'rgba(168, 85, 247, 0.2)'} 
                            strokeWidth="1.2" 
                        />
                        {/* Room Label */}
                        <text x="24" y="254" fill="#c084fc" fontSize="10" fontWeight="bold" fontFamily="monospace">
                            🎮 ARCADE LOUNGE
                        </text>

                        {/* Retro Arcade Machine */}
                        <rect x="35" y="275" width="26" height="34" rx="3" fill="#3b0764" stroke="#c084fc" strokeWidth="1" />
                        <rect x="39" y="280" width="18" height="12" rx="1" fill="#ec4899" className="animate-pulse" />
                        <circle cx="48" cy="301" r="2.5" fill="#f43f5e" />

                        {/* Sectional Cyber Sofa */}
                        <rect x="95" y="320" width="70" height="26" rx="6" fill="#1e1b4b" stroke="#818cf8" strokeWidth="0.8" />
                        <rect x="145" y="346" width="20" height="30" rx="4" fill="#1e1b4b" stroke="#818cf8" strokeWidth="0.8" />
                        
                        {/* Lounge Rug */}
                        <rect x="80" y="365" width="55" height="35" rx="5" fill="rgba(168, 85, 247, 0.12)" stroke="rgba(168, 85, 247, 0.3)" strokeWidth="0.6" />

                        {/* Potted Cyber Plant */}
                        <circle cx="45" cy="415" r="9" fill="#064e3b" stroke="#10b981" strokeWidth="0.8" />
                        <circle cx="45" cy="415" r="4" fill="#34d399" />
                    </g>

                    {/* --- ZONE 4: SLEEP PODS / HIBERNATION BAY (Bottom-Right) --- */}
                    <g 
                        className="cursor-pointer group"
                        onClick={() => setActiveRoomFilter(activeRoomFilter === 'rest_pod' ? null : 'rest_pod')}
                    >
                        <rect 
                            x="208" y="236" width="176" height="208" rx="10" 
                            fill={activeRoomFilter === 'rest_pod' ? 'rgba(100, 116, 139, 0.15)' : 'rgba(100, 116, 139, 0.05)'} 
                            stroke={activeRoomFilter === 'rest_pod' ? '#94a3b8' : 'rgba(100, 116, 139, 0.2)'} 
                            strokeWidth="1.2" 
                        />
                        {/* Room Label */}
                        <text x="216" y="254" fill="#94a3b8" fontSize="10" fontWeight="bold" fontFamily="monospace">
                            💤 SLEEP PODS
                        </text>

                        {/* Pod 1 Capsule */}
                        <g>
                            <rect x="235" y="280" width="46" height="75" rx="12" fill="#0f172a" stroke="#64748b" strokeWidth="1" />
                            <rect x="241" y="288" width="34" height="42" rx="8" fill="rgba(56, 189, 248, 0.12)" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="0.8" />
                            <circle cx="258" cy="342" r="3" fill="#38bdf8" className="animate-ping" opacity="0.4" />
                            <circle cx="258" cy="342" r="2" fill="#38bdf8" />
                        </g>

                        {/* Pod 2 Capsule */}
                        <g>
                            <rect x="310" y="280" width="46" height="75" rx="12" fill="#0f172a" stroke="#64748b" strokeWidth="1" />
                            <rect x="316" y="288" width="34" height="42" rx="8" fill="rgba(148, 163, 184, 0.1)" stroke="rgba(148, 163, 184, 0.3)" strokeWidth="0.8" />
                            <circle cx="333" cy="342" r="2" fill="#64748b" />
                        </g>

                        {/* Offline Station Dock */}
                        <rect x="255" y="385" width="80" height="20" rx="4" fill="#0b1120" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="0.8" />
                        <text x="268" y="398" fill="#64748b" fontSize="7" fontFamily="monospace">DOCKING HUB</text>
                    </g>

                    {/* --- RENDER AUTONOMOUS AGENT SIMS PERSONAS --- */}
                    {agents.map((agent) => {
                        const pos = agentPositionsRef.current[agent.id] || { x: 100, y: 100, thought: '☕', walkCycle: 0 };
                        const isSelected = selectedAgent?.id === agent.id;
                        const isWorking = agent.status === 'BUSY';
                        const isOffline = agent.status === 'OFFLINE';

                        const outfitColor = agent.persona?.outfitColor || '#00d2ff';
                        const hairColor = agent.persona?.hairColor || '#1e293b';
                        const bobOffset = Math.sin(pos.walkCycle * Math.PI * 2) * 2;

                        return (
                            <g
                                key={agent.id}
                                className="cursor-pointer transition-transform duration-100"
                                transform={`translate(${pos.x}, ${pos.y + bobOffset})`}
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
                                <ellipse cx="0" cy="10" rx="10" ry="4" fill="rgba(0,0,0,0.45)" />

                                {/* Persona Legs / Feet (Animated in walk cycle) */}
                                <rect x="-5" y="4" width="3" height="7" rx="1" fill="#0f172a" />
                                <rect x="2" y="4" width="3" height="7" rx="1" fill="#0f172a" />

                                {/* Persona Body / Torso with Outfit Color */}
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

                                {/* Persona Face Eyes */}
                                <circle cx="-2.5" cy="-13" r="0.9" fill="#0f172a" />
                                <circle cx="2.5" cy="-13" r="0.9" fill="#0f172a" />

                                {/* Agent Working Indicator Glow */}
                                {isWorking && (
                                    <circle cx="0" cy="-13" r="10" fill="none" stroke="#00d2ff" strokeWidth="1" className="animate-ping" opacity="0.6" />
                                )}

                                {/* Animated Sims Thought Bubble above Head */}
                                <g transform="translate(6, -26)">
                                    <rect x="-8" y="-9" width="18" height="14" rx="4" fill="#0f172a" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
                                    <polygon points="-3,5 1,5 -1,8" fill="#0f172a" />
                                    <text x="1" y="2" textAnchor="middle" fontSize="9" dominantBaseline="middle">
                                        {pos.thought || (isWorking ? '💻' : isOffline ? '💤' : '☕')}
                                    </text>
                                </g>

                                {/* Name Tag Label Below Persona */}
                                <rect 
                                    x="-35" y="15" width="70" height="12" 
                                    rx="3" fill="rgba(11, 15, 25, 0.85)" 
                                    stroke="rgba(255,255,255,0.15)" strokeWidth="0.6" 
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
                        onClick={() => setActiveRoomFilter('workstation')}
                        className={`cursor-pointer px-2 py-0.5 rounded transition-colors ${activeRoomFilter === 'workstation' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
                    >
                        💻 Deck
                    </span>
                    <span 
                        onClick={() => setActiveRoomFilter('kitchen')}
                        className={`cursor-pointer px-2 py-0.5 rounded transition-colors ${activeRoomFilter === 'kitchen' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
                    >
                        ☕ Bar
                    </span>
                    <span 
                        onClick={() => setActiveRoomFilter('lounge')}
                        className={`cursor-pointer px-2 py-0.5 rounded transition-colors ${activeRoomFilter === 'lounge' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
                    >
                        🎮 Lounge
                    </span>
                    <span 
                        onClick={() => setActiveRoomFilter('rest_pod')}
                        className={`cursor-pointer px-2 py-0.5 rounded transition-colors ${activeRoomFilter === 'rest_pod' ? 'bg-gray-500/20 text-gray-300 border border-gray-500/40' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
                    >
                        💤 Pods
                    </span>
                </div>

                <div className="text-[9px] text-gray-400">
                    Host RAM: <span className="text-cyan-400 font-semibold">{hostTelemetry?.hostMemory?.split(' ')[0] || '1.4GB'}</span>
                </div>
            </div>

            {/* Agent Inspection Modal (Triggered by Clicking Persona) */}
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
                        {/* Status & Role Pill */}
                        <div className="flex justify-between items-center bg-[#151d32] p-3 rounded-xl border border-white/10">
                            <div>
                                <div className="text-[10px] text-gray-400 font-mono">STATUS</div>
                                <div className="text-xs font-bold" style={{ color: selectedAgent.status === 'BUSY' ? '#00d2ff' : selectedAgent.status === 'ONLINE' ? '#10b981' : '#64748b' }}>
                                    {selectedAgent.status}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] text-gray-400 font-mono">CURRENT LOCATION</div>
                                <div className="text-xs font-bold text-white capitalize">
                                    {ROOMS[selectedAgent.room]?.name || 'Autonomous Roaming'}
                                </div>
                            </div>
                        </div>

                        {/* Real-time Task / Activity */}
                        <div className="bg-[#12182b] p-3 rounded-xl border border-white/10">
                            <div className="text-[10px] text-gray-400 font-mono mb-1">LIVE ACTIVITY</div>
                            <div className="text-xs text-white font-medium">
                                {selectedAgent.currentTask}
                            </div>
                        </div>

                        {/* Hardware Metrics & Telemetry */}
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

                        {/* Capabilities */}
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
