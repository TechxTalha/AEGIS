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
            const utterance = new SpeechSynthesisUtterance("Hello Hunter, AEGIS system is online and ready for your commands.");
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
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
            }, 2500);
        }
    };

    return (
        <div className="animate-fade-in w-full h-full flex flex-col justify-center">
            {/* 3-Column Symmetrical Command Layout: Left (Chat/Voice), Center (Globe), Right (Agents) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 xl:gap-4 items-stretch w-full">
                {/* Column 1 (LEFT): Live Talk & Comms Session */}
                <div className="lg:col-span-3 xl:col-span-3 2xl:col-span-3 flex flex-col">
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
