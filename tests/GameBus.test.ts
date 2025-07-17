import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameBus } from '../src/ts/Utils/GameBus';

describe('GameBus', () => {
  let gameBus: GameBus;

  beforeEach(() => {
    gameBus = GameBus.getInstance();
    // Clear all listeners before each test
    gameBus.off('move');
    gameBus.off('turn');
    gameBus.off('state');
  });

  it('should be a singleton', () => {
    const instance1 = GameBus.getInstance();
    const instance2 = GameBus.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should emit and receive move events', () => {
    const mockCallback = vi.fn();
    gameBus.onMove(mockCallback);
    
    gameBus.emitMove('e4', 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1', 'e2', 'e4');
    
    expect(mockCallback).toHaveBeenCalledWith({
      san: 'e4',
      fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1',
      from: 'e2',
      to: 'e4'
    });
  });

  it('should emit and receive turn events', () => {
    const mockCallback = vi.fn();
    gameBus.onTurn(mockCallback);
    
    gameBus.emitTurn('white');
    
    expect(mockCallback).toHaveBeenCalledWith({
      player: 'white'
    });
  });

  it('should emit and receive state events', () => {
    const mockCallback = vi.fn();
    gameBus.onState(mockCallback);
    
    gameBus.emitState(
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      'white',
      0,
      false,
      false
    );
    
    expect(mockCallback).toHaveBeenCalledWith({
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      turn: 'white',
      moveCount: 0,
      inCheck: false,
      gameOver: false
    });
  });

  it('should support multiple listeners for the same event', () => {
    const mockCallback1 = vi.fn();
    const mockCallback2 = vi.fn();
    
    gameBus.onMove(mockCallback1);
    gameBus.onMove(mockCallback2);
    
    gameBus.emitMove('e4', 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1', 'e2', 'e4');
    
    expect(mockCallback1).toHaveBeenCalled();
    expect(mockCallback2).toHaveBeenCalled();
  });
});