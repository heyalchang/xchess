import { describe, it, expect, beforeEach } from 'vitest';
import { ChessEngine } from '../src/ts/ChessEngine';

describe('ChessEngine', () => {
  let engine: ChessEngine;

  beforeEach(() => {
    engine = new ChessEngine();
  });

  it('should initialize with default starting position', () => {
    const fen = engine.getFen();
    expect(fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  });

  it('should validate valid moves', () => {
    expect(engine.isValidMove('e2', 'e4')).toBe(true);
    expect(engine.isValidMove('e2', 'e3')).toBe(true);
  });

  it('should reject invalid moves', () => {
    expect(engine.isValidMove('e2', 'e5')).toBe(false);
    expect(engine.isValidMove('e1', 'e8')).toBe(false);
  });

  it('should make valid moves', () => {
    const move = engine.makeMove('e2', 'e4');
    expect(move).not.toBeNull();
    expect(move?.from).toBe('e2');
    expect(move?.to).toBe('e4');
  });

  it('should not make invalid moves', () => {
    const move = engine.makeMove('e2', 'e5');
    expect(move).toBeNull();
  });

  it('should detect check correctly', () => {
    // Set up a simple check position
    engine.loadFen('rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKB1R w KQkq - 0 2');
    engine.makeMove('d1', 'h5'); // Queen attacks f7
    engine.makeMove('g8', 'f6'); // Knight blocks
    engine.makeMove('h5', 'f7'); // Queen takes f7, putting king in check
    
    expect(engine.isCheck()).toBe(true);
  });

  it('should get possible moves for a piece', () => {
    const moves = engine.getPossibleMoves('e2');
    expect(moves).toContain('e3');
    expect(moves).toContain('e4');
    expect(moves).toHaveLength(2);
  });

  it('should track game history', () => {
    engine.makeMove('e2', 'e4');
    engine.makeMove('e7', 'e5');
    
    const history = engine.getHistory();
    expect(history).toHaveLength(2);
    expect(history[0]).toBe('e4');
    expect(history[1]).toBe('e5');
  });

  it('should handle undo moves', () => {
    engine.makeMove('e2', 'e4');
    engine.makeMove('e7', 'e5');
    
    const undoMove = engine.undoMove();
    expect(undoMove).not.toBeNull();
    expect(undoMove?.from).toBe('e7');
    expect(undoMove?.to).toBe('e5');
    
    const history = engine.getHistory();
    expect(history).toHaveLength(1);
  });
});