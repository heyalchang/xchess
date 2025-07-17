# Phase 1 Adjusted Implementation Plan
## Bridging Current Chess Game → PRD Foundation

**Status**: Current base has complete chess gameplay. Phase 1 focuses on architectural alignment for voice/multiplayer readiness.

---

## **Implementation Strategy: Incremental Enhancement**

Preserve the solid Phaser.js foundation while adding PRD-required architecture patterns.

### **Phase 1A: Dependencies & Core Integrations** 
*Estimated: 1-2 days*

#### Task 1A.1: Install Required Dependencies
```bash
npm install chess.js tiny-emitter vitest @vitest/ui
npm install -D @types/node
```

#### Task 1A.2: Add Chess.js Integration (Keep Existing Structure)
```typescript
// src/ts/Board/ChessEngine.ts (NEW FILE)
import { Chess } from 'chess.js';

export class ChessEngine {
  private chess = new Chess();
  
  validateMove(from: string, to: string): boolean;
  getFEN(): string;
  makeMove(san: string): boolean;
  getLegalMoves(): string[];
}
```

#### Task 1A.3: BoardAdapter for FEN Conversion (Keep Phaser Separate)
```typescript
// src/ts/Board/BoardAdapter.ts (NEW FILE)
export class BoardAdapter {
  // Isolate FEN ↔ pieceMap conversion logic
  static fenToPieceMap(fen: string): string[][];
  static pieceMapToFEN(pieceMap: string[][]): string;
  // Future: swap Phaser → DOM without touching other code
}
```

*DEFER: Directory restructuring until chess.js integration is stable*

---

### **Phase 1B: Minimal GameBus (3 Events Only)**
*Estimated: 1-2 days*

#### Task 1B.1: Implement Minimal GameBus
```typescript
// src/ts/Utils/GameBus.ts (NEW FILE)
import { EventEmitter } from 'tiny-emitter';

export interface Phase1Events {
  'move': { san: string, fen: string };
  'turn': { player: 'white' | 'black' };  
  'state': { fen: string, turn: string, moveCount: number };
}

export class GameBus extends EventEmitter<Phase1Events> {
  // ONLY the 3 events Phase 1 needs
  // Add more events later as needed
}
```

#### Task 1B.2: Refactor Board Class
- Emit events instead of direct method calls
- Subscribe to move events from UI
- Maintain existing piece management logic

#### Task 1B.3: Refactor Player/Enemy Classes  
- Subscribe to turn events from GameBus
- Emit move events instead of direct board manipulation
- Preserve existing AI decision logic

---

### **Phase 1C: Chess.js Integration**
*Estimated: 2-3 days*

#### Task 1C.1: Create ChessEngine Wrapper
```typescript
// shared/ChessEngine.ts
import { Chess } from 'chess.js';

export class ChessEngine {
  private chess = new Chess();
  
  validateMove(from: string, to: string): boolean {
    // Delegate to chess.js
  }
  
  getFEN(): string {
    return this.chess.fen();
  }
  
  // Bridge between chess.js and current piece logic
}
```

#### Task 1C.2: Integrate with Board Class
- Replace custom validation with ChessEngine calls
- Maintain existing piece positioning logic
- Convert between internal pieceMap and FEN notation

#### Task 1C.3: Preserve Rendering Logic
- Keep current Piece classes for Phaser.js rendering
- Move validation logic to ChessEngine
- Maintain sprite handling and animations

---

### **Phase 1D: API Schema & Testing First**
*Estimated: 1 day*

#### Task 1D.1: Lock JSON Schema for /api/state
```typescript
// src/ts/Utils/ApiTypes.ts (NEW FILE)
export interface GameStateAPI {
  fen: string;
  turn: 'white' | 'black';
  moveCount: number;
  inCheck: boolean;
  gameOver: boolean;
  lastMove?: string;
  timestamp: number;
}
```

#### Task 1D.2: Express API Route (Keep Simple)
```typescript
// index.js (MODIFY EXISTING)
app.get('/api/state', (req, res) => {
  const state: GameStateAPI = {
    fen: boardAdapter.getFEN(),
    turn: currentPlayer === 'white' ? 'white' : 'black',
    moveCount: gameHistory.moves.length,
    inCheck: chessEngine.inCheck(),
    gameOver: gameHistory.isGameOver(),
    lastMove: gameHistory.getLastMove(),
    timestamp: Date.now()
  };
  res.json(state);
});
```

#### Task 1D.3: Unit Test the API Schema
```typescript
// tests/api.test.ts (NEW FILE)
import { GameStateAPI } from '../src/ts/Utils/ApiTypes';

describe('/api/state endpoint', () => {
  it('returns valid GameStateAPI schema', () => {
    // Test all required fields present
    // Validate FEN format  
    // Ensure consistent timestamps
  });
});
```

#### Task 1D.3: Development Scripts
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:client\" \"npm run dev:server\"",
    "dev:client": "cd client && vite",
    "dev:server": "cd server && npm run dev",
    "build": "npm run build:client && npm run build:server",
    "test": "vitest"
  }
}
```

---

### **Phase 1E: Focused Testing (API + Integrations)**
*Estimated: 1 day*

#### Task 1E.1: Vitest Setup (Minimal)
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Focus on NEW code only initially
    include: ['tests/**/*.test.ts'],
    coverage: {
      include: ['src/ts/Board/ChessEngine.ts', 'src/ts/Board/BoardAdapter.ts', 'src/ts/Utils/GameBus.ts']
    }
  }
});
```

#### Task 1E.2: Priority Tests Only
- **API Schema**: `/api/state` returns valid GameStateAPI
- **BoardAdapter**: FEN ↔ pieceMap conversion accuracy  
- **ChessEngine**: chess.js integration points
- **GameBus**: 3 core events emit/receive correctly

*DEFER: Full game logic testing until integrations stable*

---

## **Acceptance Criteria**

### **Phase 1 Complete When:**
1. ✅ `npm run dev` shows working chessboard (preserved functionality)
2. ✅ Drag/drop pieces work with chess.js validation
3. ✅ `curl localhost:3000/api/state` returns valid FEN
4. ✅ GameBus events coordinate all game actions
5. ✅ `npm test` passes with ≥80% coverage
6. ✅ Illegal moves rejected by chess.js (not custom logic)

### **Preserved from Current Implementation:**
- All piece sprites and animations
- Complete Phaser.js rendering pipeline
- Undo/redo functionality (GameHistory)
- Turn-based gameplay
- Basic AI opponent
- Visual feedback and UI interactions

---

## **Risk Mitigation**

### **Low Risk Tasks** (Do First)
- Directory restructuring and file moves
- Dependency installation
- Vite configuration setup

### **Medium Risk Tasks** (Incremental)
- GameBus integration (test each class separately)
- Chess.js validation (parallel to existing validation initially)

### **Integration Points** (Test Thoroughly)
- FEN ↔ pieceMap conversion
- Event sequencing in GameBus
- Phaser.js scene updates via events

---

This plan preserves the solid foundation while systematically adding PRD requirements. Each phase builds incrementally without breaking existing functionality.