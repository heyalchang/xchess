import { GameBus } from '../Utils/GameBus';

export enum VoiceState {
  IDLE = 'idle',
  LISTENING = 'listening',
  PROCESSING = 'processing',
  ERROR = 'error',
  DISABLED = 'disabled'
}

export class VoiceUI {
  private scene: Phaser.Scene;
  private gameBus: GameBus;
  private currentState: VoiceState = VoiceState.IDLE;
  
  // UI Elements
  private micButton: Phaser.GameObjects.Graphics;
  private statusText: Phaser.GameObjects.Text;
  private transcriptDisplay: Phaser.GameObjects.Text;
  private stateIndicator: Phaser.GameObjects.Graphics;
  
  // Configuration
  private readonly UI_CONFIG = {
    micButton: { x: 50, y: 50, scale: 0.8 },
    statusText: { x: 50, y: 100, style: { fontSize: '16px', fill: '#ffffff' } },
    transcript: { x: 50, y: 130, style: { fontSize: '14px', fill: '#cccccc', wordWrap: { width: 300 } } },
    stateIndicator: { x: 80, y: 80, radius: 8 }
  };

  constructor(scene: Phaser.Scene, gameBus: GameBus) {
    this.scene = scene;
    this.gameBus = gameBus;
  }

  create(): void {
    this.createMicButton();
    this.createStatusText();
    this.createTranscriptDisplay();
    this.createStateIndicator();
    this.setupEventListeners();
    this.updateUI();
  }

  private createMicButton(): void {
    // Create a simple circular button for the microphone
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0x007ACC);
    graphics.fillCircle(0, 0, 20);
    graphics.setInteractive(new Phaser.Geom.Circle(0, 0, 20), Phaser.Geom.Circle.Contains);
    
    // Add mic icon (simplified)
    const micIcon = this.scene.add.text(0, 0, '🎤', { 
      fontSize: '20px', 
      align: 'center' 
    });
    micIcon.setOrigin(0.5, 0.5);
    
    // Group them together
    const buttonGroup = this.scene.add.group([graphics, micIcon]);
    buttonGroup.setXY(this.UI_CONFIG.micButton.x, this.UI_CONFIG.micButton.y);
    
    // Store reference to the graphics for interaction
    this.micButton = graphics;
    
    // Set up click handler
    graphics.on('pointerdown', () => this.handleMicButtonClick());
    graphics.on('pointerover', () => graphics.setAlpha(0.8));
    graphics.on('pointerout', () => graphics.setAlpha(1.0));
  }

  private createStatusText(): void {
    this.statusText = this.scene.add.text(
      this.UI_CONFIG.statusText.x,
      this.UI_CONFIG.statusText.y,
      'Voice Ready',
      this.UI_CONFIG.statusText.style
    );
  }

  private createTranscriptDisplay(): void {
    this.transcriptDisplay = this.scene.add.text(
      this.UI_CONFIG.transcript.x,
      this.UI_CONFIG.transcript.y,
      '',
      this.UI_CONFIG.transcript.style
    );
  }

  private createStateIndicator(): void {
    this.stateIndicator = this.scene.add.graphics();
    this.stateIndicator.setPosition(
      this.UI_CONFIG.stateIndicator.x,
      this.UI_CONFIG.stateIndicator.y
    );
  }

  private setupEventListeners(): void {
    // Listen for voice events from GameBus
    this.gameBus.on('voice:start', () => this.setState(VoiceState.LISTENING));
    this.gameBus.on('voice:transcript', (data) => this.showTranscript(data.text));
    this.gameBus.on('voice:processing', () => this.setState(VoiceState.PROCESSING));
    this.gameBus.on('voice:error', (data) => this.showError(data.error));
    this.gameBus.on('voice:complete', () => this.setState(VoiceState.IDLE));
  }

  private handleMicButtonClick(): void {
    switch (this.currentState) {
      case VoiceState.IDLE:
        this.gameBus.emit('voice:start-request', {});
        break;
      case VoiceState.LISTENING:
        this.gameBus.emit('voice:stop-request', {});
        break;
      case VoiceState.PROCESSING:
        // Do nothing while processing
        break;
      case VoiceState.ERROR:
        this.setState(VoiceState.IDLE);
        break;
    }
  }

  setState(newState: VoiceState): void {
    this.currentState = newState;
    this.updateUI();
  }

  private updateUI(): void {
    this.updateStatusText();
    this.updateStateIndicator();
    this.updateMicButton();
  }

  private updateStatusText(): void {
    const statusMessages = {
      [VoiceState.IDLE]: 'Voice Ready - Click to speak',
      [VoiceState.LISTENING]: 'Listening... Click to stop',
      [VoiceState.PROCESSING]: 'Processing move...',
      [VoiceState.ERROR]: 'Voice Error - Click to retry',
      [VoiceState.DISABLED]: 'Voice Disabled'
    };
    
    this.statusText.setText(statusMessages[this.currentState]);
  }

  private updateStateIndicator(): void {
    this.stateIndicator.clear();
    
    const colors = {
      [VoiceState.IDLE]: 0x00ff00,      // Green
      [VoiceState.LISTENING]: 0xff0000,  // Red
      [VoiceState.PROCESSING]: 0xffff00, // Yellow
      [VoiceState.ERROR]: 0xff4444,     // Dark Red
      [VoiceState.DISABLED]: 0x666666   // Gray
    };
    
    const color = colors[this.currentState];
    this.stateIndicator.fillStyle(color);
    this.stateIndicator.fillCircle(0, 0, this.UI_CONFIG.stateIndicator.radius);
    
    // Add pulsing effect for listening state
    if (this.currentState === VoiceState.LISTENING) {
      this.scene.tweens.add({
        targets: this.stateIndicator,
        alpha: 0.3,
        duration: 500,
        yoyo: true,
        repeat: -1
      });
    } else {
      this.scene.tweens.killTweensOf(this.stateIndicator);
      this.stateIndicator.setAlpha(1);
    }
  }

  private updateMicButton(): void {
    const isDisabled = this.currentState === VoiceState.DISABLED || 
                      this.currentState === VoiceState.PROCESSING;
    
    this.micButton.setAlpha(isDisabled ? 0.5 : 1.0);
    this.micButton.setInteractive(!isDisabled);
  }

  showTranscript(text: string): void {
    this.transcriptDisplay.setText(`"${text}"`);
    
    // Clear transcript after 3 seconds
    this.scene.time.delayedCall(3000, () => {
      this.transcriptDisplay.setText('');
    });
  }

  showError(error: string): void {
    this.setState(VoiceState.ERROR);
    this.transcriptDisplay.setText(`Error: ${error}`);
    
    // Auto-clear error after 5 seconds
    this.scene.time.delayedCall(5000, () => {
      if (this.currentState === VoiceState.ERROR) {
        this.setState(VoiceState.IDLE);
        this.transcriptDisplay.setText('');
      }
    });
  }

  showParseResult(move: string | null): void {
    if (move) {
      this.transcriptDisplay.setText(`Parsed: ${move}`);
    } else {
      this.transcriptDisplay.setText('Could not understand move');
    }
  }

  setEnabled(enabled: boolean): void {
    this.setState(enabled ? VoiceState.IDLE : VoiceState.DISABLED);
  }

  destroy(): void {
    this.scene.tweens.killTweensOf(this.stateIndicator);
    // GameBus listeners will be cleaned up automatically
  }
}