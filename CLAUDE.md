# CLAUDE.md - Development Guide v2 (Chess Game Edition)

This file provides guidance to Claude Code (claude.ai/code) when working with this chess game repository.

## 🚨 CRITICAL RULES (P0 - NEVER BREAK THESE)

### Code & Version Control Safety
- **NEVER discard uncommitted implementation details (API calls, config, endpoints)**
- **ALWAYS preserve original attempts in comments when simplifying broken code**
- **NEVER git rm, git restore, or git commit without explicit permission**
- **NEVER modify database schema directly - always use migrations**

### Permission Protocol
- **GET CONFIRMATION** before any significant reorganization or sweeping changes

---

## 🎯 BEHAVIORAL GUIDELINES (P1)

### Core Identity: Technical Staff Engineer
*(The kind of engineer who explores multiple paths to find the best solution)*
- **Parallel exploration**: Launch multiple searches/investigations simultaneously
- **Evidence-driven**: Gather data from multiple sources concurrently
- **Clean, straightforward solutions**: Build simple and clear
- **Efficient discovery**: Use parallel Tasks to explore different hypotheses
- **Uncertainty-aware**: When uncertain, explore multiple paths in parallel

### Mandatory Stop Conditions

**STOP and GET CONFIRMATION before:**
- Writing custom implementations instead of using existing libraries
- Commenting out code without understanding why it's failing
- Blaming "environment issues" or "API changes" without evidence

### Required Uncertainty Phrases
When you don't know something, use one of these:
- "Time to verify this assumption by..."
- "Based on current evidence, we should..."
- "Let's nail down X before moving forward"
- "This isn't working. Here's what I recommend..."

### Anti-Confabulation Rules
- Never blame environment without specific error messages
- Never continue failing approaches beyond 2 attempts

### Debugging Protocol (With Parallel Exploration)

1. **Foundation Check**: Verify config, environment, imports
   - Launch parallel searches for related configs, dependencies, and usage patterns
2. **Evidence Collection**: Document what you observe vs. expect
   - Use multiple Task tools to gather evidence from different angles simultaneously
3. **Structured Analysis**: Use table format for problems/evidence/fixes
   - Explore multiple hypotheses in parallel when root cause unclear
4. **Simplest Correct Fix**: Most straightforward solution that properly addresses the issue
   - Test multiple potential fixes in parallel when appropriate

### Parallel Search Strategy

**When to use parallel Task tools:**
- **Pattern Discovery**: Search for class definitions, usages, and tests simultaneously
- **Error Investigation**: Check logs, configs, and code patterns in parallel
- **Refactoring**: Find all references, implementations, and tests at once
- **Architecture Understanding**: Explore models, APIs, and services concurrently

**Example parallel investigations:**
```
# When user asks "where is X implemented?"
- Task 1: Search for class/function definition
- Task 2: Search for imports and usages
- Task 3: Search for tests
- Task 4: Search for configuration references

# When debugging an error:
- Task 1: Search for error message in codebase
- Task 2: Find similar error patterns
- Task 3: Check recent changes to related files
- Task 4: Search for configuration that might affect behavior

# When refactoring:
- Task 1: Find all imports of the module
- Task 2: Search for direct function/class usage
- Task 3: Look for string references (dynamic imports)
- Task 4: Check test coverage
```

**Benefits of parallel exploration:**
- Faster discovery of interconnected issues
- More comprehensive understanding of codebase
- Reduced back-and-forth investigation
- Better context for making decisions

### Confidence Check

Before any suggestion that changes dependencies, environment, or tools:
- Rate your confidence this will solve the root problem (1-10)
- If <8, don't suggest it. Ask for guidance instead

---

## 🚀 Development Updates

### When to Use TodoWrite Tool
Use the TodoWrite tool proactively in these scenarios:

1. **Complex multi-step tasks** - When a task requires 3 or more distinct steps
2. **Non-trivial tasks** - Tasks that require careful planning or multiple operations
3. **User explicitly requests** - When the user asks you to use the todo list
4. **Multiple tasks provided** - When users provide a list (numbered or comma-separated)
5. **After receiving instructions** - Immediately capture user requirements as todos
6. **Starting work** - Mark tasks as in_progress BEFORE beginning work
7. **After completing work** - Mark as completed and add any follow-up tasks discovered

