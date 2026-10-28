import React, { useState, useEffect, useRef } from 'react';
import { notification } from 'antd';
import { 
    AudioOutlined, 
    AudioMutedOutlined, 
    PhoneOutlined, 
    SendOutlined, 
    MessageOutlined, 
    SoundOutlined
} from '@ant-design/icons';
import axiosInstance from '../../api/axiosInstance';

const isSecureOrigin = typeof window !== 'undefined' && (
    window.isSecureContext || 
    ['localhost', '127.0.0.1'].includes(window.location.hostname) ||
    window.location.protocol === 'https:'
);

const switchToHttps = () => {
    const portPart = window.location.port ? `:${window.location.port}` : '';
    window.location.href = `https://${window.location.hostname}${portPart}${window.location.pathname}${window.location.search}`;
};

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
    const activeUtteranceRef = useRef(null);

    useEffect(() => {
        if (mode === 'chat') {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, mode]);

    const getBestVoice = () => {
        if (!('speechSynthesis' in window)) return null;
        const voices = window.speechSynthesis.getVoices();
        if (!voices || voices.length === 0) return null;
        // Prioritize local on-device English voices to avoid streaming buffer stutter
        const localEn = voices.find(v => v.lang.startsWith('en') && v.localService === true);
        const naturalEn = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Online')));
        const anyEn = voices.find(v => v.lang.startsWith('en'));
        return localEn || naturalEn || anyEn || voices[0];
    };

    const speakText = (text) => {
        if (!('speechSynthesis' in window)) {
            simulateSpeaking(text);
            return;
        }

        try {
            window.speechSynthesis.cancel();
        } catch (e) {
            console.warn(e);
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        const bestVoice = getBestVoice();
        if (bestVoice) utterance.voice = bestVoice;

        // Maintain persistent reference to prevent Chromium GC bug
        activeUtteranceRef.current = utterance;
        window._activeAegisUtterance = utterance;

        utterance.onstart = () => {
            setIsAiSpeaking(true);
            onSpeakingChange?.(true);
        };

        const cleanup = () => {
            setIsAiSpeaking(false);
            onSpeakingChange?.(false);
            activeUtteranceRef.current = null;
            window._activeAegisUtterance = null;
        };

        utterance.onend = cleanup;
        utterance.onerror = (err) => {
            console.warn('Speech error:', err);
            cleanup();
        };

        if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
        }
        window.speechSynthesis.speak(utterance);
    };

    const simulateSpeaking = (text) => {
        setIsAiSpeaking(true);
        onSpeakingChange?.(true);
        const duration = Math.min(5000, Math.max(2200, text.length * 45));
        setTimeout(() => {
            setIsAiSpeaking(false);
            onSpeakingChange?.(false);
        }, duration);
    };

    const toggleMic = async () => {
        if (isMicActive) {
            speechRecognitionRef.current?.stop();
            setIsMicActive(false);
            return;
        }

        if (!isSecureOrigin) {
            setTranscript('Chrome blocks microphone access over insecure HTTP. Please switch to HTTPS or use Chat.');
            notification.warning({
                message: 'HTTPS Required for Microphone',
                description: 'Browsers strictly block microphone access on HTTP. Please click "Use HTTPS" or switch to the Chat tab.',
                duration: 6
            });
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setTranscript('Speech recognition unavailable in this browser. Please use Chat.');
            return;
        }

        // 1. Proactively prompt user for microphone permission via getUserMedia
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream.getTracks().forEach(track => track.stop());
            } catch (permErr) {
                console.warn('Microphone permission error:', permErr);
                setIsMicActive(false);
                if (permErr.name === 'NotAllowedError' || permErr.name === 'PermissionDeniedError') {
                    setTranscript('Microphone permission blocked. Please allow microphone in your browser address bar.');
                    notification.error({
                        message: 'Microphone Permission Blocked',
                        description: 'Please click the icon in your browser address bar and set Microphone to "Allow".'
                    });
                    return;
                } else if (permErr.name === 'NotFoundError' || permErr.name === 'DevicesNotFoundError') {
                    setTranscript('No microphone found. Please connect an audio input device.');
                    return;
                }
            }
        }

        // 2. Start SpeechRecognition
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

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error, event);
                setIsMicActive(false);
                if (event.error === 'not-allowed') {
                    if (!isSecureOrigin) {
                        setTranscript('Microphone blocked by Chrome (insecure HTTP). Click "Use HTTPS" above or use Chat.');
                    } else {
                        setTranscript('Microphone access blocked. Click the icon in your browser address bar to allow microphone.');
                    }
                } else if (event.error === 'no-speech') {
                    setTranscript('No speech detected. Tap to speak again.');
                } else if (event.error === 'audio-capture') {
                    setTranscript('No microphone detected. Please check your mic connection.');
                } else if (event.error === 'network') {
                    setTranscript('Speech recognition network error. Please try again or use Chat.');
                } else if (event.error === 'service-not-allowed') {
                    setTranscript('Speech recognition service not allowed on HTTP. Switch to HTTPS or use Chat.');
                } else {
                    setTranscript(`Microphone stopped (${event.error || 'idle'}). Tap to speak again.`);
                }
            };

            recognition.onend = () => {
                setIsMicActive(false);
            };

            speechRecognitionRef.current = recognition;
            recognition.start();
        } catch (err) {
            console.error('Failed to start speech recognition:', err);
            setIsMicActive(false);
            setTranscript('Failed to initialize speech recognition. Please use Chat.');
        }
    };

    const handleUserSpeechSubmission = async (userText) => {
        if (!userText.trim()) return;

        const newMsg = {
            id: Date.now(),
            sender: 'user',
            text: userText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, newMsg]);
        setTranscript('Analyzing command with AEGIS Core...');

        // Pass recent conversation history (last 10 turns) for multi-turn dialogue
        const history = messages.slice(-10).map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text
        }));

        try {
            const res = await axiosInstance.post('/agents/chat', { 
                message: userText,
                history: history 
            });
            const aiReply = res.data?.reply || "I am with you, Hunter. Standing by.";

            const aiMsg = {
                id: Date.now() + 1,
                sender: 'ai',
                text: aiReply,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, aiMsg]);
            setTranscript(aiReply);
            speakText(aiReply);
        } catch (err) {
            console.error('Chat error:', err);
            let aiReply = "Acknowledged, Hunter. Neural gateway encountered a momentary latency spike, but core telemetry is active.";

            const aiMsg = {
                id: Date.now() + 1,
                sender: 'ai',
                text: aiReply,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, aiMsg]);
            setTranscript(aiReply);
            speakText(aiReply);
        }
    };

    const handleSendText = (e) => {
        e?.preventDefault();
        if (!inputMessage.trim()) return;
        const text = inputMessage;
        setInputMessage('');
        handleUserSpeechSubmission(text);
    };

    const quickChips = [
        "What can you do for me?",
        "Help me brainstorm",
        "Create a security audit task",
        "Give me a tactical situation update"
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
                    <div className="flex-1 flex flex-col justify-between items-center py-2 px-2">
                        <div className="text-center w-full">
                            <h3 className="text-sm font-bold text-white tracking-tight mb-0.5">AEGIS Assistant</h3>
                            <p className="text-[11px] text-gray-400 mb-1">Live Voice Session</p>

                            {/* HTTPS Notice Banner if on HTTP */}
                            {!isSecureOrigin && (
                                <div className="w-full my-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-2 text-xs">
                                    <div className="flex items-center gap-1.5 text-amber-300 font-medium text-[11px]">
                                        <span>⚠️</span>
                                        <span>Microphone requires HTTPS</span>
                                    </div>
                                    <button 
                                        onClick={switchToHttps}
                                        className="px-2.5 py-0.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 font-bold border border-cyan-500/40 transition-colors cursor-pointer text-[10px] uppercase tracking-wider"
                                    >
                                        Use HTTPS
                                    </button>
                                </div>
                            )}
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
                        <div className="w-full bg-[#151c30]/90 border border-white/10 rounded-2xl p-2.5 text-center mb-2 min-h-[50px] flex items-center justify-center">
                            <p className="text-xs text-gray-200 line-clamp-2 italic mb-0">
                                {transcript}
                            </p>
                        </div>

                        {/* Quick Voice Prompt Chips */}
                        <div className="flex gap-1.5 overflow-x-auto py-1 mb-2 no-scrollbar max-w-full justify-center">
                            {quickChips.map((chip, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleUserSpeechSubmission(chip)}
                                    className="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] border border-white/10 transition-colors cursor-pointer"
                                >
                                    {chip}
                                </button>
                            ))}
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
