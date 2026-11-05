import React, { useState, useEffect, useRef } from 'react';
import { notification } from 'antd';
import { 
    AudioOutlined, 
    SendOutlined, 
    SoundOutlined,
    StopOutlined,
    ThunderboltOutlined
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

// Wake word matcher: "Hello Aegis", "Hey Aegis", "Hi Aegis", "OK Aegis", "Aegis" (including common phonetics)
const WAKE_WORD_REGEX = /(?:hello|hey|hi|ok|okay)?\s*(?:aegis|egis|agis|ages|aigis)\b/i;

// Futuristic ascending dual-tone chime (Web Audio API)
const playWakeChime = () => {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // High-tech ascending tonal chirp: D5 (587.33 Hz) -> A5 (880 Hz)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.32);
    } catch (e) {
        console.debug('Wake chime error:', e);
    }
};

/**
 * LiveTalkSession (Left Column Command Assistant)
 * Unified single-surface voice and text interface with Hands-Free "Hello Aegis" Wake Word.
 * Clean, consistent executive command aesthetic.
 */
const LiveTalkSession = ({ onSpeakingChange }) => {
    const [isMicActive, setIsMicActive] = useState(false);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const [isVoiceOutputEnabled, setIsVoiceOutputEnabled] = useState(true);
    const [isWaitingForAi, setIsWaitingForAi] = useState(false);
    const [listeningInterim, setListeningInterim] = useState('');
    const [inputMessage, setInputMessage] = useState('');
    const [showHttpsBanner, setShowHttpsBanner] = useState(false);

    // Hands-Free Wake Word State ("Hello Aegis")
    const [isWakeWordEnabled, setIsWakeWordEnabled] = useState(() => {
        try {
            const stored = localStorage.getItem('aegis_wake_word_enabled');
            return stored !== null ? stored === 'true' : true;
        } catch (e) {
            return true;
        }
    });
    const [isAwakened, setIsAwakened] = useState(false);

    const [messages, setMessages] = useState([
        {
            id: 1,
            sender: 'ai',
            text: 'AEGIS Core is online. Say "Hello Aegis" or speak/type directives, Hunter.',
            time: '00:00'
        }
    ]);

    const messagesEndRef = useRef(null);
    const activeRecognitionRef = useRef(null);
    const wakeRecognitionRef = useRef(null);
    const wakeRestartTimeoutRef = useRef(null);
    const awakenedTimerRef = useRef(null);
    const activeUtteranceRef = useRef(null);

    // State refs to prevent stale closures in recognition event handlers
    const isWakeWordEnabledRef = useRef(isWakeWordEnabled);
    const isMicActiveRef = useRef(isMicActive);
    const isAiSpeakingRef = useRef(isAiSpeaking);
    const isWaitingForAiRef = useRef(isWaitingForAi);

    useEffect(() => {
        isWakeWordEnabledRef.current = isWakeWordEnabled;
        try {
            localStorage.setItem('aegis_wake_word_enabled', String(isWakeWordEnabled));
        } catch (e) {}
    }, [isWakeWordEnabled]);

    useEffect(() => {
        isMicActiveRef.current = isMicActive;
    }, [isMicActive]);

    useEffect(() => {
        isAiSpeakingRef.current = isAiSpeaking;
    }, [isAiSpeaking]);

    useEffect(() => {
        isWaitingForAiRef.current = isWaitingForAi;
    }, [isWaitingForAi]);

    // Auto-scroll on new messages or state changes
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isWaitingForAi, listeningInterim]);

    // Priority voice selector
    const getBestVoice = () => {
        if (!('speechSynthesis' in window)) return null;
        const voices = window.speechSynthesis.getVoices();
        if (!voices || voices.length === 0) return null;
        const localEn = voices.find(v => v.lang.startsWith('en') && v.localService === true);
        const naturalEn = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Online')));
        const anyEn = voices.find(v => v.lang.startsWith('en'));
        return localEn || naturalEn || anyEn || voices[0];
    };

    // Voice synthesis with GC protection
    const speakText = (text) => {
        if (!isVoiceOutputEnabled) {
            scheduleWakeWordRestart(500);
            return;
        }

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

        // Pin utterance reference to window to avoid Chromium Garbage Collection dropping onend callback
        activeUtteranceRef.current = utterance;
        window._activeAegisUtterance = utterance;

        utterance.onstart = () => {
            setIsAiSpeaking(true);
            onSpeakingChange?.(true);
            stopWakeWordListener();
        };

        const cleanup = () => {
            setIsAiSpeaking(false);
            onSpeakingChange?.(false);
            activeUtteranceRef.current = null;
            window._activeAegisUtterance = null;
            scheduleWakeWordRestart(700);
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

    const stopSpeaking = () => {
        if ('speechSynthesis' in window) {
            try {
                window.speechSynthesis.cancel();
            } catch (e) {
                console.warn(e);
            }
        }
        setIsAiSpeaking(false);
        onSpeakingChange?.(false);
        activeUtteranceRef.current = null;
        window._activeAegisUtterance = null;
        scheduleWakeWordRestart(700);
    };

    const simulateSpeaking = (text) => {
        setIsAiSpeaking(true);
        onSpeakingChange?.(true);
        stopWakeWordListener();
        const duration = Math.min(5000, Math.max(2200, text.length * 45));
        setTimeout(() => {
            setIsAiSpeaking(false);
            onSpeakingChange?.(false);
            scheduleWakeWordRestart(700);
        }, duration);
    };

    // Schedule restart for continuous Wake-Word detection
    const scheduleWakeWordRestart = (delayMs = 400) => {
        if (wakeRestartTimeoutRef.current) {
            clearTimeout(wakeRestartTimeoutRef.current);
        }
        wakeRestartTimeoutRef.current = setTimeout(() => {
            if (
                isWakeWordEnabledRef.current &&
                !isMicActiveRef.current &&
                !isAiSpeakingRef.current &&
                !isWaitingForAiRef.current
            ) {
                startWakeWordListener();
            }
        }, delayMs);
    };

    const stopWakeWordListener = () => {
        if (wakeRestartTimeoutRef.current) {
            clearTimeout(wakeRestartTimeoutRef.current);
            wakeRestartTimeoutRef.current = null;
        }
        if (wakeRecognitionRef.current) {
            try {
                wakeRecognitionRef.current.onend = null;
                wakeRecognitionRef.current.onerror = null;
                wakeRecognitionRef.current.stop();
            } catch (e) {}
            wakeRecognitionRef.current = null;
        }
    };

    // Ambient Wake Word Listener ("Hello Aegis")
    const startWakeWordListener = () => {
        if (!isSecureOrigin || !isWakeWordEnabledRef.current) return;
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        // Never run wake listener if already listening to command or AI speaking
        if (isMicActiveRef.current || isAiSpeakingRef.current || isWaitingForAiRef.current) return;

        stopWakeWordListener();

        try {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = (event) => {
                if (isMicActiveRef.current || isAiSpeakingRef.current || isWaitingForAiRef.current) return;

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript.trim();
                    const isFinal = event.results[i].isFinal;

                    const match = transcript.match(WAKE_WORD_REGEX);
                    if (match) {
                        playWakeChime();

                        // Flash awakened indicator
                        setIsAwakened(true);
                        if (awakenedTimerRef.current) clearTimeout(awakenedTimerRef.current);
                        awakenedTimerRef.current = setTimeout(() => setIsAwakened(false), 3500);

                        // Extract command remainder spoken after wake word
                        const remainder = transcript
                            .slice(match.index + match[0].length)
                            .replace(/^[\s,.\-—:]+/, '')
                            .trim();

                        // Cease wake listener immediately
                        stopWakeWordListener();

                        if (remainder.length > 2 && isFinal) {
                            // Directive spoken in one breath: "Hello Aegis, check memory status"
                            handleSendMessage(remainder, true);
                        } else {
                            // Standalone wake word: "Hello Aegis" -> start active command recording
                            startActiveListening(remainder);
                        }
                        return;
                    }
                }
            };

            recognition.onerror = (event) => {
                if (event.error === 'not-allowed') {
                    console.debug('Wake word permission prompt required');
                }
            };

            recognition.onend = () => {
                scheduleWakeWordRestart(400);
            };

            wakeRecognitionRef.current = recognition;
            recognition.start();
        } catch (e) {
            console.debug('Wake word start deferred:', e);
        }
    };

    // Start Active Command Speech Recognition
    const startActiveListening = async (prefilledText = '') => {
        stopSpeaking();
        stopWakeWordListener();

        if (!isSecureOrigin) {
            setShowHttpsBanner(true);
            notification.warning({
                message: 'HTTPS Required for Microphone',
                description: 'Browsers block microphone access on insecure HTTP. Please switch to HTTPS.',
                duration: 5
            });
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            notification.error({
                message: 'Speech Recognition Unavailable',
                description: 'Your browser does not support the Web Speech API. You can type commands directly.',
                duration: 5
            });
            return;
        }

        // Prompt for microphone permission if necessary
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream.getTracks().forEach(track => track.stop());
            } catch (permErr) {
                console.warn('Microphone permission error:', permErr);
                setIsMicActive(false);
                setIsAwakened(false);
                if (permErr.name === 'NotAllowedError' || permErr.name === 'PermissionDeniedError') {
                    notification.error({
                        message: 'Microphone Permission Blocked',
                        description: 'Please click the icon in your browser address bar and set Microphone to "Allow".'
                    });
                    return;
                }
            }
        }

        try {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                setIsMicActive(true);
                setListeningInterim(prefilledText || 'Awakened. Listening, Hunter...');
            };

            recognition.onresult = (event) => {
                const current = event.resultIndex;
                const userSpeech = event.results[current][0].transcript;
                setListeningInterim(userSpeech);

                if (event.results[current].isFinal) {
                    setIsMicActive(false);
                    setIsAwakened(false);
                    setListeningInterim('');
                    handleSendMessage(userSpeech, true);
                }
            };

            recognition.onerror = (event) => {
                console.error('Active speech recognition error:', event.error);
                setIsMicActive(false);
                setIsAwakened(false);
                setListeningInterim('');
                scheduleWakeWordRestart(700);
            };

            recognition.onend = () => {
                setIsMicActive(false);
                setIsAwakened(false);
                setListeningInterim('');
                scheduleWakeWordRestart(700);
            };

            activeRecognitionRef.current = recognition;
            recognition.start();
        } catch (err) {
            console.error('Failed to start active speech recognition:', err);
            setIsMicActive(false);
            setIsAwakened(false);
            setListeningInterim('');
            scheduleWakeWordRestart(700);
        }
    };

    // Toggle Microphone (Manual Click)
    const toggleMic = async () => {
        if (isMicActive) {
            try {
                activeRecognitionRef.current?.stop();
            } catch (e) {}
            setIsMicActive(false);
            setIsAwakened(false);
            setListeningInterim('');
            scheduleWakeWordRestart(500);
            return;
        }

        // User explicit gesture: unlock microphone stream
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream.getTracks().forEach(track => track.stop());
            } catch (permErr) {
                console.warn('Microphone permission check:', permErr);
            }
        }

        startActiveListening();
    };

    // Toggle Hands-Free Wake Word Mode ("Hello Aegis")
    const toggleWakeWord = async () => {
        if (isWakeWordEnabled) {
            stopWakeWordListener();
            setIsWakeWordEnabled(false);
            notification.info({
                message: 'Wake Word Standby Disabled',
                description: 'Hands-free "Hello Aegis" detection is paused. You can still use the mic button anytime.',
                duration: 3
            });
        } else {
            setIsWakeWordEnabled(true);
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    stream.getTracks().forEach(track => track.stop());
                } catch (permErr) {
                    console.warn('Microphone permission check:', permErr);
                }
            }
            notification.success({
                message: 'Wake Word Standby Active',
                description: 'Say "Hello Aegis" anytime to command hands-free.',
                duration: 4
            });
            scheduleWakeWordRestart(300);
        }
    };

    // Boot Wake-Word detection on mount if enabled
    useEffect(() => {
        if (isWakeWordEnabled) {
            scheduleWakeWordRestart(600);
        }
        return () => {
            stopWakeWordListener();
            if (awakenedTimerRef.current) clearTimeout(awakenedTimerRef.current);
        };
    }, [isWakeWordEnabled]);

    // Unified message dispatcher for both voice and text
    const handleSendMessage = async (rawText, isVoice = false) => {
        const text = (rawText || inputMessage || '').trim();
        if (!text || isWaitingForAi) return;

        setInputMessage('');
        stopSpeaking();

        const userMsg = {
            id: Date.now(),
            sender: 'user',
            text: text,
            isVoice: isVoice,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, userMsg]);
        setIsWaitingForAi(true);

        const history = messages.slice(-10).map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text
        }));

        try {
            const res = await axiosInstance.post('/agents/chat', { 
                message: text,
                history: history 
            });
            const aiReply = res.data?.reply || "Directive received, Hunter. Standing by.";

            const aiMsg = {
                id: Date.now() + 1,
                sender: 'ai',
                text: aiReply,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, aiMsg]);
            speakText(aiReply);
        } catch (err) {
            console.error('Chat error:', err);
            let aiReply;
            if (err.response?.status === 401 || err.response?.status === 403) {
                aiReply = "Session expired, Hunter. Please sign in again to refresh command clearance.";
            } else if (err.response?.data?.message) {
                aiReply = `AEGIS advisory: ${err.response.data.message}`;
            } else {
                aiReply = "AEGIS telemetry momentarily unreachable. Retrying neural link.";
            }

            const aiMsg = {
                id: Date.now() + 1,
                sender: 'ai',
                text: aiReply,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, aiMsg]);
            speakText(aiReply);
        } finally {
            setIsWaitingForAi(false);
            scheduleWakeWordRestart(700);
        }
    };

    const handleFormSubmit = (e) => {
        e?.preventDefault();
        handleSendMessage();
    };

    return (
        <div className={`w-full h-[650px] rounded-3xl bg-gradient-to-b from-[#0a0f1b] via-[#080d16] to-[#060a11] border p-3 flex flex-col justify-between shadow-[0_16px_48px_rgba(0,0,0,0.85)] overflow-hidden select-none transition-all duration-300 ${
            isAwakened 
                ? 'border-cyan-400 shadow-[0_0_35px_rgba(0,210,255,0.35)]' 
                : 'border-white/15'
        }`}>
            {/* Clean Header: Harmonious with AEGIS SMART HQ and GLOBAL INFRASTRUCTURE */}
            <div className="flex justify-between items-center px-1 pb-1.5 border-b border-white/5 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                        isAiSpeaking ? 'bg-cyan-400 shadow-neon animate-ping' : 
                        isMicActive ? 'bg-red-500 shadow-neon animate-pulse' : 
                        isAwakened ? 'bg-cyan-400 shadow-neon animate-ping' :
                        isWakeWordEnabled ? 'bg-cyan-400 shadow-neon animate-pulse' :
                        'bg-gray-500'
                    }`} />
                    <h3 className="text-xs font-bold text-white tracking-wider uppercase mb-0">
                        AEGIS ASSISTANT
                    </h3>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] font-mono">
                    {/* Hands-Free Wake Word Toggle Button */}
                    <button
                        onClick={toggleWakeWord}
                        className={`px-2 py-0.5 rounded-full border text-[10px] font-mono font-medium flex items-center gap-1 transition-all cursor-pointer ${
                            isWakeWordEnabled
                                ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-300 shadow-[0_0_10px_rgba(0,210,255,0.2)]'
                                : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300'
                        }`}
                        title={isWakeWordEnabled ? 'Wake Word Active: Say "Hello Aegis" to trigger' : 'Enable Hands-Free Wake Word ("Hello Aegis")'}
                    >
                        <ThunderboltOutlined className={isWakeWordEnabled ? 'text-cyan-400 animate-pulse' : 'text-gray-500'} />
                        <span className="hidden sm:inline">{isWakeWordEnabled ? 'Wake: ON' : 'Wake: OFF'}</span>
                    </button>

                    {/* Live State Badge */}
                    <span className={`px-2 py-0.5 rounded font-semibold border ${
                        isAiSpeaking 
                            ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 animate-pulse' 
                            : isAwakened
                                ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400 shadow-neon animate-bounce'
                                : isMicActive 
                                    ? 'bg-red-500/15 text-red-300 border-red-500/40 animate-pulse'
                                    : isWaitingForAi
                                        ? 'bg-purple-500/15 text-purple-300 border-purple-500/40'
                                        : isWakeWordEnabled
                                            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}>
                        {isAiSpeaking ? 'Speaking' : isAwakened ? 'Awakened' : isMicActive ? 'Listening' : isWaitingForAi ? 'Thinking' : isWakeWordEnabled ? 'Standby' : 'Online'}
                    </span>

                    {/* Voice Output Mute/Unmute */}
                    <button
                        onClick={() => {
                            if (isAiSpeaking) stopSpeaking();
                            setIsVoiceOutputEnabled(prev => !prev);
                        }}
                        className={`px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                            isVoiceOutputEnabled 
                                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20' 
                                : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300'
                        }`}
                        title={isVoiceOutputEnabled ? "Mute Voice Feedback" : "Enable Voice Feedback"}
                    >
                        <SoundOutlined className="text-[11px]" />
                    </button>
                </div>
            </div>

            {/* Insecure HTTP Warning Banner (if triggered) */}
            {showHttpsBanner && !isSecureOrigin && (
                <div className="w-full my-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-2 text-xs flex-shrink-0">
                    <div className="flex items-center gap-1.5 text-amber-300 font-medium text-[11px]">
                        <span>⚠️</span>
                        <span>Microphone requires HTTPS origin</span>
                    </div>
                    <button 
                        onClick={switchToHttps}
                        className="px-2.5 py-0.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 font-bold border border-cyan-500/40 transition-colors cursor-pointer text-[10px] uppercase tracking-wider"
                    >
                        Use HTTPS
                    </button>
                </div>
            )}

            {/* Unified Conversation Scroll Feed */}
            <div className="flex-1 overflow-y-auto space-y-2.5 px-1 py-2 pr-1.5 select-text my-1 min-h-0">
                {messages.map((msg) => (
                    <div 
                        key={msg.id} 
                        className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                        <div 
                            className={`max-w-[88%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed transition-all ${
                                msg.sender === 'user'
                                    ? 'bg-gradient-to-r from-cyan-600/90 to-blue-600/90 text-white rounded-tr-xs shadow-sm border border-cyan-400/20'
                                    : 'bg-[#0d1424]/90 text-gray-200 border border-cyan-500/20 rounded-tl-xs shadow-sm backdrop-blur-md'
                            }`}
                        >
                            <div className="whitespace-pre-wrap">{msg.text}</div>
                        </div>

                        <div className="flex items-center gap-1.5 text-[9px] text-gray-500 font-mono mt-0.5 px-1">
                            {msg.sender === 'user' && msg.isVoice && (
                                <span className="text-cyan-400 flex items-center gap-0.5" title="Voice Input">
                                    <AudioOutlined />
                                </span>
                            )}
                            <span>{msg.sender === 'ai' ? 'AEGIS' : 'HUNTER'}</span>
                            <span>•</span>
                            <span>{msg.time}</span>
                            {msg.sender === 'ai' && (
                                <button
                                    onClick={() => speakText(msg.text)}
                                    className="ml-1 text-gray-500 hover:text-cyan-400 transition-colors cursor-pointer"
                                    title="Replay Voice"
                                >
                                    <SoundOutlined />
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {/* Processing Indicator */}
                {isWaitingForAi && (
                    <div className="flex flex-col items-start">
                        <div className="rounded-2xl rounded-tl-xs px-3.5 py-2 bg-[#0d1424]/90 border border-cyan-500/30 text-gray-300 text-xs flex items-center gap-2 shadow-sm">
                            <span className="text-[10px] font-mono text-cyan-400 font-semibold">AEGIS</span>
                            <div className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Dynamic Live Audio Indicator Banner (When Speaking, Listening, or Awakened) */}
            {(isAiSpeaking || isMicActive || isAwakened) && (
                <div className={`w-full px-3 py-1.5 rounded-xl mb-1.5 flex items-center justify-between border backdrop-blur-md transition-all flex-shrink-0 ${
                    isAiSpeaking 
                        ? 'bg-cyan-950/40 border-cyan-500/40 shadow-[0_0_15px_rgba(0,210,255,0.2)]' 
                        : isAwakened
                            ? 'bg-cyan-950/60 border-cyan-400 shadow-[0_0_20px_rgba(0,210,255,0.35)] animate-pulse'
                            : 'bg-red-950/40 border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                }`}>
                    <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                        {isAiSpeaking ? (
                            <div className="flex items-end gap-1 h-3.5 flex-shrink-0">
                                <span className="w-1 bg-cyan-400 rounded-full h-3.5 animate-bounce" />
                                <span className="w-1 bg-[#38bdf8] rounded-full h-2 animate-pulse" />
                                <span className="w-1 bg-[#00d2ff] rounded-full h-4 animate-pulse" />
                                <span className="w-1 bg-cyan-300 rounded-full h-2.5 animate-bounce" />
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                <AudioOutlined className={`${isAwakened ? 'text-cyan-300' : 'text-red-400'} text-xs animate-pulse`} />
                                <span className={`w-1.5 h-1.5 rounded-full ${isAwakened ? 'bg-cyan-400 animate-ping' : 'bg-red-500 animate-ping'}`} />
                            </div>
                        )}

                        <span className="text-[11px] font-mono truncate text-gray-200">
                            {isAiSpeaking 
                                ? 'Voicing response...' 
                                : isAwakened && !listeningInterim
                                    ? 'Awakened by "Hello Aegis"... listening'
                                    : listeningInterim || 'Listening to your command...'}
                        </span>
                    </div>

                    {isAiSpeaking ? (
                        <button
                            onClick={stopSpeaking}
                            className="px-2 py-0.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 text-[10px] font-semibold flex items-center gap-1 border border-cyan-500/30 cursor-pointer transition-colors"
                        >
                            <StopOutlined /> Stop
                        </button>
                    ) : (
                        <button
                            onClick={toggleMic}
                            className="px-2 py-0.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-300 text-[10px] font-semibold flex items-center gap-1 border border-red-500/30 cursor-pointer transition-colors"
                        >
                            Done
                        </button>
                    )}
                </div>
            )}

            {/* Unified Command Input Dock (Bottom) */}
            <form onSubmit={handleFormSubmit} className="pt-1 flex-shrink-0">
                <div className={`w-full bg-[#070b14] border rounded-2xl p-1.5 flex items-center gap-1.5 transition-all shadow-inner ${
                    isAwakened 
                        ? 'border-cyan-400 shadow-[0_0_20px_rgba(0,210,255,0.3)]' 
                        : 'border-white/10 focus-within:border-cyan-500/50'
                }`}>
                    {/* Glowing Mic Toggle Button with Wake-Word Halo */}
                    <div className="relative flex-shrink-0">
                        <button
                            type="button"
                            onClick={toggleMic}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer relative ${
                                isMicActive 
                                    ? 'bg-red-500 text-white border border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.8)] animate-pulse' 
                                    : isWakeWordEnabled
                                        ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/20 shadow-[0_0_12px_rgba(0,210,255,0.2)]'
                                        : 'text-gray-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-white/5'
                            }`}
                            title={
                                isMicActive 
                                    ? "Stop Voice Input" 
                                    : isWakeWordEnabled 
                                        ? 'Wake Word Active: Say "Hello Aegis" or tap to speak' 
                                        : "Tap to Speak"
                            }
                        >
                            {isMicActive ? (
                                <AudioOutlined className="text-sm animate-bounce" />
                            ) : (
                                <AudioOutlined className="text-sm" />
                            )}
                        </button>
                        {isWakeWordEnabled && !isMicActive && (
                            <span 
                                className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 shadow-neon animate-ping pointer-events-none" 
                                title="Wake Word Listening"
                            />
                        )}
                    </div>

                    {/* Single Unified Text Input */}
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder={
                            isMicActive 
                                ? "Listening to voice..." 
                                : isWakeWordEnabled 
                                    ? 'Say "Hello Aegis" or type directive...' 
                                    : "Directive or speak command..."
                        }
                        className="flex-1 bg-transparent border-none text-xs text-white placeholder-gray-500 focus:outline-none px-2 font-sans"
                        disabled={isWaitingForAi}
                    />

                    {/* Send Button */}
                    <button
                        type="submit"
                        disabled={!inputMessage.trim() || isWaitingForAi}
                        className="w-9 h-9 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-[#0B0F19] flex items-center justify-center font-bold transition-all shadow-neon text-xs cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0 active:scale-95"
                        title="Send Directive"
                    >
                        <SendOutlined />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default LiveTalkSession;
