// Shared agents data model and state for AEGIS Command
// Ensures 100% consistency between Dashboard and Agents page

export const DEFAULT_AGENTS = [
    {
        id: 'agent-core-1',
        name: 'AEGIS Core Orchestrator',
        type: 'System',
        status: 'ONLINE', // 'ONLINE' (Free/Resting) | 'BUSY' (Working/Locked In) | 'OFFLINE'
        capabilities: ['plan', 'execute', 'reason'],
        drink: 'Quantum Espresso',
        currentTask: 'Directing Task Orchestration & Neural Graph',
        cpu: 18,
        vram: '4.8 GB'
    },
    {
        id: 'agent-db-worker',
        name: 'Database Agent',
        type: 'Specialized',
        status: 'ONLINE', // 'ONLINE' (Free/Resting)
        capabilities: ['sql.read', 'sql.write', 'schema.analyze'],
        drink: 'Cold-Brew Synth Latte',
        currentTask: 'Standby: Replicating Vector Cache',
        cpu: 12,
        vram: '2.1 GB'
    },
    {
        id: 'agent-research-1',
        name: 'Web Research Agent',
        type: 'Specialized',
        status: 'BUSY', // 'BUSY' (Working/Locked In)
        capabilities: ['web.search', 'web.scrape'],
        drink: 'Matcha Bio-Fuel',
        currentTask: 'Scraping Web Targets & Ingesting KB',
        cpu: 86,
        vram: '6.4 GB'
    },
    {
        id: 'agent-coder-x',
        name: 'Antigravity Coder',
        type: 'External',
        status: 'OFFLINE', // 'OFFLINE' (Absent / Not Present)
        capabilities: ['fs.write', 'git.commit', 'ide.edit'],
        drink: 'None',
        currentTask: 'Disconnected // Absent from Desk',
        cpu: 0,
        vram: '0 GB'
    }
];

const STORAGE_KEY = 'aegis_agents_state';

export const getStoredAgents = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length === 4) {
                return parsed;
            }
        }
    } catch (e) {
        console.warn('Failed to parse stored agents:', e);
    }
    return DEFAULT_AGENTS;
};

export const saveStoredAgents = (agents) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(agents));
        window.dispatchEvent(new Event('aegis_agents_updated'));
    } catch (e) {
        console.error('Failed to save agents:', e);
    }
};
