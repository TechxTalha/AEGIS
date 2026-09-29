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
      <StatusBar barStyle="light-content" backgroundColor="#050508" />
      <AegisUI />
    </SafeAreaProvider>
  );
}

function AegisUI() {
  const insets = useSafeAreaInsets();
  const [appState, setAppState] = useState<AppState>('idle');
  const [transcript, setTranscript] = useState('Awaiting wake word ("Porcupine")');
  const isChallengedRef = useRef(false);
  
  // Animation Values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Colors for states
  const stateColors = {
    idle: '#3a3a40',
    listening: '#00e5ff',
    processing: '#ffb300',
    speaking: '#b000ff',
  };

  // Initialization
  useEffect(() => {
    TTSService.init();
    AudioStreamService.init().then(success => {
      if (success) console.log("Audio Service Ready");
    });
    
    // Start Foreground Service on Android to keep microphone alive
    if (Platform.OS === 'android') {
      ReactNativeForegroundService.start({
        id: 1244,
        title: "AEGIS is listening",
        message: "Wake word engine is active in the background.",
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
      setTranscript('Awaiting wake word ("Porcupine")');
      WakeWordService.startListening(() => {
        // Wake word detected! Transition to listening
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
      setTranscript('Processing...');
      AudioStreamService.stopStreaming();
    }

    if (appState === 'speaking') {
      TTSService.speak(transcript, undefined, () => {
        if (isChallengedRef.current) {
          isChallengedRef.current = false;
          setAppState('listening'); // bypass wake word, immediately listen for passphrase
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
      Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }).start();
      Animated.timing(glowAnim, { toValue: 0.1, duration: 1000, useNativeDriver: false }).start();
    } else if (appState === 'listening') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
        ])
      ).start();
      Animated.timing(glowAnim, { toValue: 0.8, duration: 300, useNativeDriver: false }).start();
    } else if (appState === 'processing') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 400, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.9, duration: 400, useNativeDriver: true })
        ])
      ).start();
      Animated.timing(glowAnim, { toValue: 0.6, duration: 300, useNativeDriver: false }).start();
    } else if (appState === 'speaking') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 1200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.in(Easing.ease), useNativeDriver: true })
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

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>AEGIS</Text>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: stateColors[appState] }]} />
          <Text style={styles.statusText}>{appState.toUpperCase()}</Text>
        </View>
      </View>

      {/* Main Content / Glowing Orb */}
      <View style={styles.centerContainer}>
        <TouchableOpacity activeOpacity={0.9} onPress={handleOrbPress}>
          <Animated.View
            style={[
              styles.orbBase,
              {
                backgroundColor: '#111115',
                borderColor: stateColors[appState],
                shadowColor: stateColors[appState],
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            {/* Inner glow effect */}
            <Animated.View 
               style={[
                 StyleSheet.absoluteFillObject, 
                 styles.innerGlow,
                 { 
                   backgroundColor: stateColors[appState],
                   opacity: glowAnim.interpolate({
                     inputRange: [0, 1],
                     outputRange: [0, 0.3]
                   }) 
                 }
               ]} 
            />
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Transcription Area */}
      <View style={styles.transcriptContainer}>
        <Text style={styles.transcriptText}>{transcript}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050508',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  logo: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    color: '#aaaaaa',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbBase: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 20,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
    overflow: 'hidden',
  },
  innerGlow: {
    borderRadius: 90,
  },
  transcriptContainer: {
    paddingHorizontal: 32,
    paddingBottom: 64,
    alignItems: 'center',
    minHeight: 140,
    justifyContent: 'flex-end',
  },
  transcriptText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 32,
    opacity: 0.9,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});

export default App;