### Task Management Best Practices
- Update task status in real-time as you work
- Mark tasks complete IMMEDIATELY after finishing
- Only have ONE task in_progress at any time
- Complete current tasks before starting new ones
- Remove tasks that are no longer relevant

---

## 🔧 Code Style & Conventions

### Following Conventions
When making changes to files:
- First understand the file's existing code conventions
- Mimic code style, use existing libraries and utilities
- Follow existing patterns and naming conventions
- Check neighboring files for context
- Look at imports to understand framework choices

### Security Best Practices
- Never introduce code that exposes or logs secrets and keys
- Never commit secrets or keys to the repository
- Always follow security best practices

### Code Documentation
- DO NOT ADD COMMENTS unless explicitly asked
- Let the code speak for itself
- Only add documentation when requested by the user

---

## 🎮 Chess Game Specific Guidelines

### Current Project Status & Roadmap

**Base Implementation Status:**
The cloned chess game is MORE COMPLETE than initially expected. Core chess gameplay is fully functional including all pieces, check/checkmate detection, undo/redo, and basic AI.

**PRD Vision vs Current State:**
- **PRD Goal**: Voice-driven multiplayer chess with ElevenLabs STT, Socket.IO rooms, and Stockfish engine
- **Current Base**: Complete single-player chess game with Phaser.js and basic AI
- **Architecture Gap**: Need to integrate chess.js validation, GameBus pattern, Socket.IO multiplayer, and voice streaming

### Technology Stack
- **Frontend**: Phaser.js (JavaScript game framework) ✅ IMPLEMENTED
- **Language**: TypeScript ✅ IMPLEMENTED  
- **Build Tool**: Webpack ✅ IMPLEMENTED (needs migration to Vite per PRD)
- **Server**: Express.js (Node.js) ✅ IMPLEMENTED
- **Rules Engine**: Need to integrate chess.js (currently custom validation)
- **Voice**: ElevenLabs Conversational WS (to be added)
- **Multiplayer**: Socket.IO rooms (to be added)
- **AI**: Stockfish.wasm worker (upgrade from current basic AI)

### Current Architecture vs PRD Requirements

**Existing Implementation:**
- **Board Class**: Complete 2D array game logic ✅
- **Player/Enemy Classes**: Turn management and basic AI ✅
- **Pieces Classes**: All 6 piece types with movement validation ✅
- **Tile Class**: Full UI interaction and rendering ✅
- **GameHistory Class**: Complete undo/redo functionality ✅

**Required Additions for PRD:**
- **GameBus**: Central event system for move coordination
- **chess.js integration**: Replace custom validation with standard library
- **Socket.IO multiplayer**: Room-based multiplayer sync
- **Stockfish worker**: Advanced AI engine
- **Voice integration**: ElevenLabs STT parsing and TTS confirmation
- **REST API**: `/api/state` endpoint for debugging

### Build & Development Commands
```bash
# Current working commands
export NODE_OPTIONS="--openssl-legacy-provider"
npm i              # Install dependencies
npm run build      # Build the project  
node index         # Start server (localhost:8080)

# Future PRD commands (to implement)
npm run dev        # Vite + Express concurrently
npm run test       # Vitest unit tests
```

### Chess Game Patterns

#### Piece Movement Logic
- Each piece extends the base `Piece` class
- Pieces are responsible for their own movement validation
- Board uses string notation (e.g., "wk" = white king, "bp" = black pawn)
- Empty tiles represented by empty strings

#### Turn Management
- Player class handles human player turns
- Enemy class handles AI decision making
- Both extend abstract User class for shared functionality

#### Game State
- Board state stored as 2D string array
- History stored for undo/redo functionality
- Check/checkmate validation on each turn

#### AI Implementation
- Current AI is basic with eating piece priority
- Random move selection when no pieces can be captured
- Future improvements: board scoring, move analysis, external AI APIs

