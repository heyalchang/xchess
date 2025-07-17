# Phase 2: Voice Integration Plan
## ElevenLabs STT → Chess Move Pipeline

**Prerequisites**: Phase 1 complete with GameBus event system and chess.js integration

---

## **Voice Architecture Overview**

```
Microphone → ElevenLabs WS → Text Parser → SAN → GameBus → Board Update → TTS Confirmation
```

### **Core Components**

1. **VoiceCapture**: Microphone access and streaming
2. **ElevenLabsSTT**: WebSocket client for speech-to-text
3. **MoveParser**: Natural language → Standard Algebraic Notation
4. **VoiceUI**: Visual feedback and controls
5. **TTSConfirmation**: Speech synthesis for move acknowledgments

---

## **Phase 2A: Voice Capture Infrastructure**
*Estimated: 1-2 days*

### **Task 2A.1: ElevenLabs WebSocket Client**
```typescript
// client/src/voice/ElevenLabsSTT.ts
export class ElevenLabsSTT {
  private ws: WebSocket;
  private isStreaming = false;

  async connect(apiKey: string): Promise<void> {
    // Connect to ElevenLabs Conversational AI WebSocket
    // wss://api.elevenlabs.io/v1/convai/conversation
  }

  startStreaming(): void {
    // Begin PCM audio stream (16kHz)
  }

  stopStreaming(): void {
    // End stream, get final transcript
  }

  onTranscript(callback: (text: string) => void): void {
    // Handle user_transcript events
  }
}
```

### **Task 2A.2: Microphone Capture**
```typescript
// client/src/voice/VoiceCapture.ts
export class VoiceCapture {
  private mediaRecorder: MediaRecorder;
  private audioContext: AudioContext;

  async requestPermission(): Promise<boolean> {
    // getUserMedia() for microphone access
  }

  startCapture(): void {
    // Begin 16kHz PCM capture
    // Stream to ElevenLabs WebSocket
  }

  stopCapture(): void {
    // End capture, process final audio
  }
}
```

### **Task 2A.3: Voice Activity Detection (Optional)**
```typescript
// client/src/voice/VAD.ts
export class VoiceActivityDetection {
  // Detect speech start/end for better UX
  // Alternative: Use ElevenLabs built-in VAD
}
```

---

## **Phase 2B: Natural Language Chess Parser**
*Estimated: 2-3 days*

### **Task 2B.1: PEG Grammar Definition**
```typescript
// shared/chess-grammar.pegjs
ChessMove = StandardMove / CasalMove / SpecialMove

StandardMove = piece:Piece? capture:"x"? square:Square check:"+"? 
{
  return { piece, capture, destination: square, check };
}

Piece = "knight" / "bishop" / "rook" / "queen" / "king" / "pawn"
Square = file:[a-h] rank:[1-8] { return file + rank; }

// Handle homophones and variations
Knight = "knight" / "night" / "k-n-i-g-h-t"
```

### **Task 2B.2: Homophone Mapping**
```typescript
// shared/MoveParser.ts
export class MoveParser {
  private homophones = {
    'night': 'knight',
    'to': '2', 
    'too': '2',
    'for': '4',
    'fore': '4',
    'ate': '8',
    'won': '1',
    'be': 'B',  // bishop
    'sea': 'C',
    // ... extensive mapping
  };

  parseMove(transcript: string): ChessMoveResult {
    // Clean transcript → attempt SAN conversion
    // "knight to f3" → "Nf3"
    // "pawn takes e5" → "exd5" (with context)
  }
}
```

### **Task 2B.3: Context-Aware Parsing**
```typescript
interface ParseContext {
  currentFEN: string;      // Board state for disambiguation
  legalMoves: string[];    // From chess.js for validation
  lastMove?: string;       // For pronoun resolution ("take it")
}

export class ContextualParser extends MoveParser {
  parseWithContext(transcript: string, context: ParseContext): string | null {
    // Use chess.js legal moves to disambiguate
    // "bishop takes" → find legal bishop captures
  }
}
```

---

## **Phase 2C: Voice UI Integration**
*Estimated: 1-2 days*

### **Task 2C.1: Voice Control UI**
```typescript
// client/src/voice/VoiceUI.ts
export class VoiceUI {
  private micButton: Phaser.GameObjects.Image;
  private statusText: Phaser.GameObjects.Text;
  private transcriptDisplay: Phaser.GameObjects.Text;

  create(scene: Phaser.Scene): void {
    // Add microphone button to existing chess UI
    // Visual feedback for recording state
  }

  showTranscript(text: string): void {
    // Display real-time transcript
  }

  showParseResult(move: string | null): void {
    // Show parsed move or error message
  }
}
```

