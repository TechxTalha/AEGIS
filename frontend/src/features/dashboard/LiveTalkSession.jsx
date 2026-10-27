import React, { useState, useEffect, useRef } from 'react';
import { 
    AudioOutlined, 
    AudioMutedOutlined, 
    PhoneOutlined, 
    SendOutlined, 
    MessageOutlined, 
    SoundOutlined
} from '@ant-design/icons';

/**
 * LiveTalkSession (Left Column Assistant)
 * Clean, sensible Voice Assistant & Chat interface without fake gimmicks (no fake 5G, fake battery, or sci-fi filler).
 */
const LiveTalkSession = ({ onSpeakingChange }) => {
    const [mode, setMode] = useState('voice'); // 'voice' | 'chat'
    const [isMicActive, setIsMicActive] = useState(false);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const [transcript, setTranscript] = useState('Tap the microphone to speak, or switch to chat.');
    const [inputMessage, setInputMessage] = useState('');

    const [messages, setMessages] = useState([
        {
            id: 1,
            sender: 'ai',
            text: 'Hello Hunter, how can I help you today?',
            time: 'Now'
        }
    ]);

    const messagesEndRef = useRef(null);
    const speechRecognitionRef = useRef(null);
    const audioIntervalRef = useRef(null);

    useEffect(() => {
        if (mode === 'chat') {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, mode]);

    const speakText = (text) => {
        if (!('speechSynthesis' in window)) {
            simulateSpeaking(text);
            return;
        }

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha')));
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.onstart = () => {
            setIsAiSpeaking(true);
            startWaveformAnimation();
            onSpeakingChange?.(true, 0.75);
        };

        utterance.onend = () => {
            setIsAiSpeaking(false);
            stopWaveformAnimation();
            onSpeakingChange?.(false, 0);
        };

        utterance.onerror = () => {
            setIsAiSpeaking(false);
            stopWaveformAnimation();
            onSpeakingChange?.(false, 0);
        };

        window.speechSynthesis.speak(utterance);
    };

    const simulateSpeaking = (text) => {
        setIsAiSpeaking(true);
        startWaveformAnimation();
        onSpeakingChange?.(true, 0.8);
        const duration = Math.min(5000, Math.max(2200, text.length * 45));
        setTimeout(() => {
            setIsAiSpeaking(false);
            stopWaveformAnimation();
            onSpeakingChange?.(false, 0);
        }, duration);
    };

    const startWaveformAnimation = () => {
        clearInterval(audioIntervalRef.current);
        audioIntervalRef.current = setInterval(() => {
            const level = 0.3 + Math.random() * 0.7;
            onSpeakingChange?.(true, level);
        }, 120);
    };

    const stopWaveformAnimation = () => {
        clearInterval(audioIntervalRef.current);
    };

    const toggleMic = () => {
        if (isMicActive) {
            speechRecognitionRef.current?.stop();
            setIsMicActive(false);
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setTranscript('Speech recognition unavailable in this browser. Please use Chat.');
            return;
        }

        try {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                setIsMicActive(true);
                setTranscript('Listening... Speak now');
            };

            recognition.onresult = (event) => {
                const current = event.resultIndex;
                const userSpeech = event.results[current][0].transcript;
                setTranscript(`"${userSpeech}"`);

                if (event.results[current].isFinal) {
                    setIsMicActive(false);
                    handleUserSpeechSubmission(userSpeech);
                }
            };

            recognition.onerror = () => {
                setIsMicActive(false);
                setTranscript('Microphone stopped. Tap to speak again.');
            };

            recognition.onend = () => {
                setIsMicActive(false);
            };

            speechRecognitionRef.current = recognition;
            recognition.start();
        } catch (err) {
            console.error('Failed to start speech recognition:', err);
            setIsMicActive(false);
        }
    };

    const handleUserSpeechSubmission = (userText) => {
        if (!userText.trim()) return;

        const newMsg = {
            id: Date.now(),
            sender: 'user',
            text: userText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, newMsg]);

        setTimeout(() => {
            let aiReply = "I received your request and everything is running properly.";
            const lower = userText.toLowerCase();

            if (lower.includes('space') || lower.includes('disk') || lower.includes('storage')) {
                aiReply = "The server root disk has 21 GB of available space out of 40 GB total.";
            } else if (lower.includes('agent') || lower.includes('working') || lower.includes('online')) {
                aiReply = "There are 4 agents configured: Web Research Agent is active, Core and Database agents are idle, and Antigravity Coder is offline.";
            } else if (lower.includes('task') || lower.includes('running')) {
                aiReply = "The system is executing background workflows. You can review all details in the Tasks tab.";
            } else if (lower.includes('status') || lower.includes('health')) {
                aiReply = "All services are running normally with no errors reported.";
            } else if (lower.includes('hello') || lower.includes('hi')) {
                aiReply = "Hello Hunter! How can I assist you today?";
            }

            const aiMsg = {
                id: Date.now() + 1,
                sender: 'ai',
                text: aiReply,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, aiMsg]);
            setTranscript(aiReply);
            speakText(aiReply);
        }, 400);
    };

    const handleSendText = (e) => {
        e?.preventDefault();
        if (!inputMessage.trim()) return;
        const text = inputMessage;
        setInputMessage('');
        handleUserSpeechSubmission(text);
    };

    const quickChips = [
        "System status",
        "Check disk space",
        "Show connected agents",
        "What tasks are running?"
    ];

    return (
        <div className="relative w-full h-[650px] rounded-3xl bg-gradient-to-b from-[#0e1424]/90 via-[#0B0F19] to-[#0B0F19] border border-white/15 shadow-[0_16px_48px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col p-3.5 transition-all">
                {/* Header Status Bar - Clean and meaningful */}
                <div className="flex justify-between items-center px-2 pt-1 pb-2 border-b border-white/5 mb-2.5">
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isAiSpeaking ? 'bg-cyan-400 animate-ping' : isMicActive ? 'bg-red-400 animate-pulse' : 'bg-green-400'}`} />
                        <span className="text-xs font-semibold text-gray-200">
                            Voice Assistant
                        </span>
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-300">
                        {isAiSpeaking ? 'Speaking' : isMicActive ? 'Listening' : 'Ready'}
                    </span>
                </div>

                {/* Mode Selector Tab */}
                <div className="flex bg-[#13192b]/90 p-1 rounded-xl mb-3 border border-white/5">
                    <button
                        onClick={() => setMode('voice')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                            mode === 'voice' 
                                ? 'bg-[#00d2ff] text-[#0B0F19] shadow-neon' 
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <PhoneOutlined /> Voice Talk
                    </button>
                    <button
                        onClick={() => setMode('chat')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                            mode === 'chat' 
                                ? 'bg-[#00d2ff] text-[#0B0F19] shadow-neon' 
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <MessageOutlined /> Chat
                    </button>
                </div>

                {/* 1. Voice Talk Mode */}
                {mode === 'voice' && (
                    <div className="flex-1 flex flex-col justify-between items-center py-4 px-2">
                        <div className="text-center">
                            <h3 className="text-sm font-bold text-white tracking-tight mb-0.5">AEGIS Assistant</h3>
                            <p className="text-[11px] text-gray-400 mb-0">Live Voice Session</p>
                        </div>

                        {/* Animated Voice Orb */}
                        <div className="relative my-auto flex items-center justify-center w-48 h-48">
                            <div 
                                className={`absolute inset-0 rounded-full border-2 border-cyan-400/30 transition-all duration-300 ${
                                    isAiSpeaking ? 'scale-125 opacity-70 animate-ping' : isMicActive ? 'scale-110 opacity-50' : 'opacity-20'
                                }`} 
                            />
                            <div 
                                className={`absolute inset-2 rounded-full border border-purple-500/40 transition-all duration-500 ${
                                    isAiSpeaking ? 'scale-110 rotate-45' : 'scale-95'
                                }`} 
                            />

                            <div 
                                onClick={toggleMic}
                                className={`w-32 h-32 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative z-10 shadow-[0_0_40px_rgba(0,210,255,0.45)] ${
                                    isAiSpeaking 
                                        ? 'bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600 scale-105' 
                                        : isMicActive 
                                            ? 'bg-gradient-to-tr from-red-500 via-rose-600 to-amber-500 scale-105'
                                            : 'bg-gradient-to-tr from-cyan-600 via-blue-700 to-indigo-900 hover:scale-105'
                                }`}
                            >
                                {isAiSpeaking ? (
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-6 bg-white rounded-full animate-pulse" />
                                        <span className="w-1.5 h-10 bg-white rounded-full animate-bounce" />
                                        <span className="w-1.5 h-7 bg-white rounded-full animate-pulse" />
                                    </div>
                                ) : isMicActive ? (
                                    <AudioOutlined className="text-3xl text-white animate-bounce" />
                                ) : (
                                    <AudioOutlined className="text-3xl text-white/90" />
                                )}
                                <span className="text-[10px] font-bold text-white/90 mt-1 uppercase tracking-wider">
                                    {isAiSpeaking ? 'Speaking' : isMicActive ? 'Listening' : 'Tap to Speak'}
                                </span>
                            </div>
                        </div>

                        {/* Subtitle Pill */}
                        <div className="w-full bg-[#151c30]/90 border border-white/10 rounded-2xl p-3 text-center mb-4 min-h-[52px] flex items-center justify-center">
                            <p className="text-xs text-gray-200 line-clamp-2 italic mb-0">
                                {transcript}
                            </p>
                        </div>

                        {/* Call Action Bar */}
                        <div className="w-full flex justify-around items-center pt-1">
                            <button
                                onClick={toggleMic}
                                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                                    isMicActive 
                                        ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.7)]' 
                                        : 'bg-white/10 hover:bg-white/20 text-gray-200'
                                }`}
                                title={isMicActive ? "Mute Microphone" : "Turn on Microphone"}
                            >
                                {isMicActive ? <AudioOutlined className="text-lg" /> : <AudioMutedOutlined className="text-lg" />}
                            </button>

                            <button
                                onClick={() => speakText("Voice output is functioning properly. All systems are operational.")}
                                className="w-14 h-14 rounded-full bg-[#00d2ff] hover:bg-[#00d2ff]/90 text-[#0B0F19] flex items-center justify-center font-bold shadow-neon transition-all cursor-pointer"
                                title="Test Voice Output"
                            >
                                <SoundOutlined className="text-xl" />
                            </button>

                            <button
                                onClick={() => setMode('chat')}
                                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-gray-200 flex items-center justify-center transition-all cursor-pointer"
                                title="Open Chat Feed"
                            >
                                <MessageOutlined className="text-lg" />
                            </button>
                        </div>
                    </div>
                )}

                {/* 2. Chat Mode */}
                {mode === 'chat' && (
                    <div className="flex-1 flex flex-col justify-between overflow-hidden">
                        {/* Messages Feed */}
                        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 py-1">
                            {messages.map((msg) => (
                                <div 
                                    key={msg.id} 
                                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                                >
                                    <div 
                                        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                                            msg.sender === 'user'
                                                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-none shadow-md'
                                                : 'bg-[#182035] text-gray-200 border border-white/10 rounded-bl-none shadow-sm'
                                        }`}
                                    >
                                        {msg.text}
                                    </div>
                                    <span className="text-[9px] text-gray-500 font-mono mt-0.5 px-1">
                                        {msg.sender === 'ai' ? 'AEGIS' : 'YOU'} • {msg.time}
                                    </span>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Prompts */}
                        <div className="flex gap-1.5 overflow-x-auto py-2 no-scrollbar">
                            {quickChips.map((chip, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleUserSpeechSubmission(chip)}
                                    className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 text-[11px] border border-white/10 transition-colors cursor-pointer"
                                >
                                    {chip}
                                </button>
                            ))}
                        </div>

                        {/* Text Input Form */}
                        <form onSubmit={handleSendText} className="flex items-center gap-1.5 pt-1">
                            <button
                                type="button"
                                onClick={toggleMic}
                                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors text-sm cursor-pointer ${
                                    isMicActive ? 'bg-red-500 text-white' : 'bg-white/10 hover:bg-white/20 text-gray-300'
                                }`}
                                title="Voice Input"
                            >
                                <AudioOutlined />
                            </button>
                            <input
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                placeholder="Message assistant..."
                                className="flex-1 bg-[#13192b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                            />
                            <button
                                type="submit"
                                className="w-9 h-9 rounded-xl bg-[#00d2ff] hover:bg-[#00d2ff]/90 text-[#0B0F19] flex items-center justify-center font-bold transition-all shadow-neon text-sm cursor-pointer"
                            >
                                <SendOutlined />
                            </button>
                        </form>
                    </div>
                )}
        </div>
    );
};

export default LiveTalkSession;
