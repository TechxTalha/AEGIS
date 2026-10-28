import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { taskApi } from '../../api/taskApi';
import DigitalSignalsGlobe from './DigitalSignalsGlobe';
import LiveTalkSession from './LiveTalkSession';
import SimsAgentHouse from './SimsAgentHouse';

/**
 * DashboardPage (3-Column Command Matrix Layout)
 * - Left: Live Talk & Cyber Chat (Smartphone Comms)
 * - Center: Digital Signals Holographic Globe (Audio-Reactive)
 * - Right: Sims-Style 3D Roof-Off Agent House (Interactive Roaming Personas)
 * - Full-width, zero-scroll responsive layout with prominent header logo.
 */
const DashboardPage = () => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);

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

    const handleSpeakingChange = (speaking) => {
        setIsAiSpeaking(speaking);
    };

    const handleTestSpeak = () => {
        setIsAiSpeaking(true);

        if ('speechSynthesis' in window) {
            try {
                window.speechSynthesis.cancel();
            } catch (e) {
                console.warn(e);
            }

            const utterance = new SpeechSynthesisUtterance("Hello Hunter, AEGIS system is online and ready for your commands.");
            utterance.rate = 1.0;
            utterance.pitch = 1.0;

            const voices = window.speechSynthesis.getVoices();
            if (voices && voices.length > 0) {
                const localEn = voices.find(v => v.lang.startsWith('en') && v.localService === true);
                const naturalEn = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Online')));
                const anyEn = voices.find(v => v.lang.startsWith('en'));
                const selectedVoice = localEn || naturalEn || anyEn || voices[0];
                if (selectedVoice) utterance.voice = selectedVoice;
            }

            window._activeAegisUtterance = utterance;

            utterance.onstart = () => {
                setIsAiSpeaking(true);
            };

            const cleanup = () => {
                setIsAiSpeaking(false);
                window._activeAegisUtterance = null;
            };

            utterance.onend = cleanup;
            utterance.onerror = (err) => {
                console.warn('Speech test error:', err);
                cleanup();
            };

            if (window.speechSynthesis.paused) {
                window.speechSynthesis.resume();
            }
            window.speechSynthesis.speak(utterance);
        } else {
            setTimeout(() => {
                setIsAiSpeaking(false);
            }, 2500);
        }
    };

    return (
        <div className="animate-fade-in w-full my-auto">
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
                        onTriggerSpeakTest={handleTestSpeak}
                    />
                </div>

                {/* Column 3 (RIGHT): 3D Roof-Off Sims Agent House */}
                <div className="lg:col-span-3 xl:col-span-3 2xl:col-span-3 flex flex-col">
                    <SimsAgentHouse 
                        liveTasks={tasks} 
                    />
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
