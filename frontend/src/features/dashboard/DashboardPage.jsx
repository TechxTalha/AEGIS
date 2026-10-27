import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { taskApi } from '../../api/taskApi';
import DigitalSignalsGlobe from './DigitalSignalsGlobe';
import LiveTalkSession from './LiveTalkSession';
import AgentWorkstations from './AgentWorkstations';

/**
 * DashboardPage (Widescreen Full-Bleed Command Matrix)
 * - Zero summaries.
 * - Utilizes 100% of the screen width (no max-w-7xl restriction).
 * - Perfectly scaled to fit desktop screen without vertical scrolling.
 * - Spacious components with rich aesthetics that don't feel squished.
 * - Central 3D Digital Signals Globe with audio-reactive waveforms.
 * - Smartphone-styled Live Voice Talk & Cyber Chat.
 * - Animated Agent Workstations (AEGIS Core, Database, Web Research, Antigravity Coder).
 */
const DashboardPage = () => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0);

    const fetchTasks = async () => {
        try {
            const data = await taskApi.getUserTasks();
            setTasks(data || []);
        } catch (err) {
            console.error('Failed to fetch tasks:', err);
        }
    };

    useEffect(() => {
        fetchTasks();
        const interval = setInterval(fetchTasks, 7000);
        return () => clearInterval(interval);
    }, []);

    const handleSpeakingChange = (speaking, level = 0.5) => {
        setIsAiSpeaking(speaking);
        setAudioLevel(level);
    };

    const handleTestSpeak = () => {
        setIsAiSpeaking(true);
        setAudioLevel(0.85);

        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance("AEGIS Central Signals Hub active. Audio transmission confirmed.");
            utterance.rate = 1.05;
            utterance.pitch = 0.95;
            utterance.onend = () => {
                setIsAiSpeaking(false);
                setAudioLevel(0);
            };
            utterance.onerror = () => {
                setIsAiSpeaking(false);
                setAudioLevel(0);
            };
            window.speechSynthesis.speak(utterance);
        } else {
            setTimeout(() => {
                setIsAiSpeaking(false);
                setAudioLevel(0);
            }, 3000);
        }
    };

    return (
        <div className="animate-fade-in w-full pb-2 px-1 lg:px-3 flex flex-col justify-start">
            {/* Top Command Center Header */}
            <div className="mb-2.5 flex justify-between items-center border-b border-white/5 pb-2">
                <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00d2ff] shadow-neon animate-pulse" />
                    <h1 className="text-xl font-bold tracking-tight text-white mb-0">
                        AEGIS Command Matrix
                    </h1>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-950/60 text-cyan-400 border border-cyan-500/30 font-mono tracking-wider">
                        v2.4 • NODE 169.58.232.237
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <Button 
                        size="small"
                        icon={<ReloadOutlined spin={loading} />} 
                        onClick={() => { setLoading(true); fetchTasks().finally(() => setLoading(false)); }} 
                        className="border-white/10 text-gray-300 hover:text-white bg-white/5"
                        title="Sync Telemetry"
                    />
                    <Button 
                        size="small"
                        type="primary" 
                        icon={<PlusOutlined />} 
                        onClick={() => navigate('/tasks')} 
                        className="bg-primary text-[#0B0F19] font-bold border-none shadow-neon hover:bg-primary/90 text-xs px-3"
                    >
                        Launch Task
                    </Button>
                </div>
            </div>

            {/* Main Stage: Widescreen Globe & Phone Comms Session */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
                {/* Central Digital Signals Holographic Globe (Wide viewport) */}
                <div className="lg:col-span-8 xl:col-span-8 2xl:col-span-9 flex flex-col h-full">
                    <DigitalSignalsGlobe 
                        isSpeaking={isAiSpeaking} 
                        audioLevel={audioLevel} 
                        onTriggerSpeakTest={handleTestSpeak}
                    />
                </div>

                {/* Smartphone Live Talk & Cyber Chat */}
                <div className="lg:col-span-4 xl:col-span-4 2xl:col-span-3 flex justify-center h-full">
                    <LiveTalkSession 
                        onSpeakingChange={handleSpeakingChange} 
                    />
                </div>
            </div>

            {/* Bottom Operations Hub: Animated Agents & Desktops / Cyber Lounge */}
            <div className="mt-3">
                <AgentWorkstations liveTasks={tasks} />
            </div>
        </div>
    );
};

export default DashboardPage;
