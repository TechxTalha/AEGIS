import LiveAudioStream from 'react-native-live-audio-stream';
import { Platform } from 'react-native';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { Buffer } from 'buffer';

const WS_URL = 'ws://10.0.2.2:8080/ws/audio'; // Backend IP for Android emulator (use localhost for iOS)

class AudioStreamService {
  private ws: WebSocket | null = null;
  private isRecording = false;
  private onResponseCb?: (text: string, isChallenge?: boolean) => void;
  private onCompleteCb?: () => void;

  public async init() {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      console.warn('Microphone permission denied');
      return false;
    }

    const options = {
      sampleRate: 16000,
      channels: 1,
      bitsPerSample: 16,
      audioSource: 6, // VOICE_RECOGNITION on Android
      bufferSize: 4096,
    };

    LiveAudioStream.init(options);

    LiveAudioStream.on('data', data => {
      // data is base64 encoded PCM audio chunk
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'audio_chunk',
          payload: data
        }));
      }
    });

    this.connectWebSocket();

    return true;
  }

  private connectWebSocket() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    
    this.ws = new WebSocket(WS_URL);
    
    this.ws.onopen = () => {
      console.log('Connected to AEGIS audio stream');
    };

    this.ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'transcript') {
          if (this.onResponseCb) this.onResponseCb(msg.payload);
        } else if (msg.type === 'response') {
          if (this.onResponseCb) this.onResponseCb(msg.payload, false);
          if (this.onCompleteCb) this.onCompleteCb();
        } else if (msg.type === 'auth_challenge') {
          if (this.onResponseCb) this.onResponseCb(msg.payload, true);
          if (this.onCompleteCb) this.onCompleteCb();
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message', err);
      }
    };

    this.ws.onclose = () => {
      console.log('Disconnected from AEGIS audio stream');
      setTimeout(() => this.connectWebSocket(), 3000); // Reconnect loop
    };
  }

  public startStreaming(onResponse: (text: string, isChallenge?: boolean) => void, onComplete: () => void) {
    if (this.isRecording) return;
    
    this.onResponseCb = onResponse;
    this.onCompleteCb = onComplete;
    this.connectWebSocket(); // Ensure connected
    
    LiveAudioStream.start();
    this.isRecording = true;
  }

  public stopStreaming() {
    if (!this.isRecording) return;
    LiveAudioStream.stop();
    this.isRecording = false;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'end_stream' }));
    }
  }

  private async requestPermissions() {
    const permission = Platform.OS === 'ios' ? PERMISSIONS.IOS.MICROPHONE : PERMISSIONS.ANDROID.RECORD_AUDIO;
    const result = await request(permission);
    return result === RESULTS.GRANTED;
  }
}

export default new AudioStreamService();
