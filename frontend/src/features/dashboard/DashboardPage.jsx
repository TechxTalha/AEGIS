import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { taskApi } from '../../api/taskApi';
import DigitalSignalsGlobe from './DigitalSignalsGlobe';
import LiveTalkSession from './LiveTalkSession';
import AgentWorkstations from './AgentWorkstations';

/**
 * DashboardPage (3-Column Command Matrix Layout)
 * - Left: Live Talk & Cyber Chat (Smartphone Comms)
 * - Center: Digital Signals Holographic Globe (Audio-Reactive)
 * - Right: Animated Agent Workstations (AEGIS Core, Database, Web Research, Antigravity Coder)
 * - Full-width, zero-scroll responsive layout with prominent header logo.
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
            {/* Top Command Center Bar */}
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

            {/* 3-Column Symmetrical Command Layout: Left (Chat), Center (Globe), Right (Agents) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 xl:gap-4 items-stretch w-full">
                {/* Column 1 (LEFT): Live Talk & Cyber Chat Phone */}
                <div className="lg:col-span-3 xl:col-span-3 2xl:col-span-3 flex justify-center">
                    <LiveTalkSession 
                        onSpeakingChange={handleSpeakingChange} 
                    />
                </div>

                {/* Column 2 (CENTER): Digital Signals Holographic Globe */}
                <div className="lg:col-span-6 xl:col-span-6 2xl:col-span-6 flex flex-col">
                    <DigitalSignalsGlobe 
                        isSpeaking={isAiSpeaking} 
                        audioLevel={audioLevel} 
                        onTriggerSpeakTest={handleTestSpeak}
                    />
                </div>

                {/* Column 3 (RIGHT): Animated Agent Workstations */}
                <div className="lg:col-span-3 xl:col-span-3 2xl:col-span-3 flex flex-col">
                    <AgentWorkstations 
                        liveTasks={tasks} 
                    />
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
