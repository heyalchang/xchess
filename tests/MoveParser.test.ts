import { describe, it, expect, beforeEach } from 'vitest';
import { MoveParser, ParseContext } from '../src/ts/voice/MoveParser';

describe('MoveParser', () => {
  let parser: MoveParser;
  let context: ParseContext;

  beforeEach(() => {
    parser = new MoveParser();
    context = {
      currentFEN: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      legalMoves: ['e4', 'e3', 'Nf3', 'Nc3', 'd4', 'd3', 'Nh3', 'Na3', 'f4', 'f3', 'g4', 'g3', 'h4', 'h3', 'a4', 'a3', 'b4', 'b3', 'c4', 'c3'],
      playerColor: 'white'
    };
  });

  describe('cleanTranscript', () => {
    it('should handle homophones correctly', () => {
      expect(parser.cleanTranscript('night to f three')).toBe('knight 2 f 3');
      expect(parser.cleanTranscript('won two three')).toBe('1 2 3');
      expect(parser.cleanTranscript('for ate')).toBe('4 8');
    });

    it('should remove filler words', () => {
      expect(parser.cleanTranscript('move the knight to f3')).toBe('knight 2 f3');
      expect(parser.cleanTranscript('pawn goes to e4')).toBe('pawn 2 e4');
    });

    it('should handle punctuation and capitalization', () => {
      expect(parser.cleanTranscript('Knight to F3!')).toBe('knight 2 f3');
      expect(parser.cleanTranscript('Queen, takes e5?')).toBe('queen takes e 5');
    });
  });

  describe('parseMove', () => {
    it('should parse standard piece moves', () => {
      const result = parser.parseMove('knight to f3', context);
      expect(result.san).toBe('Nf3');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should parse pawn moves', () => {
      const result = parser.parseMove('e4', context);
      expect(result.san).toBe('e4');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should handle homophones in moves', () => {
      const result = parser.parseMove('night to f three', context);
      expect(result.san).toBe('Nf3');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should parse capture moves', () => {
      const captureContext = {
        ...context,
        legalMoves: ['exd5', 'Nxd5', 'Qxd5']
      };
      const result = parser.parseMove('pawn takes d5', captureContext);
      expect(result.san).toBe('exd5');
    });

    it('should handle castling', () => {
      const castleContext = {
        ...context,
        legalMoves: ['O-O', 'O-O-O', 'e4', 'e3']
      };
      
      let result = parser.parseMove('castle short', castleContext);
      expect(result.san).toBe('O-O');
      
      result = parser.parseMove('castle king side', castleContext);
      expect(result.san).toBe('O-O');
      
      result = parser.parseMove('castle long', castleContext);
      expect(result.san).toBe('O-O-O');
      
      result = parser.parseMove('castle queen side', castleContext);
      expect(result.san).toBe('O-O-O');
    });

    it('should handle check notation', () => {
      const checkContext = {
        ...context,
        legalMoves: ['Qh5+', 'Qh4+', 'Bb5+']
      };
      
      const result = parser.parseMove('queen to h5 check', checkContext);
      expect(result.san).toBe('Qh5+');
    });

    it('should return null for unparseable moves', () => {
      const result = parser.parseMove('gibberish nonsense', context);
      expect(result.san).toBeNull();
      expect(result.error).toBeDefined();
    });

    it('should use context for disambiguation', () => {
      const ambiguousContext = {
        ...context,
        legalMoves: ['Nf3', 'Nh3', 'Nc3', 'Na3']
      };
      
      const result = parser.parseMove('knight to f3', ambiguousContext);
      expect(result.san).toBe('Nf3');
    });
  });

  describe('parseWithContext', () => {
    it('should find unique legal moves to a square', () => {
      const uniqueContext = {
        ...context,
        legalMoves: ['Nf3', 'e4', 'd4']
      };
      
      const result = parser.parseMove('f3', uniqueContext);
      expect(result.san).toBe('Nf3');
    });

    it('should disambiguate when multiple pieces can move to same square', () => {
      const ambiguousContext = {
        ...context,
        legalMoves: ['Nf3', 'Bf3', 'e4']
      };
      
      const result = parser.parseMove('knight f3', ambiguousContext);
      expect(result.san).toBe('Nf3');
    });
  });

  describe('edge cases', () => {
    it('should handle empty input', () => {
      const result = parser.parseMove('', context);
      expect(result.san).toBeNull();
    });

    it('should handle very long input', () => {
      const longInput = 'please move the knight piece to the f3 square on the board';
      const result = parser.parseMove(longInput, context);
      expect(result.san).toBe('Nf3');
    });

    it('should handle mixed case and spacing', () => {
      const result = parser.parseMove('  KNIGHT    TO    F3  ', context);
      expect(result.san).toBe('Nf3');
    });
  });
});