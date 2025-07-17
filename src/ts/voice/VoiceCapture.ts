export class VoiceCapture {
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  private isRecording = false;

  private onDataCallback?: (audioBlob: Blob) => void;
  private onErrorCallback?: (error: Error) => void;

  async requestPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      
      // Store the stream for later use
      this.mediaStream = stream;
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      return false;
    }
  }

  async startCapture(): Promise<void> {
    if (!this.mediaStream) {
      throw new Error('Microphone permission not granted');
    }

    if (this.isRecording) {
      console.warn('Already recording');
      return;
    }

    try {
      // Create audio context for processing
      this.audioContext = new AudioContext({ sampleRate: 16000 });
      
      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.mediaStream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.onDataCallback?.(audioBlob);
        this.audioChunks = [];
      };

      this.mediaRecorder.onerror = (event) => {
        const error = new Error(`MediaRecorder error: ${event.error}`);
        this.onErrorCallback?.(error);
      };

      this.mediaRecorder.start(100); // Collect data every 100ms
      this.isRecording = true;
      
      console.log('Voice capture started');
    } catch (error) {
      const err = new Error(`Failed to start voice capture: ${error}`);
      this.onErrorCallback?.(err);
      throw err;
    }
  }

  stopCapture(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      console.log('Voice capture stopped');
    }
  }

  onData(callback: (audioBlob: Blob) => void): void {
    this.onDataCallback = callback;
  }

  onError(callback: (error: Error) => void): void {
    this.onErrorCallback = callback;
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  cleanup(): void {
    this.stopCapture();
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  }
}