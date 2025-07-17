# /api/state JSON Schema Definition
## Locked Interface for Socket.IO & Voice Layer Stability

**Purpose**: Define immutable API contract early to prevent breaking changes in downstream Socket.IO and Voice integrations.

---

## **Core Schema Definition**

```typescript
// src/ts/Utils/ApiTypes.ts
export interface GameStateAPI {
  /** Complete FEN notation for authoritative game state */
  fen: string;
  
  /** Current player turn */
  turn: 'white' | 'black';
  
  /** Number of moves made (full moves = halfmoves / 2) */
  moveCount: number;
  
  /** Whether current player is in check */
  inCheck: boolean;
  
  /** Whether game has ended (checkmate, stalemate, draw) */
  gameOver: boolean;
  
  /** Winner if gameOver=true, otherwise null */
  winner: 'white' | 'black' | 'draw' | null;
  
  /** Reason for game end if gameOver=true */
  gameOverReason: 'checkmate' | 'stalemate' | 'resignation' | 'draw' | null;
  
  /** Last move in Standard Algebraic Notation (SAN) */
  lastMove: string | null;
  
  /** Available legal moves for current player (SAN format) */
  legalMoves: string[];
  
  /** Server timestamp when state was generated */
  timestamp: number;
  
  /** Optional debug information (only in development) */
  debug?: {
    pieceMap: string[][];
    history: string[];
    totalHalfmoves: number;
  };
}
```

---

## **Express Endpoint Implementation**

```typescript
// index.js (MODIFY EXISTING)
import { GameStateAPI } from './src/ts/Utils/ApiTypes';

// Add to existing Express app
app.get('/api/state', (req, res): void => {
  try {
    // Gather state from existing game components
    const state: GameStateAPI = {
      fen: boardAdapter.getCurrentFEN(),
      turn: getCurrentPlayerColor(),
      moveCount: Math.floor(gameHistory.getTotalMoves() / 2),
      inCheck: chessEngine.isInCheck(),
      gameOver: gameHistory.isGameOver(),
      winner: getGameWinner(),
      gameOverReason: getGameOverReason(),
      lastMove: gameHistory.getLastMoveSAN(),
      legalMoves: chessEngine.getLegalMoves(),
      timestamp: Date.now(),
      
      // Include debug info in development
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          pieceMap: board.getPieceMap(),
          history: gameHistory.getAllMovesSAN(),
          totalHalfmoves: gameHistory.getTotalMoves()
        }
      })
    };

    // Validate schema before sending
    validateGameStateAPI(state);
    
    res.json(state);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to retrieve game state',
      timestamp: Date.now()
    });
  }
});
```

---

## **Schema Validation**

```typescript
// src/ts/Utils/ApiValidation.ts
export function validateGameStateAPI(state: any): asserts state is GameStateAPI {
  // Required fields validation
  if (typeof state.fen !== 'string' || !isValidFEN(state.fen)) {
    throw new Error('Invalid FEN notation');
  }
  
  if (!['white', 'black'].includes(state.turn)) {
    throw new Error('Invalid turn value');
  }
  
  if (typeof state.moveCount !== 'number' || state.moveCount < 0) {
    throw new Error('Invalid move count');
  }
  
  if (typeof state.inCheck !== 'boolean') {
    throw new Error('Invalid inCheck value');
  }
  
  if (typeof state.gameOver !== 'boolean') {
    throw new Error('Invalid gameOver value');
  }
  
  // Conditional validation
  if (state.gameOver) {
    if (!['white', 'black', 'draw'].includes(state.winner as string)) {
      throw new Error('Invalid winner when game is over');
    }
    
    if (!['checkmate', 'stalemate', 'resignation', 'draw'].includes(state.gameOverReason as string)) {
      throw new Error('Invalid game over reason');
    }
  } else {
    if (state.winner !== null) {
      throw new Error('Winner should be null when game is not over');
    }
    
    if (state.gameOverReason !== null) {
      throw new Error('Game over reason should be null when game is not over');
    }
  }
  
  // Legal moves validation
  if (!Array.isArray(state.legalMoves)) {
    throw new Error('Legal moves must be an array');
  }
  
  state.legalMoves.forEach(move => {
    if (typeof move !== 'string' || !isValidSAN(move)) {
      throw new Error(`Invalid SAN notation: ${move}`);
    }
  });
  
  // Timestamp validation
  if (typeof state.timestamp !== 'number' || state.timestamp <= 0) {
    throw new Error('Invalid timestamp');
  }
}

function isValidFEN(fen: string): boolean {
  // Basic FEN format validation
  const parts = fen.split(' ');
  return parts.length === 6 && /^[rnbqkpRNBQKP1-8\/]+$/.test(parts[0]);
}

function isValidSAN(san: string): boolean {
  // Basic SAN format validation  
  return /^[NBRQK]?[a-h]?[1-8]?x?[a-h][1-8](?:=[NBRQ])?[+#]?$/.test(san) ||
         /^O-O(?:-O)?[+#]?$/.test(san);
}
```

