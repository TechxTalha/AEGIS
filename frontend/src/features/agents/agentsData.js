// Shared agents data model and state for AEGIS Command
// Ensures 100% consistency between Dashboard and Agents page

export const DEFAULT_AGENTS = [
    {
        id: 'agent-core-1',
        name: 'AEGIS Core Orchestrator',
        type: 'System',
        status: 'ONLINE', // 'ONLINE' (Free/Idle) | 'BUSY' (Working/Locked In) | 'OFFLINE'
        capabilities: ['plan', 'execute', 'reason'],
        drink: 'Coffee',
        currentTask: 'Idle - ready for new tasks',
        cpu: 18,
        vram: '4.8 GB'
    },
    {
        id: 'agent-db-worker',
        name: 'Database Agent',
        type: 'Specialized',
        status: 'ONLINE', // 'ONLINE' (Free/Idle)
        capabilities: ['sql.read', 'sql.write', 'schema.analyze'],
        drink: 'Tea',
        currentTask: 'Idle - database connected',
        cpu: 12,
        vram: '2.1 GB'
    },
    {
        id: 'agent-research-1',
        name: 'Web Research Agent',
        type: 'Specialized',
        status: 'BUSY', // 'BUSY' (Working/Locked In)
        capabilities: ['web.search', 'web.scrape'],
        drink: 'Water',
        currentTask: 'Processing web documentation search',
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
        currentTask: 'Disconnected',
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
                // If any agent still has old goofy drink or task text, update it
                return parsed.map((a, i) => ({
                    ...DEFAULT_AGENTS[i],
                    ...a,
                    drink: DEFAULT_AGENTS[i].drink
                }));
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
