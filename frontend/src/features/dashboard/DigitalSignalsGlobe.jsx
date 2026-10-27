import React, { useRef, useEffect, useState } from 'react';

/**
 * DigitalSignalsGlobe (Center Column Holographic Stage)
 * Sized to h-[640px] xl:h-[660px] for the 3-column command center.
 * Renders an expansive 3D spherical projection with audio-reactive waveforms.
 */
const DigitalSignalsGlobe = ({ isSpeaking = false, audioLevel = 0, onTriggerSpeakTest }) => {
    const canvasRef = useRef(null);
    const [rotationY, setRotationY] = useState(0);
    const isDraggingRef = useRef(false);
    const lastMouseXRef = useRef(0);
    const rotationSpeedRef = useRef(0.007);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const updateDimensions = () => {
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
        };
        updateDimensions();
        window.addEventListener('resize', updateDimensions);

        // Precompute Fibonacci sphere points
        const numNodes = 150;
        const nodes = [];
        const goldenRatio = (1 + Math.sqrt(5)) / 2;
        for (let i = 0; i < numNodes; i++) {
            const theta = 2 * Math.PI * i / goldenRatio;
            const phi = Math.acos(1 - 2 * (i + 0.5) / numNodes);
            nodes.push({
                baseX: Math.cos(theta) * Math.sin(phi),
                baseY: Math.cos(phi),
                baseZ: Math.sin(theta) * Math.sin(phi),
                pulsePhase: Math.random() * Math.PI * 2,
                colorShift: Math.random() > 0.8 ? '#38bdf8' : '#00d2ff'
            });
        }

        // Orbiting signal data packets
        const satellites = [
            { orbitRadius: 1.35, tilt: 0.45, speed: 0.02, angle: 0, color: '#38bdf8', size: 3.5 },
            { orbitRadius: 1.55, tilt: -0.7, speed: 0.015, angle: Math.PI / 2, color: '#00d2ff', size: 4 },
            { orbitRadius: 1.25, tilt: 1.1, speed: -0.025, angle: Math.PI, color: '#a855f7', size: 3 },
            { orbitRadius: 1.65, tilt: 0.25, speed: 0.012, angle: Math.PI * 1.5, color: '#f59e0b', size: 3.2 }
        ];

        const wavePulses = [];
        let lastPulseTime = 0;
        let time = 0;
        let rotY = 0;
        let rotX = 0.22;

        const render = () => {
            time += 0.03;
            if (!isDraggingRef.current) {
                rotY += rotationSpeedRef.current * (isSpeaking ? 1.5 : 1.0);
            }

            const rect = canvas.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;
            const cx = width / 2;
            const cy = height / 2;
            const R = Math.min(width * 0.42, height * 0.38);
            const fov = 420;

            ctx.clearRect(0, 0, width, height);

            // 1. Ambient Glow Core
            const coreGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.6);
            if (isSpeaking) {
                const glowIntensity = 0.24 + (audioLevel || 0.5) * 0.25;
                coreGlow.addColorStop(0, `rgba(0, 210, 255, ${glowIntensity})`);
                coreGlow.addColorStop(0.4, `rgba(58, 123, 213, ${glowIntensity * 0.6})`);
                coreGlow.addColorStop(0.8, `rgba(168, 85, 247, ${glowIntensity * 0.3})`);
                coreGlow.addColorStop(1, 'rgba(11, 15, 25, 0)');
            } else {
                coreGlow.addColorStop(0, 'rgba(0, 210, 255, 0.12)');
                coreGlow.addColorStop(0.5, 'rgba(30, 58, 138, 0.05)');
                coreGlow.addColorStop(1, 'rgba(11, 15, 25, 0)');
            }
            ctx.fillStyle = coreGlow;
            ctx.beginPath();
            ctx.arc(cx, cy, R * 1.6, 0, Math.PI * 2);
            ctx.fill();

            // 2. Audio-Reactive Sonar Pulse Waves
            if (isSpeaking && Date.now() - lastPulseTime > 280) {
                lastPulseTime = Date.now();
                wavePulses.push({
                    radius: R * 0.8,
                    maxRadius: R * 2.3,
                    alpha: 0.85,
                    speed: 2.8 + (audioLevel || 0.4) * 3,
                    color: Math.random() > 0.5 ? 'rgba(0, 210, 255, ' : 'rgba(56, 189, 248, '
                });
            }

            for (let i = wavePulses.length - 1; i >= 0; i--) {
                const pulse = wavePulses[i];
                pulse.radius += pulse.speed;
                pulse.alpha = Math.max(0, 1 - (pulse.radius - R * 0.8) / (pulse.maxRadius - R * 0.8));

                ctx.save();
                ctx.beginPath();
                ctx.arc(cx, cy, pulse.radius, 0, Math.PI * 2);
                ctx.strokeStyle = `${pulse.color}${pulse.alpha * 0.7})`;
                ctx.lineWidth = 1.5 + (audioLevel || 0.3) * 1.5;
                ctx.setLineDash([6, 8]);
                ctx.stroke();
                ctx.restore();

                if (pulse.radius >= pulse.maxRadius || pulse.alpha <= 0.01) {
                    wavePulses.splice(i, 1);
                }
            }

            // 3D Projection Helper
            const project3D = (x, y, z) => {
                const cosY = Math.cos(rotY);
                const sinY = Math.sin(rotY);
                const x1 = x * cosY - z * sinY;
                const z1 = z * cosY + x * sinY;

                const cosX = Math.cos(rotX);
                const sinX = Math.sin(rotX);
                const y2 = y * cosX - z1 * sinX;
                const z2 = z1 * cosX + y * sinX;

                const scale = fov / (fov + z2);
                return {
                    x: cx + x1 * scale,
                    y: cy + y2 * scale,
                    z: z2,
                    scale: scale
                };
            };

            // 3. Latitude Rings
            const numLatitudes = 11;
            for (let i = 1; i < numLatitudes; i++) {
                const lat = (i / numLatitudes - 0.5) * Math.PI;
                const rLat = R * Math.cos(lat);
                const yLat = R * Math.sin(lat);
                const numSteps = 48;

                ctx.beginPath();
                let started = false;
                for (let s = 0; s <= numSteps; s++) {
                    const lon = (s / numSteps) * Math.PI * 2;
                    let rPerturb = rLat;
                    if (isSpeaking) {
                        rPerturb += Math.sin(lon * 6 + time * 4) * (audioLevel * 4 + 1.5);
                    }
                    const px = rPerturb * Math.cos(lon);
                    const pz = rPerturb * Math.sin(lon);
                    const proj = project3D(px, yLat, pz);

                    if (!started) {
                        ctx.moveTo(proj.x, proj.y);
                        started = true;
                    } else {
                        ctx.lineTo(proj.x, proj.y);
                    }
                }
                ctx.strokeStyle = isSpeaking 
                    ? `rgba(0, 210, 255, ${0.3 + (audioLevel || 0.4) * 0.25})`
                    : 'rgba(0, 210, 255, 0.15)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            // 4. Longitude Meridians
            const numLongitudes = 14;
            for (let i = 0; i < numLongitudes; i++) {
                const lon = (i / numLongitudes) * Math.PI;
                const numSteps = 40;

                ctx.beginPath();
                let started = false;
                for (let s = 0; s <= numSteps; s++) {
                    const lat = (s / numSteps - 0.5) * Math.PI;
                    let rCurrent = R;
                    if (isSpeaking) {
                        rCurrent += Math.cos(lat * 8 + time * 5) * (audioLevel * 3 + 1);
                    }
                    const px = rCurrent * Math.cos(lat) * Math.cos(lon);
                    const py = rCurrent * Math.sin(lat);
                    const pz = rCurrent * Math.cos(lat) * Math.sin(lon);
                    const proj = project3D(px, py, pz);

                    if (!started) {
                        ctx.moveTo(proj.x, proj.y);
                        started = true;
                    } else {
                        ctx.lineTo(proj.x, proj.y);
                    }
                }
                ctx.strokeStyle = isSpeaking 
                    ? `rgba(58, 123, 213, ${0.32 + (audioLevel || 0.3) * 0.2})` 
                    : 'rgba(58, 123, 213, 0.14)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            // 5. Digital Surface Nodes
            nodes.forEach(node => {
                let currentR = R;
                if (isSpeaking) {
                    currentR += Math.sin(time * 3 + node.pulsePhase) * (audioLevel * 5 + 2);
                }
                const px = node.baseX * currentR;
                const py = node.baseY * currentR;
                const pz = node.baseZ * currentR;
                const proj = project3D(px, py, pz);

                const depthAlpha = Math.max(0.14, (proj.z + R) / (2 * R));
                const pulse = Math.sin(time * 2 + node.pulsePhase) * 0.5 + 0.5;
                const size = (1.5 + pulse * 1.4) * proj.scale;

                ctx.beginPath();
                ctx.arc(proj.x, proj.y, size, 0, Math.PI * 2);
                if (isSpeaking) {
                    ctx.fillStyle = depthAlpha > 0.5 ? node.colorShift : `rgba(0, 210, 255, ${depthAlpha * 0.8})`;
                    ctx.shadowColor = '#00d2ff';
                    ctx.shadowBlur = 8;
                } else {
                    ctx.fillStyle = `rgba(0, 210, 255, ${depthAlpha * 0.75})`;
                    ctx.shadowBlur = 0;
                }
                ctx.fill();
            });
            ctx.shadowBlur = 0;

            // 6. Orbiting Satellites
            satellites.forEach(sat => {
                sat.angle += sat.speed * (isSpeaking ? 1.4 : 1.0);
                const satDist = R * sat.orbitRadius;
                
                const rawX = Math.cos(sat.angle) * satDist;
                const rawY = Math.sin(sat.angle) * satDist * Math.sin(sat.tilt);
                const rawZ = Math.sin(sat.angle) * satDist * Math.cos(sat.tilt);
                const proj = project3D(rawX, rawY, rawZ);

                ctx.beginPath();
                const steps = 44;
                for (let j = 0; j <= steps; j++) {
                    const a = (j / steps) * Math.PI * 2;
                    const ox = Math.cos(a) * satDist;
                    const oy = Math.sin(a) * satDist * Math.sin(sat.tilt);
                    const oz = Math.sin(a) * satDist * Math.cos(sat.tilt);
                    const op = project3D(ox, oy, oz);
                    if (j === 0) ctx.moveTo(op.x, op.y);
                    else ctx.lineTo(op.x, op.y);
                }
                ctx.strokeStyle = `rgba(255, 255, 255, ${0.06 + (isSpeaking ? 0.08 : 0)})`;
                ctx.lineWidth = 1;
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(proj.x, proj.y, sat.size * proj.scale, 0, Math.PI * 2);
                ctx.fillStyle = sat.color;
                ctx.shadowColor = sat.color;
                ctx.shadowBlur = isSpeaking ? 12 : 5;
                ctx.fill();
                ctx.shadowBlur = 0;
            });

            // 7. Reticle accents
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, R * 1.15, -Math.PI * 0.7, -Math.PI * 0.3);
            ctx.strokeStyle = 'rgba(0, 210, 255, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(cx, cy, R * 1.15, Math.PI * 0.3, Math.PI * 0.7);
            ctx.strokeStyle = 'rgba(0, 210, 255, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.restore();

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', updateDimensions);
        };
    }, [isSpeaking, audioLevel]);

    const handleMouseDown = (e) => {
        isDraggingRef.current = true;
        lastMouseXRef.current = e.clientX;
    };

    const handleMouseMove = (e) => {
        if (!isDraggingRef.current) return;
        const deltaX = e.clientX - lastMouseXRef.current;
        lastMouseXRef.current = e.clientX;
        setRotationY(prev => prev + deltaX * 0.008);
    };

    const handleMouseUp = () => {
        isDraggingRef.current = false;
    };

    return (
        <div 
            className="relative w-full h-[640px] xl:h-[660px] flex items-center justify-center rounded-3xl bg-gradient-to-b from-[#0e1424]/90 via-[#0B0F19] to-[#0B0F19] border border-white/15 shadow-[0_16px_48px_rgba(0,0,0,0.8)] overflow-hidden select-none"
            onMouseLeave={handleMouseUp}
        >
            {/* Top Telemetry HUD */}
            <div className="absolute top-4 left-6 right-6 flex justify-between items-center z-10 pointer-events-none">
                <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${isSpeaking ? 'bg-[#00d2ff] animate-ping' : 'bg-green-400'}`} />
                    <span className="text-xs font-mono tracking-widest uppercase font-semibold text-gray-200">
                        {isSpeaking ? 'TRANSMISSION ACTIVE // 1420.4 MHz' : 'GLOBAL SIGNALS // ACTIVE MONITORING'}
                    </span>
                </div>
                <div className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-500/40 shadow-sm">
                    LATENCY: 12ms • 150 NODES
                </div>
            </div>

            {/* Interactive 3D Canvas */}
            <canvas 
                ref={canvasRef} 
                className="w-full h-full cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
            />

            {/* Bottom HUD Bar */}
            <div className="absolute bottom-4 left-6 right-6 flex justify-between items-center z-10 pointer-events-none">
                <div className="flex items-center gap-2.5">
                    <div className="flex items-end gap-1 h-5 px-2 py-0.5 bg-black/60 rounded border border-white/10 shadow-inner">
                        <span className={`w-1 bg-[#00d2ff] rounded-full transition-all ${isSpeaking ? 'h-5 animate-pulse' : 'h-1.5'}`} />
                        <span className={`w-1 bg-[#00d2ff] rounded-full transition-all ${isSpeaking ? 'h-3' : 'h-2'}`} />
                        <span className={`w-1 bg-[#00d2ff] rounded-full transition-all ${isSpeaking ? 'h-4 animate-pulse' : 'h-1.5'}`} />
                        <span className={`w-1 bg-[#38bdf8] rounded-full transition-all ${isSpeaking ? 'h-3.5 animate-bounce' : 'h-2'}`} />
                    </div>
                    <span className="text-xs font-mono text-gray-300 font-medium">
                        {isSpeaking ? (
                            <span className="text-cyan-400 font-semibold animate-pulse tracking-wide">
                                AI TRANSMITTING SPEECH AUDIO
                            </span>
                        ) : (
                            'AI VOICE STANDBY // SPEAK TO ENGAGE'
                        )}
                    </span>
                </div>

                <div className="pointer-events-auto">
                    <button
                        onClick={onTriggerSpeakTest}
                        className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-[#00d2ff] border border-cyan-500/40 hover:border-cyan-400 transition-all flex items-center gap-2 shadow-neon cursor-pointer"
                    >
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                        Test AI Voice Pulse
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DigitalSignalsGlobe;