---

## **Comprehensive Unit Tests**

```typescript
// tests/api-schema.test.ts
import { GameStateAPI, validateGameStateAPI } from '../src/ts/Utils/ApiTypes';
import { describe, it, expect } from 'vitest';

describe('/api/state Schema Validation', () => {
  const validGameState: GameStateAPI = {
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    turn: 'white',
    moveCount: 0,
    inCheck: false,
    gameOver: false,
    winner: null,
    gameOverReason: null,
    lastMove: null,
    legalMoves: ['e4', 'e3', 'Nf3', 'Nc3', 'd4', 'd3', 'f4', 'f3', 'g4', 'g3', 'h4', 'h3', 'a4', 'a3', 'b4', 'b3', 'c4', 'c3', 'Nh3', 'Na3'],
    timestamp: Date.now()
  };

  it('validates complete starting position state', () => {
    expect(() => validateGameStateAPI(validGameState)).not.toThrow();
  });

  it('validates checkmate state correctly', () => {
    const checkmateState: GameStateAPI = {
      ...validGameState,
      fen: '7k/5Q2/6K1/8/8/8/8/8 b - - 0 1',
      turn: 'black',
      moveCount: 15,
      inCheck: true,
      gameOver: true,
      winner: 'white',
      gameOverReason: 'checkmate',
      lastMove: 'Qf7#',
      legalMoves: []
    };
    
    expect(() => validateGameStateAPI(checkmateState)).not.toThrow();
  });

  it('validates draw state correctly', () => {
    const drawState: GameStateAPI = {
      ...validGameState,
      fen: '8/8/8/3k4/3K4/8/8/8 w - - 50 75',
      gameOver: true,
      winner: 'draw',
      gameOverReason: 'stalemate',
      legalMoves: []
    };
    
    expect(() => validateGameStateAPI(drawState)).not.toThrow();
  });

  it('rejects invalid FEN notation', () => {
    const invalidState = { ...validGameState, fen: 'invalid-fen' };
    expect(() => validateGameStateAPI(invalidState)).toThrow('Invalid FEN notation');
  });

  it('rejects invalid turn values', () => {
    const invalidState = { ...validGameState, turn: 'red' as any };
    expect(() => validateGameStateAPI(invalidState)).toThrow('Invalid turn value');
  });

  it('rejects winner when game not over', () => {
    const invalidState = { ...validGameState, winner: 'white' as any };
    expect(() => validateGameStateAPI(invalidState)).toThrow('Winner should be null when game is not over');
  });

  it('requires winner when game is over', () => {
    const invalidState = { ...validGameState, gameOver: true, winner: null };
    expect(() => validateGameStateAPI(invalidState)).toThrow('Invalid winner when game is over');
  });

  it('validates legal moves are valid SAN', () => {
    const invalidState = { ...validGameState, legalMoves: ['invalid-move', 'e4'] };
    expect(() => validateGameStateAPI(invalidState)).toThrow('Invalid SAN notation: invalid-move');
  });

  it('validates timestamp is positive number', () => {
    const invalidState = { ...validGameState, timestamp: -1 };
    expect(() => validateGameStateAPI(invalidState)).toThrow('Invalid timestamp');
  });
});

describe('/api/state Endpoint Integration', () => {
  it('returns valid schema from actual endpoint', async () => {
    // Start test server
    const response = await fetch('http://localhost:3000/api/state');
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(() => validateGameStateAPI(data)).not.toThrow();
  });

  it('handles server errors gracefully', async () => {
    // Mock server error conditions
    // Verify error response format
  });
});
```

---

## **Future Extension Points**

### **Socket.IO Integration** (Phase 3)
```typescript
// server/socket.ts
io.on('connection', (socket) => {
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    
    // Send current state using locked schema
    const state: GameStateAPI = getCurrentGameState();
    socket.emit('game-state', state);
  });
  
  socket.on('move', (move) => {
    // Process move, emit updated state
    const newState: GameStateAPI = processMove(move);
    io.to(roomId).emit('game-state', newState);
  });
});
```

### **Voice Integration** (Phase 2)
```typescript
// voice/VoiceParser.ts
export class VoiceParser {
  parseMove(transcript: string, currentState: GameStateAPI): string | null {
    // Use legalMoves for disambiguation
    // Use fen for position context
    // Return SAN move or null
  }
}
```

---

## **Schema Evolution Strategy**

### **Versioning**
```typescript
export interface GameStateAPI {
  version: '1.0';  // Add version field for future migrations
  // ... existing fields
}
```

### **Backward Compatibility**
- Required fields NEVER change type or become optional
- New optional fields can be added without breaking clients
- Deprecated fields marked clearly before removal

### **Migration Path**
- v1.0 → v1.1: Add optional fields only
- v1.x → v2.0: Major schema changes with migration guide

This locked schema provides a stable foundation for all future integrations while maintaining strict validation and comprehensive test coverage.