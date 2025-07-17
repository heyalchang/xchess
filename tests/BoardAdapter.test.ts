import { describe, it, expect } from 'vitest';
import { BoardAdapter } from '../src/ts/BoardAdapter';

describe('BoardAdapter', () => {
  const startingPieceMap = [
    ['br', 'bn', 'bb', 'bq', 'bk', 'bb', 'bn', 'br'],
    ['bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp'],
    ['  ', '  ', '  ', '  ', '  ', '  ', '  ', '  '],
    ['  ', '  ', '  ', '  ', '  ', '  ', '  ', '  '],
    ['  ', '  ', '  ', '  ', '  ', '  ', '  ', '  '],
    ['  ', '  ', '  ', '  ', '  ', '  ', '  ', '  '],
    ['wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp'],
    ['wr', 'wn', 'wb', 'wq', 'wk', 'wb', 'wn', 'wr']
  ];

  const startingFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';

  it('should convert piece map to FEN correctly', () => {
    const fen = BoardAdapter.pieceMapToFen(startingPieceMap);
    expect(fen).toBe(startingFen);
  });

  it('should convert FEN to piece map correctly', () => {
    const pieceMap = BoardAdapter.fenToPieceMap(startingFen);
    expect(pieceMap).toEqual(startingPieceMap);
  });

  it('should handle empty squares in FEN', () => {
    const testFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR';
    const pieceMap = BoardAdapter.fenToPieceMap(testFen);
    expect(pieceMap[4][4]).toBe('wp'); // e4 should have white pawn
    expect(pieceMap[6][4]).toBe('  '); // e2 should be empty
  });

  it('should convert coordinates to chess squares', () => {
    expect(BoardAdapter.coordinateToSquare(0, 0)).toBe('a8');
    expect(BoardAdapter.coordinateToSquare(7, 7)).toBe('h1');
    expect(BoardAdapter.coordinateToSquare(4, 4)).toBe('e4');
  });

  it('should convert chess squares to coordinates', () => {
    expect(BoardAdapter.squareToCoordinate('a8')).toEqual({ tileX: 0, tileY: 0 });
    expect(BoardAdapter.squareToCoordinate('h1')).toEqual({ tileX: 7, tileY: 7 });
    expect(BoardAdapter.squareToCoordinate('e4')).toEqual({ tileX: 4, tileY: 4 });
  });

  it('should build full FEN with game state', () => {
    const fullFen = BoardAdapter.buildFullFen(startingPieceMap, 'w', 'KQkq', '-', 0, 1);
    expect(fullFen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  });

  it('should round-trip conversion (pieceMap -> FEN -> pieceMap)', () => {
    const originalMap = startingPieceMap;
    const fen = BoardAdapter.pieceMapToFen(originalMap);
    const convertedMap = BoardAdapter.fenToPieceMap(fen);
    expect(convertedMap).toEqual(originalMap);
  });
});