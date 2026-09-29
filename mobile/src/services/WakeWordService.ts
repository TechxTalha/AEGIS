import { PorcupineManager, BuiltInKeyword } from '@picovoice/porcupine-react-native';

// NOTE: You must obtain an AccessKey from https://picovoice.ai/console/
// For a custom "Hey AEGIS" wake word, you will train a custom model (.ppn file) in the console.
// Here we use the built-in keyword "PORCUPINE" for initial testing.
const PICOVOICE_ACCESS_KEY = 'YOUR_PICOVOICE_ACCESS_KEY_HERE';

class WakeWordService {
  private porcupineManager: PorcupineManager | null = null;
  private isListening = false;

  public async startListening(onKeywordDetected: () => void) {
    if (this.isListening) return;

    try {
      this.porcupineManager = await PorcupineManager.fromBuiltInKeywords(
        PICOVOICE_ACCESS_KEY,
        [BuiltInKeyword.Porcupine],
        (keywordIndex: number) => {
          if (keywordIndex === 0) {
            console.log('Wake word detected!');
            // Automatically stop wake word detection when triggered,
            // so the microphone can be handed over to the AudioStreamService
            this.stopListening().then(() => {
                onKeywordDetected();
            });
          }
        }
      );

      await this.porcupineManager.start();
      this.isListening = true;
      console.log('Listening for wake word (Say "Porcupine")...');
    } catch (e: any) {
      console.error('Failed to start Porcupine:', e);
      if (e.toString().includes('AccessKey')) {
        console.warn('Please set a valid Picovoice AccessKey in WakeWordService.ts');
      }
    }
  }

  public async stopListening() {
    if (!this.isListening || !this.porcupineManager) return;
    
    try {
      await this.porcupineManager.stop();
      await this.porcupineManager.delete();
      this.porcupineManager = null;
      this.isListening = false;
      console.log('Stopped listening for wake word.');
    } catch (e) {
      console.error('Failed to stop Porcupine:', e);
    }
  }
}

export default new WakeWordService();
