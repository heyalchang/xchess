# Game Engine Abstraction Design
## Pluggable Architecture for Phaser.js → chessboard.js Swapping

**Purpose**: Abstract the game engine interface so you can easily swap between custom Phaser.js implementation and simpler chessboard.js DOM-based rendering.

---

## **Core Abstraction Strategy**

```typescript
// src/ts/Engine/GameEngine.interface.ts
export interface IGameEngine {
  // Core game state
  initialize(containerId: string): void;
  destroy(): void;
  
  // Board management
  setBoardPosition(fen: string): void;
  getBoardPosition(): string;
  
  // Move handling
  makeMove(move: string): boolean;
  getValidMoves(square?: string): string[];
  
  // Game state
  isGameOver(): boolean;
  getGameResult(): 'white' | 'black' | 'draw' | null;
  isInCheck(): boolean;
  
  // UI interaction
  enableUserInput(enabled: boolean): void;
  setOrientation(color: 'white' | 'black'): void;
  
  // Event handling
  onMove(callback: (move: string) => void): void;
  onPositionChange(callback: (fen: string) => void): void;
}
```

---

## **Engine Implementation: Phaser.js (Current)**

```typescript
// src/ts/Engine/PhaserGameEngine.ts
import { IGameEngine } from './GameEngine.interface';
import { Board } from '../Board/Board';
import { GameBus } from '../Utils/GameBus';

export class PhaserGameEngine implements IGameEngine {
  private board: Board;
  private gameBus: GameBus;
  private game: Phaser.Game;
  
  initialize(containerId: string): void {
    // Initialize existing Phaser game
    this.game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerId,
      // ... existing Phaser config
    });
    
    this.board = new Board(/* existing params */);
    this.gameBus = new GameBus();
    this.setupEventHandlers();
  }
  
  setBoardPosition(fen: string): void {
    const pieceMap = BoardAdapter.fenToPieceMap(fen);
    this.board.setPieceMap(pieceMap);
    this.board.render(); // Trigger Phaser re-render
  }
  
  getBoardPosition(): string {
    const pieceMap = this.board.getPieceMap();
    return BoardAdapter.pieceMapToFEN(pieceMap, this.board.getCurrentTurn());
  }
  
  makeMove(move: string): boolean {
    // Use existing Board.makeMove logic
    // Convert SAN to from/to coordinates if needed
    return this.board.makeMove(fromTile, toTile);
  }
  
  getValidMoves(square?: string): string[] {
    if (square) {
      // Get moves for specific piece using existing logic
      return this.board.getPiece(square)?.getPossibleMoves() || [];
    }
    // Get all legal moves for current player
    return this.board.getAllLegalMoves();
  }
  
  // Preserve all existing Phaser.js functionality
  // ... implement other interface methods
}
```

---

## **Engine Implementation: chessboard.js (Future)**

```typescript
// src/ts/Engine/ChessboardGameEngine.ts
import { IGameEngine } from './GameEngine.interface';
import { Chess } from 'chess.js';

export class ChessboardGameEngine implements IGameEngine {
  private chess: Chess;
  private board: any; // chessboard.js instance
  private containerId: string;
  private moveCallback: ((move: string) => void) | null = null;
  
  initialize(containerId: string): void {
    this.containerId = containerId;
    this.chess = new Chess();
    
    // Initialize chessboard.js
    this.board = window.Chessboard(containerId, {
      position: 'start',
      draggable: true,
      onDrop: this.handleDrop.bind(this),
      onSnapEnd: this.handleSnapEnd.bind(this)
    });
  }
  
  setBoardPosition(fen: string): void {
    this.chess.load(fen);
    this.board.position(fen);
  }
  
  getBoardPosition(): string {
    return this.chess.fen();
  }
  
  makeMove(move: string): boolean {
    const result = this.chess.move(move);
    if (result) {
      this.board.position(this.chess.fen());
      this.moveCallback?.(move);
      return true;
    }
    return false;
  }
  
  getValidMoves(square?: string): string[] {
    return this.chess.moves({ square, verbose: false });
  }
  
  isGameOver(): boolean {
    return this.chess.isGameOver();
  }
  
  getGameResult(): 'white' | 'black' | 'draw' | null {
    if (!this.isGameOver()) return null;
    if (this.chess.isCheckmate()) {
      return this.chess.turn() === 'w' ? 'black' : 'white';
    }
    return 'draw';
  }
  
  isInCheck(): boolean {
    return this.chess.inCheck();
  }
  
  enableUserInput(enabled: boolean): void {
    // chessboard.js doesn't have direct disable, but we can control onDrop
    this.board.draggable = enabled;
  }
  
  setOrientation(color: 'white' | 'black'): void {
    this.board.orientation(color);
  }
  
  onMove(callback: (move: string) => void): void {
    this.moveCallback = callback;
  }
  
  onPositionChange(callback: (fen: string) => void): void {
    // chessboard.js doesn't have direct position change events
    // Could be implemented with polling or wrapper
  }
  
  private handleDrop(source: string, target: string): 'snapback' | undefined {
    const move = this.chess.move({ from: source, to: target, promotion: 'q' });
    
    if (move === null) return 'snapback';
    
    this.moveCallback?.(move.san);
    return undefined;
  }
  
  private handleSnapEnd(): void {
    this.board.position(this.chess.fen());
  }
  
  destroy(): void {
    this.board.destroy();
  }
}
```

---

## **Engine Factory Pattern**

