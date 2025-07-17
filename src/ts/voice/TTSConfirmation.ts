export class TTSConfirmation {
  private synth: SpeechSynthesis;
  private voice: SpeechSynthesisVoice | null = null;
  private enabled = true;

  constructor() {
    this.synth = window.speechSynthesis;
    this.initializeVoice();
  }

  private initializeVoice(): void {
    if (this.synth.getVoices().length === 0) {
      this.synth.addEventListener('voiceschanged', () => {
        this.selectVoice();
      });
    } else {
      this.selectVoice();
    }
  }

  private selectVoice(): void {
    const voices = this.synth.getVoices();
    
    // Prefer English voices
    const englishVoices = voices.filter(voice => voice.lang.startsWith('en'));
    
    // Look for preferred voices
    const preferredNames = ['Matthew', 'Alex', 'Daniel', 'Fred', 'Karen', 'Moira'];
    
    for (const name of preferredNames) {
      const voice = englishVoices.find(v => v.name.includes(name));
      if (voice) {
        this.voice = voice;
        return;
      }
    }
    
    // Fallback to first English voice or default
    this.voice = englishVoices[0] || voices[0] || null;
  }

  confirmMove(san: string): void {
    if (!this.enabled) return;
    
    const text = this.formatMoveConfirmation(san);
    this.speak(text);
  }

  announceCheck(): void {
    if (!this.enabled) return;
    this.speak('Check!');
  }

  announceCheckmate(winner: 'white' | 'black'): void {
    if (!this.enabled) return;
    this.speak(`Checkmate! ${winner} wins!`);
  }

  announceStalemate(): void {
    if (!this.enabled) return;
    this.speak('Stalemate! The game is a draw.');
  }

  announceError(message: string): void {
    if (!this.enabled) return;
    this.speak(`Error: ${message}`);
  }

  announceIllegalMove(): void {
    if (!this.enabled) return;
    this.speak('That move is not legal.');
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  private speak(text: string): void {
    // Cancel any ongoing speech
    this.synth.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    if (this.voice) {
      utterance.voice = this.voice;
    }
    
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    
    console.log('TTS:', text);
    this.synth.speak(utterance);
  }

  private formatMoveConfirmation(san: string): string {
    // Handle castling
    if (san === 'O-O') {
      return 'Short castle confirmed';
    }
    if (san === 'O-O-O') {
      return 'Long castle confirmed';
    }
    
    // Parse SAN notation
    let result = '';
    let i = 0;
    
    // Check for piece (if not present, it's a pawn)
    if (san[0] && 'NQKRB'.includes(san[0])) {
      const pieceNames = {
        'N': 'Knight',
        'Q': 'Queen', 
        'K': 'King',
        'R': 'Rook',
        'B': 'Bishop'
      };
      result += pieceNames[san[0] as keyof typeof pieceNames];
      i++;
    } else {
      result += 'Pawn';
    }
    
    // Check for disambiguation (file or rank)
    if (san[i] && 'abcdefgh'.includes(san[i])) {
      result += ` on ${san[i]}-file`;
      i++;
    } else if (san[i] && '12345678'.includes(san[i])) {
      result += ` on rank ${san[i]}`;
      i++;
    }
    
    // Check for capture
    if (san[i] === 'x') {
      result += ' takes';
      i++;
    } else {
      result += ' to';
    }
    
    // Destination square
    if (san[i] && san[i + 1]) {
      result += ` ${san[i]}-${san[i + 1]}`;
      i += 2;
    }
    
    // Check for promotion
    if (san[i] === '=') {
      i++;
      if (san[i]) {
        const pieceNames = {
          'N': 'knight',
          'Q': 'queen',
          'R': 'rook', 
          'B': 'bishop'
        };
        result += `, promotes to ${pieceNames[san[i] as keyof typeof pieceNames]}`;
        i++;
      }
    }
    
    // Check for check or checkmate
    if (san[i] === '+') {
      result += ', check';
    } else if (san[i] === '#') {
      result += ', checkmate';
    }
    
    return result + ' confirmed';
  }
}