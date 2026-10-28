import React, { useRef, useEffect, useState } from 'react';

/**
 * AEGIS DigitalSignalsGlobe (Cinematic Holographic Planetary Command)
 * 
 * High-performance, multi-layered 3D holographic Earth projection featuring:
 * - Real-world continental landmass point cloud (~1,100 tactical coordinates)
 * - 3D Great-Circle Geodesic Signal Arcs with real-time photon packet propagation
 * - Station Beacons with 3D elevation pins and holographic HUD callout tags
 * - 360° Planetary Radar Sweep with phosphorescent illumination flaring
 * - 2-Axis Trackball physics with velocity momentum and smooth inertia damping
 * - Audio-reactive equatorial waveform, sonic shockwaves, and base spectrum visualizer
 * - Real-time telemetry HUD displaying live coordinate tracking
 */
const DigitalSignalsGlobe = ({ isSpeaking = false, onTriggerSpeakTest }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    
    // Physics & Interaction state refs (persisted across render loops without re-render lag)
    const isDraggingRef = useRef(false);
    const lastMousePosRef = useRef({ x: 0, y: 0 });
    const velocityRef = useRef({ x: 0.007, y: 0 });
    const rotRef = useRef({ y: 0.4, x: 0.28 });
    const hoverPosRef = useRef(null);
    const isSpeakingRef = useRef(isSpeaking);

    // Dynamic HUD Telemetry state
    const [hudData, setHudData] = useState({
        lat: '33.68° N',
        lon: '073.04° E',
        yaw: '142°',
        pitch: '16°',
        activeStations: 5,
        networkStatus: 'SYNCHRONIZED'
    });
    const [viewMode, setViewMode] = useState('ALL'); // 'ALL' | 'STATIONS' | 'ARCS'

    useEffect(() => {
        isSpeakingRef.current = isSpeaking;
    }, [isSpeaking]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const updateDimensions = () => {
            const rect = canvas.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x for optimal 60fps performance
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
        };
        updateDimensions();
        window.addEventListener('resize', updateDimensions);

        // --- 1. CONTINENTAL LANDMASS RECONSTRUCTION ---
        // Accurate polygonal boundary samplers for Earth's landmasses
        const landmassBounds = [
            // North America
            { minLat: 15, maxLat: 72, minLon: -168, maxLon: -55, density: 160 },
            // Central America & Caribbean
            { minLat: 7, maxLat: 22, minLon: -105, maxLon: -60, density: 35 },
            // South America
            { minLat: -55, maxLat: 12, minLon: -82, maxLon: -34, density: 140 },
            // Western & Central Europe
            { minLat: 36, maxLat: 71, minLon: -10, maxLon: 42, density: 130 },
            // Africa
            { minLat: -35, maxLat: 37, minLon: -18, maxLon: 52, density: 170 },
            // Middle East & Central Asia
            { minLat: 12, maxLat: 48, minLon: 35, maxLon: 75, density: 110 },
            // South Asia (Pakistan / India)
            { minLat: 7, maxLat: 38, minLon: 62, maxLon: 92, density: 120 },
            // East Asia (China, Korea, Japan)
            { minLat: 20, maxLat: 52, minLon: 80, maxLon: 146, density: 160 },
            // Siberia & Northern Russia
            { minLat: 52, maxLat: 74, minLon: 40, maxLon: 175, density: 130 },
            // Southeast Asia & Indonesia
            { minLat: -11, maxLat: 22, minLon: 95, maxLon: 142, density: 90 },
            // Australia & New Zealand
            { minLat: -48, maxLat: -11, minLon: 112, maxLon: 178, density: 110 },
            // Greenland
            { minLat: 60, maxLat: 83, minLon: -55, maxLon: -20, density: 40 },
            // Antarctica coast
            { minLat: -85, maxLat: -66, minLon: -180, maxLon: 180, density: 90 }
        ];

        // Seeded random for stable, crisp continent geometry
        let seed = 1337;
        const pseudoRandom = () => {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };

        const surfacePoints = [];
        landmassBounds.forEach(region => {
            for (let i = 0; i < region.density; i++) {
                const latDeg = region.minLat + pseudoRandom() * (region.maxLat - region.minLat);
                const lonDeg = region.minLon + pseudoRandom() * (region.maxLon - region.minLon);
                
                const latRad = (latDeg * Math.PI) / 180;
                const lonRad = (lonDeg * Math.PI) / 180;

                surfacePoints.push({
                    latDeg,
                    lonDeg,
                    x: Math.cos(latRad) * Math.sin(lonRad),
                    y: -Math.sin(latRad),
                    z: Math.cos(latRad) * Math.cos(lonRad),
                    pulsePhase: pseudoRandom() * Math.PI * 2,
                    isHighDensity: pseudoRandom() > 0.75,
                    flashUntil: 0
                });
            }
        });

        // Faint oceanic spatial grid points to complete holographic depth
        const oceanicGrid = [];
        const numOceanNodes = 160;
        const goldenRatio = (1 + Math.sqrt(5)) / 2;
        for (let i = 0; i < numOceanNodes; i++) {
            const theta = 2 * Math.PI * i / goldenRatio;
            const phi = Math.acos(1 - 2 * (i + 0.5) / numOceanNodes);
            oceanicGrid.push({
                x: Math.cos(theta) * Math.sin(phi),
                y: Math.cos(phi),
                z: Math.sin(theta) * Math.sin(phi),
                pulsePhase: pseudoRandom() * Math.PI * 2
            });
        }

        // --- 2. STRATEGIC AGENT STATIONS ---
        const stations = [
            { id: 'AEGIS-PRIME', name: 'Command Deck HQ', lat: 33.68, lon: 73.04, color: '#00d2ff', role: 'Executive AI Core' },
            { id: 'RADAR-WING', name: 'Radar Intelligence', lat: 51.50, lon: -0.12, color: '#38bdf8', role: 'Deep Web Recon' },
            { id: 'CYBER-VAULT', name: 'Secure Memory Vault', lat: 35.67, lon: 139.65, color: '#a855f7', role: 'Vector Knowledge' },
            { id: 'NEURAL-LAB', name: 'Antigravity Lab', lat: 37.77, lon: -122.41, color: '#34d399', role: 'Code Execution Engine' },
            { id: 'GLOBAL-UPLINK', name: 'Orbital Gateway', lat: -33.86, lon: 151.20, color: '#f59e0b', role: 'Telemetric Relay' }
        ];

        const stationPoints = stations.map(s => {
            const latRad = (s.lat * Math.PI) / 180;
            const lonRad = (s.lon * Math.PI) / 180;
            return {
                ...s,
                x: Math.cos(latRad) * Math.sin(lonRad),
                y: -Math.sin(latRad),
                z: Math.cos(latRad) * Math.cos(lonRad)
            };
        });

        // --- 3. GREAT-CIRCLE INTER-STATION SIGNAL ARCS ---
        const arcConnections = [
            { from: stationPoints[0], to: stationPoints[1], progress: 0.15, speed: 0.007, color: '#00d2ff' },
            { from: stationPoints[0], to: stationPoints[2], progress: 0.65, speed: 0.009, color: '#38bdf8' },
            { from: stationPoints[0], to: stationPoints[3], progress: 0.40, speed: 0.006, color: '#a855f7' },
            { from: stationPoints[0], to: stationPoints[4], progress: 0.85, speed: 0.008, color: '#f59e0b' },
            { from: stationPoints[1], to: stationPoints[3], progress: 0.30, speed: 0.007, color: '#34d399' }
        ];

        // --- 4. ORBITAL SATELLITES & RINGS ---
        const satellites = [
            { radiusMult: 1.28, tilt: 0.52, speed: 0.016, angle: 0, color: '#00d2ff', size: 3.5, label: 'SAT-ALPHA' },
            { radiusMult: 1.48, tilt: -0.68, speed: 0.012, angle: Math.PI * 0.7, color: '#38bdf8', size: 3.2, label: 'SAT-BRAVO' },
            { radiusMult: 1.62, tilt: 1.05, speed: -0.018, angle: Math.PI * 1.3, color: '#a855f7', size: 3.8, label: 'RELAY-OMEGA' }
        ];

        // Concentric sonic pulses
        const wavePulses = [];
        let lastPulseTime = 0;
        let radarAngle = 0;
        let time = 0;
        let hudUpdateCounter = 0;

        // Render loop
        const render = () => {
            time += 0.025;
            const isSpeakingNow = isSpeakingRef.current;
            const audioIntensity = isSpeakingNow 
                ? (0.55 + Math.sin(time * 5.5) * 0.28 + Math.sin(time * 12.0) * 0.17)
                : 0.05;

            // Physics momentum / inertia damping
            if (!isDraggingRef.current) {
                // Natural planetary rotation + momentum
                rotRef.current.y += velocityRef.current.x;
                rotRef.current.x += velocityRef.current.y;
                
                // Gradually restore natural slow cruise speed
                const targetCruise = 0.004 * (isSpeakingNow ? 1.6 : 1.0);
                velocityRef.current.x = velocityRef.current.x * 0.94 + targetCruise * 0.06;
                velocityRef.current.y *= 0.92;
            } else {
                velocityRef.current.x *= 0.8;
                velocityRef.current.y *= 0.8;
            }

            // Clamp pitch tilt between -55° and +55° to prevent visual flipping
            rotRef.current.x = Math.max(-0.95, Math.min(0.95, rotRef.current.x));

            const rect = canvas.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;
            const cx = width / 2;
            const cy = height / 2;
            const R = Math.min(width * 0.38, height * 0.38);
            const fov = 440;

            ctx.clearRect(0, 0, width, height);

            // 3D Projection Math
            const project3D = (x, y, z) => {
                const cosY = Math.cos(rotRef.current.y);
                const sinY = Math.sin(rotRef.current.y);
                const x1 = x * cosY - z * sinY;
                const z1 = z * cosY + x * sinY;

                const cosX = Math.cos(rotRef.current.x);
                const sinX = Math.sin(rotRef.current.x);
                const y2 = y * cosX - z1 * sinX;
                const z2 = z1 * cosX + y * sinX;

                const scale = fov / (fov + z2);
                return {
                    x: cx + x1 * scale,
                    y: cy + y2 * scale,
                    z: z2,
                    scale: scale,
                    isFront: z2 < 0 // Negative z in projection is closer to camera
                };
            };

            // Update radar sweep angle
            radarAngle = (radarAngle + 0.02) % (Math.PI * 2);

            // --- LAYER 1: AMBIENT ATMOSPHERIC PLASMA CORE ---
            const coreGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.55);
            if (isSpeakingNow) {
                const glow = 0.22 + audioIntensity * 0.32;
                coreGradient.addColorStop(0, `rgba(0, 210, 255, ${glow})`);
                coreGradient.addColorStop(0.35, `rgba(56, 189, 248, ${glow * 0.65})`);
                coreGradient.addColorStop(0.7, `rgba(168, 85, 247, ${glow * 0.3})`);
                coreGradient.addColorStop(1, 'rgba(11, 15, 25, 0)');
            } else {
                coreGradient.addColorStop(0, 'rgba(0, 210, 255, 0.12)');
                coreGradient.addColorStop(0.45, 'rgba(30, 58, 138, 0.06)');
                coreGradient.addColorStop(1, 'rgba(11, 15, 25, 0)');
            }
            ctx.fillStyle = coreGradient;
            ctx.beginPath();
            ctx.arc(cx, cy, R * 1.55, 0, Math.PI * 2);
            ctx.fill();

            // Inner dark globe body for contrast occlusion
            const bodyGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
            bodyGradient.addColorStop(0, 'rgba(8, 12, 22, 0.95)');
            bodyGradient.addColorStop(0.85, 'rgba(11, 18, 34, 0.92)');
            bodyGradient.addColorStop(1, 'rgba(0, 210, 255, 0.2)');
            ctx.fillStyle = bodyGradient;
            ctx.beginPath();
            ctx.arc(cx, cy, R, 0, Math.PI * 2);
            ctx.fill();

            // --- LAYER 2: AUDIO-REACTIVE EQUATORIAL SHOCKWAVES ---
            if (isSpeakingNow && Date.now() - lastPulseTime > 280) {
                lastPulseTime = Date.now();
                wavePulses.push({
                    radius: R * 0.85,
                    maxRadius: R * 2.3,
                    alpha: 0.9,
                    speed: 3.2 + audioIntensity * 3.5,
                    color: Math.random() > 0.4 ? 'rgba(0, 210, 255, ' : 'rgba(56, 189, 248, '
                });
            }

            for (let i = wavePulses.length - 1; i >= 0; i--) {
                const pulse = wavePulses[i];
                pulse.radius += pulse.speed;
                pulse.alpha = Math.max(0, 1 - (pulse.radius - R * 0.85) / (pulse.maxRadius - R * 0.85));

                ctx.save();
                ctx.beginPath();
                ctx.arc(cx, cy, pulse.radius, 0, Math.PI * 2);
                ctx.strokeStyle = `${pulse.color}${pulse.alpha * 0.65})`;
                ctx.lineWidth = 1.5 + audioIntensity * 2;
                ctx.setLineDash([8, 10]);
                ctx.stroke();
                ctx.restore();

                if (pulse.radius >= pulse.maxRadius || pulse.alpha <= 0.01) {
                    wavePulses.splice(i, 1);
                }
            }

            // --- LAYER 3: ELEGANT WIREFRAME GRID (Latitude & Longitude) ---
            // Subtle Longitudes
            const numLon = 12;
            ctx.lineWidth = 0.75;
            for (let i = 0; i < numLon; i++) {
                const lon = (i / numLon) * Math.PI;
                ctx.beginPath();
                let started = false;
                for (let s = 0; s <= 36; s++) {
                    const lat = (s / 36 - 0.5) * Math.PI;
                    const px = R * Math.cos(lat) * Math.cos(lon);
                    const py = R * Math.sin(lat);
                    const pz = R * Math.cos(lat) * Math.sin(lon);
                    const p = project3D(px, py, pz);

                    if (!started) {
                        ctx.moveTo(p.x, p.y);
                        started = true;
                    } else {
                        ctx.lineTo(p.x, p.y);
                    }
                }
                ctx.strokeStyle = isSpeakingNow ? 'rgba(0, 210, 255, 0.16)' : 'rgba(0, 210, 255, 0.08)';
                ctx.stroke();
            }

            // Subtle Latitudes
            const numLat = 9;
            for (let i = 1; i < numLat; i++) {
                const lat = (i / numLat - 0.5) * Math.PI;
                const rLat = R * Math.cos(lat);
                const yLat = R * Math.sin(lat);
                ctx.beginPath();
                let started = false;
                for (let s = 0; s <= 44; s++) {
                    const lon = (s / 44) * Math.PI * 2;
                    let rMod = rLat;
                    // Audio wave undulation on latitude rings
                    if (isSpeakingNow && i === 5) {
                        rMod += Math.sin(lon * 8 + time * 6) * (audioIntensity * 7 + 2);
                    }
                    const px = rMod * Math.cos(lon);
                    const pz = rMod * Math.sin(lon);
                    const p = project3D(px, yLat, pz);

                    if (!started) {
                        ctx.moveTo(p.x, p.y);
                        started = true;
                    } else {
                        ctx.lineTo(p.x, p.y);
                    }
                }
                ctx.strokeStyle = (i === 5) 
                    ? (isSpeakingNow ? 'rgba(0, 210, 255, 0.45)' : 'rgba(0, 210, 255, 0.22)')
                    : 'rgba(56, 189, 248, 0.08)';
                ctx.stroke();
            }

            // --- LAYER 4: OCEANIC BACKGROUND NODES ---
            oceanicGrid.forEach(node => {
                const p = project3D(node.x * R, node.y * R, node.z * R);
                const depthAlpha = Math.max(0.08, (R - p.z) / (2 * R));
                ctx.beginPath();
                ctx.arc(p.x, p.y, 1.2 * p.scale, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(30, 64, 175, ${depthAlpha * 0.4})`;
                ctx.fill();
            });

            // --- LAYER 5: CONTINENTAL TACTICAL SURFACE POINT CLOUD ---
            surfacePoints.forEach(pt => {
                let currentR = R;
                if (isSpeakingNow) {
                    currentR += Math.sin(time * 4 + pt.pulsePhase) * (audioIntensity * 4);
                }

                const px = pt.x * currentR;
                const py = pt.y * currentR;
                const pz = pt.z * currentR;
                const p = project3D(px, py, pz);

                // Check distance to radar sweep for phosphorescent glow flare
                const ptAngle = Math.atan2(pt.x, pt.z) + Math.PI;
                const sweepDiff = Math.abs(ptAngle - radarAngle);
                const isUnderSweep = sweepDiff < 0.22 || sweepDiff > (Math.PI * 2 - 0.22);
                if (isUnderSweep) {
                    pt.flashUntil = Date.now() + 450;
                }
                const isFlashing = Date.now() < pt.flashUntil;

                // 3D Depth shading
                const normalizedDepth = (R - p.z) / (2 * R); // 1 = closest front, 0 = farthest back
                const isFacingCamera = p.z < 0;

                ctx.beginPath();
                const baseSize = pt.isHighDensity ? 2.0 : 1.4;
                const size = (baseSize + (isFlashing ? 1.4 : 0)) * p.scale;
                ctx.arc(p.x, p.y, size, 0, Math.PI * 2);

                if (isFacingCamera) {
                    if (isFlashing) {
                        ctx.fillStyle = '#ffffff';
                        ctx.shadowColor = '#00d2ff';
                        ctx.shadowBlur = 10;
                    } else if (pt.isHighDensity) {
                        ctx.fillStyle = isSpeakingNow ? '#38bdf8' : '#00d2ff';
                        ctx.shadowColor = '#00d2ff';
                        ctx.shadowBlur = isSpeakingNow ? 6 : 2;
                    } else {
                        ctx.fillStyle = `rgba(0, 210, 255, ${0.45 + normalizedDepth * 0.5})`;
                        ctx.shadowBlur = 0;
                    }
                } else {
                    // Back hemisphere translucent attenuation
                    ctx.fillStyle = `rgba(14, 116, 144, ${Math.max(0.06, normalizedDepth * 0.25)})`;
                    ctx.shadowBlur = 0;
                }
                ctx.fill();
            });
            ctx.shadowBlur = 0;

            // --- LAYER 6: 3D GREAT-CIRCLE GEODESIC SIGNAL ARCS ---
            if (viewMode === 'ALL' || viewMode === 'ARCS') {
                arcConnections.forEach(arc => {
                    arc.progress = (arc.progress + arc.speed * (isSpeakingNow ? 1.6 : 1.0)) % 1;

                    // Interpolate 3D parabolic geodesic arch lifting above the sphere
                    const numSegments = 32;
                    ctx.beginPath();
                    let packetScreenPos = null;

                    for (let j = 0; j <= numSegments; j++) {
                        const t = j / numSegments;
                        
                        // Slerp on unit sphere
                        const ix = arc.from.x * (1 - t) + arc.to.x * t;
                        const iy = arc.from.y * (1 - t) + arc.to.y * t;
                        const iz = arc.from.z * (1 - t) + arc.to.z * t;
                        const len = Math.sqrt(ix * ix + iy * iy + iz * iz) || 1;
                        
                        // Parabolic height peak of 1.25x R at midpoint (t = 0.5)
                        const altitude = R * (1 + Math.sin(t * Math.PI) * 0.28);
                        const ax = (ix / len) * altitude;
                        const ay = (iy / len) * altitude;
                        const az = (iz / len) * altitude;

                        const p = project3D(ax, ay, az);
                        if (j === 0) ctx.moveTo(p.x, p.y);
                        else ctx.lineTo(p.x, p.y);

                        // Capture packet position
                        if (Math.abs(t - arc.progress) < (1 / numSegments)) {
                            packetScreenPos = p;
                        }
                    }

                    ctx.strokeStyle = isSpeakingNow ? `${arc.color}bb` : `${arc.color}44`;
                    ctx.lineWidth = isSpeakingNow ? 1.8 : 1.2;
                    ctx.setLineDash([4, 6]);
                    ctx.stroke();
                    ctx.setLineDash([]);

                    // Draw glowing photon packet traveling along arc
                    if (packetScreenPos) {
                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(packetScreenPos.x, packetScreenPos.y, 4 * packetScreenPos.scale, 0, Math.PI * 2);
                        ctx.fillStyle = '#ffffff';
                        ctx.shadowColor = arc.color;
                        ctx.shadowBlur = 12;
                        ctx.fill();

                        // Photon pulse ring
                        ctx.beginPath();
                        ctx.arc(packetScreenPos.x, packetScreenPos.y, 8 * packetScreenPos.scale, 0, Math.PI * 2);
                        ctx.strokeStyle = `${arc.color}88`;
                        ctx.lineWidth = 1.5;
                        ctx.stroke();
                        ctx.restore();
                    }
                });
            }

            // --- LAYER 7: ACTIVE STATION BEACONS & 3D HUD LABELS ---
            stationPoints.forEach(st => {
                const p = project3D(st.x * R, st.y * R, st.z * R);
                const isFront = p.z < 0;

                // Elevated beacon pin extending radially into space
                const beaconHeight = R * 1.18;
                const pTop = project3D(st.x * beaconHeight, st.y * beaconHeight, st.z * beaconHeight);

                // Ground beacon target circle
                ctx.beginPath();
                ctx.arc(p.x, p.y, (isFront ? 6 : 3) * p.scale, 0, Math.PI * 2);
                ctx.strokeStyle = isFront ? st.color : `${st.color}44`;
                ctx.lineWidth = 1.5;
                ctx.stroke();

                if (isFront) {
                    // Vertical Laser Pin
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(pTop.x, pTop.y);
                    ctx.strokeStyle = `rgba(255, 255, 255, 0.75)`;
                    ctx.lineWidth = 1;
                    ctx.stroke();

                    // Beacon Top Flare
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(pTop.x, pTop.y, 4 * pTop.scale, 0, Math.PI * 2);
                    ctx.fillStyle = st.color;
                    ctx.shadowColor = st.color;
                    ctx.shadowBlur = 14;
                    ctx.fill();

                    // Station Callout Badge
                    ctx.font = '10px "JetBrains Mono", monospace';
                    ctx.fillStyle = '#ffffff';
                    ctx.shadowColor = '#000000';
                    ctx.shadowBlur = 6;
                    ctx.fillText(`[ ${st.id} ]`, pTop.x + 8, pTop.y + 3);
                    ctx.restore();
                }
            });

            // --- LAYER 8: ORBITING SATELLITE GIMBALS ---
            satellites.forEach(sat => {
                sat.angle += sat.speed * (isSpeakingNow ? 1.5 : 1.0);
                const dist = R * sat.radiusMult;
                
                const sx = Math.cos(sat.angle) * dist;
                const sy = Math.sin(sat.angle) * dist * Math.sin(sat.tilt);
                const sz = Math.sin(sat.angle) * dist * Math.cos(sat.tilt);
                const p = project3D(sx, sy, sz);

                // Orbit path ring
                ctx.beginPath();
                for (let k = 0; k <= 44; k++) {
                    const a = (k / 44) * Math.PI * 2;
                    const ox = Math.cos(a) * dist;
                    const oy = Math.sin(a) * dist * Math.sin(sat.tilt);
                    const oz = Math.sin(a) * dist * Math.cos(sat.tilt);
                    const op = project3D(ox, oy, oz);
                    if (k === 0) ctx.moveTo(op.x, op.y);
                    else ctx.lineTo(op.x, op.y);
                }
                ctx.strokeStyle = `rgba(255, 255, 255, 0.08)`;
                ctx.lineWidth = 1;
                ctx.stroke();

                // Satellite body
                ctx.save();
                ctx.beginPath();
                ctx.arc(p.x, p.y, sat.size * p.scale, 0, Math.PI * 2);
                ctx.fillStyle = sat.color;
                ctx.shadowColor = sat.color;
                ctx.shadowBlur = isSpeakingNow ? 14 : 7;
                ctx.fill();
                ctx.restore();
            });

            // --- LAYER 9: CIRCULAR BASE AUDIO SPECTRUM EQUALIZER ---
            const numEqBars = 36;
            const eqRadius = R * 1.35;
            for (let b = 0; b < numEqBars; b++) {
                const angle = (b / numEqBars) * Math.PI * 2 + time * 0.2;
                const bx = cx + Math.cos(angle) * eqRadius;
                const by = cy + Math.sin(angle) * (eqRadius * 0.42); // Isometric perspective tilt
                
                // Voice-modulated height
                const barMod = isSpeakingNow
                    ? Math.abs(Math.sin(time * 6 + b * 0.45) * 16 + Math.cos(time * 9 + b) * 10)
                    : (Math.sin(time * 2 + b * 0.3) * 3 + 4);

                ctx.beginPath();
                ctx.moveTo(bx, by);
                ctx.lineTo(bx, by - barMod);
                ctx.strokeStyle = isSpeakingNow
                    ? `rgba(0, 210, 255, ${0.4 + (barMod / 26) * 0.6})`
                    : 'rgba(56, 189, 248, 0.2)';
                ctx.lineWidth = 2.5;
                ctx.stroke();
            }

            // --- LAYER 10: TACTICAL HUD TARGET RETICLE CORNERS ---
            ctx.save();
            const cornerR = R * 1.28;
            ctx.strokeStyle = 'rgba(0, 210, 255, 0.4)';
            ctx.lineWidth = 1.5;

            // Reticle tick brackets
            const drawBracket = (angle) => {
                const bx = cx + Math.cos(angle) * cornerR;
                const by = cy + Math.sin(angle) * cornerR;
                ctx.beginPath();
                ctx.arc(cx, cy, cornerR, angle - 0.12, angle + 0.12);
                ctx.stroke();
            };
            drawBracket(Math.PI * 0.25);
            drawBracket(Math.PI * 0.75);
            drawBracket(Math.PI * 1.25);
            drawBracket(Math.PI * 1.75);
            ctx.restore();

            // Periodic HUD Telemetry Update (throttle to ~10Hz for smooth UI)
            hudUpdateCounter++;
            if (hudUpdateCounter % 6 === 0) {
                // Calculate coordinate facing direct center of camera
                const currentLon = (-rotRef.current.y * 180 / Math.PI + 360) % 360;
                const currentLat = (rotRef.current.x * 180 / Math.PI);
                
                const latStr = `${Math.abs(currentLat).toFixed(2)}° ${currentLat >= 0 ? 'N' : 'S'}`;
                const lonStr = `${currentLon.toFixed(2)}° E`;
                const yawDeg = `${Math.round((-rotRef.current.y * 180 / Math.PI) % 360 + 360) % 360}°`;
                const pitchDeg = `${Math.round(currentLat)}°`;

                setHudData(prev => ({
                    ...prev,
                    lat: latStr,
                    lon: lonStr,
                    yaw: yawDeg,
                    pitch: pitchDeg
                }));
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', updateDimensions);
        };
    }, [viewMode]);

    // 2-Axis Smooth Trackball Interaction Handlers
    const handleMouseDown = (e) => {
        isDraggingRef.current = true;
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e) => {
        if (!isDraggingRef.current) return;
        const dx = e.clientX - lastMousePosRef.current.x;
        const dy = e.clientY - lastMousePosRef.current.y;
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };

        // Apply direct rotation and store instantaneous velocity for momentum
        rotRef.current.y += dx * 0.007;
        rotRef.current.x += dy * 0.007;
        velocityRef.current = {
            x: dx * 0.005,
            y: dy * 0.004
        };
    };

    const handleMouseUp = () => {
        isDraggingRef.current = false;
    };

    // Touch support for mobile PWA
    const handleTouchStart = (e) => {
        if (e.touches.length === 1) {
            isDraggingRef.current = true;
            lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
    };

    const handleTouchMove = (e) => {
        if (!isDraggingRef.current || e.touches.length !== 1) return;
        const dx = e.touches[0].clientX - lastMousePosRef.current.x;
        const dy = e.touches[0].clientY - lastMousePosRef.current.y;
        lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

        rotRef.current.y += dx * 0.007;
        rotRef.current.x += dy * 0.007;
        velocityRef.current = { x: dx * 0.005, y: dy * 0.004 };
    };

    const handleTouchEnd = () => {
        isDraggingRef.current = false;
    };

    return (
        <div 
            ref={containerRef}
            className="relative w-full h-[650px] flex items-center justify-center rounded-3xl bg-gradient-to-b from-[#0c1222]/95 via-[#080d19] to-[#060a14] border border-cyan-500/20 shadow-[0_16px_48px_rgba(0,0,0,0.9)] overflow-hidden select-none group"
            onMouseLeave={handleMouseUp}
        >
            {/* Holographic Ambient Glow Frame */}
            <div className="absolute inset-0 bg-radial-gradient from-cyan-500/10 via-transparent to-transparent pointer-events-none" />

            {/* Futuristic Top HUD Banner */}
            <div className="absolute top-4 left-6 right-6 flex justify-between items-center z-10 pointer-events-none">
                <div className="flex items-center gap-2.5 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-cyan-500/30">
                    <span className={`w-2.5 h-2.5 rounded-full ${isSpeaking ? 'bg-[#00d2ff] shadow-[0_0_12px_#00d2ff] animate-ping' : 'bg-emerald-400 shadow-[0_0_8px_#34d399]'}`} />
                    <span className="text-xs font-mono tracking-wider uppercase font-semibold text-gray-200">
                        {isSpeaking ? 'AEGIS Neural Transmission' : 'Holographic Planetary Radar'}
                    </span>
                    <span className="text-[10px] text-cyan-400 font-mono hidden sm:inline-block ml-1">
                        • 60 FPS
                    </span>
                </div>

                <div className="flex items-center gap-2 pointer-events-auto">
                    {/* View filter chips */}
                    <div className="flex items-center bg-black/50 backdrop-blur-md rounded-xl p-0.5 border border-white/10 text-[10px] font-mono">
                        <button
                            onClick={() => setViewMode('ALL')}
                            className={`px-2.5 py-1 rounded-lg transition-all ${viewMode === 'ALL' ? 'bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            Global
                        </button>
                        <button
                            onClick={() => setViewMode('STATIONS')}
                            className={`px-2.5 py-1 rounded-lg transition-all ${viewMode === 'STATIONS' ? 'bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            Stations
                        </button>
                        <button
                            onClick={() => setViewMode('ARCS')}
                            className={`px-2.5 py-1 rounded-lg transition-all ${viewMode === 'ARCS' ? 'bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            Signal Arcs
                        </button>
                    </div>
                </div>
            </div>

            {/* Dynamic Telemetry Corner HUD (Left) */}
            <div className="absolute top-16 left-6 z-10 pointer-events-none hidden md:flex flex-col gap-1 font-mono text-[10px] text-gray-400 bg-black/40 backdrop-blur-sm p-2.5 rounded-xl border border-white/5">
                <div className="text-cyan-400 font-bold tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    TARGET CENTER
                </div>
                <div className="flex justify-between gap-4">
                    <span>LATITUDE:</span>
                    <span className="text-gray-200 font-semibold">{hudData.lat}</span>
                </div>
                <div className="flex justify-between gap-4">
                    <span>LONGITUDE:</span>
                    <span className="text-gray-200 font-semibold">{hudData.lon}</span>
                </div>
                <div className="flex justify-between gap-4">
                    <span>BEARING:</span>
                    <span className="text-cyan-300">{hudData.yaw} YAW / {hudData.pitch} PITCH</span>
                </div>
            </div>

            {/* Dynamic Telemetry Corner HUD (Right) */}
            <div className="absolute top-16 right-6 z-10 pointer-events-none hidden md:flex flex-col gap-1 font-mono text-[10px] text-gray-400 bg-black/40 backdrop-blur-sm p-2.5 rounded-xl border border-white/5 text-right">
                <div className="text-emerald-400 font-bold tracking-wider flex items-center justify-end gap-1.5">
                    GRID COHERENCE: 99.8%
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div>5 ACTIVE GROUND BEACONS</div>
                <div>PARABOLIC GEODESICS: ONLINE</div>
                <div className="text-cyan-400">TRACKBALL MOMENTUM: ACTIVE</div>
            </div>

            {/* 3D Canvas Viewport */}
            <canvas 
                ref={canvasRef} 
                className="w-full h-full cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            />

            {/* Bottom HUD Bar & Action Controls */}
            <div className="absolute bottom-4 left-6 right-6 flex justify-between items-center z-10 pointer-events-none">
                <div className="flex items-center gap-2.5">
                    {/* Visualizer frequency equalizer meters */}
                    <div className="flex items-end gap-1 h-6 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 shadow-inner">
                        <span className={`w-1 bg-[#00d2ff] rounded-full transition-all ${isSpeaking ? 'h-5 animate-pulse' : 'h-2'}`} />
                        <span className={`w-1 bg-[#38bdf8] rounded-full transition-all ${isSpeaking ? 'h-3' : 'h-3'}`} />
                        <span className={`w-1 bg-[#00d2ff] rounded-full transition-all ${isSpeaking ? 'h-5 animate-bounce' : 'h-2'}`} />
                        <span className={`w-1 bg-[#a855f7] rounded-full transition-all ${isSpeaking ? 'h-4 animate-pulse' : 'h-3'}`} />
                        <span className={`w-1 bg-[#38bdf8] rounded-full transition-all ${isSpeaking ? 'h-5.5' : 'h-1.5'}`} />
                    </div>
                    
                    <span className="text-xs font-mono text-gray-300 font-medium bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/5">
                        {isSpeaking ? (
                            <span className="text-cyan-400 font-semibold tracking-wide flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                                Neural Signal Active • Broadcasting
                            </span>
                        ) : (
                            <span className="flex items-center gap-2 text-gray-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/50"></span>
                                Drag to orbit • 2-Axis Momentum
                            </span>
                        )}
                    </span>
                </div>

                <div className="pointer-events-auto flex items-center gap-2">
                    <button
                        onClick={onTriggerSpeakTest}
                        className="px-4 py-2 text-xs font-semibold rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-[#00d2ff] border border-cyan-500/40 hover:border-cyan-400 transition-all flex items-center gap-2 shadow-[0_0_16px_rgba(0,210,255,0.25)] hover:shadow-[0_0_24px_rgba(0,210,255,0.45)] cursor-pointer backdrop-blur-md active:scale-95"
                    >
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                        Test Voice Output
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DigitalSignalsGlobe;
