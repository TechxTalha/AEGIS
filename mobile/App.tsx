import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
  Animated,
  Easing,
  TouchableOpacity,
  Platform,
} from 'react-native';
import ReactNativeForegroundService from '@supersami/rn-foreground-service';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import AudioStreamService from './src/services/AudioStreamService';
import WakeWordService from './src/services/WakeWordService';
import TTSService from './src/services/TTSService';

type AppState = 'idle' | 'listening' | 'processing' | 'speaking';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#02040A" />
      <AegisUI />
    </SafeAreaProvider>
  );
}

function AegisUI() {
  const insets = useSafeAreaInsets();
  const [appState, setAppState] = useState<AppState>('idle');
  const [transcript, setTranscript] = useState('Awaiting wake word...');
  const isChallengedRef = useRef(false);
  
  // Animation Values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Colors for states
  const stateColors = {
    idle: '#4A5568', // Slate
    listening: '#00E5FF', // Neon Cyan
    processing: '#EAB308', // Cyber Yellow
    speaking: '#9D4EDD', // Tech Purple
  };

  const stateLabels = {
    idle: 'SYS.STANDBY',
    listening: 'MIC.ACTIVE',
    processing: 'NET.UPLINK',
    speaking: 'SYS.RESPOND',
  };

  // Initialization
  useEffect(() => {
    TTSService.init();
    AudioStreamService.init().then(success => {
      if (success) console.log("Audio Service Ready");
    });
    
    // Continuous spin for the outer HUD ring
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 10000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Start Foreground Service on Android to keep microphone alive
    if (Platform.OS === 'android') {
      ReactNativeForegroundService.start({
        id: 1244,
        title: "AEGIS CORE",
        message: "Background telemetry active.",
        icon: "ic_launcher",
      });
    }
    
    return () => {
      if (Platform.OS === 'android') {
        ReactNativeForegroundService.stopAll();
      }
    };
  }, []);

  // State Machine Effect
  useEffect(() => {
    if (appState === 'idle') {
      setTranscript('Awaiting wake word...');
      WakeWordService.startListening(() => {
        setAppState('listening');
      });
    } else {
      WakeWordService.stopListening();
    }

    if (appState === 'listening') {
      setTranscript('Listening...');
      AudioStreamService.startStreaming(
        (text, challenge) => {
          setTranscript(text);
          if (challenge !== undefined) isChallengedRef.current = challenge;
        },
        () => setAppState('speaking')
      );
    }

    if (appState === 'processing') {
      setTranscript('Processing uplink...');
      AudioStreamService.stopStreaming();
    }

    if (appState === 'speaking') {
      TTSService.speak(transcript, undefined, () => {
        if (isChallengedRef.current) {
          isChallengedRef.current = false;
          setAppState('listening'); 
        } else {
          setAppState('idle');
        }
      });
    }
  }, [appState]);

  // Animation Effect
  useEffect(() => {
    pulseAnim.stopAnimation();
    glowAnim.stopAnimation();

    if (appState === 'idle') {
      Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }).start();
      Animated.timing(glowAnim, { toValue: 0.1, duration: 1500, useNativeDriver: false }).start();
    } else if (appState === 'listening') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
        ])
      ).start();
      Animated.timing(glowAnim, { toValue: 0.9, duration: 300, useNativeDriver: false }).start();
    } else if (appState === 'processing') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 250, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.95, duration: 250, useNativeDriver: true })
        ])
      ).start();
      Animated.timing(glowAnim, { toValue: 0.7, duration: 300, useNativeDriver: false }).start();
    } else if (appState === 'speaking') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, easing: Easing.in(Easing.ease), useNativeDriver: true })
        ])
      ).start();
      Animated.timing(glowAnim, { toValue: 0.8, duration: 300, useNativeDriver: false }).start();
    }
  }, [appState]);

  // Manual override on tap
  const handleOrbPress = () => {
    if (appState === 'idle') {
      setAppState('listening');
    } else if (appState === 'listening') {
      setAppState('processing');
    }
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const spinReverse = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>AEGIS_OS</Text>
          <Text style={styles.subLogo}>v2.0.4 // KERNEL</Text>
        </View>
        <View style={[styles.statusBadge, { borderColor: stateColors[appState] }]}>
          <View style={[styles.statusDot, { backgroundColor: stateColors[appState], shadowColor: stateColors[appState] }]} />
          <Text style={[styles.statusText, { color: stateColors[appState] }]}>{stateLabels[appState]}</Text>
        </View>
      </View>

      {/* Main Content / HUD Orb */}
      <View style={styles.centerContainer}>
        <TouchableOpacity activeOpacity={0.9} onPress={handleOrbPress}>
          <View style={styles.orbWrapper}>
            
            {/* Outer rotating dashed ring */}
            <Animated.View style={[
                styles.hudRing, 
                { borderColor: stateColors[appState], transform: [{ rotate: spin }] }
              ]} 
            />
            {/* Inner counter-rotating ring */}
            <Animated.View style={[
                styles.hudRingInner, 
                { borderColor: stateColors[appState], transform: [{ rotate: spinReverse }] }
              ]} 
            />

            <Animated.View
              style={[
                styles.orbBase,
                {
                  borderColor: stateColors[appState],
                  shadowColor: stateColors[appState],
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              {/* Core glow effect */}
              <Animated.View 
                 style={[
                   StyleSheet.absoluteFillObject, 
                   styles.innerGlow,
                   { 
                     backgroundColor: stateColors[appState],
                     opacity: glowAnim.interpolate({
                       inputRange: [0, 1],
                       outputRange: [0, 0.4]
                     }) 
                   }
                 ]} 
              />
              <View style={styles.orbCenterCore} />
            </Animated.View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Technical Readout & Transcript */}
      <View style={styles.bottomSection}>
        <View style={styles.techReadoutRow}>
          <Text style={styles.techText}>UPLINK: {appState === 'idle' ? 'STANDBY' : 'ACTIVE'}</Text>
          <Text style={styles.techText}>AUTH: {isChallengedRef.current ? 'PENDING' : 'VERIFIED'}</Text>
          <Text style={styles.techText}>LAT: 12ms</Text>
        </View>
        
        <View style={[styles.transcriptContainer, { borderColor: stateColors[appState] }]}>
          <Text style={styles.transcriptText}>{transcript}</Text>
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#02040A', // Extremely dark cyber blue
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 16,
    zIndex: 10,
  },
  logo: {
    fontSize: 22,
    fontWeight: '900',
    color: '#E2E8F0',
    letterSpacing: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  subLogo: {
    fontSize: 10,
    color: '#4A5568',
    letterSpacing: 2,
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  orbWrapper: {
    width: 240,
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hudRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    borderStyle: 'dashed',
    opacity: 0.4,
  },
  hudRingInner: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderStyle: 'dotted',
    opacity: 0.6,
  },
  orbBase: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#050A14',
    elevation: 20,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
    overflow: 'hidden',
  },
  orbCenterCore: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    opacity: 0.05,
  },
  innerGlow: {
    borderRadius: 70,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    zIndex: 10,
  },
  techReadoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  techText: {
    color: '#4A5568',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  transcriptContainer: {
    backgroundColor: 'rgba(5, 10, 20, 0.7)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 20,
    minHeight: 100,
    justifyContent: 'center',
  },
  transcriptText: {
    color: '#E2E8F0',
    fontSize: 18,
    fontWeight: '400',
    textAlign: 'left',
    lineHeight: 28,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default App;
