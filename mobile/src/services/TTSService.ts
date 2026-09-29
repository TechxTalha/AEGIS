import Tts from 'react-native-tts';

class TTSService {
  public init() {
    // Configure default parameters for a natural AI voice
    Tts.setDefaultRate(0.5); // Normal speed
    Tts.setDefaultPitch(1.0);
    // Tts.setDefaultLanguage('en-US'); // Ensure it defaults to English
  }

  public speak(text: string, onStart?: () => void, onComplete?: () => void) {
    Tts.getInitStatus().then(() => {
      Tts.stop(); // Stop any ongoing speech before starting new one

      const startListener = () => {
        if (onStart) onStart();
        Tts.removeEventListener('tts-start', startListener);
      };
      
      const finishListener = () => {
        if (onComplete) onComplete();
        Tts.removeEventListener('tts-finish', finishListener);
        Tts.removeEventListener('tts-cancel', finishListener);
      };

      Tts.addEventListener('tts-start', startListener);
      Tts.addEventListener('tts-finish', finishListener);
      Tts.addEventListener('tts-cancel', finishListener);

      Tts.speak(text);
    }).catch(err => {
      console.warn("TTS Init Error:", err);
      // Fallback to complete state so the app doesn't hang in speaking mode
      if (onComplete) onComplete(); 
    });
  }

  public stop() {
    Tts.stop();
  }
}

export default new TTSService();
