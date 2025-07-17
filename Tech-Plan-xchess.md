I tried to patch the PRD by inserting a bullet that explicitly states we’ll use the ElevenLabs Conversational-AI streaming WebSocket endpoint. The update failed because the exact header text in the canvas doesn’t match the pattern I targeted.

No content was lost—the document is unchanged.
I’ll scan the current headings and add the streaming note using a more generic match on the next edit.

⸻

Technical plan (UPDATED - handoff for Claude Code, Phase 1)

**STATUS UPDATE**: Base chess game from https://github.com/AfonsoCFonseca/Chess-Game.git is MORE COMPLETE than expected. Phase 1 now focuses on architectural bridging rather than building from scratch.

## ADJUSTED APPROACH: Incremental Enhancement

Preserve the solid Phaser.js foundation while adding PRD architecture patterns.

### Current Assets to Preserve ✅
- Complete Phaser.js chess game with all pieces
- TypeScript implementation with piece movement logic
- Express.js server foundation
- All sprite assets and UI interactions
- Undo/redo functionality (GameHistory class)
- Basic AI opponent

### Architecture Bridge Plan

**Phase 1A: Dependencies & Core Integrations (KEEP EXISTING STRUCTURE)**
```bash
# Install essential dependencies only
npm install chess.js tiny-emitter vitest @vitest/ui
npm install -D @types/node

# NO directory moves yet - keep src/ts/* structure
# Add new files: ChessEngine.ts, BoardAdapter.ts, GameBus.ts
```

**Phase 1B: Minimal GameBus (3 Events)**
- Add GameBus with ONLY 3 events: `move`, `turn`, `state`
- Retrofit existing Board/Player/Enemy classes with minimal events
- Preserve all existing game logic and method calls

**Phase 1C: Chess.js + BoardAdapter Bridge**  
- ChessEngine wrapper isolates chess.js integration
- BoardAdapter isolates FEN ↔ pieceMap conversion  
- Keep ALL existing Piece classes unchanged for Phaser.js
- Test integrations before any structural changes

**Phase 1D: API Schema + Testing First**
- Lock GameStateAPI interface with comprehensive schema
- Add single `/api/state` endpoint to existing index.js
- Unit test API schema compliance BEFORE other changes

**Phase 1E: Focused Testing (New Code Only)**
- Vitest setup targeting NEW integration files only
- Test: API schema, BoardAdapter, ChessEngine, GameBus
- DEFER full game logic testing until architecture stable

### Updated Task Breakdown

Order	Agent task	Key changes from original plan
#1	Structure migration – Preserve existing chess game, add new directories	Migrate src/ts/* → client/src/
#2	Integrate chess.js – Wrap existing validation with chess.js authority	ChessEngine.ts wrapper class
#3	GameBus retrofit – Add events to existing Board/Player/Enemy classes	Preserve existing logic, add pub/sub
#4	Preserve Phaser renderer – Keep existing board/piece rendering intact	No changes to Phaser.js implementation
#5	Express API – Add /api/state endpoint to existing server	Minimal changes to index.js
#6	Vite migration – Replace webpack.config.js with vite.config.ts	Update build system only
#7	Unit tests – Test new event flows and chess.js integration	Focus on new architecture, not existing game logic
#8	Dev scripts – npm run dev (concurrent client/server), npm run test	Update package.json scripts

Milestone acceptance
	1.	npm run dev shows a chessboard, pieces drag, illegal moves rejected.
	2.	Second browser tab in same room gets echoed moves via Socket.IO.
	3.	Stockfish worker logs CP eval after each move (display optional).

Once Claude Code completes these steps, we’ll layer in the ElevenLabs streaming voice path (Phase 2).

