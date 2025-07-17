export interface VoiceConfig {
  elevenlabsApiKey: string;
  elevenlabsAgentId: string;
  sttLanguage: string;
  ttsVoice: string;
  vadThreshold: number;
  recordingTimeout: number;
}

export const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  elevenlabsApiKey: process.env.ELEVENLABS_API_KEY || '',
  elevenlabsAgentId: process.env.ELEVENLABS_AGENT_ID || '',
  sttLanguage: 'en-US',
  ttsVoice: 'Matthew', // ElevenLabs voice
  vadThreshold: 0.5,
  recordingTimeout: 10000 // 10 seconds
};

export class VoiceConfigManager {
  private config: VoiceConfig;

  constructor(config: Partial<VoiceConfig> = {}) {
    this.config = { ...DEFAULT_VOICE_CONFIG, ...config };
  }

  getConfig(): VoiceConfig {
    return this.config;
  }

  updateConfig(updates: Partial<VoiceConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  validateConfig(): boolean {
    return !!(this.config.elevenlabsApiKey && this.config.elevenlabsAgentId);
  }
}