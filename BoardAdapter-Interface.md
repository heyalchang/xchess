# BoardAdapter Interface Design
## Isolation Layer for FEN ↔ PieceMap Conversion

**Purpose**: Encapsulate board representation conversion to enable future Phaser → DOM swaps without touching game logic.

---

## **Core Interface**

```typescript
// src/ts/Board/BoardAdapter.ts
export class BoardAdapter {
  /**
   * Convert chess.js FEN string to internal pieceMap representation
   * @param fen Standard FEN notation (e.g., "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
   * @returns 8x8 string array matching current Board.pieceMap format
   */
  static fenToPieceMap(fen: string): string[][] {
    // Parse FEN board portion (before first space)
    // Convert: 'r' → 'br', 'K' → 'wk', '8' → 8 empty strings, etc.
    // Return 8x8 array compatible with existing Phaser rendering
  }

  /**
   * Convert internal pieceMap to chess.js FEN string  
   * @param pieceMap Current Board.pieceMap (8x8 string array)
   * @param turn Current player turn ('white' | 'black')
   * @param castling Castling rights (KQkq format)
   * @param enPassant En passant target square (or '-')
   * @param halfmove Halfmove clock
   * @param fullmove Fullmove number
   * @returns Complete FEN string
   */
  static pieceMapToFEN(
    pieceMap: string[][], 
    turn: 'white' | 'black',
    castling: string = 'KQkq',
    enPassant: string = '-',
    halfmove: number = 0,
    fullmove: number = 1
  ): string {
    // Convert pieceMap to FEN board notation
    // Add metadata (turn, castling, etc.)
    // Return complete FEN string for chess.js
  }

  /**
   * Validate piece notation conversion
   * @param piece Internal piece string (e.g., 'wk', 'bp', '')
   * @returns FEN piece character or empty for conversion
   */
  static pieceToFEN(piece: string): string {
    // 'wk' → 'K', 'bp' → 'p', '' → ''
  }

  /**
   * Convert FEN piece to internal notation
   * @param fenPiece FEN piece character (e.g., 'K', 'p')  
   * @returns Internal piece string (e.g., 'wk', 'bp')
   */
  static fenToPiece(fenPiece: string): string {
    // 'K' → 'wk', 'p' → 'bp'
  }
}
```

---

## **Piece Notation Mapping**

### **Current Internal Format** (Preserve)
```typescript
// Existing Board.pieceMap format
'wk' = White King    'bk' = Black King
'wq' = White Queen   'bq' = Black Queen  
'wr' = White Rook    'br' = Black Rook
'wb' = White Bishop  'bb' = Black Bishop
'wn' = White Knight  'bn' = Black Knight
'wp' = White Pawn    'bp' = Black Pawn
''   = Empty Square
```

### **FEN Standard Format**
```typescript
// chess.js expected format
'K' = White King    'k' = Black King
'Q' = White Queen   'q' = Black Queen
'R' = White Rook    'r' = Black Rook  
'B' = White Bishop  'b' = Black Bishop
'N' = White Knight  'n' = Black Knight
'P' = White Pawn    'p' = Black Pawn
```

### **Conversion Table**
```typescript
const PIECE_TO_FEN = {
  'wk': 'K', 'bk': 'k',
  'wq': 'Q', 'bq': 'q', 
  'wr': 'R', 'br': 'r',
  'wb': 'B', 'bb': 'b',
  'wn': 'N', 'bn': 'n',
  'wp': 'P', 'bp': 'p',
  '': ''
};

const FEN_TO_PIECE = {
  'K': 'wk', 'k': 'bk',
  'Q': 'wq', 'q': 'bq',
  'R': 'wr', 'r': 'br', 
  'B': 'wb', 'b': 'bb',
  'N': 'wn', 'n': 'bn',
  'P': 'wp', 'p': 'bp'
};
```

---

## **Integration Points**

### **With ChessEngine**
```typescript
// ChessEngine uses BoardAdapter for state sync
export class ChessEngine {
  syncFromBoard(pieceMap: string[][], turn: 'white' | 'black'): void {
    const fen = BoardAdapter.pieceMapToFEN(pieceMap, turn);
    this.chess.load(fen);
  }

  syncToBoard(): string[][] {
    const fen = this.chess.fen();
    return BoardAdapter.fenToPieceMap(fen);
  }
}
```

### **With Existing Board Class**
```typescript
// Board.ts (MINIMAL CHANGES)
export class Board {
  private pieceMap: string[][];  // UNCHANGED
  private chessEngine: ChessEngine;  // NEW
  
  makeMove(fromTile: Tile, toTile: Tile): boolean {
    // Existing Phaser logic UNCHANGED
    
    // ADD: Sync with chess.js for validation
    this.chessEngine.syncFromBoard(this.pieceMap, this.currentTurn);
    const isLegal = this.chessEngine.validateMove(fromPos, toPos);
    
    if (!isLegal) return false;
    
    // Continue with existing move logic...
  }
}
```

---

## **Future Flexibility**

### **DOM Board Swap** (Phase 3+)
```typescript
// Future: BoardDomAdapter extends BoardAdapter
export class BoardDomAdapter extends BoardAdapter {
  static renderToDOM(pieceMap: string[][]): void {
    // Render using chessboard.js instead of Phaser
    // Same conversion logic, different display layer
  }
}
```

### **Alternative Representations** 
```typescript
// Future: Support different internal formats
export class BoardAdapter {
  static fenToBitboard(fen: string): bigint[];  // For high-performance AI
  static fenToArray(fen: string): number[];     // For different engines
  // Conversion logic isolated in single class
}
```

---

## **Unit Test Requirements**

```typescript
// tests/BoardAdapter.test.ts
describe('BoardAdapter', () => {
  it('converts starting position FEN to pieceMap', () => {
    const startingFEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const pieceMap = BoardAdapter.fenToPieceMap(startingFEN);
    
    expect(pieceMap[0][0]).toBe('br'); // Black rook a8
    expect(pieceMap[0][4]).toBe('bk'); // Black king e8
    expect(pieceMap[7][0]).toBe('wr'); // White rook a1
    expect(pieceMap[7][4]).toBe('wk'); // White king e1
    expect(pieceMap[4][4]).toBe('');   // Empty e4
  });

  it('converts pieceMap back to FEN accurately', () => {
    const pieceMap = createStartingPieceMap();
    const fen = BoardAdapter.pieceMapToFEN(pieceMap, 'white');
    
    expect(fen).toContain('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
    expect(fen).toContain(' w '); // White's turn
  });

  it('handles empty squares and piece conversions', () => {
    // Test various piece positions and empty squares
    // Verify bidirectional conversion accuracy
  });
});
```

---

This design isolates FEN conversion complexity while preserving all existing Phaser.js rendering code, enabling future board representation swaps without touching game logic.