```typescript
// src/ts/Engine/GameEngineFactory.ts
import { IGameEngine } from './GameEngine.interface';
import { PhaserGameEngine } from './PhaserGameEngine';
import { ChessboardGameEngine } from './ChessboardGameEngine';

export enum EngineType {
  PHASER = 'phaser',
  CHESSBOARD = 'chessboard'
}

export class GameEngineFactory {
  static create(type: EngineType): IGameEngine {
    switch (type) {
      case EngineType.PHASER:
        return new PhaserGameEngine();
      case EngineType.CHESSBOARD:
        return new ChessboardGameEngine();
      default:
        throw new Error(`Unknown engine type: ${type}`);
    }
  }
  
  static createFromConfig(): IGameEngine {
    // Read from environment, localStorage, or config file
    const engineType = process.env.CHESS_ENGINE || 'phaser';
    return this.create(engineType as EngineType);
  }
}
```

---

## **Updated Game Controller**

```typescript
// src/ts/GameController.ts (NEW FILE)
import { IGameEngine } from './Engine/GameEngine.interface';
import { GameEngineFactory, EngineType } from './Engine/GameEngineFactory';
import { GameBus } from './Utils/GameBus';

export class GameController {
  private engine: IGameEngine;
  private gameBus: GameBus;
  
  constructor(engineType: EngineType = EngineType.PHASER) {
    this.engine = GameEngineFactory.create(engineType);
    this.gameBus = new GameBus();
    this.setupEngineIntegration();
  }
  
  initialize(containerId: string): void {
    this.engine.initialize(containerId);
  }
  
  switchEngine(newEngineType: EngineType): void {
    const currentFEN = this.engine.getBoardPosition();
    
    this.engine.destroy();
    this.engine = GameEngineFactory.create(newEngineType);
    this.engine.initialize(this.getContainerId());
    this.engine.setBoardPosition(currentFEN);
    
    this.setupEngineIntegration();
  }
  
  private setupEngineIntegration(): void {
    this.engine.onMove((move: string) => {
      this.gameBus.emit('move', {
        san: move,
        fen: this.engine.getBoardPosition()
      });
    });
    
    // Integrate with existing GameBus events
    this.gameBus.on('move', (data) => {
      // Engine already processed the move, just update state
      this.updateGameState();
    });
  }
  
  // Delegate common operations to current engine
  makeMove(move: string): boolean {
    return this.engine.makeMove(move);
  }
  
  getValidMoves(square?: string): string[] {
    return this.engine.getValidMoves(square);
  }
  
  getBoardPosition(): string {
    return this.engine.getBoardPosition();
  }
  
  // Add methods for AI, voice integration, etc.
}
```

---

## **Configuration & Runtime Switching**

```typescript
// src/ts/config.ts
export interface GameConfig {
  engine: 'phaser' | 'chessboard';
  enableVoice: boolean;
  enableAI: boolean;
  aiDifficulty: number;
}

export const defaultConfig: GameConfig = {
  engine: 'phaser',
  enableVoice: false,
  enableAI: true,
  aiDifficulty: 3
};

// Runtime engine switching
export class ConfigManager {
  static switchToSimpleMode(): void {
    const controller = GameController.getInstance();
    controller.switchEngine(EngineType.CHESSBOARD);
    
    // Hide complex UI elements
    // Show simplified controls
  }
  
  static switchToAdvancedMode(): void {
    const controller = GameController.getInstance();
    controller.switchEngine(EngineType.PHASER);
    
    // Show full Phaser UI
    // Enable advanced features
  }
}
```

---

## **Updated BoardAdapter (Engine Agnostic)**

```typescript
// src/ts/Board/BoardAdapter.ts (UPDATED)
export class BoardAdapter {
  // Keep existing FEN conversion methods
  
  /**
   * Engine-agnostic position setting
   * Works with both Phaser pieceMap and chessboard.js
   */
  static setEnginePosition(engine: IGameEngine, position: string[][] | string): void {
    if (typeof position === 'string') {
      // Already FEN format
      engine.setBoardPosition(position);
    } else {
      // Convert pieceMap to FEN
      const fen = this.pieceMapToFEN(position, 'white'); // TODO: get actual turn
      engine.setBoardPosition(fen);
    }
  }
  
  /**
   * Get position in requested format
   */
  static getEnginePosition(engine: IGameEngine, format: 'fen' | 'pieceMap'): string | string[][] {
    const fen = engine.getBoardPosition();
    
    if (format === 'fen') {
      return fen;
    } else {
      return this.fenToPieceMap(fen);
    }
  }
}
```

---

## **Benefits of This Abstraction**

### **Development Flexibility**
- **Rapid Prototyping**: Use chessboard.js for quick feature testing
- **Performance Testing**: Compare Phaser vs DOM rendering performance  
- **Accessibility**: DOM-based engine easier for screen readers
- **Mobile Optimization**: Different engines for different devices

### **Feature Isolation**
- **Voice Integration**: Works with any engine through common interface
- **AI Integration**: Engine-agnostic chess.js validation
- **Socket.IO**: Same multiplayer code works with both engines
- **Testing**: Mock engine for unit tests

### **User Experience**
- **Settings Toggle**: "Simple Mode" vs "Advanced Mode"
- **Performance Adaptive**: Auto-switch based on device capabilities
- **Learning Curve**: Start with simple, upgrade to advanced

### **Future Extensions**
```typescript
// Future engines could include:
- ThreeJSGameEngine (3D chess)
- TerminalGameEngine (ASCII chess)
- VRGameEngine (VR chess)
- MobileGameEngine (touch-optimized)
```

---

## **Implementation Priority**

1. **Phase 1**: Create interface, implement PhaserGameEngine wrapper around existing code
2. **Phase 1.5**: Add GameController with engine switching capability  
3. **Phase 2**: Implement ChessboardGameEngine as alternative
4. **Phase 3**: Add runtime switching and configuration management

This abstraction preserves all your existing Phaser.js work while enabling easy experimentation with simpler alternatives like chessboard.js.