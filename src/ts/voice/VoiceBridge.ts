import { GameBus } from '../Utils/GameBus';
import { VoiceCapture } from './VoiceCapture';
import { MoveParser, ParseContext } from './MoveParser';
import { TTSConfirmation } from './TTSConfirmation';
import { VoiceUI, VoiceState } from './VoiceUI';
import { VoiceConfigManager } from './VoiceConfig';

export class VoiceBridge {
  private gameBus: GameBus;
  private voiceCapture: VoiceCapture;
  private moveParser: MoveParser;
  private ttsConfirmation: TTSConfirmation;
  private voiceUI: VoiceUI;
  private configManager: VoiceConfigManager;
  
  private isInitialized = false;
  private isVoiceEnabled = false;
  private currentGameState: any = null;

  constructor(scene: Phaser.Scene, gameBus: GameBus) {
    this.gameBus = gameBus;
    this.voiceCapture = new VoiceCapture();
    this.moveParser = new MoveParser();
    this.ttsConfirmation = new TTSConfirmation();
    this.voiceUI = new VoiceUI(scene, gameBus);
    this.configManager = new VoiceConfigManager();
    
    this.setupEventHandlers();
  }

  async initialize(): Promise<boolean> {
    try {
      // Initialize voice UI
      this.voiceUI.create();
      
      // Check if voice is supported
      if (!this.isVoiceSupported()) {
        console.warn('Voice features not supported in this browser');
        this.voiceUI.setEnabled(false);
        return false;
      }
      
      // Request microphone permission
      const hasPermission = await this.voiceCapture.requestPermission();
      if (!hasPermission) {
        console.warn('Microphone permission denied');
        this.voiceUI.setEnabled(false);
        return false;
      }
      
      this.isInitialized = true;
      this.isVoiceEnabled = true;
      this.voiceUI.setEnabled(true);
      
      console.log('Voice bridge initialized successfully');
      return true;
      
    } catch (error) {
      console.error('Failed to initialize voice bridge:', error);
      this.voiceUI.setEnabled(false);
      return false;
    }
  }

  private isVoiceSupported(): boolean {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      window.speechSynthesis &&
      window.SpeechSynthesisUtterance
    );
  }

  private setupEventHandlers(): void {
    // Voice control events
    this.gameBus.on('voice:start-request', () => this.handleStartVoiceCapture());
    this.gameBus.on('voice:stop-request', () => this.handleStopVoiceCapture());
    
    // Game state events
    this.gameBus.on('state', (gameState) => {
      this.currentGameState = gameState;
    });
    
    // Move events for TTS confirmation
    this.gameBus.on('move', (moveData) => {
      if (moveData.source !== 'voice') {
        // Don't confirm moves that originated from voice
        return;
      }
      this.ttsConfirmation.confirmMove(moveData.san);
    });
    
    // Game status events
    this.gameBus.on('check', () => {
      this.ttsConfirmation.announceCheck();
    });
    
    this.gameBus.on('checkmate', (data) => {
      this.ttsConfirmation.announceCheckmate(data.winner);
    });
    
    this.gameBus.on('stalemate', () => {
      this.ttsConfirmation.announceStalemate();
    });
    
    // Voice capture events
    this.voiceCapture.onData((audioBlob) => {
      this.handleAudioData(audioBlob);
    });
    
    this.voiceCapture.onError((error) => {
      this.handleVoiceError(error);
    });
  }

  private async handleStartVoiceCapture(): Promise<void> {
    if (!this.isInitialized || !this.isVoiceEnabled) {
      return;
    }
    
    try {
      this.gameBus.emit('voice:start', {});
      await this.voiceCapture.startCapture();
      
      // Set timeout for voice capture
      setTimeout(() => {
        if (this.voiceCapture.isCurrentlyRecording()) {
          this.handleStopVoiceCapture();
        }
      }, 10000); // 10 second timeout
      
    } catch (error) {
      this.handleVoiceError(error as Error);
    }
  }

  private handleStopVoiceCapture(): void {
    if (this.voiceCapture.isCurrentlyRecording()) {
      this.voiceCapture.stopCapture();
    }
  }

  private async handleAudioData(audioBlob: Blob): Promise<void> {
    try {
      this.gameBus.emit('voice:processing', {});
      
      // For now, simulate speech-to-text with Web Speech API
      // In production, this would use ElevenLabs WebSocket
      const transcript = await this.simulateSpeechToText(audioBlob);
      
      if (transcript) {
        this.gameBus.emit('voice:transcript', { text: transcript });
        this.processTranscript(transcript);
      } else {
        this.gameBus.emit('voice:error', { error: 'No speech detected' });
      }
      
    } catch (error) {
      this.handleVoiceError(error as Error);
    }
  }

  private async simulateSpeechToText(audioBlob: Blob): Promise<string | null> {
    // This is a placeholder implementation
    // In production, you would send the audio to ElevenLabs API
    
    return new Promise((resolve) => {
      // Simulate some processing time
      setTimeout(() => {
        // For testing, return some sample moves
        const testMoves = [
          'knight to f3',
          'pawn to e4',
          'queen takes e5',
          'king side castle',
          'bishop to c4'
        ];
        
        const randomMove = testMoves[Math.floor(Math.random() * testMoves.length)];
        resolve(randomMove);
      }, 500);
    });
  }

  private processTranscript(transcript: string): void {
    try {
      const context = this.getCurrentParseContext();
      const result = this.moveParser.parseMove(transcript, context);
      
      if (result.san) {
        this.voiceUI.showParseResult(result.san);
        
        // Validate the move with current game state
        if (this.isValidMove(result.san)) {
          // Emit the move through GameBus
          this.gameBus.emit('move', {
            san: result.san,
            source: 'voice',
            originalTranscript: transcript,
            confidence: result.confidence
          });
          
          this.gameBus.emit('voice:complete', {});
        } else {
          this.ttsConfirmation.announceIllegalMove();
          this.gameBus.emit('voice:error', { error: 'Illegal move' });
        }
      } else {
        this.voiceUI.showParseResult(null);
        this.ttsConfirmation.announceError('Could not understand move');
        this.gameBus.emit('voice:error', { error: result.error || 'Parse failed' });
      }
      
    } catch (error) {
      this.handleVoiceError(error as Error);
    }
  }

  private getCurrentParseContext(): ParseContext {
    if (!this.currentGameState) {
      return {
        currentFEN: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        legalMoves: [],
        playerColor: 'white'
      };
    }
    
    return {
      currentFEN: this.currentGameState.fen,
      legalMoves: this.currentGameState.legalMoves || [],
      lastMove: this.currentGameState.lastMove,
      playerColor: this.currentGameState.turn
    };
  }

  private isValidMove(san: string): boolean {
    // This would be validated against the chess engine
    // For now, assume it's valid if we have a SAN string
    return !!san;
  }

  private handleVoiceError(error: Error): void {
    console.error('Voice error:', error);
    this.gameBus.emit('voice:error', { error: error.message });
    this.voiceUI.showError(error.message);
  }

  setVoiceEnabled(enabled: boolean): void {
    this.isVoiceEnabled = enabled;
    this.voiceUI.setEnabled(enabled);
    this.ttsConfirmation.setEnabled(enabled);
  }

  destroy(): void {
    this.voiceCapture.cleanup();
    this.voiceUI.destroy();
  }
}