### **Task 2C.2: Recording State Management**
```typescript
export enum VoiceState {
  IDLE = 'idle',
  LISTENING = 'listening', 
  PROCESSING = 'processing',
  ERROR = 'error'
}

export class VoiceStateManager {
  private currentState = VoiceState.IDLE;

  setState(newState: VoiceState): void {
    // Update UI, emit events to GameBus
  }
}
```

---

## **Phase 2D: TTS Confirmation System**
*Estimated: 1 day*

### **Task 2D.1: Move Confirmation**
```typescript
// client/src/voice/TTSConfirmation.ts
export class TTSConfirmation {
  private synth = window.speechSynthesis;

  confirmMove(san: string): void {
    const utterance = new SpeechSynthesisUtterance(
      this.formatMoveConfirmation(san)
    );
    // "Knight to f-3 acknowledged"
    // "Bishop takes e-5 confirmed"
    this.synth.speak(utterance);
  }

  announceCheck(): void {
    // "Check" announcement
  }

  announceCheckmate(winner: string): void {
    // "Checkmate, white wins"
  }
}
```

### **Task 2D.2: Pronunciation Helpers**
```typescript
private formatMoveConfirmation(san: string): string {
  // Convert SAN to speakable format
  // "Nf3" → "Knight to f-3"
  // "Bxe5+" → "Bishop takes e-5, check"
  // Handle pronunciation of squares: "e4" → "e-4"
}
```

---

## **Phase 2E: GameBus Voice Integration**
*Estimated: 1 day*

### **Task 2E.1: Voice Event Types**
```typescript
// shared/types.ts
export interface VoiceEvents {
  'voice:start': {};
  'voice:transcript': { text: string };
  'voice:move': { san: string };
  'voice:error': { error: string };
  'voice:confirm': { move: string };
}
```

### **Task 2E.2: Voice → GameBus Bridge**
```typescript
// client/src/voice/VoiceBridge.ts
export class VoiceBridge {
  constructor(
    private gameBus: GameBus,
    private stt: ElevenLabsSTT,
    private parser: ContextualParser,
    private tts: TTSConfirmation
  ) {
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // STT transcript → parser → GameBus move event
    this.stt.onTranscript((text) => {
      const context = this.getCurrentContext();
      const move = this.parser.parseWithContext(text, context);
      
      if (move) {
        this.gameBus.emit('move', { san: move, source: 'voice' });
        this.tts.confirmMove(move);
      } else {
        this.gameBus.emit('voice:error', { error: 'Could not parse move' });
      }
    });
  }
}
```

---

## **Phase 2F: Error Handling & UX Polish**
*Estimated: 1-2 days*

### **Task 2F.1: Robust Error Handling**
```typescript
export class VoiceErrorHandler {
  handleSTTError(error: Error): void {
    // Network issues, quota limits, etc.
  }

  handleParseError(transcript: string): void {
    // Suggest corrections: "Did you mean 'knight to f3'?"
  }

  handleIllegalMove(san: string): void {
    // "That move is not legal in the current position"
  }
}
```

### **Task 2F.2: Accessibility Features**
```typescript
export class VoiceAccessibility {
  provideMoveHints(): void {
    // "Available moves: knight to f3, pawn to e4..."
  }

  describeBoardState(): void {
    // "White knight on f3, black pawn on e5..."
  }
}
```

---

## **Integration with Phase 1 Foundation**

### **GameBus Events Integration**
Voice system subscribes to existing game events:
- `'move'` events trigger move confirmation
- `'turn'` events enable/disable voice input  
- `'check'` events trigger vocal announcements
- `'gameOver'` events provide final announcements

### **Chess.js Integration**
Parser uses chess.js for move validation:
- Legal moves list for disambiguation
- FEN state for contextual parsing
- Move validation before GameBus emission

---

## **Acceptance Criteria: Phase 2 Complete**

1. ✅ **Voice Input**: Say "knight to f3" → piece moves correctly
2. ✅ **Parse Accuracy**: Handle common homophones and variations
3. ✅ **TTS Feedback**: Moves confirmed audibly
4. ✅ **Error Recovery**: Clear feedback for unparseable commands
5. ✅ **UI Integration**: Voice controls blend with existing chess UI
6. ✅ **Context Awareness**: Disambiguate moves using board state
7. ✅ **Performance**: <400ms end-to-end latency (speech → confirmation)

---

## **Testing Strategy**

### **Unit Tests**
- MoveParser with extensive voice command variations
- Homophone mapping accuracy
- TTS pronunciation correctness

### **Integration Tests**  
- Voice → GameBus → Board update flow
- Error handling for network issues
- Legal move validation via chess.js

### **User Testing**
- Multiple speakers with different accents
- Noisy environment resilience
- Common chess terminology variations

---

This plan builds on the solid Phase 1 foundation to add sophisticated voice interaction while maintaining the existing chess game quality.