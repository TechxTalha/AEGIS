import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { PlusOutlined, ReloadOutlined, AudioOutlined } from '@ant-design/icons';
import { taskApi } from '../../api/taskApi';
import DigitalSignalsGlobe from './DigitalSignalsGlobe';
import LiveTalkSession from './LiveTalkSession';
import AgentWorkstations from './AgentWorkstations';

/**
 * DashboardPage (Redesigned)
 * - Summaries removed entirely.
 * - Centerpiece: 3D Holographic Digital Signals Globe with audio reactivity.
 * - Live Talk & Smartphone Chat Session with speech synthesis and voice wave aura.
 * - Animated Agent Desktops & Cyber Lounge (Offline absent, Free resting on sofa with drink, Working locked into multi-screens).
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

    // Handle audio activity when AI speaks from Phone Voice Talk
    const handleSpeakingChange = (speaking, level = 0.5) => {
        setIsAiSpeaking(speaking);
        setAudioLevel(level);
    };

    // Trigger test speech pulse
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
        <div className="animate-fade-in pb-12 px-2 max-w-7xl mx-auto">
            {/* Top Command Center Header */}
            <div className="mb-6 pt-1 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#00d2ff] shadow-neon animate-pulse" />
                        <h1 className="text-2xl font-bold tracking-tight text-white mb-0">
                            AEGIS Command Matrix
                        </h1>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-400 border border-cyan-500/30 font-mono">
                            v2.4 • NODE 169.58.232.237
                        </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-0">
                        Holographic signal transmission, voice communications uplink, and agent workstation lounge.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <Button 
                        icon={<ReloadOutlined spin={loading} />} 
                        onClick={() => { setLoading(true); fetchTasks().finally(() => setLoading(false)); }} 
                        className="border-white/10 text-gray-300 hover:text-white bg-white/5"
                        title="Sync Telemetry"
                    />
                    <Button 
                        type="primary" 
                        icon={<PlusOutlined />} 
                        onClick={() => navigate('/tasks')} 
                        className="bg-primary text-[#0B0F19] font-bold border-none shadow-neon hover:bg-primary/90"
                    >
                        Launch Task
                    </Button>
                </div>
            </div>

            {/* Main Stage: Digital Signals Globe & Phone Comms Session */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Central Digital Signals Holographic Globe */}
                <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
                    <DigitalSignalsGlobe 
                        isSpeaking={isAiSpeaking} 
                        audioLevel={audioLevel} 
                        onTriggerSpeakTest={handleTestSpeak}
                    />
                </div>

                {/* Smartphone Live Talk & Cyber Chat */}
                <div className="lg:col-span-5 xl:col-span-4 flex justify-center">
                    <LiveTalkSession 
                        onSpeakingChange={handleSpeakingChange} 
                        activeTaskCount={tasks.filter(t => t.status === 'EXECUTING').length}
                    />
                </div>
            </div>

            {/* Bottom Operations Hub: Animated Agents & Desktops / Cyber Lounge */}
            <div className="mt-8">
                <AgentWorkstations liveTasks={tasks} />
            </div>
        </div>
    );
};

export default DashboardPage;
