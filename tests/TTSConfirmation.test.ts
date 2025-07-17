import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TTSConfirmation } from '../src/ts/voice/TTSConfirmation';

// Mock Web Speech API
const mockSpeechSynthesis = {
  cancel: vi.fn(),
  speak: vi.fn(),
  getVoices: vi.fn(() => [
    { name: 'Matthew', lang: 'en-US' },
    { name: 'Alex', lang: 'en-US' },
    { name: 'French Voice', lang: 'fr-FR' }
  ]),
  addEventListener: vi.fn()
};

const mockSpeechSynthesisUtterance = vi.fn();

// Setup global mocks
Object.defineProperty(global, 'window', {
  value: {
    speechSynthesis: mockSpeechSynthesis,
    SpeechSynthesisUtterance: mockSpeechSynthesisUtterance
  },
  writable: true
});

describe('TTSConfirmation', () => {
  let tts: TTSConfirmation;

  beforeEach(() => {
    vi.clearAllMocks();
    tts = new TTSConfirmation();
  });

  describe('confirmMove', () => {
    it('should format and speak standard piece moves', () => {
      tts.confirmMove('Nf3');
      
      expect(mockSpeechSynthesisUtterance).toHaveBeenCalledWith(
        'Knight to f-3 confirmed'
      );
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    });

    it('should format and speak pawn moves', () => {
      tts.confirmMove('e4');
      
      expect(mockSpeechSynthesisUtterance).toHaveBeenCalledWith(
        'Pawn to e-4 confirmed'
      );
    });

    it('should format and speak capture moves', () => {
      tts.confirmMove('Nxe5');
      
      expect(mockSpeechSynthesisUtterance).toHaveBeenCalledWith(
        'Knight takes e-5 confirmed'
      );
    });

    it('should format and speak castling moves', () => {
      tts.confirmMove('O-O');
      expect(mockSpeechSynthesisUtterance).toHaveBeenCalledWith(
        'Short castle confirmed'
      );
      
      tts.confirmMove('O-O-O');
      expect(mockSpeechSynthesisUtterance).toHaveBeenCalledWith(
        'Long castle confirmed'
      );
    });

    it('should format and speak check moves', () => {
      tts.confirmMove('Qh5+');
      
      expect(mockSpeechSynthesisUtterance).toHaveBeenCalledWith(
        'Queen to h-5, check confirmed'
      );
    });

    it('should format and speak checkmate moves', () => {
      tts.confirmMove('Qh7#');
      
      expect(mockSpeechSynthesisUtterance).toHaveBeenCalledWith(
        'Queen to h-7, checkmate confirmed'
      );
    });

    it('should format and speak promotion moves', () => {
      tts.confirmMove('e8=Q');
      
      expect(mockSpeechSynthesisUtterance).toHaveBeenCalledWith(
        'Pawn to e-8, promotes to queen confirmed'
      );
    });

    it('should handle disambiguated moves', () => {
      tts.confirmMove('Nbd7');
      
      expect(mockSpeechSynthesisUtterance).toHaveBeenCalledWith(
        'Knight on b-file to d-7 confirmed'
      );
    });

    it('should not speak when disabled', () => {
      tts.setEnabled(false);
      tts.confirmMove('Nf3');
      
      expect(mockSpeechSynthesis.speak).not.toHaveBeenCalled();
    });
  });

  describe('game state announcements', () => {
    it('should announce check', () => {
      tts.announceCheck();
      
      expect(mockSpeechSynthesisUtterance).toHaveBeenCalledWith('Check!');
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    });

    it('should announce checkmate with winner', () => {
      tts.announceCheckmate('white');
      
      expect(mockSpeechSynthesisUtterance).toHaveBeenCalledWith('Checkmate! white wins!');
    });

    it('should announce stalemate', () => {
      tts.announceStalemate();
      
      expect(mockSpeechSynthesisUtterance).toHaveBeenCalledWith('Stalemate! The game is a draw.');
    });

    it('should announce errors', () => {
      tts.announceError('Invalid move');
      
      expect(mockSpeechSynthesisUtterance).toHaveBeenCalledWith('Error: Invalid move');
    });

    it('should announce illegal moves', () => {
      tts.announceIllegalMove();
      
      expect(mockSpeechSynthesisUtterance).toHaveBeenCalledWith('That move is not legal.');
    });
  });

  describe('voice configuration', () => {
    it('should cancel ongoing speech before speaking', () => {
      tts.confirmMove('Nf3');
      
      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    });

    it('should configure utterance properties', () => {
      const mockUtterance = {
        voice: null,
        rate: 0,
        pitch: 0,
        volume: 0
      };
      
      mockSpeechSynthesisUtterance.mockReturnValue(mockUtterance);
      
      tts.confirmMove('Nf3');
      
      expect(mockUtterance.rate).toBe(0.9);
      expect(mockUtterance.pitch).toBe(1.0);
      expect(mockUtterance.volume).toBe(0.8);
    });
  });

  describe('enable/disable', () => {
    it('should be enabled by default', () => {
      tts.confirmMove('Nf3');
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    });

    it('should respect enabled state', () => {
      tts.setEnabled(false);
      tts.confirmMove('Nf3');
      expect(mockSpeechSynthesis.speak).not.toHaveBeenCalled();
      
      tts.setEnabled(true);
      tts.confirmMove('Nf3');
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    });
  });
});