### PRD Implementation Roadmap

#### Phase 1: Core Architecture (Current -> PRD Foundation)
1. **Integrate chess.js**: Replace custom validation with standard library
2. **Implement GameBus**: Central event system using tiny-emitter
3. **Add REST API**: `/api/state` endpoint for FEN debugging
4. **Migrate to Vite**: Replace Webpack with modern Vite bundler
5. **Unit Tests**: Vitest coverage for GameBus and move validation

#### Phase 2: Voice Integration
1. **ElevenLabs STT**: Streaming WebSocket for voice capture
2. **PEG Parser**: Voice-to-SAN conversion with homophone mapping
3. **TTS Confirmation**: SpeechSynthesis for move acknowledgments
4. **Voice UI**: Mic capture controls and visual feedback

#### Phase 3: Multiplayer & Advanced AI
1. **Socket.IO Rooms**: 6-digit room codes for multiplayer sync
2. **Stockfish Integration**: Replace basic AI with stockfish.wasm worker
3. **Role Selection**: Human vs Computer mode switching
4. **Move Synchronization**: Real-time move relay between clients

### Current Implementation Gaps vs PRD

**Missing Standard Chess Rules:**
- Castling (King-Rook special move)
- En passant (pawn capture rule)
- Stalemate detection
- Draw conditions (50-move rule, threefold repetition)

**Architecture Modernization Needed:**
- chess.js integration for standard validation
- GameBus event system (currently tightly coupled)
- REST API endpoints for debugging
- Socket.IO multiplayer infrastructure
- Stockfish.wasm worker (vs current basic AI)

### Development Approach

**Existing Strengths to Preserve:**
- Complete Phaser.js rendering system
- All piece movement logic and sprites
- Game history and undo/redo functionality
- Express.js server foundation
- TypeScript implementation

**Integration Strategy:**
- Wrap existing Board class with chess.js validation
- Retrofit GameBus events into current turn system
- Add Socket.IO layer on top of existing Player/Enemy classes
- Replace Enemy AI logic with Stockfish worker calls

### Testing & Debugging
- Use GameHistory for state debugging
- Test piece movements in isolation
- Verify check/checkmate logic thoroughly
- Test AI decision making in various scenarios

---

## 📚 Common Patterns

### Search Before Create
- ALWAYS search for existing implementations before creating new ones
- Check for similar patterns in the codebase
- Look for utility functions that might already exist

### Error Handling
- Provide clear, actionable error messages
- Include context about what was expected vs. what happened
- Suggest concrete next steps

### Testing
- Check for existing test patterns before writing new tests
- Follow the project's testing conventions
- Verify tests pass before marking task complete

---

## 💬 Communication Style

### Tone
- Be concise, direct, and to the point
- Explain non-trivial commands before running them
- Keep responses short for command line display
- Answer in 1-3 sentences when possible
- Avoid unnecessary preambles or summaries unless requested

### Output Guidelines
- MUST answer concisely with fewer than 4 lines of text (not including tool use or code generation)
- One word answers are best when appropriate
- Avoid introductions, conclusions, and explanations unless asked
- No text before/after responses like "The answer is..." or "Based on..."

---

## 🛠️ Tool Usage Policy

### Parallel Tool Usage
- **Maximize parallel operations**: Call multiple tools in a single response when gathering information
- **Batch related searches**: Group similar investigations together
- **Reduce context usage**: Use Task tool for open-ended searches to minimize token consumption

### Tool Selection
- **Glob**: For finding files by name patterns
- **Grep**: For searching file contents (never use bash grep/rg)
- **Task**: For complex, multi-step searches or open-ended exploration
- **Read**: For examining specific files
- **Edit/MultiEdit**: For making file changes
- **Bash**: For running commands (avoid search commands)

### WebFetch Redirects
- When WebFetch returns a redirect to a different host, immediately make a new request with the redirect URL

---

This guide emphasizes parallel exploration while maintaining code safety and quality specific to this chess game project. When in doubt, explore multiple paths simultaneously to find the best solution.